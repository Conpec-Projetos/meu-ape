import { verifySessionCookie } from "@/firebase/firebase-admin-config";
import { Property } from "@/interfaces/property";
import { Unit } from "@/interfaces/unit";
import { sendEmailAdmin } from "@/lib/sendEmailAdmin";
import { supabaseAdmin } from "@/supabase/supabase-admin";
import type { Json } from "@/supabase/types/types";
import { NextRequest, NextResponse } from "next/server";

interface RequestData {
    property: Property;
    unit: Unit;
}

export async function POST(req: NextRequest) {
    try {
        const sessionCookie = req.cookies.get("session")?.value;
        if (!sessionCookie) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const decodedClaims = await verifySessionCookie(sessionCookie);
        if (!decodedClaims) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        const userId = decodedClaims.uid;

        const dataToUpload = (await req.json()) as Partial<RequestData> & {
            propertyId?: string;
            unitId?: string;
            clientMsg?: string;
        };

        const propertyId = dataToUpload.propertyId ?? dataToUpload.property?.id;
        const unitId = dataToUpload.unitId ?? dataToUpload.unit?.id;
        const propertyName = dataToUpload.property?.name;
        const unitIdentifier = dataToUpload.unit?.identifier;
        const unitBlock = dataToUpload.unit?.block;

        if (!propertyId || !unitId) {
            return NextResponse.json({ error: "Bad Request" }, { status: 400 });
        }

        const { count: duplicateCount, error: duplicateError } = await supabaseAdmin
            .from("reservation_requests")
            .select("id", { head: true, count: "exact" })
            .eq("client_id", userId)
            .eq("unit_id", unitId)
            .in("status", ["pending", "approved"]);

        if (duplicateError) {
            throw new Error(duplicateError.message);
        }

        if ((duplicateCount ?? 0) > 0) {
            return NextResponse.json({ error: "Conflict", code: "DUPLICITY" }, { status: 409 });
        }

        const userSnapshot = await fetchUserSnapshot(userId);

        const { error: insertError } = await supabaseAdmin.from("reservation_requests").insert({
            client_id: userId,
            property_id: propertyId,
            unit_id: unitId,
            client_msg: dataToUpload.clientMsg ?? null,
            transaction_docs: userSnapshot.documents,
        });

        if (insertError) {
            throw new Error(insertError.message);
        }

        try {
            await sendEmailAdmin({
                type: "reservationRequest",
                clientName: userSnapshot.fullName,
                propertyName: propertyName ?? "",
                unitIdentifier: unitIdentifier ?? "",
                unitBlock,
            });
        } catch (error) {
            console.error(error);
        }

        return NextResponse.json({ success: true, message: "Reservation requested successfully" });
    } catch (error) {
        console.error("Error creating reservation request:", error);
        const message = error instanceof Error ? error.message : "Internal Server Error";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}

type UserSnapshot = {
    fullName: string;
    documents: Json;
};

const normalizeDocuments = (value: unknown): Json => {
    if (value && typeof value === "object") {
        return value as Json;
    }
    return {} as Json;
};

async function fetchUserSnapshot(userId: string): Promise<UserSnapshot> {
    const { data, error } = await supabaseAdmin.from("users").select("full_name, documents").eq("id", userId).single();
    if (error) throw new Error(error.message);

    return {
        fullName: data?.full_name ?? "",
        documents: normalizeDocuments(data?.documents ?? null),
    };
}
