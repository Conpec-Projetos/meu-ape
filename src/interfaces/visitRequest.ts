import { DocumentReference, FieldValue, Timestamp } from "firebase/firestore";

export interface VisitRequest {
    id?: string; // id do documento no Firebase
    status: "pending" | "approved" | "denied" | "completed";
    client: {
        ref: DocumentReference; // referência ao documento do cliente na coleção users (mantida para consultas)
        fullName: string; // nome do cliente que fez a solicitação
    };
    property: {
        id: string; // id do imóvel no Supabase
        name: string; // nome do imóvel/empreendimento
        address?: string; // endereço do imóvel
    };
    unit: {
        // ref removida do fluxo principal; manter opcional por compatibilidade
        ref?: DocumentReference; // referência à unidade no Firebase (se existir)
        id: string; // id da unidade no Supabase
        identifier: string; // identificador da unidade
        block: string; // bloco ao qual a unidade pertence
    };
    agents?: {
        // array de map dos corretores associados/alocados para a solicitação
        ref?: DocumentReference | null; // referência a corretor alocado (na coleção users)
        name: string; // nome do corretor associado/alocado para a solicitação
        email: string; // email do corretor associado/alocado para a solicitação
        phone: string; // telefone do corretor associado/alocado para a solicitação
        creci: string; // creci do corretor
    }[];
    requestedSlots: (Date | Timestamp)[]; // horários solicitados pelo cliente
    scheduledSlot?: Date | Timestamp; // horário final agendado pelo administrador
    adminMsg?: string; // mensagem para o cliente em caso de negação
    agentMsg?: string; // mensagem para o corretor
    clientMsg?: string; // mensagem para o cliente
    createdAt: Date | Timestamp | FieldValue;
    updatedAt: Date | Timestamp | FieldValue;
}
