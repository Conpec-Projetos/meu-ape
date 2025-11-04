"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { AgentRegistrationRequest } from "@/interfaces/agentRegistrationRequest";
import { User } from "@/interfaces/user";
import { userSchema } from "@/schemas/userSchema";
import { Download, ExternalLink, Eye, EyeOff } from "lucide-react";
import Image from "next/image";

const addSchema = userSchema
    .extend({
        password: z.string().min(6, "A senha deve ter pelo menos 6 caracteres."), 
        confirmPassword: z.string().min(1, "Confirmação de senha é obrigatória."),
        adminMsg: z.string().optional(),
    })
    .refine(data => data.password === data.confirmPassword, {
        message: "As senhas não correspondem.",
        path: ["confirmPassword"],
    });

const editSchema = userSchema.omit({ password: true }).extend({
    adminMsg: z.string().optional(),
});

const reviewSchema = z.object({
    adminMsg: z.string().min(1, "Motivo da recusa é obrigatório"),
});

type FormValues = z.infer<typeof addSchema>;

interface UserModalProps {
    isOpen: boolean;
    onClose: () => void;
    mode: "add" | "edit" | "review" | "view";
    userData?: User;
    requestData?: AgentRegistrationRequest;
    onSave: (data: FormValues) => void;
    onApprove?: (request: AgentRegistrationRequest) => void;
    onDeny?: (request: AgentRegistrationRequest, reason: string) => void;
}

export function UserModal({ isOpen, onClose, mode, userData, requestData, onSave, onApprove, onDeny }: UserModalProps) {
    const [passwordVisible, setPasswordVisible] = useState(false);
    const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false);
    const [showDenialReason, setShowDenialReason] = useState(false);

    const currentSchema = mode === "add" ? addSchema : editSchema;
    const form = useForm<FormValues>({
        resolver: zodResolver(currentSchema as unknown as z.ZodTypeAny),
        defaultValues: {
            fullName: "",
            email: "",
            cpf: "",
            phone: "",
            address: "",
            role: "client",
            password: "",
            confirmPassword: "",
            agentProfile: {
                creci: "",
                city: "",
            },
            adminMsg: "",
        },
    });

    useEffect(() => {
        if (isOpen) {
            let defaultValues: Partial<FormValues> = {
                role: "client",
                password: "",
                confirmPassword: "",
            };
            if (mode === "edit" || mode === "view") {
                defaultValues = userData || {};
                defaultValues.password = "";
                defaultValues.confirmPassword = "";
            } else if (mode === "review" && requestData?.applicantData) {
                const { creci, city, ...rest } = requestData.applicantData;
                defaultValues = {
                    ...rest,
                    role: "agent",
                    agentProfile: { creci: creci || "", city: city || "" },
                    password: "",
                    confirmPassword: "",
                };
            }
            form.reset(defaultValues as FormValues);
            setShowDenialReason(false);
        }
    }, [isOpen, mode, userData, requestData, form]);

    const role = form.watch("role");

    useEffect(() => {
        if (role !== "agent") {
            form.setValue("agentProfile.creci", "");
            form.setValue("agentProfile.city", "");
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [role]);

    const onSubmit = (data: FormValues) => {
        onSave(data);
    };

    const handleDenyClick = () => {
        setShowDenialReason(true);
    };

    const handleConfirmDeny = async () => {
        const adminMsg = form.getValues("adminMsg");
        const validation = reviewSchema.safeParse({ adminMsg });

        if (validation.success) {
            if (onDeny && requestData && adminMsg) {
                onDeny(requestData, adminMsg);
            }
        } else {
            form.setError("adminMsg", {
                message: validation.error.errors[0].message,
            });
        }
    };

    const renderFields = () => {
        const disabled = mode === "view" || mode === "review";

        return (
            <div className="space-y-4">
                <FormField
                    control={form.control}
                    name="fullName"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Nome Completo</FormLabel>
                            <FormControl>
                                <Input {...field} disabled={disabled} value={field.value || ""} />
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
                                <Input {...field} disabled={disabled || mode === "edit"} value={field.value || ""} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="cpf"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>CPF</FormLabel>
                            <FormControl>
                                <Input {...field} disabled={disabled} value={field.value || ""} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Telefone</FormLabel>
                            <FormControl>
                                <Input {...field} disabled={disabled} value={field.value || ""} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="address"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Endereço</FormLabel>
                            <FormControl>
                                <Input {...field} disabled={disabled} value={field.value || ""} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                {mode === "add" && (
                    <>
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
                                                value={field.value || ""}
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
                                    <FormLabel>Confirmar Senha</FormLabel>
                                    <FormControl>
                                        <div className="relative">
                                            <Input
                                                type={confirmPasswordVisible ? "text" : "password"}
                                                placeholder="******"
                                                {...field}
                                                value={field.value || ""}
                                            />
                                            <button
                                                type="button"
                                                className="absolute inset-y-0 right-0 pr-3 flex items-center text-muted-foreground"
                                                onClick={() => setConfirmPasswordVisible(!confirmPasswordVisible)}
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
                    </>
                )}

                {(role === "agent" || (mode === "review" && requestData)) && (
                    <FormField
                        control={form.control}
                        name="agentProfile.creci"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>CRECI</FormLabel>
                                <FormControl>
                                    <Input {...field} disabled={disabled} value={field.value || ""} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                )}
            </div>
        );
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent
                showCloseButton={false}
                className="w-[95vw] sm:max-w-[95vw] md:max-w-xl lg:max-w-2xl xl:max-w-3xl max-w-[800px] max-h-[90vh] p-0 overflow-y-auto rounded-lg"
            >
                <DialogHeader className="sticky top-0 border-b bg-background/80 backdrop-blur supports-backdrop-filter:bg-background/60 px-4 sm:px-6 py-3 sm:py-4">
                    <DialogTitle>
                        {mode === "add" && "Adicionar Novo Usuário"}
                        {mode === "edit" && "Editar Usuário"}
                        {mode === "review" && "Analisar Solicitação de Cadastro"}
                        {mode === "view" && "Visualizar Usuário"}
                    </DialogTitle>
                    {mode !== "review" && mode !== "view" && (
                        <DialogDescription>Preencha os campos abaixo.</DialogDescription>
                    )}
                </DialogHeader>
                <div className="p-4 sm:p-6">
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                            {mode !== "review" && (
                                <FormField
                                    control={form.control}
                                    name="role"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Tipo de Usuário</FormLabel>
                                            <Select
                                                onValueChange={field.onChange}
                                                defaultValue={field.value}
                                                disabled={mode === "view"}
                                            >
                                                <FormControl>
                                                    <SelectTrigger className="cursor-pointer">
                                                        <SelectValue placeholder="Selecione o tipo de usuário" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectItem className="cursor-pointer" value="client">
                                                        Cliente
                                                    </SelectItem>
                                                    <SelectItem className="cursor-pointer" value="agent">
                                                        Corretor
                                                    </SelectItem>
                                                    <SelectItem className="cursor-pointer" value="admin">
                                                        Administrador
                                                    </SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            )}
                            {renderFields()}
                            {/* Documentos enviados - visível em view/edit/review */}
                            {(mode === "view" || mode === "edit" || mode === "review") &&
                                (() => {
                                    // Coleta documentos do usuário
                                    const userDocs = userData
                                        ? {
                                              // Documentos gerais do usuário (clientes/qualquer role)
                                              identityDoc: userData.documents?.identityDoc || [],
                                              addressProof: userData.documents?.addressProof || [],
                                              incomeProof: userData.documents?.incomeProof || [],
                                              bmCert: userData.documents?.bmCert || [],
                                              // Documentos específicos de corretor
                                              creciCardPhoto: userData.agentProfile?.documents?.creciCardPhoto || [],
                                              creciCert: userData.agentProfile?.documents?.creciCert || [],
                                          }
                                        : null;

                                    // Coleta documentos da solicitação (modo review)
                                    const requestDocs =
                                        mode === "review" && requestData?.applicantData
                                            ? {
                                                  creciCardPhoto: requestData.applicantData.creciCardPhoto || [],
                                                  creciCert: requestData.applicantData.creciCert || [],
                                              }
                                            : null;

                                    const hasAnyDoc =
                                        (userDocs &&
                                            Object.values(userDocs).some(arr => (arr as string[]).length > 0)) ||
                                        (requestDocs &&
                                            Object.values(requestDocs).some(arr => (arr as string[]).length > 0));

                                    if (!hasAnyDoc) return null;

                                    const DocSection = ({ title, items }: { title: string; items: string[] }) =>
                                        items.length ? (
                                            <div className="space-y-2">
                                                <h4 className="text-sm font-medium text-muted-foreground">{title}</h4>
                                                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                                                    {items.map((src, idx) => (
                                                        <div key={`${title}-${idx}`} className="space-y-1">
                                                            <div className="group relative overflow-hidden rounded border bg-muted/30 w-full">
                                                                <div className="relative h-28 sm:h-32 md:h-36 w-full">
                                                                    <Image
                                                                        src={src}
                                                                        alt={`${title} ${idx + 1}`}
                                                                        fill
                                                                        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                                                                        className="object-cover transition-transform duration-200"
                                                                        unoptimized
                                                                    />
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                <Tooltip>
                                                                    <TooltipTrigger asChild>
                                                                        <Button
                                                                            variant="outline"
                                                                            size="icon"
                                                                            className="cursor-pointer"
                                                                            asChild
                                                                        >
                                                                            <a
                                                                                href={src}
                                                                                download
                                                                                onClick={e => e.stopPropagation()}
                                                                            >
                                                                                <Download className="h-4 w-4" />
                                                                            </a>
                                                                        </Button>
                                                                    </TooltipTrigger>
                                                                    <TooltipContent>
                                                                        <p>Baixar</p>
                                                                    </TooltipContent>
                                                                </Tooltip>
                                                                <Tooltip>
                                                                    <TooltipTrigger asChild>
                                                                        <Button
                                                                            variant="outline"
                                                                            size="icon"
                                                                            className="cursor-pointer"
                                                                            asChild
                                                                        >
                                                                            <a
                                                                                href={src}
                                                                                target="_blank"
                                                                                rel="noopener noreferrer"
                                                                                onClick={e => e.stopPropagation()}
                                                                            >
                                                                                <ExternalLink className="h-4 w-4" />
                                                                            </a>
                                                                        </Button>
                                                                    </TooltipTrigger>
                                                                    <TooltipContent>
                                                                        <p>Abrir em nova aba</p>
                                                                    </TooltipContent>
                                                                </Tooltip>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        ) : null;

                                    return (
                                        <TooltipProvider>
                                            <div className="space-y-3 pt-2">
                                                <h3 className="text-base font-semibold">Documentos</h3>
                                                {/* Documentos vindos de solicitação (review) */}
                                                {requestDocs && (
                                                    <div className="space-y-3">
                                                        <DocSection
                                                            title="CRECI - Carteirinha"
                                                            items={requestDocs.creciCardPhoto}
                                                        />
                                                        <DocSection
                                                            title="CRECI - Certificado"
                                                            items={requestDocs.creciCert}
                                                        />
                                                    </div>
                                                )}
                                                {/* Documentos do usuário */}
                                                {userDocs && (
                                                    <div className="space-y-3">
                                                        <DocSection
                                                            title="Documento de Identidade"
                                                            items={userDocs.identityDoc}
                                                        />
                                                        <DocSection
                                                            title="Comprovante de Endereço"
                                                            items={userDocs.addressProof}
                                                        />
                                                        <DocSection
                                                            title="Comprovante de Renda"
                                                            items={userDocs.incomeProof}
                                                        />
                                                        <DocSection title="Certidão" items={userDocs.bmCert} />
                                                        <DocSection
                                                            title="CRECI - Carteirinha"
                                                            items={userDocs.creciCardPhoto}
                                                        />
                                                        <DocSection
                                                            title="CRECI - Certificado"
                                                            items={userDocs.creciCert}
                                                        />
                                                    </div>
                                                )}
                                            </div>
                                        </TooltipProvider>
                                    );
                                })()}
                            {showDenialReason && (
                                <FormField
                                    control={form.control}
                                    name="adminMsg"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Motivo da Recusa</FormLabel>
                                            <FormControl>
                                                <Textarea
                                                    placeholder="Explique o motivo da recusa..."
                                                    {...field}
                                                    value={field.value || ""}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            )}
                            <DialogFooter>
                                {mode === "review" && !showDenialReason && (
                                    <>
                                        <Button
                                            type="button"
                                            variant="destructive"
                                            onClick={handleDenyClick}
                                            className="cursor-pointer"
                                        >
                                            Recusar
                                        </Button>
                                        <Button
                                            type="button"
                                            onClick={() => onApprove && requestData && onApprove(requestData)}
                                            className="cursor-pointer"
                                        >
                                            Aprovar
                                        </Button>
                                    </>
                                )}
                                {showDenialReason && (
                                    <Button
                                        type="button"
                                        variant="destructive"
                                        onClick={handleConfirmDeny}
                                        className="cursor-pointer"
                                    >
                                        Confirmar Recusa
                                    </Button>
                                )}
                                {(mode === "add" || mode === "edit") && (
                                    <Button type="submit" className="cursor-pointer">
                                        Salvar
                                    </Button>
                                )}
                            </DialogFooter>
                        </form>
                    </Form>
                </div>
            </DialogContent>
        </Dialog>
    );
}
