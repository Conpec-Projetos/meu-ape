import { verifySessionCookie } from "@/firebase/firebase-admin-config";
import { RequestActionError, deleteReservationRequest } from "@/services/adminRequestsService";
import { NextRequest, NextResponse } from "next/server";

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
        case "INVALID_INPUT":
        case "UNIT_UNAVAILABLE":
            return 400;
        default:
            return 500;
    }
};

export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
    if (!(await isAdmin(request))) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { id } = await context.params;
        await deleteReservationRequest(id);
        return NextResponse.json({ message: "Solicitação de reserva deletada com sucesso" });
    } catch (error) {
        if (error instanceof RequestActionError) {
            return NextResponse.json({ error: error.message }, { status: mapErrorToStatus(error.code) });
        }
        console.error("Error deleting reservation request", error);
        return NextResponse.json({ error: "Erro interno" }, { status: 500 });
    }
}
