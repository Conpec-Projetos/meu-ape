export interface Property {
    id?: string;
    nomeEmpreendimento: string;
    enderecoCompleto: string;
    prazoEntrega: Date;
    dataLancamento: Date;
    imagens?: string[];
    criadoEm: Date;
}
