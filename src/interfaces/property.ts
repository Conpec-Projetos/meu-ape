import { DocumentReference, GeoPoint, Timestamp } from "firebase/firestore";
import { Unit } from "./unit";

interface SearchableUnitFeats {
  sizes: number[];
  bedrooms: number[];
  baths: number[];
  garages: number[];
  minPrice: number;
  maxPrice: number;
  minSize: number;
  maxSize: number;
}

export interface Property {
  id?: string;
  developerRef: DocumentReference; // ou string
  name: string;
  address: string;
  location: GeoPoint;
  deliveryDate: Date | Timestamp;
  launchDate: Date | Timestamp;
  features: string[];
  floors: number;
  unitsPerFloor: number;
  availableUnits?: number;
  images?: string[];
  description: string;
  searchableUnitFeats: SearchableUnitFeats;
  availableUnitsCount: number;
  groups: string[];
  units?: Unit[]; // Representação para a subcoleção
  createdAt: Date | Timestamp;
  updatedAt: Date | Timestamp;
}