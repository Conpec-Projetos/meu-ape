import { User } from "@/interfaces/user";
import { useCallback, useEffect, useState } from "react";

export function useUsers(
    role: "client" | "agent" | "admin",
    page: number,
    limit: number,
    status?: string,
    enabled: boolean = true
) {
    const [users, setUsers] = useState<User[]>([]);
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchUsers = useCallback(async () => {
        if (!enabled) {
            setUsers([]);
            setTotalPages(1);
            setTotal(0);
            return;
        }
        setIsLoading(true);
        setError(null);
        try {
            let url = `/api/admin/users?role=${role}&page=${page}&limit=${limit}`;
            if (status) {
                url += `&status=${status}`;
            }
            const response = await fetch(url);
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || "Failed to fetch users");
            }
            const data = await response.json();
            setUsers(data.users || []);
            setTotalPages(data.totalPages || 1);
            setTotal(data.total || 0);
        } catch (err) {
            if (err instanceof Error) {
                setError(err.message);
            } else {
                setError("An unknown error occurred.");
            }
        }
        setIsLoading(false);
    }, [role, page, limit, status, enabled]);

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    return { users, total, totalPages, isLoading, error, refresh: fetchUsers };
}
