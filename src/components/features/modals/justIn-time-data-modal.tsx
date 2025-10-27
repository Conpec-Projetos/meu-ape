import { Button } from "@/components/features/buttons/default-button";
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
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
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
    onSubmit: () => void; // Called after successful data submission
}

// Map field names to human-readable labels and component types
const fieldConfig: Record<
    string,
    { label: string; type: "text" | "tel" | "file"; placeholder?: string; accept?: string }
> = {
    fullName: { label: "Nome Completo", type: "text", placeholder: "Ex: Peter Parker" },
    cpf: { label: "CPF", type: "text", placeholder: "XXX.XXX.XXX-XX" },
    address: { label: "Endereço", type: "text", placeholder: "Rua, Nº, Bairro, Cidade - UF" },
    phone: { label: "Telefone", type: "tel", placeholder: "(DD) XXXXX-XXXX" },
    addressProof: { label: "Comprovante de Endereço", type: "file", accept: "image/*,.pdf" },
    incomeProof: { label: "Comprovante de Renda", type: "file", accept: "image/*,.pdf" },
    identityDoc: { label: "Documento de Identidade (RG/CIN)", type: "file", accept: "image/*,.pdf" },
    bmCert: { label: "Certidão de Nascimento ou Casamento", type: "file", accept: "image/*,.pdf" },
};

export function JustInTimeDataModal({ missingFields, onClose, onSubmit, isOpen }: JustInTimeDataModalProps) {
    const [isUploading, setIsUploading] = useState(false);
    // State to track selected files for UI feedback
    const [selectedFiles, setSelectedFiles] = useState<Record<string, boolean>>({});

    // Dynamically create the Zod schema based on missing fields
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
        reValidateMode: "onChange", // Provide feedback as user types
    });

    const {
        register,
        handleSubmit,
        setValue,
        watch,
        reset,
        formState: { errors },
    } = form;

    // Reset form and file selection state when modal opens/closes
    useEffect(() => {
        if (isOpen) {
            reset();
            setSelectedFiles({});
        }
    }, [isOpen, reset]);

    // Scroll locking effect
    useEffect(() => {
        if (isOpen) {
            const originalStyle = window.getComputedStyle(document.body).overflow;
            document.body.style.overflow = "hidden";
            return () => {
                document.body.style.overflow = originalStyle;
            };
        }
    }, [isOpen]);

    // Handle form submission
    const handleFormSubmit = async (data: UserDataForm) => {
        setIsUploading(true);

        console.log(data);
        const dataFields: Record<string, string> = {};
        const fileFields: Record<string, FileList> = {};

        // Separate data and file fields
        Object.entries(data).forEach(([key, value]) => {
            if (value instanceof FileList && value.length > 0) {
                fileFields[key] = value;
            } else if (typeof value === 'string' && value.trim() !== '') {
                dataFields[key] = value;
            }
        });

        // Create Promises for API Calls
        const promises: Promise<Response>[] = [];

        // Promise for updating profile data (if any)
        if (Object.keys(dataFields).length > 0) {
            promises.push(
                fetch("/api/user/profile", {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(dataFields),
                })
            );
        }

        // Promise for uploading documents (if any)
        if (Object.keys(fileFields).length > 0) {
            const formData = new FormData();
            Object.entries(fileFields).forEach(([fieldName, fileList]) => {
                 Array.from(fileList).forEach((file) => {
                     formData.append(fieldName, file, file.name);
                 })
            });

            promises.push(
                fetch("/api/user/documents/upload", {
                    method: "POST",
                    body: formData,
                })
            );
        }

        // Create the combined promise with .finally() attached
        const combinedPromise = Promise.all(promises)
            .finally(() => { // <-- Move finally here
                setIsUploading(false);
            });

        // Execute Promises and Handle Results using notifyPromise 
        notifyPromise(combinedPromise, {
            loading: "Salvando informações...",
            success: (responses) => {
                const allOk = responses.every(res => res.ok);
                if (allOk) {
                    onSubmit();
                    return "Informações salvas com sucesso!";
                } else {
                    const failedResponse = responses.find(res => !res.ok);
                    console.error("API Error:", failedResponse?.status, failedResponse?.statusText); // Log status too
                    throw new Error("Erro ao salvar algumas informações. Verifique os dados e tente novamente.");
                }
            },
            error: (err) => {
                console.error("Submit Error:", err);
                return err.message || "Ocorreu um erro inesperado. Tente novamente.";
            }
        });
    };

    // Function to render the correct input based on field type
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
                           {/* Make Label the direct child of FormControl */}
                           <FormControl>
                               <Label // <-- Label is now the direct child
                                   htmlFor={field}
                                   className={`flex flex-col items-center justify-center space-y-2 border-2 rounded-lg p-4 border-dashed min-h-[120px] w-full ${isUploading ? "cursor-not-allowed bg-muted/50" : "cursor-pointer hover:border-primary/50"}
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
                                       <span className={`text-sm font-medium ${fieldError ? 'text-destructive' : isSelected ? 'text-green-700' : 'text-muted-foreground'}`}>
                                           {config.label}
                                       </span>
                                       {fileName && (
                                           <span className="text-xs text-foreground truncate max-w-[200px]">
                                               {fileName}
                                           </span>
                                       )}
                                   </div>
                               </Label>
                           </FormControl>
                           {/* Input remains outside FormControl but linked via htmlFor */}
                           <Input
                               type="file"
                               id={field}
                               accept={config.accept}
                               className="hidden" // Keep it hidden, Label handles interaction
                               disabled={isUploading}
                               {...register(field as keyof UserDataForm, {
                                    onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
                                       const file = e.target.files?.[0];
                                       setSelectedFiles(prev => ({ ...prev, [field]: !!file }));
                                       setValue(field as keyof UserDataForm, e.target.files as FileList | null, { shouldValidate: true });
                                   },
                               })}
                           />
                           <FormMessage className="text-center" />
                       </FormItem>
                   )}
               />
           );
       } else {
            // Render text or tel inputs
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
                                    {...formField}
                                    disabled={isUploading}
                                    value={(formField.value as string) || ""} // Ensure value is controlled
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
            );
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={open => !open && onClose()}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle className="text-center text-xl font-semibold">Complete suas informações</DialogTitle>
                    <DialogDescription className="text-center text-muted-foreground">
                        Por favor, preencha os campos obrigatórios para continuar.
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    {/* Wrap form content in a scrollable area if it overflows */}
                    <form
                        onSubmit={handleSubmit(handleFormSubmit)}
                        className="space-y-4 max-h-[60vh] overflow-y-auto px-1 py-4" // Added scroll
                    >
                        {/* Render fields dynamically */}
                        {missingFields.map(field => renderFormField(field))}

                        <DialogFooter className="mt-6 pt-4 border-t sticky bottom-0 bg-background">
                            <Button type="button" variant="outline" onClick={onClose} disabled={isUploading}>
                                Cancelar
                            </Button>
                            <Button type="submit" disabled={isUploading} className="min-w-[120px]">
                                {isUploading ? <Loader className="animate-spin size-4" /> : "Salvar e Continuar"}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
