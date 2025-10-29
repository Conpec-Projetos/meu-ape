import Link from "next/link";

interface EmailTemplateProps {
    clientName: string;
    propertyName: string;
}

export function EmailTemplateVisitRequest({ clientName, propertyName }: EmailTemplateProps) {
    return (
        <div>
            <h1 className="text-xl">Solicitação de Visita</h1>
            <p>
                O cliente <strong>{clientName}</strong> solicitou uma visita para o <strong>{propertyName}</strong>.
            </p>
            <p>
                Veja as informações no <Link href="/">Painel de Gerenciamento</Link>
            </p>
        </div>
    );
}
