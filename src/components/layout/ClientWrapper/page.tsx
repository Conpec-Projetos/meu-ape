"use client";

import { SidebarProvider } from "@/components/features/Sidebars/HeaderSideBar";
import Footer from "@/components/layout/Footer/Footer";
import { AppSidebar } from "@/components/layout/Header/AppSidebar";
import Header from "@/components/layout/Header/Header";
import { useState } from "react";

export default function ClientWrapper({ children }: { children: React.ReactNode }) {
    const [open, setOpen] = useState(false);

    return (
        <SidebarProvider open={open} onOpenChange={setOpen} className="min-h-screen flex flex-col">
            <AppSidebar variant="admin" />
            <Header variant="admin" />
            <main className="flex-grow">{children}</main>
            <Footer />
        </SidebarProvider>
    );
}
