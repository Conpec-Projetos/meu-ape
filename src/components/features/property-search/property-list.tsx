"use client";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Property } from "@/interfaces/property";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { PropertyCard } from "./property-card";

export function PropertyList({ properties, isLoading }: { properties: Property[]; isLoading: boolean }) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const page = Number(searchParams.get("page")) || 1;
    // Assuming API would tell us if there's a next page
    const hasNextPage = properties.length > 0;

    const handlePageChange = (newPage: number) => {
        const params = new URLSearchParams(searchParams.toString());
        params.set("page", String(newPage));
        router.push(`${pathname}?${params.toString()}`);
    };

    return (
        <div className="h-full flex flex-col">
            <div className="flex-grow overflow-y-auto p-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-4">
                    {isLoading
                        ? Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-[350px] w-full" />)
                        : properties.map(prop => <PropertyCard key={prop.id} property={prop} />)}
                </div>
            </div>
            <div className="p-4 border-t flex justify-center items-center gap-4">
                <Button variant="outline" disabled={page <= 1} onClick={() => handlePageChange(page - 1)}>
                    Anterior
                </Button>
                <span>Página {page}</span>
                <Button variant="outline" disabled={!hasNextPage} onClick={() => handlePageChange(page + 1)}>
                    Próximo
                </Button>
            </div>
        </div>
    );
}