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

    const fetchProperties = useCallback(async (reset = false) => {
        setIsLoading(true);
        setError(null);

        const currentPage = reset ? 1 : pageRef.current;

        try {
            const response = await fetch(`/api/admin/properties?page=${currentPage}&limit=${limit}`);
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
        fetchProperties(true);
    }, [fetchProperties]);

    // Initial load on mount only
    useEffect(() => {
        fetchProperties(true); // Carga inicial
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return { properties, isLoading, error, hasMore, fetchMoreProperties: fetchProperties, refreshProperties };
}
