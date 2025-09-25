"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

export default function RegisterPage() {
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false);

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-background">
      <div className="absolute inset-0 z-0">
        <Image
          src="/register/background.png"
          alt="Background"
          layout="fill"
          objectFit="cover"
        />
      </div>
      <div className="relative z-10 w-full max-w-4xl p-4">
        <Card className="bg-card/90 dark:bg-black/80 backdrop-blur-sm">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <Image src="/logo.png" alt="Logo" width={150} height={50} />
            </div>
            <CardTitle className="text-2xl">Criar uma nova conta</CardTitle>
            <CardDescription>
              Preencha os campos abaixo para criar sua conta
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome completo</Label>
                <Input id="name" placeholder="Ex: Peter Parker" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Telefone</Label>
                <Input id="phone" placeholder="(DD) X XXXXX-XXXX" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Endereço</Label>
                <Input id="address" placeholder="Rua, Nº" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cpf">CPF</Label>
                <Input id="cpf" placeholder="XXX.XXX.XXX-XX" />
              </div>
              <div className="col-span-1 md:col-span-2 space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="endereço@domínio"
                />
              </div>
              <div className="relative space-y-2">
                <Label htmlFor="password">Senha</Label>
                <Input
                  id="password"
                  type={passwordVisible ? "text" : "password"}
                  placeholder="******"
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
              <div className="relative space-y-2">
                <Label htmlFor="confirm-password">Confirmar senha</Label>
                <Input
                  id="confirm-password"
                  type={confirmPasswordVisible ? "text" : "password"}
                  placeholder="******"
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

              <div className="col-span-1 md:col-span-2 mt-4">
                <Label className="text-lg">Documentos</Label>
                <p className="text-sm text-muted-foreground mb-4">
                  Obs: Os documentos podem ser enviados posteriormente na aba da
                  conta do site
                </p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="flex flex-col items-center space-y-2 border rounded-lg p-4 border-dashed">
                    <Image src="/file.svg" alt="Upload" width={40} height={40} />
                    <span className="text-center text-sm">
                      Comprovante de Endereço
                    </span>
                  </div>
                  <div className="flex flex-col items-center space-y-2 border rounded-lg p-4 border-dashed">
                    <Image src="/file.svg" alt="Upload" width={40} height={40} />
                    <span className="text-center text-sm">
                      Comprovante de renda
                    </span>
                  </div>
                  <div className="flex flex-col items-center space-y-2 border rounded-lg p-4 border-dashed">
                    <Image src="/file.svg" alt="Upload" width={40} height={40} />
                    <span className="text-center text-sm">RG ou CIN</span>
                  </div>
                  <div className="flex flex-col items-center space-y-2 border rounded-lg p-4 border-dashed">
                    <Image src="/file.svg" alt="Upload" width={40} height={40} />
                    <span className="text-center text-sm">
                      Certidão de casamento
                    </span>
                  </div>
                </div>
              </div>

              <div className="col-span-1 md:col-span-2 mt-6">
                <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
                  Cadastrar
                </Button>
              </div>
            </form>
            <div className="mt-4 text-center text-sm">
              Já possui uma conta?{" "}
              <Link href="/login" className="underline text-primary">
                Entrar
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
