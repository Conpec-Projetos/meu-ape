import { verifySessionCookie } from "@/firebase/firebase-admin-config";
import { geocodeAddressSmart } from "@/lib/geocoding";
import { normalizePropertyArrays } from "@/lib/normalizePropertyArrays";
import { propertySchema } from "@/schemas/propertySchema";
import { unitSchema } from "@/schemas/unitSchema";
import { supabaseAdmin } from "@/supabase/supabase-admin";
import { Tables, TablesInsert, TablesUpdate } from "@/supabase/types/types";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

async function isAdmin(request: NextRequest): Promise<boolean> {
    const sessionCookie = request.cookies.get("session")?.value;
    if (!sessionCookie) return false;
    const decodedClaims = await verifySessionCookie(sessionCookie);
    return decodedClaims?.role === "admin";
}

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }): Promise<NextResponse> {
    if (!(await isAdmin(request))) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = supabaseAdmin;
    const { id } = await context.params;

    if (!id) {
        return NextResponse.json({ error: "ID da propriedade ausente" }, { status: 400 });
    }

    try {
        const { data: property, error: propertyError } = await supabase
            .from("properties")
            .select("*")
            .eq("id", id)
            .single();

        if (propertyError || !property) {
            console.error("Supabase GET Property Error:", propertyError);
            return NextResponse.json({ error: "Propriedade não encontrada" }, { status: 404 });
        }

        const { data: units, error: unitsError } = await supabase.from("units").select("*").eq("property_id", id);

        if (unitsError) {
            console.error("Supabase GET Units Error:", unitsError);
            return NextResponse.json({ error: "Erro ao buscar unidades da propriedade" }, { status: 500 });
        }

        // Normalize array fields to always be arrays
        const normalizedProperty = normalizePropertyArrays(property as Tables<"properties">);
        return NextResponse.json({ ...normalizedProperty, units: units || [] });
    } catch (error) {
        console.error("API GET [id] Error:", error);
        const message = error instanceof Error ? error.message : "Erro interno do servidor";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}

export async function PUT(request: NextRequest, context: { params: Promise<{ id: string }> }): Promise<NextResponse> {
    if (!(await isAdmin(request))) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = supabaseAdmin;
    const { id } = await context.params;

    if (!id) {
        return NextResponse.json({ error: "ID da propriedade ausente" }, { status: 400 });
    }

    try {
        const body = await request.json();
        // Separate units from property data, default units to an empty array if not present
        const { units = [], ...propertyData } = body;

        // Validate property data (allow partial updates), now as arrays
        const validatedPropertyData = propertySchema.partial().parse(propertyData);
        // Prefer client-provided coordinates when available and valid
        const clientLat = typeof body?.lat === "number" ? body.lat : Number(body?.lat);
        const clientLng = typeof body?.lng === "number" ? body.lng : Number(body?.lng);
        const hasValidClientCoords =
            Number.isFinite(clientLat) && Number.isFinite(clientLng) && !(clientLat === 0 && clientLng === 0);
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
        type PropertyUpdate = TablesUpdate<"properties">;
        const allowedKeys: (keyof PropertyUpdate)[] = [
            "address",
            "areas_images",
            "delivery_date",
            "description",
            "developer_id",
            "features",
            "floors",
            "groups",
            "launch_date",
            "location",
            "matterport_urls",
            "name",
            "original_firestore_id",
            "property_images",
            "search_tsv",
            "search_vector",
            "units_per_floor",
            "updated_at",
        ];

        const updatePayload: PropertyUpdate = { updated_at: new Date().toISOString() };
        for (const key of allowedKeys) {
            if (key in validatedPropertyData && key !== "groups" && key !== "updated_at") {
                const value = (validatedPropertyData as Record<string, unknown>)[key];
                (updatePayload as Record<string, unknown>)[key] = value as unknown;
            }
        }
        if (Object.prototype.hasOwnProperty.call(validatedPropertyData, "groups")) {
            const g = (validatedPropertyData as { groups?: unknown }).groups;
            const arr = Array.isArray(g) ? (g as string[]) : typeof g === "string" ? (g as string).split(",") : [];
            updatePayload.groups = (arr.length ? arr : null) as string[] | null;
        }

        const { error: propertyUpdateError } = await supabase.from("properties").update(updatePayload).eq("id", id);
        // If client supplied coords, trust them; otherwise, try geocoding when address provided
        let geocodingFailed = false;
        if (hasValidClientCoords) {
            try {
                await supabase.from("properties").update({ location: null }).eq("id", id);
                await supabase.rpc("set_property_location", {
                    p_property_id: id,
                    p_lat: clientLat,
                    p_lng: clientLng,
                });
            } catch (e) {
                console.warn("Falha ao aplicar coordenadas do cliente:", e);
                geocodingFailed = true;
            }
        } else if (typeof validatedPropertyData.address === "string" && validatedPropertyData.address.trim()) {
            try {
                const result = await geocodeAddressSmart(validatedPropertyData.address);
                // Some environments only set location when it's null; proactively clear then set.
                if (result) {
                    await supabase.from("properties").update({ location: null }).eq("id", id);
                    await supabase.rpc("set_property_location", {
                        p_property_id: id,
                        p_lat: result.lat,
                        p_lng: result.lng,
                    });
                } else {
                    // If geocoding failed, avoid stale coords by clearing location
                    await supabase.from("properties").update({ location: null }).eq("id", id);
                    geocodingFailed = true;
                }
            } catch (e) {
                console.warn("Falha ao geocodificar endereço no update:", e);
                geocodingFailed = true;
            }
        }

        if (propertyUpdateError) {
            console.error("Supabase Update Property Error:", propertyUpdateError);
            throw new Error("Erro ao atualizar dados da propriedade.");
        }

        // Unit Synchronization Logic
        const unitsToInsert = validatedUnits.filter(u => u.status === "new" && !u.id);
        const unitsToUpdate = validatedUnits.filter(u => u.id && (u.status === "updated" || !u.status)); // Update if status is 'updated' or missing
        const unitIdsToDelete = validatedUnits
            .filter(u => u.id && u.status === "deleted")
            .map(u => u.id)
            .filter((id): id is string => id !== undefined); // Ensure IDs are strings

        // Insert new units
        if (unitsToInsert.length > 0) {
            const insertPayload: TablesInsert<"units">[] = unitsToInsert.map(u => {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const unitData: any = { ...u };
                delete unitData.status;
                delete unitData.id;
                const payload: TablesInsert<"units"> = {
                    ...unitData,
                    property_id: id,
                    identifier: unitData.identifier || "",
                    category:
                        typeof unitData.category === "string"
                            ? [unitData.category]
                            : Array.isArray(unitData.category)
                              ? unitData.category
                              : (unitData.category ?? null),
                };
                return payload;
            });
            const { error: insertError } = await supabase.from("units").insert(insertPayload);
            if (insertError) {
                console.error("Supabase Insert Units Error:", insertError);
                throw new Error("Erro ao inserir novas unidades.");
            }
        }

        // Update existing units
        for (const unit of unitsToUpdate) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const temp: any = { ...unit };
            const unitId = temp.id as string | undefined;
            delete temp.id;
            delete temp.status;
            if (unitId) {
                const unitUpdatePayload: TablesUpdate<"units"> = {
                    ...temp,
                    updated_at: new Date().toISOString(),
                    category:
                        typeof temp.category === "string"
                            ? [temp.category]
                            : Array.isArray(temp.category)
                              ? temp.category
                              : (temp.category ?? null),
                };
                const { error: updateError } = await supabase.from("units").update(unitUpdatePayload).eq("id", unitId);
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
            return NextResponse.json({
                message: "Propriedade atualizada, mas erro ao buscar dados finais.",
                ...(geocodingFailed ? { geocodingFailed: true } : {}),
            });
        }

        return NextResponse.json({
            ...updatedProperty,
            ...(geocodingFailed ? { geocodingFailed: true } : {}),
        }); // Return updated property with units and optional geocoding flag
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
    const { id } = await context.params;

    if (!id) {
        return NextResponse.json({ error: "ID da propriedade ausente" }, { status: 400 });
    }

    try {
        // Delete the property. Units might be deleted via CASCADE constraint set up in SQL.
        const { error } = await supabase.from("properties").delete().eq("id", id);

        if (error) {
            console.error("Supabase DELETE Error:", error);
            if (error.code === "23503") {
                // Foreign key violation
                return NextResponse.json(
                    {
                        error: "Erro: Não é possível excluir a propriedade pois existem unidades associadas. Exclua as unidades primeiro.",
                    },
                    { status: 409 }
                );
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
