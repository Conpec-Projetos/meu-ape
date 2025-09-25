'use client'
import Image from "next/image"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import {  Card, CardContent, CardFooter } from "@components/ui/card"


export default function Login() {

    return (
        
        <div className="relative flex min-h-screen flex-col items-center justify-center bg-background">
            <div className="absolute inset-0 z-0">
                <Image
                    src="/assets/background.png"
                    alt="Background"
                    layout="fill"
                    objectFit="cover"
                />

            </div>
            <div className="relative w-full max-w-4xl p-20">

                <div className="relative z-10 text-center pb-20">
                    <h2 className="text-8xl font-thin tracking-[0.3em] text-foreground">meu apê</h2>
                </div>

                <Card className="bg-card/70 dark:bg-black/30 backdrop-blur-md rounded-2xl border shadow-lg">

                    <CardContent>
                        <form>
                            <div className="flex flex-col gap-8">
                                <div className="grid gap-2">
                                    <Label className="text-xl font-normal" htmlFor="email">E-mail</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        className="bg-background rounded-lg border h-12" 
                                        placeholder="Seu e-mail"
                                        required
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <div className="items-center grid gap-2">
                                        <Label className="text-xl font-normal" htmlFor="password">Senha</Label>
                                        <Input id="password" type="password" className="bg-background rounded-lg border h-12" placeholder="Sua senha" required />
                                        <a
                                            href="#"
                                            className="text-sm font-semibold text-primary hover:underline px-2"
                                        >
                                            Esqueceu a senha?
                                        </a>

                                    </div>
                                </div>

                            </div>
                        </form>

                    </CardContent>
                    <CardFooter className="flex-col gap-2">
                        <Button type="submit" className="bg-primary w-1/3 h-12 text-2xl">
                            Entrar
                        </Button>
                        <div className="flex justify-between gap-2 pt-8">
                            <div>Ainda não possui conta?</div>
                            <button className="font-bold text-primary hover:underline ">Cadastre-se</button>
                        </div>
                        

                    </CardFooter>
                </Card>
            </div>
        </div>
    )

}