import { db } from "@/firebase/firebase-config";
import { notifySuccess } from "@/services/notificationService";
import { arrayRemove, arrayUnion, doc, onSnapshot, updateDoc } from "firebase/firestore";
import { useCallback, useEffect, useState } from "react";
import { useAuth } from "./use-auth";

export function useFavorites() {
    const { user } = useAuth();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [favorites, setFavorites] = useState<string[]>([]);

    useEffect(() => {
        if (!user?.id) {
            setFavorites([]);
            return;
        }

        const userRef = doc(db, "users", user.id);
        const unsubscribe = onSnapshot(
            userRef,
            doc => {
                if (doc.exists()) {
                    const favorites = doc.data().favorited || [];
                    const favoritesArray = Array.isArray(favorites)
                        ? favorites.map(ref => (typeof ref === "string" ? ref : ref.id))
                        : [];
                    setFavorites(favoritesArray);
                } else {
                    setFavorites([]);
                }
            },
            error => {
                console.error("Error listening to favorites:", error);
            }
        );
        return () => unsubscribe();
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
                const userRef = doc(db, "users", user.id);
                const addToFavorites = !isFavorited(propertyId);

                await updateDoc(userRef, {
                    favorited: addToFavorites ? arrayUnion(propertyId) : arrayRemove(propertyId),
                });

                if (addToFavorites) {
                    notifySuccess("Imovel adicionado aos favoritos!");
                }
            } catch (error) {
                const errorMessage =
                    error instanceof Error ? error.message : "Ocorreu um erro ao atualizar os favoritos";
                setError(errorMessage);
                console.error(errorMessage);
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
