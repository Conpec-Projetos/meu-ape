"use client";

import { Button } from "@/components/ui/button";
import {
    Pagination,
    PaginationContent,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from "@/components/ui/pagination";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { AgentRegistrationRequest } from "@/interfaces/agentRegistrationRequest";
import { formatCPF } from "@/lib/utils";
import { Check, Eye, Inbox, X } from "lucide-react";

interface AgentRequestTableProps {
    requests: AgentRegistrationRequest[];
    page: number;
    totalPages: number;
    onPageChange: (page: number) => void;
    onReview: (request: AgentRegistrationRequest) => void;
    onApprove: (request: AgentRegistrationRequest) => void;
    onDeny: (request: AgentRegistrationRequest) => void;
}

export function AgentRequestTable({
    requests,
    page,
    totalPages,
    onPageChange,
    onReview,
    onApprove,
    onDeny,
}: AgentRequestTableProps) {
    const getMaskedCpf = (cpf?: string | null) => (cpf ? formatCPF(cpf) : "Não informado");
    const coerceDate = (val: unknown): Date | undefined => {
        if (!val) return undefined;
        if (val instanceof Date) return val;
        if (typeof val === "object" && val !== null) {
            // Firestore Timestamp-like support
            if ("toDate" in (val as Record<string, unknown>)) {
                try {
                    const d = (val as unknown as { toDate: () => Date }).toDate();
                    if (d instanceof Date && !isNaN(d.getTime())) return d;
                } catch {}
            }
            if ("seconds" in (val as Record<string, unknown>)) {
                const s = (val as Record<string, unknown>).seconds;
                if (typeof s === "number") return new Date(s * 1000);
            }
        }
        if (typeof val === "string") {
            const t = Date.parse(val);
            if (!Number.isNaN(t)) return new Date(t);
        }
        if (typeof val === "number") return new Date(val);
        return undefined;
    };

    const formatDate = (date: unknown) => {
        const d = coerceDate(date);
        if (!d) return "N/A";
        return d.toLocaleDateString("pt-BR");
    };

    if (!requests || requests.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center text-center py-16">
                <Inbox className="h-16 w-16 text-gray-400 mb-4" />
                <h3 className="text-xl font-semibold mb-2">Nenhuma solicitação encontrada</h3>
                <p className="text-gray-500">Parece que não há solicitações para exibir no momento.</p>
            </div>
        );
    }

    return (
        <TooltipProvider>
            <div>
                {/* Desktop / Tablet table - hidden on small screens */}
                <div className="hidden md:block overflow-x-auto">
                    <Table className="min-w-full">
                        <TableHeader>
                            <TableRow>
                                <TableHead>Nome do Solicitante</TableHead>
                                <TableHead>Email</TableHead>
                                <TableHead>CPF</TableHead>
                                <TableHead>CRECI</TableHead>
                                <TableHead>Data da Solicitação</TableHead>
                                <TableHead className="text-right">Ações</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {requests.map(request => (
                                <TableRow key={request.id} onClick={() => onReview(request)}>
                                    <TableCell>{request.applicantData.fullName}</TableCell>
                                    <TableCell>{request.applicantData.email}</TableCell>
                                    <TableCell>{getMaskedCpf(request.applicantData.cpf)}</TableCell>
                                    <TableCell>{request.applicantData.creci}</TableCell>
                                    <TableCell>{formatDate(request.submittedAt)}</TableCell>
                                    <TableCell className="text-right space-x-2">
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                {/* The View button click is suppressed as the row click handles the review/view */}
                                                <Button
                                                    variant="outline"
                                                    size="icon"
                                                    className="cursor-pointer"
                                                    onClick={e => {
                                                        e.stopPropagation();
                                                        onReview(request);
                                                    }}
                                                >
                                                    <Eye className="h-4 w-4" />
                                                </Button>
                                            </TooltipTrigger>
                                            <TooltipContent>
                                                <p>Visualizar Detalhes</p>
                                            </TooltipContent>
                                        </Tooltip>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <Button
                                                    variant="outline"
                                                    size="icon"
                                                    className="cursor-pointer border-green-500 text-green-500 hover:bg-green-500 hover:text-white"
                                                    onClick={e => {
                                                        e.stopPropagation();
                                                        onApprove(request);
                                                    }}
                                                >
                                                    <Check className="h-4 w-4" />
                                                </Button>
                                            </TooltipTrigger>
                                            <TooltipContent>
                                                <p>Aprovar</p>
                                            </TooltipContent>
                                        </Tooltip>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <Button
                                                    variant="outline"
                                                    size="icon"
                                                    className="cursor-pointer border-red-500 text-red-500 hover:bg-red-500 hover:text-white"
                                                    onClick={e => {
                                                        e.stopPropagation();
                                                        onDeny(request);
                                                    }}
                                                >
                                                    <X className="h-4 w-4" />
                                                </Button>
                                            </TooltipTrigger>
                                            <TooltipContent>
                                                <p>Negar</p>
                                            </TooltipContent>
                                        </Tooltip>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>

                {/* Mobile card list - visible on small screens */}
                <div className="block md:hidden space-y-3">
                    {requests.map(request => (
                        <div
                            key={request.id}
                            onClick={() => onReview(request)}
                            className="bg-card border rounded-lg p-3 flex items-start justify-between gap-3"
                        >
                            <div className="space-y-1">
                                <div className="text-sm font-medium">{request.applicantData.fullName}</div>
                                <div className="text-xs text-muted-foreground">{request.applicantData.email}</div>
                                <div className="text-xs text-muted-foreground">
                                    CPF: {getMaskedCpf(request.applicantData.cpf)}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                    CRECI: {request.applicantData.creci || "N/A"}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                    Enviado: {formatDate(request.submittedAt)}
                                </div>
                            </div>
                            <div className="flex flex-col items-end gap-2">
                                <div className="flex items-center gap-2">
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        className="cursor-pointer"
                                        onClick={e => {
                                            e.stopPropagation();
                                            onReview(request);
                                        }}
                                    >
                                        <Eye className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        className="cursor-pointer border-green-500 text-green-500 hover:bg-green-500 hover:text-white"
                                        onClick={e => {
                                            e.stopPropagation();
                                            onApprove(request);
                                        }}
                                    >
                                        <Check className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        className="cursor-pointer border-red-500 text-red-500 hover:bg-red-500 hover:text-white"
                                        onClick={e => {
                                            e.stopPropagation();
                                            onDeny(request);
                                        }}
                                    >
                                        <X className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
                {totalPages > 1 && (
                    <Pagination className="mt-4">
                        <PaginationContent>
                            <PaginationItem>
                                <PaginationPrevious
                                    href="#"
                                    onClick={e => {
                                        e.preventDefault();
                                        onPageChange(page - 1);
                                    }}
                                    className={page <= 1 ? "pointer-events-none opacity-50" : ""}
                                />
                            </PaginationItem>
                            {[...Array(totalPages)].map((_, i) => (
                                <PaginationItem key={i}>
                                    <PaginationLink
                                        href="#"
                                        onClick={e => {
                                            e.preventDefault();
                                            onPageChange(i + 1);
                                        }}
                                        isActive={page === i + 1}
                                    >
                                        {i + 1}
                                    </PaginationLink>
                                </PaginationItem>
                            ))}
                            <PaginationItem>
                                <PaginationNext
                                    href="#"
                                    onClick={e => {
                                        e.preventDefault();
                                        onPageChange(page + 1);
                                    }}
                                    className={page >= totalPages ? "pointer-events-none opacity-50" : ""}
                                />
                            </PaginationItem>
                        </PaginationContent>
                    </Pagination>
                )}
            </div>
        </TooltipProvider>
    );
}
