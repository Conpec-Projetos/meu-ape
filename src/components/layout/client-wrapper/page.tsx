"use client";

import Footer from "@/components/layout/footer/footer";
import Header from "@/components/layout/header/header";
import { useAuth } from "@/hooks/use-auth";

export default function ClientWrapper({ children }: { children: React.ReactNode }) {
    const { role, loading } = useAuth();

    if (loading) {
        return null; // Or a loading spinner
    }

    return (
        <>
            <Header variant={role || "guest"} />
            <main className="flex-grow">{children}</main>
            <Footer />
        </>
    );
}
