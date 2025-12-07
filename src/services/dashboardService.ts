import { supabaseAdmin } from "@/supabase/supabase-admin";

const PAGE_SIZE = 15;

type RequestType = "visits" | "reservations";

const selectMap: Record<RequestType, string> = {
    visits: `
        id,
        status,
        requested_slots,
        scheduled_slot,
        client_msg,
        agent_msg,
        created_at,
        updated_at,
        property:properties(id,name,address),
        unit:units(id,identifier,block)
    `,
    reservations: `
        id,
        status,
        client_msg,
        agent_msg,
        transaction_docs,
        created_at,
        updated_at,
        property:properties(id,name,address),
        unit:units(id,identifier,block)
    `,
};

export async function getUserRequests(userId: string, type: RequestType, page = 1, pageSize = PAGE_SIZE) {
    if (!userId) {
        throw new Error("User ID is required");
    }

    const table = type === "visits" ? "visit_requests" : "reservation_requests";
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const { data, count, error } = await supabaseAdmin
        .from(table)
        .select(selectMap[type], { count: "exact" })
        .eq("client_id", userId)
        .order("created_at", { ascending: false })
        .range(from, to);

    if (error) throw new Error(error.message);

    const total = count ?? 0;
    const totalPages = total === 0 ? 1 : Math.ceil(total / pageSize);

    return {
        requests: data ?? [],
        total,
        totalPages,
        pageSize,
    };
}
