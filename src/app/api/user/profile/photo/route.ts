import { verifySessionCookie } from "@/firebase/firebase-admin-config";
import { deleteUserProfilePhoto, uploadUserProfilePhoto } from "@/firebase/users/service";
import { NextResponse, type NextRequest } from "next/server";

const MAX_SIZE_BYTES = 3 * 1024 * 1024; // 3 MB

export async function POST(request: NextRequest) {
    try {
        const sessionCookie = request.cookies.get("session")?.value;
        if (!sessionCookie) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        const decodedClaims = await verifySessionCookie(sessionCookie);
        if (!decodedClaims) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        const userId = decodedClaims.uid;

        const formData = await request.formData();
        const photo = formData.get("photo");
        if (!(photo instanceof File)) {
            return NextResponse.json({ error: "No photo provided" }, { status: 400 });
        }

        // Basic validation
        if (!photo.type.startsWith("image/")) {
            return NextResponse.json({ error: "Invalid file type" }, { status: 400 });
        }
        if (photo.size > MAX_SIZE_BYTES) {
            return NextResponse.json({ error: "File too large. Max 3MB" }, { status: 400 });
        }

        const url = await uploadUserProfilePhoto(userId, photo);
        return NextResponse.json({ success: true, url });
    } catch (error) {
        console.error("Error uploading profile photo:", error);
        const message = error instanceof Error ? error.message : "Internal Server Error";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const sessionCookie = request.cookies.get("session")?.value;
        if (!sessionCookie) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        const decodedClaims = await verifySessionCookie(sessionCookie);
        if (!decodedClaims) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        const userId = decodedClaims.uid;

        await deleteUserProfilePhoto(userId);
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error deleting profile photo:", error);
        const message = error instanceof Error ? error.message : "Internal Server Error";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
