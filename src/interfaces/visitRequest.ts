import { DocumentReference, Timestamp } from "firebase/firestore";

export interface VisitRequest {
    id?: string; // id do documento no Firebase
    status: "pending" | "approved" | "denied" | "completed";
    client: {
        ref: DocumentReference; // referência ao documento do cliente na coleção users
        fullName: string; // nome do cliente que fez a solicitação
    };
    property: {
        ref: DocumentReference; // referência ao imóvel pai na coleção properties
        name: string; // nome do imóvel/empreendimento
    };
    unit: {
        ref: DocumentReference; // referência à unidade específica em /properties/{id}/units/{id}
        identifier: string; // identificador da unidade
        block: string; // bloco ao qual a unidade pertence
    };
    agents?: {
        // array de map dos corretores associados/alocados para a solicitação
        ref: DocumentReference; // referência a corretor alocado (na coleção users)
        name: string; // nome do corretor associado/alocado para a solicitação
        email: string; // email do corretor associado/alocado para a solicitação
        phone: string; // telefone do corretor associado/alocado para a solicitação
        creci: string; // creci do corretor
    }[];
    requestedSlots: (Date | Timestamp)[]; // horários solicitados pelo cliente
    scheduledSlot?: Date | Timestamp; // horário final agendado pelo administrador
    agentMsg?: string; // mensagem para o corretor
    clientMsg?: string; // mensagem para o cliente
    createdAt: Date | Timestamp;
    updatedAt: Date | Timestamp;
}
