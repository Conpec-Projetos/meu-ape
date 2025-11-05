import { useCallback, useState } from "react";
import { useAuth } from "./use-auth";
import { arrayRemove, arrayUnion, doc, updateDoc } from "firebase/firestore";
import { db } from "@/firebase/firebase-config";

export function useFavorites() {
    const { user } = useAuth();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [localFavorites, setLocalFavorites] = useState<string[]>(
        user?.favorited
            ? Array.isArray(user.favorited)
                ? user.favorited.map(ref => typeof ref === "string" ? ref : ref.id)
                : []
            : []
    );

    const isFavorited = useCallback((propertyId: string) => {
        return localFavorites.includes(propertyId);
    }, [localFavorites]);

    const toggleFavorite = useCallback(async (propertyId: string) => {
        if (!user?.id) {
            console.error("User not authenticated");
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const userRef = doc(db, "users", user.id);
            const addToFavorites = !isFavorited(propertyId);           

            setLocalFavorites(prevFavorites =>
                addToFavorites 
                    ? [...prevFavorites, propertyId] 
                    : prevFavorites.filter(id => id !== propertyId)
            );

            await updateDoc(userRef, {
                favorited: addToFavorites ? arrayUnion(propertyId) : arrayRemove(propertyId)
            });
        } catch (error) {
            setLocalFavorites(prevFavorites => 
            isFavorited(propertyId)
                ? prevFavorites.filter(id => id !== propertyId)
                : [...prevFavorites, propertyId]
            );
            const errorMessage = error instanceof Error ? error.message : "Ocorreu um erro ao atualizar os favoritos";
            setError(errorMessage);
            console.error(errorMessage);
        } finally {
            setIsLoading(false);
        }
    }, [user?.id, isFavorited]);

    return {
        favorites: localFavorites,
        isFavorited,
        toggleFavorite,
        isLoading,
        error
    };
}