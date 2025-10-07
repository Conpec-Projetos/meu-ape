import React from "react"
import { useState } from "react"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/features/sheets/sheetvisits"

import {ScrollArea} from "@/components/ui/scroll-area"

type CardReservationProps = {
    status: string;
    empreendimento: string;
    nome: string;
};

type CampoListaProps = {
  label: string;
  valor?: string;
};

function CampoLista({ label, valor }: CampoListaProps) {
  return (
    <ul className="list-none mb-5">
      <li className="font-bold text-md text-black">{label}</li>
      <li className="text-gray-600">{valor || "—"}</li>
    </ul>
  );
}

export default function CardVisits({ status, empreendimento, nome }: CardReservationProps) {
    const [open, setOpen] = useState(false)


    let statusclass = ""
    if (status==="Aguardo") statusclass = 'bg-yellow-200';
    else if (status==="Confirmado") statusclass = 'bg-green-300'
    else if (status==='Recusado') statusclass = 'bg-red-400'
    else if (status==="Finalizado") statusclass = 'bg-blue-300'

    return (
        <>
            <button className="h-40 w-[75%] flex flex-row bg-[#F2F2F2] rounded-lg border-gray-300 border-1 mt-3 mb-3 hover:bg-[#e7e7e7] transition-colors duration-150 cursor-pointer shadow-md"
                onClick={() => setOpen(!open)}> 
                
                <div className="h-full w-[15%] relative flex justify-center items-center">
                    <span className={`${statusclass} rounded-xl px-6 py-2 absolute  text-lg font-medium  border-gray-300 shadow`}> {status} </span>
                </div>
                <div className="h-full w-[75%] flex flex-row justify-center items-center gap-20">
                    <div className="flex flex-col "> 
                        <span className="mt-2 font-medium mr-auto"> Empreendimento: </span>
                        <div className=" mb-4 h-8 w-80 bg-white rounded-lg flex items-center shadow border-1 border-gray-300"> <span className="ml-3">{empreendimento}</span> </div>
                    </div>
                
                    <div className="flex flex-col">
                        <span className="mt-2  font-medium mr-auto"> Solicitante: </span>
                        <div className=" mb-4 h-8 w-80 bg-white rounded-lg flex items-center shadow border-1 border-gray-300"> <span className="ml-3 ">{nome}</span> </div>
                    </div>
                
                </div>
            </button>

            <Sheet open={open} onOpenChange={setOpen}>
                <SheetTrigger></SheetTrigger>
                    <SheetContent>
                        <SheetHeader>
                            <SheetTitle>Dados da visita </SheetTitle>
                            <div className="h-12  ">
                                <div className="h-0.5 rounded-4xl bg-gray-400">

                                </div>
                            </div>
                            <SheetDescription>
                                <ScrollArea className="h-200 w-full rounded-md border p-4">
                                    <div>
                                        <CampoLista label="Status" valor={status}></CampoLista>
                                        <CampoLista label="Nome do imóvel" valor={status}></CampoLista>
                                        <CampoLista label="Bloco" valor={status}></CampoLista>
                                        <CampoLista label="Unidade" valor={status}></CampoLista>
                                        <CampoLista label="Nome do corretor" valor={status}></CampoLista>
                                        <CampoLista label="CRECI do corretor" valor={status}></CampoLista>
                                        <CampoLista label="Telefone do corretor" valor={status}></CampoLista>
                                        <CampoLista label="Nome do imóvel" valor={status}></CampoLista>
                                        <CampoLista label="Horários solicitados" valor={status}></CampoLista>
                                        <CampoLista label="Horário final" valor={status}></CampoLista>
                                        <CampoLista label="Mensagem" valor={status}></CampoLista>
                                        <CampoLista label="Criado em" valor={status}></CampoLista>

                                    </div>
                                </ScrollArea>               
                            </SheetDescription>
                        </SheetHeader>
                </SheetContent>
            </Sheet>
        </>
    )
}
