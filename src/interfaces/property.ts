export interface Property {
    id?: string;
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
    searchableUnitFeats: {
        minPrice: number;
        maxPrice: number;
        bedrooms: number[];
        baths: number[];
        garages: number[];
        minSize: number;
        maxSize: number;
        sizes: number[];
    };
}
