import { DocumentReference, Timestamp } from "firebase/firestore";

interface ClientDataSnapshot {
  fullName: string;
  address: string;
  phone: string;
  rg: string;
  cpf: string;
  addressProof: string[];
  incomeProof: string[];
  identityDoc: string[];
  marriageCert?: string[];
}

export interface ReservationRequest {
  id?: string;
  status: 'pending' | 'approved' | 'denied';
  clientRef: DocumentReference; // ou string
  propertyRef: DocumentReference; // ou string
  propertyName: string;
  unitRef: DocumentReference; // ou string
  unitName: string;
  clientData: ClientDataSnapshot;
  adminMsg?: string;
  createdAt: Date | Timestamp;
  updatedAt: Date | Timestamp;
}