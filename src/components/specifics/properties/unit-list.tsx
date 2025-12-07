"use client";

import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Unit } from "@/interfaces/unit";
import { ArrowUpDown } from "lucide-react";
import { useEffect } from "react";
import { useInView } from "react-intersection-observer";
import { UnitCard } from "./unit-card";

export type UnitSortOption = "price" | "size" | "floor";
export type UnitSortDirection = "asc" | "desc";

interface UnitListProps {
    units: Unit[];
    onLoadMore: () => void;
    hasNextPage: boolean;
    isLoading: boolean;
    handleGuardedAction: (actionType: "REQUEST_VISIT" | "REQUEST_RESERVATION", unit: Unit) => void;
    sortOption: UnitSortOption;
    onSortChange: (option: UnitSortOption) => void;
    sortDirection: UnitSortDirection;
    onSortDirectionChange: (direction: UnitSortDirection) => void;
}

export function UnitList({
    units,
    onLoadMore,
    hasNextPage,
    isLoading,
    handleGuardedAction,
    sortOption,
    onSortChange,
    sortDirection,
    onSortDirectionChange,
}: UnitListProps) {
    const { ref, inView } = useInView({
        threshold: 0,
    });

    useEffect(() => {
        if (inView && hasNextPage && !isLoading) {
            onLoadMore();
        }
    }, [inView, hasNextPage, isLoading, onLoadMore]);

    const showSortControls = units.length > 0 || isLoading;
    const toggleSortDirection = () => onSortDirectionChange(sortDirection === "asc" ? "desc" : "asc");

    return (
        <div className="space-y-4">
            {showSortControls && (
                <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Ordenar unidades por</p>
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <Select value={sortOption} onValueChange={value => onSortChange(value as UnitSortOption)}>
                            <SelectTrigger className="w-full sm:w-60 cursor-pointer">
                                <SelectValue placeholder="Ordenar por" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem className="cursor-pointer" value="price">Preço</SelectItem>
                                <SelectItem className="cursor-pointer" value="size">Tamanho</SelectItem>
                                <SelectItem className="cursor-pointer" value="floor">Andar</SelectItem>
                            </SelectContent>
                        </Select>
                        <Button
                            variant="outline"
                            size="sm"
                            className="w-full sm:w-auto cursor-pointer"
                            onClick={toggleSortDirection}
                        >
                            <ArrowUpDown className="mr-2 h-4 w-4" />
                            {sortDirection === "asc" ? "Crescente" : "Decrescente"}
                        </Button>
                    </div>
                </div>
            )}
            {units.map(unit => (
                <UnitCard key={unit.id} unit={unit} handleGuardedAction={handleGuardedAction} />
            ))}
            {isLoading && Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-48 w-full" />)}
            <div ref={ref} />
        </div>
    );
}
