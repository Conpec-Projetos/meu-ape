'use client';

import { Card, CardContent, CardHeader } from "@/components/features/cards/default-card";
import { Button } from "@/components/features/buttons/default-button";
import { useEffect, useState } from "react";
import React from "react";
import { toast } from "sonner";
import { Unit } from "@/interfaces/unit";
import { Loader } from "lucide-react";
import { Property } from "@/interfaces/property";
import { notifyError } from "@/services/notificationService";

interface VisitModalProps {
    unit: Unit;
    property: Property;
    onClose: () => void;
    onSubmit: () => void;
    isOpen: boolean;
}

const getNextDays = (): string[] => {
    const today = new Date();
    const days = [];
    for (let i = 1; i < 15; i++) {
        const nextDay = new Date(today);
        nextDay.setDate(today.getDate() + i);

        const dayName = nextDay.toLocaleDateString('pt-BR', { weekday: 'short' });
        const dayNumber = nextDay.getDate();
        const month = nextDay.toLocaleDateString('pt-BR', { month: '2-digit' });

        // Format the day as "seg. 01/01"
        const formattedDay = `${dayName} ${dayNumber.toString().padStart(2, '0')}/${month.toString().padStart(2, '0')}`;

        days.push(formattedDay);
    }
    return days;
};

const times = Array.from({ length: 20 }, (_, i) => {
  const hour = 8 + Math.floor(i / 2);
  const minutes = i % 2 === 0 ? '00' : '30';
  return `${hour.toString().padStart(2, '0')}:${minutes}`;
});

export function VisitModal({ onClose, unit, property, onSubmit, isOpen }: VisitModalProps) {
    const [step, setStep] = useState(1);

    const nextStep = () => setStep((prev) => Math.min(prev + 1, 2)); // assume 2 steps
    const prevStep = () => setStep((prev) => Math.max(prev - 1, 1));

    const [selected, setSelected] = useState<Record<string, boolean>>({});
    const days = getNextDays();

    const toggleCell = (day: string, time: string) => {
        const key = `${day}-${time}`;

        setSelected(prev => ({
            ...prev,
            [key]: !prev[key],
        }));
        
    };

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

    const [loading, setLoading] = useState(false);
    const handleSave = async () => {
        const selectedSlots = Object.entries(selected)
            .filter(([_, isSelected]) => isSelected)
            .map(([key, _]) => key);

        if (selectedSlots.length === 0) {
            toast.error("Por favor, selecione ao menos um horário para a visita");
        } else {
            try {
                setLoading(true);
                const res = await fetch('/api/requests/visit', {
                    method: 'POST',
                    headers: {
                    'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ requestedSlots: selectedSlots, property: property, unit: unit }),
                });

                const data = await res.json();

                if (res.ok) {
                    toast.success("Sua solicitação foi enviada!");
                    onSubmit();

                } else {
                    console.error(data);
                    if(res.status == 409){
                        notifyError("Você já possui uma solicitação para este imóvel");

                    } else {
                        notifyError(data.error);
                    }
                }
            } catch (err) {
                console.error(err);
                notifyError("Erro de conexão com o servidor");
            } finally {
                setLoading(false);
            }
        }

    }

    function parseDateTime(str: string) {
        // Exemplo: "dom. 05/10-12:00"
        // Remove "dom. " -> "05/10-12:00"
        const parts = str.split(' ')[1]; // "05/10-12:00"
        const [datePart, timePart] = parts.split('-'); // "05/10" e "12:00"
        const [day, month] = datePart.split('/').map(Number);
        const [hour, minute] = timePart.split(':').map(Number);

        return { day, month, hour, minute };
    }

    // Função de comparação para sort
    function compareDateTime(a: [string, boolean], b: [string, boolean]) {
        const d1 = parseDateTime(a[0]);
        const d2 = parseDateTime(b[0]);

        if (d1.month !== d2.month) return d1.month - d2.month;
        if (d1.day !== d2.day) return d1.day - d2.day;
        if (d1.hour !== d2.hour) return d1.hour - d2.hour;
        return d1.minute - d2.minute;
    }

    useEffect(() => {
        if (!isOpen) {
            setSelected({});
            setStep(1);          
        }
    }, [isOpen]);


    if(!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 overflow-auto p-4">
            <div className="relative max-w-full max-h-full w-full sm:w-[90%] lg:w-[850px]">
                <Card className="p-6 overflow-auto max-h-[90vh] max-w-full">

                    <CardHeader>
                        <h2 className="text-lg font-bold text-center">
                            {step === 1 ? 'Selecione as datas e horários disponíveis para a visita' : 'Confirme os horários selecionados'}
                        </h2>
                    </CardHeader>
                    {/* Step 1: Select Date and Time */}
                    {step === 1 && (
                        <CardContent className="overflow-auto p-6 flex-1">
                            <table className="min-w-full border-collapse border border-gray-300 mb-3">
                                <thead>
                                    <tr>
                                        <th className="border border-gray-300 bg-gray-100 text-center font-semibold py-2">Horário</th>
                                        {days.map(day => (
                                            <th key={day} className="border border-gray-300 bg-gray-100 p-0.5 text-center font-semibold py-2">
                                                {day}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {times.map(time => (
                                        <tr key={time}>
                                            <td className="border border-gray-300 bg-gray-50 text-right pr-2 text-sm font-mono select-none">
                                                {time}
                                            </td>
                                            {days.map(day => {
                                                const key = `${day}-${time}`;
                                                const isSelected = (selected[key]);
                                                return (
                                                    <td
                                                        key={key}
                                                        onClick={() => toggleCell(day, time)}
                                                        className={`border border-gray-300 cursor-pointer transition-colors duration-150 ${
                                                            (isSelected ? 'bg-green-500' : 'bg-white hover:bg-green-100')
                                                        }`}
                                                        style={{ height: '30px' }}
                                                        title={`${day} ${time}`}
                                                    />
                                                );
                                            })}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>


                        </CardContent>
                    )}
                    
                    {/* Step 2: Review and Confirm */}
                    {step === 2 && (
                        <CardContent className="overflow-auto p-6 flex-1">
                            <h3 className="text-md mb-5"> <span className="font-bold">{property.name}</span> - {unit.block ? `Bloco ${unit.block}` : ''} Unidade {unit.identifier}</h3>
                            <h3 className="text-md font-semibold mb-4">Horários Selecionados:</h3>
                            {Object.entries(selected).sort(compareDateTime).filter(([_, isSelected]) => isSelected).length === 0 ? (
                                <p>Nenhum horário selecionado.</p>
                            ) : (
                                <ul className="list-disc list-inside space-y-1">
                                    {Object.entries(selected).sort(compareDateTime).filter(([_, isSelected]) => isSelected).map(([key]) => (
                                        <li
                                            key={key}
                                            className="border border-black bg-green-50 text-green-900 px-3 py-2 rounded flex justify-between items-center"
                                            >
                                            <span className="text-md font-medium">{key.replace('-', ' às ')}</span>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </CardContent>
                    )}

                    <CardContent>
                        <div className="p-4 bg-white">
                            {step == 1 && (
                                <div className="flex justify-center space-x-2">
                                    
                                    <Button
                                        onClick={onClose}
                                        variant={"outline"}
                                    >
                                        Cancelar
                                    </Button>
                                    <Button
                                        onClick={nextStep}
                                        variant={"default"}
                                    >
                                        Confirmar
                                    </Button>
                                </div>                                
                            )}
                            {step == 2 && (
                                <div className="flex justify-center space-x-2">
                                    <Button
                                        onClick={prevStep}
                                        variant={"outline"}
                                        disabled={loading}
                                    >
                                        Voltar
                                    </Button>
                                    <Button
                                        onClick={handleSave}
                                        variant={"default"}
                                        disabled={loading}
                                    >
                                        {/* Texto sempre presente, invisível durante loading */}
                                        <span className={loading ? "invisible" : "visible"}>
                                            Enviar
                                        </span>

                                        {/* Loader aparece sobre o texto */}
                                        {loading && (
                                            <Loader
                                            className="w-5 h-5 text-muted-foreground absolute"
                                            style={{ animation: "spin 4s linear infinite" }}
                                            />
                                        )}
                                    </Button>
                                </div>                                
                            )}

                        </div>                        
                    </CardContent>

                </Card>

            </div>
        </div>
    );
}

