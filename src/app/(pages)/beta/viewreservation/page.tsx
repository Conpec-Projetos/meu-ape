"use client"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useState } from "react"
import CardVisits from '@/components/ui/cardvisits'
import CardReservations from "@/components/ui/cardreservations"

const requests = [
  { status: "Aguardo", empreendimento: "Loja", nome: "Bruno" },
  { status: "Confirmado", empreendimento: "Shopping", nome: "Maria" },
  { status: "Recusado", empreendimento: "Centro", nome: "Carlos" },
  { status: "Confirmado", empreendimento: "AAAAAA", nome: "BBBBB" },
  { status: "Confirmado", empreendimento: "AAAAAA", nome: "BBBBB" },
  { status: "Finalizado", empreendimento: "AAAAAA", nome: "BBBBB" },
  { status: "Confirmado", empreendimento: "AAAAAA", nome: "BBBBB" },
  { status: "Confirmado", empreendimento: "AAAAAA", nome: "BBBBB" }
]

export default function Reserve() {
  const [visibleCount, setVisibleCount] = useState(4)

  const handleLoadMore = () => {
    setVisibleCount(prev => prev + 2)
  }

  return (
    <div className="mt-7 ml-5">
      <Tabs defaultValue="visitas" className="w-full">
        <TabsList className="mb-4 mt-8">
          <TabsTrigger value="visitas">Visitas</TabsTrigger>
          <TabsTrigger value="reservas">Reservas</TabsTrigger>
        </TabsList>

        {/* Visitas */}
        <TabsContent value="visitas">
          <div className="flex flex-col gap-2 items-center">
            {requests.slice(0, visibleCount).map((request, index) => (
              <CardVisits
                key={index}
                status={request.status}
                empreendimento={request.empreendimento}
                nome={request.nome}
              />
            ))}
            {visibleCount < requests.length && (
              <button
                onClick={handleLoadMore}
                className=" justify-center flex items-center border-1  border-gray-400 bg-cinza hover:bg-blue-500 rounded-lg mb-4 h-8 w-[10%]"
              >
                Carregar mais
              </button>
            )}
          </div>
        </TabsContent>

        {/* Reservas */}
        <TabsContent value="reservas">
          <div className="flex flex-col gap-2 items-center">
            {requests.map((request, index) => (
              <CardReservations
                key={index}
                status={request.status}
                empreendimento={request.empreendimento}
                nome={request.nome}
              />
            ))}
            
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
