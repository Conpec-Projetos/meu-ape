import { DocumentReference, Timestamp } from "firebase/firestore";

export interface VisitRequest {
    id?: string;
    status: "pending" | "approved" | "denied" | "completed";
    clientRef: DocumentReference; // ou string
    clientName: string;
    propertyRef: DocumentReference; // ou string
    propertyName: string;
    agentRef?: DocumentReference; // ou string
    requestedSlots: (Date | Timestamp)[];
    scheduledSlot?: Date | Timestamp;
    adminMsg?: string;
    createdAt: Date | Timestamp;
    updatedAt: Date | Timestamp;
}
