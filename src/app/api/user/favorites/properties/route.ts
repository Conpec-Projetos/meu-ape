import { verifySessionCookie } from "@/firebase/firebase-admin-config";
import { normalizePropertyArrays } from "@/lib/normalizePropertyArrays";
import { supabaseAdmin } from "@/supabase/supabase-admin";
import { NextRequest, NextResponse } from "next/server";

type FavoriteWithDataRow = {
    id: string;
    name: string;
    address: string;
    description: string | null;
    property_images: string[] | null;
    lat: number | null;
    lng: number | null;
    delivery_date: string | null;
    launch_date: string | null;
    features: string[] | null;
    min_unit_price: number | null;
    max_unit_price: number | null;
    min_unit_size: number | null;
    max_unit_size: number | null;
    available_bedrooms: number[] | null;
    available_bathrooms: number[] | null;
    available_garages: number[] | null;
    total_count?: number | null;
};

export async function GET(request: NextRequest) {
    try {
        const sessionCookie = request.cookies.get("session")?.value;
        if (!sessionCookie) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const decodedClaims = await verifySessionCookie(sessionCookie);
        if (!decodedClaims) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        
        const userId = decodedClaims.uid;

        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get("page") || "1", 10);
        const limit = 15;
        const offset = (page - 1) * limit;

        const { data, error } = await supabaseAdmin.rpc("get_favorites_with_data", {
            p_user_id: userId,
            p_limit: limit,
            p_offset: offset
        });

        if (error) {
            console.error("RPC Error:", error);
            throw new Error(error.message);
        }

        const favorites: FavoriteWithDataRow[] = (data || []) as FavoriteWithDataRow[];

        const properties = favorites.map((p) => {
            const n = normalizePropertyArrays(p);
            
            return {
                id: p.id,
                name: p.name,
                address: p.address,
                description: p.description,
                propertyImages: n.property_images,
                location: { 
                    lat: p.lat,
                    lng: p.lng,
                },
                deliveryDate: p.delivery_date,
                launchDate: p.launch_date,
                features: n.features,
                searchableUnitFeats: {
                    minPrice: p.min_unit_price || 0,
                    maxPrice: p.max_unit_price || 0,
                    minSize: p.min_unit_size || 0,
                    maxSize: p.max_unit_size || 0,
                    bedrooms: p.available_bedrooms || [],
                    baths: p.available_bathrooms || [],
                    garages: p.available_garages || []
                }
            };
        });

        const total = data?.[0]?.total_count ?? 0;
        const totalPages = Math.ceil(Number(total) / limit);
        const hasNextPage = page < totalPages;

        return NextResponse.json({
            properties,
            totalPages,
            total: Number(total),
            nextPageCursor: hasNextPage ? String(page + 1) : null,
            hasNextPage
        });

    } catch (error) {
        console.error("API Favorites Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}