import { verifySessionCookie } from "@/firebase/firebase-admin-config";
import { normalizePropertyArrays } from "@/lib/normalizePropertyArrays";
import { supabaseAdmin } from "@/supabase/supabase-admin";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
    const supabase = supabaseAdmin;
    const { searchParams } = new URL(request.url);

    const sessionCookie = request.cookies.get("session")?.value;
    let groupsFilter: string[] | null = null;

    if (sessionCookie) {
        try {
            const claims = await verifySessionCookie(sessionCookie).catch(() => null);
            const uid = claims?.uid;

            // busca a role direto do banco para garantir consistência dos claims
            if (uid) {
                const { data: userRow, error: userError } = await supabase
                    .from("users")
                    .select("role, agents(groups)")
                    .eq("id", uid)
                    .single();

                if (userError && userError.code !== "PGRST116") {
                    console.error("Supabase User Role Error:", userError);
                }

                const role = (userRow?.role as string | undefined) ?? claims?.role;

                if (role === "agent") {
                    const agentGroups = Array.isArray(
                        (userRow?.agents as { groups?: unknown } | null | undefined)?.groups
                    )
                        ? ((userRow?.agents as { groups?: string[] })?.groups ?? [])
                        : [];

                    const normalizedGroups = agentGroups.map(g => `${g}`.trim()).filter(Boolean);
                    groupsFilter = normalizedGroups.length > 0 ? normalizedGroups : [];
                } else {
                    groupsFilter = null; // admins e clientes veem tudo
                }
            }
        } catch (err) {
            console.error("Erro ao verificar sessão para grupos", err);
            // sem sessão válida mantém groupsFilter como null para busca pública
        }
    }

    const q = searchParams.get("q") || undefined;
    const boundsStr = searchParams.get("bounds");
    let min_lat, min_lng, max_lat, max_lng;
    if (boundsStr) {
        [min_lat, min_lng, max_lat, max_lng] = boundsStr.split(",").map(Number);
    }

    const min_price_filter = searchParams.get("minPrice") ? Number(searchParams.get("minPrice")) : undefined;
    const max_price_filter = searchParams.get("maxPrice") ? Number(searchParams.get("maxPrice")) : undefined;

    const parseIntegerArray = (param: string | null): number[] | undefined => {
        if (!param) return undefined;
        const arr = param
            .split(",")
            .map(Number)
            .filter(n => !isNaN(n));
        return arr.length > 0 ? arr : undefined;
    };

    const bedroom_filter = parseIntegerArray(searchParams.get("bedrooms"));
    const bathroom_filter = parseIntegerArray(searchParams.get("bathrooms"));
    const garage_filter = parseIntegerArray(searchParams.get("garages"));

    const page = parseInt(searchParams.get("page") || "1", 10);
    const pageSize = 15;
    const page_offset = (page - 1) * pageSize;

    const { data, error } = await supabase.rpc("search_properties", {
        query_text: q,
        min_lat,
        min_lng,
        max_lat,
        max_lng,
        min_price_filter,
        max_price_filter,
        bedroom_filter,
        bathroom_filter,
        garage_filter,
        page_limit: pageSize,
        page_offset,
        groups_filter: groupsFilter,
    });

    if (error) {
        console.error("Supabase RPC Error:", error);
        return NextResponse.json(
            { message: "Erro ao buscar propriedades", code: "SUPABASE_RPC_ERROR" },
            { status: 500 }
        );
    }

    const totalProperties = data?.[0]?.total_properties ?? 0;
    const hasNextPage = page_offset + (data?.length ?? 0) < totalProperties;

    const formattedProperties =
        data?.map(p => {
            const n = normalizePropertyArrays(p as unknown as Record<string, unknown>);
            return {
                id: p.id,
                name: p.name,
                address: p.address,
                propertyImages: n.property_images,
                location: { lat: p.lat, lng: p.lng },
                deliveryDate: p.delivery_date,
                launchDate: p.launch_date,
                features: n.features,
                searchableUnitFeats: {
                    minPrice: p.min_unit_price,
                    maxPrice: p.max_unit_price,
                    bedrooms: p.available_bedrooms || [],
                    baths: p.available_bathrooms || [],
                    garages: p.available_garages || [],
                    minSize: p.min_unit_size,
                    maxSize: p.max_unit_size,
                    sizes: [],
                },
            };
        }) ?? [];

    return NextResponse.json({
        properties: formattedProperties,
        nextPageCursor: hasNextPage ? String(page + 1) : null,
        hasNextPage: hasNextPage,
        totalProperties: totalProperties,
    });
}
