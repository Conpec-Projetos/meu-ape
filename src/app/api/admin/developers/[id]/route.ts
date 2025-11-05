import { verifySessionCookie } from "@/firebase/firebase-admin-config";
import { supabaseAdmin } from "@/supabase/supabase-admin";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

async function isAdmin(request: NextRequest) {
    const sessionCookie = request.cookies.get("session")?.value;
    if (!sessionCookie) return false;
    const decoded = await verifySessionCookie(sessionCookie);
    return decoded?.role === "admin";
}

const developerSchema = z.object({
    name: z.string().min(1),
    website: z.string().optional(),
    email: z.string().optional(),
    phone: z.string().optional(),
    logo_url: z.string().nullable().optional(),
});

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }): Promise<NextResponse> {
    if (!(await isAdmin(request))) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { id } = await context.params;
    try {
        const supabase = supabaseAdmin;
        const { data, error } = await supabase.from("developers").select("*").eq("id", id).single();
        if (error) {
            console.error("Supabase GET Developer Error:", error);
            return NextResponse.json({ error: "Não encontrado" }, { status: 404 });
        }
        return NextResponse.json(data);
    } catch (e) {
        console.error(e);
        return NextResponse.json({ error: e instanceof Error ? e.message : "Erro interno" }, { status: 500 });
    }
}

export async function PUT(request: NextRequest, context: { params: Promise<{ id: string }> }): Promise<NextResponse> {
    if (!(await isAdmin(request))) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { id } = await context.params;
    try {
        const body = await request.json();
        const parsed = developerSchema.partial().parse(body);
        const supabase = supabaseAdmin;
        const { data, error } = await supabase.from("developers").update(parsed).eq("id", id).select().single();
        if (error) {
            console.error("Supabase Update Developer Error:", error);
            throw new Error("Erro ao atualizar construtora");
        }
        return NextResponse.json(data);
    } catch (err) {
        console.error(err);
        if (err instanceof z.ZodError) {
            return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
        }
        return NextResponse.json({ error: err instanceof Error ? err.message : "Erro interno" }, { status: 500 });
    }
}

export async function DELETE(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
    if (!(await isAdmin(request))) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { id } = await context.params;
    try {
        const supabase = supabaseAdmin;
        const { error } = await supabase.from("developers").delete().eq("id", id);
        if (error) {
            console.error("Supabase Delete Developer Error:", error);
            throw new Error("Erro ao deletar construtora");
        }
        return NextResponse.json({ success: true });
    } catch (e) {
        console.error(e);
        return NextResponse.json({ error: e instanceof Error ? e.message : "Erro interno" }, { status: 500 });
    }
}
