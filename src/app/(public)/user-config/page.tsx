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
import { Label } from "@/components/features/labels/default-label";
import { Skeleton } from "@/components/features/skeletons/default-skeleton";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { auth } from "@/firebase/firebase-config";
import { cn } from "@/lib/utils";
import { ProfileUpdate, profileUpdateSchema } from "@/schemas/profileUpdateSchema";
import { notifyError, notifyInfo, notifyPromise } from "@/services/notificationService";
import { zodResolver } from "@hookform/resolvers/zod";
import { EmailAuthProvider, reauthenticateWithCredential, updatePassword } from "firebase/auth";
import { Eye, EyeOff, FileCheck, FileText, Loader } from "lucide-react";
import React, { useCallback, useEffect, useState } from "react";
import type { Resolver } from "react-hook-form";
import { useForm } from "react-hook-form";
import z from "zod";

const passwordChangeSchema = z
    .object({
        currentPassword: z.string().min(1, "Senha atual é obrigatória"),
        newPassword: z.string().min(8, "Nova senha deve ter pelo menos 8 caracteres"),
        confirmNewPassword: z.string(),
    })
    .refine(data => data.newPassword === data.confirmNewPassword, {
        message: "As novas senhas não correspondem",
        path: ["confirmNewPassword"],
    });
type PasswordChangeData = z.infer<typeof passwordChangeSchema>;

export default function UserConfig() {
    const [loadingProfile, setLoadingProfile] = useState<boolean>(true);
    const [apiError, setApiError] = useState<string | null>(null);

    // --- Estado dos Documentos ---
    const [uploading, setUploading] = useState(false);
    const [uploadedUrls, setUploadedUrls] = useState<Record<string, string[]>>({}); // Armazena URLs existentes
    const [pendingFiles, setPendingFiles] = useState<Record<string, File | null>>({}); // Armazena arquivos selecionados

    // --- Estado do Modal de Senha ---
    const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
    const [passwordVisible, setPasswordVisible] = useState(false);
    const [newPasswordVisible, setNewPasswordVisible] = useState(false);
    const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false);

    // --- Form de Dados Pessoais ---
    const form = useForm<ProfileUpdate>({
        // zodResolver has a slightly different generic; cast to Resolver<ProfileUpdate>
        resolver: zodResolver(profileUpdateSchema) as unknown as Resolver<ProfileUpdate>,
        defaultValues: {
            fullName: "",
            address: "",
            cpf: "",
            phone: "",
        },
    });

    // --- Form do Modal de Senha ---
    const passwordForm = useForm<PasswordChangeData>({
        resolver: zodResolver(passwordChangeSchema),
        defaultValues: {
            currentPassword: "",
            newPassword: "",
            confirmNewPassword: "",
        },
    });

    // --- Funções de Formatação ---
    const onlyDigits = (v: string) => (v || "").toString().replace(/\D/g, "");

    const formatCPF = useCallback((v: string) => {
        const d = onlyDigits(v).slice(0, 11);
        if (!d) return "";
        return d.replace(/(\d{1,3})(\d{3})(\d{3})(\d{0,2})/, (_, a, b, c, d2) => {
            let out = `${a}.${b}.${c}`;
            if (d2) out += `-${d2}`;
            return out;
        });
    }, []);

    const formatPhone = useCallback((v: string) => {
        const d = onlyDigits(v);
        if (!d) return "";
        if (d.length <= 2) return `(${d}`;
        if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
        if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
        return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7, 11)}`;
    }, []);

    // --- Busca de Dados Iniciais ---
    const fetchProfile = useCallback(
        async (signal?: AbortSignal) => {
            setLoadingProfile(true);
            setApiError(null);
            try {
                const res = await fetch("/api/user/profile", { signal });
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                const data = await res.json();
                const user = data.user || {};
                form.reset({
                    fullName: user.fullName || "",
                    address: user.address || "",
                    cpf: user.cpf ? formatCPF(user.cpf as string) : "",
                    phone: user.phone ? formatPhone(user.phone as string) : "",
                });
                setUploadedUrls(user.documents || {});
            } catch (err: unknown) {
                if (err && (err as { name?: string }).name === "AbortError") return;
                const message = err instanceof Error ? err.message : String(err);
                setApiError(message || "Erro ao buscar perfil");
                notifyError("Erro ao carregar dados do perfil.");
            } finally {
                setLoadingProfile(false);
            }
        },
        [form, formatCPF, formatPhone]
    );

    useEffect(() => {
        const controller = new AbortController();
        fetchProfile(controller.signal);
        return () => controller.abort();
    }, [fetchProfile]);

    // --- Salvar Dados Pessoais ---
    const onProfileSubmit = (data: ProfileUpdate) => {
        // Limpa o CPF e telefone antes de enviar
        const payload = {
            ...data,
            cpf: data.cpf ? onlyDigits(data.cpf) : undefined,
            phone: data.phone ? onlyDigits(data.phone) : undefined,
        };

        const promise = fetch("/api/user/profile", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        })
            .then(async res => {
                if (!res.ok) {
                    const errorData = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
                    throw new Error(errorData.error || "Falha ao salvar");
                }
                return res.json();
            })
            .then(() => {
                fetchProfile(); // Rebusca os dados após salvar
            });

        notifyPromise(promise, {
            loading: "Salvando dados...",
            success: "Dados salvos com sucesso!",
            error: (err: Error) => err.message || "Erro ao salvar dados",
        });
    };

    // --- Upload de Documento (Função Auxiliar) ---
    const uploadDocument = async (file: File | null, documentType: string): Promise<string | null> => {
        if (!file) return null;

        const formData = new FormData();
        // A API espera os arquivos anexados diretamente com a chave sendo o tipo do documento
        formData.append(documentType, file, file.name);

        const res = await fetch("/api/user/documents/upload", {
            method: "POST",
            body: formData,
        });

        if (!res.ok) {
            const errorData = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
            throw new Error(errorData.error || `Falha ao enviar ${documentType}`);
        }
        const data = await res.json();
        // A API retorna um objeto `urls` com arrays de URLs por tipo
        return data.urls?.[documentType]?.[0] || null; // Pega a primeira URL retornada para este tipo
    };

    // --- Salvar Documentos ---
    const handleSaveDocuments = async () => {
        const filesToUpload = Object.entries(pendingFiles).filter(([, file]) => file !== null);
        if (filesToUpload.length === 0) {
            notifyInfo("Nenhum novo documento selecionado para salvar.");
            return;
        }

        setUploading(true);

        const uploadPromises = filesToUpload.map(([docType, file]) =>
            uploadDocument(file, docType)
                .then(url => {
                    if (url) {
                        // Atualiza o estado local imediatamente após o sucesso de CADA upload
                        setUploadedUrls(prev => ({
                            ...prev,
                            [docType]: [...(prev[docType] || []), url],
                        }));
                        setPendingFiles(prev => ({ ...prev, [docType]: null })); // Limpa o arquivo pendente
                    }
                    return { docType, success: !!url }; // Retorna sucesso ou falha para o tipo
                })
                .catch(error => {
                    console.error(`Erro no upload de ${docType}:`, error);
                    notifyError(`Erro ao enviar ${docType}: ${error.message}`);
                    return { docType, success: false }; // Indica falha
                })
        );

        // Usa notifyPromise para o conjunto de uploads
        notifyPromise(Promise.all(uploadPromises), {
            loading: `Enviando ${filesToUpload.length} documento(s)...`,
            success: results => {
                const successes = results.filter(r => r.success).length;
                const failures = results.length - successes;
                setUploading(false); // Garante que uploading é resetado
                if (failures > 0) {
                    return `${successes} documento(s) enviados com sucesso. ${failures} falharam.`;
                }
                return "Todos os documentos foram enviados com sucesso!";
            },
            error: err => {
                console.error("Erro geral no salvamento de documentos:", err);
                setUploading(false); // Garante que uploading é resetado
                return "Ocorreu um erro ao salvar alguns documentos.";
            },
        });
    };

    const setPendingFile = (documentType: string, file: File | null) => {
        setPendingFiles(p => ({ ...p, [documentType]: file }));
    };

    // --- Componente para Linha de Documento ---
    const DocumentRow: React.FC<{
        label: string;
        typeKey: string;
        existingUrls: string[]; // Renomeado para clareza
        pendingFile: File | null;
        onFileSelect: (file: File | null) => void; // Renomeado
    }> = ({ label, typeKey, existingUrls, pendingFile, onFileSelect }) => {
        const inputId = `doc-${typeKey}`;
        const fileName = pendingFile?.name;
        const hasExisting = existingUrls && existingUrls.length > 0;

        // Determina qual ícone mostrar
        const Icon = pendingFile ? FileCheck : hasExisting ? FileCheck : FileText;
        const iconColor = pendingFile ? "text-green-600" : hasExisting ? "text-green-600" : "text-muted-foreground";

        return (
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 py-4 border-b">
                <Label htmlFor={inputId} className="w-full sm:w-1/3 font-medium">
                    {label}
                </Label>
                <div className="flex-grow flex items-center gap-4">
                    <Label
                        htmlFor={inputId}
                        className={cn(
                            "flex flex-col items-center justify-center space-y-1 border-2 rounded-lg p-3 border-dashed min-h-[80px] w-[120px]",
                            uploading ? "cursor-not-allowed bg-muted/50" : "cursor-pointer hover:border-primary/50",
                            pendingFile ? "border-green-600" : "border-input",
                            "transition-colors"
                        )}
                    >
                        <Icon className={cn("size-8", iconColor)} />
                        <span
                            className={cn(
                                "text-xs font-medium text-center",
                                pendingFile ? "text-green-700" : "text-muted-foreground"
                            )}
                        >
                            {pendingFile ? "Selecionado" : hasExisting ? "Enviado" : "Selecionar"}
                        </span>
                    </Label>
                    <Input
                        type="file"
                        id={inputId}
                        accept="image/*,.pdf"
                        className="hidden"
                        disabled={uploading}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                            onFileSelect(e.target.files?.[0] ?? null);
                        }}
                    />
                    <div className="text-sm">
                        {fileName && <p className="text-foreground truncate max-w-[200px]">Novo: {fileName}</p>}
                        {hasExisting && !pendingFile && (
                            <div className="flex flex-col gap-1">
                                {existingUrls.map((url, index) => (
                                    <a
                                        key={index}
                                        href={url}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="text-blue-600 underline hover:text-blue-800"
                                    >
                                        Ver Documento {existingUrls.length > 1 ? index + 1 : ""}
                                    </a>
                                ))}
                            </div>
                        )}
                        {!fileName && !hasExisting && <p className="text-muted-foreground">Nenhum arquivo enviado.</p>}
                    </div>
                </div>
            </div>
        );
    };

    // --- Lógica de Alteração de Senha ---
    const onPasswordSubmit = async (data: PasswordChangeData) => {
        const user = auth.currentUser;
        if (!user || !user.email) {
            notifyError("Usuário não autenticado.");
            return;
        }

        const credential = EmailAuthProvider.credential(user.email, data.currentPassword);

        const reauthPromise = reauthenticateWithCredential(user, credential);

        notifyPromise(reauthPromise, {
            loading: "Verificando senha atual...",
            success: () => {
                // Se reautenticação OK, tenta atualizar a senha
                const updatePromise = updatePassword(user, data.newPassword);
                notifyPromise(updatePromise, {
                    loading: "Atualizando senha...",
                    success: () => {
                        setIsPasswordModalOpen(false); // Fecha o modal
                        passwordForm.reset(); // Limpa o formulário de senha
                        return "Senha alterada com sucesso!";
                    },
                    error: (err: unknown) => {
                        console.error("Erro ao atualizar senha:", err);
                        const message = err instanceof Error ? err.message : String(err);
                        return message || "Erro ao atualizar senha.";
                    },
                });
                return "Autenticação confirmada. Atualizando senha..."; // Mensagem intermediária
            },
            error: (err: unknown) => {
                console.error("Erro de reautenticação:", err);
                let code: unknown = undefined;
                if (err && typeof err === "object" && "code" in err) {
                    const e = err as Record<string, unknown>;
                    code = e.code;
                }
                if (code === "auth/wrong-password" || code === "auth/invalid-credential") {
                    passwordForm.setError("currentPassword", { message: "Senha atual incorreta." });
                    return "Senha atual incorreta.";
                }
                const message = err instanceof Error ? err.message : String(err);
                return message || "Erro ao verificar senha atual.";
            },
        });
    };

    // --- Renderização ---
    if (loadingProfile) {
        return (
            <div className="container mx-auto py-10 px-4">
                <Card className="max-w-3xl mx-auto">
                    <CardHeader>
                        <Skeleton className="h-8 w-1/2" />
                        <Skeleton className="h-4 w-3/4" />
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-2">
                            <Skeleton className="h-4 w-1/4" />
                            <Skeleton className="h-9 w-full" />
                        </div>
                        <div className="space-y-2">
                            <Skeleton className="h-4 w-1/4" />
                            <Skeleton className="h-9 w-full" />
                        </div>
                        <div className="space-y-2">
                            <Skeleton className="h-4 w-1/4" />
                            <Skeleton className="h-9 w-full" />
                        </div>
                        <Skeleton className="h-10 w-full" />
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (apiError) {
        return (
            <div className="container mx-auto py-10 px-4 text-center text-red-600">
                Erro ao carregar perfil: {apiError}. Por favor, tente recarregar a página.
            </div>
        );
    }

    return (
        <div className="container mx-auto py-10 px-4 pt-20">
            {" "}
            {/* Adicionado pt-20 */}
            <Tabs defaultValue="conta" className="max-w-3xl mx-auto">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="conta">Conta</TabsTrigger>
                    <TabsTrigger value="documentos">Documentos</TabsTrigger>
                </TabsList>

                {/* Aba Conta */}
                <TabsContent value="conta">
                    <Card>
                        <CardHeader>
                            <CardTitle>Dados Pessoais</CardTitle>
                            <CardDescription>Atualize suas informações de perfil.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Form {...form}>
                                <form onSubmit={form.handleSubmit(onProfileSubmit)} className="space-y-6">
                                    <FormField
                                        control={form.control}
                                        name="fullName"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Nome Completo</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="Seu nome completo" {...field} />
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
                                                    <Input
                                                        placeholder="Seu endereço completo"
                                                        {...field}
                                                        value={field.value ?? ""}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <FormField
                                            control={form.control}
                                            name="cpf"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>CPF</FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            placeholder="000.000.000-00"
                                                            {...field}
                                                            value={field.value ?? ""}
                                                            onChange={e => field.onChange(formatCPF(e.target.value))}
                                                        />
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
                                                        <Input
                                                            placeholder="(00) 00000-0000"
                                                            {...field}
                                                            value={field.value ?? ""}
                                                            onChange={e => field.onChange(formatPhone(e.target.value))}
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>

                                    <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-4">
                                        <Dialog open={isPasswordModalOpen} onOpenChange={setIsPasswordModalOpen}>
                                            <DialogTrigger asChild>
                                                <Button type="button" variant="link" className="p-0 h-auto">
                                                    Alterar Senha
                                                </Button>
                                            </DialogTrigger>
                                            <DialogContent>
                                                <DialogHeader>
                                                    <DialogTitle>Alterar Senha</DialogTitle>
                                                    <DialogDescription>
                                                        Para sua segurança, digite sua senha atual e a nova senha
                                                        desejada.
                                                    </DialogDescription>
                                                </DialogHeader>
                                                <Form {...passwordForm}>
                                                    <form
                                                        onSubmit={passwordForm.handleSubmit(onPasswordSubmit)}
                                                        className="space-y-4"
                                                    >
                                                        <FormField
                                                            control={passwordForm.control}
                                                            name="currentPassword"
                                                            render={({ field }) => (
                                                                <FormItem>
                                                                    <FormLabel>Senha Atual</FormLabel>
                                                                    <FormControl>
                                                                        <div className="relative">
                                                                            <Input
                                                                                type={
                                                                                    passwordVisible
                                                                                        ? "text"
                                                                                        : "password"
                                                                                }
                                                                                {...field}
                                                                            />
                                                                            <Button
                                                                                type="button"
                                                                                variant="ghost"
                                                                                size="icon"
                                                                                className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 text-muted-foreground"
                                                                                onClick={() =>
                                                                                    setPasswordVisible(!passwordVisible)
                                                                                }
                                                                            >
                                                                                {passwordVisible ? (
                                                                                    <EyeOff className="h-4 w-4" />
                                                                                ) : (
                                                                                    <Eye className="h-4 w-4" />
                                                                                )}
                                                                            </Button>
                                                                        </div>
                                                                    </FormControl>
                                                                    <FormMessage />
                                                                </FormItem>
                                                            )}
                                                        />
                                                        <FormField
                                                            control={passwordForm.control}
                                                            name="newPassword"
                                                            render={({ field }) => (
                                                                <FormItem>
                                                                    <FormLabel>Nova Senha</FormLabel>
                                                                    <FormControl>
                                                                        <div className="relative">
                                                                            <Input
                                                                                type={
                                                                                    newPasswordVisible
                                                                                        ? "text"
                                                                                        : "password"
                                                                                }
                                                                                {...field}
                                                                            />
                                                                            <Button
                                                                                type="button"
                                                                                variant="ghost"
                                                                                size="icon"
                                                                                className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 text-muted-foreground"
                                                                                onClick={() =>
                                                                                    setNewPasswordVisible(
                                                                                        !newPasswordVisible
                                                                                    )
                                                                                }
                                                                            >
                                                                                {newPasswordVisible ? (
                                                                                    <EyeOff className="h-4 w-4" />
                                                                                ) : (
                                                                                    <Eye className="h-4 w-4" />
                                                                                )}
                                                                            </Button>
                                                                        </div>
                                                                    </FormControl>
                                                                    <FormMessage />
                                                                </FormItem>
                                                            )}
                                                        />
                                                        <FormField
                                                            control={passwordForm.control}
                                                            name="confirmNewPassword"
                                                            render={({ field }) => (
                                                                <FormItem>
                                                                    <FormLabel>Confirmar Nova Senha</FormLabel>
                                                                    <FormControl>
                                                                        <div className="relative">
                                                                            <Input
                                                                                type={
                                                                                    confirmPasswordVisible
                                                                                        ? "text"
                                                                                        : "password"
                                                                                }
                                                                                {...field}
                                                                            />
                                                                            <Button
                                                                                type="button"
                                                                                variant="ghost"
                                                                                size="icon"
                                                                                className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 text-muted-foreground"
                                                                                onClick={() =>
                                                                                    setConfirmPasswordVisible(
                                                                                        !confirmPasswordVisible
                                                                                    )
                                                                                }
                                                                            >
                                                                                {confirmPasswordVisible ? (
                                                                                    <EyeOff className="h-4 w-4" />
                                                                                ) : (
                                                                                    <Eye className="h-4 w-4" />
                                                                                )}
                                                                            </Button>
                                                                        </div>
                                                                    </FormControl>
                                                                    <FormMessage />
                                                                </FormItem>
                                                            )}
                                                        />
                                                        <DialogFooter>
                                                            <Button
                                                                type="button"
                                                                variant="outline"
                                                                onClick={() => setIsPasswordModalOpen(false)}
                                                                disabled={passwordForm.formState.isSubmitting}
                                                            >
                                                                Cancelar
                                                            </Button>
                                                            <Button
                                                                type="submit"
                                                                disabled={passwordForm.formState.isSubmitting}
                                                            >
                                                                {passwordForm.formState.isSubmitting && (
                                                                    <Loader className="mr-2 h-4 w-4 animate-spin" />
                                                                )}
                                                                Salvar Nova Senha
                                                            </Button>
                                                        </DialogFooter>
                                                    </form>
                                                </Form>
                                            </DialogContent>
                                        </Dialog>

                                        <Button
                                            type="submit"
                                            disabled={form.formState.isSubmitting}
                                            className="w-full sm:w-auto"
                                        >
                                            {form.formState.isSubmitting && (
                                                <Loader className="mr-2 h-4 w-4 animate-spin" />
                                            )}
                                            Salvar Alterações
                                        </Button>
                                    </div>
                                    <Button type="button" variant="destructive" className="w-full mt-4">
                                        Excluir Conta
                                    </Button>
                                </form>
                            </Form>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Aba Documentos */}
                <TabsContent value="documentos">
                    <Card>
                        <CardHeader>
                            <CardTitle>Gerenciamento de Documentos</CardTitle>
                            <CardDescription>Envie ou visualize seus documentos.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <DocumentRow
                                label="RG ou CIN"
                                typeKey="identityDoc" // Corrigido para corresponder ao schema/API
                                existingUrls={uploadedUrls["identityDoc"] || []}
                                pendingFile={pendingFiles["identityDoc"] || null}
                                onFileSelect={f => setPendingFile("identityDoc", f)}
                            />
                            <DocumentRow
                                label="Comprovante de Endereço"
                                typeKey="addressProof"
                                existingUrls={uploadedUrls["addressProof"] || []}
                                pendingFile={pendingFiles["addressProof"] || null}
                                onFileSelect={f => setPendingFile("addressProof", f)}
                            />
                            <DocumentRow
                                label="Comprovante de Renda"
                                typeKey="incomeProof"
                                existingUrls={uploadedUrls["incomeProof"] || []}
                                pendingFile={pendingFiles["incomeProof"] || null}
                                onFileSelect={f => setPendingFile("incomeProof", f)}
                            />
                            <DocumentRow
                                label="Certidão de Casamento (Opcional)"
                                typeKey="marriageCert"
                                existingUrls={uploadedUrls["marriageCert"] || []}
                                pendingFile={pendingFiles["marriageCert"] || null}
                                onFileSelect={f => setPendingFile("marriageCert", f)}
                            />
                            <div className="flex justify-end mt-6">
                                <Button
                                    onClick={handleSaveDocuments}
                                    disabled={uploading || Object.values(pendingFiles).every(f => f === null)}
                                >
                                    {uploading && <Loader className="mr-2 h-4 w-4 animate-spin" />}
                                    {uploading ? "Enviando..." : "Salvar Documentos"}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
