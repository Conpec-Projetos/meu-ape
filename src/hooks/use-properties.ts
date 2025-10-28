"use client";

import { Property } from "@/interfaces/property";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

export function useProperties() {
    const [properties, setProperties] = useState<Property[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [hasMore, setHasMore] = useState(true);
    const limit = 10; // Define quantos itens por página

    // useRef to hold the current page number to avoid stale closures and effect loops
    const pageRef = useRef<number>(1);
    // hold current search query so subsequent page fetches continue the same search
    const currentQueryRef = useRef<string | undefined>(undefined);
    // fuzzy search enabled by default
    const fuzzyRef = useRef<boolean>(true);

    const fetchProperties = useCallback(async (reset = false, q?: string, fuzzy?: boolean) => {
        setIsLoading(true);
        setError(null);

        const currentPage = reset ? 1 : pageRef.current;

        // update stored query when explicit q is provided (including empty string)
        if (q !== undefined) {
            currentQueryRef.current = q;
        }
        const queryToUse = q !== undefined ? q : currentQueryRef.current;
        const fuzzyToUse = fuzzy !== undefined ? fuzzy : fuzzyRef.current;

        try {
            const url =
                `/api/admin/properties?page=${currentPage}&limit=${limit}` +
                (queryToUse ? `&q=${encodeURIComponent(queryToUse)}` : "") +
                (fuzzyToUse ? `&fuzzy=true` : "");
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error("Falha ao buscar os imóveis.");
            }
            const data = await response.json();

            const incoming: Property[] = data.properties || [];

            setProperties(prev => (reset ? incoming : [...prev, ...incoming]));

            // Prefer server-provided totalPages when available
            if (typeof data.totalPages === "number") {
                setHasMore(currentPage < data.totalPages);
            } else {
                // Fallback: if we received a full page, assume there may be more
                setHasMore(incoming.length === limit);
            }

            // Update the ref page counter
            if (reset) {
                pageRef.current = 2;
            } else {
                pageRef.current = pageRef.current + 1;
            }
        } catch (e) {
            const errorMessage = e instanceof Error ? e.message : "Ocorreu um erro desconhecido.";
            setError(errorMessage);
            toast.error(errorMessage);
        } finally {
            setIsLoading(false);
        }
    }, []);

    const refreshProperties = useCallback(() => {
        setProperties([]); // Limpa as propriedades atuais
        pageRef.current = 1;
        currentQueryRef.current = undefined;
        fetchProperties(true);
    }, [fetchProperties]);

    const searchProperties = useCallback(
        (q?: string, fuzzy?: boolean) => {
            // Reset and fetch with query
            setProperties([]);
            pageRef.current = 1;
            fetchProperties(true, q, fuzzy);
        },
        [fetchProperties]
    );

    // Initial load on mount only
    useEffect(() => {
        fetchProperties(true); // Carga inicial
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return {
        properties,
        isLoading,
        error,
        hasMore,
        fetchMoreProperties: fetchProperties,
        refreshProperties,
        searchProperties,
    };
}
