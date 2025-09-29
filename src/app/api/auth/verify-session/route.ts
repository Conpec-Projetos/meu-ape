import { type NextRequest, NextResponse } from "next/server";
import { verifySessionCookie } from "@/firebase/firebase-admin-config";

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
    const sessionCookie = request.cookies.get("session")?.value;

    if (!sessionCookie) {
        return NextResponse.json({ isAuthenticated: false }, { status: 401 });
    }

    try {
        const decodedClaims = await verifySessionCookie(sessionCookie);
        if (!decodedClaims) {
            // Cookie is invalid or expired
            const response = NextResponse.json({ isAuthenticated: false }, { status: 401 });
            response.cookies.delete("session");
            return response;
        }

        // Cookie is valid
        return NextResponse.json({ isAuthenticated: true, decodedClaims }, { status: 200 });

    } catch (error) {
        console.error("Error verifying session cookie in API route:", error);
        const response = NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
        response.cookies.delete("session");
        return response;
    }
}