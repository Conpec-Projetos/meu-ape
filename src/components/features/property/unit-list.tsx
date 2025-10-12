"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { Unit } from "@/interfaces/unit";
import { useEffect } from "react";
import { useInView } from "react-intersection-observer";
import { UnitCard } from "./unit-card";
import { Property } from "@/interfaces/property";

interface UnitListProps {
    units: Unit[];
    property: Property;
    onLoadMore: () => void;
    hasNextPage: boolean;
    isLoading: boolean;
    onViewMatterport: (url: string) => void;
}

export function UnitList({ units, onLoadMore, hasNextPage, isLoading, property }: UnitListProps) {
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
            {units.map(unit => (
                <UnitCard key={unit.id} unit={unit} property={property} />
            ))}
            {isLoading && Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-48 w-full" />)}
            <div ref={ref} />
        </div>
    );
}
