"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { buttonVariants } from "./ui/button";
import { Suspense } from "react";

interface CoffeeTableProps {
  data: any[];
  totalCount: number | null;
  currentPage: number;
  pageSize: number;
}

function CoffeeTableInner({
  data,
  totalCount,
  currentPage,
  pageSize,
}: CoffeeTableProps) {
  const searchParams = useSearchParams();

  const totalPages = totalCount ? Math.ceil(totalCount / pageSize) : 1;

  const getPageUrl = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", page.toString());
    return `/coffee?${params.toString()}`;
  };

  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Edad</TableHead>
              <TableHead>Género</TableHead>
              <TableHead>País</TableHead>
              <TableHead>Calidad de Sueño</TableHead>
              <TableHead>Café (Tazas)</TableHead>
              <TableHead>Estrés</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center h-24">
                  No se encontraron resultados. Intenta con otros filtros.
                </TableCell>
              </TableRow>
            ) : (
              data.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="font-medium">{row.id}</TableCell>
                  <TableCell>{row.age}</TableCell>
                  <TableCell>{row.gender}</TableCell>
                  <TableCell>{row.country}</TableCell>
                  <TableCell>{row.sleep_quality}</TableCell>
                  <TableCell>{row.coffee_intake}</TableCell>
                  <TableCell>{row.stress_level}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          Mostrando {data.length} resultados de{" "}
          {totalCount !== null ? totalCount : 0} totales.
        </div>
        <div className="flex items-center space-x-2">
          {currentPage > 1 ? (
            <Link
              href={getPageUrl(currentPage - 1)}
              className={buttonVariants({ variant: "outline", size: "sm" })}
            >
              Anterior
            </Link>
          ) : (
            <span
              className={buttonVariants({
                variant: "outline",
                size: "sm",
                className: "opacity-50 cursor-not-allowed",
              })}
            >
              Anterior
            </span>
          )}

          <div className="text-sm font-medium">
            Página {currentPage} de {totalPages || 1}
          </div>

          {currentPage < totalPages ? (
            <Link
              href={getPageUrl(currentPage + 1)}
              className={buttonVariants({ variant: "outline", size: "sm" })}
            >
              Siguiente
            </Link>
          ) : (
            <span
              className={buttonVariants({
                variant: "outline",
                size: "sm",
                className: "opacity-50 cursor-not-allowed",
              })}
            >
              Siguiente
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export function CoffeeTable(props: CoffeeTableProps) {
  return (
    <Suspense
      fallback={
        <div className="h-96 bg-card rounded-lg border animate-pulse" />
      }
    >
      <CoffeeTableInner {...props} />
    </Suspense>
  );
}
