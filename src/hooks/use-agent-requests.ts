import { AgentRegistrationRequest } from "@/interfaces/agentRegistrationRequest";
import { useCallback, useEffect, useState } from "react";

export function useAgentRequests(
    status: "pending" | "approved" | "denied",
    page: number,
    limit: number,
    enabled: boolean = true
) {
    const [requests, setRequests] = useState<AgentRegistrationRequest[]>([]);
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchAgentRequests = useCallback(async () => {
        if (!enabled) {
            setRequests([]);
            setTotalPages(1);
            setTotal(0);
            return;
        }

        setIsLoading(true);
        setError(null);
        try {
            const response = await fetch(`/api/admin/agent-requests?status=${status}&page=${page}&limit=${limit}`);
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || "Failed to fetch agent requests");
            }
            const data = await response.json();
            setRequests(data.requests || []);
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
    }, [status, page, limit, enabled]);

    useEffect(() => {
        fetchAgentRequests();
    }, [fetchAgentRequests]);

    return { requests, total, totalPages, isLoading, error, refresh: fetchAgentRequests };
}
