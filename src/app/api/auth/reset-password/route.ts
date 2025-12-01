import { adminAuth } from "@/firebase/firebase-admin-config";
import { resetPasswordSchema } from "@/schemas/resetPasswordSchema";
import type { FirebaseError } from "firebase-admin";
import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";

const SUCCESS_MESSAGE = "Se houver uma conta associada a este email, um link de recuperação foi enviado.";
const SILENT_AUTH_ERROR_CODES = ["auth/user-not-found", "auth/invalid-email"];

const loginRedirectUrl = (() => {
    const fallbackHost = "https://meu-ape-conpec.vercel.app";
    const baseFromEnv =
        process.env.NEXT_PUBLIC_RESET_PASSWORD_REDIRECT_URL ||
        process.env.NEXT_PUBLIC_APP_URL ||
        process.env.NEXT_PUBLIC_SITE_URL ||
        process.env.NEXT_PUBLIC_VERCEL_URL ||
        fallbackHost;

    const normalizedBase =
        baseFromEnv.startsWith("http://") || baseFromEnv.startsWith("https://")
            ? baseFromEnv
            : `https://${baseFromEnv}`;

    try {
        return new URL("/login", normalizedBase).toString();
    } catch (error) {
        console.warn("Invalid reset redirect base URL. Falling back to default host.", error);
        return `${fallbackHost}/login`;
    }
})();

const isFirebaseAuthError = (error: unknown): error is FirebaseError & { code: string } => {
    if (typeof error !== "object" || error === null) {
        return false;
    }

    return "code" in error && typeof (error as { code: unknown }).code === "string";
};

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { email } = resetPasswordSchema.parse(body);

        await adminAuth.generatePasswordResetLink(email, { url: loginRedirectUrl });

        return NextResponse.json({ message: SUCCESS_MESSAGE });
    } catch (error) {
        if (error instanceof ZodError) {
            return NextResponse.json({ error: error.issues[0]?.message ?? "Payload inválido" }, { status: 400 });
        }

        if (isFirebaseAuthError(error) && SILENT_AUTH_ERROR_CODES.includes(error.code)) {
            return NextResponse.json({ message: SUCCESS_MESSAGE });
        }

        console.error("Erro ao solicitar redefinição de senha:", error);
        return NextResponse.json({ error: "Não foi possível processar a solicitação" }, { status: 500 });
    }
}
