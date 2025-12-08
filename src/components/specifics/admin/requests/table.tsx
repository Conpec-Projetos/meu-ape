"use client";

import { RequestTab, STATUS_META, formatDateTime } from "@/components/specifics/admin/requests/constants";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ReservationRequestListItem, VisitRequestListItem } from "@/interfaces/adminRequestsResponse";
import { FileSearch, FileText, Trash2 } from "lucide-react";

interface RequestsTableProps {
    type: RequestTab;
    requests: VisitRequestListItem[] | ReservationRequestListItem[];
    isLoading: boolean;
    error?: string | null;
    onAnalyze: (request: VisitRequestListItem | ReservationRequestListItem) => void;
    onViewDocs?: (request: ReservationRequestListItem) => void;
    onDelete?: (request: VisitRequestListItem | ReservationRequestListItem) => void;
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

export function RequestsTable({
    type,
    requests,
    isLoading,
    error,
    onAnalyze,
    onViewDocs,
    onDelete,
}: RequestsTableProps) {
    if (isLoading) {
        return <RequestsTableSkeleton />;
    }

    if (error) {
        return <p className="text-sm text-red-500">{error}</p>;
    }

    if (!requests.length) {
        return <p className="text-sm text-muted-foreground">Nenhuma solicitação encontrada.</p>;
    }

    const renderStatus = (status: VisitRequestListItem["status"] | ReservationRequestListItem["status"]) => {
        const meta = STATUS_META[status] || STATUS_META.pending;
        const { Icon, classes, label } = meta;
        return (
            <Badge variant="outline" className={`inline-flex items-center gap-1.5 capitalize ${classes}`}>
                <Icon className="h-3.5 w-3.5" /> {label}
            </Badge>
        );
    };

    const renderAnalyzeButton = (request: VisitRequestListItem | ReservationRequestListItem) => (
        <Tooltip>
            <TooltipTrigger asChild>
                <Button
                    aria-label="Analisar solicitação"
                    className="cursor-pointer"
                    variant="default"
                    size="icon"
                    onClick={() => onAnalyze(request)}
                >
                    <FileSearch className="h-4 w-4" />
                </Button>
            </TooltipTrigger>
            <TooltipContent>
                <p>Analisar</p>
            </TooltipContent>
        </Tooltip>
    );

    const renderDocsButton = (request: ReservationRequestListItem) => {
        if (!onViewDocs) return null;
        return (
            <Tooltip>
                <TooltipTrigger asChild>
                    <Button
                        aria-label="Ver documentos"
                        className="cursor-pointer"
                        variant="outline"
                        size="icon"
                        onClick={() => onViewDocs(request)}
                    >
                        <FileText className="h-4 w-4" />
                    </Button>
                </TooltipTrigger>
                <TooltipContent>
                    <p>Ver documentos</p>
                </TooltipContent>
            </Tooltip>
        );
    };

    const renderDeleteButton = (request: VisitRequestListItem | ReservationRequestListItem) => {
        if (!onDelete) return null;
        return (
            <Tooltip>
                <TooltipTrigger asChild>
                    <Button
                        aria-label="Excluir solicitação"
                        className="cursor-pointer text-red-500 border-red-500 hover:bg-red-500 hover:text-white"
                        variant="outline"
                        size="icon"
                        onClick={() => onDelete(request)}
                    >
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </TooltipTrigger>
                <TooltipContent>
                    <p>Excluir</p>
                </TooltipContent>
            </Tooltip>
        );
    };

    const renderVisitMobile = (visitRequests: VisitRequestListItem[]) => (
        <div className="md:hidden space-y-3">
            {visitRequests.map(request => (
                <div key={request.id} className="rounded-lg border p-4 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1">
                            <p className="font-semibold leading-tight">{request.property.name}</p>
                            <p className="text-sm text-muted-foreground">{request.client.fullName}</p>
                            <p className="text-xs text-muted-foreground">
                                Solicitado em {formatDateTime(request.createdAt)}
                            </p>
                        </div>
                        {renderStatus(request.status)}
                    </div>
                    <div className="flex justify-end gap-2">
                        {renderDeleteButton(request)}
                        {renderAnalyzeButton(request)}
                    </div>
                </div>
            ))}
        </div>
    );

    const renderReservationMobile = (reservationRequests: ReservationRequestListItem[]) => (
        <div className="md:hidden space-y-3">
            {reservationRequests.map(request => (
                <div key={request.id} className="rounded-lg border p-4 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1">
                            <p className="font-semibold leading-tight">{request.property.name}</p>
                            <p className="text-sm text-muted-foreground">{request.client.fullName}</p>
                            <p className="text-sm text-muted-foreground">
                                {request.unit.identifier} · Bloco {request.unit.block}
                            </p>
                            <p className="text-xs text-muted-foreground">
                                Solicitado em {formatDateTime(request.createdAt)}
                            </p>
                        </div>
                        {renderStatus(request.status)}
                    </div>
                    <div className="flex justify-end gap-2">
                        {renderDeleteButton(request)}
                        {renderDocsButton(request)}
                        {renderAnalyzeButton(request)}
                    </div>
                </div>
            ))}
        </div>
    );

    const renderVisitTable = (visitRequests: VisitRequestListItem[]) => (
        <div className="hidden md:block">
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
                    {visitRequests.map(request => (
                        <TableRow key={request.id}>
                            <TableCell>{request.client.fullName}</TableCell>
                            <TableCell>{request.property.name}</TableCell>
                            <TableCell className="hidden md:table-cell">{formatDateTime(request.createdAt)}</TableCell>
                            <TableCell>{renderStatus(request.status)}</TableCell>
                            <TableCell className="text-right">
                                <div className="flex justify-end gap-2">
                                    {renderDeleteButton(request)}
                                    {renderAnalyzeButton(request)}
                                </div>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );

    const renderReservationTable = (reservationRequests: ReservationRequestListItem[]) => (
        <div className="hidden md:block">
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
                    {reservationRequests.map(request => (
                        <TableRow key={request.id}>
                            <TableCell>{request.client.fullName}</TableCell>
                            <TableCell>{request.property.name}</TableCell>
                            <TableCell className="hidden lg:table-cell">
                                {request.unit.identifier} · Bloco {request.unit.block}
                            </TableCell>
                            <TableCell className="hidden md:table-cell">{formatDateTime(request.createdAt)}</TableCell>
                            <TableCell>{renderStatus(request.status)}</TableCell>
                            <TableCell className="text-right">
                                <div className="flex justify-end gap-2">
                                    {renderDeleteButton(request)}
                                    {renderDocsButton(request)}
                                    {renderAnalyzeButton(request)}
                                </div>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );

    const visitRequests = requests as VisitRequestListItem[];
    const reservationRequests = requests as ReservationRequestListItem[];

    return (
        <TooltipProvider>
            <div className="space-y-4">
                {type === "visits" ? renderVisitMobile(visitRequests) : renderReservationMobile(reservationRequests)}
                {type === "visits" ? renderVisitTable(visitRequests) : renderReservationTable(reservationRequests)}
            </div>
        </TooltipProvider>
    );
}
