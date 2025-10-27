import { supabaseAdmin } from "@/supabase/supabase-admin";
import { NextRequest, NextResponse } from "next/server";
import { propertySchema } from "@/schemas/propertySchema";
import { unitSchema } from "@/schemas/unitSchema";
import { z } from "zod";
import { verifySessionCookie } from "@/firebase/firebase-admin-config";

// Helper to check admin role
async function isAdmin(request: NextRequest): Promise<boolean> {
    const sessionCookie = request.cookies.get("session")?.value;
    if (!sessionCookie) return false;
    const decodedClaims = await verifySessionCookie(sessionCookie);
    return decodedClaims?.role === "admin";
}

// GET handler for fetching a specific property and its units
export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    // --- Authentication/Authorization ---
     if (!(await isAdmin(request))) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = supabaseAdmin;
    const { id } = await params;

    if (!id) {
        return NextResponse.json({ error: "ID da propriedade ausente" }, { status: 400 });
    }

    try {
        // Fetch Property
        const { data: property, error: propertyError } = await supabase
            .from("properties")
            .select("*")
            .eq("id", id)
            .single();

        if (propertyError || !property) {
            console.error("Supabase GET Property Error:", propertyError);
            return NextResponse.json({ error: "Propriedade não encontrada" }, { status: 404 });
        }

        // Fetch Units associated with the property
        const { data: units, error: unitsError } = await supabase
            .from("units")
            .select("*")
            .eq("property_id", id);

        if (unitsError) {
            console.error("Supabase GET Units Error:", unitsError);
            // Decide if you want to return the property even if units fail
            return NextResponse.json({ error: "Erro ao buscar unidades da propriedade" }, { status: 500 });
        }

        return NextResponse.json({ ...property, units: units || [] });

    } catch (error) {
        console.error("API GET [id] Error:", error);
        const message = error instanceof Error ? error.message : "Erro interno do servidor";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}

// PUT handler for updating a property and synchronizing its units
export async function PUT(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
     // --- Authentication/Authorization ---
     if (!(await isAdmin(request))) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = supabaseAdmin;
    const { id } = params;

    if (!id) {
        return NextResponse.json({ error: "ID da propriedade ausente" }, { status: 400 });
    }

    try {
        const body = await request.json();
        // Assume the body includes updated property data and a 'units' array
        // where each unit has an optional 'status' ('new', 'updated', 'deleted') or just its data for update
        const { units = [], ...propertyData } = body;

        // --- Data Validation ---
        // Use .partial() for updates as not all fields might be sent
        const validatedPropertyData = propertySchema.partial().parse(propertyData);
        // More complex validation for units array (handle different statuses)
        // This is a simplified example; adjust based on your exact needs
        const validatedUnits = z.array(
            unitSchema.partial().extend({
                id: z.string().uuid().optional(), // id is optional for 'new'
                status: z.enum(["new", "updated", "deleted"]).optional(),
            })
        ).parse(units);


        // --- Database Update (Potentially within a transaction if complex) ---

        // 1. Update Property details
        const { error: propertyUpdateError } = await supabase
            .from("properties")
            .update({
                 ...validatedPropertyData,
                 updated_at: new Date().toISOString(), // Update timestamp
                // Handle location update if necessary
                })
            .eq("id", id);

        if (propertyUpdateError) {
            console.error("Supabase Update Property Error:", propertyUpdateError);
            throw new Error("Erro ao atualizar dados da propriedade.");
        }

        // 2. Synchronize Units
        const unitsToInsert = validatedUnits.filter(u => u.status === 'new' && !u.id);
        const unitsToUpdate = validatedUnits.filter(u => u.id && (u.status === 'updated' || !u.status)); // Update if 'updated' or no status
        const unitIdsToDelete = validatedUnits.filter(u => u.id && u.status === 'deleted').map(u => u.id);

        // Batch operations are generally preferred for efficiency
        const unitOperations: Promise<any>[] = [];

        // Inserts
        if (unitsToInsert.length > 0) {
            const insertPayload = unitsToInsert.map(({ status, ...unitData }) => ({
                 ...unitData,
                 property_id: id // Ensure link to parent property
            }));
             unitOperations.push(supabase.from("units").insert(insertPayload));
        }

        // Updates
        for (const unit of unitsToUpdate) {
            const { id: unitId, status, property_id, ...updateData } = unit; // Exclude non-updatable fields
            if (unitId) { // Should always have id here
                unitOperations.push(
                    supabase.from("units").update({...updateData, updated_at: new Date().toISOString()}).eq("id", unitId)
                );
            }
        }

        // Deletes
        if (unitIdsToDelete.length > 0) {
            unitOperations.push(supabase.from("units").delete().in("id", unitIdsToDelete));
        }

        const results = await Promise.allSettled(unitOperations);
        const errors = results.filter(r => r.status === 'rejected');

        if (errors.length > 0) {
            console.error("Supabase Unit Sync Errors:", errors.map((e: any) => e.reason));
            // Consider rollback or partial success handling
            throw new Error("Erro ao sincronizar algumas unidades.");
        }

        // Fetch the updated property data with units to return
         const { data: updatedProperty, error: fetchError } = await supabase
            .from("properties")
            .select("*, units(*)") // Select property and all related units
            .eq("id", id)
            .single();

         if (fetchError || !updatedProperty) {
             console.error("Failed to fetch updated property:", fetchError);
             return NextResponse.json({ message: "Propriedade atualizada, mas erro ao buscar dados finais." });
         }

        return NextResponse.json(updatedProperty);

    } catch (error) {
        console.error("API PUT [id] Error:", error);
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

// DELETE handler for deleting a property (and potentially its units via cascade)
export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
     // --- Authentication/Authorization ---
     if (!(await isAdmin(request))) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = supabaseAdmin;
    const { id } = params;

    if (!id) {
        return NextResponse.json({ error: "ID da propriedade ausente" }, { status: 400 });
    }

    try {
        // Delete Property - Assuming ON DELETE CASCADE is set for units foreign key
        const { error } = await supabase
            .from("properties")
            .delete()
            .eq("id", id);

        if (error) {
            console.error("Supabase DELETE Error:", error);
            // Handle specific errors like foreign key constraints if cascade isn't set
            if (error.code === '23503') { // Foreign key violation
                 return NextResponse.json({ error: "Erro: Não é possível excluir a propriedade pois existem unidades associadas. Exclua as unidades primeiro." }, { status: 409 }); // Conflict
            }
            throw new Error("Erro ao excluir propriedade.");
        }

        // If ON DELETE CASCADE is NOT set, you need to manually delete units first:
        /*
        const { error: unitsError } = await supabase
            .from("units")
            .delete()
            .eq("property_id", id);
        if (unitsError) { throw unitsError; }

        const { error: propertyError } = await supabase
            .from("properties")
            .delete()
            .eq("id", id);
        if (propertyError) { throw propertyError; }
        */

        return NextResponse.json({ message: "Propriedade excluída com sucesso" });

    } catch (error) {
        console.error("API DELETE [id] Error:", error);
        const message = error instanceof Error ? error.message : "Erro interno do servidor";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}