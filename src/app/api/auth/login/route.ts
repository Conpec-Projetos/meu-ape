import { adminAuth, adminDb } from "@/firebase/firebase-admin-config";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
    try {
        const { idToken } = await req.json();

        if (!idToken) {
            return NextResponse.json({ error: "ID token not provided" }, { status: 400 });
        }

        const decodedToken = await adminAuth.verifyIdToken(idToken);
        const { uid } = decodedToken;

        const userDoc = await adminDb.collection("users").doc(uid).get();
        const user = userDoc.data();

        if (user) {
            await adminAuth.setCustomUserClaims(uid, { role: user.role });
        }

        const expiresIn = 60 * 60 * 24 * 14 * 1000; // 14 days in milliseconds
        const sessionCookie = await adminAuth.createSessionCookie(idToken, { expiresIn });

        const options = {
            name: "session",
            value: sessionCookie,
            maxAge: expiresIn,
            httpOnly: true,
            secure: true,
        };

        const response = NextResponse.json({ status: "success" }, { status: 200 });
        response.cookies.set(options);

        return response;
    } catch (error) {
        console.error("Error creating session cookie:", error);
        return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }
}