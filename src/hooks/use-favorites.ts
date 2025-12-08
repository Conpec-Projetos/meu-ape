import { notifySuccess } from "@/services/notificationService";
import { useCallback, useEffect, useState } from "react";
import { useAuth } from "./use-auth";

export function useFavorites() {
    const { user } = useAuth();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [favorites, setFavorites] = useState<string[]>([]);

    useEffect(() => {
        const userId = user?.id;

        if (!userId) {
            setFavorites([]);
            return;
        }

        let isActive = true;

        const fetchFavorites = async () => {
            try {
                const response = await fetch("/api/user/favorites", {
                    method: "GET",
                    credentials: "include",
                    cache: "no-store",
                });

                if (!isActive) return;

                if (!response.ok) {
                    const message = `Failed to load favorites (${response.status})`;
                    setError(message);
                    setFavorites([]);
                    return;
                }

                const payload = (await response.json()) as { favorites?: string[] };
                setFavorites(payload.favorites ?? []);
            } catch (err) {
                if (!isActive) return;
                const message = err instanceof Error ? err.message : "Erro ao carregar favoritos";
                setError(message);
                setFavorites([]);
            }
        };

        fetchFavorites();

        return () => {
            isActive = false;
        };
    }, [user?.id]);

    const isFavorited = useCallback(
        (propertyId: string) => {
            if (!propertyId) return false;
            return favorites.includes(propertyId);
        },
        [favorites]
    );

    const toggleFavorite = useCallback(
        async (propertyId: string) => {
            if (!user?.id) {
                console.error("User not authenticated");
                return;
            }

            if (!propertyId) {
                console.error("Invalid property ID");
                return;
            }

            setIsLoading(true);
            setError(null);

            try {
                const addToFavorites = !isFavorited(propertyId);

                const response = addToFavorites
                    ? await fetch("/api/user/favorites", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          credentials: "include",
                          body: JSON.stringify({ propertyId }),
                      })
                    : await fetch(`/api/user/favorites?propertyId=${encodeURIComponent(propertyId)}`, {
                          method: "DELETE",
                          credentials: "include",
                      });

                if (!response.ok) {
                    const { error: apiError } = (await response.json().catch(() => ({}))) as { error?: string };
                    throw new Error(apiError ?? "Falha ao atualizar favoritos");
                }

                setFavorites(prev =>
                    addToFavorites ? [...prev, propertyId] : prev.filter(favoriteId => favoriteId !== propertyId)
                );

                if (addToFavorites) {
                    notifySuccess("Imovel adicionado aos favoritos!");
                }
            } catch (error) {
                const errorMessage =
                    error instanceof Error ? error.message : "Ocorreu um erro ao atualizar os favoritos";
                setError(errorMessage);
            } finally {
                setIsLoading(false);
            }
        },
        [user?.id, isFavorited]
    );

    return {
        favorites: favorites,
        isFavorited,
        toggleFavorite,
        isLoading,
        error,
    };
}
