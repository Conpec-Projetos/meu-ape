import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
    const sessionCookie = request.cookies.get("session")?.value;
    const { pathname } = request.nextUrl;

    const isAuthPage = ["/login", "/signup", "/forgot-password"].some(path => pathname.startsWith(path));
    const isAdminPage = ["/admin", "/beta"].some(path => pathname.startsWith(path));

    // If there's no session cookie and the user is not on an auth page, redirect to login.
    if (!sessionCookie) {
        if (isAuthPage) {
            return NextResponse.next();
        }
        return NextResponse.redirect(new URL("/login", request.url));
    }

    // Call the internal API to verify the session
    const verifyUrl = new URL("/api/auth/verify-session", request.url);
    const response = await fetch(verifyUrl, {
        headers: {
            Cookie: `session=${sessionCookie}`,
        },
    });

    const data = await response.json();

    // If the session is not valid, redirect to login and clear the cookie
    if (!data.isAuthenticated) {
        const loginUrl = new URL("/login", request.url);
        const redirectResponse = NextResponse.redirect(loginUrl);
        redirectResponse.cookies.delete("session");
        return redirectResponse;
    }

    const { role, uid } = data.decodedClaims;

    // If the user is authenticated and tries to access an auth page, redirect to home.
    if (isAuthPage) {
        return NextResponse.redirect(new URL("/", request.url));
    }

    // If a non-admin user tries to access an admin page, redirect to home.
    if (isAdminPage && role !== "admin") {
        return NextResponse.redirect(new URL("/", request.url));
    }

    // Add user data to the request headers for use in server components
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
    matcher: ["/((?!api|_next/static|_next/image|favicon.ico|logo.png|invlogo.png|assets|register).*)"],
};