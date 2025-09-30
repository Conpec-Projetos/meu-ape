
"use client";

import { useEffect } from "react";
import { useInView } from "react-intersection-observer";
import { Unit } from "@/interfaces/unit";
import { UnitCard } from "./unit-card";
import { Skeleton } from "@/components/ui/skeleton";

interface UnitListProps {
  units: Unit[];
  onLoadMore: () => void;
  hasNextPage: boolean;
  isLoading: boolean;
  onViewMatterport: (url: string) => void;
}

export function UnitList({
  units,
  onLoadMore,
  hasNextPage,
  isLoading,
  onViewMatterport,
}: UnitListProps) {
  const { ref, inView } = useInView({
    threshold: 0,
  });

  useEffect(() => {
    if (inView && hasNextPage && !isLoading) {
      onLoadMore();
    }
  }, [inView, hasNextPage, isLoading, onLoadMore]);

  return (
    <div className="space-y-4">
      {units.map((unit) => (
        <UnitCard key={unit.id} unit={unit} onViewMatterport={onViewMatterport} />
      ))}
      {isLoading && Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-48 w-full" />)}
      <div ref={ref} />
    </div>
  );
}
