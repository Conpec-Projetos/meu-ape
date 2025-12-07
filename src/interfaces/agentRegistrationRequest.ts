interface ApplicantData {
    email: string; // email do corretor
    fullName: string; // nome completo do corretor
    cpf: string; // cpf do corretor
    rg: string; // RG (ou CIN) do corretor
    address: string; // endereço em linguagem natural
    city: string; // cidade de atuação do corretor
    creci: string;
    creciCardPhoto: string[]; // URLs das fotos do CRECI no Cloud Storage
    creciCert: string[]; // URLs das fotos do certificado CRECI no Cloud Storage
    phone?: string;
}

export interface AgentRegistrationRequest {
    id: string;
    userId: string;
    requesterId: string;
    status: "pending" | "approved" | "denied" | "completed" | "canceled";
    submittedAt: Date | string;
    resolvedAt?: Date | string | null;
    applicantData: ApplicantData;
    adminMsg?: string; // mensagem do administrador em caso de negação
}
