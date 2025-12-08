import { verifySessionCookie } from "@/firebase/firebase-admin-config";
import { getUserRequests } from "@/services/dashboardService";
import { NextResponse, type NextRequest } from "next/server";

const PAGE_SIZE = 15;

export async function GET(request: NextRequest) {
    try {
        // 1. Verify user session
        const sessionCookie = request.cookies.get("session")?.value;
        if (!sessionCookie) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        const decodedClaims = await verifySessionCookie(sessionCookie);
        if (!decodedClaims) {
            const response = NextResponse.json({ error: "Unauthorized - Invalid session" }, { status: 401 });
            response.cookies.delete("session");
            return response;
        }
        const userId = decodedClaims.uid;

        // 2. Parse query parameters
        const { searchParams } = new URL(request.url);
        const typeParam = searchParams.get("type");
        const cursor = searchParams.get("cursor") || searchParams.get("page") || undefined;

        if (typeParam !== "visits" && typeParam !== "reservations") {
            return NextResponse.json(
                { error: "Invalid type parameter. Use 'visits' or 'reservations'." },
                { status: 400 }
            );
        }
        const type = typeParam as "visits" | "reservations";

        const page = cursor ? Math.max(1, Number.parseInt(cursor, 10) || 1) : 1;

        const { requests: rawRequests, totalPages } = await getUserRequests(userId, type, page, PAGE_SIZE);

        const requests = type === "visits" ? mapVisitRequests(rawRequests) : mapReservationRequests(rawRequests);

        const hasNextPage = page < totalPages;
        const nextPageCursor = hasNextPage ? String(page + 1) : null;

        return NextResponse.json({ requests, nextPageCursor, hasNextPage });
    } catch (error) {
        console.error("Error fetching user requests:", error);
        const message = error instanceof Error ? error.message : "Internal Server Error";
        let status = 500;
        // Trata especificamente erros de autenticação para instruir o cliente
        if (
            error &&
            typeof error === "object" &&
            "code" in error &&
            typeof error.code === "string" &&
            error.code.startsWith("auth/")
        ) {
            status = 401;
        }
        const response = NextResponse.json({ error: message }, { status });
        if (status === 401) {
            response.cookies.delete("session");
        }
        return response;
    }
}

type PropertyShape = {
    id: string;
    name: string | null;
    address: string | null;
} | null;

type UnitShape = {
    id: string;
    identifier: string | null;
    block: string | null;
} | null;

type AgentShape = {
    user: {
        full_name: string | null;
        email: string | null;
        phone: string | null;
        agents: { creci: string | null } | { creci: string | null }[] | null;
    } | null;
};

type RequestWithAssignments = {
    assignments: AgentShape[] | null;
};

type VisitRequestRow = {
    id: string;
    status: string;
    requested_slots: string[] | null;
    scheduled_slot: string | null;
    client_msg: string | null;
    agent_msg: string | null;
    created_at: string;
    updated_at: string;
    property: PropertyShape;
    unit: UnitShape;
} & RequestWithAssignments;

type ReservationRequestRow = {
    id: string;
    status: string;
    client_msg: string | null;
    agent_msg: string | null;
    transaction_docs: Record<string, unknown> | null;
    created_at: string;
    updated_at: string;
    property: PropertyShape;
    unit: UnitShape;
} & RequestWithAssignments;

const mapAgents = (assignments: AgentShape[] | null) => {
    if (!assignments) return [];
    return assignments.map(agentAssignment => {
        const user = agentAssignment?.user;
        const agentProfile = Array.isArray(user?.agents) ? user?.agents?.[0] : user?.agents;

        return {
            ref: null,
            name: user?.full_name ?? "",
            email: user?.email ?? "",
            phone: user?.phone ?? "",
            creci: agentProfile?.creci ?? "",
        };
    });
};

const mapVisitRequest = (row: VisitRequestRow) => ({
    id: row.id,
    status: row.status,
    property: normalizeProperty(row.property),
    unit: normalizeUnit(row.unit),
    requestedSlots: row.requested_slots ?? [],
    scheduledSlot: row.scheduled_slot,
    clientMsg: row.client_msg,
    agentMsg: row.agent_msg,
    agents: mapAgents(row.assignments),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
});

const mapReservationRequest = (row: ReservationRequestRow) => ({
    id: row.id,
    status: row.status,
    property: normalizeProperty(row.property),
    unit: normalizeUnit(row.unit),
    clientMsg: row.client_msg,
    agentMsg: row.agent_msg,
    transactionDocs: row.transaction_docs ?? {},
    agents: mapAgents(row.assignments),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
});

const normalizeProperty = (property: PropertyShape) =>
    property
        ? {
              id: property.id,
              name: property.name ?? "",
              address: property.address ?? "",
          }
        : null;

const normalizeUnit = (unit: UnitShape) =>
    unit
        ? {
              id: unit.id,
              identifier: unit.identifier ?? "",
              block: unit.block ?? "",
          }
        : null;

const mapVisitRequests = (rows: unknown[]) => rows.map(row => mapVisitRequest(row as VisitRequestRow));

const mapReservationRequests = (rows: unknown[]) =>
    rows.map(row => mapReservationRequest(row as ReservationRequestRow));
