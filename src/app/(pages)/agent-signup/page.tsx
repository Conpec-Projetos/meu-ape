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
import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod"
import { agentSchema, AgentFormData } from "@/interfaces/agentRegistrationRequest";
import { createAgentRegistrationRequest } from "@/firebase/agentRegistrationRequest/service";
import { useRouter } from "next/navigation";


export default function RegisterPage() {
  const router = useRouter();

  // States para visibilidade das senhas
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false);

  // States para icone de arquivos
  const [creciCardPhotoSelected, setCreciCardPhotoSelected] = useState(false);
  const [creciCertSelected, setCreciCertSelected] = useState(false);

  // Status do upload
  const [isUploading, setIsUploading] = useState(false);

  // Status erro do firebase
  const [firebaseError, setFirebaseError] = useState<{message: string, path: string} | null>(null);

  
  const {register, handleSubmit, setValue, watch, formState: { errors }} = useForm<AgentFormData>( { 
    mode: "onSubmit",       // validação ao enviar
    reValidateMode: "onSubmit", // revalida apenas ao enviar
    resolver: zodResolver(agentSchema)
  });


  // Função de submissão do formulário
  const onSubmit = (data:AgentFormData) => {
    console.log(data)
    setFirebaseError(null);
    setIsUploading(true);
    createAgentRegistrationRequest(data)
      .then(() => {
        router.push('/agent-signup/accepted');
      })
      .catch((err) => {
        console.error(err);

        if(typeof err === "object" &&
            err !== null &&
            "message" in err &&
            "path" in err
        ) {
            setFirebaseError(err);
        } else {
            alert("Erro ao enviar solicitação. Tente novamente.");
        }
      })
      .finally(() => {
        setIsUploading(false);
      });
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
                <Input
                  id="name" 
                  placeholder="Ex: Peter Parker" 
                  {...register("fullName")}
                  disabled={isUploading}
                />
                {errors.fullName && <span className="text-sm text-red-600">*{errors.fullName.message}</span>}
              </div>
              <div className="relative space-y-2">
                <Label htmlFor="creci">CRECI</Label>
                <Input
                  id="creci"
                  placeholder="Ex: CRECI UF-123456-F"
                  {...register("creci")}
                  disabled={isUploading}
                />
                {errors.creci && <span className="text-sm text-red-600">*{errors.creci.message}</span>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="cpf">CPF</Label>
                <Input id="cpf" placeholder="XXX.XXX.XXX-XX" {...register("cpf")} disabled={isUploading} />
                {errors.cpf && <span className="text-sm text-red-600">*{errors.cpf.message}</span>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="rg">RG</Label>
                <Input id="rg" placeholder="12.345.678-9" {...register("rg")} disabled={isUploading} />
                {errors.rg && <span className="text-sm text-red-600">*{errors.rg.message}</span>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="endereço@domínio"
                  {...register("email")}
                  disabled={isUploading}
                />
                {errors.email && <span className="text-sm text-red-600">*{errors.email.message}</span>}
                {firebaseError?.path === "email" && <span className="text-sm text-red-600">*{firebaseError.message}</span>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Telefone</Label>
                <Input id="phone" placeholder="(DD) X XXXXX-XXXX" {...register("phone")} disabled={isUploading} />
                {errors.phone && <span className="text-sm text-red-600">*{errors.phone.message}</span>}
              </div>

              <div className="relative space-y-2">
                <Label htmlFor="password">Senha</Label>
                <Input
                  id="password"
                  type={passwordVisible ? "text" : "password"}
                  placeholder="******"
                  {...register("password")}
                  disabled={isUploading}
                />
                {errors.password && <span className="text-sm text-red-600">*{errors.password.message}</span>}
                {firebaseError?.path === "password" && <span className="text-sm text-red-600">*{firebaseError.message}</span>}
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
                  disabled={isUploading}
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
                <Input id="address" placeholder="Rua, Nº" {...register("address")} disabled={isUploading} />
                {errors.address && <span className="text-sm text-red-600">*{errors.address.message}</span>}
              </div>
              <div className="relative space-y-2">
                <Label htmlFor="city">Cidade de Atuação</Label>
                <Input
                  id="city"
                  placeholder="Ex: São Paulo"
                  {...register("city")}
                  disabled={isUploading}
                />
                {errors.city && <span className="text-sm text-red-600">*{errors.city.message}</span>}
              </div>
              

              <div className="col-span-1 md:col-span-2 mt-4">
                <Label className="text-lg">Documentos</Label>
                {(errors.creciCardPhoto || errors.creciCert) && <span className="text-sm text-red-600">*Documento obrigatório</span>}
                <div className="flex flex-row gap-10 justify-center">
                  <Label
                    htmlFor="creciCardPhoto"
                    className={`flex flex-col flex-1 items-center justify-between space-y-2 border rounded-lg p-4 border-dashed max-w-36 ${isUploading ? "cursor-not-allowed" : "cursor-pointer"}
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
                    <div className="flex flex-col items-center space-y-1">
                      {watch("creciCardPhoto")?.[0] && (
                        Array.from(watch("creciCardPhoto") as FileList).map((file: File) => 
                          <span key={file.name} className="text-center text-sm">{file.name}</span>
                        )
                      )}
                    </div>
                    
                  </Label>

                  <Input
                    type="file"
                    multiple
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
                    disabled={isUploading}
                  />

                  
                  <Label
                    htmlFor="creciCert"
                    className={`flex flex-col flex-1 items-center justify-between space-y-2 border rounded-lg p-4 border-dashed max-w-36 ${isUploading ? "cursor-not-allowed" : "cursor-pointer"}
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
                    <div className="flex flex-col items-center space-y-1">
                      {watch("creciCert")?.[0] && (
                        Array.from(watch("creciCert") as FileList).map((file: File) => 
                          <span key={file.name} className="text-center text-sm">{file.name}</span>
                        )
                      )}
                    </div>

                  </Label>

                  <Input
                    type="file"
                    multiple
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
                    disabled={isUploading}
                  />
                  
                </div>
              </div>

              <div className="col-span-1 md:col-span-2 mt-6">
                <Button
                  type="submit" 
                  className={`w-full bg-indigo-600 hover:bg-indigo-700 text-white ${isUploading ? "cursor-wait" : "cursor-pointer"}`}
                  disabled={isUploading}
                >
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
