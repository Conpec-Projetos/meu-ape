import { verifySessionCookie } from "@/firebase/firebase-admin-config";
import { db } from "@/firebase/firebase-config";
import { ReservationRequest } from "@/interfaces/reservationRequest";
import { VisitRequest } from "@/interfaces/visitRequest";
import { deleteDoc, doc, getDoc } from "firebase/firestore";
import { NextResponse, type NextRequest } from "next/server";

export async function DELETE(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
    try {
        const { id } = await context.params;
        if (!id) {
            return NextResponse.json({ error: "Missing request id" }, { status: 400 });
        }

        // Auth via session cookie
        const sessionCookie = request.cookies.get("session")?.value;
        if (!sessionCookie) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        const decoded = await verifySessionCookie(sessionCookie);
        if (!decoded) {
            const res = NextResponse.json({ error: "Unauthorized - Invalid session" }, { status: 401 });
            res.cookies.delete("session");
            return res;
        }
        const userId = decoded.uid;

        // Get type from query
        const { searchParams } = new URL(request.url);
        const typeParam = searchParams.get("type");
        if (typeParam !== "visits" && typeParam !== "reservations") {
            return NextResponse.json(
                { error: "Invalid type parameter. Use 'visits' or 'reservations'." },
                { status: 400 }
            );
        }
        const collectionName = typeParam === "visits" ? "visitRequests" : "reservationRequests";

        // Load document and validate ownership + status
        const requestRef = doc(db, collectionName, id);
        const snap = await getDoc(requestRef);
        if (!snap.exists()) {
            return NextResponse.json({ error: "Request not found" }, { status: 404 });
        }

        const data = snap.data() as VisitRequest | ReservationRequest;
        // Only allow cancel when pending
        if (data.status !== "pending") {
            return NextResponse.json({ error: "Only pending requests can be canceled" }, { status: 409 });
        }

        // Ensure the request belongs to the authenticated user
        const clientRefPath =
            data && typeof data === "object" && "client" in data
                ? (data as { client?: { ref?: { path?: string } } }).client?.ref?.path
                : undefined;
        const expectedPath = `users/${userId}`;
        if (!clientRefPath || !clientRefPath.endsWith(expectedPath)) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        await deleteDoc(requestRef);
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error canceling user request:", error);
        const message = error instanceof Error ? error.message : "Internal Server Error";
        let status = 500;
        if (
            error &&
            typeof error === "object" &&
            "code" in (error as Record<string, unknown>) &&
            typeof (error as Record<string, unknown>).code === "string" &&
            String((error as Record<string, unknown>).code).startsWith("auth/")
        ) {
            status = 401;
        }
        const res = NextResponse.json({ error: message }, { status });
        if (status === 401) res.cookies.delete("session");
        return res;
    }
}
