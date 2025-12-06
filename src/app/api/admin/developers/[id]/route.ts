import { verifySessionCookie } from "@/firebase/firebase-admin-config";
import { developerSchema } from "@/schemas/developerSchema";
import { supabaseAdmin } from "@/supabase/supabase-admin";
import { NextRequest, NextResponse } from "next/server";
import z from "zod";

async function isAdmin(request: NextRequest) {
    const sessionCookie = request.cookies.get("session")?.value;
    if (!sessionCookie) return false;
    const decoded = await verifySessionCookie(sessionCookie);
    return decoded?.role === "admin";
}

function normalizeDeveloper(data: Record<string, unknown> | null) {
    if (!data) return data;
    const { developer_contacts, ...rest } = data as Record<string, unknown> & {
        developer_contacts?: unknown;
    };
    return { ...rest, contacts: developer_contacts ?? [] };
}

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }): Promise<NextResponse> {
    if (!(await isAdmin(request))) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { id } = await context.params;
    try {
        const supabase = supabaseAdmin;
        const { data, error } = await supabase
            .from("developers")
            .select("*, developer_contacts(*)")
            .eq("id", id)
            .single();
        if (error) {
            console.error("Supabase GET Developer Error:", error);
            return NextResponse.json({ error: "Não encontrado" }, { status: 404 });
        }
        return NextResponse.json(normalizeDeveloper(data));
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
        const { contacts, ...rest } = parsed;
        const developerUpdates = Object.entries(rest).reduce<Record<string, unknown>>((acc, [key, value]) => {
            if (value !== undefined) {
                acc[key] = value;
            }
            return acc;
        }, {});
        const supabase = supabaseAdmin;
        if (Object.keys(developerUpdates).length > 0) {
            const { error } = await supabase.from("developers").update(developerUpdates).eq("id", id);
            if (error) {
                console.error("Supabase Update Developer Error:", error);
                throw new Error("Erro ao atualizar construtora");
            }
        }

        if (contacts !== undefined) {
            const { data: existingContacts, error: existingError } = await supabase
                .from("developer_contacts")
                .select("id")
                .eq("developer_id", id);
            if (existingError) {
                console.error("Supabase List Developer Contacts Error:", existingError);
                throw new Error("Erro ao buscar contatos da construtora");
            }

            const incomingIds = contacts
                .map(contact => contact.id)
                .filter((contactId): contactId is string => Boolean(contactId));
            const idsToDelete = (existingContacts || [])
                .filter(contact => !incomingIds.includes(contact.id))
                .map(contact => contact.id);

            if (idsToDelete.length > 0) {
                const { error: deleteError } = await supabase.from("developer_contacts").delete().in("id", idsToDelete);
                if (deleteError) {
                    console.error("Supabase Delete Developer Contacts Error:", deleteError);
                    throw new Error("Erro ao remover contatos da construtora");
                }
            }

            for (const contact of contacts) {
                const contactPayload = {
                    name: contact.name,
                    email: contact.email,
                    phone: contact.phone,
                    state: contact.state,
                    city: contact.city,
                    developer_id: id,
                };

                if (contact.id) {
                    const { error: updateContactError } = await supabase
                        .from("developer_contacts")
                        .update(contactPayload)
                        .eq("id", contact.id);
                    if (updateContactError) {
                        console.error("Supabase Update Developer Contact Error:", updateContactError);
                        throw new Error("Erro ao atualizar contato da construtora");
                    }
                } else {
                    const { error: insertContactError } = await supabase
                        .from("developer_contacts")
                        .insert(contactPayload);
                    if (insertContactError) {
                        console.error("Supabase Insert Developer Contact Error:", insertContactError);
                        throw new Error("Erro ao criar contato da construtora");
                    }
                }
            }
        }

        const { data, error } = await supabase
            .from("developers")
            .select("*, developer_contacts(*)")
            .eq("id", id)
            .single();
        if (error) {
            console.error("Supabase Fetch Updated Developer Error:", error);
            throw new Error("Erro ao carregar construtora atualizada");
        }

        return NextResponse.json(normalizeDeveloper(data));
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
