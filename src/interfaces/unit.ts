import { DocumentReference, Timestamp } from "firebase/firestore";

export interface Unit {
  id?: string;
  identifier: string;
  developerRef: DocumentReference; // ou string
  block?: string;
  category?: string;
  price: number;
  size: number;
  bedrooms: number;
  garages: number;
  baths: number;
  images: string[];
  isAvailable: boolean;
  floor: number;
  matterportUrl?: string;
  floorPlanUrl?: string;
  createdAt: Date | Timestamp;
  updatedAt: Date | Timestamp;
}