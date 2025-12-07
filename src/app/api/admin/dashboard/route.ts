import { supabaseAdmin } from "@/supabase/supabase-admin";
import { Database } from "@/supabase/types/types";
import { NextResponse } from "next/server";

type RequestTable = "visit_requests" | "reservation_requests" | "agent_registration_requests";
const PENDING_STATUS: Database["public"]["Enums"]["request_status"] = "pending";

const countTableRows = async (table: RequestTable, status?: Database["public"]["Enums"]["request_status"]) => {
    let query = supabaseAdmin.from(table).select("*", { count: "exact", head: true });
    if (status) {
        query = query.eq("status", status);
    }
    const { count, error } = await query;
    if (error) throw error;
    return count ?? 0;
};

const countProperties = async () => {
    const { count, error } = await supabaseAdmin.from("properties").select("*", { count: "exact", head: true });
    if (error) throw error;
    return count ?? 0;
};

export async function GET() {
    try {
        const [pendingVisits, pendingReservations, pendingRegistrations, properties] = await Promise.all([
            countTableRows("visit_requests", PENDING_STATUS),
            countTableRows("reservation_requests", PENDING_STATUS),
            countTableRows("agent_registration_requests", PENDING_STATUS),
            countProperties(),
        ]);

        return NextResponse.json({
            countVisits: { pendingVisitRequest: pendingVisits },
            countReservations: { pendingReservationRequest: pendingReservations },
            countRegistrations: { pendingAgentRegistrationRequest: pendingRegistrations },
            countProperties: properties,
        });
    } catch (error) {
        console.error("Failed to get counts:", error);
        return NextResponse.json({ error: "Failed to get counts" }, { status: 500 });
    }
}
