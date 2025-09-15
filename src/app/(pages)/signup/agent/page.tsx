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
import { FileCheck, FileText } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRef, useState } from "react";

interface agentRegistrationRequest {
  requesterId: string;
  status: "pending" | "approved" | "denied";
  submittedAt: Date;
  resolvedAt?: Date;
  resolvedBy?: string; // ID do administrador que resolveu a solicitação
  applicantData: {
    email: string;
    fullName: string;
    cpf: string;
    rg: string;
    address: string;
    city: string;
    creci: string;
    creciCardPhoto: string[];
    creciCert: string[];
  }
  adminMsg?: string; // Mensagem opcional do administrador ao resolver a solicitação

}



export default function RegisterPage() {
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false);

  const [formData, setFormData] = useState({
    email: "",
    fullName: "",
    cpf: "",
    rg: "",
    address: "",
    city: "",
    creci: "",
    creciCardPhoto: null as File | null,
    creciCert: null as File | null,
  });

  const fileRefs = {
    creciCardPhoto: useRef<HTMLInputElement>(null),
    creciCert: useRef<HTMLInputElement>(null),
  };


  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>, type: 'creciCardPhoto' | 'creciCert') {
    const file = event.target.files?.[0] || null;
    if (file) {
      setFormData({ ...formData, [type]: file });
      console.log(`Arquivo selecionado ${type}:`, file);
    }
  }

  function handleFileButtonClick(type: 'creciCardPhoto' | 'creciCert') {
    fileRefs[type].current?.click();
  }

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-gray-100 dark:bg-gray-900">
      <div className="absolute inset-0 z-0">
        <Image
          src="/register/background.png"
          alt="Background"
          layout="fill"
          objectFit="cover"
        />
      </div>
      <div className="relative z-10 w-full max-w-4xl p-4">
        <Card className="bg-white/90 dark:bg-black/80 backdrop-blur-sm">
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
            <form className="grid grid-cols-1 md:grid-cols-2 gap-4" onSubmit={(e) => {
                  e.preventDefault(); // <- ISSO impede o refresh
                  console.log(formData);
                }}>
              <div className="space-y-2">
                <Label htmlFor="name">Nome completo</Label>
                <Input id="name" placeholder="Ex: Peter Parker" value={formData.fullName} onChange={(e) => setFormData({ ...formData, fullName: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="rg">RG</Label>
                <Input id="rg" placeholder="12.345.678-9" value={formData.rg} onChange={(e) => setFormData({ ...formData, rg: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Endereço</Label>
                <Input id="address" placeholder="Rua, Nº" value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cpf">CPF</Label>
                <Input id="cpf" placeholder="XXX.XXX.XXX-XX" value={formData.cpf} onChange={(e) => setFormData({ ...formData, cpf: e.target.value })} />
              </div>
              <div className="col-span-1 md:col-span-2 space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="endereço@domínio"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
              <div className="relative space-y-2">
                <Label htmlFor="city">Cidade de Atuação</Label>
                <Input
                  id="city"
                  placeholder="Ex: São Paulo"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                />
              </div>
              <div className="relative space-y-2">
                <Label htmlFor="creci">CRECI</Label>
                <Input
                  id="creci"
                  placeholder="Ex: 12345-J"
                  value={formData.creci}
                  onChange={(e) => setFormData({ ...formData, creci: e.target.value })}
                />
              </div>

              <div className="col-span-1 md:col-span-2 mt-4">
                <Label className="text-lg">Documentos</Label>
                <div className="flex flex-row gap-10 justify-center">

                  <div className="w-min">
                    <div className="flex flex-col items-center space-y-2 border rounded-lg p-4 border-dashed w-min cursor-pointer" onClick={() => handleFileButtonClick('creciCardPhoto')}>
                      {formData.creciCardPhoto ? (
                        <FileCheck className="text-green-600" width={40} height={40} />
                      ) : (
                        <FileText className="text-gray-500" width={40} height={40} />
                      )}
                      
                      <span className="text-center text-sm">
                        Carteirinha do CRECI
                      </span>
                    </div>
                    <Input ref={fileRefs.creciCardPhoto} type="file" onChange={(e) => handleFileChange(e, 'creciCardPhoto')} accept="image/*,.pdf" className="hidden" />
                  </div>
                  
                  <div className="w-min">
                    <div className="flex flex-col items-center space-y-2 border rounded-lg p-4 border-dashed w-min cursor-pointer" onClick={() => handleFileButtonClick('creciCert')}>
                      {formData.creciCert ? (
                        <FileCheck className="text-green-600" width={40} height={40} />
                      ) : (
                        <FileText className="text-gray-500" width={40} height={40} />
                      )}
                      <span className="text-center text-sm">
                        Certidão de regularidade do CRECI
                      </span>
                    </div>
                    <Input ref={fileRefs.creciCert} type="file" onChange={(e) => handleFileChange(e, 'creciCert')} accept="image/*,.pdf" className="hidden" />
                  </div>
                  
                </div>
              </div>

              <div className="col-span-1 md:col-span-2 mt-6">
                <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer">
                  Solicitar cadastro
                </Button>
              </div>
            </form>
            <div className="mt-4 text-center text-sm">
              Já possui uma conta?{" "}
              <Link href="/login" className="underline text-indigo-600">
                Entrar
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
