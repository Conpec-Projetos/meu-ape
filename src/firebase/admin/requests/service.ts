import { adminDb as db } from "@/firebase/firebase-admin-config";
import { ReservationRequest } from "@/interfaces/reservationRequest";
import { User } from "@/interfaces/user";
import { VisitRequest } from "@/interfaces/visitRequest";
import { supabaseAdmin } from "@/supabase/supabase-admin";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { Resend } from "resend";

const resendApiKey = process.env.RESEND_API_KEY;
const emailFrom = process.env.NEXT_PUBLIC_EMAIL_FROM;
const resendClient = resendApiKey ? new Resend(resendApiKey) : null;

const PAGE_SIZE_DEFAULT = 15;

export class RequestActionError extends Error {
    constructor(
        public code:
            | "NOT_FOUND"
            | "INVALID_STATUS"
            | "INVALID_INPUT"
            | "UNIT_UNAVAILABLE"
            | "AGENT_NOT_FOUND"
            | "EMAIL_ERROR",
        message: string
    ) {
        super(message);
        this.name = "RequestActionError";
    }
}

export type VisitRequestResponse = {
    id: string;
    status: VisitRequest["status"];
    client: { ref?: string; fullName: string };
    property: { id?: string; name?: string };
    unit: { id?: string; identifier?: string; block?: string };
    agents?: Array<{ ref?: string; name?: string; email?: string; phone?: string; creci?: string }>;
    requestedSlots: string[];
    scheduledSlot?: string | null;
    agentMsg?: string;
    clientMsg?: string;
    createdAt: string;
    updatedAt?: string;
};

type ReservationClientResponse = {
    ref?: string;
    fullName: string;
    address?: string;
    phone?: string;
    rg?: string;
    cpf?: string;
    addressProof: string[];
    incomeProof: string[];
    identityDoc: string[];
    bmCert: string[];
};

export type ReservationRequestResponse = {
    id: string;
    status: ReservationRequest["status"];
    client: ReservationClientResponse;
    property: ReservationRequest["property"];
    unit: ReservationRequest["unit"];
    agents?: Array<{ ref?: string; name?: string; email?: string; phone?: string; creci?: string }>;
    agentMsg?: string;
    clientMsg?: string;
    createdAt: string;
    updatedAt?: string;
};

type ListOptions = {
    status?: string;
    q?: string;
    page: number;
    pageSize?: number;
};

type ListResult<T> = {
    requests: T[];
    total: number;
    totalPages: number;
};

const normalize = (value: string) =>
    value
        .toLowerCase()
        .normalize("NFD")
        .replace(/\p{Diacritic}/gu, "");

const toIsoString = (value: unknown): string | undefined => {
    if (!value) return undefined;
    if (typeof value === "string") return value;
    if (value instanceof Date) return value.toISOString();
    if (typeof (value as { toDate?: () => Date }).toDate === "function") {
        try {
            return (value as { toDate: () => Date }).toDate().toISOString();
        } catch {
            return undefined;
        }
    }
    return undefined;
};

const refToId = (ref: unknown): string | undefined => {
    if (!ref) return undefined;
    if (typeof ref === "string") return ref;
    if (typeof ref === "object" && ref !== null && "id" in ref) {
        return (ref as FirebaseFirestore.DocumentReference).id;
    }
    return undefined;
};

const escapeHtml = (value: string): string =>
    value
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");

const formatMultiline = (value: string): string => escapeHtml(value).replace(/\n/g, "<br />");

const formatDateTime = (date: Date) => format(date, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });

const sendEmail = async (to: string | string[], subject: string, html: string) => {
    if (!resendClient || !emailFrom) {
        console.warn("Email configuration missing; skipping send to", to);
        return;
    }
    try {
        await resendClient.emails.send({
            from: `Meu Apê <${emailFrom}>`,
            to,
            subject,
            html,
        });
    } catch (error) {
        console.error("Failed to send email", error);
    }
};

const fetchUserByReference = async (value: unknown): Promise<(User & { id: string }) | null> => {
    if (!value) return null;
    let userRef: FirebaseFirestore.DocumentReference | null = null;
    if (typeof value === "string") {
        userRef = value.includes("/") ? db.doc(value) : db.collection("users").doc(value);
    } else if (typeof value === "object" && value !== null && "path" in value) {
        userRef = value as FirebaseFirestore.DocumentReference;
    }

    if (!userRef) return null;
    const snapshot = await userRef.get();
    if (!snapshot.exists) return null;
    const data = snapshot.data() as User;
    return { id: snapshot.id, ...data };
};

const serializeVisitRequest = (doc: FirebaseFirestore.QueryDocumentSnapshot): VisitRequestResponse => {
    const data = doc.data() as VisitRequest;
    const requestedSlots = Array.isArray(data.requestedSlots)
        ? data.requestedSlots.map(slot => toIsoString(slot)).filter((slot): slot is string => Boolean(slot))
        : [];

    const agents = Array.isArray(data.agents)
        ? data.agents.map(agent => ({
              ref: refToId(agent?.ref),
              name: agent?.name,
              email: agent?.email,
              phone: agent?.phone,
              creci: agent?.creci,
          }))
        : undefined;

    return {
        id: doc.id,
        status: data.status,
        client: {
            ref: refToId(data.client?.ref),
            fullName: data.client?.fullName ?? "",
        },
        property: {
            id: data.property?.id,
            name: data.property?.name,
        },
        unit: {
            id: data.unit?.id,
            identifier: data.unit?.identifier,
            block: data.unit?.block,
        },
        agents,
        requestedSlots,
        scheduledSlot: toIsoString(data.scheduledSlot) ?? null,
        agentMsg: data.agentMsg ?? undefined,
        clientMsg: data.clientMsg ?? undefined,
        createdAt: toIsoString(data.createdAt) ?? new Date(0).toISOString(),
        updatedAt: toIsoString(data.updatedAt),
    };
};

const serializeReservationRequest = (doc: FirebaseFirestore.QueryDocumentSnapshot): ReservationRequestResponse => {
    const data = doc.data() as ReservationRequest;
    const agents = Array.isArray(data.agents)
        ? data.agents.map(agent => ({
              ref: refToId(agent?.ref),
              name: agent?.name,
              email: agent?.email,
              phone: agent?.phone,
              creci: agent?.creci,
          }))
        : undefined;

    return {
        id: doc.id,
        status: data.status,
        client: {
            ref: refToId(data.client?.ref),
            fullName: data.client?.fullName ?? "",
            address: data.client?.address,
            phone: data.client?.phone,
            rg: data.client?.rg,
            cpf: data.client?.cpf,
            addressProof: data.client?.addressProof ?? [],
            incomeProof: data.client?.incomeProof ?? [],
            identityDoc: data.client?.identityDoc ?? [],
            bmCert: data.client?.bmCert ?? [],
        },
        property: data.property,
        unit: data.unit,
        agents,
        agentMsg: data.agentMsg ?? undefined,
        clientMsg: data.clientMsg ?? undefined,
        createdAt: toIsoString(data.createdAt) ?? new Date(0).toISOString(),
        updatedAt: toIsoString(data.updatedAt),
    };
};

const filterByQuery = <T extends { client: { fullName: string }; property: { name?: string } }>(
    requests: T[],
    query?: string
) => {
    if (!query) return requests;
    const normalizedQuery = normalize(query);
    return requests.filter(item => {
        const clientName = normalize(item.client?.fullName ?? "");
        const propertyName = normalize(item.property?.name ?? "");
        return clientName.includes(normalizedQuery) || propertyName.includes(normalizedQuery);
    });
};

const computePagination = (total: number, pageSize: number) => Math.max(1, Math.ceil(total / pageSize));

export const listVisitRequests = async ({
    status,
    q,
    page,
    pageSize,
}: ListOptions): Promise<ListResult<VisitRequestResponse>> => {
    const limit = pageSize ?? PAGE_SIZE_DEFAULT;
    const offset = (page - 1) * limit;
    let query: FirebaseFirestore.Query = db.collection("visitRequests");

    if (status) {
        query = query.where("status", "==", status);
    }

    if (q) {
        const snapshot = await query.orderBy("createdAt", "desc").get();
        const serialized = snapshot.docs.map(serializeVisitRequest);
        const filtered = filterByQuery(serialized, q);
        const total = filtered.length;
        const totalPages = computePagination(total, limit);
        const paginated = filtered.slice(offset, offset + limit);
        return { requests: paginated, total, totalPages };
    }

    const countSnapshot = await query.count().get();
    const total = countSnapshot.data().count;
    const totalPages = computePagination(total, limit);

    if (total === 0 || offset >= total) {
        return { requests: [], total, totalPages };
    }

    const snapshot = await query.orderBy("createdAt", "desc").offset(offset).limit(limit).get();
    const requests = snapshot.docs.map(serializeVisitRequest);
    return { requests, total, totalPages };
};

export const listReservationRequests = async ({
    status,
    q,
    page,
    pageSize,
}: ListOptions): Promise<ListResult<ReservationRequestResponse>> => {
    const limit = pageSize ?? PAGE_SIZE_DEFAULT;
    const offset = (page - 1) * limit;
    let query: FirebaseFirestore.Query = db.collection("reservationRequests");

    if (status) {
        query = query.where("status", "==", status);
    }

    if (q) {
        const snapshot = await query.orderBy("createdAt", "desc").get();
        const serialized = snapshot.docs.map(serializeReservationRequest);
        const filtered = filterByQuery(serialized, q);
        const total = filtered.length;
        const totalPages = computePagination(total, limit);
        const paginated = filtered.slice(offset, offset + limit);
        return { requests: paginated, total, totalPages };
    }

    const countSnapshot = await query.count().get();
    const total = countSnapshot.data().count;
    const totalPages = computePagination(total, limit);

    if (total === 0 || offset >= total) {
        return { requests: [], total, totalPages };
    }

    const snapshot = await query.orderBy("createdAt", "desc").offset(offset).limit(limit).get();
    const requests = snapshot.docs.map(serializeReservationRequest);
    return { requests, total, totalPages };
};

type ApproveVisitParams = {
    id: string;
    scheduledSlot: string;
    agentId: string;
    agentMsg?: string;
};

type DenyVisitParams = {
    id: string;
    clientMsg: string;
    agentMsg?: string;
};

type DenyReservationParams = {
    id: string;
    clientMsg: string;
    agentMsg?: string;
};

const ensurePendingStatus = (status: string | undefined) => {
    if (status !== "pending") {
        throw new RequestActionError("INVALID_STATUS", "A solicitação já foi processada.");
    }
};

export const approveVisitRequest = async ({ id, scheduledSlot, agentId, agentMsg }: ApproveVisitParams) => {
    const scheduledDate = new Date(scheduledSlot);
    if (Number.isNaN(scheduledDate.getTime())) {
        throw new RequestActionError("INVALID_INPUT", "Horário inválido.");
    }

    const requestRef = db.collection("visitRequests").doc(id);
    const snapshot = await requestRef.get();

    if (!snapshot.exists) {
        throw new RequestActionError("NOT_FOUND", "Solicitação de visita não encontrada.");
    }

    const requestData = snapshot.data() as VisitRequest;
    ensurePendingStatus(requestData.status);

    const agentRef = db.collection("users").doc(agentId);
    const agentSnap = await agentRef.get();

    if (!agentSnap.exists) {
        throw new RequestActionError("AGENT_NOT_FOUND", "Corretor não encontrado.");
    }

    const agentData = agentSnap.data() as User;
    if (agentData.role !== "agent") {
        throw new RequestActionError("INVALID_INPUT", "O usuário selecionado não é um corretor válido.");
    }

    const trimmedAgentMsg = agentMsg?.trim();

    await requestRef.update({
        status: "approved",
        scheduledSlot: Timestamp.fromDate(scheduledDate),
        agents: [
            {
                ref: agentRef,
                name: agentData.fullName ?? "",
                email: agentData.email ?? "",
                phone: agentData.phone ?? "",
                creci: agentData.agentProfile?.creci ?? "",
            },
        ],
        agentMsg: trimmedAgentMsg ? trimmedAgentMsg : FieldValue.delete(),
        clientMsg: FieldValue.delete(),
        updatedAt: Timestamp.now(),
    });

    const clientUser = await fetchUserByReference(requestData.client?.ref);
    const clientEmail = clientUser?.email;
    const clientName = requestData.client?.fullName ?? clientUser?.fullName ?? "cliente";
    const propertyName = requestData.property?.name ?? "imóvel";
    const unitIdentifier = requestData.unit?.identifier ? ` - Unidade ${requestData.unit.identifier}` : "";

    const formattedSlot = formatDateTime(scheduledDate);

    if (clientEmail) {
        const clientHtml = `
            <p>Olá ${escapeHtml(clientName)},</p>
            <p>Boa notícia! Sua solicitação de visita ao imóvel <strong>${escapeHtml(propertyName)}${escapeHtml(
                unitIdentifier
            )}</strong> foi aprovada.</p>
            <p>Horário agendado: <strong>${escapeHtml(formattedSlot)}</strong>.</p>
            <p>Corretor responsável: <strong>${escapeHtml(agentData.fullName ?? "")}</strong>.</p>
            <p>Em breve o corretor entrará em contato para confirmar os detalhes.</p>
            <p>Equipe Meu Apê</p>
        `;
        await sendEmail(clientEmail, "Visita aprovada", clientHtml);
    }

    if (agentData.email) {
        const agentHtml = `
            <p>Olá ${escapeHtml(agentData.fullName ?? "")},</p>
            <p>Você foi designado para acompanhar a visita do cliente <strong>${escapeHtml(
                clientName
            )}</strong> ao imóvel <strong>${escapeHtml(propertyName)}${escapeHtml(unitIdentifier)}</strong>.</p>
            <p>Horário agendado: <strong>${escapeHtml(formattedSlot)}</strong>.</p>
            ${trimmedAgentMsg ? `<p>Mensagem da administração:</p><p>${formatMultiline(trimmedAgentMsg)}</p>` : ""}
            <p>Por favor, entre em contato com o cliente para alinhar os próximos passos.</p>
        `;
        await sendEmail(agentData.email, "Nova visita agendada", agentHtml);
    }
};

export const denyVisitRequest = async ({ id, clientMsg, agentMsg }: DenyVisitParams) => {
    const trimmedClientMsg = clientMsg.trim();
    if (!trimmedClientMsg) {
        throw new RequestActionError("INVALID_INPUT", "Mensagem para o cliente é obrigatória.");
    }

    const requestRef = db.collection("visitRequests").doc(id);
    const snapshot = await requestRef.get();

    if (!snapshot.exists) {
        throw new RequestActionError("NOT_FOUND", "Solicitação de visita não encontrada.");
    }

    const requestData = snapshot.data() as VisitRequest;
    ensurePendingStatus(requestData.status);

    const trimmedAgentMsg = agentMsg?.trim();

    await requestRef.update({
        status: "denied",
        clientMsg: trimmedClientMsg,
        agentMsg: trimmedAgentMsg ? trimmedAgentMsg : FieldValue.delete(),
        scheduledSlot: FieldValue.delete(),
        agents: FieldValue.delete(),
        updatedAt: Timestamp.now(),
    });

    const clientUser = await fetchUserByReference(requestData.client?.ref);
    const clientEmail = clientUser?.email;
    const clientName = requestData.client?.fullName ?? clientUser?.fullName ?? "cliente";
    const propertyName = requestData.property?.name ?? "imóvel";

    if (clientEmail) {
        const clientHtml = `
            <p>Olá ${escapeHtml(clientName)},</p>
            <p>Infelizmente sua solicitação de visita ao imóvel <strong>${escapeHtml(propertyName)}</strong> foi negada.</p>
            <p>Motivo informado:</p>
            <p>${formatMultiline(trimmedClientMsg)}</p>
            <p>Se tiver dúvidas, responda a este e-mail para que possamos ajudar.</p>
        `;
        await sendEmail(clientEmail, "Visita negada", clientHtml);
    }

    if (trimmedAgentMsg && Array.isArray(requestData.agents)) {
        const agentEmails = requestData.agents
            .map(agent => agent.email)
            .filter((email): email is string => Boolean(email));
        if (agentEmails.length > 0) {
            const agentHtml = `
                <p>Olá,</p>
                <p>A solicitação de visita para o cliente <strong>${escapeHtml(clientName)}</strong> foi negada.</p>
                <p>Mensagem da administração:</p>
                <p>${formatMultiline(trimmedAgentMsg)}</p>
            `;
            await sendEmail(agentEmails, "Visita negada", agentHtml);
        }
    }
};

export const approveReservationRequest = async (id: string) => {
    const requestRef = db.collection("reservationRequests").doc(id);
    const snapshot = await requestRef.get();

    if (!snapshot.exists) {
        throw new RequestActionError("NOT_FOUND", "Solicitação de reserva não encontrada.");
    }

    const requestData = snapshot.data() as ReservationRequest;
    ensurePendingStatus(requestData.status);

    const unitId = requestData.unit?.id;
    if (!unitId) {
        throw new RequestActionError("INVALID_INPUT", "Informações da unidade não encontradas.");
    }

    const { data: updatedRows, error } = await supabaseAdmin
        .from("units")
        .update({ is_available: false })
        .eq("id", unitId)
        .eq("is_available", true)
        .select("id");

    if (error) {
        console.error("Supabase update error", error);
        throw new RequestActionError("UNIT_UNAVAILABLE", "Não foi possível reservar a unidade no momento.");
    }

    if (!updatedRows || updatedRows.length === 0) {
        throw new RequestActionError("UNIT_UNAVAILABLE", "A unidade selecionada já não está mais disponível.");
    }

    try {
        await db.runTransaction(async transaction => {
            const freshSnap = await transaction.get(requestRef);
            if (!freshSnap.exists) {
                throw new RequestActionError("NOT_FOUND", "Solicitação de reserva não encontrada.");
            }
            const freshData = freshSnap.data() as ReservationRequest;
            ensurePendingStatus(freshData.status);
            transaction.update(requestRef, {
                status: "approved",
                updatedAt: Timestamp.now(),
            });
        });
    } catch (error) {
        await supabaseAdmin.from("units").update({ is_available: true }).eq("id", unitId);
        if (error instanceof RequestActionError) {
            throw error;
        }
        throw new RequestActionError("INVALID_STATUS", "Não foi possível atualizar a solicitação de reserva.");
    }

    const clientUser = await fetchUserByReference(requestData.client?.ref);
    const clientEmail = clientUser?.email;
    const clientName = requestData.client?.fullName ?? clientUser?.fullName ?? "cliente";
    const propertyName = requestData.property?.name ?? "imóvel";
    const unitInfo = `${requestData.unit?.identifier ?? ""}${requestData.unit?.block ? ` - Bloco ${requestData.unit.block}` : ""}`;

    if (clientEmail) {
        const clientHtml = `
            <p>Olá ${escapeHtml(clientName)},</p>
            <p>Sua solicitação de reserva para o imóvel <strong>${escapeHtml(propertyName)}</strong> ${escapeHtml(
                unitInfo
            )} foi aprovada.</p>
            <p>Em breve entraremos em contato para orientar os próximos passos.</p>
            <p>Equipe Meu Apê</p>
        `;
        await sendEmail(clientEmail, "Reserva aprovada", clientHtml);
    }
};

export const denyReservationRequest = async ({ id, clientMsg, agentMsg }: DenyReservationParams) => {
    const trimmedClientMsg = clientMsg.trim();
    if (!trimmedClientMsg) {
        throw new RequestActionError("INVALID_INPUT", "Mensagem para o cliente é obrigatória.");
    }

    const requestRef = db.collection("reservationRequests").doc(id);
    const snapshot = await requestRef.get();

    if (!snapshot.exists) {
        throw new RequestActionError("NOT_FOUND", "Solicitação de reserva não encontrada.");
    }

    const requestData = snapshot.data() as ReservationRequest;
    ensurePendingStatus(requestData.status);

    const trimmedAgentMsg = agentMsg?.trim();

    await requestRef.update({
        status: "denied",
        clientMsg: trimmedClientMsg,
        agentMsg: trimmedAgentMsg ? trimmedAgentMsg : FieldValue.delete(),
        updatedAt: Timestamp.now(),
    });

    const clientUser = await fetchUserByReference(requestData.client?.ref);
    const clientEmail = clientUser?.email;
    const clientName = requestData.client?.fullName ?? clientUser?.fullName ?? "cliente";
    const propertyName = requestData.property?.name ?? "imóvel";

    if (clientEmail) {
        const clientHtml = `
            <p>Olá ${escapeHtml(clientName)},</p>
            <p>Infelizmente sua solicitação de reserva para o imóvel <strong>${escapeHtml(propertyName)}</strong> não pôde ser aprovada.</p>
            <p>Motivo informado:</p>
            <p>${formatMultiline(trimmedClientMsg)}</p>
            <p>Se desejar, responda este e-mail para conversarmos sobre alternativas.</p>
        `;
        await sendEmail(clientEmail, "Reserva negada", clientHtml);
    }

    if (trimmedAgentMsg && Array.isArray(requestData.agents)) {
        const agentEmails = requestData.agents
            .map(agent => agent.email)
            .filter((email): email is string => Boolean(email));
        if (agentEmails.length > 0) {
            const agentHtml = `
                <p>Olá,</p>
                <p>A solicitação de reserva associada ao imóvel <strong>${escapeHtml(propertyName)}</strong> foi negada.</p>
                <p>Mensagem da administração:</p>
                <p>${formatMultiline(trimmedAgentMsg)}</p>
            `;
            await sendEmail(agentEmails, "Reserva negada", agentHtml);
        }
    }
};
