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
                    onClick={() => router.push("/admin/dashboard")}
                    size={"fit"}
                >
                    Ver Dashboard
                </Button>
                {/* Acesso rápido às páginas principais */}
                <div className="mt-4 w-full">
                    <h3 className="text-sm sm:text-base font-semibold text-gray-700 mb-2 text-center">Acesso Rápido</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <Button
                            variant={"default"}
                            className="cursor-pointer text-sm"
                            onClick={() => router.push("/admin/property")}
                            size={"fit"}
                        >
                            Gerenciar Imóveis (Admin)
                        </Button>
                        <Button
                            variant={"default"}
                            className="cursor-pointer text-sm"
                            onClick={() => router.push("/admin/developers")}
                            size={"fit"}
                        >
                            Construtoras (Admin)
                        </Button>
                        <Button
                            variant={"default"}
                            className="cursor-pointer text-sm"
                            onClick={() => router.push("/admin/users")}
                            size={"fit"}
                        >
                            Usuários (Admin)
                        </Button>
                        <Button
                            variant={"default"}
                            className="cursor-pointer text-sm"
                            onClick={() => router.push("/property-search")}
                            size={"fit"}
                        >
                            Busca de Imóveis
                        </Button>
                        <Button
                            variant={"default"}
                            className="cursor-pointer text-sm"
                            onClick={() => router.push("/dashboard")}
                            size={"fit"}
                        >
                            Dashboard
                        </Button>
                        <Button
                            variant={"default"}
                            className="cursor-pointer text-sm"
                            onClick={() => router.push("/profile")}
                            size={"fit"}
                        >
                            Perfil
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
