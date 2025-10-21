"use client";

import Footer from "@/components/layout/footer/footer";
import Header from "@/components/layout/header/header";
import { useAuth } from "@/hooks/use-auth";

export default function ClientWrapper({ children }: { children: React.ReactNode }) {
    const { role, loading } = useAuth();

    if (loading) {
        return null; // Ou um spinner de carregamento
    }

    return (
        <div className="flex flex-col min-h-screen">
            <Header variant={role || "guest"} />
            {/* grow faz o main ocupar o espaço disponível */}
            <main className="grow">{children}</main>
            <Footer />
        </div>
    );
}