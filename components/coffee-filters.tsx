"use client";

import { useRouter } from "next/navigation";
import { useSearchParams } from "next/navigation";
import { Suspense, useCallback, useState } from "react";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Button } from "./ui/button";

function CoffeeFiltersInner() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [country, setCountry] = useState(searchParams.get("country") || "");
  const [minAge, setMinAge] = useState(searchParams.get("minAge") || "");
  const [maxAge, setMaxAge] = useState(searchParams.get("maxAge") || "");
  const [sleepQuality, setSleepQuality] = useState(
    searchParams.get("sleepQuality") || "",
  );

  const applyFilters = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString());

    if (country) params.set("country", country);
    else params.delete("country");

    if (minAge) params.set("minAge", minAge);
    else params.delete("minAge");

    if (maxAge) params.set("maxAge", maxAge);
    else params.delete("maxAge");

    if (sleepQuality) params.set("sleepQuality", sleepQuality);
    else params.delete("sleepQuality");

    params.delete("page");

    router.push(`/coffee?${params.toString()}`);
    router.refresh();
  }, [country, minAge, maxAge, sleepQuality, searchParams, router]);

  const clearFilters = useCallback(() => {
    setCountry("");
    setMinAge("");
    setMaxAge("");
    setSleepQuality("");
    window.location.assign("/coffee");
  }, []);

  return (
    <div className="bg-card p-6 rounded-lg border flex flex-col md:flex-row gap-4 items-end mb-6">
      <div className="space-y-2 flex-1">
        <Label htmlFor="country">País</Label>
        <Input
          id="country"
          placeholder="ej. Germany"
          value={country}
          onChange={(e) => setCountry(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && applyFilters()}
        />
      </div>
      <div className="space-y-2 flex-1">
        <Label htmlFor="minAge">Edad Mínima</Label>
        <Input
          id="minAge"
          type="number"
          placeholder="18"
          value={minAge}
          onChange={(e) => setMinAge(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && applyFilters()}
        />
      </div>
      <div className="space-y-2 flex-1">
        <Label htmlFor="maxAge">Edad Máxima</Label>
        <Input
          id="maxAge"
          type="number"
          placeholder="100"
          value={maxAge}
          onChange={(e) => setMaxAge(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && applyFilters()}
        />
      </div>
      <div className="space-y-2 flex-1">
        <Label htmlFor="sleepQuality">Calidad de Sueño</Label>
        <select
          id="sleepQuality"
          className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          value={sleepQuality}
          onChange={(e) => setSleepQuality(e.target.value)}
        >
          <option value="">Cualquiera</option>
          <option value="Poor">Poor</option>
          <option value="Fair">Fair</option>
          <option value="Good">Good</option>
          <option value="Excellent">Excellent</option>
        </select>
      </div>

      <div className="flex gap-2">
        <Button type="button" variant={"outline"} onClick={clearFilters}>
          Limpiar
        </Button>
        <Button type="button" onClick={applyFilters}>
          Filtrar
        </Button>
      </div>
    </div>
  );
}

export function CoffeeFilters() {
  return (
    <Suspense
      fallback={
        <div className="h-24 bg-card rounded-lg border animate-pulse" />
      }
    >
      <CoffeeFiltersInner />
    </Suspense>
  );
}
