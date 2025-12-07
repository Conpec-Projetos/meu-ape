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
import { signupSchema } from "@/schemas/signupSchema";
import { notifyError, notifySuccess } from "@/services/notificationService";
import { zodResolver } from "@hookform/resolvers/zod";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { Eye, EyeOff } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";

export default function RegisterPage() {
    const [passwordVisible, setPasswordVisible] = useState(false);
    const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const searchParams = useSearchParams();
    const redirectParam = searchParams.get("redirect");
    const safeRedirect = useMemo(() => {
        if (!redirectParam) return "/";
        if (!redirectParam.startsWith("/") || redirectParam.startsWith("//")) return "/";
        return redirectParam;
    }, [redirectParam]);
    const buildRedirectLink = (href: string) =>
        redirectParam ? `${href}?redirect=${encodeURIComponent(redirectParam)}` : href;

    const form = useForm<z.infer<typeof signupSchema>>({
        resolver: zodResolver(signupSchema),
        defaultValues: {
            fullName: "",
            email: "",
            password: "",
            confirmPassword: "",
        },
    });

    async function onSubmit(values: z.infer<typeof signupSchema>) {
        setIsLoading(true);
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, values.email, values.password);
            const idToken = await userCredential.user.getIdToken();

            const profileResponse = await fetch("/api/user/profile", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${idToken}`,
                },
                body: JSON.stringify({
                    fullName: values.fullName,
                    role: "client",
                    status: "approved",
                }),
            });

            if (!profileResponse.ok) {
                const errorData = await profileResponse.json().catch(() => ({ error: "Erro ao salvar usuário" }));
                throw new Error(errorData.error || "Não foi possível salvar o usuário.");
            }

            const loginResponse = await fetch("/api/auth/login", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ idToken }),
            });

            if (!loginResponse.ok) {
                const errorData = await loginResponse.json().catch(() => ({ error: "Erro ao iniciar sessão" }));
                throw new Error(errorData.error || "Falha ao iniciar sessão.");
            }

            notifySuccess("Conta criada com sucesso! Redirecionando...");
            setTimeout(() => {
                window.location.assign(safeRedirect);
            }, 2000);
        } catch (error) {
            const message = error instanceof Error ? error.message : "Ocorreu um erro desconhecido.";
            notifyError(message);
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <div className="relative flex min-h-screen flex-col items-center justify-center bg-background">
            <div className="absolute inset-0 z-0">
                <Image src="/register/background.png" alt="Background" layout="fill" objectFit="cover" />
            </div>
            <div className="relative z-10 w-full max-w-md p-4">
                <Card className="bg-card/90 dark:bg-black/80 backdrop-blur-sm">
                    <CardHeader className="text-center">
                        <div className="flex justify-center mb-4">
                            <Image src="/logo.png" alt="Logo" width={150} height={50} />
                        </div>
                        <CardTitle className="text-2xl">Criar uma nova conta</CardTitle>
                        <CardDescription>Preencha os campos abaixo para criar sua conta</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                                <FormField
                                    control={form.control}
                                    name="fullName"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Nome completo</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Ex: Peter Parker" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="email"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Email</FormLabel>
                                            <FormControl>
                                                <Input placeholder="endereço@domínio" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="password"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Senha</FormLabel>
                                            <FormControl>
                                                <div className="relative">
                                                    <Input
                                                        type={passwordVisible ? "text" : "password"}
                                                        placeholder="******"
                                                        {...field}
                                                    />
                                                    <button
                                                        type="button"
                                                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-muted-foreground"
                                                        onClick={() => setPasswordVisible(!passwordVisible)}
                                                    >
                                                        {passwordVisible ? (
                                                            <EyeOff className="h-5 w-5" />
                                                        ) : (
                                                            <Eye className="h-5 w-5" />
                                                        )}
                                                    </button>
                                                </div>
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
                                            <FormLabel>Confirmar senha</FormLabel>
                                            <FormControl>
                                                <div className="relative">
                                                    <Input
                                                        type={confirmPasswordVisible ? "text" : "password"}
                                                        placeholder="******"
                                                        {...field}
                                                    />
                                                    <button
                                                        type="button"
                                                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-muted-foreground"
                                                        onClick={() =>
                                                            setConfirmPasswordVisible(!confirmPasswordVisible)
                                                        }
                                                    >
                                                        {confirmPasswordVisible ? (
                                                            <EyeOff className="h-5 w-5" />
                                                        ) : (
                                                            <Eye className="h-5 w-5" />
                                                        )}
                                                    </button>
                                                </div>
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <Button
                                    type="submit"
                                    className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                                    disabled={isLoading}
                                >
                                    {isLoading ? "Carregando..." : "Cadastrar"}
                                </Button>
                            </form>
                        </Form>
                        <div className="mt-4 text-center text-sm">
                            Já possui uma conta?{" "}
                            <Link href={buildRedirectLink("/login")} className="underline text-primary">
                                Entrar
                            </Link>
                            <div className="mt-2">
                                É corretor?{" "}
                                <Link href="/agent-signup" className="underline text-primary">
                                    Cadastre-se aqui
                                </Link>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
