"use client";
import CardReservations from "@/components/ui/cardreservations";
import CardVisits from "@/components/ui/cardvisits";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useEffect, useState } from "react";
import { getReservationRequests, getVisitsRequests } from "@/firebase/dashboard/service";
import { VisitRequest } from "@/interfaces/visitRequest";
import { ReservationRequest } from "@/interfaces/reservationRequest";

export default function Reserve() {
  const [visibleCount, setVisibleCount] = useState(4);
  const [visits, setVisits] = useState<VisitRequest[]>([]);
  const [reservations, setReservations] = useState<ReservationRequest[]>([]);

  const handleLoadMore = () => setVisibleCount((prev) => prev + 2);

  useEffect(() => {
    getReservationRequests(setReservations);
  }, []);

  useEffect(() => {
    getVisitsRequests(setVisits);
  }, []);

  return (
    <div className="w-full min-h-screen flex flex-col items-center px-4 sm:px-6 lg:px-16 mt-10">
      <Tabs defaultValue="visitas" className="w-full max-w-6xl">
        {/* --- Tabs --- */}
        <TabsList className="flex justify-center items-center mx-auto mt-6 sm:mt-10 mb-8 w-[90%] sm:w-96 border border-gray-300 rounded-lg shadow-sm">
          <TabsTrigger value="visitas" className="text-sm sm:text-base font-semibold px-4 sm:px-6 py-2">
            Visitas
          </TabsTrigger>
          <TabsTrigger value="reservas" className="text-sm sm:text-base font-semibold px-4 sm:px-6 py-2">
            Reservas
          </TabsTrigger>
        </TabsList>

        {/* --- Conteúdo: VISITAS --- */}
        <TabsContent value="visitas">
          <div className="flex flex-col gap-4 items-center w-full">
            {visits.slice(0, visibleCount).map((visit, index) => (
              <CardVisits
                key={index}
                status={visit.status}
                empreendimento={visit.propertyName}
                nome={visit.clientName}
                visit={visit}
              />
            ))}

            {visibleCount < visits.length && (
              <button
                onClick={handleLoadMore}
                className="px-6 py-2 sm:py-3 sm:px-8 rounded-md font-semibold 
                           border border-gray-400 bg-black text-white 
                           hover:scale-105 transition-transform duration-200"
              >
                Carregar mais
              </button>
            )}
          </div>
        </TabsContent>

        {/* --- Conteúdo: RESERVAS --- */}
        <TabsContent value="reservas">
          <div className="flex flex-col gap-4 items-center w-full">
            {reservations.slice(0, visibleCount).map((request, index) => (
              <CardReservations
                key={index}
                status={request.status}
                empreendimento={request.propertyName}
                nome={request.clientName}
                reservation={request}
              />
            ))}

            {visibleCount < reservations.length && (
              <button
                onClick={handleLoadMore}
                className="px-6 py-2 sm:py-3 sm:px-8 rounded-md font-semibold 
                           border border-gray-400 bg-black text-white 
                           hover:scale-105 transition-transform duration-200"
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
