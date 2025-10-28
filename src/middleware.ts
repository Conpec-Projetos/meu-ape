import { NextResponse, NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
    const sessionCookie = request.cookies.get("session")?.value;
    const { pathname } = request.nextUrl;

    const isAuthPage = ["/login", "/signup", "/forgot-password", "/agent-signup"].some(path => pathname.startsWith(path));
    const isAdminPage = ["/admin", "/beta"].some(path => pathname.startsWith(path));

    if (!sessionCookie) {
        if (isAuthPage) {
            return NextResponse.next();
        }
        return NextResponse.redirect(new URL("/login", request.url));
    }

    // Call the internal API to verify the session using POST
    const verifyUrl = new URL("/api/auth/verify-session", request.url);
    const response = await fetch(verifyUrl, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ session: sessionCookie }), // Send cookie in the body
    });

    // Check if the response is ok before parsing JSON
    if (!response.ok) {
        // If the status is 401, it means unauthenticated.
        if (response.status === 401) {
            const loginUrl = new URL("/login", request.url);
            const redirectResponse = NextResponse.redirect(loginUrl);
            redirectResponse.cookies.delete("session");
            return redirectResponse;
        }
        // For other errors, you might want to handle them differently or just redirect
        console.error("API error:", response.status, response.statusText);
        return NextResponse.redirect(new URL("/login", request.url));
    }

    const data = await response.json();

    if (!data.isAuthenticated) {
        const loginUrl = new URL("/login", request.url);
        const redirectResponse = NextResponse.redirect(loginUrl);
        redirectResponse.cookies.delete("session");
        return redirectResponse;
    }

    const { role, uid } = data.decodedClaims;

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
}

export const config = {
    matcher: ["/((?!api|_next/static|_next/image|assets|register|.*\\.(?:png|jpg|jpeg|gif|svg|ico)$).*)"],
};
