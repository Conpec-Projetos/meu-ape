import { string } from "zod";
import { DocumentReference, Timestamp } from "firebase/firestore";

export interface user {
    userId: string;
    email: string;
    role: "admin" | "agent" | "client";
    fullName: string;
    rg: string;
    cpf: string;
    address: string;
    phone: string;

    documents: {
        addressProof?: string[];
        incomeProof?: string[];
        identityDoc?: string[];
        marriageCert?: string[];
    }

    favorited?: DocumentReference[];
    createdAt: Timestamp;
    updatedAt: Timestamp;

    agentProfile?: {
        creci: string;
        city: string;
        documents: {
            creciCard: string[];
            creciCert: string[];
        }
    }
}