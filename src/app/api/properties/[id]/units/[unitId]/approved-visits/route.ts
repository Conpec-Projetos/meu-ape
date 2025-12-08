import { supabaseAdmin } from "@/supabase/supabase-admin";
import { NextResponse, type NextRequest } from "next/server";

export async function GET(request: NextRequest, context: { params: Promise<{ id: string; unitId: string }> }) {
    try {
        const { id: propertyId, unitId } = await context.params;

        if (!propertyId || !unitId) {
            return NextResponse.json({ error: "Parâmetros inválidos" }, { status: 400 });
        }

        const { data, error } = await supabaseAdmin
            .from("visit_requests")
            .select("scheduled_slot")
            .eq("property_id", propertyId)
            .eq("unit_id", unitId)
            .eq("status", "approved")
            .not("scheduled_slot", "is", null);

        if (error) {
            console.error("Erro ao buscar visitas aprovadas:", error.message);
            return NextResponse.json({ error: "Falha ao carregar visitas aprovadas" }, { status: 500 });
        }

        const slots = (data ?? [])
            .map(row => row.scheduled_slot)
            .filter(Boolean)
            .map(String);

        return NextResponse.json({ scheduledSlots: slots });
    } catch (err) {
        console.error("Erro inesperado ao buscar visitas aprovadas:", err);
        return NextResponse.json({ error: "Erro interno" }, { status: 500 });
    }
}
