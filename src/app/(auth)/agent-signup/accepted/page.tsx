import { Card, CardContent, CardHeader } from "@/components/ui/card";
import Image from "next/image";

export default function AcceptedPage() {
    return (
        <div className="relative flex min-h-screen flex-col items-center justify-center bg-gray-100 dark:bg-gray-900">
            <div className="absolute inset-0 z-0">
                <Image src="/register/background.png" alt="Background" layout="fill" objectFit="cover" />
            </div>
            <div className="relative z-10 w-full max-w-4xl p-4">
                <Card className="bg-white/90 dark:bg-black/80 backdrop-blur-sm">
                    <CardHeader className="text-center">
                        <h1 className="text-3xl font-bold text-green-600 mb-4">Solicitação Enviada com Sucesso!</h1>
                    </CardHeader>
                    <CardContent className="flex flex-col items-center gap-4">
                        <p className="text-gray-700 text-center">
                            Obrigado por se inscrever como agente. Sua solicitação está sendo analisada.
                        </p>
                        <p className="text-gray-700 text-center">Aguarde a aprovação do administrador.</p>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
