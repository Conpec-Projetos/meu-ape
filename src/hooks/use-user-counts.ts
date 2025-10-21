import { useCallback, useEffect, useState } from "react";

export function useUserCounts() {
    const [counts, setCounts] = useState({ client: 0, agent: 0, admin: 0 });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchCounts = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await fetch("/api/admin/users/counts");
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || "Failed to fetch user counts");
            }
            const data = await response.json();
            setCounts(data);
        } catch (err) {
            if (err instanceof Error) {
                setError(err.message);
            } else {
                setError("An unknown error occurred.");
            }
        }
        setIsLoading(false);
    }, []);

    useEffect(() => {
        fetchCounts();
    }, [fetchCounts]);

    return { counts, isLoading, error, refresh: fetchCounts };
}
