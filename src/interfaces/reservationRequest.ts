import { DocumentReference, Timestamp } from "firebase/firestore";

interface ClientDataSnapshot {
    fullName: string;
    address: string;
    phone: string;
    rg: string;
    cpf: string;
    addressProof: string[]; // URLs dos comprovantes de endereço no Cloud Storage
    incomeProof: string[]; // URLs dos comprovantes de renda no Cloud Storage
    identityDoc: string[]; // URLs dos RGs e CINs no Cloud Storage
    marriageCert?: string[]; // URLs das certidões de casamento no Cloud Storage
}

export interface ReservationRequest {
    id?: string; // id do documento no firebase
    status: "pending" | "approved" | "denied";
    clientRef: DocumentReference; // referência ao documento do cliente na coleção users
    propertyRef: DocumentReference; // referência ao imóvel pai na coleção properties
    propertyName: string;
    agentsRef: DocumentReference[]; // referência ao corretores alocados (na coleção users)
    unitRef: DocumentReference; // referência à unidade específica em /properties/{id}/units/{id}
    unitName: string; // identificador da unidade
    clientData: ClientDataSnapshot; // cópia dos dados e documentos do cliente no momento da solicitação
    adminMsg?: string; // mensagem para o cliente
    createdAt: Date | Timestamp;
    updatedAt: Date | Timestamp;
}
