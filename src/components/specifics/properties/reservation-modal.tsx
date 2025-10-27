'use client';

import { Card, CardContent, CardHeader } from "@/components/features/cards/default-card";
import { Button } from "@/components/features/buttons/default-button";
import { useEffect, useState } from "react";
import React from "react";
import { toast } from "sonner";
import { Unit } from "@/interfaces/unit";
import { Loader, SquareCheck, SquareX } from "lucide-react";
import { Property } from "@/interfaces/property";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/firebase/firebase-config";
import { Checkbox } from "@/components/features/checkboxes/default-checkbox";

interface ReservationModalProps {
    unit: Unit;
    property: Property;
    onClose: () => void;
    onSubmit: () => void;
    isOpen: boolean;
}

export function ReservationModal({ onClose, unit, property, onSubmit, isOpen }: ReservationModalProps) {
    const [clientName, setClientName] = useState<string>("");
    const [haveFiles, setHaveFiles] = useState<{
        addressProof: boolean;
        incomeProof: boolean;
        identityDoc: boolean;
        marriageCert: boolean;
    }>({
        addressProof: false,
        incomeProof: false,
        identityDoc: false,
        marriageCert: false,
    });
    const [termsAccepted, setTermsAccepted] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState<boolean>(false);

    useEffect(() => {
        if(isOpen){
            const originalStyle = window.getComputedStyle(document.body).overflow;

            // Lock scroll
            document.body.style.overflow = "hidden";

            // On cleanup, unlock scroll
            return () => {
            document.body.style.overflow = originalStyle;
            };            
        }

    }, [isOpen]);

    useEffect(() => {
        if (!isOpen) {
            setTermsAccepted(false);
        }
    }, [isOpen]);   

    useEffect(() => {
        const user = auth.currentUser;

        const userDocRef = doc(db, "users", user?.uid || "");
        getDoc(userDocRef).then((docSnap) => {
            if (docSnap.exists()) {
            const userData = docSnap.data();

            setClientName(userData?.fullName || "");

            const filesStatus = {
                addressProof: !!userData?.documents || !!userData?.documents.addressProof,
                incomeProof: !!userData?.documents || !!userData?.documents.incomeProof,
                identityDoc: !!userData?.documents || !!userData?.documents.identityDoc,
                marriageCert: !!userData?.documents || !!userData?.documents.marriageCert,
            };

            setHaveFiles(filesStatus);
            }
        });
    }, []);

    const handleReserve = async () => {
        if (!haveFiles.addressProof || !haveFiles.incomeProof || !haveFiles.identityDoc || !haveFiles.marriageCert) {
            toast.error("Por favor, envie todos os documentos necessários antes de reservar a unidade.");
            return;
        }
        if (!termsAccepted) {
            toast.error("Por favor, aceite os termos e condições antes de reservar a unidade.");
            return;
        }

        try {
            setIsLoading(true);
            const res = await fetch('/api/reservas', {
                method: 'POST',
                headers: {
                'Content-Type': 'application/json',
                },
                body: JSON.stringify({ unitId: unit.id, propertyId: property.id }),
            });

            const data = await res.json();

            if (res.ok) {
                toast.success("Sua solicitação de reserva foi enviada e está em análise!");
                onSubmit();

            } else {
                console.error(data);
                toast.error("Esta unidade não está mais disponível");
            }
        } catch (err) {
            console.error(err);
            toast.error("Erro de conexão com o servidor");
        } finally {
            setIsLoading(false);
        }
    };

    if(!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 overflow-auto p-4">
            <div className="relative max-w-full max-h-full w-full sm:w-[90%] lg:w-[850px]">
                <Card className="p-6 overflow-auto max-h-[90vh] max-w-full">

                    <CardHeader>
                        <h2 className="text-lg font-bold text-center">
                            Reserve a unidade {unit.block ? `Bloco ${unit.block}` : ''} {unit.identifier} no {property.name}
                        </h2>
                    </CardHeader>
                    <CardContent className="overflow-auto p-6 flex-1">
                        <p className="mb-4"> <span className="font-bold">Imóvel: </span> {property.name}</p>
                        <p className="mb-4"> <span className="font-bold">Unidade: </span> {unit.block ? `Bloco ${unit.block}` : ''} {unit.identifier}</p>
                        <p className="mb-4"> <span className="font-bold">Nome do Requerente: </span> {clientName}</p>

                        <div className="mb-4">
                            <h3 className="font-bold mb-2">Documentos enviados:</h3>
                            <ul className="list-none list-inside">
                                <li >
                                    {haveFiles.addressProof ? (
                                        <SquareCheck className="inline h-5 w-5 text-green-600 mr-1" />
                                    ) : (
                                        <SquareX className="inline h-5 w-5 text-red-600 mr-1" />
                                    )}
                                    Comprovante de Endereço
                                </li>
                                <li>
                                    {haveFiles.incomeProof ? (
                                        <SquareCheck className="inline h-5 w-5 text-green-600 mr-1" />
                                    ) : (
                                        <SquareX className="inline h-5 w-5 text-red-600 mr-1" />
                                    )}
                                    Comprovante de Renda
                                </li>
                                <li>
                                    {haveFiles.identityDoc ? (
                                        <SquareCheck className="inline h-5 w-5 text-green-600 mr-1" />
                                    ) : (
                                        <SquareX className="inline h-5 w-5 text-red-600 mr-1" />
                                    )}
                                    Documento de Identidade
                                </li>
                                <li>
                                    {haveFiles.marriageCert ? (
                                        <SquareCheck className="inline h-5 w-5 text-green-600 mr-1" />
                                    ) : (
                                        <SquareX className="inline h-5 w-5 text-red-600 mr-1" />
                                    )}
                                    Certidão de Casamento
                                </li>
                            </ul>
                        </div>

                        <div className="mt-4 flex items-center justify-start gap-3">
                            <Checkbox
                                id="terms"
                                className="border border-black"
                                checked={termsAccepted}
                                onCheckedChange={(checked) => setTermsAccepted(!!checked)}
                            />
                            <label htmlFor="terms" className="text-sm">
                                Aceito os <a className="text-blue-600 underline ml-1" href="https://google.com" target="_blank" rel="noopener noreferrer">termos e condições</a>
                            </label>
                        </div>

                    </CardContent>

                    <CardContent>
                        <div className="p-4 bg-white">
                                <div className="flex justify-center space-x-2">
                                    
                                    <Button
                                        onClick={onClose}
                                        variant={"outline"}
                                        disabled={isLoading}
                                    >
                                        Cancelar
                                    </Button>
                                    <Button
                                        variant={"default"}
                                        disabled={isLoading || !termsAccepted}
                                        onClick={handleReserve}
                                    >
                                        <span className={isLoading ? "invisible" : "visible"}>
                                            Enviar
                                        </span>

                                        {isLoading && (
                                            <Loader
                                            className="w-5 h-5 text-muted-foreground absolute"
                                            style={{ animation: "spin 4s linear infinite" }}
                                            />
                                        )}
                                    </Button>
                                </div>                                
                        </div>                        
                    </CardContent>

                </Card>

            </div>
        </div>
    );
}

