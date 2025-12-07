"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AgentFormData, agentSchema } from "@/schemas/agentRegistrationRequestSchema";
import { notifyError, notifySuccess } from "@/services/notificationService";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, FileCheck, FileText, FileWarning } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChangeEvent, useState } from "react";
import { useForm } from "react-hook-form";

const formatCpf = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 11);
    if (digits.length <= 3) {
        return digits;
    }
    if (digits.length <= 6) {
        return `${digits.slice(0, 3)}.${digits.slice(3)}`;
    }
    if (digits.length <= 9) {
        return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
    }
    return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9, 11)}`;
};

const formatPhone = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 11);
    if (!digits) {
        return "";
    }

    const areaCode = digits.slice(0, 2);
    if (digits.length <= 2) {
        return `(${areaCode}`;
    }
    if (digits.length <= 6) {
        return `(${areaCode}) ${digits.slice(2)}`;
    }

    const firstBlockLength = digits.length === 11 ? 5 : 4;
    const firstBlock = digits.slice(2, 2 + firstBlockLength);
    const secondBlock = digits.slice(2 + firstBlockLength);
    return `(${areaCode}) ${firstBlock}${secondBlock ? `-${secondBlock}` : ""}`;
};

const formatRg = (value: string) => {
    const sanitized = value
        .replace(/[^0-9Xx]/g, "")
        .toUpperCase()
        .slice(0, 9);
    if (sanitized.length <= 2) {
        return sanitized;
    }
    if (sanitized.length <= 5) {
        return `${sanitized.slice(0, 2)}.${sanitized.slice(2)}`;
    }
    if (sanitized.length <= 8) {
        return `${sanitized.slice(0, 2)}.${sanitized.slice(2, 5)}.${sanitized.slice(5)}`;
    }
    return `${sanitized.slice(0, 2)}.${sanitized.slice(2, 5)}.${sanitized.slice(5, 8)}-${sanitized.slice(8)}`;
};

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
    const [firebaseError, setFirebaseError] = useState<{ message: string; path: string } | null>(null);

    const {
        register,
        handleSubmit,
        setValue,
        watch,
        formState: { errors },
    } = useForm<AgentFormData>({
        mode: "onSubmit", // validação ao enviar
        reValidateMode: "onSubmit", // revalida apenas ao enviar
        resolver: zodResolver(agentSchema),
    });

    const cpfValue = watch("cpf") ?? "";
    const phoneValue = watch("phone") ?? "";
    const rgValue = watch("rg") ?? "";

    const handleCpfChange = (event: ChangeEvent<HTMLInputElement>) => {
        const formattedValue = formatCpf(event.target.value);
        setValue("cpf", formattedValue, { shouldValidate: true, shouldDirty: true });
    };

    const handlePhoneChange = (event: ChangeEvent<HTMLInputElement>) => {
        const formattedValue = formatPhone(event.target.value);
        setValue("phone", formattedValue, { shouldValidate: true, shouldDirty: true });
    };

    const handleRgChange = (event: ChangeEvent<HTMLInputElement>) => {
        const formattedValue = formatRg(event.target.value);
        setValue("rg", formattedValue, { shouldValidate: true, shouldDirty: true });
    };

    const cpfRegister = register("cpf");
    const phoneRegister = register("phone");
    const rgRegister = register("rg");

    // Função de submissão do formulário
    const onSubmit = async (formData: AgentFormData) => {
        console.log(formData);
        setFirebaseError(null);
        setIsUploading(true);

        // Convert AgentFormData to real FormData object
        const formPayload = new FormData();

        formPayload.append("email", formData.email);
        formPayload.append("fullName", formData.fullName);
        formPayload.append("cpf", formData.cpf);
        formPayload.append("rg", formData.rg);
        formPayload.append("address", formData.address);
        formPayload.append("city", formData.city);
        formPayload.append("creci", formData.creci);
        formPayload.append("password", formData.password);
        formPayload.append("confirmPassword", formData.confirmPassword);
        formPayload.append("phone", formData.phone);

        // Files: loop through and append each one
        formData.creciCardPhoto.forEach(file => {
            formPayload.append("creciCardPhoto", file);
        });

        formData.creciCert.forEach(file => {
            formPayload.append("creciCert", file);
        });

        try {
            const res = await fetch("api/auth/signup-agent", {
                method: "POST",
                body: formPayload,
            });

            const data = await res.json();

            if (res.ok) {
                notifySuccess("Registro solicitado com sucesso!");
                router.push("/agent-signup/accepted");
            } else {
                const message = data.error || "Erro ao enviar solicitação. Tente novamente.";

                if (data.path) {
                    setFirebaseError({
                        message: message,
                        path: data.path,
                    });
                } else {
                    notifyError(message);
                }
            }
        } catch (error) {
            console.error(error);
            notifyError("Erro de conexão com o servidor");
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div className="relative flex min-h-screen flex-col items-center justify-center bg-gray-100 dark:bg-gray-900">
            <div className="absolute inset-0 z-0">
                <Image src="/register/background.png" alt="Background" layout="fill" objectFit="cover" />
            </div>
            <div className="relative z-10 w-full max-w-4xl p-4">
                <Card className="bg-white/90 dark:bg-black/80 backdrop-blur-sm">
                    <CardHeader className="text-center">
                        <div className="flex justify-center mb-4">
                            <Image src="/logo.png" alt="Logo" width={150} height={50} />
                        </div>
                        <CardTitle className="text-2xl">Criar uma nova conta</CardTitle>
                        <CardDescription>Preencha os campos abaixo para criar sua conta</CardDescription>
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
                                {errors.fullName && (
                                    <span className="text-sm text-red-600">*{errors.fullName.message}</span>
                                )}
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
                                <Input
                                    id="cpf"
                                    placeholder="XXX.XXX.XXX-XX"
                                    {...cpfRegister}
                                    value={cpfValue}
                                    onChange={handleCpfChange}
                                    disabled={isUploading}
                                />
                                {errors.cpf && <span className="text-sm text-red-600">*{errors.cpf.message}</span>}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="rg">RG</Label>
                                <Input
                                    id="rg"
                                    placeholder="12.345.678-9"
                                    {...rgRegister}
                                    value={rgValue}
                                    onChange={handleRgChange}
                                    disabled={isUploading}
                                />
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
                                {firebaseError?.path === "email" && (
                                    <span className="text-sm text-red-600">*{firebaseError.message}</span>
                                )}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="phone">Telefone</Label>
                                <Input
                                    id="phone"
                                    placeholder="(DD) X XXXXX-XXXX"
                                    {...phoneRegister}
                                    value={phoneValue}
                                    onChange={handlePhoneChange}
                                    disabled={isUploading}
                                />
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
                                {errors.password && (
                                    <span className="text-sm text-red-600">*{errors.password.message}</span>
                                )}
                                {firebaseError?.path === "password" && (
                                    <span className="text-sm text-red-600">*{firebaseError.message}</span>
                                )}
                                <button
                                    type="button"
                                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500"
                                    onClick={() => setPasswordVisible(!passwordVisible)}
                                >
                                    {passwordVisible ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
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
                                {errors.confirmPassword && (
                                    <span className="text-sm text-red-600">*{errors.confirmPassword.message}</span>
                                )}
                                <button
                                    type="button"
                                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500"
                                    onClick={() => setConfirmPasswordVisible(!confirmPasswordVisible)}
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
                                <Input
                                    id="address"
                                    placeholder="Rua, Nº"
                                    {...register("address")}
                                    disabled={isUploading}
                                />
                                {errors.address && (
                                    <span className="text-sm text-red-600">*{errors.address.message}</span>
                                )}
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
                                {(errors.creciCardPhoto || errors.creciCert) && (
                                    <span className="text-sm text-red-600">
                                        *Documento obrigatório {errors.creciCardPhoto?.message}
                                    </span>
                                )}
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
                                            {watch("creciCardPhoto")?.[0] &&
                                                Array.from(watch("creciCardPhoto")).map((file: File) => (
                                                    <span key={file.name} className="text-center text-sm">
                                                        {file.name}
                                                    </span>
                                                ))}
                                        </div>
                                    </Label>

                                    <Input
                                        type="file"
                                        multiple
                                        id="creciCardPhoto"
                                        accept="image/*,.pdf"
                                        {...register("creciCardPhoto", {
                                            onChange: e => {
                                                const files = e.target.files
                                                    ? (Array.from(e.target.files) as File[])
                                                    : [];
                                                setCreciCardPhotoSelected(files.length > 0);
                                                setValue("creciCardPhoto", files, { shouldValidate: true });
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

                                            <span className="text-center text-sm">
                                                Certidão de regularidade do CRECI
                                            </span>
                                        </div>
                                        <div className="flex flex-col items-center space-y-1">
                                            {watch("creciCert")?.[0] &&
                                                Array.from(watch("creciCert")).map((file: File) => (
                                                    <span key={file.name} className="text-center text-sm">
                                                        {file.name}
                                                    </span>
                                                ))}
                                        </div>
                                    </Label>

                                    <Input
                                        type="file"
                                        multiple
                                        id="creciCert"
                                        accept="image/*,.pdf"
                                        {...register("creciCert", {
                                            onChange: e => {
                                                const files = e.target.files
                                                    ? (Array.from(e.target.files) as File[])
                                                    : [];
                                                setCreciCertSelected(files.length > 0);
                                                setValue("creciCert", files, { shouldValidate: true });
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
                                    className={`w-full bg-primary hover:bg-primary/90 text-primary-foreground ${isUploading ? "cursor-wait" : "cursor-pointer"}`}
                                    disabled={isUploading}
                                >
                                    Solicitar cadastro
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
