import { FieldValue } from "firebase-admin/firestore";
import { DocumentReference, Timestamp } from "firebase/firestore";

interface Client {
    ref: DocumentReference;
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
    id?: string; // id do documento no Firebase
    status: "pending" | "approved" | "denied";
    client: Client; // referência e cópia dos dados e documentos do cliente no momento da solicitação
    property: {
        ref: DocumentReference; // referência ao imóvel pai na coleção properties
        name: string; // nome do imóvel/empreendimento
    };
    unit: {
        ref: DocumentReference; // referência à unidade específica em /properties/{id}/units/{id}
        identifier: string; // identificador da unidade
        block: string;
    };
    agents?: {
        // array de map dos corretores associados/alocados para a solicitação
        ref: DocumentReference; // referência a corretor alocado (na coleção users)
        name: string; // nome do corretor associado/alocado para a solicitação
        email: string; // email do corretor associado/alocado para a solicitação
        phone: string; // telefone do corretor associado/alocado para a solicitação
        creci: string; // creci do corretor
    }[];
    agentMsg?: string; // mensagem para o corretor
    clientMsg?: string; // mensagem para o cliente
    createdAt: Date | Timestamp | FieldValue;
    updatedAt: Date | Timestamp | FieldValue;
}
