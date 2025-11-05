import { listReservationRequests, listVisitRequests } from "@/firebase/admin/requests/service";
import { verifySessionCookie } from "@/firebase/firebase-admin-config";
import { NextRequest, NextResponse } from "next/server";

async function isAdmin(request: NextRequest): Promise<boolean> {
    const sessionCookie = request.cookies.get("session")?.value;
    if (!sessionCookie) return false;
    const decoded = await verifySessionCookie(sessionCookie);
    return decoded?.role === "admin";
}

const VISIT_STATUSES = new Set(["pending", "approved", "denied", "completed"]);
// Allow completed for reservations as well (after approval lifecycle)
const RESERVATION_STATUSES = new Set(["pending", "approved", "denied", "completed"]);
const DEFAULT_PAGE_SIZE = 15;

export async function GET(request: NextRequest) {
    if (!(await isAdmin(request))) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { searchParams } = new URL(request.url);
        const typeParam = searchParams.get("type") === "reservations" ? "reservations" : "visits";
        const statusParam = searchParams.get("status")?.toLowerCase() ?? undefined;
        const qParam = searchParams.get("q") ?? undefined;
        const pageParam = Number.parseInt(searchParams.get("page") ?? "1", 10);
        const page = Number.isNaN(pageParam) || pageParam < 1 ? 1 : pageParam;

        if (statusParam) {
            const allowedStatuses = typeParam === "visits" ? VISIT_STATUSES : RESERVATION_STATUSES;
            if (!allowedStatuses.has(statusParam)) {
                return NextResponse.json({ error: "Status inválido" }, { status: 400 });
            }
        }

        const listOptions = {
            status: statusParam,
            q: qParam,
            page,
            pageSize: DEFAULT_PAGE_SIZE,
        };

        if (typeParam === "visits") {
            const result = await listVisitRequests(listOptions);
            return NextResponse.json(result);
        }

        const result = await listReservationRequests(listOptions);
        return NextResponse.json(result);
    } catch (error) {
        console.error("Error fetching admin requests", error);
        return NextResponse.json({ error: "Erro interno" }, { status: 500 });
    }
}
