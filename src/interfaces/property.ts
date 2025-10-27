export interface Property {
    id?: string; // uuid do imóvel na tabela properties do Supabase
    developerId: string; // uuid da construtora na tabela developers
    name: string; // nome do imóvel/empreendimento
    address: string; // endereço em linguagem natural
    description: string; // descrição do imóvel
    location: unknown; // tipo de dado geoespacial do PostgreSQL para consultas de proximidade
    deliveryDate: Date; // data para a entrega do imóvel/empreendimento
    launchDate: Date; // data de lançamento do imóvel/empreendimento
    features: string[]; // lista de caracteríscas do empreendimento, ex: "academia", "quadra de esportes"
    floors: number; // número de pavimentos
    unitsPerFloor: number; // números de unidades por pavimento/andar
    propertyImages?: string[]; // URLs das imagens do empreendimento no Cloud Storage
    areasImages?: string[]; // URLs das imagens das áreas de convívio no Cloud Storage
    matterportUrl?: string[]; // URLs para os scans 3D do Matterport (pode ser mais de um)
    groups: string[]; // array de grupos de corretores que podem visualizar aquele imóvel
    search_vector: unknown; // tipo tsvector para full-text search
    createdAt: Date; // timestampz no supabase
    updatedAt: Date; // timestampz no supabase
}
