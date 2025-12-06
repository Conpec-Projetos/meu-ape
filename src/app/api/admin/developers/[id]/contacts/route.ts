import { verifySessionCookie } from "@/firebase/firebase-admin-config";
import { supabaseAdmin } from "@/supabase/supabase-admin";
import { NextRequest, NextResponse } from "next/server";

async function isAdmin(request: NextRequest) {
    const sessionCookie = request.cookies.get("session")?.value;
    if (!sessionCookie) return false;
    const decoded = await verifySessionCookie(sessionCookie);
    return decoded?.role === "admin";
}

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }): Promise<NextResponse> {
    if (!(await isAdmin(request))) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { id } = await context.params;

    try {
        const { data, error } = await supabaseAdmin
            .from("developer_contacts")
            .select("*")
            .eq("developer_id", id)
            .order("name", { ascending: true });

        if (error) {
            console.error("Supabase GET Developer Contacts Error:", error);
            throw new Error("Erro ao buscar contatos da construtora");
        }

        return NextResponse.json({ contacts: data ?? [] });
    } catch (e) {
        console.error(e);
        return NextResponse.json({ error: e instanceof Error ? e.message : "Erro interno" }, { status: 500 });
    }
}
