import { DocumentReference, Timestamp } from "firebase/firestore";

interface ContactInfo {
    email: string;
    phone: string;
}

export interface Developer {
    id?: string; // id do documento no Firebase
    name: string;
    logoUrl: string; // URL da logo da construtora no Cloud Storage
    website: string; // website da construtora
    contactInfo: ContactInfo;
    properties: DocumentReference[]; // referências às propriedades (na coleção properties) da construtora
    createdAt: Date | Timestamp;
    updatedAt: Date | Timestamp;
}
