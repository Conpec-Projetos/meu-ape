"use client"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Calendar } from "@/components/ui/calendar"
import {useState} from "react"
import React from "react"

let cards = 5

function capitalize(str: string) {
  return str.charAt(0).toUpperCase() + str.slice(1);

}

export default function Reserve() {
  const [date, setDate] = React.useState<Date | undefined>(new Date()) 

  const dataFormatada = date
    ? capitalize(
        date.toLocaleDateString("pt-BR", {
          day: "numeric",
          month: "long",
          year: "numeric",
        })
      )
    : undefined;
    
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
              <Calendar
                mode="single"
                selected={date}
                onSelect={setDate}
                className="rounded-lg border w-200"
              />
              <div className="w-95 h-171 rounded-lg bg-cinza"></div>    
            </div>   
          </TabsContent>
          
        

        {/* Reservas */}
        <TabsContent value="reservas"></TabsContent>
      </Tabs>
      </div>
      
      </>
    )
    

}