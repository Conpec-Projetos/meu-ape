"use client";
import { Button } from "@/components/features/buttons/default-button";
import { useRouter } from "next/navigation";

export default function Home() {
    const router = useRouter();

    return (
        <div className="flex flex-col items-center justify-center h-screen w-screen p-4 max-w-full">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4 text-center">Bem-vindo ao Meu Apê!</h1>
            <h2 className="text-sm sm:text-base md:text-xl text-gray-600 mb-6 text-center">
                (Protótipo de Cadastro de Empreendimentos)
            </h2>
            <div className="flex flex-col items-center gap-4 w-full max-w-md">
                <Button
                    variant={"default"}
                    className="cursor-pointer text-sm sm:text-base"
                    onClick={() => router.push("/properties/1")}
                    size={"fit"}
                >
                    (Beta) Visualizar Imóvel
                </Button>
                <Button
                    variant={"default"}
                    className="cursor-pointer text-sm sm:text-base"
                    onClick={() => router.push("/beta/property")}
                    size={"fit"}
                >
                    Ver todos os empreendimentos
                </Button>
                <Button
                    variant={"success"}
                    className="cursor-pointer text-sm sm:text-base"
                    onClick={() => router.push("/beta/dashboard")}
                    size={"fit"}
                >
                    Ver Dashboard
                </Button>
            </div>
        </div>
    );
}
