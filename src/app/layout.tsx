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
                <Toaster
                    position="top-center"
                    closeButton
                    toastOptions={{
                        classNames: {
                            toast: "bg-background border-border shadow-lg rounded-lg text-foreground font-sans group",
                            title: "text-sm font-medium",
                            description: "text-xs",
                            actionButton: "bg-primary text-primary-foreground",
                            cancelButton: "bg-secondary text-secondary-foreground",
                            closeButton: "opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity",
                            success: "text-green-800 dark:text-green-200",
                            error: "text-red-800 dark:text-red-200",
                            info: "text-blue-800 dark:text-blue-200",
                            warning: "text-yellow-800 dark:text-yellow-200",
                        },
                    }}
                />
            </body>
        </html>
    );
}
