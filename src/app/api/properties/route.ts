import { supabaseAdmin } from "@/supabase/supabase-admin";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
    const supabase = supabaseAdmin;
    const { searchParams } = new URL(request.url);

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
        data?.map(p => ({
            id: p.id,
            name: p.name,
            address: p.address,
            propertyImages: p.property_images,
            location: { lat: p.lat, lng: p.lng },
            deliveryDate: p.delivery_date,
            launchDate: p.launch_date,
            features: p.features,
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
        })) ?? [];

    return NextResponse.json({
        properties: formattedProperties,
        nextPageCursor: hasNextPage ? String(page + 1) : null,
        hasNextPage: hasNextPage,
        totalProperties: totalProperties,
    });
}
