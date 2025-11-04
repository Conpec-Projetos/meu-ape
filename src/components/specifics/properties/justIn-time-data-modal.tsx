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
import { userDataSchema } from "@/schemas/jitModalSchema";
import { notifyPromise } from "@/services/notificationService";
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
    const [selectedFiles, setSelectedFiles] = useState<Record<string, boolean>>({});
    const [fileInputKeys, setFileInputKeys] = useState<Record<string, number>>({});

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
        watch,
        reset,
        formState: { errors },
    } = form;

    useEffect(() => {
        if (isOpen) {
            reset();
            setSelectedFiles({});
        }
    }, [isOpen, reset]);

    useEffect(() => {
        if (isOpen) {
            const originalStyle = window.getComputedStyle(document.body).overflow;
            document.body.style.overflow = "hidden";
            return () => {
                document.body.style.overflow = originalStyle;
            };
        }
    }, [isOpen]);

    const handleFormSubmit = async (data: UserDataForm) => {
        setIsUploading(true);

        console.log(data);
        const dataFields: Record<string, string> = {};
        const fileFields: Record<string, FileList> = {};

        Object.entries(data).forEach(([key, value]) => {
            if (value instanceof FileList && value.length > 0) {
                fileFields[key] = value;
            } else if (typeof value === "string" && value.trim() !== "") {
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

        if (Object.keys(fileFields).length > 0) {
            const formData = new FormData();
            Object.entries(fileFields).forEach(([fieldName, fileList]) => {
                Array.from(fileList).forEach(file => {
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
        const isSelected = selectedFiles[field];

        if (config.type === "file") {
            const fileList = watch(field as keyof UserDataForm) as FileList | undefined;
            const fileName = fileList?.[0]?.name;

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
                                    className={`relative group flex flex-col items-center justify-center space-y-2 border-2 rounded-lg p-4 border-dashed min-h-[120px] w-full ${isUploading ? "cursor-not-allowed bg-muted/50" : "cursor-pointer hover:border-primary/50"}
                                   ${isSelected ? "border-green-600" : fieldError ? "border-destructive" : "border-input"} transition-colors`}
                                >
                                    <div className="flex flex-col items-center space-y-2 text-center">
                                        {isSelected ? (
                                            <FileCheck className="text-green-600 size-8" />
                                        ) : fieldError ? (
                                            <FileWarning className="text-destructive size-8" />
                                        ) : (
                                            <FileText className="text-muted-foreground size-8" />
                                        )}
                                        <span
                                            className={`text-sm font-medium ${fieldError ? "text-destructive" : isSelected ? "text-green-700" : "text-muted-foreground"}`}
                                        >
                                            {config.label}
                                        </span>
                                        {fileName && (
                                            <span className="text-xs text-foreground truncate max-w-[200px]">
                                                {fileName}
                                            </span>
                                        )}
                                    </div>
                                    {isSelected && (
                                        <button
                                            type="button"
                                            className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity bg-black/60 text-white text-xs px-2 py-1 rounded cursor-pointer"
                                            onClick={e => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                setSelectedFiles(prev => ({ ...prev, [field]: false }));
                                                setValue(field as keyof UserDataForm, null as unknown as FileList, {
                                                    shouldValidate: true,
                                                });
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
                                className="hidden"
                                disabled={isUploading}
                                {...register(field as keyof UserDataForm, {
                                    onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
                                        const file = e.target.files?.[0];
                                        setSelectedFiles(prev => ({ ...prev, [field]: !!file }));
                                        setValue(field as keyof UserDataForm, e.target.files as FileList | null, {
                                            shouldValidate: true,
                                        });
                                    },
                                })}
                            />
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
                <Card className="p-6 overflow-auto max-h-[90vh] max-w-full">
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
