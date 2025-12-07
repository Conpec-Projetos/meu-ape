import { createClient } from "@/supabase/supabase"; // Seu client server-side ou client-side

export async function getUserRequests(userId: string, type: "visits" | "reservations", page = 1) {
    const supabase = await createClient(); // Se for Server Component
    const table = type === "visits" ? "visit_requests" : "reservation_requests";
    const from = (page - 1) * 15;
    const to = from + 14;

    // A mágica do Supabase: Join automático com propriedades e unidades
    const { data, count, error } = await supabase
        .from(table)
        .select(`
            *,
            property:properties(name, address),
            unit:units(identifier, block),
            assignments:request_assignments(
                agent:users(full_name, email, phone)
            )
        `, { count: 'exact' })
        .eq('client_id', userId)
        .order('created_at', { ascending: false })
        .range(from, to);

    if (error) throw new Error(error.message);

    return { 
        requests: data, 
        total: count,
        totalPages: Math.ceil((count || 0) / 15) 
    };
}