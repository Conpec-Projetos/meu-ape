import ClientWrapper from "@/components/layout/client-wrapper/page";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

const geistSans = Geist({
    variable: "--font-geist-sans",
    subsets: ["latin"],
});

const geistMono = Geist_Mono({
    variable: "--font-geist-mono",
    subsets: ["latin"],
});

export const metadata: Metadata = {
    title: "Meu Apê",
    description: "Sem descrição por enquanto.",
};

import { AuthProvider } from "@/providers/auth-provider";

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
            <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
                <AuthProvider>
                    <ClientWrapper>{children}</ClientWrapper>
                </AuthProvider>
                <Toaster position="bottom-right" richColors closeButton theme="light" />
            </body>
        </html>
    );
}
