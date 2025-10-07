import { Card, CardContent, CardHeader } from "@/components/features/cards/default-card";
import { useState } from "react";
import { Input } from "@/components/features/inputs/default-input";
import { Button } from "@/components/features/buttons/default-button";
import { Label } from "@/components/features/labels/default-label";
import z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { auth, db } from "@/firebase/firebase-config";
import { doc, updateDoc } from "firebase/firestore";

interface CompleteInfoModalProps {
    fullName: boolean;
    phone: boolean;
    cpf: boolean;
    address: boolean;
    onClose?: () => void;
}
export function CompleteInfoModal({ fullName, phone, cpf, address, onClose }: CompleteInfoModalProps) {
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
    });

    const activeUserDataSchema = userDataSchema.pick({
        ...(fullName && { fullName: true }),
        ...(phone && { phone: true }),
        ...(cpf && { cpf: true }),
        ...(address && { address: true }),
    });

    type userDataForm = z.infer<typeof activeUserDataSchema>;

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

    function onSubmit(data: userDataForm) {
        console.log("Dados do formulário:", data);

        const user = auth.currentUser;

        const userDocRef = doc(db, "users", user?.uid || "");

        Object.entries(data).forEach(([key, value]) => {
            updateDoc(userDocRef, { [key]: value });
        });

        if (onClose) onClose();
    }



    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
            <Card className="p-6 w-full max-w-md">
                <CardHeader>
                    <h2 className="text-lg font-bold text-center">Complete suas informações</h2>
                    <p className="text-sm">Por favor, preencha todas as informações necessárias para agendar uma visita.</p>
                </CardHeader>
                <CardContent>
                    <form className="grid grid-cols-1 gap-4 " onSubmit={handleSubmit(onSubmit)}>
                        <div>
                            {fullName && (
                                <div className="space-y-2">
                                    <Label htmlFor="name">Nome Completo</Label>
                                    <Input 
                                        id="name"
                                        placeholder="Ex: Peter Parker"
                                        {...register("fullName")}
                                    />
                                </div>
                            )}
                            {(fullName && errors.fullName) && (
                                <span className="text-sm text-red-600">*{errors.fullName.message}</span>
                            )}
                        </div>
                        
                        <div>
                            {phone && (
                                <div className="space-y-2">
                                    <Label htmlFor="phone">Telefone</Label>
                                    <Input 
                                        type="tel"
                                        id="phone"
                                        {...register("phone")}
                                        placeholder="(DD) X XXXXX-XXXX"
                                    />
                                </div>
                            )}
                            {(phone && errors.phone) && (
                                <span className="text-sm text-red-600">*{errors.phone.message}</span>
                            )}                            
                        </div>

                        <div>
                            {cpf && (
                                <div className="space-y-2">
                                    <Label htmlFor="cpf">CPF</Label>
                                    <Input 
                                        id="cpf"
                                        {...register("cpf")}
                                        placeholder="XXX.XXX.XXX-XX"
                                    />
                                </div>
                            )}
                            {(cpf && errors.cpf) && (
                                <span className="text-sm text-red-600">*{errors.cpf.message}</span>
                            )}                            
                        </div>

                        <div>
                            {address && (
                                <div className="space-y-2">
                                    <Label htmlFor="address">Endereço</Label>
                                    <Input 
                                        id="address"
                                        {...register("address")}
                                        placeholder="Rua, Nº"
                                    />
                                </div>
                            )}
                            {(address && errors.address) && (
                                <span className="text-sm text-red-600">*{errors.address.message}</span>
                            )}                            
                        </div>


                        <div className="flex justify-center gap-2">
                            <Button
                                onClick={onClose}
                                variant={"outline"}
                            >
                                Cancelar
                            </Button>
                            <Button
                                type="submit"
                                variant={"default"}
                            >
                                Salvar
                            </Button>
                        </div>
                    </form>                    
                </CardContent>

            </Card>
        </div>
    );
}

