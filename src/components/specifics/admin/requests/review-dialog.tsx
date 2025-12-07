"use client";

import {
    DOCUMENT_GROUPS,
    RequestTab,
    STATUS_META,
    formatDateTime,
} from "@/components/specifics/admin/requests/constants";
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
import { ExternalLink, Loader2 } from "lucide-react";
import { ChangeEvent } from "react";

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
    showDenialFields: boolean;
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
    disableDenyAction: boolean;
}

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
    showDenialFields,
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
    disableDenyAction,
}: RequestReviewDialogProps) {
    if (!request) {
        return null;
    }

    // keep label mapping for potential external consumers via constants, but not used directly here
    const statusMeta = STATUS_META[request.data.status] || STATUS_META.pending;
    const isApproved = request.data.status === "approved";
    const isReadOnly = request.data.status !== "pending"; // approved, denied, completed => somente leitura nos campos
    const isVisitRequest = request.type === "visits";

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>
                        {isVisitRequest ? "Análise da solicitação de visita" : "Análise da solicitação de reserva"}
                    </DialogTitle>
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

                    {showDenialFields && (
                        <div className="grid gap-4">
                            <div className="space-y-2">
                                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                    Mensagem para o cliente
                                </p>
                                <Textarea
                                    value={clientMsg}
                                    onChange={onClientMsgChange}
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
                                    onChange={onAgentMsgChange}
                                    placeholder="Informe o corretor sobre os próximos passos (opcional)."
                                    rows={3}
                                />
                            </div>
                        </div>
                    )}
                </div>

                {(request.data.status === "pending" || isApproved) && (
                    <DialogFooter className="sm:justify-between">
                        <DialogClose asChild>
                            <Button className="cursor-pointer" variant="outline" disabled={isActionLoading}>
                                Fechar
                            </Button>
                        </DialogClose>
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
                            {request.data.status === "pending" ? (
                                isVisitRequest ? (
                                    <>
                                        <Button
                                            variant="outline"
                                            className="border-destructive text-destructive hover:bg-destructive hover:text-white cursor-pointer"
                                            onClick={onDenyVisit}
                                            disabled={isActionLoading || disableDenyAction}
                                        >
                                            {isActionLoading && showDenialFields ? (
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            ) : null}
                                            Negar visita
                                        </Button>
                                        <Button
                                            className="cursor-pointer"
                                            onClick={onApproveVisit}
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
                                            className="border-destructive text-destructive hover:bg-destructive hover:text-white cursor-pointer"
                                            onClick={onDenyReservation}
                                            disabled={isActionLoading || disableDenyAction}
                                        >
                                            {isActionLoading && showDenialFields ? (
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            ) : null}
                                            Negar reserva
                                        </Button>
                                        <Button
                                            className="cursor-pointer"
                                            onClick={onApproveReservation}
                                            disabled={isActionLoading}
                                        >
                                            {isActionLoading && !showDenialFields ? (
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            ) : null}
                                            Aprovar reserva
                                        </Button>
                                    </>
                                )
                            ) : isVisitRequest ? (
                                // Approved visit actions
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
                                // Approved reservation actions
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
                            <SelectTrigger className="w-full justify-between">
                                <SelectValue placeholder="Selecione o horário" />
                            </SelectTrigger>
                            <SelectContent>
                                {request.requestedSlots.map(slot => (
                                    <SelectItem key={slot} value={slot}>
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
                                        <SelectItem key={agent.id} value={agent.id as string}>
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
            <div className="space-y-3">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Documentos enviados</p>
                {DOCUMENT_GROUPS.map(group => {
                    const value = request.client[group.key];
                    if (!Array.isArray(value)) return null;
                    return (
                        <div key={group.key.toString()} className="space-y-1">
                            <p className="text-sm font-semibold text-foreground">{group.label}</p>
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
                                <p className="text-sm text-muted-foreground">Nenhum documento enviado.</p>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
