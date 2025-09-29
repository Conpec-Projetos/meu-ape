"use client";

import Footer from "@/components/layout/footer/footer";
import Header from "@/components/layout/header/header";

export default function ClientWrapper({ children }: { children: React.ReactNode }) {

    return (
        <>
            <Header variant="admin" />
            <main className="flex-grow">{children}</main>
            <Footer />
        </>
    );
}
