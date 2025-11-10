// GET /api/properties/[id]/units/floorPlan

import { supabaseAdmin } from "@/supabase/supabase-admin";
import { NextRequest, NextResponse } from "next/server";

// Returns: { floorPlanUrl: string[] }
export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }): Promise<NextResponse> {
    const { id } = await context.params;

    try{
        let query = supabaseAdmin
            .from("units")
            .select("floor_plan_urls")
            .eq("property_id", id);

        const { data, error } = await query;
        if (error) {
            console.error("Supabase floor plan query error:", error);
            return NextResponse.json({ error: "Erro ao buscar plantas baixas" }, { status: 500 });
        }

        const floorPlanUrlsSet = new Set<string>();
        (data || []).forEach(u => {
            const urls = (u.floor_plan_urls as string[] | null) ?? [];
            urls.forEach(url => floorPlanUrlsSet.add(url));
        });

        const floorPlanUrls = Array.from(floorPlanUrlsSet);

        return NextResponse.json({ floorPlanUrls });

    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
    }
}