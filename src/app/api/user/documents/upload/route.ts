import { verifySessionCookie } from "@/firebase/firebase-admin-config";
import { uploadUserDocuments } from "@/services/usersService";
import { NextResponse, type NextRequest } from "next/server";

export async function POST(request: NextRequest) {
    try {
        // Verify user session
        const sessionCookie = request.cookies.get("session")?.value;
        if (!sessionCookie) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        const decodedClaims = await verifySessionCookie(sessionCookie);
        if (!decodedClaims) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        const userId = decodedClaims.uid;

        // Get FormData from request
        const formData = await request.formData();
        const filesToUpload: Record<string, File[]> = {};

        // Group files by field name (e.g., 'addressProof', 'incomeProof')
        formData.forEach((value, key) => {
            if (value instanceof File) {
                if (!filesToUpload[key]) {
                    filesToUpload[key] = [];
                }
                filesToUpload[key].push(value);
            }
        });

        if (Object.keys(filesToUpload).length === 0) {
            return NextResponse.json({ error: "No files provided" }, { status: 400 });
        }

        // Call service function to upload files and update Firestore
        const uploadedUrls = await uploadUserDocuments(userId, filesToUpload);

        // Return success response
        return NextResponse.json({ success: true, urls: uploadedUrls });
    } catch (error) {
        console.error("Error uploading user documents:", error);
        const message = error instanceof Error ? error.message : "Internal Server Error";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
