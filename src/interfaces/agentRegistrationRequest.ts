import { DocumentReference, Timestamp } from "firebase/firestore";

interface ApplicantData {
  email: string;
  fullName: string;
  cpf: string;
  rg: string;
  address: string;
  city: string;
  creci: string;
  creciCardPhoto: string[];
  creciCert: string[];
}

export interface AgentRegistrationRequest {
  id?: string;
  requesterId: DocumentReference; // ou string
  status: 'pending' | 'approved' | 'denied';
  submittedAt: Date | Timestamp;
  resolvedAt?: Date | Timestamp;
  resolvedBy?: DocumentReference; // ou string
  applicantData: ApplicantData;
  adminMsg?: string;
}