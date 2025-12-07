import { verifySessionCookie } from "@/firebase/firebase-admin-config";
import { Property } from "@/interfaces/property";
import { Unit } from "@/interfaces/unit";
import { sendEmailAdmin } from "@/lib/sendEmailAdmin";
import { supabaseAdmin } from "@/supabase/supabase-admin";
import { NextResponse, type NextRequest } from "next/server";

interface RequestData {
    requestedSlots: string[];
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

        // Get data from request body
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
        const requestedSlots = dataToUpload.requestedSlots ?? [];

        if (!propertyId || !unitId || requestedSlots.length === 0) {
            return NextResponse.json({ error: "Bad Request" }, { status: 400 });
        }

        // Verify valid time in range of 14 days from tomorrow
        const now = new Date();
        const start = new Date(
            now.getFullYear(),
            now.getMonth(),
            now.getDate() + 1, // add 1 day
            0,
            0,
            0,
            0 // set time to 00:00:00.000
        );
        const end = new Date(
            now.getFullYear(),
            now.getMonth(),
            now.getDate() + 15, // add 1 day
            0,
            0,
            0,
            0 // set time to 00:00:00.000
        );
        for (const time of requestedSlots) {
            const date = getDate(time);
            if (date < start || date >= end) {
                return NextResponse.json({ error: "Bad Request" }, { status: 400 });
            }
        }

        const { count: duplicateCount, error: duplicateError } = await supabaseAdmin
            .from("visit_requests")
            .select("id", { count: "exact", head: true })
            .eq("client_id", userId)
            .eq("property_id", propertyId)
            .eq("unit_id", unitId)
            .in("status", ["pending", "approved"]);

        if (duplicateError) {
            throw new Error(duplicateError.message);
        }

        if ((duplicateCount ?? 0) > 0) {
            return NextResponse.json({ error: "Conflict" }, { status: 409 });
        }
        const normalizedSlots = requestedSlots.map(slot => toTimeStamp(slot).toISOString());

        const { error: insertError } = await supabaseAdmin.from("visit_requests").insert({
            client_id: userId,
            property_id: propertyId,
            unit_id: unitId,
            requested_slots: normalizedSlots,
            client_msg: dataToUpload.clientMsg ?? null,
        });

        if (insertError) {
            throw new Error(insertError.message);
        }

        const userName = await fetchUserName(userId);

        // Send emails to admins
        try {
            await sendEmailAdmin({
                type: "visitRequest",
                clientName: userName,
                propertyName: propertyName ?? "",
                unitIdentifier: unitIdentifier ?? "",
                unitBlock,
                requestedSlots,
            });
        } catch (error) {
            console.error(error);
        }

        // Return success response
        return NextResponse.json({ success: true, message: "Visit requested  successfully" });
    } catch (error) {
        console.error("Error creating visit request:", error);
        const message = error instanceof Error ? error.message : "Internal Server Error";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}

async function fetchUserName(userId: string): Promise<string> {
    const { data, error } = await supabaseAdmin.from("users").select("full_name").eq("id", userId).single();
    if (error) throw new Error(error.message);
    return data?.full_name ?? "";
}

function getDate(date: string) {
    // Remove weekday prefix (e.g., "sex. ")
    const parts = date.split(" "); // ["sex.", "31/10-12:30"]
    const dateTimePart = parts[1]; // "31/10-12:30"

    //Split date and time
    const [datePart, timePart] = dateTimePart.split("-"); // "31/10", "12:30"

    // Split date
    const [day, month] = datePart.split("/").map(Number); // 31, 10

    // Split time
    const [hour, minute] = timePart.split(":").map(Number); // 12, 30

    // Get year
    const year = new Date().getFullYear(); // or parse it if available

    return new Date(year, month - 1, day, hour, minute);
}

function toTimeStamp(date: string) {
    return getDate(date);
}
