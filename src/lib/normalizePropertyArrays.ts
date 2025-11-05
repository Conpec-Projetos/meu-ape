// Shared helper to normalize array fields from Supabase properties
// Ensures we always return arrays ([]) instead of null/undefined

export type PropertyArrayFields = {
    features?: string[] | null;
    property_images?: string[] | null;
    areas_images?: string[] | null;
    matterport_urls?: string[] | null;
    groups?: string[] | null;
};

export function normalizePropertyArrays<T extends PropertyArrayFields>(
    obj: T
): T & {
    features: string[];
    property_images: string[];
    areas_images: string[];
    matterport_urls: string[];
    groups: string[];
} {
    return {
        ...obj,
        features: Array.isArray(obj.features) ? obj.features : [],
        property_images: Array.isArray(obj.property_images) ? obj.property_images : [],
        areas_images: Array.isArray(obj.areas_images) ? obj.areas_images : [],
        matterport_urls: Array.isArray(obj.matterport_urls) ? obj.matterport_urls : [],
        groups: Array.isArray(obj.groups) ? obj.groups : [],
    } as unknown as T & {
        features: string[];
        property_images: string[];
        areas_images: string[];
        matterport_urls: string[];
        groups: string[];
    };
}
