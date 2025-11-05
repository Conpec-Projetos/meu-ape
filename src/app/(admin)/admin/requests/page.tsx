"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
    Pagination,
    PaginationContent,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from "@/components/ui/pagination";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { User } from "@/interfaces/user";
import { notifyPromise } from "@/services/notificationService";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ExternalLink, Loader2, Search } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useMemo, useState } from "react";

type RequestTab = "visits" | "reservations";
type VisitRequestStatus = "pending" | "approved" | "denied" | "completed";
type ReservationRequestStatus = "pending" | "approved" | "denied";

type VisitRequestDTO = {
    id: string;
    status: VisitRequestStatus;
    client: {
        ref?: string;
        fullName: string;
    };
    property: {
        id: string;
        name: string;
    };
    unit: {
        id: string;
        identifier: string;
        block: string;
    };
    agents?: {
        ref?: string;
        name: string;
        email: string;
        phone: string;
        creci: string;
    }[];
    requestedSlots: string[];
    scheduledSlot?: string | null;
    agentMsg?: string;
    clientMsg?: string;
    createdAt: string;
    updatedAt?: string;
};

type ReservationRequestDTO = {
    id: string;
    status: ReservationRequestStatus;
    client: {
        ref?: string;
        fullName: string;
        address: string;
        phone: string;
        rg: string;
        cpf: string;
        addressProof?: string[];
        incomeProof?: string[];
        identityDoc?: string[];
        bmCert?: string[];
    };
    property: {
        id: string;
        name: string;
    };
    unit: {
        id: string;
        identifier: string;
        block: string;
    };
    agents?: {
        ref?: string;
        name: string;
        email: string;
        phone: string;
        creci: string;
    }[];
    agentMsg?: string;
    clientMsg?: string;
    createdAt: string;
    updatedAt?: string;
};

type RequestSelection =
    | { type: "visits"; data: VisitRequestDTO }
    | { type: "reservations"; data: ReservationRequestDTO };

type RequestStatusUrl = "pendente" | "aprovada" | "negada";

const TAB_URL_TO_INTERNAL: Record<string, RequestTab> = {
    visitas: "visits",
    reservas: "reservations",
};

const TAB_INTERNAL_TO_URL: Record<RequestTab, string> = {
    visits: "visitas",
    reservations: "reservas",
};

const STATUS_URL_TO_INTERNAL: Record<RequestStatusUrl, "pending" | "approved" | "denied"> = {
    pendente: "pending",
    aprovada: "approved",
    negada: "denied",
};

const STATUS_INTERNAL_TO_URL: Record<"pending" | "approved" | "denied", RequestStatusUrl> = {
    pending: "pendente",
    approved: "aprovada",
    denied: "negada",
};

const STATUS_BADGE_MAP: Record<
    string,
    { label: string; variant: "default" | "secondary" | "outline" | "destructive" }
> = {
    pending: { label: "Pendente", variant: "secondary" },
    approved: { label: "Aprovada", variant: "default" },
    denied: { label: "Negada", variant: "destructive" },
    completed: { label: "Concluída", variant: "outline" },
};

const STATUS_FILTER_OPTIONS: Array<{ urlValue?: RequestStatusUrl; label: string }> = [
    { urlValue: undefined, label: "Todas" },
    { urlValue: "pendente", label: "Pendentes" },
    { urlValue: "aprovada", label: "Aprovadas" },
    { urlValue: "negada", label: "Negadas" },
];

const DOCUMENT_GROUPS: Array<{
    key: keyof ReservationRequestDTO["client"];
    label: string;
}> = [
    { key: "identityDoc", label: "Documentos de identidade" },
    { key: "incomeProof", label: "Comprovantes de renda" },
    { key: "addressProof", label: "Comprovantes de endereço" },
    { key: "bmCert", label: "Certidões" },
];

const ITEMS_PER_PAGE_LABEL = 15;

function formatDateTime(value?: string | null) {
    if (!value) return "-";
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return "-";
    return format(parsed, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
}

function InfoField({ label, value }: { label: string; value?: string | null }) {
    return (
        <div className="space-y-1">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
            <p className="text-sm font-semibold text-foreground wrap-break-word">{value ?? "-"}</p>
        </div>
    );
}

function RequestsTableSkeleton() {
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

function PageSkeleton() {
    return (
        <div className="min-h-screen container mx-auto px-4 py-20 space-y-6">
            <Skeleton className="h-9 w-72" />
            <Skeleton className="h-5 w-96" />
            <Skeleton className="h-10 w-64" />
            <RequestsTableSkeleton />
        </div>
    );
}

function AdminRequestsContent() {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const tabParam = searchParams.get("tab");
    const tab: RequestTab = tabParam && TAB_URL_TO_INTERNAL[tabParam] ? TAB_URL_TO_INTERNAL[tabParam] : "visits";

    const statusParam = searchParams.get("status") as RequestStatusUrl | null;
    const normalizedStatus =
        statusParam && STATUS_URL_TO_INTERNAL[statusParam] ? STATUS_URL_TO_INTERNAL[statusParam] : undefined;

    const q = searchParams.get("q") ?? "";
    const pageParam = Number(searchParams.get("page") ?? "1");
    const page = Number.isNaN(pageParam) || pageParam < 1 ? 1 : pageParam;

    const [searchInput, setSearchInput] = useState(q);
    const [debouncedSearch, setDebouncedSearch] = useState(q);
    const [requests, setRequests] = useState<(VisitRequestDTO | ReservationRequestDTO)[]>([]);
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedRequest, setSelectedRequest] = useState<RequestSelection | null>(null);
    const [selectedSlot, setSelectedSlot] = useState<string>("");
    const [selectedAgentId, setSelectedAgentId] = useState<string>("");
    const [clientMsg, setClientMsg] = useState("");
    const [agentMsg, setAgentMsg] = useState("");
    const [showDenialFields, setShowDenialFields] = useState(false);
    const [isActionLoading, setIsActionLoading] = useState(false);

    const [agents, setAgents] = useState<User[]>([]);
    const [isAgentsLoading, setIsAgentsLoading] = useState(false);

    const pushParams = useCallback(
        (params: URLSearchParams) => {
            const query = params.toString();
            const nextUrl = query ? `${pathname}?${query}` : pathname;
            const currentQuery = searchParams.toString();
            const currentUrl = currentQuery ? `${pathname}?${currentQuery}` : pathname;
            if (nextUrl !== currentUrl) {
                router.push(nextUrl, { scroll: false });
            }
        },
        [pathname, router, searchParams]
    );

    useEffect(() => {
        setSearchInput(q);
        setDebouncedSearch(q);
    }, [q]);

    useEffect(() => {
        const handler = window.setTimeout(() => setDebouncedSearch(searchInput), 500);
        return () => window.clearTimeout(handler);
    }, [searchInput]);

    useEffect(() => {
        const current = searchParams.get("q") ?? "";
        if (debouncedSearch === current) return;
        const params = new URLSearchParams(searchParams.toString());
        if (debouncedSearch) params.set("q", debouncedSearch);
        else params.delete("q");
        params.set("page", "1");
        pushParams(params);
    }, [debouncedSearch, pushParams, searchParams]);

    const fetchRequests = useCallback(
        async (signal?: AbortSignal) => {
            setIsLoading(true);
            setError(null);
            try {
                const queryParams = new URLSearchParams({
                    type: tab,
                    page: page.toString(),
                });
                if (normalizedStatus) {
                    queryParams.set("status", normalizedStatus);
                }
                if (q) {
                    queryParams.set("q", q);
                }
                const response = await fetch(`/api/admin/requests?${queryParams.toString()}`, {
                    method: "GET",
                    signal,
                });
                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({}));
                    throw new Error(errorData.error || "Não foi possível carregar as solicitações.");
                }
                const data = await response.json();
                if (tab === "visits") {
                    const payload = data as {
                        requests: VisitRequestDTO[];
                        total?: number;
                        totalPages?: number;
                    };
                    setRequests(payload.requests || []);
                    setTotal(payload.total ?? payload.requests?.length ?? 0);
                    setTotalPages(payload.totalPages ?? 1);
                } else {
                    const payload = data as {
                        requests: ReservationRequestDTO[];
                        total?: number;
                        totalPages?: number;
                    };
                    setRequests(payload.requests || []);
                    setTotal(payload.total ?? payload.requests?.length ?? 0);
                    setTotalPages(payload.totalPages ?? 1);
                }
            } catch (err) {
                if (err instanceof DOMException && err.name === "AbortError") {
                    return;
                }
                if (err instanceof Error) {
                    setError(err.message);
                } else {
                    setError("Erro inesperado ao buscar as solicitações.");
                }
            } finally {
                if (!signal?.aborted) {
                    setIsLoading(false);
                }
            }
        },
        [tab, page, normalizedStatus, q]
    );

    useEffect(() => {
        const controller = new AbortController();
        fetchRequests(controller.signal);
        return () => controller.abort();
    }, [fetchRequests]);

    useEffect(() => {
        if (!isModalOpen || selectedRequest?.type !== "visits") return;
        if (agents.length > 0) return;
        const controller = new AbortController();
        (async () => {
            setIsAgentsLoading(true);
            try {
                const response = await fetch("/api/admin/users?role=agent&status=approved&page=1&limit=200", {
                    signal: controller.signal,
                });
                if (!response.ok) {
                    throw new Error("Não foi possível carregar os corretores disponíveis.");
                }
                const data = await response.json();
                setAgents(Array.isArray(data.users) ? data.users : []);
            } catch (err) {
                if (err instanceof DOMException && err.name === "AbortError") return;
                console.error(err);
            } finally {
                if (!controller.signal.aborted) {
                    setIsAgentsLoading(false);
                }
            }
        })();
        return () => controller.abort();
    }, [agents.length, isModalOpen, selectedRequest]);

    const handleTabChange = (value: string) => {
        const nextTab = TAB_URL_TO_INTERNAL[value] ?? "visits";
        const params = new URLSearchParams(searchParams.toString());
        params.set("tab", TAB_INTERNAL_TO_URL[nextTab]);
        params.set("page", "1");
        pushParams(params);
    };

    const handleStatusChange = (urlValue?: RequestStatusUrl) => {
        const params = new URLSearchParams(searchParams.toString());
        if (urlValue) params.set("status", urlValue);
        else params.delete("status");
        params.set("page", "1");
        pushParams(params);
    };

    const handlePageChange = (newPage: number) => {
        if (newPage < 1 || newPage > totalPages || newPage === page) return;
        const params = new URLSearchParams(searchParams.toString());
        params.set("page", newPage.toString());
        pushParams(params);
    };

    const activeStatusUrl = normalizedStatus ? STATUS_INTERNAL_TO_URL[normalizedStatus] : undefined;

    const typedRequests = useMemo(() => {
        return tab === "visits" ? (requests as VisitRequestDTO[]) : (requests as ReservationRequestDTO[]);
    }, [requests, tab]);

    const openModal = (request: VisitRequestDTO | ReservationRequestDTO) => {
        if (tab === "visits") {
            const visitRequest = request as VisitRequestDTO;
            setSelectedRequest({ type: "visits", data: visitRequest });
            setSelectedSlot(visitRequest.scheduledSlot ?? "");
            setSelectedAgentId("");
        } else {
            const reservationRequest = request as ReservationRequestDTO;
            setSelectedRequest({ type: "reservations", data: reservationRequest });
            setSelectedSlot("");
            setSelectedAgentId("");
        }
        setClientMsg("");
        setAgentMsg("");
        setShowDenialFields(false);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setSelectedRequest(null);
        setSelectedSlot("");
        setSelectedAgentId("");
        setClientMsg("");
        setAgentMsg("");
        setShowDenialFields(false);
        setIsActionLoading(false);
    };

    const handleModalOpenChange = (open: boolean) => {
        if (!open) {
            closeModal();
        } else {
            setIsModalOpen(true);
        }
    };

    const handleApproveVisit = async () => {
        if (!selectedRequest || selectedRequest.type !== "visits") return;
        if (!selectedSlot || !selectedAgentId) return;
        setIsActionLoading(true);
        const promise = new Promise(async (resolve, reject) => {
            try {
                const response = await fetch(`/api/admin/requests/visits/${selectedRequest.data.id}/action`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        action: "approve",
                        scheduledSlot: selectedSlot,
                        agentId: selectedAgentId,
                    }),
                });
                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({}));
                    throw new Error(errorData.error || "Erro ao aprovar a visita.");
                }
                await fetchRequests();
                closeModal();
                resolve("Visita aprovada com sucesso.");
            } catch (err) {
                reject(err);
            } finally {
                setIsActionLoading(false);
            }
        });

        notifyPromise(promise, {
            loading: "Aprovando visita...",
            success: message => String(message),
            error: error => (error instanceof Error ? error.message : "Erro ao aprovar visita."),
        });
    };

    const handleDenyVisit = async () => {
        if (!selectedRequest || selectedRequest.type !== "visits") return;
        if (!showDenialFields) {
            setShowDenialFields(true);
            return;
        }
        if (!clientMsg.trim()) {
            return;
        }
        setIsActionLoading(true);
        const promise = new Promise(async (resolve, reject) => {
            try {
                const response = await fetch(`/api/admin/requests/visits/${selectedRequest.data.id}/action`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        action: "deny",
                        clientMsg,
                        agentMsg,
                    }),
                });
                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({}));
                    throw new Error(errorData.error || "Erro ao negar a visita.");
                }
                await fetchRequests();
                closeModal();
                resolve("Visita negada com sucesso.");
            } catch (err) {
                reject(err);
            } finally {
                setIsActionLoading(false);
            }
        });

        notifyPromise(promise, {
            loading: "Negando visita...",
            success: message => String(message),
            error: error => (error instanceof Error ? error.message : "Erro ao negar visita."),
        });
    };

    const handleApproveReservation = async () => {
        if (!selectedRequest || selectedRequest.type !== "reservations") return;
        setIsActionLoading(true);
        const promise = new Promise(async (resolve, reject) => {
            try {
                const response = await fetch(`/api/admin/requests/reservations/${selectedRequest.data.id}/action`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ action: "approve" }),
                });
                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({}));
                    throw new Error(errorData.error || "Erro ao aprovar a reserva.");
                }
                await fetchRequests();
                closeModal();
                resolve("Reserva aprovada com sucesso.");
            } catch (err) {
                reject(err);
            } finally {
                setIsActionLoading(false);
            }
        });

        notifyPromise(promise, {
            loading: "Aprovando reserva...",
            success: message => String(message),
            error: error => (error instanceof Error ? error.message : "Erro ao aprovar reserva."),
        });
    };

    const handleDenyReservation = async () => {
        if (!selectedRequest || selectedRequest.type !== "reservations") return;
        if (!showDenialFields) {
            setShowDenialFields(true);
            return;
        }
        if (!clientMsg.trim()) {
            return;
        }
        setIsActionLoading(true);
        const promise = new Promise(async (resolve, reject) => {
            try {
                const response = await fetch(`/api/admin/requests/reservations/${selectedRequest.data.id}/action`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        action: "deny",
                        clientMsg,
                        agentMsg,
                    }),
                });
                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({}));
                    throw new Error(errorData.error || "Erro ao negar a reserva.");
                }
                await fetchRequests();
                closeModal();
                resolve("Reserva negada com sucesso.");
            } catch (err) {
                reject(err);
            } finally {
                setIsActionLoading(false);
            }
        });

        notifyPromise(promise, {
            loading: "Negando reserva...",
            success: message => String(message),
            error: error => (error instanceof Error ? error.message : "Erro ao negar reserva."),
        });
    };

    const renderTableBody = () => {
        if (isLoading) {
            return <RequestsTableSkeleton />;
        }

        if (error) {
            return <p className="text-sm text-red-500">{error}</p>;
        }

        if (typedRequests.length === 0) {
            return <p className="text-sm text-muted-foreground">Nenhuma solicitação encontrada.</p>;
        }

        if (tab === "visits") {
            const visitRequests = typedRequests as VisitRequestDTO[];
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
                            const statusInfo = STATUS_BADGE_MAP[request.status] ?? STATUS_BADGE_MAP.pending;
                            return (
                                <TableRow key={request.id}>
                                    <TableCell>{request.client.fullName}</TableCell>
                                    <TableCell>{request.property.name}</TableCell>
                                    <TableCell className="hidden md:table-cell">
                                        {formatDateTime(request.createdAt)}
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="outline" size="sm" onClick={() => openModal(request)}>
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

        const reservationRequests = typedRequests as ReservationRequestDTO[];
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
                        const statusInfo = STATUS_BADGE_MAP[request.status] ?? STATUS_BADGE_MAP.pending;
                        return (
                            <TableRow key={request.id}>
                                <TableCell>{request.client.fullName}</TableCell>
                                <TableCell>{request.property.name}</TableCell>
                                <TableCell className="hidden lg:table-cell">
                                    {request.unit.identifier} · Bloco {request.unit.block}
                                </TableCell>
                                <TableCell className="hidden md:table-cell">
                                    {formatDateTime(request.createdAt)}
                                </TableCell>
                                <TableCell>
                                    <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                    <Button variant="outline" size="sm" onClick={() => openModal(request)}>
                                        Analisar
                                    </Button>
                                </TableCell>
                            </TableRow>
                        );
                    })}
                </TableBody>
            </Table>
        );
    };

    return (
        <div className="min-h-screen container mx-auto px-4 py-20 space-y-6">
            <div className="space-y-2">
                <h1 className="text-3xl font-bold">Gerenciamento de Visitas e Reservas</h1>
                <p className="text-muted-foreground">
                    Controle e processe solicitações de visita e reserva diretamente pelo painel administrativo.
                </p>
            </div>

            <Tabs value={TAB_INTERNAL_TO_URL[tab]} onValueChange={handleTabChange}>
                <TabsList>
                    <TabsTrigger value="visitas">Solicitações de Visita</TabsTrigger>
                    <TabsTrigger value="reservas">Solicitações de Reserva</TabsTrigger>
                </TabsList>
            </Tabs>

            <Card>
                <CardHeader className="space-y-1">
                    <CardTitle>{tab === "visits" ? "Solicitações de visita" : "Solicitações de reserva"}</CardTitle>
                    <p className="text-sm text-muted-foreground">
                        {total > 0
                            ? `Mostrando ${Math.min(ITEMS_PER_PAGE_LABEL, typedRequests.length)} de ${total} registros`
                            : "Use os filtros para localizar rapidamente as solicitações desejadas."}
                    </p>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                        <div className="relative w-full md:max-w-sm">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Buscar por cliente ou imóvel..."
                                className="pl-8"
                                value={searchInput}
                                onChange={event => setSearchInput(event.target.value)}
                            />
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {STATUS_FILTER_OPTIONS.map(option => {
                                const isActive =
                                    option.urlValue === activeStatusUrl || (!option.urlValue && !activeStatusUrl);
                                return (
                                    <Button
                                        key={option.label}
                                        variant={isActive ? "default" : "outline"}
                                        size="sm"
                                        onClick={() => handleStatusChange(option.urlValue)}
                                    >
                                        {option.label}
                                    </Button>
                                );
                            })}
                        </div>
                    </div>

                    {renderTableBody()}

                    {totalPages > 1 && !isLoading && (
                        <Pagination>
                            <PaginationContent>
                                <PaginationItem>
                                    <PaginationPrevious
                                        href="#"
                                        onClick={event => {
                                            event.preventDefault();
                                            handlePageChange(page - 1);
                                        }}
                                        className={page <= 1 ? "pointer-events-none opacity-50" : ""}
                                    />
                                </PaginationItem>
                                {Array.from({ length: totalPages }).map((_, index) => (
                                    <PaginationItem key={index}>
                                        <PaginationLink
                                            href="#"
                                            onClick={event => {
                                                event.preventDefault();
                                                handlePageChange(index + 1);
                                            }}
                                            isActive={page === index + 1}
                                        >
                                            {index + 1}
                                        </PaginationLink>
                                    </PaginationItem>
                                ))}
                                <PaginationItem>
                                    <PaginationNext
                                        href="#"
                                        onClick={event => {
                                            event.preventDefault();
                                            handlePageChange(page + 1);
                                        }}
                                        className={page >= totalPages ? "pointer-events-none opacity-50" : ""}
                                    />
                                </PaginationItem>
                            </PaginationContent>
                        </Pagination>
                    )}
                </CardContent>
            </Card>

            <Dialog open={isModalOpen} onOpenChange={handleModalOpenChange}>
                {selectedRequest && (
                    <DialogContent className="max-w-2xl">
                        <DialogHeader>
                            <DialogTitle>
                                {selectedRequest.type === "visits"
                                    ? "Análise da solicitação de visita"
                                    : "Análise da solicitação de reserva"}
                            </DialogTitle>
                            <DialogDescription>
                                {`Solicitação criada em ${formatDateTime(selectedRequest.data.createdAt)}.`}
                            </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-6">
                            <div className="grid gap-4 md:grid-cols-2">
                                <InfoField label="Cliente" value={selectedRequest.data.client.fullName} />
                                <InfoField label="Imóvel" value={selectedRequest.data.property.name} />
                                <InfoField
                                    label="Unidade"
                                    value={`${selectedRequest.data.unit.identifier} · Bloco ${selectedRequest.data.unit.block}`}
                                />
                                <InfoField
                                    label="Status atual"
                                    value={STATUS_BADGE_MAP[selectedRequest.data.status]?.label}
                                />
                            </div>

                            {selectedRequest.type === "visits" && (
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                            Horários solicitados
                                        </p>
                                        {selectedRequest.data.requestedSlots.length > 0 ? (
                                            <div className="flex flex-wrap gap-2">
                                                {selectedRequest.data.requestedSlots.map(slot => (
                                                    <Badge key={slot} variant="outline">
                                                        {formatDateTime(slot)}
                                                    </Badge>
                                                ))}
                                            </div>
                                        ) : (
                                            <p className="text-sm text-muted-foreground">
                                                Nenhum horário sugerido pelo cliente.
                                            </p>
                                        )}
                                    </div>

                                    <div className="grid gap-4 md:grid-cols-2">
                                        <div className="space-y-2">
                                            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                                Horário final da visita
                                            </p>
                                            <Select
                                                value={selectedSlot}
                                                onValueChange={setSelectedSlot}
                                                disabled={
                                                    isActionLoading || selectedRequest.data.requestedSlots.length === 0
                                                }
                                            >
                                                <SelectTrigger className="w-full justify-between">
                                                    <SelectValue placeholder="Selecione o horário" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {selectedRequest.data.requestedSlots.map(slot => (
                                                        <SelectItem key={slot} value={slot}>
                                                            {formatDateTime(slot)}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="space-y-2">
                                            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                                Atribuir corretor
                                            </p>
                                            <Select
                                                value={selectedAgentId}
                                                onValueChange={setSelectedAgentId}
                                                disabled={isActionLoading || isAgentsLoading || agents.length === 0}
                                            >
                                                <SelectTrigger className="w-full justify-between">
                                                    <SelectValue
                                                        placeholder={
                                                            isAgentsLoading
                                                                ? "Carregando corretores..."
                                                                : agents.length > 0
                                                                  ? "Selecione o corretor"
                                                                  : "Nenhum corretor disponível"
                                                        }
                                                    />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {agents
                                                        .filter(agent => agent.id)
                                                        .map(agent => (
                                                            <SelectItem key={agent.id} value={agent.id as string}>
                                                                {agent.fullName}
                                                            </SelectItem>
                                                        ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {selectedRequest.type === "reservations" && (
                                <div className="space-y-4">
                                    <div className="grid gap-4 md:grid-cols-2">
                                        <InfoField label="Telefone" value={selectedRequest.data.client.phone} />
                                        <InfoField label="CPF" value={selectedRequest.data.client.cpf} />
                                        <InfoField label="RG" value={selectedRequest.data.client.rg} />
                                        <InfoField label="Endereço" value={selectedRequest.data.client.address} />
                                    </div>
                                    <div className="space-y-3">
                                        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                            Documentos enviados
                                        </p>
                                        {DOCUMENT_GROUPS.map(group => {
                                            const value = selectedRequest.data.client[group.key];
                                            if (!Array.isArray(value)) return null;
                                            return (
                                                <div key={group.key.toString()} className="space-y-1">
                                                    <p className="text-sm font-semibold text-foreground">
                                                        {group.label}
                                                    </p>
                                                    {value.length > 0 ? (
                                                        <ul className="list-inside list-disc space-y-1">
                                                            {value.map((url, index) => (
                                                                <li key={`${group.key}-${index}`} className="text-sm">
                                                                    <a
                                                                        href={url}
                                                                        target="_blank"
                                                                        rel="noreferrer"
                                                                        className="inline-flex items-center gap-1 text-primary underline-offset-2 hover:underline"
                                                                    >
                                                                        Documento {index + 1}
                                                                        <ExternalLink className="h-3.5 w-3.5" />
                                                                    </a>
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    ) : (
                                                        <p className="text-sm text-muted-foreground">
                                                            Nenhum documento enviado.
                                                        </p>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {showDenialFields && (
                                <div className="grid gap-4">
                                    <div className="space-y-2">
                                        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                            Mensagem para o cliente
                                        </p>
                                        <Textarea
                                            value={clientMsg}
                                            onChange={event => setClientMsg(event.target.value)}
                                            placeholder="Explique ao cliente o motivo da decisão."
                                            rows={4}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                            Mensagem para o corretor
                                        </p>
                                        <Textarea
                                            value={agentMsg}
                                            onChange={event => setAgentMsg(event.target.value)}
                                            placeholder="Informe o corretor sobre os próximos passos (opcional)."
                                            rows={3}
                                        />
                                    </div>
                                </div>
                            )}
                        </div>

                        <DialogFooter className="sm:justify-between">
                            <DialogClose asChild>
                                <Button variant="outline" disabled={isActionLoading}>
                                    Cancelar
                                </Button>
                            </DialogClose>
                            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
                                {selectedRequest.type === "visits" ? (
                                    <>
                                        <Button
                                            variant="outline"
                                            className="border-destructive text-destructive hover:bg-destructive hover:text-white"
                                            onClick={handleDenyVisit}
                                            disabled={isActionLoading || (showDenialFields && !clientMsg.trim())}
                                        >
                                            {isActionLoading && showDenialFields ? (
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            ) : null}
                                            Negar visita
                                        </Button>
                                        <Button
                                            onClick={handleApproveVisit}
                                            disabled={
                                                isActionLoading || !selectedSlot || !selectedAgentId || isAgentsLoading
                                            }
                                        >
                                            {isActionLoading && !showDenialFields ? (
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            ) : null}
                                            Aprovar visita
                                        </Button>
                                    </>
                                ) : (
                                    <>
                                        <Button
                                            variant="outline"
                                            className="border-destructive text-destructive hover:bg-destructive hover:text-white"
                                            onClick={handleDenyReservation}
                                            disabled={isActionLoading || (showDenialFields && !clientMsg.trim())}
                                        >
                                            {isActionLoading && showDenialFields ? (
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            ) : null}
                                            Negar reserva
                                        </Button>
                                        <Button onClick={handleApproveReservation} disabled={isActionLoading}>
                                            {isActionLoading && !showDenialFields ? (
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            ) : null}
                                            Aprovar reserva
                                        </Button>
                                    </>
                                )}
                            </div>
                        </DialogFooter>
                    </DialogContent>
                )}
            </Dialog>
        </div>
    );
}

export default function AdminRequestsPage() {
    return (
        <Suspense fallback={<PageSkeleton />}>
            <AdminRequestsContent />
        </Suspense>
    );
}
