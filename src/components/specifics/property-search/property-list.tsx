"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { Property } from "@/interfaces/property";
import { PropertyCard } from "./property-card";

interface PropertyListProps {
    properties: Property[];
    isLoading: boolean;
    innerRef?: (node?: Element | null) => void;
}

export function PropertyList({ properties, isLoading, innerRef }: PropertyListProps) {
    return (
        <div className="h-full flex flex-col">
            <div className="grow overflow-y-auto p-4">
                <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))" }}>
                    {isLoading
                        ? Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-[350px] w-full" />)
                        : properties.map((prop, index) => (
                              <div key={prop.id} ref={properties.length === index + 1 ? innerRef : null}>
                                  <PropertyCard property={prop} />
                              </div>
                          ))}
                </div>
            </div>
        </div>
    );
}
