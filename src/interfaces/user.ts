import { DocumentReference, Timestamp } from "firebase/firestore";

interface UserDocuments {
    addressProof?: string[];
    incomeProof?: string[];
    identityDoc?: string[];
    marriageCert?: string[];
}

interface AgentProfile {
    creci: string;
    city: string;
    groups?: string[];
    documents?: {
        creciCardPhoto: string[];
        creciCert: string[];
    };
}

export interface User {
    id?: string;
    email: string;
    role: "client" | "agent" | "admin";
    status?: "approved" | "pending" | "denied";
    fullName: string;
    rg?: string;
    cpf?: string;
    address?: string;
    phone?: string;
    documents?: UserDocuments;
    favorited?: DocumentReference[]; // ou string[] se preferir armazenar os IDs
    agentProfile?: AgentProfile;
    createdAt: Date | Timestamp;
    updatedAt: Date | Timestamp;
}
