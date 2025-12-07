import { adminAuth, verifySessionCookie } from "@/firebase/firebase-admin-config";
import { createUser, getUserProfile, updateUserProfileData } from "@/services/usersService";
import { NextResponse, type NextRequest } from "next/server";

const buildUnauthorizedResponse = (message: string, deleteCookie = false) => {
    const response = NextResponse.json({ error: message }, { status: 401 });
    if (deleteCookie) {
        response.cookies.delete("session");
    }
    return response;
};

const ensureSessionUser = async (request: NextRequest) => {
    const sessionCookie = request.cookies.get("session")?.value;
    if (!sessionCookie) {
        return { response: buildUnauthorizedResponse("Unauthorized") };
    }

    const decodedClaims = await verifySessionCookie(sessionCookie);
    if (!decodedClaims) {
        return { response: buildUnauthorizedResponse("Unauthorized - Invalid session", true) };
    }

    return { userId: decodedClaims.uid };
};

const extractBearerToken = (request: NextRequest) => {
    const authHeader = request.headers.get("authorization") ?? "";
    const [, token] = authHeader.match(/^Bearer\s+(.+)$/i) ?? [];
    return token;
};

const isAuthError = (error: unknown): error is { code: string } => {
    return (
        typeof error === "object" &&
        error !== null &&
        "code" in error &&
        typeof (error as { code?: unknown }).code === "string" &&
        ((error as { code: string }).code.startsWith("auth/") ||
            (error as { code: string }).code === "invalid-argument")
    );
};

export async function GET(request: NextRequest) {
    const { userId, response } = await ensureSessionUser(request);
    if (response) {
        return response;
    }
    if (!userId) {
        return buildUnauthorizedResponse("Unauthorized");
    }

    try {
        const user = await getUserProfile(userId);
        return NextResponse.json({ success: true, user });
    } catch (error) {
        console.error("Error fetching user profile:", error);
        const message = error instanceof Error ? error.message : "Internal Server Error";
        const status = /not\sfound/i.test(message) ? 404 : 500;
        return NextResponse.json({ error: message }, { status });
    }
}

export async function POST(request: NextRequest) {
    try {
        const idToken = extractBearerToken(request);
        if (!idToken) {
            return buildUnauthorizedResponse("Unauthorized");
        }

        const decoded = await adminAuth.verifyIdToken(idToken);
        const userId = decoded.uid;
        const payload = await request.json();

        const email = payload.email ?? decoded.email;
        if (!email) {
            return NextResponse.json({ error: "Email é obrigatório" }, { status: 400 });
        }

        const userData = {
            id: userId,
            email,
            fullName: payload.fullName ?? decoded.name ?? "",
            role: payload.role ?? "client",
            status: payload.status ?? "pending",
            phone: payload.phone,
            address: payload.address,
            documents: payload.documents,
        };

        await createUser(userData);
        const user = await getUserProfile(userId);
        return NextResponse.json({ success: true, user });
    } catch (error) {
        console.error("Error creating user profile:", error);
        const message = error instanceof Error ? error.message : "Internal Server Error";
        if (isAuthError(error)) {
            return buildUnauthorizedResponse("Unauthorized");
        }
        const status = /duplicate key/i.test(message) ? 409 : 500;
        return NextResponse.json({ error: message }, { status });
    }
}

export async function PUT(request: NextRequest) {
    const { userId, response } = await ensureSessionUser(request);
    if (response) {
        return response;
    }
    if (!userId) {
        return buildUnauthorizedResponse("Unauthorized");
    }

    try {
        const dataToUpdate = await request.json();
        if (!dataToUpdate || Object.keys(dataToUpdate).length === 0) {
            return NextResponse.json({ error: "No data provided" }, { status: 400 });
        }

        const updatedUser = await updateUserProfileData(userId, dataToUpdate);
        return NextResponse.json({ success: true, user: updatedUser });
    } catch (error) {
        console.error("Error updating user profile:", error);
        const message = error instanceof Error ? error.message : "Internal Server Error";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
