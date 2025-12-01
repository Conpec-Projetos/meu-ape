"use client";

import Footer from "@/components/layout/footer/footer";
import Header from "@/components/layout/header/header";
import { useAuth } from "@/hooks/use-auth";
import { MapProvider } from "@/providers/google-maps-provider";
import { usePathname } from "next/navigation";

export default function ClientWrapper({ children }: { children: React.ReactNode }) {
    const { role, loading } = useAuth();
    const pathname = usePathname();

    const authRoutes = new Set(["/login", "/signup", "/agent-signup", "/forgot-password"]);
    const shouldKeepGuestHeader = pathname ? authRoutes.has(pathname) : false;
    const headerVariant = shouldKeepGuestHeader ? "guest" : role || "guest";

    if (loading) {
        return null; // Ou um spinner de carregamento
    }

    return (
        <div className="flex flex-col min-h-screen">
            <Header variant={headerVariant} />
            {/* grow faz o main ocupar o espaço disponível */}
            <main className="grow">
                <MapProvider>{children}</MapProvider>
            </main>
            <Footer />
        </div>
    );
}
