import React, { useEffect, useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/features/sheets/sheetvisits";
import { ScrollArea } from "@/components/ui/scroll-area";
import { getVisitsRequests } from "@/firebase/dashboard/service";
import { VisitRequest } from "@/interfaces/visitRequest";
import { Timestamp } from "firebase-admin/firestore";

type CardVisitsProps = {
  status: string;
  empreendimento: string;
  nome: string;
  visit: VisitRequest;
};

type CampoListaProps = {
  label: string;
  valor?: string | string[] | Date | Timestamp | (Date | Timestamp)[];
};

function CampoLista({ label, valor }: CampoListaProps) {
  let displayValue: string;

  if (!valor) {
    displayValue = "—";
  } else if (valor instanceof Date) {
    displayValue = valor.toLocaleString("pt-BR");
  } else if (Array.isArray(valor)) {
    displayValue = valor.join(", ");
  } else if ((valor as any).seconds !== undefined) {
    const timestamp = valor as Timestamp;
    displayValue = new Date(timestamp.seconds * 1000).toLocaleString("pt-BR");
  } else {
    displayValue = valor.toString();
  }

  return (
    <ul className="list-none mb-5">
      <li className="font-bold text-md text-black">{label}</li>
      <li className="text-gray-600">{displayValue}</li>
    </ul>
  );
}

export default function CardVisits({ status, empreendimento, nome, visit }: CardVisitsProps) {
  const [open, setOpen] = useState(false);
  const [visits, setVisits] = useState<VisitRequest[]>([]);
  const [selectedVisit, setSelectedVisit] = useState<VisitRequest | null>(null);

  useEffect(() => {
    getVisitsRequests(setVisits).then((res) => console.log(res));
  }, []);

  let statusclass = "";
  if (status === "Aguardo") statusclass = "bg-yellow-200";
  else if (status === "Confirmado") statusclass = "bg-green-300";
  else if (status === "Recusado") statusclass = "bg-red-400";
  else if (status === "Finalizado") statusclass = "bg-blue-300";

  return (
    <>
      {/* --- Botão Principal --- */}
      <button
        className="flex flex-col sm:flex-row items-center justify-between
                   bg-[#F2F2F2] rounded-lg border border-gray-300 
                   mt-3 mb-3 hover:bg-[#e7e7e7] transition-colors duration-150 
                   cursor-pointer shadow-md w-full sm:w-[90%] md:w-[95%] p-4"
        onClick={() => {
          setOpen(!open);
          setSelectedVisit(visit);
        }}
      >
        {/* Status */}
        <div className="flex justify-center items-center w-full sm:w-[20%] mb-3 sm:mb-0">
          <span
            className={`${statusclass} rounded-xl px-6 py-2 text-base sm:text-md sm: font-medium border border-gray-300 shadow`}
          >
            {status}
          </span>
        </div>

        {/* Informações */}
        <div className="flex flex-col sm:flex-row justify-center items-center gap-6 sm:gap-8 lg:gap-20 w-full sm:w-[75%]">
          <div className="flex flex-col w-full sm:w-auto">
            <span className="font-medium mr-auto text-sm sm:text-base">
              Empreendimento:
            </span>
            <div className="mb-2 sm:mb-4 h-8 sm:h-9 bg-white rounded-lg flex items-center shadow border border-gray-300 w-full sm:w-45 lg:w-80 px-3">
              <span className="truncate">{empreendimento}</span>
            </div>
          </div>

          <div className="flex flex-col w-full sm:w-auto">
            <span className="font-medium mr-auto text-sm sm:text-base">
              Solicitante:
            </span>
            <div className="mb-2 sm:mb-4 h-8 sm:h-9 bg-white rounded-lg flex items-center shadow border border-gray-300 w-full sm:w-45 lg:w-80 px-3">
              <span className="truncate">{nome}</span>
            </div>
          </div>
        </div>
      </button>

      {/* --- Sheet com detalhes --- */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger></SheetTrigger>
        <SheetContent className="max-w-full sm:max-w-[480px]">
          <SheetHeader>
            <SheetTitle>Dados da visita</SheetTitle>
            <div className="h-12">
              <div className="h-0.5 rounded-4xl bg-gray-400"></div>
            </div>
            <SheetDescription>
              <ScrollArea className="h-125 w-full rounded-md border overflow-y-auto overflow-x-auto p-4">
                {selectedVisit ? (
                  <div>
                    <CampoLista label="Status" valor={selectedVisit.status} />
                    <CampoLista label="Nome do imóvel" valor={selectedVisit.propertyName} />
                    <CampoLista label="Bloco" valor={selectedVisit.propertyBlock} />
                    <CampoLista label="Unidade" valor={selectedVisit.propertyUnit} />
                    <CampoLista label="Nome do corretor" valor={selectedVisit.agentsName} />
                    <CampoLista label="CRECI do corretor" valor={selectedVisit.agentsCreci} />
                    <CampoLista label="Telefone do corretor" valor={selectedVisit.agentsPhone} />
                    <CampoLista label="Horários solicitados" valor={selectedVisit.requestedSlots} />
                    <CampoLista label="Horário final" valor={selectedVisit.scheduledSlot} />
                    <CampoLista label="Mensagem" valor={selectedVisit.message} />
                    <CampoLista label="Criado em" valor={selectedVisit.createdAt} />
                    <CampoLista label="Atualizado em" valor={selectedVisit.updatedAt} />
                  </div>
                ) : (
                  <p></p>
                )}
              </ScrollArea>
            </SheetDescription>
          </SheetHeader>
        </SheetContent>
      </Sheet>
    </>
  );
}
