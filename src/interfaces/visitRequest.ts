import { DocumentReference, Timestamp } from "firebase/firestore";

export interface VisitRequest {
    id?: string; // id do documento no Firebase
    status: "pending" | "approved" | "denied" | "completed";
    clientRef: DocumentReference; // referência ao documento do cliente na coleção users
    clientName: string; // nome do cliente
    propertyRef: DocumentReference; // referência ao documento do imóvel na coleção properties
    propertyName: string; // nome do imóvel
    agentsRef?: DocumentReference[]; // referência ao corretores alocados (na coleção users)
    requestedSlots: (Date | Timestamp)[]; // horários solicitados pelo cliente
    scheduledSlot?: Date | Timestamp; // horário final agendado pelo administrador
    adminMsg?: string; // mensagem para o cliente em caso de negação
    createdAt: Date | Timestamp;
    updatedAt: Date | Timestamp;
}
