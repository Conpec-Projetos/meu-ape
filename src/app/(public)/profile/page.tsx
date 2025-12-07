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
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
import { EmailAuthProvider, reauthenticateWithCredential, signOut, updatePassword } from "firebase/auth";
import { ExternalLink, Eye, EyeOff, FileCheck, FileText, Loader, Trash2, UploadCloud } from "lucide-react";
import { useRouter } from "next/navigation";
import React, { useCallback, useEffect, useState } from "react";
import type { Resolver } from "react-hook-form";
import { useForm } from "react-hook-form";
import z from "zod";

// --- Schema para Mudança de Senha ---
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

export default function ProfilePage() {
    const router = useRouter();
    const [loadingProfile, setLoadingProfile] = useState<boolean>(true);
    const [apiError, setApiError] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);
    const [uploadedUrls, setUploadedUrls] = useState<Record<string, string[]>>({});
    const [pendingFiles, setPendingFiles] = useState<Record<string, File[]>>({});
    const [profilePhotoUrl, setProfilePhotoUrl] = useState<string | undefined>(undefined);
    const [userRole, setUserRole] = useState<string | undefined>(undefined);
    const [profilePhotoUploading, setProfilePhotoUploading] = useState(false);
    const [profilePhotoRemoving, setProfilePhotoRemoving] = useState(false);
    const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
    const [passwordVisible, setPasswordVisible] = useState(false);
    const [newPasswordVisible, setNewPasswordVisible] = useState(false);
    const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [deletePassword, setDeletePassword] = useState("");
    const [deletePasswordVisible, setDeletePasswordVisible] = useState(false);
    const [deletingAccount, setDeletingAccount] = useState(false);
    const [deleteError, setDeleteError] = useState<string | null>(null);

    // Formulário de Dados Pessoais
    const form = useForm<ProfileUpdate>({
        resolver: zodResolver(profileUpdateSchema) as unknown as Resolver<ProfileUpdate>,
        defaultValues: {
            fullName: "",
            address: "",
            cpf: "",
            phone: "",
            rg: "",
        },
    });

    // Formulário do Modal de Senha
    const passwordForm = useForm<PasswordChangeData>({
        resolver: zodResolver(passwordChangeSchema),
        defaultValues: {
            currentPassword: "",
            newPassword: "",
            confirmNewPassword: "",
        },
    });

    // Funções de Formatação
    const onlyDigits = (v: string) => (v || "").toString().replace(/\D/g, "");

    const sanitizeRg = useCallback((value: string) => (value || "").toUpperCase().replace(/[^0-9X]/g, ""), []);

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

    const formatRG = useCallback(
        (value: string) => {
            const clean = sanitizeRg(value).slice(0, 9);
            if (!clean) return "";
            if (clean.length <= 2) return clean;
            if (clean.length <= 5) return `${clean.slice(0, 2)}.${clean.slice(2)}`;
            if (clean.length <= 8) return `${clean.slice(0, 2)}.${clean.slice(2, 5)}.${clean.slice(5)}`;
            return `${clean.slice(0, 2)}.${clean.slice(2, 5)}.${clean.slice(5, 8)}-${clean.slice(8)}`;
        },
        [sanitizeRg]
    );

    // Busca de Dados Iniciais
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
                    rg: user.rg ? formatRG(user.rg as string) : "",
                });
                const mergedDocs: Record<string, string[]> = {
                    ...(user.documents || {}),
                    ...((user.agentProfile?.documents as Record<string, string[]>) || {}),
                };
                setUploadedUrls(mergedDocs);
                setProfilePhotoUrl(user.photoUrl);
                setUserRole(user.role);
            } catch (err: unknown) {
                if (err && (err as { name?: string }).name === "AbortError") return;
                const message = err instanceof Error ? err.message : String(err);
                setApiError(message || "Erro ao buscar perfil");
                notifyError("Erro ao carregar dados do perfil.");
            } finally {
                setLoadingProfile(false);
            }
        },
        [form, formatCPF, formatPhone, formatRG]
    );

    useEffect(() => {
        const controller = new AbortController();
        fetchProfile(controller.signal);
        return () => controller.abort();
    }, [fetchProfile]);

    // Salvar Dados Pessoais
    const onProfileSubmit = (data: ProfileUpdate) => {
        const payload = {
            ...data,
            cpf: data.cpf ? onlyDigits(data.cpf) : undefined,
            phone: data.phone ? onlyDigits(data.phone) : undefined,
            rg: data.rg ? sanitizeRg(data.rg) : undefined,
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
                fetchProfile();
            });

        notifyPromise(promise, {
            loading: "Salvando dados...",
            success: "Dados salvos com sucesso!",
            error: (err: Error) => err.message || "Erro ao salvar dados",
        });
    };

    // Upload de Documento (Função Auxiliar)
    const MAX_DOC_BYTES = 5 * 1024 * 1024; // 5MB

    const uploadDocumentsBatch = async (filesMap: Record<string, File[]>): Promise<Record<string, string[]>> => {
        const formData = new FormData();
        Object.entries(filesMap).forEach(([docType, files]) => {
            files.forEach(f => formData.append(docType, f, f.name));
        });
        const res = await fetch("/api/user/documents/upload", { method: "POST", body: formData });
        if (!res.ok) {
            const errorData = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
            throw new Error(errorData.error || `Falha ao enviar documentos`);
        }
        const data = await res.json();
        return data.urls || {};
    };

    // Salvar Documentos
    const handleSaveDocuments = async () => {
        const filesToUpload = Object.entries(pendingFiles).filter(([, files]) => Array.isArray(files) && files.length);
        if (filesToUpload.length === 0) {
            notifyInfo("Nenhum novo documento selecionado para salvar.");
            return;
        }
        setUploading(true);
        const batchMap: Record<string, File[]> = Object.fromEntries(filesToUpload);
        const promise = uploadDocumentsBatch(batchMap)
            .then(urlsMap => {
                // Merge newly uploaded URLs and clear pending for those keys
                setUploadedUrls(prev => {
                    const next = { ...prev };
                    Object.entries(urlsMap).forEach(([k, urls]) => {
                        next[k] = [...(next[k] || []), ...urls];
                    });
                    return next;
                });
                setPendingFiles(prev => {
                    const next = { ...prev };
                    Object.keys(batchMap).forEach(k => (next[k] = []));
                    return next;
                });
            })
            .finally(() => setUploading(false));

        notifyPromise(promise, {
            loading: `Enviando ${filesToUpload.reduce((acc, [, arr]) => acc + arr.length, 0)} arquivo(s)...`,
            success: "Documentos enviados com sucesso!",
            error: (err: Error) => err.message || "Erro ao salvar documentos.",
        });
    };

    const addPendingFiles = (documentType: string, files: File[]) => {
        setPendingFiles(p => ({ ...p, [documentType]: [...(p[documentType] || []), ...files] }));
    };

    const removePendingFileAt = (documentType: string, index: number) => {
        setPendingFiles(p => {
            const arr = [...(p[documentType] || [])];
            arr.splice(index, 1);
            return { ...p, [documentType]: arr };
        });
    };

    const handleRemoveExisting = async (documentType: string, url: string) => {
        const promise = fetch("/api/user/documents/delete", {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ field: documentType, url }),
        })
            .then(async res => {
                if (!res.ok) {
                    const errorData = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
                    throw new Error(errorData.error || "Falha ao remover documento");
                }
                setUploadedUrls(prev => {
                    const list = prev[documentType] || [];
                    return { ...prev, [documentType]: list.filter(u => u !== url) };
                });
            })
            .catch((error: Error) => {
                console.error("Erro ao remover documento:", error);
                throw error;
            });

        notifyPromise(promise, {
            loading: "Removendo documento...",
            success: "Documento removido.",
            error: (e: Error) => e.message || "Erro ao remover documento.",
        });
    };

    // --- Profile photo upload helpers ---
    const inputProfileId = "profile-photo-input";
    const MAX_PHOTO_BYTES = 3 * 1024 * 1024; // 3MB

    const loadImage = (file: File): Promise<HTMLImageElement> => {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = reject;
            img.src = URL.createObjectURL(file);
        });
    };

    const cropToSquare = async (file: File, size = 500, mime = "image/jpeg"): Promise<Blob> => {
        const img = await loadImage(file);
        const s = Math.min(img.naturalWidth || img.width, img.naturalHeight || img.height);
        const sx = Math.max(0, Math.floor(((img.naturalWidth || img.width) - s) / 2));
        const sy = Math.max(0, Math.floor(((img.naturalHeight || img.height) - s) / 2));
        const canvas = document.createElement("canvas");
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext("2d");
        if (!ctx) throw new Error("Canvas not supported");
        ctx.drawImage(img, sx, sy, s, s, 0, 0, size, size);
        // Try multiple qualities to stay under 3MB
        const qualities = [0.92, 0.85, 0.8, 0.75, 0.7, 0.65, 0.6];
        for (const q of qualities) {
            const blob = await new Promise<Blob>((resolve, reject) =>
                canvas.toBlob(b => (b ? resolve(b) : reject(new Error("toBlob failed"))), mime, q)
            );
            if (blob.size <= MAX_PHOTO_BYTES) return blob;
        }
        // Fallback last attempt
        const fallback = await new Promise<Blob>((resolve, reject) =>
            canvas.toBlob(b => (b ? resolve(b) : reject(new Error("toBlob failed"))), mime, 0.55)
        );
        return fallback;
    };

    const handleSelectProfilePhoto = async (file: File | null) => {
        if (!file) return;
        try {
            setProfilePhotoUploading(true);
            const cropped = await cropToSquare(file, 500, "image/jpeg");
            if (cropped.size > MAX_PHOTO_BYTES) {
                notifyError("A foto final excede 3MB mesmo após compactação.");
                setProfilePhotoUploading(false);
                return;
            }

            const formData = new FormData();
            formData.append("photo", new File([cropped], "profile.jpg", { type: "image/jpeg" }));

            const promise = fetch("/api/user/profile/photo", { method: "POST", body: formData })
                .then(async res => {
                    if (!res.ok) {
                        const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
                        throw new Error(err.error || "Falha ao enviar foto de perfil.");
                    }
                    return res.json();
                })
                .then(({ url }) => {
                    setProfilePhotoUrl(url);
                })
                .finally(() => setProfilePhotoUploading(false));

            notifyPromise(promise, {
                loading: "Enviando foto de perfil...",
                success: "Foto de perfil atualizada!",
                error: (e: Error) => e.message || "Erro ao enviar foto",
            });
        } catch (e) {
            console.error(e);
            setProfilePhotoUploading(false);
            notifyError(e instanceof Error ? e.message : "Erro ao processar a imagem");
        }
    };

    const handleRemoveProfilePhoto = () => {
        setProfilePhotoRemoving(true);
        const promise = fetch("/api/user/profile/photo", { method: "DELETE" })
            .then(async res => {
                if (!res.ok) {
                    const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
                    throw new Error(err.error || "Falha ao remover foto de perfil.");
                }
                setProfilePhotoUrl(undefined);
            })
            .finally(() => setProfilePhotoRemoving(false));
        notifyPromise(promise, {
            loading: "Removendo foto de perfil...",
            success: "Foto de perfil removida.",
            error: (e: Error) => e.message || "Erro ao remover foto.",
        });
    };

    // Componente para Linha de Documento
    const DocumentRow: React.FC<{
        label: string;
        typeKey: string;
        existingUrls: string[];
        pendingFiles: File[];
        onFilesAdd: (files: File[]) => void;
        onRemovePendingAt: (index: number) => void;
        onRemoveExisting: (url: string) => void;
    }> = ({ label, typeKey, existingUrls, pendingFiles, onFilesAdd, onRemovePendingAt, onRemoveExisting }) => {
        const inputId = `doc-${typeKey}`;
        const hasExisting = existingUrls && existingUrls.length > 0;
        const hasPending = pendingFiles && pendingFiles.length > 0;
        const Icon = hasPending ? FileCheck : hasExisting ? FileCheck : UploadCloud;
        const iconColor = hasPending ? "text-green-600" : hasExisting ? "text-green-600" : "text-muted-foreground";
        const [dragOver, setDragOver] = useState(false);
        const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
        const [urlToDelete, setUrlToDelete] = useState<string | null>(null);

        const isImageUrl = (url: string) => /\.(png|jpe?g|webp|gif)$/i.test(url.split("?")[0] || "");
        const cleanUrl = (u: string) => u.split("?")[0].split("#")[0];
        const baseNameFromUrl = (url: string) => {
            try {
                const u = new URL(url);
                const href = cleanUrl(u.href);
                // Firebase Storage public URL pattern: /v0/b/<bucket>/o/<encodedPath>
                const fbMatch = href.match(/\/o\/([^?#]+)/);
                if (fbMatch && fbMatch[1]) {
                    const fullPath = decodeURIComponent(fbMatch[1]);
                    const segs = fullPath.split("/");
                    return segs[segs.length - 1] || "";
                }
                // Google Cloud Storage public URL pattern: /<bucket>/<path>
                const pathDecoded = decodeURIComponent(cleanUrl(u.pathname));
                const parts = pathDecoded.split("/");
                return parts[parts.length - 1] || "";
            } catch {
                const path = cleanUrl(url);
                const parts = decodeURIComponent(path).split("/");
                const last = parts[parts.length - 1] || "";
                // If last is an encoded full path (with %2F), decode and take last segment again
                const maybePath = decodeURIComponent(last);
                const subparts = maybePath.split("/");
                return subparts[subparts.length - 1] || last;
            }
        };
        const splitNameExt = (basename: string) => {
            const lastDot = basename.lastIndexOf(".");
            if (lastDot === -1) return { nameNoExt: basename, ext: "" };
            return { nameNoExt: basename.slice(0, lastDot), ext: basename.slice(lastDot + 1) };
        };
        const getUrlDisplay = (url: string, index: number) => {
            const base = baseNameFromUrl(url);
            const { nameNoExt, ext } = splitNameExt(base);
            const displayName = nameNoExt || `Documento ${index + 1}`;
            return { displayName, ext: (ext || "").toUpperCase() };
        };

        const acceptAndAdd = (files: File[]) => {
            const accepted: File[] = [];
            files.forEach(f => {
                if (f.size > MAX_DOC_BYTES) {
                    notifyError(`${f.name} excede 5MB e foi ignorado.`);
                } else {
                    accepted.push(f);
                }
            });
            if (accepted.length) onFilesAdd(accepted);
        };

        return (
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 py-4 border-b last:border-b-0">
                <Label htmlFor={inputId} className="w-full sm:w-1/3 font-medium text-sm shrink-0">
                    {" "}
                    {/* Ajustado texto e shrink */}
                    {label}
                </Label>
                <div className="grow flex flex-col gap-3">
                    <div
                        className={cn(
                            "flex items-center gap-3 border-2 border-dashed rounded-lg p-3",
                            uploading ? "cursor-not-allowed bg-muted/50" : "cursor-pointer hover:border-primary/50",
                            hasPending ? "border-green-600" : "border-input",
                            dragOver ? "ring-2 ring-primary/30" : "",
                            "transition-colors"
                        )}
                        onDragOver={e => {
                            e.preventDefault();
                            if (!uploading) setDragOver(true);
                        }}
                        onDragLeave={() => setDragOver(false)}
                        onDrop={e => {
                            e.preventDefault();
                            setDragOver(false);
                            if (uploading) return;
                            const items = Array.from(e.dataTransfer.files || []);
                            if (items.length) acceptAndAdd(items);
                        }}
                        onClick={() => document.getElementById(inputId)?.click()}
                    >
                        <Icon className={cn("size-6", iconColor)} />
                        <div className="text-xs">
                            <div className="font-medium">
                                {hasPending
                                    ? "Arquivos selecionados"
                                    : hasExisting
                                      ? "Adicionar mais arquivos"
                                      : "Arraste e solte ou clique para escolher"}
                            </div>
                            <div className="text-muted-foreground">Imagens ou PDF, até 5MB por arquivo.</div>
                        </div>
                        <Input
                            type="file"
                            id={inputId}
                            accept="image/*,.pdf"
                            multiple
                            className="hidden"
                            disabled={uploading}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                const list = Array.from(e.target.files ?? []);
                                if (!list.length) return;
                                acceptAndAdd(list);
                                e.currentTarget.value = "";
                            }}
                        />
                    </div>
                    {hasPending && (
                        <div>
                            <div className="text-xs font-medium mb-2">Pendentes ({pendingFiles.length})</div>
                            <div className="flex flex-wrap gap-2">
                                {pendingFiles.map((f, idx) => {
                                    const { ext } = splitNameExt(f.name);
                                    return (
                                        <div
                                            key={`${f.name}-${idx}`}
                                            className="flex items-center gap-2 border rounded-md px-2 py-1"
                                        >
                                            {f.type.startsWith("image/") ? (
                                                // eslint-disable-next-line @next/next/no-img-element
                                                <img
                                                    src={URL.createObjectURL(f)}
                                                    alt={f.name}
                                                    className="h-8 w-8 object-cover rounded"
                                                />
                                            ) : (
                                                <FileText className="h-4 w-4 text-muted-foreground" />
                                            )}
                                            <span className="truncate max-w-[200px] text-sm">{f.name}</span>
                                            {ext && (
                                                <span className="text-[10px] uppercase bg-muted text-muted-foreground border rounded px-1.5 py-0.5">
                                                    {ext.toUpperCase()}
                                                </span>
                                            )}
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                className="h-7 w-7 text-muted-foreground hover:text-destructive cursor-pointer"
                                                onClick={() => onRemovePendingAt(idx)}
                                                aria-label={`Remover ${f.name}`}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                    {hasExisting && (
                        <div>
                            <div className="text-xs font-medium mb-2">Enviados ({existingUrls.length})</div>
                            <div className="flex flex-wrap gap-2">
                                {existingUrls.map((url, index) => {
                                    const info = getUrlDisplay(url, index);
                                    return (
                                        <div
                                            key={index}
                                            className="flex items-center gap-2 border rounded-md px-2 py-1"
                                        >
                                            {isImageUrl(url) ? (
                                                // eslint-disable-next-line @next/next/no-img-element
                                                <img
                                                    src={url}
                                                    alt={info.displayName}
                                                    className="h-8 w-8 object-cover rounded"
                                                />
                                            ) : (
                                                <FileText className="h-4 w-4 text-muted-foreground" />
                                            )}
                                            <span className="truncate max-w-[200px] text-sm">{info.displayName}</span>
                                            {info.ext && (
                                                <span className="text-[10px] uppercase bg-muted text-muted-foreground border rounded px-1.5 py-0.5">
                                                    {info.ext}
                                                </span>
                                            )}
                                            <a
                                                href={url}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="inline-flex h-7 w-7 items-center justify-center rounded text-muted-foreground hover:text-primary"
                                                aria-label="Abrir documento"
                                            >
                                                <ExternalLink className="h-4 w-4" />
                                            </a>
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                className="h-7 w-7 text-muted-foreground hover:text-destructive cursor-pointer"
                                                onClick={() => {
                                                    setUrlToDelete(url);
                                                    setConfirmDeleteOpen(true);
                                                }}
                                                aria-label="Remover documento"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                    {!hasPending && !hasExisting && <p className="text-sm text-muted-foreground">Nenhum arquivo.</p>}
                    {/* Confirmação para remover documento enviado */}
                    <AlertDialog open={confirmDeleteOpen} onOpenChange={setConfirmDeleteOpen}>
                        <AlertDialogContent className="w-[95vw] max-w-md p-4 sm:p-6">
                            <AlertDialogHeader>
                                <AlertDialogTitle>Remover documento?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    Esta ação é permanente e apagará o arquivo selecionado. Você poderá enviar outro
                                    quando quiser.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter className="flex flex-col-reverse sm:flex-row gap-2">
                                <AlertDialogCancel className="cursor-pointer w-full sm:w-auto">
                                    Cancelar
                                </AlertDialogCancel>
                                <AlertDialogAction
                                    onClick={() => {
                                        if (urlToDelete) {
                                            onRemoveExisting(urlToDelete);
                                        }
                                        setConfirmDeleteOpen(false);
                                        setUrlToDelete(null);
                                    }}
                                    className="bg-destructive hover:bg-destructive/90 cursor-pointer w-full sm:w-auto"
                                >
                                    Remover
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </div>
            </div>
        );
    };

    // Lógica de Alteração de Senha
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
                const updatePromise = updatePassword(user, data.newPassword);
                notifyPromise(updatePromise, {
                    loading: "Atualizando senha...",
                    success: () => {
                        setIsPasswordModalOpen(false);
                        passwordForm.reset();
                        return "Senha alterada com sucesso!";
                    },
                    error: (err: unknown) => {
                        console.error("Erro ao atualizar senha:", err);
                        return (err instanceof Error ? err.message : String(err)) || "Erro ao atualizar senha.";
                    },
                });
                return "Autenticação confirmada. Atualizando...";
            },
            error: (err: unknown) => {
                console.error("Erro de reautenticação:", err);
                let code: unknown = undefined;
                if (err && typeof err === "object" && "code" in err) code = (err as { code: string }).code;
                if (code === "auth/wrong-password" || code === "auth/invalid-credential") {
                    passwordForm.setError("currentPassword", { message: "Senha atual incorreta." });
                    return "Senha atual incorreta.";
                }
                return (err instanceof Error ? err.message : String(err)) || "Erro ao verificar senha atual.";
            },
        });
    };

    // Lógica de Exclusão de Conta
    const onDeleteAccountSubmit = async (e?: React.FormEvent) => {
        e?.preventDefault();
        setDeleteError(null);
        const user = auth.currentUser;
        if (!user || !user.email) {
            notifyError("Usuário não autenticado.");
            return;
        }
        try {
            setDeletingAccount(true);
            const credential = EmailAuthProvider.credential(user.email, deletePassword);
            const promise = reauthenticateWithCredential(user, credential)
                .then(async () => {
                    const res = await fetch("/api/user/delete", { method: "DELETE" });
                    if (!res.ok) {
                        const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
                        throw new Error(err.error || "Falha ao excluir conta.");
                    }
                })
                .then(async () => {
                    try {
                        await signOut(auth);
                    } catch {
                        // ignore
                    }
                    setIsDeleteModalOpen(false);
                    setDeletePassword("");
                    router.replace("/");
                })
                .finally(() => setDeletingAccount(false));

            notifyPromise(promise, {
                loading: "Confirmando e excluindo sua conta...",
                success: "Conta excluída com sucesso.",
                error: (err: Error) => err.message || "Erro ao excluir conta.",
            });
        } catch (err) {
            setDeletingAccount(false);
            const code = (err as { code?: string } | null)?.code;
            if (code === "auth/wrong-password" || code === "auth/invalid-credential") {
                setDeleteError("Senha incorreta.");
                notifyError("Senha incorreta.");
            } else {
                notifyError(err instanceof Error ? err.message : "Erro na confirmação de senha");
            }
        }
    };

    // Renderização
    if (loadingProfile) {
        return (
            <div className="container min-h-screen mx-auto py-10 px-4 pt-20">
                {" "}
                <Card className="max-w-3xl mx-auto">
                    <CardHeader>
                        <Skeleton className="h-8 w-1/2" />
                        <Skeleton className="h-4 w-3/4 mt-2" />
                    </CardHeader>
                    <CardContent className="space-y-6 pt-6">
                        <div className="space-y-2">
                            <Skeleton className="h-4 w-1/4" />
                            <Skeleton className="h-9 w-full" />
                        </div>
                        <div className="space-y-2">
                            <Skeleton className="h-4 w-1/4" />
                            <Skeleton className="h-9 w-full" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Skeleton className="h-4 w-1/3" />
                                <Skeleton className="h-9 w-full" />
                            </div>
                            <div className="space-y-2">
                                <Skeleton className="h-4 w-1/3" />
                                <Skeleton className="h-9 w-full" />
                            </div>
                        </div>
                        <Skeleton className="h-10 w-full mt-4" />
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (apiError) {
        return (
            <div className="container mx-auto py-10 px-4 pt-20 text-center text-destructive">
                {" "}
                Erro ao carregar perfil: {apiError}. Tente recarregar.
            </div>
        );
    }

    return (
        <div className="flex container min-h-screen mx-auto py-10 px-4 pt-20">
            {" "}
            <Tabs defaultValue="conta" className="max-w-3xl mx-auto">
                <TabsList className="grid w-full grid-cols-2 mb-6">
                    {" "}
                    <TabsTrigger value="conta" className="cursor-pointer">
                        Conta
                    </TabsTrigger>
                    <TabsTrigger value="documentos" className="cursor-pointer">
                        Documentos
                    </TabsTrigger>
                </TabsList>

                {/* Aba Conta */}
                <TabsContent value="conta">
                    <Card>
                        <CardHeader>
                            <CardTitle>Dados Pessoais</CardTitle>
                            <CardDescription>Atualize suas informações de perfil.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {/* Profile photo */}
                            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-6">
                                <Avatar className="size-16">
                                    <AvatarImage src={profilePhotoUrl} alt="Foto de perfil" />
                                    <AvatarFallback>PF</AvatarFallback>
                                </Avatar>
                                <div className="flex flex-wrap items-center gap-2">
                                    <Label htmlFor={inputProfileId} className="sr-only">
                                        Selecionar foto de perfil
                                    </Label>
                                    <Input
                                        id={inputProfileId}
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={e => handleSelectProfilePhoto(e.target.files?.[0] ?? null)}
                                        disabled={profilePhotoUploading || profilePhotoRemoving}
                                    />
                                    <Button
                                        type="button"
                                        variant="outline"
                                        className="cursor-pointer"
                                        onClick={() => document.getElementById(inputProfileId)?.click()}
                                        disabled={profilePhotoUploading || profilePhotoRemoving}
                                    >
                                        {profilePhotoUploading && <Loader className="mr-2 h-4 w-4 animate-spin" />}
                                        {profilePhotoUploading ? "Enviando..." : "Alterar Foto"}
                                    </Button>
                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <Button
                                                type="button"
                                                variant="destructive"
                                                className="cursor-pointer"
                                                disabled={
                                                    profilePhotoUploading || profilePhotoRemoving || !profilePhotoUrl
                                                }
                                            >
                                                {profilePhotoRemoving && (
                                                    <Loader className="mr-2 h-4 w-4 animate-spin" />
                                                )}
                                                Remover Foto
                                            </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent className="w-[95vw] max-w-md p-4 sm:p-6 max-h-[80vh] overflow-y-auto">
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>Remover foto de perfil?</AlertDialogTitle>
                                                <AlertDialogDescription>
                                                    Esta ação apagará sua foto atual para sempre. Você pode adicionar
                                                    outra foto quando quiser.
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter className="flex flex-col-reverse sm:flex-row gap-2">
                                                <AlertDialogCancel
                                                    disabled={profilePhotoUploading || profilePhotoRemoving}
                                                    className="cursor-pointer w-full sm:w-auto"
                                                >
                                                    Cancelar
                                                </AlertDialogCancel>
                                                <AlertDialogAction
                                                    onClick={handleRemoveProfilePhoto}
                                                    disabled={profilePhotoUploading || profilePhotoRemoving}
                                                    className="bg-destructive hover:bg-destructive/90 cursor-pointer w-full sm:w-auto"
                                                >
                                                    Remover
                                                </AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                </div>
                            </div>
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
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
                                        <FormField
                                            control={form.control}
                                            name="rg"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>RG</FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            placeholder="00.000.000-0"
                                                            {...field}
                                                            value={field.value ?? ""}
                                                            onChange={e => field.onChange(formatRG(e.target.value))}
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                    <div className="flex flex-col sm:flex-row justify-end items-center gap-3 pt-4">
                                        <Dialog open={isPasswordModalOpen} onOpenChange={setIsPasswordModalOpen}>
                                            <DialogTrigger asChild>
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="lg"
                                                    className="cursor-pointer"
                                                >
                                                    Alterar Senha
                                                </Button>
                                            </DialogTrigger>
                                            <DialogContent className="w-[95vw] sm:max-w-[425px] p-4 sm:p-6 max-h-[85vh] overflow-y-auto">
                                                <DialogHeader>
                                                    <DialogTitle>Alterar Senha</DialogTitle>
                                                    <DialogDescription>
                                                        Digite sua senha atual e a nova senha desejada.
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
                                                        <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2">
                                                            <Button
                                                                type="button"
                                                                variant="outline"
                                                                onClick={() => setIsPasswordModalOpen(false)}
                                                                disabled={passwordForm.formState.isSubmitting}
                                                                className="w-full sm:w-auto cursor-pointer"
                                                            >
                                                                Cancelar
                                                            </Button>
                                                            <Button
                                                                type="submit"
                                                                disabled={passwordForm.formState.isSubmitting}
                                                                className="w-full sm:w-auto cursor-pointer"
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
                                            size="lg"
                                            className="w-full sm:w-auto font-semibold shadow-sm cursor-pointer"
                                        >
                                            {form.formState.isSubmitting && (
                                                <Loader className="mr-2 h-4 w-4 animate-spin" />
                                            )}
                                            Salvar Alterações
                                        </Button>
                                    </div>
                                    {/* Excluir conta - botão discreto + Dialog de confirmação com senha */}
                                    <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
                                        <DialogTrigger asChild>
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                className="mt-2 w-auto self-start text-sm text-muted-foreground hover:text-destructive/90 hover:bg-destructive/5 cursor-pointer"
                                            >
                                                Excluir conta
                                            </Button>
                                        </DialogTrigger>
                                        <DialogContent className="w-[95vw] sm:max-w-[425px] p-4 sm:p-6 max-h-[85vh] overflow-y-auto">
                                            <DialogHeader>
                                                <DialogTitle>Excluir conta</DialogTitle>
                                                <DialogDescription>
                                                    Esta ação é permanente e apagará seus dados, documentos e acesso.
                                                    Para confirmar, digite sua senha.
                                                </DialogDescription>
                                            </DialogHeader>
                                            <form onSubmit={onDeleteAccountSubmit} className="space-y-4">
                                                <div>
                                                    <Label htmlFor="delete-password">Senha</Label>
                                                    <div className="relative mt-1">
                                                        <Input
                                                            id="delete-password"
                                                            type={deletePasswordVisible ? "text" : "password"}
                                                            value={deletePassword}
                                                            onChange={e => setDeletePassword(e.target.value)}
                                                            required
                                                        />
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="icon"
                                                            className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 text-muted-foreground"
                                                            onClick={() => setDeletePasswordVisible(v => !v)}
                                                        >
                                                            {deletePasswordVisible ? (
                                                                <EyeOff className="h-4 w-4" />
                                                            ) : (
                                                                <Eye className="h-4 w-4" />
                                                            )}
                                                        </Button>
                                                    </div>
                                                    {deleteError && (
                                                        <p className="text-sm text-destructive mt-2">{deleteError}</p>
                                                    )}
                                                </div>
                                                <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2">
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        className="cursor-pointer w-full sm:w-auto"
                                                        onClick={() => setIsDeleteModalOpen(false)}
                                                        disabled={deletingAccount}
                                                    >
                                                        Cancelar
                                                    </Button>
                                                    <Button
                                                        type="submit"
                                                        variant="destructive"
                                                        disabled={deletingAccount}
                                                        className="cursor-pointer w-full sm:w-auto"
                                                    >
                                                        {deletingAccount && (
                                                            <Loader className="mr-2 h-4 w-4 animate-spin" />
                                                        )}
                                                        Confirmar exclusão
                                                    </Button>
                                                </DialogFooter>
                                            </form>
                                        </DialogContent>
                                    </Dialog>
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
                            {/* Document Rows */}
                            <DocumentRow
                                label="RG ou CIN"
                                typeKey="identityDoc"
                                existingUrls={uploadedUrls["identityDoc"] || []}
                                pendingFiles={pendingFiles["identityDoc"] || []}
                                onFilesAdd={fs => addPendingFiles("identityDoc", fs)}
                                onRemovePendingAt={i => removePendingFileAt("identityDoc", i)}
                                onRemoveExisting={url => handleRemoveExisting("identityDoc", url)}
                            />
                            <DocumentRow
                                label="Comprovante de Endereço"
                                typeKey="addressProof"
                                existingUrls={uploadedUrls["addressProof"] || []}
                                pendingFiles={pendingFiles["addressProof"] || []}
                                onFilesAdd={fs => addPendingFiles("addressProof", fs)}
                                onRemovePendingAt={i => removePendingFileAt("addressProof", i)}
                                onRemoveExisting={url => handleRemoveExisting("addressProof", url)}
                            />
                            <DocumentRow
                                label="Comprovante de Renda"
                                typeKey="incomeProof"
                                existingUrls={uploadedUrls["incomeProof"] || []}
                                pendingFiles={pendingFiles["incomeProof"] || []}
                                onFilesAdd={fs => addPendingFiles("incomeProof", fs)}
                                onRemovePendingAt={i => removePendingFileAt("incomeProof", i)}
                                onRemoveExisting={url => handleRemoveExisting("incomeProof", url)}
                            />
                            <DocumentRow
                                label="Certidão (Nascimento/Casamento)"
                                typeKey="bmCert"
                                existingUrls={uploadedUrls["bmCert"] || []}
                                pendingFiles={pendingFiles["bmCert"] || []}
                                onFilesAdd={fs => addPendingFiles("bmCert", fs)}
                                onRemovePendingAt={i => removePendingFileAt("bmCert", i)}
                                onRemoveExisting={url => handleRemoveExisting("bmCert", url)}
                            />

                            {userRole === "agent" && (
                                <>
                                    <div className="mt-4 mb-2 font-medium text-sm text-muted-foreground">
                                        Documentos do Corretor
                                    </div>
                                    <DocumentRow
                                        label="Foto da Carteira CRECI"
                                        typeKey="creciCardPhoto"
                                        existingUrls={uploadedUrls["creciCardPhoto"] || []}
                                        pendingFiles={pendingFiles["creciCardPhoto"] || []}
                                        onFilesAdd={fs => addPendingFiles("creciCardPhoto", fs)}
                                        onRemovePendingAt={i => removePendingFileAt("creciCardPhoto", i)}
                                        onRemoveExisting={url => handleRemoveExisting("creciCardPhoto", url)}
                                    />
                                    <DocumentRow
                                        label="Certificado CRECI"
                                        typeKey="creciCert"
                                        existingUrls={uploadedUrls["creciCert"] || []}
                                        pendingFiles={pendingFiles["creciCert"] || []}
                                        onFilesAdd={fs => addPendingFiles("creciCert", fs)}
                                        onRemovePendingAt={i => removePendingFileAt("creciCert", i)}
                                        onRemoveExisting={url => handleRemoveExisting("creciCert", url)}
                                    />
                                </>
                            )}

                            <div className="flex justify-end mt-6">
                                <Button
                                    onClick={handleSaveDocuments}
                                    className="cursor-pointer"
                                    disabled={
                                        uploading || Object.values(pendingFiles).every(arr => !arr || arr.length === 0)
                                    }
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
