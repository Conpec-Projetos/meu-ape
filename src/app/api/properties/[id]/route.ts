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

// GET /api/properties/[id]
// Returns: { property, unitNavigation }
export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }): Promise<NextResponse> {
    const { id } = await context.params;

    try {
        // Fetch property by id
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
        let lat = 0,
            lng = 0;
        const loc = prop.location as SupabaseLocation;
        if (loc && typeof loc === "object" && "coordinates" in loc) {
            const coords = (loc as { coordinates?: unknown }).coordinates;
            if (Array.isArray(coords) && coords.length === 2) {
                const c0 = coords[0];
                const c1 = coords[1];
                lng = typeof c0 === "number" ? c0 : 0;
                lat = typeof c1 === "number" ? c1 : 0;
            }
        } else if (typeof loc === "string") {
            const match = loc.match(/POINT\(([-\d.]+) ([-\d.]+)\)/);
            if (match) {
                lng = parseFloat(match[1]);
                lat = parseFloat(match[2]);
            }
        }

        const property = {
            id: prop.id as string,
            developerId: prop.developer_id as string | undefined,
            name: prop.name as string,
            address: (prop.address as string) ?? "",
            description: (prop.description as string) ?? "",
            propertyImages: (prop.property_images as string[] | null) ?? undefined,
            areasImages: (prop.areas_images as string[] | null) ?? undefined,
            matterportUrls: (prop.matterport_urls as string[] | null) ?? undefined,
            location: { lat, lng },
            deliveryDate: prop.delivery_date ? new Date(prop.delivery_date as string) : new Date(0),
            launchDate: prop.launch_date ? new Date(prop.launch_date as string) : new Date(0),
            features: (prop.features as string[] | null) ?? [],
            floors: (prop.floors as number | null) ?? 0,
            unitsPerFloor: (prop.units_per_floor as number | null) ?? 0,
            groups: (prop.groups as string | null)?.split(",") ?? [],
        };

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
