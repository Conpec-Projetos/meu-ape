"use client"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Calendar } from "@/components/ui/calendar"
import {useState} from "react"
import React from "react"
import CardReservation from '@/components/ui/cardreservation'

let cards = 5
const requests =   [{ status: "Aguardo", empreendimento: "Loja", nome: "Bruno" },
  { status: "Confirmado", empreendimento: "Shopping", nome: "Maria" },
  { status: "Recusado", empreendimento: "Centro", nome: "Carlos" },
  { status: "Confirmado", empreendimento: "AAAAAA", nome: "BBBBB" }
];



export default function Reserve() {
  const [date, setDate] = React.useState<Date | undefined>(new Date()) 


    
    return(
      <>
      <div className="mt-7 ml-5 relative">
        <span className="font-medium absolute mt-1 ml-15"> Visualização de: </span> <Tabs defaultValue="account" className="w-full ">
        <TabsList className="ml-50">
          <TabsTrigger value="visitas">Visitas</TabsTrigger>
          <TabsTrigger value="reservas">Reservas</TabsTrigger>
        </TabsList>

        {/* Visitas */}
          <TabsContent value="visitas">
            <div className="flex flex-row justify-around items-center  w-full h-fit mb-8">
              <div className="w-[90%] h-fit rounded-lg bg-cinza py-2 px-4 ">
                 {/*  CARD */}
                  {requests.map((request, index) => (
                    <CardReservation
                      key={index}
                      status={request.status}
                      empreendimento={request.empreendimento}
                      nome={request.nome}></CardReservation>))}

                </div>    
            </div>   
          </TabsContent>
          
        

        {/* Reservas */}
        <TabsContent value="reservas">
          
        </TabsContent>
      </Tabs>
      </div>
      
      </>
    )
    

}