"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { Unit } from "@/interfaces/unit";
import { useEffect } from "react";
import { useInView } from "react-intersection-observer";
import { UnitCard } from "./unit-card";

interface UnitListProps {
    units: Unit[];
    onLoadMore: () => void;
    hasNextPage: boolean;
    isLoading: boolean;
    handleGuardedAction: (actionType: "REQUEST_VISIT" | "REQUEST_RESERVATION", unit: Unit) => void;
}

export function UnitList({ units, onLoadMore, hasNextPage, isLoading, handleGuardedAction }: UnitListProps) {
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
                <UnitCard key={unit.id} unit={unit} handleGuardedAction={handleGuardedAction} />
            ))}
            {isLoading && Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-48 w-full" />)}
            <div ref={ref} />
        </div>
    );
}
