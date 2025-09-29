import { useState, useEffect, useCallback } from 'react';
import { User } from '@/interfaces/user';

export function useUsers(role: 'client' | 'agent' | 'admin', page: number, limit: number, status?: string, enabled: boolean = true) {
  const [users, setUsers] = useState<User[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    if (!enabled) {
      setUsers([]);
      setTotalPages(1);
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
        throw new Error(errorData.error || 'Failed to fetch users');
      }
      const data = await response.json();
      setUsers(data.users || []);
      setTotalPages(data.totalPages || 1);
    } catch (err) {
      setError(err.message);
    }
    setIsLoading(false);
  }, [role, page, limit, status, enabled]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  return { users, totalPages, isLoading, error, refresh: fetchUsers };
}
