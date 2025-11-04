import { verifySessionCookie } from "@/firebase/firebase-admin-config";
import { deleteUserDocument } from "@/firebase/users/service";
import { NextResponse, type NextRequest } from "next/server";

export async function DELETE(request: NextRequest) {
    try {
        const sessionCookie = request.cookies.get("session")?.value;
        if (!sessionCookie) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        const decodedClaims = await verifySessionCookie(sessionCookie);
        if (!decodedClaims) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        const userId = decodedClaims.uid;

        const { field, url } = await request.json();
        if (!field || !url) {
            return NextResponse.json({ error: "Missing field or url" }, { status: 400 });
        }

        await deleteUserDocument(userId, field, url);
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error deleting user document:", error);
        const message = error instanceof Error ? error.message : "Internal Server Error";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
