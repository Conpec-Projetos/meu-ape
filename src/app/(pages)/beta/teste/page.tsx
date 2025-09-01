'use client'

import Footer from "@/components/footer/footer"
import { AppSidebar } from "@/components/header/app-sidebar"
import Header from "@/components/header/header"
import { SidebarProvider } from "@/components/ui/sidebar"
import { useState } from "react"

import bg from '/public/bg.png'


export default function Teste(){
  const [open, setOpen] = useState(false); //;

  return (
    <SidebarProvider open={open} onOpenChange={setOpen}>
      <AppSidebar variant="admin" />

      <div className="w-full max-h-min">
        <Header variant="admin"></Header>
        <main 
          className="bg-cover bg-start h-[1500px] bg-no-repeat"
          style={{
             backgroundImage: `url(${bg.src})`,
             backgroundSize: '100% auto',
             height: 'calc(100vw / 566 * 833)',
          }}>
          <h1>Teste</h1>
        </main>
        <Footer />
      </div>
     
    </SidebarProvider>
  )
}