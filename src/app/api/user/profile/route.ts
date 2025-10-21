// src/app/api/user/profile/route.ts
import { verifySessionCookie } from "@/firebase/firebase-admin-config"; // For getting user ID
import { updateUserProfileData } from "@/firebase/users/service"; // We'll create this function
import { NextResponse, type NextRequest } from "next/server";

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
