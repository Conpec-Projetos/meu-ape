import { DocumentReference, GeoPoint, Timestamp } from "firebase/firestore";
import { Unit } from "./unit";

interface SearchableUnitFeats {
    // campo desnormalizado para busca/filtragem
    sizes: number[];
    bedrooms: number[];
    baths: number[];
    garages: number[];
    minPrice: number;
    maxPrice: number;
    minSize: number;
    maxSize: number;
}

export interface PropertyOld {
    id?: string; // id do documento no Firebase
    developerRef: DocumentReference; // referência ao documento da construtora na coleção developers
    developerName: string; // nome da construtora
    name: string; // nome do imóvel/empreendimento
    address: string; // endereço em linguagem natural
    location: GeoPoint; // coordenadas
    deliveryDate: Date | Timestamp;
    launchDate: Date | Timestamp;
    features: string[]; // lista de caracteríscas do empreendimento, ex: "academia", "quadra de esportes"
    floors: number; // número de pavimentos
    unitsPerFloor: number; // números de unidades por pavimento/andar
    availableUnits?: number; // quantidade de unidades disponíveis
    propertyImages?: string[]; // URLs das imagens do empreendimento no Cloud Storage
    areasImages?: string[]; // URLs das imagens das áreas de convívio no Cloud Storage
    matterportUrl?: string[]; // URLs para os scans 3D do Matterport (pode ser mais de um)
    description: string; // descrição do imóvel)
    searchableUnitFeats: SearchableUnitFeats; // campo desnormalizado para otimizar a busca
    searchKeywords?: string[]; // Array de palavras-chave em minúsculas para busca de texto eficiente.
    groups: string[]; // array de grupos de corretores que podem visualizar aquele imóvel
    units?: Unit[]; // representação para a subcoleção
    createdAt: Date | Timestamp;
    updatedAt: Date | Timestamp;
}
