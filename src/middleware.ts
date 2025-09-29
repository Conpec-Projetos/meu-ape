import { NextResponse, type NextRequest } from "next/server";
import { verifySessionCookie } from "./firebase/firebase-admin-config";

export const runtime = 'nodejs';

export async function middleware(request: NextRequest) {
    const sessionCookie = request.cookies.get("session")?.value;
    const { pathname } = request.nextUrl;

    const isAuthPage = ["/login", "/signup", "/forgot-password"].some(path => pathname.startsWith(path));
    const isAdminPage = ["/admin", "/beta"].some(path => pathname.startsWith(path));

    if (!sessionCookie) {
        if (isAuthPage) {
            return NextResponse.next();
        }
        return NextResponse.redirect(new URL("/login", request.url));
    }

    try {
        const decodedClaims = await verifySessionCookie(sessionCookie);
        if (!decodedClaims) {
            const response = NextResponse.redirect(new URL("/login", request.url));
            response.cookies.delete("session");
            return response;
        }

        const { role, uid } = decodedClaims;

        if (isAuthPage) {
            return NextResponse.redirect(new URL("/", request.url));
        }

        if (isAdminPage && role !== "admin") {
            return NextResponse.redirect(new URL("/", request.url));
        }

        const requestHeaders = new Headers(request.headers);
        requestHeaders.set("x-user-role", role);
        requestHeaders.set("x-user-uid", uid);

        return NextResponse.next({
            request: {
                headers: requestHeaders,
            },
        });
    } catch (error) {
        console.error("Error verifying session cookie:", error);
        const response = NextResponse.redirect(new URL("/login", request.url));
        response.cookies.delete("session");
        return response;
    }
}

export const config = {
    matcher: ["/((?!api|_next/static|_next/image|favicon.ico|logo.png|invlogo.png|assets|register).*)"],
};