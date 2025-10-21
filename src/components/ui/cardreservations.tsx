import React, { useEffect, useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/features/sheets/sheetreservations";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ReservationRequest } from "@/interfaces/reservationRequest";
import { getReservationRequests } from "@/firebase/dashboard/service";
import { Timestamp } from "firebase-admin/firestore";

type CardReservationProps = {
  status: string;
  empreendimento: string;
  nome: string;
  reservation: ReservationRequest;
};

type CampoListaProps = {
  label: string;
  valor?: string | string[] | Date | Timestamp | (Date | Timestamp)[];
};

function CampoLista({ label, valor }: CampoListaProps) {
  let displayValue = "—";
  if (valor instanceof Date) displayValue = valor.toLocaleString("pt-BR");
  else if (Array.isArray(valor)) displayValue = valor.join(", ");
  else if ((valor as any)?.seconds !== undefined)
    displayValue = new Date((valor as Timestamp).seconds * 1000).toLocaleString("pt-BR");
  else if (valor) displayValue = valor.toString();

  return (
    <ul className="list-none mb-4">
      <li className="font-bold text-md text-black">{label}</li>
      <li className="text-gray-600 break-words">{displayValue}</li>
    </ul>
  );
}

export default function CardReservations({ status, empreendimento, nome, reservation }: CardReservationProps) {
  const [open, setOpen] = useState(false);
  const [selectedReservation, setSelectedReservation] = useState<ReservationRequest | null>(null);

  let statusclass =
    status === "Aguardo"
      ? "bg-yellow-200"
      : status === "Confirmado"
      ? "bg-green-300"
      : "bg-red-400";

  return (
    <>
      <button
        className="flex flex-col sm:flex-row items-center justify-between
                   bg-[#F2F2F2] rounded-lg border border-gray-300 
                   mt-3 mb-3 hover:bg-[#e7e7e7] transition-colors duration-150 
                   cursor-pointer shadow-md w-full sm:w-[90%] md:w-[95%] p-4"
        onClick={() => {
          setOpen(true);
          setSelectedReservation(reservation);
        }}
      >
        {/* Status */}
        <div className="flex justify-center items-center w-full sm:w-[20%] mb-3 sm:mb-0">
          <span className={`${statusclass} rounded-xl px-6 py-2 text-base sm:text-lg font-medium border border-gray-300 shadow`}>
            {status}
          </span>
        </div>

        {/* Infos */}
        <div className="flex flex-col sm:flex-row justify-center items-center gap-6 sm:gap-12 lg:gap-20 w-full sm:w-[75%]">
          <div className="flex flex-col w-full sm:w-auto">
            <span className="font-medium text-sm sm:text-base">Empreendimento:</span>
            <div className="mb-2 sm:mb-4 h-8 sm:h-9 bg-white rounded-lg flex items-center shadow border border-gray-300 w-full sm:w-64 lg:w-80 px-3">
              <span className="truncate">{empreendimento}</span>
            </div>
          </div>

          <div className="flex flex-col w-full sm:w-auto">
            <span className="font-medium text-sm sm:text-base">Solicitante:</span>
            <div className="mb-2 sm:mb-4 h-8 sm:h-9 bg-white rounded-lg flex items-center shadow border border-gray-300 w-full sm:w-64 lg:w-80 px-3">
              <span className="truncate">{nome}</span>
            </div>
          </div>
        </div>
      </button>

      {/* Sheet responsivo */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger></SheetTrigger>
        <SheetContent className="max-w-full sm:max-w-[480px]">
          <SheetHeader>
            <SheetTitle>Dados da reserva</SheetTitle>
            <div className="h-12">
              <div className="h-0.5 rounded-4xl bg-gray-400"></div>
            </div>
            <SheetDescription>
              <ScrollArea className="h-125 w-full rounded-md border overflow-y-auto p-4">
                {selectedReservation && (
                  <div>
                    <CampoLista label="Status" valor={selectedReservation.status} />
                    <CampoLista label="Imóvel" valor={selectedReservation.propertyName} />
                    <CampoLista label="Bloco" valor={selectedReservation.propertyBlock} />
                    <CampoLista label="Unidade" valor={selectedReservation.propertyUnit} />
                    <CampoLista label="Corretor" valor={selectedReservation.agentsName} />
                    <CampoLista label="CRECI" valor={selectedReservation.agentsCreci} />
                    <CampoLista label="Telefone" valor={selectedReservation.agentsPhone} />
                    <CampoLista label="Horário solicitado" valor={selectedReservation.requestedSlots} />
                    <CampoLista label="Horário final" valor={selectedReservation.scheduledSlot} />
                    <CampoLista label="Mensagem" valor={selectedReservation.message} />
                    <CampoLista label="Criado em" valor={selectedReservation.createdAt} />
                    <CampoLista label="Atualizado em" valor={selectedReservation.updatedAt} />
                  </div>
                )}
              </ScrollArea>
            </SheetDescription>
          </SheetHeader>
        </SheetContent>
      </Sheet>
    </>
  );
}
