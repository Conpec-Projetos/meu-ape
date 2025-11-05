"use client";

import { Input } from "@/components/ui/input";
import { useMapsLibrary } from "@vis.gl/react-google-maps";
import { Search as SearchIcon } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FiltersModal } from "./filters-modal";

type Prediction = { description: string; place_id: string };

export function SearchBar() {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const [query, setQuery] = useState(searchParams.get("q") || "");
    const [predictions, setPredictions] = useState<Prediction[]>([]);
    const [open, setOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement | null>(null);

    // Load Places library
    const placesLib = useMapsLibrary("places");
    const autocompleteService = useMemo(() => {
        if (!placesLib || !google?.maps?.places?.AutocompleteService) return null;
        return new google.maps.places.AutocompleteService();
    }, [placesLib]);

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
        setOpen(false);
    };

    // Debounced autocomplete
    useEffect(() => {
        if (!autocompleteService) return;
        const term = query.trim();
        if (term.length < 3) {
            setPredictions([]);
            setOpen(false);
            return;
        }
        const controller = new AbortController();
        const timeout = setTimeout(() => {
            autocompleteService.getPlacePredictions(
                {
                    input: term,
                    componentRestrictions: { country: "br" },
                },
                (result, status) => {
                    if (controller.signal.aborted) return;
                    if (status === google.maps.places.PlacesServiceStatus.OK && Array.isArray(result)) {
                        const mapped = result.map(r => ({ description: r.description, place_id: r.place_id! }));
                        setPredictions(mapped);
                        setOpen(true);
                    } else {
                        setPredictions([]);
                        setOpen(false);
                    }
                }
            );
        }, 250);
        return () => {
            controller.abort();
            clearTimeout(timeout);
        };
    }, [query, autocompleteService]);

    // Close suggestions on outside click
    useEffect(() => {
        const onDocClick = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setOpen(false);
            }
        };
        document.addEventListener("mousedown", onDocClick);
        return () => document.removeEventListener("mousedown", onDocClick);
    }, []);

    const onPickPrediction = async (p: Prediction) => {
        setQuery(p.description);
        setOpen(false);
        // Update query string with q and placeId so server can leverage later
        const params = new URLSearchParams(searchParams.toString());
        params.set("q", p.description);
        router.push(`${pathname}?${params.toString()}`);
        // Optionally fetch coordinates to center map or store for future
        // const res = await fetch(`/api/places/details?place_id=${encodeURIComponent(p.place_id)}`);
        // const data = await res.json();
    };

    return (
        <div className="flex items-center gap-2 p-4 bg-background border-b" ref={containerRef}>
            <form onSubmit={handleSearch} className="relative grow">
                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                    placeholder="Buscar por cidade, bairro ou empreendimento..."
                    className="pl-10 h-12 text-base"
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    onFocus={() => predictions.length > 0 && setOpen(true)}
                />
                {open && predictions.length > 0 && (
                    <div className="absolute z-20 mt-1 w-full rounded-md border bg-background shadow">
                        <ul className="max-h-72 overflow-auto py-1">
                            {predictions.map(p => (
                                <li
                                    key={p.place_id}
                                    className="px-3 py-2 text-sm hover:bg-muted cursor-pointer"
                                    onMouseDown={e => e.preventDefault()}
                                    onClick={() => onPickPrediction(p)}
                                >
                                    {p.description}
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </form>
            <FiltersModal />
        </div>
    );
}
