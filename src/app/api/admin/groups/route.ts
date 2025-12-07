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

const groupSchema = z.object({
    name: z.string().min(1, "Nome é obrigatório."),
    description: z.string().nullable().optional(),
});

export async function GET(request: NextRequest) {
    if (!(await isAdmin(request))) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { data, error } = await supabaseAdmin
            .from("groups")
            .select("id, name, description, created_at")
            .order("name", { ascending: true });

        if (error) {
            console.error("Supabase GET Groups Error:", error);
            throw new Error("Erro ao buscar grupos");
        }

        return NextResponse.json({ groups: data ?? [] });
    } catch (err) {
        console.error(err);
        const message = err instanceof Error ? err.message : "Erro interno";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    if (!(await isAdmin(request))) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const payload = await request.json();
        const parsed = groupSchema.parse(payload);

        const { data, error } = await supabaseAdmin.from("groups").insert(parsed).select().single();
        if (error) {
            console.error("Supabase INSERT Group Error:", error);
            throw new Error("Erro ao criar grupo");
        }

        return NextResponse.json(data, { status: 201 });
    } catch (err) {
        console.error(err);
        if (err instanceof z.ZodError) {
            return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
        }
        const message = err instanceof Error ? err.message : "Erro interno";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
