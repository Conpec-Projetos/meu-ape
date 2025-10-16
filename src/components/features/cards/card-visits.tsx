import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/features/sheets/sheet-visits";
import { useState } from "react";

type CardReservationProps = {
    status: string;
    empreendimento: string;
    nome: string;
};

export default function CardVisits({ status, empreendimento, nome }: CardReservationProps) {
    const [open, setOpen] = useState(false);

    let statusclass = "";
    if (status === "Aguardo") statusclass = "bg-yellow-200";
    else if (status === "Confirmado") statusclass = "bg-green-300";
    else if (status === "Recusado") statusclass = "bg-red-400";
    else if (status === "Finalizado") statusclass = "bg-blue-300";

    return (
        <>
            <button
                className="h-40 w-[75%] flex flex-row bg-[#F2F2F2] rounded-lg mt-3 mb-3 hover:bg-[#e7e7e7] cursor-pointer shadow-xl"
                onClick={() => setOpen(!open)}
            >
                <div className="h-full w-[15%] relative flex justify-center items-center">
                    <span
                        className={`${statusclass} rounded-xl px-6 py-2 absolute  text-lg font-medium border-2 border-gray-300 shadow`}
                    >
                        {" "}
                        {status}{" "}
                    </span>
                </div>
                <div className="h-full w-[75%] flex flex-row justify-center items-center gap-20">
                    <div className="flex flex-col ">
                        <span className="mt-2 font-medium mr-auto"> Empreendimento: </span>
                        <div className=" mb-4 h-8 w-80 bg-white rounded-lg flex items-center shadow">
                            {" "}
                            <span className="ml-3">{empreendimento}</span>{" "}
                        </div>
                    </div>

                    <div className="flex flex-col">
                        <span className="mt-2  font-medium mr-auto"> Solicitante: </span>
                        <div className=" mb-4 h-8 w-80 bg-white rounded-lg flex items-center shadow">
                            {" "}
                            <span className="ml-3 ">{nome}</span>{" "}
                        </div>
                    </div>
                </div>
            </button>

            <Sheet open={open} onOpenChange={setOpen}>
                <SheetTrigger></SheetTrigger>
                <SheetContent>
                    <SheetHeader>
                        <SheetTitle>Dados da visita </SheetTitle>
                        <div className="h-12  ">
                            <div className="h-0.5 rounded-4xl bg-gray-400 "></div>
                        </div>
                        <SheetDescription>
                            <ul className="space-y-4 font-normal">
                                <li>
                                    • Status:{" "}
                                    <span
                                        className={`${statusclass} rounded-xl px-1 py-0.5  text-sm ml-2  font-medium border-2 border-gray-300 shadow`}
                                    >
                                        {" "}
                                        {status}{" "}
                                    </span>
                                </li>
                                <li>
                                    • <span className="font-semibold underline">Especificações do imóvel </span>{" "}
                                </li>
                                <ul className="ml-5 space-y-2">
                                    <li>
                                        ‣ Nome do imóvel: <span className="font-bold"> {empreendimento} </span>
                                    </li>
                                    <li>‣ Bloco:</li>
                                    <li>‣ Unidade:</li>
                                </ul>

                                <li>
                                    • <span className="font-semibold underline">Corretor:</span>
                                </li>
                                <ul className="ml-5 space-y-2">
                                    <li>
                                        ‣ Nome do corretor: <span className="font-bold ">{nome}</span>
                                    </li>
                                    <li>‣ CRECI: </li>
                                    <li>‣ Email: </li>
                                    <li>‣ Telefone:</li>
                                </ul>
                                <li>• Horários solicitados: </li>
                                <li>• Horário final:</li>
                                <li>• Mensagem:</li>
                                <li>• Criado em:</li>
                                <li>• Alteração em:</li>
                            </ul>
                        </SheetDescription>
                    </SheetHeader>
                </SheetContent>
            </Sheet>
        </>
    );
}
