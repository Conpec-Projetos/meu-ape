"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/use-auth";
import { ReservationRequest } from "@/interfaces/reservationRequest";
import { VisitRequest } from "@/interfaces/visitRequest";
// Timestamp type not required; dates are coerced from unknown
import { Inbox, Loader2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

// Componente Reutilizável para Item da Lista
interface RequestItemProps {
    request: VisitRequest | ReservationRequest;
    onClick: () => void;
}

function RequestItem({ request, onClick }: RequestItemProps) {
    const getStatusVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
        const lowerStatus = status.toLowerCase();
        switch (lowerStatus) {
            case "confirmado":
            case "approved":
            case "completed":
                return "default";
            case "aguardo":
            case "pending":
                return "secondary";
            case "recusado":
            case "denied":
                return "destructive";
            default:
                return "outline";
        }
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
    const unitBlock = request.unit?.block ? `Bloco ${request.unit.block} ` : "";

    return (
        <Card className="w-full cursor-pointer hover:bg-muted/50 transition-colors" onClick={onClick}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium truncate">{propertyName}</CardTitle>
                <Badge variant={getStatusVariant(request.status)} className="capitalize">
                    {request.status}
                </Badge>
            </CardHeader>
            <CardContent>
                <div className="text-xs text-muted-foreground">Solicitado em: {formatDate(request.createdAt)}</div>
                <CardDescription className="text-xs mt-1 truncate">
                    Unidade: {unitBlock}
                    {unitIdentifier}
                </CardDescription>
            </CardContent>
        </Card>
    );
}

// Componente Reutilizável para Detalhes no Sheet
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

    const formatSlots = (slots: unknown[] | undefined): string => {
        if (!slots || slots.length === 0) return "N/A";
        return slots.map(slot => formatDateTime(slot)).join(" | ");
    };

    const isVisit = "requestedSlots" in request;

    const getStatusVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
        const lowerStatus = status.toLowerCase();
        switch (lowerStatus) {
            case "confirmado":
            case "approved":
            case "completed":
                return "default";
            case "aguardo":
            case "pending":
                return "secondary";
            case "recusado":
            case "denied":
                return "destructive";
            default:
                return "outline";
        }
    };

    const agent =
        isVisit &&
        (request.status === "approved" || request.status === "completed") &&
        request.agents &&
        request.agents.length > 0
            ? request.agents[0]
            : null;

    return (
        <ScrollArea className="h-[calc(100vh-150px)] w-full rounded-md p-1">
            <div className="space-y-3 text-sm px-3">
                <p>
                    <strong>Status:</strong>{" "}
                    <Badge variant={getStatusVariant(request.status)} className="capitalize">
                        {request.status}
                    </Badge>
                </p>
                <p>
                    <strong>Imóvel:</strong> {request.property.name}
                </p>
                <p>
                    <strong>Unidade:</strong> {request.unit.block ? `Bloco ${request.unit.block} ` : ""}
                    {request.unit.identifier}
                </p>

                {agent && (
                    <div className="mt-3 pt-3 border-t">
                        <p className="font-semibold mb-1">Corretor:</p>
                        <p>
                            <strong>Nome:</strong> {agent.name}
                        </p>
                        <p>
                            <strong>CRECI:</strong> {agent.creci}
                        </p>
                        <p>
                            <strong>Telefone:</strong> {agent.phone}
                        </p>
                        <p>
                            <strong>Email:</strong> {agent.email}
                        </p>
                    </div>
                )}

                {isVisit && (
                    <>
                        <p>
                            <strong>Horários Solicitados:</strong>{" "}
                            {formatSlots((request as VisitRequest).requestedSlots)}
                        </p>
                        <p>
                            <strong>Horário Agendado:</strong> {formatDateTime((request as VisitRequest).scheduledSlot)}
                        </p>
                        {(request as VisitRequest).agentMsg && (
                            <p className="mt-2 pt-2 border-t">
                                <strong>Mensagem para o corretor:</strong> {(request as VisitRequest).agentMsg}
                            </p>
                        )}
                    </>
                )}

                {request.clientMsg && (
                    <p className={`mt-2 pt-2 border-t ${request.status === "denied" ? "text-destructive" : ""}`}>
                        <strong>
                            {request.status === "denied" ? "Motivo (Recusa/Cancelamento):" : "Mensagem para você:"}
                        </strong>{" "}
                        {request.clientMsg}
                    </p>
                )}

                <div className="pt-3 border-t text-xs text-muted-foreground space-y-1">
                    <p>
                        <strong>Criado em:</strong> {formatDateTime(request.createdAt)}
                    </p>
                    <p>
                        <strong>Última Atualização:</strong> {formatDateTime(request.updatedAt)}
                    </p>
                </div>
            </div>
        </ScrollArea>
    );
}

// Componente Principal da Página
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

    const fetchData = useCallback(
        async (tab: "visitas" | "reservas", loadMore = false) => {
            // Only fetch if user ID is available
            if (!user?.id) {
                setIsLoading(false); // Stop loading if no user
                setRequests([]); // Clear requests
                return;
            }

            const currentCursor = loadMore ? cursor : null; // Use cursor only when loading more

            if (!loadMore) {
                setIsLoading(true);
                setRequests([]); // Clear on initial load/tab switch
                setHasNextPage(true); // Assume there might be pages
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
                    const requestedSlots = Array.isArray(req["requestedSlots"])
                        ? ((req["requestedSlots"] as unknown[]).map(s => toDate(s)).filter(Boolean) as Date[])
                        : [];
                    const scheduledSlot = toDate(req["scheduledSlot"]);

                    return {
                        ...(req as Record<string, unknown>),
                        createdAt,
                        updatedAt,
                        requestedSlots,
                        scheduledSlot,
                    } as VisitRequest | ReservationRequest;
                });

                setRequests(prev => (loadMore ? [...prev, ...processedRequests] : processedRequests));
                setCursor(nextPageCursor); // Update cursor for the *next* potential fetch
                setHasNextPage(newHasNextPage); // Update hasNextPage based on API response
            } catch (error) {
                console.error("Erro ao buscar solicitações:", error);
                toast.error(error instanceof Error ? error.message : "Erro desconhecido ao buscar dados.");
                setHasNextPage(false); // Stop trying to load more on error
            } finally {
                setIsLoading(false);
                setLoadingMore(false);
            }
        },
        [user?.id, cursor]
    ); // cursor dependency is needed for loadMore logic

    // Effect to trigger fetch on tab change or user change
    useEffect(() => {
        setCursor(null); // Reset cursor when tab changes
        setFetchTrigger(prev => prev + 1); // Trigger fetch
    }, [activeTab, user?.id]);

    // Effect that actually calls fetch based on trigger
    useEffect(() => {
        fetchData(activeTab, false); // false = initial load for the tab
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [fetchTrigger, fetchData]); // Depend on fetchTrigger and the fetchData callback itself

    const handleRequestClick = (request: VisitRequest | ReservationRequest) => {
        setSelectedRequest(request);
        setIsSheetOpen(true);
    };

    const renderList = (currentRequests: (VisitRequest | ReservationRequest)[], type: "visit" | "reservation") => {
        // **Show loading skeleton ONLY on initial load**
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

        // **Show "No requests" message AFTER loading is complete and requests array is empty**
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

        // Render the list items
        return (
            <div className="space-y-4">
                {currentRequests.map(req => (
                    <RequestItem
                        key={req.id || `${type}-${req.createdAt?.toString()}`}
                        request={req}
                        onClick={() => handleRequestClick(req)}
                    />
                ))}
                {/* "Load More" button and indicator */}
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
                {/* Optional: Message when all items are loaded */}
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
            {/* Adjusted padding-top */}
            <h1 className="text-2xl font-bold mb-6">Minhas Solicitações</h1>
            <Tabs
                value={activeTab}
                onValueChange={value => setActiveTab(value as "visitas" | "reservas")}
                className="w-full"
            >
                <TabsList className="mb-4">
                    <TabsTrigger value="visitas">Visitas</TabsTrigger>
                    <TabsTrigger value="reservas">Reservas</TabsTrigger>
                </TabsList>

                {/* Render content based on active tab */}
                <TabsContent value="visitas" forceMount hidden={activeTab !== "visitas"}>
                    {renderList(requests, "visit")}
                </TabsContent>
                <TabsContent value="reservas" forceMount hidden={activeTab !== "reservas"}>
                    {renderList(requests, "reservation")}
                </TabsContent>
            </Tabs>
            {/* Sheet for Details */}
            <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
                <SheetContent className="w-full sm:max-w-md p-0 flex flex-col">
                    {" "}
                    {/* Use flex-col for Sheet layout */}
                    <SheetHeader className="p-4 border-b">
                        <SheetTitle>Detalhes da Solicitação</SheetTitle>
                    </SheetHeader>
                    {/* RequestDetails now handles its own scrolling */}
                    <SheetDescription asChild className="grow overflow-hidden">
                        <RequestDetails request={selectedRequest} />
                    </SheetDescription>
                    {/* Optional Footer */}
                    {/* <SheetFooter className="p-4 border-t">
                        <Button variant="outline" onClick={() => setIsSheetOpen(false)}>Fechar</Button>
                    </SheetFooter> */}
                </SheetContent>
            </Sheet>
        </div>
    );
}
