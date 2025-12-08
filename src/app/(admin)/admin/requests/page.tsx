"use client";

import {
    ITEMS_PER_PAGE_LABEL,
    RequestStatusUrl,
    RequestTab,
    STATUS_INTERNAL_TO_URL,
    STATUS_URL_TO_INTERNAL,
    TAB_INTERNAL_TO_URL,
    TAB_URL_TO_INTERNAL,
} from "@/components/specifics/admin/requests/constants";
import { RequestFilters } from "@/components/specifics/admin/requests/filters";
import { ReservationDocumentsGallery } from "@/components/specifics/admin/requests/reservation-documents-gallery";
import { RequestReviewDialog, RequestSelection } from "@/components/specifics/admin/requests/review-dialog";
import { PageSkeleton } from "@/components/specifics/admin/requests/skeletons";
import { RequestsTable } from "@/components/specifics/admin/requests/table";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Pagination,
    PaginationContent,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from "@/components/ui/pagination";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ReservationRequestListItem, VisitRequestListItem } from "@/interfaces/adminRequestsResponse";
import { User } from "@/interfaces/user";
import { notifyPromise } from "@/services/notificationService";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useMemo, useState } from "react";

function AdminRequestsContent() {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    // URL state (source of truth)
    const tabParam = searchParams.get("tab") || undefined; // visitas | reservas
    const tab: RequestTab = tabParam && TAB_URL_TO_INTERNAL[tabParam] ? TAB_URL_TO_INTERNAL[tabParam] : "visits";

    const statusParam = (searchParams.get("status") as RequestStatusUrl | null) || null; // pendente|aprovada|negada
    const normalizedStatus = statusParam ? STATUS_URL_TO_INTERNAL[statusParam] : undefined; // pending|approved|denied

    const q = searchParams.get("q") ?? "";
    const pageParam = Number(searchParams.get("page") ?? "1");
    const page = Number.isNaN(pageParam) || pageParam < 1 ? 1 : pageParam;

    // Local UI state
    const [searchInput, setSearchInput] = useState(q);
    const [debouncedSearch, setDebouncedSearch] = useState(q);
    const [requests, setRequests] = useState<Array<VisitRequestListItem | ReservationRequestListItem>>([]);
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedRequest, setSelectedRequest] = useState<RequestSelection | null>(null);
    const [selectedSlot, setSelectedSlot] = useState("");
    const [selectedAgentId, setSelectedAgentId] = useState("");
    const [clientMsg, setClientMsg] = useState("");
    const [agentMsg, setAgentMsg] = useState("");
    const [isActionLoading, setIsActionLoading] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [requestToDelete, setRequestToDelete] = useState<VisitRequestListItem | ReservationRequestListItem | null>(
        null
    );
    const [isDeleting, setIsDeleting] = useState(false);

    // Agents (for visit approval)
    const [agents, setAgents] = useState<User[]>([]);
    const [isAgentsLoading, setIsAgentsLoading] = useState(false);

    const [docsOpen, setDocsOpen] = useState(false);
    const [docSections, setDocSections] = useState<{ title: string; items: string[] }[]>([]);

    // Helper to push URL params without scroll jump
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
                const queryParams = new URLSearchParams({ type: tab, page: String(page) });
                if (normalizedStatus) queryParams.set("status", normalizedStatus);
                if (q) queryParams.set("q", q);

                const res = await fetch(`/api/admin/requests?${queryParams.toString()}`, { method: "GET", signal });
                if (!res.ok) {
                    const errData = await res.json().catch(() => ({}));
                    throw new Error(errData.error || "Não foi possível carregar as solicitações.");
                }
                const data = (await res.json()) as {
                    requests: Array<VisitRequestListItem | ReservationRequestListItem>;
                    total?: number;
                    totalPages?: number;
                };
                setRequests(data.requests || []);
                setTotal(data.total ?? data.requests?.length ?? 0);
                setTotalPages(data.totalPages ?? 1);
            } catch (err) {
                if (err instanceof DOMException && err.name === "AbortError") return;
                if (err instanceof Error) setError(err.message);
                else setError("Erro inesperado ao buscar as solicitações.");
            } finally {
                if (!signal?.aborted) setIsLoading(false);
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
        if (!isModalOpen) return;
        if (agents.length > 0) return;
        const controller = new AbortController();
        (async () => {
            setIsAgentsLoading(true);
            try {
                const res = await fetch("/api/admin/users?role=agent&status=approved&page=1&limit=200", {
                    signal: controller.signal,
                });
                if (!res.ok) throw new Error("Não foi possível carregar os corretores disponíveis.");
                const data = await res.json();
                setAgents(Array.isArray(data.users) ? data.users : []);
            } catch (e) {
                if (e instanceof DOMException && e.name === "AbortError") return;
                console.error(e);
            } finally {
                if (!controller.signal.aborted) setIsAgentsLoading(false);
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
        params.set("page", String(newPage));
        pushParams(params);
    };

    const openDocs = (request: ReservationRequestListItem) => {
        const sections: { title: string; items: string[] }[] = [];
        const push = (title: string, items?: string[]) => {
            if (items && items.length) sections.push({ title, items });
        };

        push("Documentos de identidade", request.client.identityDoc);
        push("Comprovantes de renda", request.client.incomeProof);
        push("Comprovantes de endereço", request.client.addressProof);
        push("Certidões", request.client.bmCert);

        setDocSections(sections);
        setDocsOpen(true);
    };

    const activeStatusUrl = normalizedStatus ? STATUS_INTERNAL_TO_URL[normalizedStatus] : undefined;

    const openModal = (request: VisitRequestListItem | ReservationRequestListItem) => {
        if (tab === "visits") {
            const visit = request as VisitRequestListItem;
            setSelectedRequest({ type: "visits", data: visit });
            setSelectedSlot(visit.scheduledSlot ?? "");
        } else {
            const resv = request as ReservationRequestListItem;
            setSelectedRequest({ type: "reservations", data: resv });
            setSelectedSlot("");
        }
        setSelectedAgentId("");
        setClientMsg("");
        setAgentMsg("");
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setSelectedRequest(null);
        setSelectedSlot("");
        setSelectedAgentId("");
        setClientMsg("");
        setAgentMsg("");
        setIsActionLoading(false);
    };

    const handleDeleteRequest = (request: VisitRequestListItem | ReservationRequestListItem) => {
        setRequestToDelete(request);
        setIsDeleteModalOpen(true);
    };

    const confirmDeleteRequest = async () => {
        if (!requestToDelete) return;
        const type = tab === "visits" ? "visits" : "reservations";
        const label = type === "visits" ? "visita" : "reserva";

        setIsDeleting(true);
        const promise = async () => {
            const res = await fetch(`/api/admin/requests/${type}/${requestToDelete.id}`, { method: "DELETE" });
            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                throw new Error(errData.error || "Erro ao excluir solicitação.");
            }
            await fetchRequests();
            if (selectedRequest?.data.id === requestToDelete.id) {
                closeModal();
            }
            setRequestToDelete(null);
            setIsDeleteModalOpen(false);
            return `Solicitação de ${label} excluída com sucesso.`;
        };

        const promiseResult = promise();

        notifyPromise(promiseResult, {
            loading: "Excluindo solicitação...",
            success: message => `${message}`,
            error: e => (e instanceof Error ? e.message : "Erro ao excluir solicitação."),
        });

        promiseResult.finally(() => setIsDeleting(false));
    };

    const handleModalOpenChange = (open: boolean) => {
        if (!open) closeModal();
        else setIsModalOpen(true);
    };

    const handleApproveVisit = async () => {
        if (!selectedRequest || selectedRequest.type !== "visits") return;
        if (selectedRequest.data.status !== "pending") return;
        if (!selectedSlot || !selectedAgentId) return;
        setIsActionLoading(true);
        const promise = new Promise<string>(async (resolve, reject) => {
            try {
                const response = await fetch(`/api/admin/requests/visits/${selectedRequest.data.id}/action`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        action: "approve",
                        scheduledSlot: selectedSlot,
                        agentId: selectedAgentId,
                        agentMsg,
                        clientMsg,
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
            success: m => String(m),
            error: e => (e instanceof Error ? e.message : "Erro ao aprovar visita."),
        });
    };

    const handleDenyVisit = async () => {
        if (!selectedRequest || selectedRequest.type !== "visits") return;
        if (selectedRequest.data.status !== "pending") return; // read-only guard
        if (!clientMsg.trim()) return;
        setIsActionLoading(true);
        const promise = new Promise<string>(async (resolve, reject) => {
            try {
                const response = await fetch(`/api/admin/requests/visits/${selectedRequest.data.id}/action`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ action: "deny", clientMsg }),
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
            success: m => String(m),
            error: e => (e instanceof Error ? e.message : "Erro ao negar visita."),
        });
    };

    // Actions: reservations
    const handleApproveReservation = async () => {
        if (!selectedRequest || selectedRequest.type !== "reservations") return;
        if (selectedRequest.data.status !== "pending") return; // read-only guard
        setIsActionLoading(true);
        const promise = new Promise<string>(async (resolve, reject) => {
            try {
                const response = await fetch(`/api/admin/requests/reservations/${selectedRequest.data.id}/action`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ action: "approve", clientMsg, agentMsg, agentId: selectedAgentId }),
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
            success: m => String(m),
            error: e => (e instanceof Error ? e.message : "Erro ao aprovar reserva."),
        });
    };

    const handleDenyReservation = async () => {
        if (!selectedRequest || selectedRequest.type !== "reservations") return;
        if (selectedRequest.data.status !== "pending") return; // read-only guard
        if (!clientMsg.trim()) return;
        setIsActionLoading(true);
        const promise = new Promise<string>(async (resolve, reject) => {
            try {
                const response = await fetch(`/api/admin/requests/reservations/${selectedRequest.data.id}/action`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ action: "deny", clientMsg }),
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
            success: m => String(m),
            error: e => (e instanceof Error ? e.message : "Erro ao negar reserva."),
        });
    };

    // Post-approval actions: visits
    const handleCompleteVisit = async () => {
        if (!selectedRequest || selectedRequest.type !== "visits") return;
        if (selectedRequest.data.status !== "approved") return;
        setIsActionLoading(true);
        const promise = new Promise<string>(async (resolve, reject) => {
            try {
                const response = await fetch(`/api/admin/requests/visits/${selectedRequest.data.id}/action`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ action: "complete" }),
                });
                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({}));
                    throw new Error(errorData.error || "Erro ao concluir a visita.");
                }
                await fetchRequests();
                closeModal();
                resolve("Visita marcada como concluída.");
            } catch (err) {
                reject(err);
            } finally {
                setIsActionLoading(false);
            }
        });
        notifyPromise(promise, {
            loading: "Marcando como concluída...",
            success: m => String(m),
            error: e => (e instanceof Error ? e.message : "Erro ao concluir visita."),
        });
    };

    // Post-approval actions: reservations
    const handleCompleteReservation = async () => {
        if (!selectedRequest || selectedRequest.type !== "reservations") return;
        if (selectedRequest.data.status !== "approved") return;
        setIsActionLoading(true);
        const promise = new Promise<string>(async (resolve, reject) => {
            try {
                const response = await fetch(`/api/admin/requests/reservations/${selectedRequest.data.id}/action`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ action: "complete" }),
                });
                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({}));
                    throw new Error(errorData.error || "Erro ao concluir a reserva.");
                }
                await fetchRequests();
                closeModal();
                resolve("Reserva marcada como concluída.");
            } catch (err) {
                reject(err);
            } finally {
                setIsActionLoading(false);
            }
        });
        notifyPromise(promise, {
            loading: "Marcando como concluída...",
            success: m => String(m),
            error: e => (e instanceof Error ? e.message : "Erro ao concluir reserva."),
        });
    };

    const typedRequests = useMemo(
        () => (tab === "visits" ? (requests as VisitRequestListItem[]) : (requests as ReservationRequestListItem[])),
        [requests, tab]
    );

    return (
        <div className="min-h-screen container mx-auto px-4 py-20 space-y-6">
            <div className="space-y-2">
                <h1 className="text-3xl font-bold">Gerenciamento de Visitas e Reservas</h1>
                <p className="text-muted-foreground">Controle e processe solicitações de visita e reserva.</p>
            </div>

            <Tabs value={TAB_INTERNAL_TO_URL[tab]} onValueChange={handleTabChange}>
                <TabsList>
                    <TabsTrigger className="cursor-pointer" value="visitas">
                        Solicitações de Visita
                    </TabsTrigger>
                    <TabsTrigger className="cursor-pointer" value="reservas">
                        Solicitações de Reserva
                    </TabsTrigger>
                </TabsList>
            </Tabs>

            <Card className="py-6">
                <CardHeader className="space-y-1">
                    <CardTitle>{tab === "visits" ? "Solicitações de visita" : "Solicitações de reserva"}</CardTitle>
                    <p className="text-sm text-muted-foreground">
                        {total > 0
                            ? `Mostrando ${Math.min(ITEMS_PER_PAGE_LABEL, typedRequests.length)} de ${total} registros`
                            : "Use os filtros para localizar rapidamente as solicitações desejadas."}
                    </p>
                </CardHeader>
                <CardContent className="space-y-6">
                    <RequestFilters
                        searchValue={searchInput}
                        onSearchChange={setSearchInput}
                        onStatusChange={handleStatusChange}
                        activeStatus={activeStatusUrl}
                    />

                    <RequestsTable
                        type={tab}
                        requests={typedRequests}
                        isLoading={isLoading}
                        error={error}
                        onAnalyze={openModal}
                        onViewDocs={openDocs}
                        onDelete={handleDeleteRequest}
                    />

                    {totalPages > 1 && !isLoading && (
                        <Pagination>
                            <PaginationContent>
                                <PaginationItem>
                                    <PaginationPrevious
                                        href="#"
                                        onClick={e => {
                                            e.preventDefault();
                                            handlePageChange(page - 1);
                                        }}
                                        className={page <= 1 ? "pointer-events-none opacity-50" : ""}
                                    />
                                </PaginationItem>
                                {Array.from({ length: totalPages }).map((_, index) => (
                                    <PaginationItem key={index}>
                                        <PaginationLink
                                            href="#"
                                            onClick={e => {
                                                e.preventDefault();
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
                                        onClick={e => {
                                            e.preventDefault();
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

            <RequestReviewDialog
                open={isModalOpen}
                request={selectedRequest}
                onOpenChange={handleModalOpenChange}
                isActionLoading={isActionLoading}
                clientMsg={clientMsg}
                agentMsg={agentMsg}
                selectedSlot={selectedSlot}
                selectedAgentId={selectedAgentId}
                agents={agents}
                isAgentsLoading={isAgentsLoading}
                onClientMsgChange={e => setClientMsg(e.target.value)}
                onAgentMsgChange={e => setAgentMsg(e.target.value)}
                onSlotChange={setSelectedSlot}
                onAgentChange={setSelectedAgentId}
                onDenyVisit={handleDenyVisit}
                onApproveVisit={handleApproveVisit}
                onDenyReservation={handleDenyReservation}
                onApproveReservation={handleApproveReservation}
                onCompleteVisit={handleCompleteVisit}
                onCompleteReservation={handleCompleteReservation}
            />
            <AlertDialog
                open={isDeleteModalOpen}
                onOpenChange={open => {
                    setIsDeleteModalOpen(open);
                    if (!open) setRequestToDelete(null);
                }}
            >
                <AlertDialogContent className="w-[95vw] max-w-md p-4 sm:p-6">
                    <AlertDialogHeader>
                        <AlertDialogTitle>Excluir solicitação?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Esta ação é permanente e removerá a solicitação de {tab === "visits" ? "visita" : "reserva"}
                            {requestToDelete ? ` para ${requestToDelete.property.name}` : ""}.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="flex flex-col-reverse sm:flex-row gap-2">
                        <AlertDialogCancel disabled={isDeleting} className="cursor-pointer w-full sm:w-auto">
                            Cancelar
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={confirmDeleteRequest}
                            disabled={isDeleting}
                            className="bg-destructive hover:bg-destructive/90 cursor-pointer w-full sm:w-auto"
                        >
                            {isDeleting ? "Removendo..." : "Remover"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
            <ReservationDocumentsGallery open={docsOpen} sections={docSections} onClose={() => setDocsOpen(false)} />
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
