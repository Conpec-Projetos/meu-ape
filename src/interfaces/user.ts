import { DocumentReference, FieldValue, Timestamp } from "firebase/firestore";

interface UserDocuments {
    addressProof?: string[]; // URLs dos comprovantes de endereço no Cloud Storage
    incomeProof?: string[]; // URLs dos comprovantes de renda no Cloud Storage
    identityDoc?: string[]; // URLs dos RGs e CINs no Cloud Storage
    bmCert?: string[]; // URLs das certidões de casamento no Cloud Storage
}

interface AgentProfile {
    creci: string;
    city: string; // cidade de atuação do corretor
    groups?: string[]; // array de grupos ao qual aquele corretor pertence (ex: "norte", "azulImoveis")
    documents?: {
        creciCardPhoto: string[]; // URLs das fotos do CRECI no Cloud Storage
        creciCert: string[]; // URLs das fotos do certificado CRECI no Cloud Storage
    };
}

export interface User {
    id?: string; // id do documento no Firebase
    email: string;
    role: "client" | "agent" | "admin";
    status?: "approved" | "pending" | "denied";
    fullName: string; // nome completo do usuário
    rg?: string; // RG (ou CIN) do usuário
    cpf?: string; // cpf do usuário
    address?: string; // endereço em linguagem natural
    phone?: string; // telefone do usuário
    photoUrl?: string; // URL para
    documents?: UserDocuments;
    favorited?: DocumentReference[]; // ou string[] se preferir armazenar os IDs
    agentProfile?: AgentProfile;
    createdAt: Date | Timestamp | FieldValue;
    updatedAt: Date | Timestamp | FieldValue;
}
