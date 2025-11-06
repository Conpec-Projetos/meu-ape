"use client";

import { RequestTab, STATUS_META, formatDateTime } from "@/components/specifics/admin/requests/constants";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ReservationRequestListItem, VisitRequestListItem } from "@/interfaces/adminRequestsResponse";

interface RequestsTableProps {
    type: RequestTab;
    requests: VisitRequestListItem[] | ReservationRequestListItem[];
    isLoading: boolean;
    error?: string | null;
    onAnalyze: (request: VisitRequestListItem | ReservationRequestListItem) => void;
}

export function RequestsTableSkeleton() {
    return (
        <div className="space-y-3">
            <div className="grid grid-cols-5 gap-4">
                {Array.from({ length: 5 }).map((_, index) => (
                    <Skeleton key={index} className="h-4 w-full" />
                ))}
            </div>
            {Array.from({ length: 5 }).map((_, rowIndex) => (
                <div key={rowIndex} className="grid grid-cols-5 gap-4">
                    {Array.from({ length: 5 }).map((_, colIndex) => (
                        <Skeleton key={`${rowIndex}-${colIndex}`} className="h-10 w-full" />
                    ))}
                </div>
            ))}
        </div>
    );
}

export function RequestsTable({ type, requests, isLoading, error, onAnalyze }: RequestsTableProps) {
    if (isLoading) {
        return <RequestsTableSkeleton />;
    }

    if (error) {
        return <p className="text-sm text-red-500">{error}</p>;
    }

    if (!requests.length) {
        return <p className="text-sm text-muted-foreground">Nenhuma solicitação encontrada.</p>;
    }

    if (type === "visits") {
        const visitRequests = requests as VisitRequestListItem[];
        return (
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Cliente</TableHead>
                        <TableHead>Imóvel</TableHead>
                        <TableHead className="hidden md:table-cell">Data da solicitação</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {visitRequests.map(request => {
                        return (
                            <TableRow key={request.id}>
                                <TableCell>{request.client.fullName}</TableCell>
                                <TableCell>{request.property.name}</TableCell>
                                <TableCell className="hidden md:table-cell">
                                    {formatDateTime(request.createdAt)}
                                </TableCell>
                                <TableCell>
                                    {(() => {
                                        const meta = STATUS_META[request.status] || STATUS_META.pending;
                                        const { Icon, classes, label } = meta;
                                        return (
                                            <Badge
                                                variant="outline"
                                                className={`inline-flex items-center gap-1.5 capitalize ${classes}`}
                                            >
                                                <Icon className="h-3.5 w-3.5" /> {label}
                                            </Badge>
                                        );
                                    })()}
                                </TableCell>
                                <TableCell className="text-right">
                                    <Button className="cursor-pointer" variant="outline" size="sm" onClick={() => onAnalyze(request)}>
                                        Analisar
                                    </Button>
                                </TableCell>
                            </TableRow>
                        );
                    })}
                </TableBody>
            </Table>
        );
    }

    const reservationRequests = requests as ReservationRequestListItem[];
    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Imóvel</TableHead>
                    <TableHead className="hidden lg:table-cell">Unidade</TableHead>
                    <TableHead className="hidden md:table-cell">Data da solicitação</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {reservationRequests.map(request => {
                    return (
                        <TableRow key={request.id}>
                            <TableCell>{request.client.fullName}</TableCell>
                            <TableCell>{request.property.name}</TableCell>
                            <TableCell className="hidden lg:table-cell">
                                {request.unit.identifier} · Bloco {request.unit.block}
                            </TableCell>
                            <TableCell className="hidden md:table-cell">{formatDateTime(request.createdAt)}</TableCell>
                            <TableCell>
                                {(() => {
                                    const meta = STATUS_META[request.status] || STATUS_META.pending;
                                    const { Icon, classes, label } = meta;
                                    return (
                                        <Badge
                                            variant="outline"
                                            className={`inline-flex items-center gap-1.5 capitalize ${classes}`}
                                        >
                                            <Icon className="h-3.5 w-3.5" /> {label}
                                        </Badge>
                                    );
                                })()}
                            </TableCell>
                            <TableCell className="text-right">
                                <Button variant="outline" size="sm" onClick={() => onAnalyze(request)}>
                                    Analisar
                                </Button>
                            </TableCell>
                        </TableRow>
                    );
                })}
            </TableBody>
        </Table>
    );
}
