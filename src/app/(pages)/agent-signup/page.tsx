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
import { Eye, EyeOff, FileCheck, FileText, FileWarning } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRef, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod"
import { resolve } from "path";

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
    phone: string;
    creciCardPhoto: string[];
    creciCert: string[];
  }
  adminMsg?: string; // Mensagem opcional do administrador ao resolver a solicitação

}



export default function RegisterPage() {
  // States para visibilidade das senhas
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false);

  // States para icone de arquivos
  const [creciCardPhotoSelected, setCreciCardPhotoSelected] = useState(false);
  const [creciCertSelected, setCreciCertSelected] = useState(false);

  // Validação do formulário com Zod
  const agentSchema = z.object({
    email: z.string()
            .nonempty("Email é obrigatório")
            .email("Email inválido"),
    fullName: z.string()
                .min(2, "Nome muito curto")
                .nonempty("Nome completo é obrigatório"),
    cpf: z.string()
          .nonempty("CPF é obrigatório")
          .min(11, "CPF muito curto")
          .max(14, "CPF muito longo")
          .regex(/^\d{3}\.?\d{3}\.?\d{3}-?\d{2}$/, "CPF deve conter apenas números e pontos/hífens opcionais"),
    rg: z.string()
          .nonempty("RG é obrigatório")
          .min(7, "RG muito curto")
          .max(12, "RG muito longo")
          .regex(/^\d{1,2}\.?\d{3}\.?\d{3}-?[0-9Xx]$/, "RG deve conter apenas números e pontos/hífens opcionais"),
    address: z.string()
              .nonempty("Endereço é obrigatório")
              .min(5, "Endereço muito curto"),
    city: z.string()
            .nonempty("Cidade é obrigatória")
            .min(2, "Cidade muito curta"),
    creci: z.string()
            .nonempty("CRECI é obrigatório")
            .regex(/^\d{3,5}-?[A-Za-z]$/, "CRECI inválido"),
    creciCardPhoto: z.any()
                      .refine((files) => (files instanceof FileList || Array.isArray(files)) && files.length === 1, {
                        message: "Carteirinha do CRECI obrigatória",
                      })
                      .refine((files) => files[0]?.size > 0, {
                        message: "Arquivo inválido",
                      }),
    creciCert: z.any()
                .refine((files) => (files instanceof FileList || Array.isArray(files)) && files.length === 1, {
                  message: "Certidão de regularidade do CRECI obrigatória",
                })
                .refine((files) => files[0]?.size > 0, {
                  message: "Arquivo inválido",
                }),
    password: z.string()
                .nonempty("Senha é obrigatória")
                .min(8, "Senha deve ter no mínimo 8 caracteres"),
    confirmPassword: z.string()
                .nonempty("Confirmação de senha é obrigatória")
                .min(8, "Confirmação de senha deve ter no mínimo 8 caracteres"),
    phone: z.string()
            .nonempty("Telefone é obrigatório")
            .min(10, "Telefone muito curto")
            .max(15, "Telefone muito longo")
            .regex(/^\(?\d{2}\)?\s?\d{4,5}-?\d{4}$/, "Telefone deve conter apenas números e o formato (XX) XXXXX-XXXX"),

  }).refine((data) => data.password === data.confirmPassword, {
    message: "As senhas não coincidem",
    path: ["confirmPassword"],
  });

  type AgentFormData = z.infer<typeof agentSchema>;
  const {register, handleSubmit, setValue, control, watch, formState: { errors }} = useForm<AgentFormData>( { 
    mode: "onSubmit",       // validação ao enviar
    reValidateMode: "onSubmit", // revalida apenas ao enviar
    resolver: zodResolver(agentSchema)
  });


  // Função de submissão do formulário
  const onSubmit = (data:any) => {
    console.log(data)
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
            <form className="grid grid-cols-1 md:grid-cols-2 gap-4" onSubmit={handleSubmit(onSubmit)}>
              <div className="space-y-2">
                <Label htmlFor="name">Nome completo</Label>
                <Input id="name" placeholder="Ex: Peter Parker" {...register("fullName")} />
                {errors.fullName && <span className="text-sm text-red-600">*{errors.fullName.message}</span>}
              </div>
              <div className="relative space-y-2">
                <Label htmlFor="creci">CRECI</Label>
                <Input
                  id="creci"
                  placeholder="Ex: 12345-J"
                  {...register("creci")}
                />
                {errors.creci && <span className="text-sm text-red-600">*{errors.creci.message}</span>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="cpf">CPF</Label>
                <Input id="cpf" placeholder="XXX.XXX.XXX-XX" {...register("cpf")} />
                {errors.cpf && <span className="text-sm text-red-600">*{errors.cpf.message}</span>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="rg">RG</Label>
                <Input id="rg" placeholder="12.345.678-9" {...register("rg")} />
                {errors.rg && <span className="text-sm text-red-600">*{errors.rg.message}</span>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="endereço@domínio"
                  {...register("email")}
                />
                {errors.email && <span className="text-sm text-red-600">*{errors.email.message}</span>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Telefone</Label>
                <Input id="phone" placeholder="(DD) X XXXXX-XXXX" {...register("phone")} />
                {errors.phone && <span className="text-sm text-red-600">*{errors.phone.message}</span>}
              </div>

              <div className="relative space-y-2">
                <Label htmlFor="password">Senha</Label>
                <Input
                  id="password"
                  type={passwordVisible ? "text" : "password"}
                  placeholder="******"
                  {...register("password")}
                />
                {errors.password && <span className="text-sm text-red-600">*{errors.password.message}</span>}
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500"
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
                  {...register("confirmPassword")}
                />
                {errors.confirmPassword && <span className="text-sm text-red-600">*{errors.confirmPassword.message}</span>}
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500"
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

              <div className="space-y-2">
                <Label htmlFor="address">Endereço</Label>
                <Input id="address" placeholder="Rua, Nº" {...register("address")} />
                {errors.address && <span className="text-sm text-red-600">*{errors.address.message}</span>}
              </div>
              <div className="relative space-y-2">
                <Label htmlFor="city">Cidade de Atuação</Label>
                <Input
                  id="city"
                  placeholder="Ex: São Paulo"
                  {...register("city")}
                />
                {errors.city && <span className="text-sm text-red-600">*{errors.city.message}</span>}
              </div>
              

              <div className="col-span-1 md:col-span-2 mt-4">
                <Label className="text-lg">Documentos</Label>
                {(errors.creciCardPhoto || errors.creciCert) && <span className="text-sm text-red-600">*Documento obrigatório</span>}
                <div className="flex flex-row gap-10 justify-center">
                  <Label
                    htmlFor="creciCardPhoto"
                    className={`flex flex-col flex-1 items-center justify-between space-y-2 border rounded-lg p-4 border-dashed max-w-36 cursor-pointer
                      ${creciCardPhotoSelected ? "border-green-600" : errors.creciCardPhoto ? "border-red-600" : "border-gray-300"}
                    `}
                  >
                    <div className="flex flex-col items-center space-y-2">
                      {creciCardPhotoSelected ? (
                        <FileCheck className="text-green-600" width={40} height={40} />
                      ) : errors.creciCardPhoto ? (
                        <FileWarning className="text-red-600" width={40} height={40} />
                      ) : (
                        <FileText className="text-gray-500" width={40} height={40} />
                      )}
                      
                      <span className="text-center text-sm">Carteirinha do CRECI</span>
                    </div>
                    
                    <span className="text-center text-sm"> {(watch("creciCardPhoto")?.[0]?.name)} </span>
                  </Label>

                  <Input
                    type="file"
                    id="creciCardPhoto"
                    accept="image/*,.pdf"
                    {...register("creciCardPhoto", {
                      onChange: (e) => {
                        const file = e.target.files?.[0];
                        setCreciCardPhotoSelected(!!file);
                        // Important: setValue to keep RHF in sync and trigger validation
                        setValue("creciCardPhoto", e.target.files, { shouldValidate: true });
                      },
                    })}
                    className="hidden"
                  />

                  
                  <Label
                    htmlFor="creciCert"
                    className={`flex flex-col flex-1 items-center justify-between space-y-2 border rounded-lg p-4 border-dashed max-w-36 cursor-pointer
                      ${creciCertSelected ? "border-green-600" : errors.creciCert ? "border-red-600" : "border-gray-300"}
                    `}
                  >
                    <div className="flex flex-col items-center space-y-2">
                      {creciCertSelected ? (
                        <FileCheck className="text-green-600" width={40} height={40} />
                      ) : errors.creciCert ? (
                        <FileWarning className="text-red-600" width={40} height={40} />
                      ) : (
                        <FileText className="text-gray-500" width={40} height={40} />
                      )}
                      
                      <span className="text-center text-sm">Certidão de regularidade do CRECI</span>
                    </div>
                    
                    <span className="text-center text-sm"> {(watch("creciCert")?.[0]?.name)} </span>

                  </Label>

                  <Input
                    type="file"
                    id="creciCert"
                    accept="image/*,.pdf"
                    {...register("creciCert", {
                      onChange: (e) => {
                        const file = e.target.files?.[0];
                        setCreciCertSelected(!!file);
                        // Important: setValue to keep RHF in sync and trigger validation
                        setValue("creciCert", e.target.files, { shouldValidate: true });
                      },
                    })}
                    className="hidden"
                  />
                  
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
