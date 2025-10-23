import { Unit } from "@/interfaces/unit";

interface EmailTemplateProps {
    clientName: string,
    propertyName: string,
    unitIdentifier: string,
    unitBlock?: string,
}

export function EmailTemplateReservationRequest({ clientName, propertyName, unitIdentifier, unitBlock }: EmailTemplateProps) {
    return (
        <div>
            <h1 className="text-xl">Solicitação de Visita</h1>
            <p>
                O cliente <strong>{clientName}</strong> solicitou uma reserva para o <strong>{propertyName}, {unitIdentifier}</strong>{unitBlock && `, bloco ${unitBlock}`}.
            </p>
            <p>
                Veja as informações no <a href="/">Painel de Gerenciamento</a>
            </p>
        </div>
    );
}
