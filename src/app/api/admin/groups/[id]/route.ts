import { verifySessionCookie } from "@/firebase/firebase-admin-config";
import { supabaseAdmin } from "@/supabase/supabase-admin";
import { NextRequest, NextResponse } from "next/server";

async function isAdmin(request: NextRequest) {
    const sessionCookie = request.cookies.get("session")?.value;
    if (!sessionCookie) return false;
    const decoded = await verifySessionCookie(sessionCookie);
    return decoded?.role === "admin";
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
    if (!(await isAdmin(request))) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { id } = await context.params;
        if (!id) {
            return NextResponse.json({ error: "ID do grupo é obrigatório" }, { status: 400 });
        }

        const { error } = await supabaseAdmin.from("groups").delete().eq("id", id);
        if (error) {
            console.error("Supabase DELETE Group Error:", error);
            throw new Error("Erro ao deletar grupo");
        }

        return NextResponse.json({ success: true });
    } catch (err) {
        console.error(err);
        const message = err instanceof Error ? err.message : "Erro interno";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
