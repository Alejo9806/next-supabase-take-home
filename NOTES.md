# NOTES.md — Decisiones Técnicas y de Diseño

Documentación de todas las decisiones de diseño e implementación tomadas durante la resolución de la prueba técnica de Medallo.dev.

---

## Tabla de Contenidos

- [NOTES.md — Decisiones Técnicas y de Diseño](#notesmd--decisiones-técnicas-y-de-diseño)
  - [Tabla de Contenidos](#tabla-de-contenidos)
  - [Parte 1 — Diseño del Esquema de Base de Datos](#parte-1--diseño-del-esquema-de-base-de-datos)
    - [Tipos de datos elegidos](#tipos-de-datos-elegidos)
    - [Uso de ENUM en vez de TEXT](#uso-de-enum-en-vez-de-text)
    - [Uso de BOOLEAN en vez de INTEGER](#uso-de-boolean-en-vez-de-integer)
    - [Índices para Escala](#índices-para-escala)
    - [Row Level Security (RLS)](#row-level-security-rls)
  - [Parte 1 — Estrategia de Carga de Datos](#parte-1--estrategia-de-carga-de-datos)
    - [Por qué no se usa `COPY FROM`](#por-qué-no-se-usa-copy-from)
    - [Por qué no usamos la API de Supabase directamente](#por-qué-no-usamos-la-api-de-supabase-directamente)
    - [Solución elegida: CSV → seed.sql](#solución-elegida-csv--seedsql)
  - [Parte 2 — Arquitectura del Frontend](#parte-2--arquitectura-del-frontend)
    - [Server Components vs Client Components](#server-components-vs-client-components)
    - [Estado en la URL vs `useState`](#estado-en-la-url-vs-usestate)
    - [Paginación por Offset vs Cursor](#paginación-por-offset-vs-cursor)

---

## Parte 1 — Diseño del Esquema de Base de Datos

### Tipos de datos elegidos

El CSV de origen contiene columnas con distintas naturalezas. La decisión de qué tipo de dato SQL asignarle a cada columna busca tres objetivos: **integridad de los datos**, **menor footprint de almacenamiento** y **rendimiento en consultas filtradas**.

| Columna CSV | Tipo SQL Elegido | Razonamiento |
|---|---|---|
| `id` | `INTEGER PRIMARY KEY` | Clave primaria numérica, sin `SERIAL` porque los IDs ya vienen en el CSV. |
| `age` | `SMALLINT` | La edad cabe en 2 bytes (rango −32,768 a 32,767). `INTEGER` desperdiciaría el doble de espacio. |
| `gender` | `public.gender_type` (ENUM) | Columna categórica con valores fijos. Ver sección ENUM. |
| `country` | `TEXT` | El CSV contiene muchos países distintos y es un campo libre, por lo que no aplica ENUM. |
| `coffee_intake` | `NUMERIC(4,1)` | Valor decimal que representa tazas de café. Precisión fija para evitar errores de punto flotante. |
| `caffeine_mg` | `NUMERIC(6,1)` | Miligramos de cafeína, puede llegar a valores de 4 dígitos. |
| `sleep_hours` | `NUMERIC(3,1)` | Horas de sueño con un decimal de precisión. |
| `sleep_quality` | `public.sleep_quality_type` (ENUM) | Valores categóricos fijos. Ver sección ENUM. |
| `bmi` | `NUMERIC(4,1)` | Índice de masa corporal con un decimal. |
| `heart_rate` | `SMALLINT` | Frecuencia cardíaca, siempre positiva y cabe en 2 bytes. |
| `stress_level` | `public.stress_level_type` (ENUM) | Valores categóricos fijos. Ver sección ENUM. |
| `physical_activity_hours` | `NUMERIC(3,1)` | Horas de actividad física semanal. |
| `health_issues` | `public.health_issues_type` (ENUM) | Valores categóricos fijos. Ver sección ENUM. |
| `occupation` | `public.occupation_type` (ENUM) | Valores categóricos fijos. Ver sección ENUM. |
| `smoking` | `BOOLEAN` | El CSV almacena 0/1. Se transforma a `true/false` para expresar semánticamente lo que significa. |
| `alcohol_consumption` | `BOOLEAN` | Igual que `smoking`. |

---

### Uso de ENUM en vez de TEXT

**Decisión:** Todas las columnas con un conjunto cerrado y predecible de valores posibles se definieron como tipos `ENUM` personalizados de PostgreSQL en lugar de `TEXT`.

```sql
CREATE TYPE public.gender_type       AS ENUM ('Male', 'Female', 'Other');
CREATE TYPE public.sleep_quality_type AS ENUM ('Poor', 'Fair', 'Good', 'Excellent');
CREATE TYPE public.stress_level_type  AS ENUM ('Low', 'Medium', 'High');
CREATE TYPE public.health_issues_type AS ENUM ('None', 'Mild', 'Moderate', 'Severe');
CREATE TYPE public.occupation_type    AS ENUM ('Healthcare', 'Office', 'Other', 'Service', 'Student');
```

**¿Por qué?**

- **Integridad de datos:** PostgreSQL rechaza automáticamente cualquier valor que no pertenezca al ENUM. Hace imposible insertar un dato inválido como `"male"` (en minúscula) o `"Pooor"` con error de tipeo.
- **Almacenamiento más eficiente:** Internamente, PostgreSQL almacena los ENUMs como enteros de 4 bytes (un `OID`), no como cadenas de texto variables. Esto significa que `'Excellent'` ocupa 4 bytes, no 9.
- **Comparaciones más rápidas:** Al comparar enteros en lugar de cadenas de texto en los `WHERE` e índices, el motor de Postgres ejecuta las queries más rápidamente, especialmente a escala de millones de filas.

**¿Cuándo NO usaría ENUM?**

- Cuando el conjunto de valores puede crecer o cambiar con el tiempo (ej. agregar una categoría nueva a `occupation`). En ese caso, alterar un tipo ENUM en producción requiere migraciones con bloqueo de tabla (`ALTER TYPE ... ADD VALUE`), lo que puede ser peligroso en producción con muchos usuarios activos.
- En ese escenario, una tabla de referencia (`occupation` como tabla separada con FK) sería más flexible, aunque a costa de un JOIN extra en las consultas.

---

### Uso de BOOLEAN en vez de INTEGER

**Decisión:** Las columnas `smoking` y `alcohol_consumption` vienen en el CSV como `0` o `1`, pero se definieron como `BOOLEAN` en la base de datos.

**¿Por qué?**

- **Semántica clara:** `smoking = true` comunica el significado mucho mejor que `smoking = 1`. El código de la aplicación y los analistas de datos que lean el esquema entenderán la intención de inmediato.
- **Ahorro de espacio:** Un `BOOLEAN` en PostgreSQL ocupa 1 byte, mientras que un `INTEGER` ocupa 4 bytes. Con 10,000 filas y dos columnas, esto ahorra 60,000 bytes (≈60 KB). A escala de millones de filas, el ahorro es significativo.
- **Queries más expresivas:** Las consultas con `WHERE smoking = true` son más legibles que `WHERE smoking = 1`.

**Consecuencia:** El script de carga de datos tuvo que transformar los valores del CSV antes de insertarlos:
```javascript
const smoking = cols[14] === '1' ? 'true' : 'false';
```
Esto no fue un costo extra, sino parte de la lógica de limpieza de datos que el script de generación de seed ya realizaba.

---

### Índices para Escala

**Decisión:** Se crearon índices B-tree en todas las columnas que serán usadas como filtros en la interfaz de usuario.

```sql
CREATE INDEX idx_coffee_health_country       ON public.coffee_health (country);
CREATE INDEX idx_coffee_health_gender        ON public.coffee_health (gender);
CREATE INDEX idx_coffee_health_sleep_quality ON public.coffee_health (sleep_quality);
CREATE INDEX idx_coffee_health_stress_level  ON public.coffee_health (stress_level);
CREATE INDEX idx_coffee_health_age           ON public.coffee_health (age);
CREATE INDEX idx_coffee_health_bmi           ON public.coffee_health (bmi);
CREATE INDEX idx_coffee_health_coffee_intake ON public.coffee_health (coffee_intake);
```

**¿Por qué?**

Sin índices, cada filtro (`WHERE country = 'Brazil'`) obliga a PostgreSQL a realizar un **Sequential Scan**: leer fila por fila toda la tabla hasta encontrar todas las coincidencias. Con 10,000 filas esto es tolerable, pero con 1 millón de filas la consulta puede tardar segundos. Con el índice B-tree, PostgreSQL hace un **Index Scan**: navega una estructura de árbol en O(log n) pasos, encontrando los registros en milisegundos independientemente del tamaño de la tabla.

**¿Cuándo se vuelve más complejo?**

A escala de decenas de millones de filas con filtros múltiples simultáneos (ej. `country = 'Brazil' AND sleep_quality = 'Good' AND age BETWEEN 25 AND 40`), los índices de una sola columna son menos eficientes porque PostgreSQL tiene que combinar múltiples índices. En ese caso, se considerarían **índices compuestos** sobre las combinaciones de filtros más frecuentes.

---

### Row Level Security (RLS)

**Decisión:** Se habilitó RLS en la tabla y se creó una política permisiva de lectura pública.

```sql
ALTER TABLE public.coffee_health ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access"
  ON public.coffee_health
  AS PERMISSIVE
  FOR SELECT
  TO public
  USING (true);
```

**¿Por qué?**

En Supabase, si una tabla tiene RLS **deshabilitado**, cualquier llamada anónima desde el frontend puede leer, escribir o borrar datos sin restricción. Habilitar RLS con una política de solo lectura (`FOR SELECT`) sigue el principio de mínimo privilegio: la aplicación puede consultar los datos, pero nadie puede insertarlos ni modificarlos desde el cliente sin un token de `service_role`.

---

## Parte 1 — Estrategia de Carga de Datos

Para importar los 10,000 registros del CSV a la base de datos, se evaluaron tres enfoques.

### Por qué no se usa `COPY FROM`

```sql
-- Enfoque rechazado
COPY public.coffee_health FROM '/ruta/al/archivo.csv' DELIMITER ',' CSV HEADER;
```

**Razón principal — Docker:** Supabase local corre dentro de un contenedor de Docker. El comando `COPY FROM '/ruta'` le pide al servidor de PostgreSQL que abra un archivo en **su propio sistema de archivos** (dentro del contenedor), no en el del desarrollador. Por defecto, la CLI de Supabase no monta la carpeta `data/` como un volumen en el contenedor, por lo que el servidor no puede encontrar el CSV y lanza `ERROR: could not open file "/ruta": No such file or directory`.

**Razón secundaria — Transformaciones de tipo:** El CSV almacena `0` y `1` para las columnas booleanas, pero nuestra tabla espera `true/false`. El comando `COPY` de PostgreSQL es muy estricto con los tipos y puede fallar o insertar datos incorrectos sin las transformaciones previas que realizamos en el script de Node.js.

**¿Cuándo SÍ usaríamos `COPY`?** Si tuviéramos acceso directo al servidor de PostgreSQL (no dentro de Docker sin configuración extra) o si pudiéramos montar el CSV como un volumen en el contenedor. También existe `\copy` (con barra invertida) en el cliente `psql`, que lee desde la máquina local y transfiere al servidor por la conexión TCP, pero no funciona dentro de un archivo `seed.sql` ejecutado por la CLI de Supabase.

---

### Por qué no usamos la API de Supabase directamente

```javascript
// Enfoque rechazado para 10,000 filas
await supabase.from('coffee_health').insert(allRows);
```

**Razones:**
- **Límites de la API:** La API REST de Supabase tiene un límite de payload por defecto. Un `INSERT` de 10,000 filas en una sola llamada puede superar ese límite.
- **Atomicidad cuestionable:** Si se hace en lotes, una red inestable podría dejar la base de datos parcialmente cargada (ej. 3,000 de 10,000 filas).
- **Dependencia de red en seeding:** Los archivos de seed deben poder ejecutarse de forma completamente offline, sin depender de que la API HTTP esté disponible.

**¿Cuándo SÍ usaríamos la API?** Para importaciones incrementales desde una interfaz de usuario (ej. el usuario sube un nuevo CSV con 500 registros) o para actualizaciones en tiempo real donde se necesita la lógica de negocio de la aplicación (validaciones, triggers de Auth, etc.).

---

### Solución elegida: CSV → seed.sql

**Decisión:** Se creó un script de Node.js (`scripts/generate-seed.js`) que lee el CSV línea a línea y genera un único `INSERT` masivo que se añade a `supabase/seed.sql`.

```javascript
// Fragmento del script generate-seed.js
const smoking = cols[14] === '1' ? 'true' : 'false';
const alcohol = cols[15] === '1' ? 'true' : 'false';

const valueStr = `(${id}, ${age}, '${gender}', '${country}', ...)`;
sql += valueStr; // Acumula todos los VALUES en memoria
```

El resultado final en `seed.sql` es un único `INSERT INTO ... VALUES (...), (...), ...` con las 10,000 filas, que PostgreSQL ejecuta en una única transacción atómica.

**Ventajas de este enfoque:**
- **Reproducibilidad total:** Ejecutar `supabase db reset` siempre deja la base de datos en el mismo estado limpio y conocido, con todos los datos cargados. Ideal para entornos de desarrollo en equipo.
- **Atomicidad real:** Si el INSERT falla a mitad (ej. un valor inválido), toda la operación se revierte. La base queda vacía, no a medias.
- **Sin dependencia de red ni Docker volumes:** El `seed.sql` es un archivo SQL plano que la CLI de Supabase ya sabe cómo ejecutar, sin configuración extra.
- **Transformaciones de datos:** El script de Node.js puede limpiar, transformar y validar datos antes de generar el SQL, algo imposible con `COPY FROM`.

---

## Parte 2 — Arquitectura del Frontend

### Server Components vs Client Components

**Decisión:** La lógica de fetching de datos vive en `app/coffee/page.tsx` como un **React Server Component (RSC)**.

```typescript
// app/coffee/page.tsx — Server Component asíncrono
export default async function CoffeePage(props) {
  const searchParams = await props.searchParams; // Lee los filtros de la URL en el servidor
  const supabase = await createClient();          // Conexión segura en el backend
  const { data, count } = await query.range(from, to);
  // ...renderiza HTML con datos reales
}
```

**¿Por qué?**

- **Seguridad:** Las credenciales de Supabase (`SUPABASE_SERVICE_ROLE_KEY`) nunca salen del servidor. El navegador del usuario nunca las ve.
- **Rendimiento inicial (FCP):** El servidor ejecuta la query a PostgreSQL y envía HTML con datos reales directamente al navegador. El usuario no ve un estado de "cargando" en la primera visita.
- **Reducción de JavaScript:** Los Server Components no añaden nada al bundle de JavaScript del cliente. La tabla de datos con 50 filas se renderiza en el servidor, no en el navegador.
- **Escala:** Si hubiera 5 millones de filas, el filtrado y la paginación ocurren en PostgreSQL (donde está el índice B-tree), no en la memoria del navegador del usuario.

Los componentes `CoffeeFilters` y `CoffeeTable` sí son **Client Components** (`"use client"`) porque necesitan interactividad (manejar eventos `onChange`, leer el estado de la URL con `useSearchParams`).

---

### Estado en la URL vs `useState`

**Decisión:** Los valores de los filtros activos (país, edad mínima, edad máxima, calidad de sueño) y el número de página actual se almacenan como **URL Search Params**, no en variables de estado de React.

```
http://localhost:3000/coffee?country=Germany&sleepQuality=Good&page=3
```

**¿Por qué?**

- **URLs compartibles:** Un analista puede copiar la URL con los filtros aplicados y enviársela a un colega, quien verá exactamente los mismos resultados.
- **Historial de navegación funcional:** Los botones Atrás/Adelante del navegador navegan entre diferentes estados de filtros de forma natural.
- **Sin estado fantasma:** Al refrescar la página, los filtros se mantienen porque están en la URL, no en la memoria de React que se borra en cada recarga.
- **El Server Component puede leer los parámetros directamente:** El RSC en `page.tsx` lee `props.searchParams` y construye la query a Supabase sin necesidad de ninguna llamada de API extra desde el cliente.

---

### Paginación por Offset vs Cursor

**Decisión:** Se usó paginación clásica basada en **Offset/Limit** usando el método `.range(from, to)` de Supabase.

```typescript
const from = (page - 1) * pageSize;  // ej. página 3: from = 100
const to   = from + pageSize - 1;    // to = 149

const { data, count } = await supabase
  .from('coffee_health')
  .select('*', { count: 'exact' })
  .range(from, to);
```

Internamente, Supabase traduce `.range(100, 149)` a `LIMIT 50 OFFSET 100` en PostgreSQL.

**¿Por qué es suficiente para este caso?**

Con 10,000 registros, incluso `OFFSET 9950` (la última página) es prácticamente instantáneo. La penalización de rendimiento del OFFSET se siente a partir de tablas de millones de filas con offsets de cientos de miles.

**¿Cuándo fallaría a gran escala?**

Si la tabla tuviera 10 millones de filas y el usuario pudiera ir a la página 50,000 (`OFFSET 2,500,000`), PostgreSQL tendría que leer y descartar 2.5 millones de filas antes de devolver las 50 correctas. Esto puede tardar varios segundos incluso con índices.

**La alternativa: Keyset Pagination (Paginación por Cursor)**

En lugar de `OFFSET N`, se consulta basándose en el último valor visto:
```sql
-- En vez de OFFSET 2500000...
SELECT * FROM coffee_health
WHERE id > 2500000   -- El "cursor" es el último ID visto
ORDER BY id ASC
LIMIT 50;
```
Este enfoque tiene rendimiento `O(log n)` constante sin importar qué página se solicite. La desventaja es que no permite saltar a una página arbitraria (ej. "ir a la página 87"), solo "siguiente" y "anterior".

---

