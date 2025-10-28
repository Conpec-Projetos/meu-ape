"use client";

import { Input } from "@/components/ui/input";
import { Search as SearchIcon } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import React, { useCallback, useState } from "react";
import { FiltersModal } from "./filters-modal";

export function SearchBar() {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const [query, setQuery] = useState(searchParams.get("q") || "");

    const createQueryString = useCallback(
        (name: string, value: string) => {
            const params = new URLSearchParams(searchParams.toString());
            if (value) {
                params.set(name, value);
            } else {
                params.delete(name);
            }
            return params.toString();
        },
        [searchParams]
    );

    const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        router.push(`${pathname}?${createQueryString("q", query)}`);
    };

    return (
        <div className="flex items-center gap-2 p-4 bg-background border-b">
            <form onSubmit={handleSearch} className="relative flex-grow">
                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                    placeholder="Buscar por cidade, bairro ou empreendimento..."
                    className="pl-10 h-12 text-base"
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                />
            </form>
            <FiltersModal />
        </div>
    );
}