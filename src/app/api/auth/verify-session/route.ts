import { verifySessionCookie } from "@/firebase/firebase-admin-config";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
    try {
        const { session: sessionCookie } = await request.json();

        if (!sessionCookie) {
            return NextResponse.json(
                { isAuthenticated: false, error: "Session cookie not provided." },
                { status: 401 }
            );
        }

        const decodedClaims = await verifySessionCookie(sessionCookie);
        if (!decodedClaims) {
            const response = NextResponse.json({ isAuthenticated: false }, { status: 401 });
            response.cookies.delete("session");
            return response;
        }

        return NextResponse.json({ isAuthenticated: true, decodedClaims }, { status: 200 });
    } catch (error) {
        console.error("Error verifying session cookie in API route:", error);
        if (error instanceof SyntaxError) {
            return NextResponse.json({ error: "Invalid JSON in request body." }, { status: 400 });
        }
        const response = NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
        response.cookies.delete("session");
        return response;
    }
}
