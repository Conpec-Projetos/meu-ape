import type { User } from "@/interfaces/user";
import { createUser, listUsers } from "@/services/usersService";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const roleParam = searchParams.get("role");
        const page = parseInt(searchParams.get("page") || "1", 10);
        const limit = parseInt(searchParams.get("limit") || "20", 10);
        const statusParam = searchParams.get("status");
        const searchParam = searchParams.get("q")?.trim() || undefined;

        const allowedRoles: User["role"][] = ["client", "agent", "admin"];
        if (!roleParam || !allowedRoles.includes(roleParam as User["role"])) {
            return NextResponse.json({ error: "Role parameter is required" }, { status: 400 });
        }
        const role = roleParam as User["role"];

        const allowedStatuses: NonNullable<User["status"]>[] = ["approved", "pending", "denied"];
        const status =
            statusParam && allowedStatuses.includes(statusParam as NonNullable<User["status"]>)
                ? (statusParam as User["status"])
                : undefined;

        const { users, totalPages, total } = await listUsers(role, page, limit, status, searchParam);

        return NextResponse.json({ users, totalPages, total });
    } catch (error) {
        console.error("Error fetching users:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const userData = await req.json();
        const newUser = await createUser(userData);
        return NextResponse.json(newUser, { status: 201 });
    } catch (error) {
        console.error("Error creating user:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
