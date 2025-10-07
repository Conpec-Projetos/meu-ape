"use client";
import CardReservations from "@/components/ui/cardreservations";
import CardVisits from "@/components/ui/cardvisits";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState } from "react";

const requests = [
    { status: "Aguardo", empreendimento: "Loja", nome: "Bruno" },
    { status: "Confirmado", empreendimento: "Shopping", nome: "Maria" },
    { status: "Recusado", empreendimento: "Centro", nome: "Carlos" },
    { status: "Confirmado", empreendimento: "AAAAAA", nome: "BBBBB" },
    { status: "Confirmado", empreendimento: "AAAAAA", nome: "BBBBB" },
    { status: "Confirmado", empreendimento: "AAAAAA", nome: "BBBBB" },
    { status: "Confirmado", empreendimento: "AAAAAA", nome: "BBBBB" },
];

const visits = [
    { status: "Aguardo", empreendimento: "Loja", nome: "Bruno" },
    { status: "Confirmado", empreendimento: "Shopping", nome: "Maria" },
    { status: "Recusado", empreendimento: "Centro", nome: "Carlos" },
    { status: "Confirmado", empreendimento: "AAAAAA", nome: "BBBBB" },
    { status: "Confirmado", empreendimento: "AAAAAA", nome: "BBBBB" },
    { status: "Finalizado", empreendimento: "AAAAAA", nome: "BBBBB" },
    { status: "Confirmado", empreendimento: "AAAAAA", nome: "BBBBB" },
    { status: "Confirmado", empreendimento: "AAAAAA", nome: "BBBBB" },
];

export default function Reserve() {
    const [visibleCount, setVisibleCount] = useState(4);

    const handleLoadMore = () => {
        setVisibleCount(prev => prev + 2);
    };

    return (
        <div className="mt-7 ml-5">
            <Tabs defaultValue="visitas" className="w-full">
                <TabsList className="mb-4 mt-8 ml-60 h-12 w-80 border-1 ">
                    <TabsTrigger value="visitas" className="text-sm font-semibold">Visitas</TabsTrigger>
                    <TabsTrigger value="reservas" className="text-sm font-semibold">Reservas</TabsTrigger>
                </TabsList>

                {/* Visitas */}
                <TabsContent value="visitas">
                    <div className="flex flex-col gap-2 items-center">
                        {visits.slice(0, visibleCount).map((visit, index) => (
                            <CardVisits
                                key={index}
                                status={visit.status}
                                empreendimento={visit.empreendimento}
                                nome={visit.nome}
                            />
                        ))}
                        {visibleCount < requests.length && (
                            <button
                                onClick={handleLoadMore}
                                className=" justify-center flex items-center border-1 font-semibold border-gray-400 bg-black text-white  hover:w-[160px] hover:h-[41px] transition-all duration-200 rounded-md mb-4 h-[35px] w-[150px]"
                            >
                                Carregar mais
                            </button>
                        )}
                    </div>
                </TabsContent>

                {/* Reservas */}
                <TabsContent value="reservas">
                    <div className="flex flex-col gap-2 items-center">
                        {requests.slice(0, visibleCount).map((request, index) => (
                            <CardReservations
                                key={index}
                                status={request.status}
                                empreendimento={request.empreendimento}
                                nome={request.nome}
                            />
                        ))}
                        {visibleCount < requests.length && (
                            <button
                                onClick={handleLoadMore}
                                className=" justify-center flex items-center border-1 font-semibold border-gray-400 bg-black text-white  hover:w-[160px] hover:h-[41px] transition-all duration-150 rounded-md mb-4 h-[35px] w-[150px]"
                            >
                                Carregar mais
                            </button>
                        )}
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}
