import { getUserRequests } from "@/firebase/dashboard/service"; // Importa a função refatorada
import { verifySessionCookie } from "@/firebase/firebase-admin-config";
import { NextResponse, type NextRequest } from "next/server";

export async function GET(request: NextRequest) {
    try {
        // 1. Verify user session
        const sessionCookie = request.cookies.get("session")?.value;
        if (!sessionCookie) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        const decodedClaims = await verifySessionCookie(sessionCookie);
        if (!decodedClaims) {
            const response = NextResponse.json({ error: "Unauthorized - Invalid session" }, { status: 401 });
            response.cookies.delete("session");
            return response;
        }
        const userId = decodedClaims.uid;

        // 2. Parse query parameters
        const { searchParams } = new URL(request.url);
        const typeParam = searchParams.get("type");
        const cursor = searchParams.get("cursor") || undefined; // Passa como undefined se for null

        if (typeParam !== "visits" && typeParam !== "reservations") {
            return NextResponse.json(
                { error: "Invalid type parameter. Use 'visits' or 'reservations'." },
                { status: 400 }
            );
        }
        const type = typeParam as "visits" | "reservations";

        // 3. Fetch data using the service function
        const result = await getUserRequests(userId, type, cursor);

        // 4. Return the data
        return NextResponse.json(result);
    } catch (error) {
        console.error("Error fetching user requests:", error);
        const message = error instanceof Error ? error.message : "Internal Server Error";
        let status = 500;
        // Trata especificamente erros de autenticação para instruir o cliente
        if (
            error &&
            typeof error === "object" &&
            "code" in error &&
            typeof error.code === "string" &&
            error.code.startsWith("auth/")
        ) {
            status = 401;
        }
        const response = NextResponse.json({ error: message }, { status });
        if (status === 401) {
            response.cookies.delete("session");
        }
        return response;
    }
}
