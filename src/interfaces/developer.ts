import { DocumentReference, Timestamp } from "firebase/firestore";

export interface Developer {
    id?: string; // id do documento no Firebase
    name: string;
    logoUrl: string; // URL da logo da construtora no Cloud Storage
    website: string; // website da construtora
    email: string; // email da construtora
    phone: string; // telefone da construtora
    properties: DocumentReference[]; // referências às propriedades (na coleção properties) da construtora
    createdAt: Date | Timestamp;
    updatedAt: Date | Timestamp;
}
