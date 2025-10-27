import { verifySessionCookie } from "@/firebase/firebase-admin-config";
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

// GET handler for fetching a specific property and its units
export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }): Promise<NextResponse> {
    if (!(await isAdmin(request))) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = supabaseAdmin;
    // Access params directly from context
    const { id } = await context.params;

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
        const { data: units, error: unitsError } = await supabase.from("units").select("*").eq("property_id", id);

        if (unitsError) {
            console.error("Supabase GET Units Error:", unitsError);
            // Decide if you want to return the property even if units fail
            return NextResponse.json({ error: "Erro ao buscar unidades da propriedade" }, { status: 500 });
        }

        // Add null check for units before returning
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
    // Directly type the context parameter
    context: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
    // --- Authentication/Authorization ---
    if (!(await isAdmin(request))) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = supabaseAdmin;
    // Access params directly from context
    const { id } = await context.params;

    if (!id) {
        return NextResponse.json({ error: "ID da propriedade ausente" }, { status: 400 });
    }

    try {
        const body = await request.json();
        // Separate units from property data, default units to an empty array if not present
        const { units = [], ...propertyData } = body;

        // Validate property data (allow partial updates)
        const validatedPropertyData = propertySchema.partial().parse(propertyData);
        // Validate units data
        const validatedUnits = z
            .array(
                unitSchema.partial().extend({
                    id: z.string().uuid().optional(), // Allow optional id for updates/inserts
                    status: z.enum(["new", "updated", "deleted"]).optional(), // Status for sync logic
                })
            )
            .parse(units); // Use the separated units array

        // Update Property
        const { error: propertyUpdateError } = await supabase
            .from("properties")
            .update({
                ...validatedPropertyData,
                updated_at: new Date().toISOString(), // Ensure updated_at is set
            })
            .eq("id", id);

        if (propertyUpdateError) {
            console.error("Supabase Update Property Error:", propertyUpdateError);
            throw new Error("Erro ao atualizar dados da propriedade.");
        }

        // --- Unit Synchronization Logic ---
        const unitsToInsert = validatedUnits.filter(u => u.status === "new" && !u.id);
        const unitsToUpdate = validatedUnits.filter(u => u.id && (u.status === "updated" || !u.status)); // Update if status is 'updated' or missing
        const unitIdsToDelete = validatedUnits
            .filter(u => u.id && u.status === "deleted")
            .map(u => u.id)
            .filter((id): id is string => id !== undefined); // Ensure IDs are strings

        // Insert new units
        if (unitsToInsert.length > 0) {
            const insertPayload = unitsToInsert.map(({ ...unitData }) => ({
                // Remove status before inserting
                ...unitData,
                property_id: id,
                identifier: unitData.identifier || "", // Provide default if needed
                // Ensure category is an array of strings or null
                category: typeof unitData.category === "string" ? [unitData.category] : unitData.category,
            }));
            const { error: insertError } = await supabase.from("units").insert(insertPayload);
            if (insertError) {
                console.error("Supabase Insert Units Error:", insertError);
                throw new Error("Erro ao inserir novas unidades.");
            }
        }

        // Update existing units
        for (const unit of unitsToUpdate) {
            const { id: unitId, ...updateData } = unit; // Remove status before updating
            if (unitId) {
                const updatePayload = {
                    ...updateData,
                    updated_at: new Date().toISOString(),
                    // Ensure category is an array of strings or null
                    category: typeof updateData.category === "string" ? [updateData.category] : updateData.category,
                };
                const { error: updateError } = await supabase.from("units").update(updatePayload).eq("id", unitId);
                if (updateError) {
                    console.error(`Supabase Update Unit Error (ID: ${unitId}):`, updateError);
                    // Decide how to handle partial failures - maybe collect errors and report?
                    // For now, we'll throw, which will roll back or indicate failure
                    throw new Error(`Erro ao atualizar unidade ${unitId}.`);
                }
            }
        }

        // Delete marked units
        if (unitIdsToDelete.length > 0) {
            const { error: deleteError } = await supabase.from("units").delete().in("id", unitIdsToDelete);
            if (deleteError) {
                console.error("Supabase Delete Units Error:", deleteError);
                throw new Error("Erro ao deletar unidades marcadas.");
            }
        }
        // --- End Unit Synchronization ---

        // Fetch the updated property with its units to return
        const { data: updatedProperty, error: fetchError } = await supabase
            .from("properties")
            .select("*, units(*)") // Fetch related units
            .eq("id", id)
            .single();

        if (fetchError || !updatedProperty) {
            console.error("Failed to fetch updated property:", fetchError);
            // Return success but indicate fetch failure, or handle as an error?
            // Returning the validated data might be better than nothing if fetch fails
            return NextResponse.json({ message: "Propriedade atualizada, mas erro ao buscar dados finais." });
        }

        return NextResponse.json(updatedProperty); // Return updated property with units
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
    context: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
    if (!(await isAdmin(request))) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = supabaseAdmin;
    // Access params directly from context
    const { id } = await context.params;

    if (!id) {
        return NextResponse.json({ error: "ID da propriedade ausente" }, { status: 400 });
    }

    try {
        // Delete the property. Units might be deleted via CASCADE constraint if set up in SQL.
        const { error } = await supabase.from("properties").delete().eq("id", id);

        if (error) {
            console.error("Supabase DELETE Error:", error);
            // Handle foreign key constraint error specifically if cascade delete isn't set up
            if (error.code === "23503") {
                // Foreign key violation
                return NextResponse.json(
                    {
                        error: "Erro: Não é possível excluir a propriedade pois existem unidades associadas. Exclua as unidades primeiro.",
                    },
                    { status: 409 }
                ); // Conflict
            }
            throw new Error("Erro ao excluir propriedade.");
        }

        return NextResponse.json({ message: "Propriedade excluída com sucesso" });
    } catch (error) {
        console.error("API DELETE [id] Error:", error);
        const message = error instanceof Error ? error.message : "Erro interno do servidor";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
