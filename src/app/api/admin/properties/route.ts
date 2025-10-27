import { verifySessionCookie } from "@/firebase/firebase-admin-config"
import type { Property } from "@/interfaces/property";
import { propertySchema } from "@/schemas/propertySchema";
import { unitSchema } from "@/schemas/unitSchema";
import { supabaseAdmin } from "@/supabase/supabase-admin";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

// Helper to check admin role
async function isAdmin(request: NextRequest): Promise<boolean> {
    const sessionCookie = request.cookies.get("session")?.value;
    if (!sessionCookie) return false;
    const decodedClaims = await verifySessionCookie(sessionCookie);
    return decodedClaims?.role === "admin";
}

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

    try {
        // Selecione as colunas necessárias, incluindo a de imagens
        const selectQuery = `
            id, name, address, description, delivery_date, launch_date, features, floors, units_per_floor, property_images, areas_images, matterport_urls, groups, created_at
        `;

        let query = supabase.from("properties").select(selectQuery, { count: "exact" });

        // Apply search filter if 'q' parameter exists
        if (q) {
            query = query.or(`name.ilike.%${q}%,address.ilike.%${q}%`);
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

        //  Mapeamento para camelCase
        const formattedProperties: Property[] = (supabaseData || []).map((p: any) => ({
            id: p.id,
            name: p.name,
            address: p.address,
            description: p.description,
            // Mapeie outras propriedades conforme necessário...
            propertyImages: p.property_images, // <-- Mapeamento chave aqui
            areasImages: p.areas_images,
            matterportUrls: p.matterport_urls,
            // Certifique-se de que outros campos correspondam à interface Property
            location: { lat: 0, lng: 0 }, // Adicione um placeholder ou busque a localização real se necessário
            deliveryDate: p.delivery_date ? new Date(p.delivery_date) : new Date(), // Converta para Date
            launchDate: p.launch_date ? new Date(p.launch_date) : new Date(), // Converta para Date
            features: p.features || [],
            floors: p.floors,
            unitsPerFloor: p.units_per_floor,
            groups: p.groups ? p.groups.split(",") : [], // Exemplo de conversão se groups for string
            searchableUnitFeats: {
                // Adicione um placeholder se não estiver buscando isso aqui
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
        // ---------------------------------

        return NextResponse.json({
            properties: formattedProperties, // <-- Retorne os dados formatados
            totalPages,
            total: totalProperties,
        });
    } catch (error) {
        console.error("API GET Error:", error);
        const message = error instanceof Error ? error.message : "Erro interno do servidor";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}

// POST handler for creating a new property and its units
export async function POST(request: NextRequest) {
    // --- Authentication/Authorization ---
    if (!(await isAdmin(request))) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = supabaseAdmin;

    try {
        const body = await request.json();
        const { units, ...propertyData } = body; // Separate property data from units array

        // --- Data Validation (using Zod schemas) ---
        const validatedProperty = propertySchema.parse(propertyData); // Validate property data
        const validatedUnits = z.array(unitSchema.omit({ property_id: true })).parse(units || []); // Validate units array

        // --- Database Insertion ---
        // Insert Property
        const { data: newProperty, error: propertyError } = await supabase
            .from("properties")
            .insert({
                ...validatedProperty,
                // Add default/generated values if needed, e.g., location processing
                // location: `POINT(${lng} ${lat})` // Example if using PostGIS POINT
            })
            .select()
            .single(); // Use .single() if inserting one row

        if (propertyError) {
            console.error("Supabase Insert Property Error:", propertyError);
            throw new Error("Erro ao criar propriedade.");
        }

        // Insert Units (if any)
        if (validatedUnits.length > 0) {
            const unitsWithPropertyId = validatedUnits.map(unit => ({
                ...unit,
                property_id: newProperty.id, // Link unit to the created property
            }));

            const { error: unitsError } = await supabase.from("units").insert(unitsWithPropertyId);

            if (unitsError) {
                console.error("Supabase Insert Units Error:", unitsError);
                // Optional: Attempt to delete the property if units fail? Or handle differently.
                await supabase.from("properties").delete().eq("id", newProperty.id);
                throw new Error("Erro ao criar unidades associadas à propriedade.");
            }
        }

        return NextResponse.json({ ...newProperty, units: validatedUnits }, { status: 201 });
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
