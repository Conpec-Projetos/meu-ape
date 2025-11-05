import { supabaseAdmin } from "@/supabase/supabase-admin";
import { NextRequest, NextResponse } from "next/server";

type SupabaseLocation =
    | {
          type?: string;
          coordinates?: [number, number];
      }
    | string
    | null
    | unknown;

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }): Promise<NextResponse> {
    const { id } = await context.params;

    try {
        // Try RPC that already returns lat/lng
        const { data: rpcData, error: rpcError } = await supabaseAdmin.rpc("get_property_with_latlng", { p_id: id });

        let property: {
            id: string;
            developerId: string | undefined;
            name: string;
            address: string;
            description: string;
            propertyImages: string[] | undefined;
            areasImages: string[] | undefined;
            matterportUrls: string[] | undefined;
            location: { lat: number; lng: number };
            deliveryDate: Date;
            launchDate: Date;
            features: string[];
            floors: number;
            unitsPerFloor: number;
            groups: string[];
        };

        if (!rpcError && rpcData && rpcData.length > 0) {
            const p = rpcData[0] as Record<string, unknown>;
            const lat = Number(p.lat);
            const lng = Number(p.lng);
            property = {
                id: String(p.id),
                developerId: (p.developer_id as string) ?? undefined,
                name: String(p.name ?? ""),
                address: String(p.address ?? ""),
                description: String(p.description ?? ""),
                propertyImages: (p.property_images as string[] | null) ?? undefined,
                areasImages: (p.areas_images as string[] | null) ?? undefined,
                matterportUrls: (p.matterport_urls as string[] | null) ?? undefined,
                location: !Number.isNaN(lat) && !Number.isNaN(lng) ? { lat, lng } : { lat: -22.90556, lng: -47.06083 },
                deliveryDate: p.delivery_date ? new Date(String(p.delivery_date)) : new Date(0),
                launchDate: p.launch_date ? new Date(String(p.launch_date)) : new Date(0),
                features: (p.features as string[] | null) ?? [],
                floors: (p.floors as number | null) ?? 0,
                unitsPerFloor: (p.units_per_floor as number | null) ?? 0,
                groups: typeof p.groups === "string" ? (p.groups as string).split(",") : [],
            };
        } else {
            // Fallback: Fetch property by id and parse location locally
            const { data: prop, error: propError } = await supabaseAdmin
                .from("properties")
                .select(
                    `id, developer_id, name, address, description, delivery_date, launch_date, features, floors, units_per_floor, property_images, areas_images, matterport_urls, groups, location`
                )
                .eq("id", id)
                .single();

            if (propError || !prop) {
                return NextResponse.json({ error: "Imóvel não encontrado" }, { status: 404 });
            }

            // Parse location into lat/lng (supports GeoJSON-like or WKT POINT)
            let lat: number | undefined;
            let lng: number | undefined;
            const loc = prop.location as SupabaseLocation;
            if (loc && typeof loc === "object") {
                if ("coordinates" in loc) {
                    const coords = (loc as { coordinates?: unknown }).coordinates;
                    if (Array.isArray(coords) && coords.length === 2) {
                        const c0 = coords[0] as unknown;
                        const c1 = coords[1] as unknown;
                        const numLng = typeof c0 === "number" ? c0 : Number(c0);
                        const numLat = typeof c1 === "number" ? c1 : Number(c1);
                        if (!Number.isNaN(numLat) && !Number.isNaN(numLng)) {
                            lng = numLng;
                            lat = numLat;
                        }
                    }
                }
                if (
                    (lat === undefined || lng === undefined) &&
                    "lat" in (loc as Record<string, unknown>) &&
                    "lng" in (loc as Record<string, unknown>)
                ) {
                    const obj = loc as Record<string, unknown> & { lat?: unknown; lng?: unknown };
                    const numLat = typeof obj.lat === "number" ? obj.lat : Number(obj.lat);
                    const numLng = typeof obj.lng === "number" ? obj.lng : Number(obj.lng);
                    if (!Number.isNaN(numLat) && !Number.isNaN(numLng)) {
                        lat = numLat;
                        lng = numLng;
                    }
                }
            } else if (typeof loc === "string") {
                const match = loc.match(/POINT\(([-\d.]+) ([-\d.]+)\)/);
                if (match) {
                    const numLng = Number(match[1]);
                    const numLat = Number(match[2]);
                    if (!Number.isNaN(numLat) && !Number.isNaN(numLng)) {
                        lng = numLng;
                        lat = numLat;
                    }
                }
            }

            property = {
                id: prop.id as string,
                developerId: prop.developer_id as string | undefined,
                name: prop.name as string,
                address: (prop.address as string) ?? "",
                description: (prop.description as string) ?? "",
                propertyImages: (prop.property_images as string[] | null) ?? undefined,
                areasImages: (prop.areas_images as string[] | null) ?? undefined,
                matterportUrls: (prop.matterport_urls as string[] | null) ?? undefined,
                location: lat !== undefined && lng !== undefined ? { lat, lng } : { lat: -22.90556, lng: -47.06083 },
                deliveryDate: prop.delivery_date ? new Date(prop.delivery_date as string) : new Date(0),
                launchDate: prop.launch_date ? new Date(prop.launch_date as string) : new Date(0),
                features: (prop.features as string[] | null) ?? [],
                floors: (prop.floors as number | null) ?? 0,
                unitsPerFloor: (prop.units_per_floor as number | null) ?? 0,
                groups: (prop.groups as string | null)?.split(",") ?? [],
            };
        }

        // Build unit navigation structure from available units
        const { data: units, error: unitsError } = await supabaseAdmin
            .from("units")
            .select("block, category, size_sqm")
            .eq("property_id", id)
            .eq("is_available", true);

        if (unitsError) {
            console.error("Error fetching units for navigation:", unitsError);
        }

        const unitNavigation: Record<string, string[]> = {};
        for (const u of units ?? []) {
            const block = (u.block as string | null) || "Geral";
            const categories = (u.category as string[] | null) ?? [];
            const size = (u.size_sqm as number | null) ?? null;
            if (!unitNavigation[block]) unitNavigation[block] = [];

            if (categories.length > 0) {
                for (const cat of categories) {
                    if (!unitNavigation[block].includes(cat)) {
                        unitNavigation[block].push(cat);
                    }
                }
            } else if (size !== null) {
                const rounded = Math.round(size);
                const label = `Aptos de ${rounded}m²`;
                if (!unitNavigation[block].includes(label)) {
                    unitNavigation[block].push(label);
                }
            } else {
                const other = "Outros";
                if (!unitNavigation[block].includes(other)) {
                    unitNavigation[block].push(other);
                }
            }
        }

        // Sort categories alphabetically for stable UI
        Object.keys(unitNavigation).forEach(block => unitNavigation[block].sort());

        return NextResponse.json({ property, unitNavigation });
    } catch (e) {
        console.error(e);
        return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
    }
}
