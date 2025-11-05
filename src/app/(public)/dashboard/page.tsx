"use client";

import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/use-auth";
import { ReservationRequest } from "@/interfaces/reservationRequest";
import { VisitRequest } from "@/interfaces/visitRequest";
import { Building2, Calendar, CheckCircle2, Clock, Inbox, Loader2, User2, XCircle } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

interface RequestItemProps {
    request: VisitRequest | ReservationRequest;
    onClick: () => void;
}

function RequestItem({ request, onClick }: RequestItemProps) {
    const getStatusMeta = (status: string) => {
        const s = status.toLowerCase();
        if (s === "approved" || s === "completed" || s === "confirmado") {
            return {
                Icon: CheckCircle2,
                classes: "border-emerald-300 text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40",
            };
        }
        if (s === "pending" || s === "aguardo") {
            return {
                Icon: Clock,
                classes: "border-amber-300 text-amber-700 bg-amber-50 dark:bg-amber-950/40",
            };
        }
        if (s === "denied" || s === "recusado") {
            return {
                Icon: XCircle,
                classes: "border-rose-300 text-rose-700 bg-rose-50 dark:bg-rose-950/40",
            };
        }
        return { Icon: Clock, classes: "" };
    };

    const getStatusLabel = (status: string) => {
        const s = status.toLowerCase();
        if (s === "pending" || s === "aguardo") return "pendente";
        if (s === "approved" || s === "confirmado") return "aprovado";
        if (s === "completed") return "concluída";
        if (s === "denied" || s === "recusado") return "recusado";
        return status;
    };

    const coerceDate = (val: unknown): Date | undefined => {
        if (!val) return undefined;
        if (val instanceof Date) return val;
        // Firestore Timestamp-like object
        if (typeof val === "object" && val !== null && "toDate" in (val as Record<string, unknown>)) {
            try {
                const ts = val as unknown as { toDate: () => Date };
                const d = ts.toDate();
                if (d instanceof Date && !isNaN(d.getTime())) return d;
            } catch {}
        }
        if (typeof val === "string") {
            const t = Date.parse(val);
            if (!Number.isNaN(t)) return new Date(t);
        }
        if (typeof val === "number") return new Date(val);
        return undefined;
    };

    const formatDate = (date: unknown): string => {
        const d = coerceDate(date);
        if (!d) return "N/A";
        return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
    };

    const propertyName = request.property?.name ?? "Nome indisponível";
    const unitIdentifier = request.unit?.identifier ?? "N/A";
    const unitBlock = request.unit?.block ? `Bloco ${request.unit.block}` : "";

    const isVisit = "requestedSlots" in request;

    const formatDateTime = (date: unknown): string => {
        const d = coerceDate(date);
        if (!d) return "N/A";
        return d.toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
    };

    const requestedSlots = isVisit ? ((request as VisitRequest).requestedSlots ?? []) : [];
    const scheduledSlot = isVisit ? (request as VisitRequest).scheduledSlot : undefined;
    const agent =
        isVisit && (request.status === "approved" || request.status === "completed") && request.agents?.length
            ? request.agents[0]
            : null;

    return (
        <Card
            className="w-full cursor-pointer transition-colors border bg-card hover:bg-muted/50 rounded-xl shadow-sm"
            onClick={onClick}
        >
            <CardHeader className="flex flex-col gap-1 space-y-0 pb-3">
                <div className="flex items-center justify-between gap-3">
                    <CardTitle className="text-base font-semibold truncate">{propertyName}</CardTitle>
                    {(() => {
                        const { Icon, classes } = getStatusMeta(request.status);
                        return (
                            <Badge
                                variant="outline"
                                className={`capitalize inline-flex items-center gap-1.5 ${classes}`}
                            >
                                <Icon className="h-3.5 w-3.5" /> {getStatusLabel(request.status)}
                            </Badge>
                        );
                    })()}
                </div>
                <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                        <Building2 className="h-3.5 w-3.5" />
                        <span className="truncate">
                            {unitBlock}
                            {unitBlock && unitIdentifier ? " • " : ""}
                            {unitIdentifier}
                        </span>
                    </span>
                    <span className="inline-flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" /> Solicitado em: {formatDate(request.createdAt)}
                    </span>
                </div>
            </CardHeader>
            <CardContent className="pt-0">
                <div className="flex flex-col gap-2 text-sm">
                    {isVisit && (
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                            <div className="flex items-start sm:items-center gap-2">
                                <Calendar className="h-4 w-4 mt-0.5 text-muted-foreground" />
                                <div className="flex flex-wrap gap-1.5">
                                    {requestedSlots.slice(0, 3).map((slot, idx) => (
                                        <Tooltip key={idx}>
                                            <TooltipTrigger asChild>
                                                <Badge variant="outline" className="font-normal">
                                                    {formatDateTime(slot)}
                                                </Badge>
                                            </TooltipTrigger>
                                            <TooltipContent>Horário solicitado: {formatDateTime(slot)}</TooltipContent>
                                        </Tooltip>
                                    ))}
                                    {requestedSlots.length > 3 && (
                                        <Badge variant="secondary">+{requestedSlots.length - 3}</Badge>
                                    )}
                                </div>
                            </div>
                            {scheduledSlot && (
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <div className="inline-flex items-center gap-2 rounded-md bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1.5 text-emerald-700 dark:text-emerald-300">
                                            <Clock className="h-4 w-4" />
                                            <span className="text-xs sm:text-sm">
                                                Agendado: {formatDateTime(scheduledSlot)}
                                            </span>
                                        </div>
                                    </TooltipTrigger>
                                    <TooltipContent>Horário aprovado</TooltipContent>
                                </Tooltip>
                            )}
                        </div>
                    )}
                    {agent && (
                        <div className="mt-1 flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
                            <User2 className="h-4 w-4" />
                            <span className="truncate">
                                Corretor: <span className="text-foreground font-medium">{agent.name}</span>
                                {agent.creci ? ` • CRECI ${agent.creci}` : ""}
                            </span>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}

interface RequestDetailsProps {
    request: VisitRequest | ReservationRequest | null;
}

function RequestDetails({ request }: RequestDetailsProps) {
    if (!request) return null;

    const coerceDate = (val: unknown): Date | undefined => {
        if (!val) return undefined;
        if (val instanceof Date) return val;
        if (typeof val === "object" && val !== null && "toDate" in (val as Record<string, unknown>)) {
            try {
                const ts = val as unknown as { toDate: () => Date };
                const d = ts.toDate();
                if (d instanceof Date && !isNaN(d.getTime())) return d;
            } catch {}
        }
        if (typeof val === "string") {
            const t = Date.parse(val);
            if (!Number.isNaN(t)) return new Date(t);
        }
        if (typeof val === "number") return new Date(val);
        return undefined;
    };

    const formatDateTime = (date: unknown): string => {
        const d = coerceDate(date);
        if (!d) return "N/A";
        return d.toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
    };

    const isVisit = "requestedSlots" in request;

    const getStatusMeta = (status: string) => {
        const s = status.toLowerCase();
        if (s === "approved" || s === "completed" || s === "confirmado") {
            return {
                Icon: CheckCircle2,
                classes: "border-emerald-300 text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40",
            };
        }
        if (s === "pending" || s === "aguardo") {
            return {
                Icon: Clock,
                classes: "border-amber-300 text-amber-700 bg-amber-50 dark:bg-amber-950/40",
            };
        }
        if (s === "denied" || s === "recusado") {
            return {
                Icon: XCircle,
                classes: "border-rose-300 text-rose-700 bg-rose-50 dark:bg-rose-950/40",
            };
        }
        return { Icon: Clock, classes: "" };
    };

    const getStatusLabel = (status: string) => {
        const s = status.toLowerCase();
        if (s === "pending" || s === "aguardo") return "pendente";
        if (s === "approved" || s === "confirmado") return "aprovado";
        if (s === "completed") return "concluída";
        if (s === "denied" || s === "recusado") return "recusado";
        return status;
    };

    const agent =
        (request.status === "approved" || request.status === "completed") && request.agents?.length
            ? request.agents[0]
            : null;

    return (
        <ScrollArea className="h-[calc(100vh-150px)] w-full rounded-md p-1">
            <div className="space-y-4 text-sm px-3">
                <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                        <div className="text-xs text-muted-foreground">Imóvel</div>
                        <div className="text-base font-semibold truncate">{request.property.name}</div>
                        <div className="mt-1 text-xs text-muted-foreground inline-flex items-center gap-1">
                            <Building2 className="h-3.5 w-3.5" />
                            <span>
                                {request.unit.block ? `Bloco ${request.unit.block}` : ""}
                                {request.unit.block ? " • " : ""}
                                {request.unit.identifier}
                            </span>
                        </div>
                    </div>
                    {(() => {
                        const { Icon, classes } = getStatusMeta(request.status);
                        return (
                            <Badge
                                variant="outline"
                                className={`capitalize inline-flex items-center gap-1.5 shrink-0 ${classes}`}
                            >
                                <Icon className="h-3.5 w-3.5" /> {getStatusLabel(request.status)}
                            </Badge>
                        );
                    })()}
                </div>

                {isVisit && (
                    <div className="space-y-3">
                        <div>
                            <div className="text-xs text-muted-foreground mb-1 inline-flex items-center gap-2">
                                <Calendar className="h-4 w-4" /> Horários solicitados
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                                {(request as VisitRequest).requestedSlots?.map((slot, i) => (
                                    <Tooltip key={i}>
                                        <TooltipTrigger asChild>
                                            <Badge variant="outline" className="font-normal">
                                                {formatDateTime(slot)}
                                            </Badge>
                                        </TooltipTrigger>
                                        <TooltipContent>Horário solicitado: {formatDateTime(slot)}</TooltipContent>
                                    </Tooltip>
                                ))}
                                {!(request as VisitRequest).requestedSlots?.length && <span>N/A</span>}
                            </div>
                        </div>

                        <Tooltip>
                            <TooltipTrigger asChild>
                                <div className="rounded-lg border bg-muted/40 p-3">
                                    <div className="text-xs text-muted-foreground mb-1 inline-flex items-center gap-2">
                                        <Clock className="h-4 w-4" /> Horário aprovado
                                    </div>
                                    <div className="text-sm font-medium">
                                        {formatDateTime((request as VisitRequest).scheduledSlot)}
                                    </div>
                                </div>
                            </TooltipTrigger>
                            <TooltipContent>Horário aprovado</TooltipContent>
                        </Tooltip>

                        {(request as VisitRequest).agentMsg && (
                            <div className="rounded-lg border p-3">
                                <div className="text-xs text-muted-foreground mb-1">Mensagem para o corretor</div>
                                <div className="text-sm">{(request as VisitRequest).agentMsg}</div>
                            </div>
                        )}
                    </div>
                )}

                {agent && (
                    <div className="rounded-lg border p-3 wrap-break-word">
                        <div className="text-xs text-muted-foreground mb-1 inline-flex items-center gap-2">
                            <User2 className="h-4 w-4" /> Corretor alocado
                        </div>
                        <div className="grid grid-cols-1 gap-1.5 text-sm min-w-0">
                            <div className="min-w-0">
                                <span className="text-muted-foreground">Nome:</span>{" "}
                                <span className="wrap-break-word">{agent.name}</span>
                            </div>
                            {agent.creci && (
                                <div className="min-w-0">
                                    <span className="text-muted-foreground">CRECI:</span>{" "}
                                    <span className="wrap-break-word">{agent.creci}</span>
                                </div>
                            )}
                            {agent.phone && (
                                <div className="min-w-0">
                                    <span className="text-muted-foreground">Telefone:</span>{" "}
                                    <span className="wrap-break-word">{agent.phone}</span>
                                </div>
                            )}
                            {agent.email && (
                                <div className="min-w-0">
                                    <span className="text-muted-foreground">Email:</span>{" "}
                                    <span className="break-all md:wrap-break-word">{agent.email}</span>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {request.clientMsg && (
                    <div className={`rounded-lg border p-3 ${request.status === "denied" ? "border-destructive" : ""}`}>
                        <div className="text-xs text-muted-foreground mb-1">
                            {request.status === "denied" ? "Motivo (Recusa/Cancelamento)" : "Mensagem para você"}
                        </div>
                        <div className="text-sm">{request.clientMsg}</div>
                    </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-muted-foreground">
                    <div>
                        <span className="text-muted-foreground">Criado em:</span> {formatDateTime(request.createdAt)}
                    </div>
                    <div>
                        <span className="text-muted-foreground">Última atualização:</span>{" "}
                        {formatDateTime(request.updatedAt)}
                    </div>
                </div>
            </div>
        </ScrollArea>
    );
}

export default function DashboardPage() {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState<"visitas" | "reservas">("visitas");
    const [requests, setRequests] = useState<(VisitRequest | ReservationRequest)[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [cursor, setCursor] = useState<string | null>(null);
    const [hasNextPage, setHasNextPage] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [selectedRequest, setSelectedRequest] = useState<VisitRequest | ReservationRequest | null>(null);
    const [isSheetOpen, setIsSheetOpen] = useState(false);
    const [fetchTrigger, setFetchTrigger] = useState(0);
    const [cancelLoading, setCancelLoading] = useState(false);

    const cancelSelectedRequest = async () => {
        if (!selectedRequest?.id) return;
        if (selectedRequest.status !== "pending") return;
        try {
            setCancelLoading(true);
            const isVisit = "requestedSlots" in selectedRequest;
            const res = await fetch(
                `/api/user/requests/${selectedRequest.id}?type=${isVisit ? "visits" : "reservations"}`,
                {
                    method: "DELETE",
                }
            );
            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                throw new Error(data.error || "Falha ao cancelar solicitação");
            }
            // Remove from local list and close sheet
            setRequests(prev => prev.filter(r => r.id !== selectedRequest.id));
            setSelectedRequest(null);
            setIsSheetOpen(false);
            toast.success("Solicitação cancelada com sucesso.");
        } catch (e) {
            console.error(e);
            toast.error(e instanceof Error ? e.message : "Erro ao cancelar solicitação.");
        } finally {
            setCancelLoading(false);
        }
    };

    const fetchData = useCallback(
        async (tab: "visitas" | "reservas", loadMore = false) => {
            if (!user?.id) {
                setIsLoading(false);
                setRequests([]);
                return;
            }

            const currentCursor = loadMore ? cursor : null;

            if (!loadMore) {
                setIsLoading(true);
                setRequests([]);
                setHasNextPage(true);
            } else {
                setLoadingMore(true);
            }

            try {
                let apiUrl = `/api/user/requests?type=${tab === "visitas" ? "visits" : "reservations"}`;
                if (currentCursor) {
                    apiUrl += `&cursor=${currentCursor}`;
                }

                const response = await fetch(apiUrl);

                if (!response.ok) {
                    const errorData = await response
                        .json()
                        .catch(() => ({ error: `HTTP ${response.status}: ${response.statusText}` })); // More robust error catching
                    throw new Error(errorData.error || "Falha ao buscar dados");
                }

                const { requests: newRequests, nextPageCursor, hasNextPage: newHasNextPage } = await response.json();

                // Convert raw data (potentially with Timestamps still) to ensure Dates
                const toDate = (val: unknown): Date | undefined => {
                    if (!val) return undefined;
                    if (val instanceof Date) return val;
                    if (typeof val === "number") return new Date(val);
                    if (typeof val === "string") {
                        const parsed = Date.parse(val);
                        return Number.isNaN(parsed) ? undefined : new Date(parsed);
                    }
                    return undefined;
                };

                const processedRequests = (newRequests as Array<Record<string, unknown>>).map(req => {
                    const createdAt = toDate(req["createdAt"]);
                    const updatedAt = toDate(req["updatedAt"]);
                    const base: Record<string, unknown> = {
                        ...(req as Record<string, unknown>),
                        createdAt,
                        updatedAt,
                    };
                    if (tab === "visitas") {
                        base.requestedSlots = Array.isArray(req["requestedSlots"])
                            ? ((req["requestedSlots"] as unknown[]).map(s => toDate(s)).filter(Boolean) as Date[])
                            : [];
                        base.scheduledSlot = toDate(req["scheduledSlot"]);
                    }
                    return base as unknown as VisitRequest | ReservationRequest;
                });

                setRequests(prev => (loadMore ? [...prev, ...processedRequests] : processedRequests));
                setCursor(nextPageCursor);
                setHasNextPage(newHasNextPage);
            } catch (error) {
                console.error("Erro ao buscar solicitações:", error);
                toast.error(error instanceof Error ? error.message : "Erro desconhecido ao buscar dados.");
                setHasNextPage(false);
            } finally {
                setIsLoading(false);
                setLoadingMore(false);
            }
        },
        [user?.id, cursor]
    );

    useEffect(() => {
        setCursor(null);
        setFetchTrigger(prev => prev + 1);
    }, [activeTab, user?.id]);

    useEffect(() => {
        fetchData(activeTab, false);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [fetchTrigger, fetchData]);

    const handleRequestClick = (request: VisitRequest | ReservationRequest) => {
        setSelectedRequest(request);
        setIsSheetOpen(true);
    };

    const renderList = (currentRequests: (VisitRequest | ReservationRequest)[], type: "visit" | "reservation") => {
        if (isLoading && !loadingMore) {
            return (
                <div className="space-y-4">
                    {[...Array(5)].map((_, i) => (
                        <Card key={i}>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <Skeleton className="h-5 w-3/5" />
                                <Skeleton className="h-5 w-1/5" />
                            </CardHeader>
                            <CardContent>
                                <Skeleton className="h-3 w-2/5" />
                                <Skeleton className="h-3 w-3/5 mt-1" />
                            </CardContent>
                        </Card>
                    ))}
                </div>
            );
        }

        if (!isLoading && currentRequests.length === 0) {
            return (
                <div className="flex flex-col items-center justify-center text-center py-16 text-muted-foreground">
                    <Inbox className="h-16 w-16 mb-4" />
                    <p className="text-lg font-medium">Nenhuma solicitação encontrada.</p>
                    <p className="text-sm">
                        Você ainda não fez nenhuma solicitação de {type === "visit" ? "visita" : "reserva"}.
                    </p>
                </div>
            );
        }

        return (
            <div className="space-y-4">
                {currentRequests.map(req => (
                    <RequestItem
                        key={req.id || `${type}-${req.createdAt?.toString()}`}
                        request={req}
                        onClick={() => handleRequestClick(req)}
                    />
                ))}
                {hasNextPage && (
                    <div className="text-center mt-6">
                        <Button onClick={() => fetchData(activeTab, true)} disabled={loadingMore} variant="outline">
                            {loadingMore ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Carregando...
                                </>
                            ) : (
                                "Carregar mais"
                            )}
                        </Button>
                    </div>
                )}
                {!isLoading && !hasNextPage && currentRequests.length > 0 && (
                    <p className="text-center text-sm text-muted-foreground mt-6">
                        Todas as solicitações foram carregadas.
                    </p>
                )}
            </div>
        );
    };

    return (
        <div className="container mx-auto px-4 py-8 pt-20">
            {" "}
            <h1 className="text-2xl font-bold mb-6">Minhas Solicitações</h1>
            <Tabs
                value={activeTab}
                onValueChange={value => setActiveTab(value as "visitas" | "reservas")}
                className="w-full"
            >
                <TabsList className="mb-4">
                    <TabsTrigger className="cursor-pointer" value="visitas">
                        Visitas
                    </TabsTrigger>
                    <TabsTrigger className="cursor-pointer" value="reservas">
                        Reservas
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="visitas" forceMount hidden={activeTab !== "visitas"}>
                    {renderList(requests, "visit")}
                </TabsContent>
                <TabsContent value="reservas" forceMount hidden={activeTab !== "reservas"}>
                    {renderList(requests, "reservation")}
                </TabsContent>
            </Tabs>
            <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
                <SheetContent className="w-full sm:max-w-md p-0 flex flex-col">
                    {" "}
                    <SheetHeader className="p-4 border-b">
                        <SheetTitle>Detalhes da Solicitação</SheetTitle>
                    </SheetHeader>
                    <SheetDescription asChild className="grow overflow-hidden">
                        <RequestDetails request={selectedRequest} />
                    </SheetDescription>
                    {selectedRequest?.status === "pending" && (
                        <div className="p-4 border-t flex items-center justify-end gap-3">
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button className="cursor-pointer" variant="destructive" disabled={cancelLoading}>
                                        {cancelLoading ? (
                                            <span className="inline-flex items-center gap-2">
                                                <Loader2 className="h-4 w-4 animate-spin" /> Cancelando...
                                            </span>
                                        ) : (
                                            "Cancelar solicitação"
                                        )}
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>Cancelar solicitação?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            Essa ação não pode ser desfeita. A solicitação será removida.
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel className="cursor-pointer">Voltar</AlertDialogCancel>
                                        <AlertDialogAction
                                            onClick={cancelSelectedRequest}
                                            className="bg-destructive hover:bg-destructive/90 cursor-pointer"
                                        >
                                            Confirmar cancelamento
                                        </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        </div>
                    )}
                </SheetContent>
            </Sheet>
        </div>
    );
}
