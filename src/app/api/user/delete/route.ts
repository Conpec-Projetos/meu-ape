import { verifySessionCookie } from "@/firebase/firebase-admin-config";
import { deleteUser } from "@/services/usersService";
import { NextResponse, type NextRequest } from "next/server";

export async function DELETE(request: NextRequest) {
    try {
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
        await deleteUser(userId);

        const res = NextResponse.json({ success: true });
        res.cookies.delete("session");
        return res;
    } catch (error) {
        console.error("Error deleting user:", error);
        const message = error instanceof Error ? error.message : "Internal Server Error";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
