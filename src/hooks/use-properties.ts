"use client";

import { Property } from "@/interfaces/property";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

export function useProperties() {
    const [properties, setProperties] = useState<Property[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const limit = 10; // Define quantos itens por página

    const fetchProperties = useCallback(
        async (reset = false) => {
            setIsLoading(true);
            setError(null);
            const currentPage = reset ? 1 : page;

            try {
                const response = await fetch(`/api/admin/properties?page=${currentPage}&limit=${limit}`);
                if (!response.ok) {
                    throw new Error("Falha ao buscar os imóveis.");
                }
                const data = await response.json();

                setProperties(prev => (reset ? data.properties : [...prev, ...data.properties]));
                setHasMore(data.properties.length === limit);
                if (reset) {
                    setPage(2);
                } else {
                    setPage(prev => prev + 1);
                }
            } catch (e) {
                const errorMessage = e instanceof Error ? e.message : "Ocorreu um erro desconhecido.";
                setError(errorMessage);
                toast.error(errorMessage);
            } finally {
                setIsLoading(false);
            }
        },
        [page]
    );

    const refreshProperties = useCallback(() => {
        setProperties([]); // Limpa as propriedades atuais
        fetchProperties(true);
    }, [fetchProperties]);

    useEffect(() => {
        fetchProperties(true); // Carga inicial
    }, [fetchProperties]);

    return { properties, isLoading, error, hasMore, fetchMoreProperties: fetchProperties, refreshProperties };
}
