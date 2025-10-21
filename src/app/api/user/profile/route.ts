import { adminDb, verifySessionCookie } from "@/firebase/firebase-admin-config";
import { updateUserProfileData } from "@/firebase/users/service";
import { User } from "@/interfaces/user";
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
            // Se o cookie for inválido, instrua o cliente a deletá-lo
            const response = NextResponse.json({ error: "Unauthorized - Invalid session" }, { status: 401 });
            response.cookies.delete("session");
            return response;
        }
        const userId = decodedClaims.uid;

        // 2. Fetch user data from Firestore
        const userDocRef = adminDb.collection("users").doc(userId);
        const userDoc = await userDocRef.get();

        if (!userDoc.exists) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        const userData = userDoc.data() as User; // Cast to User type

        // Opcional: Remover dados sensíveis se houver algum (senha hash, etc.)
        // delete userData.passwordHash;

        // 3. Return user data
        return NextResponse.json({ success: true, user: { id: userDoc.id, ...userData } });
    } catch (error) {
        console.error("Error fetching user profile:", error);
        const message = error instanceof Error ? error.message : "Internal Server Error";
        // Em caso de erro, também instrua a deletar o cookie se for erro de autenticação
        let status = 500;
        if (error && typeof error === "object" && "code" in error) {
            const errObj = error as Record<string, unknown>;
            const code = typeof errObj.code === "string" ? errObj.code : undefined;
            if (code?.startsWith("auth/")) status = 401;
        }
        const response = NextResponse.json({ error: message }, { status });
        if (status === 401) {
            response.cookies.delete("session");
        }
        return response;
    }
}

export async function PUT(request: NextRequest) {
    try {
        // 1. Verify user session
        const sessionCookie = request.cookies.get("session")?.value;
        if (!sessionCookie) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        const decodedClaims = await verifySessionCookie(sessionCookie);
        if (!decodedClaims) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        const userId = decodedClaims.uid;

        // 2. Get data from request body
        const dataToUpdate = await request.json();

        // Basic validation (optional, Zod handles stricter validation on client)
        if (!dataToUpdate || Object.keys(dataToUpdate).length === 0) {
            return NextResponse.json({ error: "No data provided" }, { status: 400 });
        }

        // 3. Call service function to update Firestore
        await updateUserProfileData(userId, dataToUpdate);

        // 4. Return success response
        return NextResponse.json({ success: true, message: "Profile updated successfully" });
    } catch (error) {
        console.error("Error updating user profile:", error);
        const message = error instanceof Error ? error.message : "Internal Server Error";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
