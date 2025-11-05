import { DocumentReference, FieldValue, Timestamp } from "firebase/firestore";

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
}

export interface AgentRegistrationRequest {
    id?: string; // id do documento no Firebase
    requesterId: DocumentReference; // referência ao documento do corretor na coleção users
    status: "pending" | "approved" | "denied";
    submittedAt: Date | Timestamp | FieldValue;
    resolvedAt?: Date | Timestamp;
    resolvedBy?: DocumentReference; // referência ao administrador que analisou (na coleção users)
    applicantData: ApplicantData;
    adminMsg?: string; // mensagem do administrador em caso de negação
}
