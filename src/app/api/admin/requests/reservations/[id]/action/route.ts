import { verifySessionCookie } from "@/firebase/firebase-admin-config";
import {
    approveReservationRequest,
    cancelReservationRequest,
    completeReservationRequest,
    denyReservationRequest,
    RequestActionError,
} from "@/services/adminRequestsService";
import { NextRequest, NextResponse } from "next/server";

type ActionRequestBody =
    | {
          action: "approve";
          clientMsg?: string;
          agentMsg?: string;
          agentId?: string;
      }
    | {
          action: "deny";
          clientMsg: string;
      }
    | { action: "complete" }
    | { action: "cancel"; clientMsg?: string; agentMsg?: string };

async function isAdmin(request: NextRequest): Promise<boolean> {
    const sessionCookie = request.cookies.get("session")?.value;
    if (!sessionCookie) return false;
    const decoded = await verifySessionCookie(sessionCookie);
    return decoded?.role === "admin";
}

const mapErrorToStatus = (code: RequestActionError["code"]): number => {
    switch (code) {
        case "NOT_FOUND":
            return 404;
        case "INVALID_STATUS":
            return 409;
        case "INVALID_INPUT":
            return 400;
        case "UNIT_UNAVAILABLE":
            return 409;
        default:
            return 500;
    }
};

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
    if (!(await isAdmin(request))) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { id } = await context.params;
        const body = (await request.json()) as ActionRequestBody | null;
        if (!body || typeof body !== "object" || !("action" in body)) {
            return NextResponse.json({ error: "Corpo da requisição inválido" }, { status: 400 });
        }

        if (body.action === "approve") {
            const { clientMsg, agentMsg, agentId } = body;
            await approveReservationRequest({ id, clientMsg, agentMsg, agentId });
            return NextResponse.json({ message: "Reserva aprovada com sucesso" });
        }

        if (body.action === "deny") {
            const { clientMsg } = body;
            if (!clientMsg || !clientMsg.trim()) {
                return NextResponse.json({ error: "Mensagem para o cliente é obrigatória" }, { status: 400 });
            }
            await denyReservationRequest({ id, clientMsg });
            return NextResponse.json({ message: "Reserva negada com sucesso" });
        }

        if (body.action === "complete") {
            await completeReservationRequest(id);
            return NextResponse.json({ message: "Reserva marcada como concluída" });
        }

        if (body.action === "cancel") {
            const { clientMsg, agentMsg } = body;
            await cancelReservationRequest({ id, clientMsg, agentMsg });
            return NextResponse.json({ message: "Reserva cancelada com sucesso" });
        }

        return NextResponse.json({ error: "Ação inválida" }, { status: 400 });
    } catch (error) {
        if (error instanceof RequestActionError) {
            return NextResponse.json({ error: error.message }, { status: mapErrorToStatus(error.code) });
        }
        console.error("Error processing reservation request action", error);
        return NextResponse.json({ error: "Erro interno" }, { status: 500 });
    }
}
