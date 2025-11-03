import { verifySessionCookie } from "@/firebase/firebase-admin-config";
import type { Property } from "@/interfaces/property"; // Make sure Property interface path is correct
import { geocodeAddressSmart } from "@/lib/geocoding";
import { propertySchema } from "@/schemas/propertySchema";
import { unitSchema } from "@/schemas/unitSchema";
import { supabaseAdmin } from "@/supabase/supabase-admin";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

async function isAdmin(request: NextRequest): Promise<boolean> {
    const sessionCookie = request.cookies.get("session")?.value;
    if (!sessionCookie) return false;
    const decodedClaims = await verifySessionCookie(sessionCookie);
    return decodedClaims?.role === "admin";
}

// Define a type for the expected location structure from Supabase
type SupabaseLocation =
    | {
          type?: string;
          coordinates?: [number, number]; // Assuming [lng, lat] order
      }
    | null
    | unknown; // Allow for null or unknown

// GET handler for listing properties with pagination and basic search
export async function GET(request: NextRequest) {
    if (!(await isAdmin(request))) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = supabaseAdmin;
    const { searchParams } = new URL(request.url);

    const q = searchParams.get("q") || undefined;
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limitSize = parseInt(searchParams.get("limit") || "20", 10);
    const offset = (page - 1) * limitSize;
    const fuzzy =
        (searchParams.get("fuzzy") || "").toLowerCase() === "true" || (searchParams.get("fuzzy") || "") === "1";

    try {
        // Select the necessary columns, including image arrays and location
        const selectQuery = `
            id, developer_id, name, address, description, delivery_date, launch_date, features, floors, units_per_floor, property_images, areas_images, matterport_urls, groups, created_at,
            location
        `;

        // If fuzzy+q are provided, try RPC that returns rows + total
        if (q && fuzzy) {
            try {
                const safeQ = q;
                const { data: rpcData, error: rpcError } = await supabase.rpc("search_properties_fuzzy_with_total", {
                    query_text: safeQ,
                    p_limit: limitSize,
                    p_offset: offset,
                });

                if (!rpcError && rpcData) {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    const rpcResult: any = rpcData;
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    let rows: any[] = [];
                    let totalProperties = 0;

                    if (rpcResult && typeof rpcResult === "object" && Array.isArray(rpcResult.rows)) {
                        rows = rpcResult.rows;
                        totalProperties = Number(rpcResult.total ?? rows.length ?? 0);
                    } else if (Array.isArray(rpcResult)) {
                        rows = rpcResult;
                        totalProperties = rows.length;
                    } else if (typeof rpcResult === "string") {
                        try {
                            const parsed = JSON.parse(rpcResult);
                            if (parsed && Array.isArray(parsed.rows)) {
                                rows = parsed.rows;
                                totalProperties = Number(parsed.total ?? rows.length ?? 0);
                            }
                        } catch (err) {
                            console.warn("Failed to parse rpc string result for fuzzy search", err);
                        }
                    }

                    // Map rows to Property[]
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    const formattedProperties: Property[] = (rows || []).map((p: any) => ({
                        id: p.id,
                        developerId: p.developer_id,
                        name: p.name,
                        address: p.address ?? "",
                        description: p.description ?? "",
                        propertyImages: p.property_images ?? undefined,
                        areasImages: p.areas_images ?? undefined,
                        matterportUrls: p.matterport_urls ?? undefined,
                        location: (() => {
                            let lat = 0,
                                lng = 0;
                            const loc = p.location as SupabaseLocation;
                            if (
                                loc &&
                                typeof loc === "object" &&
                                "coordinates" in loc &&
                                Array.isArray(loc.coordinates) &&
                                loc.coordinates.length === 2
                            ) {
                                lng = typeof loc.coordinates[0] === "number" ? loc.coordinates[0] : 0;
                                lat = typeof loc.coordinates[1] === "number" ? loc.coordinates[1] : 0;
                            } else if (typeof loc === "string") {
                                const match = loc.match(/POINT\(([-\d.]+) ([-\d.]+)\)/);
                                if (match) {
                                    lng = parseFloat(match[1]);
                                    lat = parseFloat(match[2]);
                                }
                            }
                            return { lat, lng };
                        })(),
                        deliveryDate: p.delivery_date ? new Date(p.delivery_date) : new Date(0),
                        launchDate: p.launch_date ? new Date(p.launch_date) : new Date(0),
                        features: p.features || [],
                        floors: p.floors ?? 0,
                        unitsPerFloor: p.units_per_floor ?? 0,
                        groups: Array.isArray(p.groups)
                            ? (p.groups as string[])
                            : typeof p.groups === "string"
                              ? (p.groups as string)
                                    .split(",")
                                    .map(s => s.trim())
                                    .filter(Boolean)
                              : [],
                        searchableUnitFeats: {
                            minPrice: 0,
                            maxPrice: 0,
                            bedrooms: [],
                            baths: [],
                            garages: [],
                            minSize: 0,
                            maxSize: 0,
                            sizes: [],
                        },
                    }));

                    const totalPages = Math.max(1, Math.ceil((totalProperties || 0) / limitSize));

                    return NextResponse.json({ properties: formattedProperties, totalPages, total: totalProperties });
                }
            } catch (e) {
                console.warn("Fuzzy RPC invocation failed, falling back to regular search", e);
            }
        }

        // Build select query
        let query = supabase.from("properties").select(selectQuery, { count: "exact" });

        // Apply search filter if 'q' parameter exists
        if (q) {
            // Prefer full-text search (tsvector) using PostgREST 'fts' operator across name and address.
            // Fallback to ilike if fts is not supported or returns an error.
            try {
                // Escape single quotes to avoid SQL issues in some PostgREST implementations
                const safeQ = q.replace(/'/g, "''");
                // Use OR to search both `name` and `address` with full-text search operator
                query = query.or(`name.fts.${safeQ},address.fts.${safeQ}`);
            } catch (e) {
                // If anything goes wrong, fall back to ilike searching
                console.warn("FTS search failed, falling back to ilike:", e);
                query = query.or(`name.ilike.%${q}%,address.ilike.%${q}%`);
            }
        }

        // Apply ordering and pagination
        query = query.order("created_at", { ascending: false }).range(offset, offset + limitSize - 1);

        const { data: supabaseData, error, count } = await query;

        if (error) {
            console.error("Supabase GET Error:", error);
            throw new Error("Erro ao buscar propriedades");
        }

        const totalProperties = count ?? 0;
        const totalPages = Math.ceil(totalProperties / limitSize);

        // Mapeamento para camelCase and Property interface
        const formattedProperties: Property[] = (supabaseData || []).map(p => {
            // Extract lat/lng safely
            let lat = 0,
                lng = 0;
            const loc = p.location as SupabaseLocation; // Assert type for better checking
            // Check if location is an object and has coordinates array
            if (
                loc &&
                typeof loc === "object" &&
                "coordinates" in loc &&
                Array.isArray(loc.coordinates) &&
                loc.coordinates.length === 2
            ) {
                lng = typeof loc.coordinates[0] === "number" ? loc.coordinates[0] : 0;
                lat = typeof loc.coordinates[1] === "number" ? loc.coordinates[1] : 0;
            }
            // Add alternative parsing if location might be a string `POINT(lng lat)`
            else if (typeof loc === "string") {
                const match = loc.match(/POINT\(([-\d.]+) ([-\d.]+)\)/);
                if (match) {
                    lng = parseFloat(match[1]);
                    lat = parseFloat(match[2]);
                }
            }

            return {
                id: p.id,
                developerId:
                    typeof (p as { developer_id?: unknown }).developer_id === "string"
                        ? (p as { developer_id?: string }).developer_id
                        : undefined,
                name: p.name,
                address: p.address ?? "", // Default null address to empty string
                description: p.description ?? "", // Default null description to empty string
                // Default null image arrays to undefined (or empty array [] if preferred)
                propertyImages: p.property_images ?? undefined,
                areasImages: p.areas_images ?? undefined,
                matterportUrls: p.matterport_urls ?? undefined,
                location: { lat, lng }, // Use safely extracted lat/lng
                deliveryDate: p.delivery_date ? new Date(p.delivery_date) : new Date(0), // Default date
                launchDate: p.launch_date ? new Date(p.launch_date) : new Date(0), // Default date
                features: p.features || [],
                floors: p.floors ?? 0, // Default null to 0
                unitsPerFloor: p.units_per_floor ?? 0, // Default null to 0
                groups: Array.isArray(p.groups)
                    ? (p.groups as string[])
                    : typeof p.groups === "string"
                      ? (p.groups as string)
                            .split(",")
                            .map(s => s.trim())
                            .filter(Boolean)
                      : [],
                // Default structure for searchableUnitFeats
                searchableUnitFeats: {
                    minPrice: 0,
                    maxPrice: 0,
                    bedrooms: [],
                    baths: [],
                    garages: [],
                    minSize: 0,
                    maxSize: 0,
                    sizes: [],
                },
            };
        });

        return NextResponse.json({
            properties: formattedProperties, // Return formatted data
            totalPages,
            total: totalProperties,
        });
    } catch (error) {
        console.error("API GET Error:", error);
        const message = error instanceof Error ? error.message : "Erro interno do servidor";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}

// POST handler - unchanged from previous correction, assuming it's correct now
export async function POST(request: NextRequest) {
    if (!(await isAdmin(request))) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = supabaseAdmin;

    try {
        const body = await request.json();
        const { units, ...propertyData } = body; // Separate property data from units array

        // Data Validation (using Zod schemas)
        // Ensure developer_id exists and is valid before parsing
        if (!propertyData.developer_id) {
            throw new Error("developer_id é obrigatório.");
        }
        const validatedProperty = propertySchema.parse(propertyData); // Validate property data
        const validatedUnits = z.array(unitSchema.omit({ property_id: true })).parse(units || []); // Validate units array

        // Database Insertion
        // Insert Property
        const { data: newProperty, error: propertyError } = await supabase
            .from("properties")
            .insert({
                ...validatedProperty,
                // Convert features to TEXT[] if it's not already
                features: Array.isArray(validatedProperty.features) ? validatedProperty.features : [],
                // Add default/generated values if needed, e.g., location processing
                // location: `POINT(${lng} ${lat})` // Example if using PostGIS POINT
            })
            .select()
            .single(); // Use .single() if inserting one row

        if (propertyError) {
            console.error("Supabase Insert Property Error:", propertyError);
            throw new Error("Erro ao criar propriedade.");
        }

        // If client provided coordinates, prefer them; otherwise attempt to geocode from address
        let geocodingFailed = false;
        if (newProperty?.id) {
            const clientLat = typeof body?.lat === "number" ? body.lat : Number(body?.lat);
            const clientLng = typeof body?.lng === "number" ? body.lng : Number(body?.lng);
            const hasValidClientCoords =
                Number.isFinite(clientLat) && Number.isFinite(clientLng) && !(clientLat === 0 && clientLng === 0);

            if (hasValidClientCoords) {
                try {
                    await supabase.from("properties").update({ location: null }).eq("id", newProperty.id);
                    await supabase.rpc("set_property_location", {
                        p_property_id: newProperty.id,
                        p_lat: clientLat,
                        p_lng: clientLng,
                    });
                } catch (e) {
                    console.warn("Falha ao aplicar coordenadas do cliente (create):", e);
                    geocodingFailed = true;
                }
            } else if (typeof validatedProperty.address === "string" && validatedProperty.address.trim()) {
                try {
                    const result = await geocodeAddressSmart(validatedProperty.address);
                    if (result) {
                        // Clear first to ensure the function updates regardless of existing value
                        await supabase.from("properties").update({ location: null }).eq("id", newProperty.id);
                        await supabase.rpc("set_property_location", {
                            p_property_id: newProperty.id,
                            p_lat: result.lat,
                            p_lng: result.lng,
                        });
                    } else {
                        // Geocoding failed; clear location to avoid stale coordinates
                        await supabase.from("properties").update({ location: null }).eq("id", newProperty.id);
                        geocodingFailed = true;
                    }
                } catch (e) {
                    console.warn("Falha ao geocodificar endereço ou atualizar localização:", e);
                    geocodingFailed = true;
                }
            }
        }

        // Insert Units (if any)
        if (validatedUnits.length > 0) {
            const unitsWithPropertyId = validatedUnits.map(unit => ({
                ...unit,
                property_id: newProperty.id, // Link unit to the created property
                // Ensure category is an array of strings or null
                category: typeof unit.category === "string" ? [unit.category] : (unit.category ?? []),
            }));

            const { error: unitsError } = await supabase.from("units").insert(unitsWithPropertyId);

            if (unitsError) {
                console.error("Supabase Insert Units Error:", unitsError);
                // Attempt to delete the property if units fail to maintain consistency
                await supabase.from("properties").delete().eq("id", newProperty.id);
                throw new Error("Erro ao criar unidades associadas à propriedade. A propriedade foi revertida.");
            }
        }

        // Fetch the newly created property along with any created units
        const { data: createdPropertyWithUnits, error: fetchError } = await supabase
            .from("properties")
            .select("*, units(*)") // Fetch related units
            .eq("id", newProperty.id)
            .single();

        if (fetchError || !createdPropertyWithUnits) {
            console.error("Failed to fetch created property with units:", fetchError);
            // Return the basic property data if fetching units fails
            return NextResponse.json(
                {
                    ...newProperty,
                    ...(geocodingFailed ? { geocodingFailed: true } : {}),
                },
                { status: 201 }
            );
        }

        return NextResponse.json(
            {
                ...createdPropertyWithUnits,
                ...(geocodingFailed ? { geocodingFailed: true } : {}),
            },
            { status: 201 }
        ); // Return property with units and optional geocoding flag
    } catch (error) {
        console.error("API POST Error:", error);
        let status = 500;
        let message = "Erro interno do servidor";
        if (error instanceof z.ZodError) {
            status = 400;
            message = "Dados inválidos: " + error.errors.map(e => `${e.path.join(".")} - ${e.message}`).join(", ");
        } else if (error instanceof Error) {
            message = error.message;
        }
        return NextResponse.json({ error: message }, { status });
    }
}
