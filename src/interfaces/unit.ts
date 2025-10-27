export interface Unit {
    id?: string; // uuid da  no Firebase
    identifier: string; // identificador da unidade (ex: "Apartamento 302")
    propertyId: string; // uuid do imóvel/empreendimento ao qual a unidade pertence, na tabela properties do Supabase
    block?: string; // bloco ao qual a unidade pertence (ex: "Bloco B", ou "Externo")
    category?: string; // categoria ao qual a unidade pertence (ex: "75m^2", "120m^2")
    price: number; // preço da unidade
    size_sqm: number; // tamanho em m^2
    bedrooms: number; // número de dormitórios
    garages: number; // número de vagas de garagem
    baths: number; // número de banheiros
    floor: number; // pavimento/andar da unidade
    images: string[]; // URLs das imagens da unidade no Cloud Storage
    isAvailable: boolean;
    floorPlanUrls?: string[]; // URLs para a planta baixa da unidade no Cloud Storage
    createdAt: Date; // timestampz no supabase
    updatedAt: Date; // timestampz no supabase
}
