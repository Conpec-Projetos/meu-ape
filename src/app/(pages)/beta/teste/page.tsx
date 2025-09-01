'use client'

import { AppSidebar } from "@/components/header/app-sidebar"
import Header from "@/components/header/header"
import { SidebarProvider } from "@/components/ui/sidebar"
import { useState } from "react"


export default function Teste(){
  const [open, setOpen] = useState(false); //;

  return (
    <SidebarProvider open={open} onOpenChange={setOpen}>
      <AppSidebar variant="admin" />
      <div className="w-full max-h-min">
        <Header variant="admin"></Header>
        <main>
          
          <h1>Teste</h1>
        </main>
      </div>
     
    </SidebarProvider>
  )
}