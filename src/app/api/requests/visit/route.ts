import { verifySessionCookie } from "@/firebase/firebase-admin-config"; // For getting user ID
import { db } from "@/firebase/firebase-config";
import { createVisitRequest } from "@/firebase/visitRequest/service";
import { Property } from "@/interfaces/property";
import { Unit } from "@/interfaces/unit";
import { VisitRequest } from "@/interfaces/visitRequest";
import { sendEmailAdmin } from "@/lib/sendEmailAdmin";
import { and, collection, doc, getCountFromServer, getDoc, or, query, Timestamp, where } from "firebase/firestore";
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
        const dataToUpload = await req.json();

        const { requestedSlots, property, unit } = dataToUpload as RequestData;

        if (!property.id || !unit.id) {
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

        // Verify if already exist a request
        const userRef = doc(db, "users", userId);
        // Supabase-first: não usamos mais referências do Firebase para property/unit

        const q = query(
            collection(db, "visitRequests"),
            and(
                where("client.ref", "==", userRef),
                where("property.id", "==", property.id),
                or(where("status", "==", "pending"), where("status", "==", "approved"))
            )
        );

        const snapshot = await getCountFromServer(q);

        if (snapshot.data().count > 0) {
            return NextResponse.json({ error: "Conflict" }, { status: 409 });
        }

        // Create Request
        // Get user name
        const userSnap = await getDoc(userRef);
        let userName: string;
        if (userSnap.exists()) {
            userName = userSnap.data().fullName as string;
        } else {
            console.error("User not found");
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // format selected dates to Timestamp
        const timeSlots: Timestamp[] = [];
        requestedSlots.map(time => {
            timeSlots.push(toTimeStamp(time));
        });

        // Upload
        const uploadData = {
            client: {
                fullName: userName,
                ref: userRef,
            },
            property: {
                name: property.name,
                id: property.id!,
            },
            unit: {
                block: unit.block ? unit.block : "",
                identifier: unit.identifier,
                id: unit.id!,
            },
            requestedSlots: timeSlots,
        } as Partial<VisitRequest>;

        await createVisitRequest(uploadData);

        // Send emails to admins
        try {
            await sendEmailAdmin({
                type: "visitRequest",
                clientName: userName,
                propertyName: property.name,
                unitIdentifier: unit.identifier,
                unitBlock: unit.block,
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
    // Create a Date object
    const dateObj = getDate(date);

    // Convert to Firebase Timestamp
    return Timestamp.fromDate(dateObj);
}
