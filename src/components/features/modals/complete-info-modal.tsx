import { Card, CardContent, CardHeader } from "@/components/features/cards/default-card";
import { Input } from "@/components/features/inputs/default-input";
import { Button } from "@/components/features/buttons/default-button";
import { Label } from "@/components/features/labels/default-label";
import z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { auth, db, storage } from "@/firebase/firebase-config";
import { doc, serverTimestamp, updateDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import { FileCheck, FileText, FileWarning, Loader } from "lucide-react";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { toast } from "sonner";

interface CompleteInfoModalProps {
    fullName: boolean;
    phone: boolean;
    cpf: boolean;
    address: boolean;
    addressProof: boolean;
    incomeProof: boolean;
    identityDoc: boolean;
    marriageCert: boolean;
    onClose: () => void;
}
export function CompleteInfoModal({ fullName, phone, cpf, address, addressProof, incomeProof, identityDoc, marriageCert, onClose }: CompleteInfoModalProps) {
    useEffect(() => {
        const originalStyle = window.getComputedStyle(document.body).overflow;

        // Lock scroll
        document.body.style.overflow = "hidden";

        // On cleanup, unlock scroll
        return () => {
        document.body.style.overflow = originalStyle;
        };
    }, []);
    
    const userDataSchema = z.object({
        fullName: z.string().min(2, "Nome muito curto").nonempty("Nome completo é obrigatório"),
        cpf: z
            .string()
            .nonempty("CPF é obrigatório")
            .min(11, "CPF muito curto")
            .max(14, "CPF muito longo")
            .regex(/^\d{3}\.?\d{3}\.?\d{3}-?\d{2}$/, "CPF deve conter apenas números e pontos/hífens opcionais"),
        address: z.string().nonempty("Endereço é obrigatório").min(5, "Endereço muito curto"),
        phone: z
            .string()
            .nonempty("Telefone é obrigatório")
            .min(10, "Telefone muito curto")
            .max(15, "Telefone muito longo")
            .regex(/^\(?\d{2}\)?\s?\d{4,5}-?\d{4}$/, "Telefone deve conter apenas números e o formato (XX) XXXXX-XXXX"),
        addressProof: z
                    .any()
                    .refine(files => (files instanceof FileList || Array.isArray(files)) && files.length >= 1, {
                        message: "Comprovante de endereço obrigatório",
                    })
                    .refine(files => files[0]?.size > 0, {
                        message: "Arquivo inválido",
                    }),
        incomeProof: z
                    .any()
                    .refine(files => (files instanceof FileList || Array.isArray(files)) && files.length >= 1, {
                        message: "Comprovante de renda obrigatório",
                    })
                    .refine(files => files[0]?.size > 0, {
                        message: "Arquivo inválido",
                    }),
        identityDoc: z
                    .any()
                    .refine(files => (files instanceof FileList || Array.isArray(files)) && files.length >= 1, {
                        message: "Documento de identidade obrigatório",
                    })
                    .refine(files => files[0]?.size > 0, {
                        message: "Arquivo inválido",
                    }),
        marriageCert: z
                    .any()
                    .refine(files => (files instanceof FileList || Array.isArray(files)) && files.length >= 1, {
                        message: "Certidão de casamento obrigatória",
                    })
                    .refine(files => files[0]?.size > 0, {
                        message: "Arquivo inválido",
                    }),
    });

    const activeUserDataSchema = userDataSchema.pick({
        ...(fullName && { fullName: true }),
        ...(phone && { phone: true }),
        ...(cpf && { cpf: true }),
        ...(address && { address: true }),
        ...(addressProof && { addressProof: true }),
        ...(incomeProof && { incomeProof: true }),
        ...(identityDoc && { identityDoc: true }),
        ...(marriageCert && { marriageCert: true }),
    });

    type userDataForm = z.infer<typeof activeUserDataSchema>;

    // States para icone de arquivos
    const [addressProofSelected, setAddressProofSelected] = useState(false);
    const [incomeProofSelected, setIncomeProofSelected] = useState(false);
    const [identityDocSelected, setIdentityDocSelected] = useState(false);
    const [marriageCertSelected, setMarriageCertSelected] = useState(false);

    // Status do upload
    const [isUploading, setIsUploading] = useState(false);
    

    const {
        register,
        handleSubmit,
        setValue,
        watch,
        formState: { errors },
    } = useForm<userDataForm>({
        mode: "onSubmit", // validação ao enviar
        reValidateMode: "onSubmit", // revalida apenas ao enviar
        resolver: zodResolver(activeUserDataSchema),
    });

    async function onSubmit(data: userDataForm) {
        console.log("Dados do formulário:", data);

        setIsUploading(true);
        const user = auth.currentUser;

        const userDocRef = doc(db, "users", user?.uid || "");

        // Upload files
        const filesToUpload: { [key: string]: FileList | undefined } = {
            addressProof: data.addressProof as FileList,
            incomeProof: data.incomeProof as FileList,
            identityDoc: data.identityDoc as FileList,
            marriageCert: data.marriageCert as FileList,
        };
        const uploadPromises = Object.entries(filesToUpload).map(async ([key, fileList]) => {
            if (fileList && fileList.length > 0) {
                const urls: string[] = [];
                const files: File[] = Array.from(fileList) as File[];
                for (const file of files) {
                    const storageRef = ref(storage, `clientFiles/${user?.uid}/${file.name}`);
                    await uploadBytes(storageRef, file);
                    const url = await getDownloadURL(storageRef);
                    urls.push(url);
                }
                await updateDoc(userDocRef, { [`documents.${key}`]: urls });
            }
        });

        // Wait for all file uploads to finish
        await Promise.all(uploadPromises);


        // Upload data
        const userData = { ...data, updatedAt: serverTimestamp() };
        delete userData.addressProof;
        delete userData.incomeProof;
        delete userData.identityDoc;
        delete userData.marriageCert;

        const dataUpdatePromises = Object.entries(userData).map(([key, value]) => {
            return updateDoc(userDocRef, { [key]: value });
        });

        await Promise.all(dataUpdatePromises);

        
        setIsUploading(false);
        toast.success("Informações atualizadas com sucesso!");
        onClose();
    }



    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
            <Card className="p-6 w-full max-w-md">
                <CardHeader>
                    <h2 className="text-lg font-bold text-center">Complete suas informações</h2>
                    <p className="text-sm">Por favor, preencha todas as informações necessárias para continuar.</p>
                </CardHeader>
                <CardContent className="overflow-y-auto max-h-[400px] p-6">
                    <form className="flex flex-col items-center gap-4 " onSubmit={handleSubmit(onSubmit)}>
                        <div className={`w-full ${ fullName ? "block" : "hidden" }`}>
                            <div className="space-y-2">
                                <Label htmlFor="name">Nome Completo</Label>
                                <Input 
                                    id="name"
                                    placeholder="Ex: Peter Parker"
                                    {...register("fullName")}
                                />
                            </div>
                            {(fullName && errors.fullName) && (
                                <span className="text-sm text-red-600">*{errors.fullName.message}</span>
                            )}
                        </div>

                        <div className={`w-full ${ phone ? "block" : "hidden" }`}>
                            <div className="space-y-2">
                                <Label htmlFor="phone">Telefone</Label>
                                <Input 
                                    type="tel"
                                        id="phone"
                                        {...register("phone")}
                                        placeholder="(DD) X XXXXX-XXXX"
                                />
                            </div>
                            {(phone && errors.phone) && (
                                <span className="text-sm text-red-600">*{errors.phone.message}</span>
                            )}                            
                        </div>

                        <div className={`w-full ${ cpf ? "block" : "hidden" }`}>
                            <div className="space-y-2">
                                <Label htmlFor="cpf">CPF</Label>
                                <Input 
                                    id="cpf"
                                    {...register("cpf")}
                                    placeholder="XXX.XXX.XXX-XX"
                                />
                            </div>

                            {(cpf && errors.cpf) && (
                                <span className="text-sm text-red-600">*{errors.cpf.message}</span>
                            )}                            
                        </div>

                        <div className={`w-full ${ address ? "block" : "hidden" }`}>
                            <div className="space-y-2">
                                <Label htmlFor="address">Endereço</Label>
                                <Input 
                                    id="address"
                                    {...register("address")}
                                    placeholder="Rua, Nº"
                                />
                            </div>

                            {(address && errors.address) && (
                                <span className="text-sm text-red-600">*{errors.address.message}</span>
                            )}                          
                        </div>

                        <div className={`col-span-1 md:col-span-2 mt-4 ${ (addressProof || incomeProof || identityDoc || marriageCert) ? "block" : "hidden" }`}>
                            <Label className="text-md">Documentos</Label>

                            {(errors.addressProof || errors.incomeProof || errors.identityDoc || errors.marriageCert) && (
                                <span className="text-sm text-red-600">*Documento obrigatório</span>
                            )}
                            <div className="flex flex-col md:flex-row gap-10 justify-center items-center flex-wrap">
                                <div className={`${ addressProof ? "block" : "hidden" }`}>
                                    <Label
                                        htmlFor="addressProof"
                                        className={`flex flex-col flex-1 items-center justify-between space-y-2 border rounded-lg p-4 border-dashed w-30 min-h-40 ${isUploading ? "cursor-not-allowed" : "cursor-pointer"}
                                                        ${addressProofSelected ? "border-green-600" : errors.addressProof ? "border-red-600" : "border-gray-300"}
                                                    `}
                                    >
                                        <div className="flex flex-col items-center space-y-2">
                                            {addressProofSelected ? (
                                                <FileCheck className="text-green-600" width={40} height={40} />
                                            ) : errors.addressProof ? (
                                                <FileWarning className="text-red-600" width={40} height={40} />
                                            ) : (
                                                <FileText className="text-gray-500" width={40} height={40} />
                                            )}

                                            <span className="text-center text-sm">Comprovante de Endereço</span>
                                        </div>
                                        <div className="flex flex-col items-center space-y-1">
                                            {watch("addressProof")?.[0] &&
                                                Array.from(watch("addressProof") as FileList).map((file: File) => (
                                                    <span key={file.name} className="text-center text-sm">
                                                        {file.name}
                                                    </span>
                                                ))}
                                        </div>
                                    </Label>

                                    <Input
                                        type="file"
                                        multiple
                                        id="addressProof"
                                        accept="image/*,.pdf"
                                        {...register("addressProof", {
                                            onChange: e => {
                                                const file = e.target.files?.[0];
                                                setAddressProofSelected(!!file);
                                                // Important: setValue to keep RHF in sync and trigger validation
                                                setValue("addressProof", e.target.files, { shouldValidate: true });
                                            },
                                        })}
                                        className="hidden"
                                        disabled={isUploading}
                                    />                                    
                                </div>  

                                <div className={`${ incomeProof ? "block" : "hidden" }`}>
                                    <Label
                                        htmlFor="incomeProof"
                                        className={`flex flex-col flex-1 items-center justify-between space-y-2 border rounded-lg p-4 border-dashed w-30 min-h-40 ${isUploading ? "cursor-not-allowed" : "cursor-pointer"}
                                                        ${incomeProofSelected ? "border-green-600" : errors.incomeProof ? "border-red-600" : "border-gray-300"}
                                                    `}
                                    >
                                        <div className="flex flex-col items-center space-y-2">
                                            {incomeProofSelected ? (
                                                <FileCheck className="text-green-600" width={40} height={40} />
                                            ) : errors.incomeProof ? (
                                                <FileWarning className="text-red-600" width={40} height={40} />
                                            ) : (
                                                <FileText className="text-gray-500" width={40} height={40} />
                                            )}

                                            <span className="text-center text-sm">Comprovante de Renda</span>
                                        </div>
                                        <div className="flex flex-col items-center space-y-1">
                                            {watch("incomeProof")?.[0] &&
                                                Array.from(watch("incomeProof") as FileList).map((file: File) => (
                                                    <span key={file.name} className="text-center text-sm">
                                                        {file.name}
                                                    </span>
                                                ))}
                                        </div>
                                    </Label>

                                    <Input
                                        type="file"
                                        multiple
                                        id="incomeProof"
                                        accept="image/*,.pdf"
                                        {...register("incomeProof", {
                                            onChange: e => {
                                                const file = e.target.files?.[0];
                                                setIncomeProofSelected(!!file);
                                                // Important: setValue to keep RHF in sync and trigger validation
                                                setValue("incomeProof", e.target.files, { shouldValidate: true });
                                            },
                                        })}
                                        className="hidden"
                                        disabled={isUploading}
                                    />                                    
                                </div>

                                <div className={`${ identityDoc ? "block" : "hidden" }`}>
                                    <Label
                                        htmlFor="identityDoc"
                                        className={`flex flex-col flex-1 items-center justify-between space-y-2 border rounded-lg p-4 border-dashed w-30 min-h-40 ${isUploading ? "cursor-not-allowed" : "cursor-pointer"}
                                                        ${identityDocSelected ? "border-green-600" : errors.identityDoc ? "border-red-600" : "border-gray-300"}
                                                    `}
                                    >
                                        <div className="flex flex-col items-center space-y-2">
                                            {identityDocSelected ? (
                                                <FileCheck className="text-green-600" width={40} height={40} />
                                            ) : errors.identityDoc ? (
                                                <FileWarning className="text-red-600" width={40} height={40} />
                                            ) : (
                                                <FileText className="text-gray-500" width={40} height={40} />
                                            )}

                                            <span className="text-center text-sm">RG ou CIN</span>
                                        </div>
                                        <div className="flex flex-col items-center space-y-1">
                                            {watch("identityDoc")?.[0] &&
                                                Array.from(watch("identityDoc") as FileList).map((file: File) => (
                                                    <span key={file.name} className="text-center text-sm">
                                                        {file.name}
                                                    </span>
                                                ))}
                                        </div>
                                    </Label>

                                    <Input
                                        type="file"
                                        multiple
                                        id="identityDoc"
                                        accept="image/*,.pdf"
                                        {...register("identityDoc", {
                                            onChange: e => {
                                                const file = e.target.files?.[0];
                                                setIdentityDocSelected(!!file);
                                                // Important: setValue to keep RHF in sync and trigger validation
                                                setValue("identityDoc", e.target.files, { shouldValidate: true });
                                            },
                                        })}
                                        className="hidden"
                                        disabled={isUploading}
                                    />                                    
                                </div>   

                                <div className={`${ marriageCert ? "block" : "hidden" }`}>
                                    <Label
                                        htmlFor="marriageCert"
                                        className={`flex flex-col flex-1 items-center justify-between space-y-2 border rounded-lg p-4 border-dashed w-30 min-h-40 ${isUploading ? "cursor-not-allowed" : "cursor-pointer"}
                                                        ${marriageCertSelected ? "border-green-600" : errors.marriageCert ? "border-red-600" : "border-gray-300"}
                                                    `}
                                    >
                                        <div className="flex flex-col items-center space-y-2">
                                            {marriageCertSelected ? (
                                                <FileCheck className="text-green-600" width={40} height={40} />
                                            ) : errors.marriageCert ? (
                                                <FileWarning className="text-red-600" width={40} height={40} />
                                            ) : (
                                                <FileText className="text-gray-500" width={40} height={40} />
                                            )}

                                            <span className="text-center text-sm">Comprovante de Casamento</span>
                                        </div>
                                        <div className="flex flex-col items-center space-y-1">
                                            {watch("marriageCert")?.[0] &&
                                                Array.from(watch("marriageCert") as FileList).map((file: File) => (
                                                    <span key={file.name} className="text-center text-sm">
                                                        {file.name}
                                                    </span>
                                                ))}
                                        </div>
                                    </Label>

                                    <Input
                                        type="file"
                                        multiple
                                        id="marriageCert"
                                        accept="image/*,.pdf"
                                        {...register("marriageCert", {
                                            onChange: e => {
                                                const file = e.target.files?.[0];
                                                setMarriageCertSelected(!!file);
                                                // Important: setValue to keep RHF in sync and trigger validation
                                                setValue("marriageCert", e.target.files, { shouldValidate: true });
                                            },
                                        })}
                                        className="hidden"
                                        disabled={isUploading}
                                    />                                    
                                </div>   

                                
                            </div>
                        </div>

                        <div className="flex justify-center gap-2">
                            <Button
                                onClick={onClose}
                                variant={"outline"}
                                disabled={isUploading}
                            >
                                Cancelar
                            </Button>
                            <Button
                                variant={"default"}
                                disabled={isUploading}
                                type="submit"
                            >
                                {/* Texto sempre presente, invisível durante loading */}
                                <span className={isUploading ? "invisible" : "visible"}>
                                    Salvar
                                </span>

                                {/* Loader aparece sobre o texto */}
                                {isUploading && (
                                    <Loader
                                    className="w-5 h-5 text-muted-foreground absolute"
                                    style={{ animation: "spin 4s linear infinite" }}
                                    />
                                )}
                            </Button>
                        </div>
                    </form>                    
                </CardContent>

            </Card>
        </div>
    );
}

