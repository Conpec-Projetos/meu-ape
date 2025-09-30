export interface Property {
    id: string;
    name: string;
    description: string;
    address: string;
    location: {
      latitude: number;
      longitude: number;
    };
    images: string[];
    features: string[];
    deliveryDate: Date;
    launchDate: Date;
    minPrice: number;
    maxPrice: number;
    unitGroups: UnitGroup[];
  }
  
  export interface Unit {
    id: string;
    identifier: string;
    block: string;
    category: string;
    price: number;
    size: number;
    bedrooms: number;
    garages: number;
    bathrooms: number;
    floor: number;
    images: string[];
    isAvailable: boolean;
    matterportUrl?: string;
  }
  
  export interface UnitGroup {
    block: string;
    categories: string[];
  }
  
  export interface PaginatedUnits {
    units: Unit[];
    cursor: string | null;
    hasNextPage: boolean;
  }