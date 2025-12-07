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
import { ResetPasswordData, resetPasswordSchema } from "@/schemas/resetPasswordSchema";
import { notifyError, notifySuccess } from "@/services/notificationService";
import { zodResolver } from "@hookform/resolvers/zod";
import { sendPasswordResetEmail } from "firebase/auth";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";

const SUCCESS_MESSAGE = "Se houver uma conta associada a este email, um link de recuperação foi enviado.";

export default function ResetPasswordPage() {
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const form = useForm<ResetPasswordData>({
        resolver: zodResolver(resetPasswordSchema),
        defaultValues: {
            email: "",
        },
    });

    async function onSubmit(values: ResetPasswordData) {
        setIsSubmitting(true);
        try {
            await sendPasswordResetEmail(auth, values.email);
            notifySuccess(SUCCESS_MESSAGE);
            setTimeout(() => router.push("/login"), 3000);
        } catch (error) {
            console.error("Erro ao enviar link de recuperação:", error);
            notifyError("Não foi possível enviar o link de recuperação. Tente novamente.");
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <div className="relative flex min-h-screen flex-col items-center justify-center bg-background px-4">
            <div className="absolute inset-0 z-0">
                <Image src="/register/background.png" alt="Background" layout="fill" objectFit="cover" />
            </div>
            <div className="relative z-10 w-full max-w-md p-4">
                <Card className="bg-card/90 dark:bg-black/80 backdrop-blur-sm py-6">
                    <CardHeader className="text-center">
                        <CardTitle className="text-2xl">Redefinir senha</CardTitle>
                        <CardDescription>
                            Informe o email cadastrado para receber um link de redefinição.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                                <FormField
                                    control={form.control}
                                    name="email"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Email</FormLabel>
                                            <FormControl>
                                                <Input placeholder="endereco@dominio.com" type="email" {...field} />
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
                                    {isSubmitting ? "Enviando..." : "Enviar link de recuperação"}
                                </Button>
                            </form>
                        </Form>
                        <p className="mt-4 text-center text-sm text-muted-foreground">
                            Lembrou a senha?{" "}
                            <Link href="/login" className="text-primary underline">
                                Voltar para o login
                            </Link>
                        </p>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
