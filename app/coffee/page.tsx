import { createClient } from "@/lib/supabase/server";
import { CoffeeTable } from "@/components/coffee-table";
import { CoffeeFilters } from "@/components/coffee-filters";

// Fix for Next.js 15 searchParams behavior where they need to be resolved
export default async function CoffeePage(props: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const searchParams = await props.searchParams;

  const supabase = await createClient();

  // Parsear los filtros que vienen de la URL
  const country =
    typeof searchParams.country === "string" ? searchParams.country : null;
  const minAge =
    typeof searchParams.minAge === "string"
      ? parseInt(searchParams.minAge)
      : null;
  const maxAge =
    typeof searchParams.maxAge === "string"
      ? parseInt(searchParams.maxAge)
      : null;
  const sleepQuality =
    typeof searchParams.sleepQuality === "string"
      ? searchParams.sleepQuality
      : null;

  // Lógica de paginación
  const page =
    typeof searchParams.page === "string" ? parseInt(searchParams.page) : 1;
  const pageSize = 50;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  // Construir la consulta a Supabase dinámicamente
  let query = supabase.from("coffee_health").select("*", { count: "exact" });

  if (country) {
    // Uso de ilike para ignorar mayúsculas/minúsculas en el texto
    query = query.ilike("country", `%${country}%`);
  }
  if (minAge) {
    query = query.gte("age", minAge);
  }
  if (maxAge) {
    query = query.lte("age", maxAge);
  }
  if (sleepQuality) {
    query = query.eq("sleep_quality", sleepQuality);
  }

  // Aplicar ordenamiento y paginación (offset/limit)
  const { data, count, error } = await query
    .order("id", { ascending: true })
    .range(from, to);

  if (error) {
    console.error("Error consultando Supabase:", error);
  }

  return (
    <main className="min-h-screen bg-background p-6 md:p-10">
      <div className="mx-auto max-w-6xl space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Datos de Consumo de Café
          </h1>
          <p className="text-muted-foreground mt-2">
            Vista filtrable de 10,000 registros sintéticos optimizada con Server
            Components y Supabase.
          </p>
        </div>

        <CoffeeFilters />

        <CoffeeTable
          data={data || []}
          totalCount={count}
          currentPage={page}
          pageSize={pageSize}
        />
      </div>
    </main>
  );
}
