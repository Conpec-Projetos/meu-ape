import { adminAuth } from "@/firebase/firebase-admin-config";
import { supabaseAdmin } from "@/supabase/supabase-admin";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
    try {
        const { idToken } = await req.json();

        if (!idToken) {
            return NextResponse.json({ error: "ID token not provided" }, { status: 400 });
        }

        const decodedToken = await adminAuth.verifyIdToken(idToken);
        const { uid } = decodedToken;

        let role: string | undefined;
        try {
            const { data, error } = await supabaseAdmin.from("users").select("role").eq("id", uid).maybeSingle();
            if (error) {
                throw error;
            }
            role = data?.role ?? undefined;
        } catch (fetchError) {
            console.error("Error fetching user role from Supabase:", fetchError);
        }

        if (role) {
            await adminAuth.setCustomUserClaims(uid, { role });
        }

        const expiresIn = 60 * 60 * 24 * 14 * 1000; // 14 days in milliseconds
        const sessionCookie = await adminAuth.createSessionCookie(idToken, { expiresIn });

        const cookieMaxAge = Math.floor(expiresIn / 1000); // cookies expect seconds
        const options = {
            name: "session",
            value: sessionCookie,
            maxAge: cookieMaxAge,
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax" as const,
            path: "/",
        };

        const response = NextResponse.json({ status: "success" }, { status: 200 });
        response.cookies.set(options);

        return response;
    } catch (error) {
        console.error("Error creating session cookie:", error);
        return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }
}
