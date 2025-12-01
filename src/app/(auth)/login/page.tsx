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
import { LoginData, loginSchema } from "@/schemas/loginSchema";
import { notifyError, notifySuccess } from "@/services/notificationService";
import { zodResolver } from "@hookform/resolvers/zod";
import { signInWithEmailAndPassword } from "firebase/auth";
import { Eye, EyeOff } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";

export default function LoginPage() {
    const [passwordVisible, setPasswordVisible] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const form = useForm<LoginData>({
        resolver: zodResolver(loginSchema),
        defaultValues: {
            email: "",
            password: "",
        },
    });

    async function onSubmit(values: LoginData) {
        setIsLoading(true);
        try {
            const userCredential = await signInWithEmailAndPassword(auth, values.email, values.password);
            const idToken = await userCredential.user.getIdToken();

            const response = await fetch("/api/auth/login", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ idToken }),
            });

            if (response.ok) {
                notifySuccess("Login bem-sucedido! Redirecionando...");
                setTimeout(() => {
                    window.location.assign("/");
                }, 3000);
            } else {
                const errorData = await response.json();
                notifyError(errorData.error || "Credenciais inválidas");
            }
        } catch (error) {
            console.error("Erro durante o login:", error);
            notifyError("Credenciais inválidas");
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
                        <CardTitle className="text-2xl">Acessar minha conta</CardTitle>
                        <CardDescription>Bem-vindo de volta! Faça login para continuar.</CardDescription>
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
                                <div className="text-right text-sm">
                                    <Link href="/forgot-password" className="underline text-primary">
                                        Esqueceu sua senha?
                                    </Link>
                                </div>
                                <Button
                                    type="submit"
                                    className="w-full bg-primary hover:bg-primary/90 text-primary-foreground cursor-pointer"
                                    disabled={isLoading}
                                >
                                    {isLoading ? "Carregando..." : "Entrar"}
                                </Button>
                            </form>
                        </Form>
                        <div className="mt-4 text-center text-sm">
                            Não possui uma conta?{" "}
                            <Link href="/signup" className="underline text-primary">
                                Cadastre-se
                            </Link>
                            <div className="mt-2">
                                Corretor?{" "}
                                <Link href="/agent-signup" className="underline text-primary">
                                    Faça seu cadastro
                                </Link>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
