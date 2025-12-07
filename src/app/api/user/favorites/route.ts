import { adminAuth, verifySessionCookie } from "@/firebase/firebase-admin-config";
import { supabaseAdmin } from "@/supabase/supabase-admin";
import { NextRequest, NextResponse } from "next/server";

async function getUserId(request: NextRequest) {
    const sessionCookie = request.cookies.get("session")?.value;
    if (sessionCookie) {
        const decoded = await verifySessionCookie(sessionCookie);
        if (decoded?.uid) return decoded.uid;
    }

    const authHeader = request.headers.get("authorization") ?? "";
    const [, token] = authHeader.match(/^Bearer\s+(.+)$/i) ?? [];
    if (token) {
        try {
            const decoded = await adminAuth.verifyIdToken(token);
            if (decoded?.uid) return decoded.uid;
        } catch (error) {
            console.error("Failed to verify bearer token", error);
        }
    }

    return null;
}

export async function GET(request: NextRequest) {
    const userId = await getUserId(request);
    if (!userId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data, error } = await supabaseAdmin.from("user_favorites").select("property_id").eq("user_id", userId);

    if (error) {
        console.error("Error fetching favorites:", error.message);
        return NextResponse.json({ error: "Failed to load favorites" }, { status: 500 });
    }

    return NextResponse.json({ favorites: (data ?? []).map(row => row.property_id) });
}

export async function POST(request: NextRequest) {
    const userId = await getUserId(request);
    if (!userId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { propertyId } = (await request.json().catch(() => ({}))) as { propertyId?: string };

    if (!propertyId) {
        return NextResponse.json({ error: "propertyId is required" }, { status: 400 });
    }

    const { error } = await supabaseAdmin
        .from("user_favorites")
        .upsert({ user_id: userId, property_id: propertyId }, { onConflict: "user_id,property_id" });

    if (error) {
        console.error("Error adding favorite:", error.message);
        return NextResponse.json({ error: "Failed to add favorite" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
}

export async function DELETE(request: NextRequest) {
    const userId = await getUserId(request);
    if (!userId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const propertyId = request.nextUrl.searchParams.get("propertyId");
    if (!propertyId) {
        return NextResponse.json({ error: "propertyId is required" }, { status: 400 });
    }

    const { error } = await supabaseAdmin
        .from("user_favorites")
        .delete()
        .eq("user_id", userId)
        .eq("property_id", propertyId);

    if (error) {
        console.error("Error removing favorite:", error.message);
        return NextResponse.json({ error: "Failed to remove favorite" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
}
