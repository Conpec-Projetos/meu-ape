"use client";

import { Button } from "@/components/features/buttons/default-button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/features/cards/default-card";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/features/forms/default-form";
import { Input } from "@/components/features/inputs/default-input";
import { auth } from "@/firebase/firebase-config";
import { PasswordResetConfirmData, passwordResetConfirmSchema } from "@/schemas/passwordResetConfirmSchema";
import { notifyError, notifySuccess } from "@/services/notificationService";
import { zodResolver } from "@hookform/resolvers/zod";
import { FirebaseError } from "firebase/app";
import { confirmPasswordReset, verifyPasswordResetCode } from "firebase/auth";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";

const SUCCESS_MESSAGE = "Senha atualizada com sucesso! Redirecionando para o login.";
const INVALID_LINK_MESSAGE = "Este link de redefinição é inválido ou expirou.";

type VerificationState = "checking" | "invalid" | "ready";

export default function AuthActionPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const modeParam = searchParams.get("mode");
    const codeParam = searchParams.get("oobCode");

    const [verificationState, setVerificationState] = useState<VerificationState>("checking");
    const [verificationError, setVerificationError] = useState<string | null>(null);
    const [oobCode, setOobCode] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const form = useForm<PasswordResetConfirmData>({
        resolver: zodResolver(passwordResetConfirmSchema),
        defaultValues: {
            password: "",
            confirmPassword: "",
        },
    });

    useEffect(() => {
        if (modeParam !== "resetPassword" || !codeParam) {
            setVerificationState("invalid");
            setVerificationError(INVALID_LINK_MESSAGE);
            return;
        }

        setVerificationState("checking");
        verifyPasswordResetCode(auth, codeParam)
            .then(() => {
                setOobCode(codeParam);
                setVerificationState("ready");
                setVerificationError(null);
            })
            .catch(error => {
                console.error("Erro ao verificar token de redefinição:", error);
                setVerificationState("invalid");
                setVerificationError(INVALID_LINK_MESSAGE);
            });
    }, [modeParam, codeParam]);

    async function onSubmit(values: PasswordResetConfirmData) {
        if (!oobCode) {
            notifyError("Código de redefinição indisponível. Solicite um novo link.");
            return;
        }

        setIsSubmitting(true);
        try {
            await confirmPasswordReset(auth, oobCode, values.password);
            notifySuccess(SUCCESS_MESSAGE);
            setTimeout(() => router.push("/login"), 2500);
        } catch (error) {
            console.error("Erro ao confirmar redefinição de senha:", error);
            if (error instanceof FirebaseError) {
                if (error.code === "auth/expired-action-code" || error.code === "auth/invalid-action-code") {
                    setVerificationState("invalid");
                    setVerificationError(INVALID_LINK_MESSAGE);
                }
                notifyError("Não foi possível redefinir a senha. Tente novamente.");
            } else {
                notifyError("Erro inesperado ao redefinir a senha.");
            }
        } finally {
            setIsSubmitting(false);
        }
    }

    const renderContent = () => {
        if (verificationState === "checking") {
            return <div className="text-center text-sm text-muted-foreground">Validando link de redefinição...</div>;
        }

        if (verificationState === "invalid") {
            return (
                <div className="space-y-4 text-center">
                    <p className="text-sm text-muted-foreground">{verificationError ?? INVALID_LINK_MESSAGE}</p>
                    <div>
                        <Link href="/forgot-password" className="text-primary underline">
                            Solicitar novo link
                        </Link>
                    </div>
                </div>
            );
        }

        return (
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                        control={form.control}
                        name="password"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Nova senha</FormLabel>
                                <FormControl>
                                    <Input type="password" placeholder="********" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="confirmPassword"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Confirmar nova senha</FormLabel>
                                <FormControl>
                                    <Input type="password" placeholder="********" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <Button
                        type="submit"
                        className="w-full bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer"
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? "Atualizando..." : "Atualizar senha"}
                    </Button>
                </form>
            </Form>
        );
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-background px-4">
            <div className="w-full max-w-md">
                <Card className="bg-card/95">
                    <CardHeader className="text-center">
                        <CardTitle className="text-2xl">Redefinir senha</CardTitle>
                        <CardDescription>Escolha uma nova senha para continuar acessando o Meu Apê.</CardDescription>
                    </CardHeader>
                    <CardContent>{renderContent()}</CardContent>
                </Card>
            </div>
        </div>
    );
}
