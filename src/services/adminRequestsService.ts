import { ReservationRequestListItem, VisitRequestListItem } from "@/interfaces/adminRequestsResponse";
import { buildEmailLayout } from "@/lib/sendEmailAdmin";
import { supabaseAdmin } from "@/supabase/supabase-admin";
import { Database } from "@/supabase/types/types";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
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

type Tables = Database["public"]["Tables"];
type VisitRow = Tables["visit_requests"]["Row"];
type ReservationRow = Tables["reservation_requests"]["Row"];
type UserRow = Tables["users"]["Row"];
type PropertyRow = Tables["properties"]["Row"];
type UnitRow = Tables["units"]["Row"];
type AssignmentRow = Tables["request_assignments"]["Row"];
type RequestStatus = Database["public"]["Enums"]["request_status"];

type VisitRowWithRelations = VisitRow & {
    client: Pick<UserRow, "id" | "full_name" | "email" | "phone" | "cpf"> | null;
    property: Pick<PropertyRow, "id" | "name" | "address"> | null;
    unit: Pick<UnitRow, "id" | "identifier" | "block"> | null;
};

type ReservationRowWithRelations = ReservationRow & {
    client: Pick<UserRow, "id" | "full_name" | "email" | "phone" | "cpf" | "rg" | "address" | "documents"> | null;
    property: Pick<PropertyRow, "id" | "name" | "address"> | null;
    unit: Pick<UnitRow, "id" | "identifier" | "block"> | null;
};

type AgentSummary = {
    id: string;
    name: string;
    email?: string | null;
    phone?: string | null;
    creci?: string | null;
};

type AssignmentLookupResult = {
    map: Map<string, string[]>;
    agents: Map<string, AgentSummary>;
};

type DocumentsPayload = Record<string, unknown>;

const visitSelect = `
    id,
    status,
    requested_slots,
    scheduled_slot,
    client_msg,
    agent_msg,
    property_id,
    unit_id,
    created_at,
    updated_at,
    client:users!inner (
        id,
        full_name,
        email,
        phone,
        cpf
    ),
    property:properties!inner (id, name, address),
    unit:units!left (id, identifier, block)
`;

const reservationSelect = `
    id,
    status,
    client_msg,
    agent_msg,
    transaction_docs,
    property_id,
    unit_id,
    created_at,
    updated_at,
    client:users!inner (
        id,
        full_name,
        email,
        phone,
        cpf,
        rg,
        address,
        documents
    ),
    property:properties!inner (id, name, address),
    unit:units!inner (id, identifier, block)
`;

const nowIso = () => new Date().toISOString();

const computePagination = (total: number, pageSize: number) => Math.max(1, Math.ceil(total / pageSize));

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
        throw new RequestActionError("EMAIL_ERROR", "Não foi possível enviar o email requerido.");
    }
};

const escapeForILike = (value: string) => value.replace(/[%_]/g, "\\$&");

const buildSearchPattern = (value?: string) => {
    const trimmed = value?.trim();
    if (!trimmed) return null;
    const sanitized = escapeForILike(trimmed);
    const collapsed = sanitized.replace(/\s+/g, "%");
    return `%${collapsed}%`;
};

const buildOrFilters = (columns: string[], pattern: string) =>
    columns.map(column => `${column}.ilike.${pattern}`).join(",");

type SearchTarget = {
    columns: string[];
    foreignTable?: "client" | "property" | "unit";
};

const SEARCH_TARGETS: SearchTarget[] = [
    { columns: ["client_msg", "agent_msg"] },
    { columns: ["full_name", "email", "phone"], foreignTable: "client" },
    { columns: ["name", "address"], foreignTable: "property" },
    { columns: ["identifier", "block"], foreignTable: "unit" },
];

const VISIT_SEARCH_SELECT = `
    id,
    client:users!inner (id),
    property:properties!inner (id),
    unit:units!left (id)
`;

const RESERVATION_SEARCH_SELECT = `
    id,
    client:users!inner (id),
    property:properties!inner (id),
    unit:units!inner (id)
`;

const findMatchingRequestIds = async (
    table: "visit_requests" | "reservation_requests",
    status: string | undefined,
    pattern: string
) => {
    const selectClause = table === "visit_requests" ? VISIT_SEARCH_SELECT : RESERVATION_SEARCH_SELECT;
    const ids = new Set<string>();

    await Promise.all(
        SEARCH_TARGETS.map(async target => {
            let builder = supabaseAdmin.from(table).select(selectClause);
            if (status) {
                builder = builder.eq("status", status as RequestStatus);
            }
            if (target.foreignTable) {
                builder = builder.or(buildOrFilters(target.columns, pattern), { foreignTable: target.foreignTable });
            } else {
                builder = builder.or(buildOrFilters(target.columns, pattern));
            }
            const { data, error } = await builder;
            if (error) throw new Error(error.message);
            for (const row of data ?? []) {
                if (row?.id) ids.add(row.id);
            }
        })
    );

    return Array.from(ids);
};

const ensurePendingStatus = (status?: string | null) => {
    if (status !== "pending") {
        throw new RequestActionError("INVALID_STATUS", "A solicitação já foi processada.");
    }
};

const ensureApprovedStatus = (status?: string | null) => {
    if (status !== "approved") {
        throw new RequestActionError("INVALID_STATUS", "A solicitação não está aprovada.");
    }
};

const toStringArray = (value: unknown): string[] =>
    Array.isArray(value) ? value.filter((item): item is string => typeof item === "string" && item.length > 0) : [];

const parseDocuments = (documents?: UserRow["documents"]): DocumentsPayload => ({
    ...(documents && typeof documents === "object" ? (documents as DocumentsPayload) : {}),
});

const mapAgentsForRequest = (
    requestId: string,
    assignmentMap: Map<string, string[]>,
    agentMap: Map<string, AgentSummary>
) => {
    const agentIds = assignmentMap.get(requestId) ?? [];
    return agentIds
        .map(agentId => {
            const agent = agentMap.get(agentId);
            if (!agent) return null;
            return {
                ref: agent.id,
                name: agent.name,
                email: agent.email ?? "",
                phone: agent.phone ?? "",
                creci: agent.creci ?? "",
            };
        })
        .filter((value): value is NonNullable<typeof value> => Boolean(value));
};

const getAssignments = async (requestIds: string[], type: "visit" | "reservation"): Promise<AssignmentLookupResult> => {
    if (requestIds.length === 0) {
        return { map: new Map(), agents: new Map() };
    }
    const column = type === "visit" ? "visit_request_id" : "reservation_request_id";
    const { data, error } = await supabaseAdmin
        .from("request_assignments")
        .select("agent_id, visit_request_id, reservation_request_id")
        .in(column, requestIds);

    if (error) throw new Error(error.message);

    const assignmentMap = new Map<string, string[]>();
    const agentIds = new Set<string>();

    for (const row of (data ?? []) as AssignmentRow[]) {
        const requestId = (row as Record<typeof column, string | null>)[column];
        if (!requestId || !row.agent_id) continue;
        const list = assignmentMap.get(requestId) ?? [];
        list.push(row.agent_id);
        assignmentMap.set(requestId, list);
        agentIds.add(row.agent_id);
    }

    const agents = agentIds.size > 0 ? await fetchAgents(Array.from(agentIds)) : new Map<string, AgentSummary>();
    return { map: assignmentMap, agents };
};

const fetchAgents = async (agentIds: string[]): Promise<Map<string, AgentSummary>> => {
    if (agentIds.length === 0) return new Map();

    const [{ data: users, error: usersError }, { data: profiles, error: profilesError }] = await Promise.all([
        supabaseAdmin.from("users").select("id, full_name, email, phone").in("id", agentIds),
        supabaseAdmin.from("agents").select("user_id, creci").in("user_id", agentIds),
    ]);

    if (usersError) throw new Error(usersError.message);
    if (profilesError) throw new Error(profilesError.message);

    const creciMap = new Map<string, string | null>();
    for (const profile of profiles ?? []) {
        creciMap.set(profile.user_id, profile.creci ?? null);
    }

    const map = new Map<string, AgentSummary>();
    for (const user of users ?? []) {
        map.set(user.id, {
            id: user.id,
            name: user.full_name ?? "",
            email: user.email,
            phone: user.phone,
            creci: creciMap.get(user.id) ?? null,
        });
    }
    return map;
};

const buildVisitListItems = async (rows: VisitRowWithRelations[]): Promise<VisitRequestListItem[]> => {
    if (rows.length === 0) return [];
    const { map, agents } = await getAssignments(
        rows.map(row => row.id),
        "visit"
    );
    return rows.map(row => ({
        id: row.id,
        status: (row.status as VisitRequestListItem["status"]) ?? "pending",
        client: {
            ref: row.client?.id,
            fullName: row.client?.full_name ?? "",
            email: row.client?.email ?? "",
            phone: row.client?.phone ?? "",
            cpf: row.client?.cpf ?? "",
        },
        property: {
            id: row.property?.id ?? row.property_id,
            name: row.property?.name ?? "",
        },
        unit: {
            id: row.unit?.id ?? row.unit_id ?? "",
            identifier: row.unit?.identifier ?? "",
            block: row.unit?.block ?? "",
        },
        agents: mapAgentsForRequest(row.id, map, agents),
        requestedSlots: row.requested_slots ?? [],
        scheduledSlot: row.scheduled_slot,
        agentMsg: row.agent_msg ?? undefined,
        clientMsg: row.client_msg ?? undefined,
        createdAt: row.created_at ?? new Date(0).toISOString(),
        updatedAt: row.updated_at ?? undefined,
    }));
};

const buildReservationListItems = async (
    rows: ReservationRowWithRelations[]
): Promise<ReservationRequestListItem[]> => {
    if (rows.length === 0) return [];
    const { map, agents } = await getAssignments(
        rows.map(row => row.id),
        "reservation"
    );
    return rows.map(row => {
        const documents = parseDocuments(row.client?.documents);
        return {
            id: row.id,
            status: (row.status as ReservationRequestListItem["status"]) ?? "pending",
            client: {
                ref: row.client?.id,
                fullName: row.client?.full_name ?? "",
                address: row.client?.address ?? "",
                phone: row.client?.phone ?? "",
                rg: row.client?.rg ?? "",
                cpf: row.client?.cpf ?? "",
                email: row.client?.email ?? "",
                addressProof: toStringArray(documents.addressProof),
                incomeProof: toStringArray(documents.incomeProof),
                identityDoc: toStringArray(documents.identityDoc),
                bmCert: toStringArray(documents.bmCert),
            },
            property: {
                id: row.property?.id ?? row.property_id,
                name: row.property?.name ?? "",
            },
            unit: {
                id: row.unit?.id ?? row.unit_id,
                identifier: row.unit?.identifier ?? "",
                block: row.unit?.block ?? "",
            },
            agents: mapAgentsForRequest(row.id, map, agents),
            agentMsg: row.agent_msg ?? undefined,
            clientMsg: row.client_msg ?? undefined,
            createdAt: row.created_at ?? new Date(0).toISOString(),
            updatedAt: row.updated_at ?? undefined,
        };
    });
};

export const listVisitRequests = async ({
    status,
    q,
    page,
    pageSize,
}: ListOptions): Promise<ListResult<VisitRequestListItem>> => {
    const limit = pageSize ?? PAGE_SIZE_DEFAULT;
    const offset = (page - 1) * limit;

    let query = supabaseAdmin
        .from("visit_requests")
        .select(visitSelect, { count: "exact" })
        .order("created_at", { ascending: false });

    if (status) {
        query = query.eq("status", status as RequestStatus);
    }

    const searchPattern = buildSearchPattern(q);
    if (searchPattern) {
        const matchingIds = await findMatchingRequestIds("visit_requests", status, searchPattern);
        if (matchingIds.length === 0) {
            return { requests: [], total: 0, totalPages: 1 };
        }
        query = query.in("id", matchingIds);
    }

    query = query.range(offset, offset + limit - 1);

    const { data, count, error } = await query;
    if (error) throw new Error(error.message);

    const rows = (data ?? []) as VisitRowWithRelations[];
    const requests = await buildVisitListItems(rows);

    const total = count ?? requests.length;
    const totalPages = computePagination(total, limit);
    return { requests, total, totalPages };
};

export const listReservationRequests = async ({
    status,
    q,
    page,
    pageSize,
}: ListOptions): Promise<ListResult<ReservationRequestListItem>> => {
    const limit = pageSize ?? PAGE_SIZE_DEFAULT;
    const offset = (page - 1) * limit;

    let query = supabaseAdmin
        .from("reservation_requests")
        .select(reservationSelect, { count: "exact" })
        .order("created_at", { ascending: false });

    if (status) {
        query = query.eq("status", status as RequestStatus);
    }

    const searchPattern = buildSearchPattern(q);
    if (searchPattern) {
        const matchingIds = await findMatchingRequestIds("reservation_requests", status, searchPattern);
        if (matchingIds.length === 0) {
            return { requests: [], total: 0, totalPages: 1 };
        }
        query = query.in("id", matchingIds);
    }

    query = query.range(offset, offset + limit - 1);

    const { data, count, error } = await query;
    if (error) throw new Error(error.message);

    const rows = (data ?? []) as ReservationRowWithRelations[];
    const requests = await buildReservationListItems(rows);

    const total = count ?? requests.length;
    const totalPages = computePagination(total, limit);
    return { requests, total, totalPages };
};

const fetchVisitRequestById = async (id: string): Promise<VisitRowWithRelations> => {
    const { data, error } = await supabaseAdmin.from("visit_requests").select(visitSelect).eq("id", id).maybeSingle();

    if (error) throw new Error(error.message);
    if (!data) {
        throw new RequestActionError("NOT_FOUND", "Solicitação de visita não encontrada.");
    }
    return data as VisitRowWithRelations;
};

const fetchReservationRequestById = async (id: string): Promise<ReservationRowWithRelations> => {
    const { data, error } = await supabaseAdmin
        .from("reservation_requests")
        .select(reservationSelect)
        .eq("id", id)
        .maybeSingle();

    if (error) throw new Error(error.message);
    if (!data) {
        throw new RequestActionError("NOT_FOUND", "Solicitação de reserva não encontrada.");
    }
    return data as ReservationRowWithRelations;
};

const fetchAgentById = async (agentId: string) => {
    const { data: user, error } = await supabaseAdmin
        .from("users")
        .select("id, role, full_name, email, phone")
        .eq("id", agentId)
        .maybeSingle();

    if (error) throw new Error(error.message);
    if (!user) {
        throw new RequestActionError("AGENT_NOT_FOUND", "Corretor não encontrado.");
    }
    if (user.role !== "agent") {
        throw new RequestActionError("INVALID_INPUT", "O usuário selecionado não é um corretor válido.");
    }

    const { data: profile, error: profileError } = await supabaseAdmin
        .from("agents")
        .select("creci")
        .eq("user_id", agentId)
        .maybeSingle();

    if (profileError) throw new Error(profileError.message);

    return {
        id: user.id,
        fullName: user.full_name ?? "",
        email: user.email ?? undefined,
        phone: user.phone ?? undefined,
        creci: profile?.creci ?? "",
    };
};

const getAgentsForReservation = async (requestId: string) => {
    const { map, agents } = await getAssignments([requestId], "reservation");
    return mapAgentsForRequest(requestId, map, agents);
};

export const approveVisitRequest = async ({
    id,
    scheduledSlot,
    agentId,
    agentMsg,
    clientMsg,
}: {
    id: string;
    scheduledSlot: string;
    agentId: string;
    agentMsg?: string;
    clientMsg?: string;
}) => {
    const scheduledDate = new Date(scheduledSlot);
    if (Number.isNaN(scheduledDate.getTime())) {
        throw new RequestActionError("INVALID_INPUT", "Horário inválido.");
    }

    const request = await fetchVisitRequestById(id);
    ensurePendingStatus(request.status);

    const agent = await fetchAgentById(agentId);
    const trimmedAgentMsg = agentMsg?.trim();
    const trimmedClientMsg = clientMsg?.trim();
    const timestamp = nowIso();

    const { data: updatedRows, error: updateError } = await supabaseAdmin
        .from("visit_requests")
        .update({
            status: "approved",
            scheduled_slot: scheduledDate.toISOString(),
            agent_msg: trimmedAgentMsg || null,
            client_msg: trimmedClientMsg || null,
            updated_at: timestamp,
        })
        .eq("id", id)
        .eq("status", "pending")
        .select("id");

    if (updateError) throw new Error(updateError.message);
    if (!updatedRows || updatedRows.length === 0) {
        throw new RequestActionError("INVALID_STATUS", "A solicitação já foi processada.");
    }

    await supabaseAdmin.from("request_assignments").delete().eq("visit_request_id", id);
    const { error: assignmentError } = await supabaseAdmin.from("request_assignments").insert({
        visit_request_id: id,
        agent_id: agentId,
        assigned_at: timestamp,
    });
    if (assignmentError) throw new Error(assignmentError.message);

    const clientEmail = request.client?.email;
    const clientName = request.client?.full_name ?? "cliente";
    const propertyName = request.property?.name ?? "imóvel";
    const unitIdentifier = request.unit?.identifier ? ` - Unidade ${request.unit.identifier}` : "";
    const formattedSlot = formatDateTime(scheduledDate);

    if (clientEmail) {
        const clientMsgBlock = trimmedClientMsg
            ? `<div style="margin:12px 0"><p style="margin:0 0 6px">Mensagem da administração:</p><p style="margin:0">${formatMultiline(
                  trimmedClientMsg
              )}</p></div>`
            : "";
        const inner = `
            <p style="margin:0 0 12px">Olá ${escapeHtml(clientName)},</p>
            <p style="margin:0 0 8px">Boa notícia! Sua solicitação de visita ao imóvel <strong>${escapeHtml(
                propertyName
            )}${escapeHtml(unitIdentifier)}</strong> foi aprovada.</p>
            <p style="margin:0 0 4px">Horário agendado: <strong>${escapeHtml(formattedSlot)}</strong>.</p>
            <p style="margin:0 0 16px">Corretor responsável: <strong>${escapeHtml(agent.fullName)}</strong>.</p>
            ${clientMsgBlock}
            <p style="margin:0">Em breve o corretor entrará em contato para confirmar os detalhes.</p>
        `;
        const html = buildEmailLayout("Visita aprovada", inner);
        await sendEmail(clientEmail, "Visita aprovada", html);
    }

    if (agent.email) {
        const adminMsgBlock = trimmedAgentMsg
            ? `<div style="margin:12px 0"><p style="margin:0 0 6px">Mensagem da administração:</p><p style="margin:0">${formatMultiline(
                  trimmedAgentMsg
              )}</p></div>`
            : "";
        const inner = `
            <p style="margin:0 0 12px">Olá ${escapeHtml(agent.fullName)},</p>
            <p style="margin:0 0 8px">Você foi designado para acompanhar a visita do cliente <strong>${escapeHtml(
                clientName
            )}</strong> ao imóvel <strong>${escapeHtml(propertyName)}${escapeHtml(unitIdentifier)}</strong>.</p>
            <p style="margin:0 0 16px">Horário agendado: <strong>${escapeHtml(formattedSlot)}</strong>.</p>
            ${adminMsgBlock}
            <p style="margin:0">Por favor, entre em contato com o cliente para alinhar os próximos passos.</p>
        `;
        const html = buildEmailLayout("Nova visita agendada", inner);
        await sendEmail(agent.email, "Nova visita agendada", html);
    }
};

export const denyVisitRequest = async ({ id, clientMsg }: { id: string; clientMsg: string }) => {
    const trimmedClientMsg = clientMsg.trim();
    if (!trimmedClientMsg) {
        throw new RequestActionError("INVALID_INPUT", "Mensagem para o cliente é obrigatória.");
    }

    const request = await fetchVisitRequestById(id);
    ensurePendingStatus(request.status);

    const timestamp = nowIso();

    const { data: updatedRows, error } = await supabaseAdmin
        .from("visit_requests")
        .update({
            status: "denied",
            client_msg: trimmedClientMsg,
            agent_msg: null,
            scheduled_slot: null,
            updated_at: timestamp,
        })
        .eq("id", id)
        .eq("status", "pending")
        .select("id");

    if (error) throw new Error(error.message);
    if (!updatedRows || updatedRows.length === 0) {
        throw new RequestActionError("INVALID_STATUS", "A solicitação já foi processada.");
    }

    await supabaseAdmin.from("request_assignments").delete().eq("visit_request_id", id);

    const clientEmail = request.client?.email;
    const clientName = request.client?.full_name ?? "cliente";
    const propertyName = request.property?.name ?? "imóvel";

    if (clientEmail) {
        const inner = `
            <p style="margin:0 0 12px">Olá ${escapeHtml(clientName)},</p>
            <p style="margin:0 0 8px">Infelizmente sua solicitação de visita ao imóvel <strong>${escapeHtml(
                propertyName
            )}</strong> foi negada.</p>
            <p style="margin:0 0 6px">Motivo informado:</p>
            <p style="margin:0">${formatMultiline(trimmedClientMsg)}</p>
        `;
        const html = buildEmailLayout("Visita negada", inner);
        await sendEmail(clientEmail, "Visita negada", html);
    }
};

export const completeVisitRequest = async (id: string) => {
    const { status } = await fetchVisitRequestById(id);
    ensureApprovedStatus(status);

    const { data, error } = await supabaseAdmin
        .from("visit_requests")
        .update({ status: "completed", updated_at: nowIso() })
        .eq("id", id)
        .eq("status", "approved")
        .select("id");

    if (error) throw new Error(error.message);
    if (!data || data.length === 0) {
        throw new RequestActionError("INVALID_STATUS", "A solicitação não está aprovada.");
    }
};

export const cancelVisitRequest = async ({
    id,
    clientMsg,
    agentMsg,
}: {
    id: string;
    clientMsg?: string;
    agentMsg?: string;
}) => {
    const request = await fetchVisitRequestById(id);
    ensureApprovedStatus(request.status);

    const trimmedClientMsg = clientMsg?.trim();
    const trimmedAgentMsg = agentMsg?.trim();

    const { data, error } = await supabaseAdmin
        .from("visit_requests")
        .update({
            status: "denied",
            client_msg: trimmedClientMsg || null,
            agent_msg: trimmedAgentMsg || null,
            scheduled_slot: null,
            updated_at: nowIso(),
        })
        .eq("id", id)
        .eq("status", "approved")
        .select("id");

    if (error) throw new Error(error.message);
    if (!data || data.length === 0) {
        throw new RequestActionError("INVALID_STATUS", "A solicitação não está aprovada.");
    }

    await supabaseAdmin.from("request_assignments").delete().eq("visit_request_id", id);

    const clientEmail = request.client?.email;
    const clientName = request.client?.full_name ?? "cliente";
    const propertyName = request.property?.name ?? "imóvel";

    if (clientEmail) {
        const messageBlock = trimmedClientMsg
            ? `<p style="margin:0 0 6px">Mensagem:</p><p style="margin:0">${formatMultiline(trimmedClientMsg)}</p>`
            : "";
        const inner = `
            <p style="margin:0 0 12px">Olá ${escapeHtml(clientName)},</p>
            <p style="margin:0 0 8px">Sua visita ao imóvel <strong>${escapeHtml(propertyName)}</strong> foi cancelada.</p>
            ${messageBlock}
        `;
        const html = buildEmailLayout("Visita cancelada", inner);
        await sendEmail(clientEmail, "Visita cancelada", html);
    }
};

export const approveReservationRequest = async ({
    id,
    clientMsg,
    agentMsg,
    agentId,
}: {
    id: string;
    clientMsg?: string;
    agentMsg?: string;
    agentId?: string;
}) => {
    const request = await fetchReservationRequestById(id);
    ensurePendingStatus(request.status);

    const trimmedClientMsg = clientMsg?.trim();
    const trimmedAgentMsg = agentMsg?.trim();
    const timestamp = nowIso();

    const assignedAgent = agentId ? await fetchAgentById(agentId) : null;

    const unitId = request.unit?.id ?? request.unit_id;
    if (!unitId) {
        throw new RequestActionError("INVALID_INPUT", "Informações da unidade não encontradas.");
    }

    const { data: updatedUnits, error: unitError } = await supabaseAdmin
        .from("units")
        .update({ is_available: false })
        .eq("id", unitId)
        .eq("is_available", true)
        .select("id");

    if (unitError) {
        throw new RequestActionError("UNIT_UNAVAILABLE", "Não foi possível reservar a unidade no momento.");
    }

    if (!updatedUnits || updatedUnits.length === 0) {
        throw new RequestActionError("UNIT_UNAVAILABLE", "A unidade selecionada já não está mais disponível.");
    }

    try {
        const { data, error } = await supabaseAdmin
            .from("reservation_requests")
            .update({
                status: "approved",
                client_msg: trimmedClientMsg || null,
                agent_msg: trimmedAgentMsg || null,
                updated_at: timestamp,
            })
            .eq("id", id)
            .eq("status", "pending")
            .select("id");
        if (error) throw error;
        if (!data || data.length === 0) {
            throw new RequestActionError("INVALID_STATUS", "A solicitação já foi processada.");
        }

        if (assignedAgent) {
            await supabaseAdmin.from("request_assignments").delete().eq("reservation_request_id", id);
            const { error: assignmentError } = await supabaseAdmin.from("request_assignments").insert({
                reservation_request_id: id,
                agent_id: assignedAgent.id,
                assigned_at: timestamp,
            });
            if (assignmentError) throw assignmentError;
        }
    } catch (error) {
        await supabaseAdmin.from("units").update({ is_available: true }).eq("id", unitId);
        if (error instanceof RequestActionError) {
            throw error;
        }
        throw new RequestActionError("INVALID_STATUS", "Não foi possível atualizar a solicitação de reserva.");
    }

    const clientEmail = request.client?.email;
    const clientName = request.client?.full_name ?? "cliente";
    const propertyName = request.property?.name ?? "imóvel";
    const unitInfo = `${request.unit?.identifier ?? ""}${request.unit?.block ? ` - Bloco ${request.unit.block}` : ""}`;

    if (clientEmail) {
        const clientMsgBlock = trimmedClientMsg
            ? `<div style="margin:12px 0"><p style="margin:0 0 6px">Mensagem da administração:</p><p style="margin:0">${formatMultiline(
                  trimmedClientMsg
              )}</p></div>`
            : "";
        const inner = `
            <p style="margin:0 0 12px">Olá ${escapeHtml(clientName)},</p>
            <p style="margin:0 0 8px">Sua solicitação de reserva para o imóvel <strong>${escapeHtml(
                propertyName
            )}</strong> ${escapeHtml(unitInfo)} foi aprovada.</p>
            ${clientMsgBlock}
            <p style="margin:0">Em breve entraremos em contato para orientar os próximos passos.</p>
        `;
        const html = buildEmailLayout("Reserva aprovada", inner);
        await sendEmail(clientEmail, "Reserva aprovada", html);
    }

    if (assignedAgent?.email) {
        const adminMsgBlock = trimmedAgentMsg
            ? `<div style="margin:12px 0"><p style="margin:0 0 6px">Mensagem da administração:</p><p style="margin:0">${formatMultiline(
                  trimmedAgentMsg
              )}</p></div>`
            : "";
        const inner = `
            <p style="margin:0 0 12px">Olá ${escapeHtml(assignedAgent.fullName)},</p>
            <p style="margin:0 0 8px">Você foi designado para a reserva do imóvel <strong>${escapeHtml(
                propertyName
            )}</strong> ${escapeHtml(unitInfo)}.</p>
            ${adminMsgBlock}
            <p style="margin:0">Entre em contato com o cliente para alinhar os próximos passos.</p>
        `;
        const html = buildEmailLayout("Reserva aprovada", inner);
        await sendEmail(assignedAgent.email, "Reserva aprovada", html);
    } else if (trimmedAgentMsg) {
        const agents = await getAgentsForReservation(id);
        const emails = agents.map(agent => agent.email).filter((email): email is string => Boolean(email));
        if (emails.length > 0) {
            const inner = `
                <p style="margin:0 0 12px">Olá,</p>
                <p style="margin:0 0 8px">Há uma solicitação de reserva aprovada para o imóvel <strong>${escapeHtml(
                    propertyName
                )}</strong> ${escapeHtml(unitInfo)}.</p>
                <p style="margin:0 0 6px">Mensagem da administração:</p>
                <p style="margin:0">${formatMultiline(trimmedAgentMsg)}</p>
            `;
            const html = buildEmailLayout("Reserva aprovada", inner);
            await sendEmail(emails, "Reserva aprovada", html);
        }
    }
};

export const denyReservationRequest = async ({ id, clientMsg }: { id: string; clientMsg: string }) => {
    const trimmedClientMsg = clientMsg.trim();
    if (!trimmedClientMsg) {
        throw new RequestActionError("INVALID_INPUT", "Mensagem para o cliente é obrigatória.");
    }

    const request = await fetchReservationRequestById(id);
    ensurePendingStatus(request.status);

    const { data, error } = await supabaseAdmin
        .from("reservation_requests")
        .update({
            status: "denied",
            client_msg: trimmedClientMsg,
            agent_msg: null,
            updated_at: nowIso(),
        })
        .eq("id", id)
        .eq("status", "pending")
        .select("id");

    if (error) throw new Error(error.message);
    if (!data || data.length === 0) {
        throw new RequestActionError("INVALID_STATUS", "A solicitação já foi processada.");
    }

    await supabaseAdmin.from("request_assignments").delete().eq("reservation_request_id", id);

    const clientEmail = request.client?.email;
    const clientName = request.client?.full_name ?? "cliente";
    const propertyName = request.property?.name ?? "imóvel";

    if (clientEmail) {
        const clientHtml = `
            <p>Olá ${escapeHtml(clientName)},</p>
            <p>Infelizmente sua solicitação de reserva para o imóvel <strong>${escapeHtml(propertyName)}</strong> não pôde ser aprovada.</p>
            <p>Motivo informado:</p>
            <p>${formatMultiline(trimmedClientMsg)}</p>
        `;
        await sendEmail(clientEmail, "Reserva negada", buildEmailLayout("Reserva negada", clientHtml));
    }
};

export const completeReservationRequest = async (id: string) => {
    const { status } = await fetchReservationRequestById(id);
    ensureApprovedStatus(status);

    const { data, error } = await supabaseAdmin
        .from("reservation_requests")
        .update({ status: "completed", updated_at: nowIso() })
        .eq("id", id)
        .eq("status", "approved")
        .select("id");

    if (error) throw new Error(error.message);
    if (!data || data.length === 0) {
        throw new RequestActionError("INVALID_STATUS", "A solicitação não está aprovada.");
    }
};

export const cancelReservationRequest = async ({
    id,
    clientMsg,
    agentMsg,
}: {
    id: string;
    clientMsg?: string;
    agentMsg?: string;
}) => {
    const request = await fetchReservationRequestById(id);
    ensureApprovedStatus(request.status);

    const unitId = request.unit?.id ?? request.unit_id;
    if (unitId) {
        await supabaseAdmin.from("units").update({ is_available: true }).eq("id", unitId);
    }

    const trimmedClientMsg = clientMsg?.trim();
    const trimmedAgentMsg = agentMsg?.trim();

    const { data, error } = await supabaseAdmin
        .from("reservation_requests")
        .update({
            status: "denied",
            client_msg: trimmedClientMsg || null,
            agent_msg: trimmedAgentMsg || null,
            updated_at: nowIso(),
        })
        .eq("id", id)
        .eq("status", "approved")
        .select("id");

    if (error) throw new Error(error.message);
    if (!data || data.length === 0) {
        throw new RequestActionError("INVALID_STATUS", "A solicitação não está aprovada.");
    }

    await supabaseAdmin.from("request_assignments").delete().eq("reservation_request_id", id);

    const clientEmail = request.client?.email;
    const clientName = request.client?.full_name ?? "cliente";
    const propertyName = request.property?.name ?? "imóvel";

    if (clientEmail) {
        const messageBlock = trimmedClientMsg
            ? `<p style="margin:0 0 6px">Mensagem:</p><p style="margin:0">${formatMultiline(trimmedClientMsg)}</p>`
            : "";
        const inner = `
            <p style="margin:0 0 12px">Olá ${escapeHtml(clientName)},</p>
            <p style="margin:0 0 8px">Sua solicitação de reserva do imóvel <strong>${escapeHtml(
                propertyName
            )}</strong> foi cancelada.</p>
            ${messageBlock}
        `;
        const html = buildEmailLayout("Reserva cancelada", inner);
        await sendEmail(clientEmail, "Reserva cancelada", html);
    }
};

export const deleteVisitRequest = async (id: string) => {
    const request = await fetchVisitRequestById(id);

    await supabaseAdmin.from("request_assignments").delete().eq("visit_request_id", id);

    const { data, error } = await supabaseAdmin.from("visit_requests").delete().eq("id", id).select("id");
    if (error) throw new Error(error.message);
    if (!data || data.length === 0) {
        throw new RequestActionError("NOT_FOUND", "Solicitação de visita não encontrada.");
    }

    // Se a visita estava aprovada, não há efeito colateral em unidades; limpeza já foi feita.
    return request.id;
};

export const deleteReservationRequest = async (id: string) => {
    const request = await fetchReservationRequestById(id);

    const unitId = request.unit?.id ?? request.unit_id;
    if (unitId && (request.status === "approved" || request.status === "completed")) {
        await supabaseAdmin.from("units").update({ is_available: true }).eq("id", unitId);
    }

    await supabaseAdmin.from("request_assignments").delete().eq("reservation_request_id", id);

    const { data, error } = await supabaseAdmin.from("reservation_requests").delete().eq("id", id).select("id");
    if (error) throw new Error(error.message);
    if (!data || data.length === 0) {
        throw new RequestActionError("NOT_FOUND", "Solicitação de reserva não encontrada.");
    }

    return request.id;
};
