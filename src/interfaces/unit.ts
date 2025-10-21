import { DocumentReference, Timestamp } from "firebase/firestore";

export interface Unit {
    id?: string; // id do documento no Firebase
    identifier: string; // identificador da unidade (ex: "Apartamento 302")
    developerRef: DocumentReference; // referência ao documento da construtora na coleção developers
    block?: string; // bloco ao qual a unidade pertence (ex: "Bloco B", ou "Externo")
    category?: string; // categoria ao qual a unidade pertence
    price: number;
    size: number; // tamanho em m^2
    bedrooms: number; // número de dormitórios
    garages: number; // número de vagas de garagem)
    baths: number; // número de banheiros
    images: string[]; // URLs das imagens da unidade no Cloud Storage
    isAvailable: boolean;
    floor: number; // pavimento/andar da unidade
    floorPlanUrl?: string; // URL para a planta baixa da unidade no Cloud Storage
    createdAt: Date | Timestamp;
    updatedAt: Date | Timestamp;
}
