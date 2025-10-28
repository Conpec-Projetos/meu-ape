export interface Developer {
    id?: string; // uuid na tabela developers no Supabase
    name: string; // nome da construtora
    logoUrl: string; // URL da logo da construtora no Cloud Storage
    website: string; // website da construtora
    email: string; // email da construtora
    phone: string; // telefone da construtora
    createdAt: Date; // timestampz no supabase
    updatedAt: Date; // timestampz no supabase
}
