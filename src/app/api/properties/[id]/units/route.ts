import { supabaseAdmin } from "@/supabase/supabase-admin";
import { NextRequest, NextResponse } from "next/server";

const PAGE_SIZE = 10;

// GET /api/properties/[id]/units?block=...&category=...&cursor=...
// Returns: { units, nextCursor, hasNextPage }
export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }): Promise<NextResponse> {
    const { id } = await context.params;
    const { searchParams } = new URL(request.url);

    const block = searchParams.get("block") || undefined;
    const category = searchParams.get("category") || undefined;
    const cursorIdentifier = searchParams.get("cursorIdentifier") || undefined;
    const cursorId = searchParams.get("cursorId") || undefined;

    if (!block || !category) {
        return NextResponse.json({ error: "Parâmetros 'block' e 'category' são obrigatórios" }, { status: 400 });
    }

    try {
        let query = supabaseAdmin
            .from("units")
            .select(
                "id, identifier, property_id, block, category, price, size_sqm, bedrooms, baths, garages, is_available, floor, images, created_at, updated_at"
            )
            .eq("property_id", id)
            .eq("is_available", true)
            .eq("block", block)
            .contains("category", [category])
            .order("identifier", { ascending: true })
            .order("id", { ascending: true })
            .limit(PAGE_SIZE);

        if (cursorIdentifier && cursorId) {
            // Composite keyset: identifier > cursorIdentifier OR (identifier = cursorIdentifier AND id > cursorId)
            query = query.or(
                `identifier.gt.${cursorIdentifier},and(identifier.eq.${cursorIdentifier},id.gt.${cursorId})`
            );
        }

        const { data, error } = await query;
        if (error) {
            console.error("Supabase units query error:", error);
            return NextResponse.json({ error: "Erro ao buscar unidades" }, { status: 500 });
        }

        const units = (data || []).map(u => ({
            id: u.id as string,
            identifier: u.identifier as string,
            propertyId: u.property_id as string,
            block: (u.block as string | null) ?? undefined,
            category: ((u.category as string[] | null) ?? [])[0],
            price: (u.price as number | null) ?? 0,
            size_sqm: (u.size_sqm as number | null) ?? 0,
            bedrooms: (u.bedrooms as number | null) ?? 0,
            baths: (u.baths as number | null) ?? 0,
            garages: (u.garages as number | null) ?? 0,
            isAvailable: (u.is_available as boolean | null) ?? false,
            floor: (u.floor as number | null) ?? 0,
            images: (u.images as string[] | null) ?? [],
            createdAt: u.created_at ? new Date(u.created_at as string) : new Date(0),
            updatedAt: u.updated_at ? new Date(u.updated_at as string) : new Date(0),
        }));

        const last = units.length === PAGE_SIZE ? units[units.length - 1] : undefined;
        const nextCursor = last ? { identifier: last.identifier, id: last.id! } : null;
        const hasNextPage = Boolean(nextCursor);

        return NextResponse.json({ units, nextCursor, hasNextPage });
    } catch (e) {
        console.error(e);
        return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
    }
}
