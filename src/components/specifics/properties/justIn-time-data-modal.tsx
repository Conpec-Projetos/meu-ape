import { Button } from "@/components/features/buttons/default-button";
import { Card, CardContent, CardHeader } from "@/components/features/cards/default-card";
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
import { lockBodyScroll, unlockBodyScroll } from "@/lib/scrollLock";
import { cn } from "@/lib/utils";
import { userDataSchema } from "@/schemas/jitModalSchema";
import { notifyError, notifyPromise } from "@/services/notificationService";
import { zodResolver } from "@hookform/resolvers/zod";
import { FileCheck, FileText, FileWarning, Loader } from "lucide-react";
import React, { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

interface JustInTimeDataModalProps {
    missingFields: string[];
    isOpen: boolean;
    onClose: () => void;
    onSubmit: () => void;
}

const fieldConfig: Record<
    string,
    { label: string; type: "text" | "tel" | "file"; placeholder?: string; accept?: string }
> = {
    fullName: { label: "Nome Completo", type: "text", placeholder: "Ex: Peter Parker" },
    cpf: { label: "CPF", type: "text", placeholder: "000.000.000-00" },
    address: { label: "Endereço", type: "text", placeholder: "Rua Nº - Bairro, Cidade - UF" },
    phone: { label: "Telefone", type: "tel", placeholder: "(DD) 00000-0000" },
    addressProof: { label: "Comprovante de Endereço", type: "file", accept: "image/*,.pdf" },
    incomeProof: { label: "Comprovante de Renda", type: "file", accept: "image/*,.pdf" },
    identityDoc: { label: "Documento de Identidade (RG/CIN)", type: "file", accept: "image/*,.pdf" },
    bmCert: { label: "Certidão de Nascimento ou Casamento", type: "file", accept: "image/*,.pdf" },
};

export function JustInTimeDataModal({ missingFields, onClose, onSubmit, isOpen }: JustInTimeDataModalProps) {
    const [isUploading, setIsUploading] = useState(false);
    // Force reset of file inputs when removing all files of a field
    const [fileInputKeys, setFileInputKeys] = useState<Record<string, number>>({});
    const MAX_DOC_BYTES = 5 * 1024 * 1024; // 5MB (mesmo limite da página de perfil)
    const [pendingFiles, setPendingFiles] = useState<Record<string, File[]>>({});
    const [dragOver, setDragOver] = useState<Record<string, boolean>>({});

    const activeSchema = useMemo(() => {
        type SchemaKeys = keyof typeof userDataSchema.shape;
        const pickFields: Partial<Record<SchemaKeys, true>> = {};
        missingFields.forEach(field => {
            if (field in userDataSchema.shape) {
                pickFields[field as SchemaKeys] = true;
            }
        });
        return userDataSchema.pick(pickFields);
    }, [missingFields]);

    type UserDataForm = z.infer<typeof activeSchema>;

    const form = useForm<UserDataForm>({
        resolver: zodResolver(activeSchema),
        mode: "onSubmit",
        reValidateMode: "onChange",
    });

    const {
        register,
        handleSubmit,
        setValue,
        reset,
        formState: { errors },
    } = form;

    useEffect(() => {
        if (isOpen) {
            reset();
            setPendingFiles({});
        }
    }, [isOpen, reset]);

    // Sincroniza o RHF com os arquivos pendentes após render para evitar setState durante render do Controller
    useEffect(() => {
        missingFields.forEach(field => {
            if (fieldConfig[field]?.type === "file") {
                const files = pendingFiles[field] || [];
                setValue(field as keyof UserDataForm, files as unknown as File[], { shouldValidate: true });
            }
        });
    }, [pendingFiles, missingFields, setValue]);

    useEffect(() => {
        if (isOpen) {
            lockBodyScroll();
            return () => unlockBodyScroll();
        }
    }, [isOpen]);

    const handleFormSubmit = async (data: UserDataForm) => {
        setIsUploading(true);

        console.log(data);
        const dataFields: Record<string, string> = {};

        Object.entries(data).forEach(([key, value]) => {
            if (typeof value === "string" && value.trim() !== "") {
                dataFields[key] = value;
            }
        });

        const promises: Promise<Response>[] = [];

        if (Object.keys(dataFields).length > 0) {
            promises.push(
                fetch("/api/user/profile", {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(dataFields),
                })
            );
        }

        if (Object.values(pendingFiles).some(arr => arr && arr.length)) {
            const formData = new FormData();
            Object.entries(pendingFiles).forEach(([fieldName, files]) => {
                (files || []).forEach(file => {
                    formData.append(fieldName, file, file.name);
                });
            });

            promises.push(
                fetch("/api/user/documents/upload", {
                    method: "POST",
                    body: formData,
                })
            );
        }

        const combinedPromise = Promise.all(promises).finally(() => {
            setIsUploading(false);
        });

        notifyPromise(combinedPromise, {
            loading: "Salvando informações...",
            success: responses => {
                const allOk = responses.every(res => res.ok);
                if (allOk) {
                    setPendingFiles({});
                    onSubmit();
                    return "Informações salvas com sucesso!";
                } else {
                    const failedResponse = responses.find(res => !res.ok);
                    console.error("API Error:", failedResponse?.status, failedResponse?.statusText);
                    throw new Error("Erro ao salvar algumas informações. Verifique os dados e tente novamente.");
                }
            },
            error: err => {
                console.error("Submit Error:", err);
                return err.message || "Ocorreu um erro inesperado. Tente novamente.";
            },
        });
    };

    const renderFormField = (field: string) => {
        const config = fieldConfig[field];
        if (!config) return null;

        const fieldError = errors[field as keyof UserDataForm];

        if (config.type === "file") {
            const files: File[] = pendingFiles[field] || [];
            const hasFiles = files.length > 0;

            const isImage = (f: File) => (f?.type || "").startsWith("image/");

            const acceptAndAdd = (incoming: File[]) => {
                if (!incoming.length) return;
                setPendingFiles(prev => {
                    const current = prev[field] || [];
                    const next: File[] = [...current];
                    incoming.forEach(f => {
                        if (f.size > MAX_DOC_BYTES) {
                            notifyError(`${f.name} excede 5MB e foi ignorado.`);
                            return;
                        }
                        const exists = next.some(
                            x => x.name === f.name && x.size === f.size && x.lastModified === f.lastModified
                        );
                        if (!exists) next.push(f);
                    });
                    return { ...prev, [field]: next };
                });
            };

            return (
                <FormField
                    key={field}
                    control={form.control}
                    name={field as keyof UserDataForm}
                    render={() => (
                        <FormItem className="w-full text-center">
                            <FormControl>
                                <Label
                                    htmlFor={field}
                                    className={cn(
                                        "relative group flex flex-col items-center justify-center space-y-2 border-2 rounded-lg p-4 border-dashed min-h-[140px] w-full transition-colors",
                                        isUploading
                                            ? "cursor-not-allowed bg-muted/50"
                                            : "cursor-pointer hover:border-primary/50",
                                        hasFiles
                                            ? "border-green-600"
                                            : fieldError
                                              ? "border-destructive"
                                              : "border-input",
                                        dragOver[field] ? "ring-2 ring-primary/30" : ""
                                    )}
                                    onDragOver={e => {
                                        e.preventDefault();
                                        if (!isUploading) setDragOver(prev => ({ ...prev, [field]: true }));
                                    }}
                                    onDragLeave={() => setDragOver(prev => ({ ...prev, [field]: false }))}
                                    onDrop={e => {
                                        e.preventDefault();
                                        setDragOver(prev => ({ ...prev, [field]: false }));
                                        if (isUploading) return;
                                        const items = Array.from(e.dataTransfer.files || []);
                                        acceptAndAdd(items);
                                    }}
                                >
                                    <div className="flex flex-col items-center space-y-2 text-center">
                                        {hasFiles ? (
                                            <FileCheck className="text-green-600 size-8" />
                                        ) : fieldError ? (
                                            <FileWarning className="text-destructive size-8" />
                                        ) : (
                                            <FileText className="text-muted-foreground size-8" />
                                        )}
                                        <span
                                            className={`text-sm font-medium ${fieldError ? "text-destructive" : hasFiles ? "text-green-700" : "text-muted-foreground"}`}
                                        >
                                            {config.label}
                                        </span>
                                        <span className="text-xs text-muted-foreground">
                                            Arraste e solte ou clique para escolher. Imagens ou PDF, até 5MB por
                                            arquivo.
                                        </span>
                                        {hasFiles && (
                                            <span className="text-xs text-foreground">
                                                {files.length} arquivo(s) selecionado(s)
                                            </span>
                                        )}
                                    </div>
                                    {hasFiles && (
                                        <button
                                            type="button"
                                            className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity bg-black/60 text-white text-xs px-2 py-1 rounded cursor-pointer"
                                            onClick={e => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                setPendingFiles(prev => ({ ...prev, [field]: [] }));
                                                setFileInputKeys(prev => ({
                                                    ...prev,
                                                    [field]: (prev[field] || 0) + 1,
                                                }));
                                            }}
                                        >
                                            Remover
                                        </button>
                                    )}
                                </Label>
                            </FormControl>
                            <Input
                                key={`file-${field}-${fileInputKeys[field] || 0}`}
                                type="file"
                                id={field}
                                accept={config.accept}
                                multiple
                                className="hidden"
                                disabled={isUploading}
                                {...register(field as keyof UserDataForm, {
                                    onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
                                        const incoming = e.target.files ? Array.from(e.target.files) : [];
                                        acceptAndAdd(incoming);
                                        // Reset input so selecting the same file again retriggers onChange in some browsers
                                        e.currentTarget.value = "";
                                    },
                                })}
                            />
                            {/* Lista de arquivos selecionados com opção de remover individualmente */}
                            {hasFiles && (
                                <div className="mt-3 grid gap-2 text-left grid-cols-1">
                                    {files.map((f, idx) => (
                                        <div
                                            key={`${f.name}-${idx}`}
                                            className="flex items-center gap-3 rounded-md border p-2 text-sm"
                                        >
                                            {isImage(f) ? (
                                                // eslint-disable-next-line @next/next/no-img-element
                                                <img
                                                    src={URL.createObjectURL(f)}
                                                    alt={f.name}
                                                    className="h-10 w-10 object-cover rounded"
                                                />
                                            ) : (
                                                <FileText className="h-4 w-4 text-muted-foreground" />
                                            )}
                                            <div className="flex-1 min-w-0">
                                                <div className="truncate">{f.name}</div>
                                                <div className="text-[10px] uppercase text-muted-foreground">
                                                    {(f.name.split(".").pop() || "").toUpperCase()}
                                                </div>
                                            </div>
                                            <button
                                                type="button"
                                                className="text-xs text-destructive hover:underline cursor-pointer"
                                                onClick={() => {
                                                    setPendingFiles(prev => {
                                                        const current = (prev[field] || []).slice();
                                                        current.splice(idx, 1);
                                                        if (current.length === 0) {
                                                            setFileInputKeys(prev2 => ({
                                                                ...prev2,
                                                                [field]: (prev2[field] || 0) + 1,
                                                            }));
                                                        }
                                                        return { ...prev, [field]: current };
                                                    });
                                                }}
                                            >
                                                Remover
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                            <FormMessage className="text-center" />
                        </FormItem>
                    )}
                />
            );
        } else {
            return (
                <FormField
                    key={field}
                    control={form.control}
                    name={field as keyof UserDataForm}
                    render={({ field: formField }) => (
                        <FormItem className="w-full">
                            <FormLabel>{config.label}</FormLabel>
                            <FormControl>
                                <Input
                                    type={config.type}
                                    placeholder={config.placeholder}
                                    value={(formField.value as string) || ""}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                        const v = e.target.value || "";
                                        let next = v;
                                        if (field === "cpf") {
                                            const digits = v.replace(/\D/g, "").slice(0, 11);
                                            next = digits
                                                .replace(/(\d{3})(\d)/, "$1.$2")
                                                .replace(/(\d{3})(\d)/, "$1.$2")
                                                .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
                                        } else if (field === "phone") {
                                            const digits = v.replace(/\D/g, "").slice(0, 11);
                                            if (digits.length <= 10) {
                                                // (##) ####-####
                                                next = digits
                                                    .replace(/(\d{2})(\d)/, "($1) $2")
                                                    .replace(/(\d{4})(\d)/, "$1-$2");
                                            } else {
                                                // (##) #####-####
                                                next = digits
                                                    .replace(/(\d{2})(\d)/, "($1) $2")
                                                    .replace(/(\d{5})(\d)/, "$1-$2");
                                            }
                                        }
                                        formField.onChange(next);
                                    }}
                                    disabled={isUploading}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
            );
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 overflow-auto p-4">
            <div className="relative max-w-full max-h-full w-full sm:w-[90%] lg:w-[650px]">
                <Card className="p-4 overflow-auto max-h-[90vh] max-w-full">
                    <CardHeader>
                        <h2 className="text-center text-xl font-semibold">Complete suas informações</h2>
                        <p className="text-center text-muted-foreground">
                            Por favor, preencha os campos obrigatórios para continuar.
                        </p>
                    </CardHeader>

                    <CardContent>
                        <Form {...form}>
                            {/* Conteúdo do formulário com rolagem quando necessário */}
                            <form
                                onSubmit={handleSubmit(handleFormSubmit)}
                                className="space-y-4 max-h-[60vh] overflow-y-auto px-1 py-4"
                            >
                                {/* Renderiza campos dinamicamente agrupados */}
                                {(() => {
                                    const textFields = missingFields.filter(f => fieldConfig[f]?.type !== "file");
                                    const fileFields = missingFields.filter(f => fieldConfig[f]?.type === "file");
                                    return (
                                        <>
                                            {textFields.map(field => renderFormField(field))}
                                            {fileFields.length > 0 && (
                                                <div className="pt-4">
                                                    <h4 className="text-sm font-semibold mb-2">Documentos</h4>
                                                    <div className="grid gap-3">
                                                        {fileFields.map(field => renderFormField(field))}
                                                    </div>
                                                </div>
                                            )}
                                        </>
                                    );
                                })()}

                                {/* Footer fixo alinhado ao padrão dos outros modais */}
                                <div className="mt-6 pt-4 border-t sticky -bottom-4 bg-background flex justify-end gap-2">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={onClose}
                                        disabled={isUploading}
                                        className="cursor-pointer"
                                    >
                                        Cancelar
                                    </Button>
                                    <Button
                                        type="submit"
                                        disabled={isUploading}
                                        className="min-w-[140px] cursor-pointer"
                                    >
                                        {isUploading ? (
                                            <Loader className="animate-spin size-4" />
                                        ) : (
                                            "Salvar e Continuar"
                                        )}
                                    </Button>
                                </div>
                            </form>
                        </Form>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
