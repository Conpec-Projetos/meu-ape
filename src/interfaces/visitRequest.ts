import { DocumentReference, Timestamp } from "firebase/firestore";

export interface VisitRequest {
    id?: string; // id do documento no Firebase
    status: "pending" | "approved" | "denied" | "completed";
    clientRef: DocumentReference; // referência ao documento do cliente na coleção users
    clientName: string; // nome do cliente que fez a solicitação
    propertyRef: DocumentReference; // referência ao documento do imóvel na coleção properties
    propertyName: string; // nome do imóvel/empreendimento
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
    adminMsg?: string; // mensagem para o cliente em caso de negação
    createdAt: Date | Timestamp;
    updatedAt: Date | Timestamp;
}
