import { DocumentReference, Timestamp } from "firebase/firestore";

interface ContactInfo {
    email: string;
    phone: string;
}

export interface Developer {
    id?: string;
    name: string;
    logoUri: string;
    website: string;
    contactInfo: ContactInfo;
    properties: DocumentReference[]; // ou string[]
    createdAt: Date | Timestamp;
    updatedAt: Date | Timestamp;
}
