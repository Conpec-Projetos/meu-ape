"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { auth, db } from "@/firebase/firebase-config";
import { Unit } from "@/interfaces/unit";
import { doc, getDoc } from "firebase/firestore";
import { Bath, Bed, Car, Square } from "lucide-react";
import { CompleteInfoModal } from "../modals/complete-info-modal";
import { boolean } from "zod";
import { useEffect, useState } from "react";
import { set } from "date-fns";

interface UnitCardProps {
    unit: Unit;
}

export function UnitCard({ unit }: UnitCardProps) {
    const [completeInfoModal, setCompleteInfoModal] = useState<boolean>(false);
    const [visitModal, setVisitModal] = useState<boolean>(false);
    const [undefinedFields, setUndefinedFields] = useState<{
        fullName: boolean;
        phone: boolean;
        cpf: boolean;
        address: boolean;
    }>({fullName: false, phone: false, cpf: false, address: false});

    async function handleRequestVisitClick() {
        const user = auth.currentUser;

        const userDocRef = doc(db, "users", user?.uid || "");
        await getDoc(userDocRef).then((docSnap) => {
            if (docSnap.exists()) {
            const userData = docSnap.data();

            const missingFields = {
                fullName: !userData?.fullName,
                phone: !userData?.phone,
                cpf: !userData?.cpf,
                address: !userData?.address
            };

            setUndefinedFields(missingFields);

            const hasMissingFields = Object.values(missingFields).some((field) => field === true);

            if (!hasMissingFields) {
                // All fields are filled
                setVisitModal(true);
                alert("Todos os campos estão preenchidos. Você pode agendar a visita.");
            }

        } else {
                alert("Usuário não encontrado. Por favor, faça login novamente.");
            }
        }).catch((error: any) => {
            console.error("Erro ao buscar dados do usuário:", error);
        })

    }

    useEffect(() => {
        if ((undefinedFields.address || undefinedFields.fullName || undefinedFields.phone || undefinedFields.cpf) && !completeInfoModal) {
            setCompleteInfoModal(true);
        } 
    }, [undefinedFields]);

    useEffect(() => {
        if (!completeInfoModal){
            setUndefinedFields({fullName: false, phone: false, cpf: false, address: false});
        }
    }, [completeInfoModal]);

    return (
        <Card className="w-full shadow-md hover:shadow-lg transition-shadow border border-border/40 rounded-xl overflow-hidden">
            <CardHeader className="bg-secondary/30 p-4 border-b border-border/40">
                <CardTitle className="text-xl font-bold text-primary">Unidade {unit.identifier}</CardTitle>
            </CardHeader>
            <CardContent className="p-4 grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
                <div className="flex items-center gap-2">
                    <Square className="h-5 w-5 text-primary/80" />
                    <span className="font-medium">{unit.size} m²</span>
                </div>
                <div className="flex items-center gap-2">
                    <Bed className="h-5 w-5 text-primary/80" />
                    <span className="font-medium">{unit.bedrooms} Dorms.</span>
                </div>
                <div className="flex items-center gap-2">
                    <Bath className="h-5 w-5 text-primary/80" />
                    <span className="font-medium">{unit.baths} Banheiros</span>
                </div>
                <div className="flex items-center gap-2">
                    <Car className="h-5 w-5 text-primary/80" />
                    <span className="font-medium">{unit.garages} Vagas</span>
                </div>
            </CardContent>
            <CardFooter className="bg-secondary/30 p-4 flex flex-col items-start gap-4">
                <div className="w-full flex flex-col sm:flex-row justify-between items-center gap-3">
                    <p className="text-2xl font-extrabold text-primary">
                        {new Intl.NumberFormat("pt-BR", {
                            style: "currency",
                            currency: "BRL",
                            minimumFractionDigits: 0,
                        }).format(unit.price)}
                    </p>
                    <div className="flex gap-2 w-full sm:w-auto flex-wrap justify-end">
                        <Button variant="outline" size="sm" className="flex-1" onClick={handleRequestVisitClick}>
                            Agendar Visita
                        </Button>
                        <Button size="sm" className="flex-1">
                            Solicitar Reserva
                        </Button>
                    </div>
                </div>
            </CardFooter>

            {completeInfoModal && (
                <CompleteInfoModal
                    fullName={undefinedFields.fullName}
                    phone={undefinedFields.phone}
                    cpf={undefinedFields.cpf}
                    address={undefinedFields.address}
                    onClose={() => setCompleteInfoModal(false)}
                />
            )}
        </Card>
    );
}
