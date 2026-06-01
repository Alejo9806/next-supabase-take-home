import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-6 py-10">
        <header className="space-y-2 flex justify-between items-center">
          <h1 className="text-3xl font-semibold tracking-tight">Medallo.dev</h1>
          <Link href="/coffee" className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2">
            Ver Tabla de Café
          </Link>
        </header>

        <section className="grid gap-6 lg:grid-cols-2">
          <article className="space-y-3 rounded-lg border bg-card p-6 text-card-foreground">
            <h2 className="text-lg font-medium">Instructions (English)</h2>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Welcome to the Medallo.dev take-home exercise. For full setup steps,
              system requirements, and the complete exercise brief, read{" "}
              <code className="rounded bg-muted px-1.5 py-0.5 text-foreground">
                README.md
              </code>{" "}
              in the project root.
            </p>
            <ul className="list-disc space-y-2 pl-5 text-sm leading-relaxed text-muted-foreground">
              <li>
                Run <code className="rounded bg-muted px-1.5 py-0.5">pnpm install</code>{" "}
                and <code className="rounded bg-muted px-1.5 py-0.5">pnpm setup:env</code>{" "}
                before starting development.
              </li>
              <li>
                Start the app with{" "}
                <code className="rounded bg-muted px-1.5 py-0.5">pnpm dev</code>, then
                open{" "}
                <a
                  className="font-medium text-foreground underline underline-offset-4"
                  href="http://localhost:3000"
                >
                  http://localhost:3000
                </a>
                .
              </li>
              <li>
                The exercise uses{" "}
                <code className="rounded bg-muted px-1.5 py-0.5">
                  data/synthetic_coffee_health_10000.csv
                </code>{" "}
                (10,000 rows of synthetic health and coffee consumption data).
              </li>
              <li>
                Your task is to load this dataset into Supabase and build a
                filterable table. See the Exercise section in{" "}
                <code className="rounded bg-muted px-1.5 py-0.5">README.md</code>.
              </li>
            </ul>
          </article>

          <article className="space-y-3 rounded-lg border bg-card p-6 text-card-foreground">
            <h2 className="text-lg font-medium">Instrucciones (Español)</h2>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Bienvenido al ejercicio take-home de Medallo.dev. Para los pasos
              completos de configuración, requisitos del sistema y el enunciado
              del ejercicio, consulta{" "}
              <code className="rounded bg-muted px-1.5 py-0.5 text-foreground">
                README.md
              </code>{" "}
              en la raíz del proyecto.
            </p>
            <ul className="list-disc space-y-2 pl-5 text-sm leading-relaxed text-muted-foreground">
              <li>
                Ejecuta{" "}
                <code className="rounded bg-muted px-1.5 py-0.5">pnpm install</code>{" "}
                y <code className="rounded bg-muted px-1.5 py-0.5">pnpm setup:env</code>{" "}
                antes de comenzar el desarrollo.
              </li>
              <li>
                Inicia la aplicación con{" "}
                <code className="rounded bg-muted px-1.5 py-0.5">pnpm dev</code> y
                abre{" "}
                <a
                  className="font-medium text-foreground underline underline-offset-4"
                  href="http://localhost:3000"
                >
                  http://localhost:3000
                </a>
                .
              </li>
              <li>
                El ejercicio utiliza{" "}
                <code className="rounded bg-muted px-1.5 py-0.5">
                  data/synthetic_coffee_health_10000.csv
                </code>{" "}
                (10,000 filas de datos sintéticos sobre salud y consumo de café).
              </li>
              <li>
                Tu tarea es cargar este conjunto de datos en Supabase y
                construir una tabla con filtros. Consulta la sección Ejercicio
                en{" "}
                <code className="rounded bg-muted px-1.5 py-0.5">README.md</code>.
              </li>
            </ul>
          </article>
        </section>
      </div>
    </main>
  );
}
