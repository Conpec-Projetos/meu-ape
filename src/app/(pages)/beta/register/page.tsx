"use client"

import Image from "next/image";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function RegisterPage() {
  return (
    <div
      className="w-full h-screen bg-cover bg-center bg-register-background"
    >
      <div className="flex items-center justify-center h-full bg-black bg-opacity-50">
        <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md">
          <div className="flex justify-center">
            <Image src="/logo.png" alt="MeuApê Logo" width={150} height={150} />
          </div>
          <h2 className="text-2xl font-bold text-center text-gray-800">
            Cadastro - Cliente
          </h2>
          <form className="space-y-4">
            <div>
              <Label htmlFor="fullName">Nome Completo</Label>
              <Input id="fullName" type="text" placeholder="John Doe" required />
            </div>
            <div>
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                placeholder="john.doe@example.com"
                required
              />
            </div>
            <div>
              <Label htmlFor="phone">Telefone</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="(00) 00000-0000"
                required
              />
            </div>
            <div>
              <Label htmlFor="cpf">CPF</Label>
              <Input id="cpf" type="text" placeholder="000.000.000-00" required />
            </div>
            <div>
              <Label htmlFor="birthDate">Data de Nascimento</Label>
              <Input id="birthDate" type="date" required />
            </div>
            <Button type="submit" className="w-full">
              Cadastrar
            </Button>
          </form>
          <p className="text-sm text-center text-gray-600">
            Já possui uma conta?{" "}
            <Link href="/beta/login" className="text-blue-600 hover:underline">
              Faça o login aqui
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}