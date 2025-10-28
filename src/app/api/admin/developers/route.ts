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

export async function GET(request: NextRequest) {
    if (!(await isAdmin(request))) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    try {
        const supabase = supabaseAdmin;
        const { data, error } = await supabase
            .from("developers")
            .select(`id, name, website, email, phone, logo_url`)
            .order("name", { ascending: true });
        if (error) {
            console.error("Supabase GET Developers Error:", error);
            throw new Error("Erro ao buscar construtoras");
        }
        return NextResponse.json({ developers: data || [] });
    } catch (e) {
        console.error(e);
        return NextResponse.json({ error: e instanceof Error ? e.message : "Erro interno" }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    if (!(await isAdmin(request))) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    try {
        const body = await request.json();
        const parsed = developerSchema.parse(body);
        const supabase = supabaseAdmin;
        const { data, error } = await supabase.from("developers").insert(parsed).select().single();
        if (error) {
            console.error("Supabase Insert Developer Error:", error);
            throw new Error("Erro ao criar construtora");
        }
        return NextResponse.json(data, { status: 201 });
    } catch (err) {
        console.error(err);
        if (err instanceof z.ZodError) {
            return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
        }
        return NextResponse.json({ error: err instanceof Error ? err.message : "Erro interno" }, { status: 500 });
    }
}
