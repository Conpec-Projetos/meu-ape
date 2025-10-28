export interface Property {
    id?: string;
    developerId?: string;
    name: string;
    address: string;
    description: string;
    location: { lat: number; lng: number };
    deliveryDate: Date;
    launchDate: Date;
    features: string[];
    floors: number;
    unitsPerFloor: number;
    propertyImages?: string[];
    areasImages?: string[];
    matterportUrls?: string[];
    groups: string[];
}
