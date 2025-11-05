"use client";

import { RequestsTableSkeleton } from "@/components/specifics/admin/requests/table";
import { Skeleton } from "@/components/ui/skeleton";

export function PageSkeleton() {
    return (
        <div className="min-h-screen container mx-auto px-4 py-20 space-y-6">
            <Skeleton className="h-9 w-72" />
            <Skeleton className="h-5 w-96" />
            <Skeleton className="h-10 w-64" />
            <RequestsTableSkeleton />
        </div>
    );
}
