import { auth } from "@/firebase/firebase-config";
import { resetPasswordSchema } from "@/schemas/resetPasswordSchema";
import { FirebaseError } from "firebase/app";
import { sendPasswordResetEmail } from "firebase/auth";
import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";

const SUCCESS_MESSAGE = "Se houver uma conta associada a este email, um link de recuperação foi enviado.";
const SILENT_AUTH_ERROR_CODES = ["auth/user-not-found", "auth/invalid-email"];

const loginRedirectUrl = (() => {
    const baseFromEnv =
        process.env.NEXT_PUBLIC_RESET_PASSWORD_REDIRECT_URL ||
        process.env.NEXT_PUBLIC_APP_URL ||
        process.env.NEXT_PUBLIC_SITE_URL ||
        "https://meu-ape-vercel.app";

    const normalizedBase =
        baseFromEnv.startsWith("http://") || baseFromEnv.startsWith("https://")
            ? baseFromEnv
            : `https://${baseFromEnv}`;

    try {
        return new URL("/login", normalizedBase).toString();
    } catch (error) {
        console.warn("Invalid reset redirect base URL. Falling back to localhost.", error);
        return "http://localhost:3000/login";
    }
})();

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { email } = resetPasswordSchema.parse(body);

        await sendPasswordResetEmail(auth, email, { url: loginRedirectUrl });

        return NextResponse.json({ message: SUCCESS_MESSAGE });
    } catch (error) {
        if (error instanceof ZodError) {
            return NextResponse.json({ error: error.issues[0]?.message ?? "Payload inválido" }, { status: 400 });
        }

        if (error instanceof FirebaseError) {
            if (SILENT_AUTH_ERROR_CODES.includes(error.code)) {
                return NextResponse.json({ message: SUCCESS_MESSAGE });
            }
        }

        console.error("Erro ao solicitar redefinição de senha:", error);
        return NextResponse.json({ error: "Não foi possível processar a solicitação" }, { status: 500 });
    }
}
