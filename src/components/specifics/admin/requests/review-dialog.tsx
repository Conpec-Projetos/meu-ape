"use client";

import { RequestTab, STATUS_META, formatDateTime } from "@/components/specifics/admin/requests/constants";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ReservationRequestListItem, VisitRequestListItem } from "@/interfaces/adminRequestsResponse";
import { User } from "@/interfaces/user";
import { Loader2 } from "lucide-react";
import { ChangeEvent, useEffect, useState } from "react";

interface BaseRequestSelection<
    TType extends RequestTab,
    TData extends VisitRequestListItem | ReservationRequestListItem,
> {
    type: TType;
    data: TData;
}

export type RequestSelection =
    | BaseRequestSelection<"visits", VisitRequestListItem>
    | BaseRequestSelection<"reservations", ReservationRequestListItem>;

interface RequestReviewDialogProps {
    open: boolean;
    request: RequestSelection | null;
    onOpenChange: (open: boolean) => void;
    isActionLoading: boolean;
    clientMsg: string;
    agentMsg: string;
    selectedSlot: string;
    selectedAgentId: string;
    agents: User[];
    isAgentsLoading: boolean;
    onClientMsgChange: (event: ChangeEvent<HTMLTextAreaElement>) => void;
    onAgentMsgChange: (event: ChangeEvent<HTMLTextAreaElement>) => void;
    onSlotChange: (value: string) => void;
    onAgentChange: (value: string) => void;
    onDenyVisit: () => void;
    onApproveVisit: () => void;
    onDenyReservation: () => void;
    onApproveReservation: () => void;
    onCompleteVisit: () => void;
    onCancelVisit: () => void;
    onCompleteReservation: () => void;
    onCancelReservation: () => void;
}

type InteractionMode = "view" | "approve" | "deny";

function InfoField({ label, value }: { label: string; value?: string | null }) {
    return (
        <div className="space-y-1">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
            <p className="text-sm font-semibold text-foreground wrap-break-word">{value ?? "-"}</p>
        </div>
    );
}

export function RequestReviewDialog({
    open,
    request,
    onOpenChange,
    isActionLoading,
    clientMsg,
    agentMsg,
    selectedSlot,
    selectedAgentId,
    agents,
    isAgentsLoading,
    onClientMsgChange,
    onAgentMsgChange,
    onSlotChange,
    onAgentChange,
    onDenyVisit,
    onApproveVisit,
    onDenyReservation,
    onApproveReservation,
    onCompleteVisit,
    onCancelVisit,
    onCompleteReservation,
    onCancelReservation,
}: RequestReviewDialogProps) {
    const [mode, setMode] = useState<InteractionMode>("view");
    useEffect(() => {
        if (open) setMode("view");
    }, [open]);

    useEffect(() => {
        if (request?.data.status !== "pending" && mode !== "view") {
            setMode("view");
        }
    }, [mode, request?.data.status]);

    if (!request) {
        return null;
    }

    // keep label mapping for potential external consumers via constants, but not used directly here
    const statusMeta = STATUS_META[request.data.status] || STATUS_META.pending;
    const isApproved = request.data.status === "approved";
    const isReadOnly = request.data.status !== "pending"; // approved, denied, completed => somente leitura nos campos
    const isVisitRequest = request.type === "visits";
    const isPending = request.data.status === "pending";
    const isClientMsgEmpty = !clientMsg.trim();

    const dialogTitle = (() => {
        if (mode === "approve") {
            return isVisitRequest ? "Aprovar solicitação de visita" : "Aprovar solicitação de reserva";
        }
        if (mode === "deny") {
            return isVisitRequest ? "Recusar solicitação de visita" : "Recusar solicitação de reserva";
        }
        return isVisitRequest ? "Análise da solicitação de visita" : "Análise da solicitação de reserva";
    })();

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>{dialogTitle}</DialogTitle>
                    <DialogDescription>
                        {`Solicitação criada em ${formatDateTime(request.data.createdAt)}.`}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6">
                    <div className="grid gap-4 md:grid-cols-2">
                        <InfoField label="Cliente" value={request.data.client.fullName} />
                        <InfoField label="Imóvel" value={request.data.property.name} />
                        <InfoField
                            label="Unidade"
                            value={`${request.data.unit.identifier} · Bloco ${request.data.unit.block}`}
                        />
                        <div className="space-y-1">
                            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                Status atual
                            </p>
                            <Badge
                                variant="outline"
                                className={`inline-flex items-center gap-1.5 capitalize ${statusMeta.classes}`}
                            >
                                <statusMeta.Icon className="h-3.5 w-3.5" /> {statusMeta.label}
                            </Badge>
                        </div>
                    </div>

                    {isVisitRequest ? (
                        <VisitRequestDetails
                            request={request.data}
                            selectedSlot={selectedSlot}
                            onSlotChange={onSlotChange}
                            selectedAgentId={selectedAgentId}
                            onAgentChange={onAgentChange}
                            agents={agents}
                            isAgentsLoading={isAgentsLoading}
                            isActionLoading={isActionLoading}
                            readOnly={isReadOnly}
                        />
                    ) : (
                        <ReservationRequestDetails request={request.data} readOnly={isReadOnly} />
                    )}
                    {mode === "approve" && isPending ? (
                        <div className="grid gap-4">
                            <div className="space-y-2">
                                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                    Mensagem para o cliente (opcional)
                                </p>
                                <Textarea
                                    value={clientMsg}
                                    onChange={onClientMsgChange}
                                    placeholder="Compartilhe orientações ou próximos passos com o cliente."
                                    rows={4}
                                />
                            </div>
                            <div className="space-y-2">
                                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                    Mensagem para o corretor (opcional)
                                </p>
                                <Textarea
                                    value={agentMsg}
                                    onChange={onAgentMsgChange}
                                    placeholder="Informe o corretor sobre detalhes ou combinações necessárias."
                                    rows={3}
                                />
                            </div>
                            {!isVisitRequest ? (
                                <div className="space-y-2">
                                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                        Atribuir corretor (opcional)
                                    </p>
                                    <Select
                                        value={selectedAgentId}
                                        onValueChange={onAgentChange}
                                        disabled={isActionLoading || isAgentsLoading || agents.length === 0}
                                    >
                                        <SelectTrigger className="w-full justify-between cursor-pointer">
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
                                                    <SelectItem
                                                        className="cursor-pointer"
                                                        key={agent.id}
                                                        value={agent.id as string}
                                                    >
                                                        {agent.fullName}
                                                    </SelectItem>
                                                ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            ) : null}
                        </div>
                    ) : null}

                    {mode === "deny" && isPending ? (
                        <div className="grid gap-4">
                            <div className="space-y-2">
                                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                    Motivo da recusa (obrigatório)
                                </p>
                                <Textarea
                                    value={clientMsg}
                                    onChange={onClientMsgChange}
                                    placeholder="Explique ao cliente o motivo da recusa."
                                    rows={4}
                                />
                            </div>
                        </div>
                    ) : null}
                </div>

                {(isPending || isApproved) && (
                    <DialogFooter className="sm:justify-between">
                        <DialogClose asChild>
                            <Button className="cursor-pointer" variant="outline" disabled={isActionLoading}>
                                Fechar
                            </Button>
                        </DialogClose>
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
                            {isPending ? (
                                mode === "view" ? (
                                    isVisitRequest ? (
                                        <>
                                            <Button
                                                variant="outline"
                                                className="border-destructive text-destructive hover:bg-destructive hover:text-white cursor-pointer"
                                                onClick={() => setMode("deny")}
                                                disabled={isActionLoading}
                                            >
                                                Negar visita
                                            </Button>
                                            <Button
                                                className="cursor-pointer"
                                                onClick={() => setMode("approve")}
                                                disabled={
                                                    isActionLoading ||
                                                    !selectedSlot ||
                                                    !selectedAgentId ||
                                                    isAgentsLoading
                                                }
                                            >
                                                Aprovar visita
                                            </Button>
                                        </>
                                    ) : (
                                        <>
                                            <Button
                                                variant="outline"
                                                className="border-destructive text-destructive hover:bg-destructive hover:text-white cursor-pointer"
                                                onClick={() => setMode("deny")}
                                                disabled={isActionLoading}
                                            >
                                                Negar reserva
                                            </Button>
                                            <Button
                                                className="cursor-pointer"
                                                onClick={() => setMode("approve")}
                                                disabled={isActionLoading}
                                            >
                                                Aprovar reserva
                                            </Button>
                                        </>
                                    )
                                ) : mode === "approve" ? (
                                    <>
                                        <Button
                                            variant="outline"
                                            className="cursor-pointer"
                                            onClick={() => setMode("view")}
                                            disabled={isActionLoading}
                                        >
                                            Voltar
                                        </Button>
                                        <Button
                                            className="cursor-pointer"
                                            onClick={isVisitRequest ? onApproveVisit : onApproveReservation}
                                            disabled={
                                                isActionLoading ||
                                                (isVisitRequest &&
                                                    (!selectedSlot || !selectedAgentId || isAgentsLoading))
                                            }
                                        >
                                            {isActionLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                            Confirmar aprovação
                                        </Button>
                                    </>
                                ) : (
                                    <>
                                        <Button
                                            variant="outline"
                                            className="cursor-pointer"
                                            onClick={() => setMode("view")}
                                            disabled={isActionLoading}
                                        >
                                            Voltar
                                        </Button>
                                        <Button
                                            variant="outline"
                                            className="border-destructive text-destructive hover:bg-destructive hover:text-white cursor-pointer"
                                            onClick={isVisitRequest ? onDenyVisit : onDenyReservation}
                                            disabled={isActionLoading || isClientMsgEmpty}
                                        >
                                            {isActionLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                            Confirmar recusa
                                        </Button>
                                    </>
                                )
                            ) : isVisitRequest ? (
                                <>
                                    <Button
                                        variant="outline"
                                        className="border-destructive text-destructive hover:bg-destructive hover:text-white cursor-pointer"
                                        onClick={onCancelVisit}
                                        disabled={isActionLoading}
                                    >
                                        {isActionLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                        Cancelar solicitação
                                    </Button>
                                    <Button
                                        variant="outline"
                                        className="text-emerald-700 border-emerald-300 hover:bg-emerald-600 hover:text-white cursor-pointer"
                                        onClick={onCompleteVisit}
                                        disabled={isActionLoading}
                                    >
                                        {isActionLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                        Marcar como concluída
                                    </Button>
                                </>
                            ) : (
                                <>
                                    <Button
                                        variant="outline"
                                        className="border-destructive text-destructive hover:bg-destructive hover:text-white cursor-pointer"
                                        onClick={onCancelReservation}
                                        disabled={isActionLoading}
                                    >
                                        {isActionLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                        Cancelar solicitação
                                    </Button>
                                    <Button
                                        variant="outline"
                                        className="text-emerald-700 border-emerald-300 hover:bg-emerald-600 hover:text-white cursor-pointer"
                                        onClick={onCompleteReservation}
                                        disabled={isActionLoading}
                                    >
                                        {isActionLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                        Marcar como concluída
                                    </Button>
                                </>
                            )}
                        </div>
                    </DialogFooter>
                )}
            </DialogContent>
        </Dialog>
    );
}

function VisitRequestDetails({
    request,
    selectedSlot,
    onSlotChange,
    selectedAgentId,
    onAgentChange,
    agents,
    isAgentsLoading,
    isActionLoading,
    readOnly,
}: {
    request: VisitRequestListItem;
    selectedSlot: string;
    onSlotChange: (value: string) => void;
    selectedAgentId: string;
    onAgentChange: (value: string) => void;
    agents: User[];
    isAgentsLoading: boolean;
    isActionLoading: boolean;
    readOnly: boolean;
}) {
    return (
        <div className="space-y-4">
            <div className="space-y-2">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Horários solicitados
                </p>
                {request.requestedSlots.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                        {request.requestedSlots.map(slot => (
                            <Badge key={slot} variant="outline">
                                {formatDateTime(slot)}
                            </Badge>
                        ))}
                    </div>
                ) : (
                    <p className="text-sm text-muted-foreground">Nenhum horário sugerido pelo cliente.</p>
                )}
            </div>

            <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        Horário final da visita
                    </p>
                    {readOnly ? (
                        <p className="text-sm font-medium text-foreground">
                            {request.scheduledSlot ? formatDateTime(request.scheduledSlot) : "—"}
                        </p>
                    ) : (
                        <Select
                            value={selectedSlot}
                            onValueChange={onSlotChange}
                            disabled={
                                isActionLoading ||
                                request.requestedSlots.length === 0 ||
                                readOnly ||
                                !!request.scheduledSlot
                            }
                        >
                            <SelectTrigger className="w-full justify-between cursor-pointer">
                                <SelectValue placeholder="Selecione o horário" />
                            </SelectTrigger>
                            <SelectContent>
                                {request.requestedSlots.map(slot => (
                                    <SelectItem className="cursor-pointer" key={slot} value={slot}>
                                        {formatDateTime(slot)}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    )}
                </div>

                <div className="space-y-2">
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        Atribuir corretor
                    </p>
                    {readOnly ? (
                        <p className="text-sm font-medium text-foreground">
                            {request.agents?.length ? request.agents[0]?.name : "—"}
                        </p>
                    ) : (
                        <Select
                            value={selectedAgentId}
                            onValueChange={onAgentChange}
                            disabled={isActionLoading || isAgentsLoading || agents.length === 0 || readOnly}
                        >
                            <SelectTrigger className="w-full justify-between cursor-pointer">
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
                                        <SelectItem
                                            className="cursor-pointer"
                                            key={agent.id}
                                            value={agent.id as string}
                                        >
                                            {agent.fullName}
                                        </SelectItem>
                                    ))}
                            </SelectContent>
                        </Select>
                    )}
                </div>
            </div>
        </div>
    );
}

function ReservationRequestDetails({ request }: { request: ReservationRequestListItem; readOnly: boolean }) {
    return (
        <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
                <InfoField label="Telefone" value={request.client.phone} />
                <InfoField label="CPF" value={request.client.cpf} />
                <InfoField label="Endereço" value={request.client.address} />
            </div>
        </div>
    );
}
