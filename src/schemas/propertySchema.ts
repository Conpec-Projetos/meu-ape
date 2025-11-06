import { z } from "zod";

// Allow groups to be either a comma-separated string or an array of strings; normalize later.
export const propertySchema = z.object({
    developer_id: z.string().uuid(),
    name: z.string().min(3),
    address: z.string().optional(),
    description: z.string().optional(),
    delivery_date: z.string().optional(),
    launch_date: z.string().optional(),
    features: z.array(z.string()).optional(),
    floors: z.number().int().optional(),
    units_per_floor: z.number().int().optional(),
    property_images: z.array(z.string()).optional(),
    areas_images: z.array(z.string()).optional(),
    matterport_urls: z.array(z.string()).optional(),
    groups: z.array(z.string()).optional(),
    min_price: z.number().optional(),
    max_price: z.number().optional(),
    min_bedrooms: z.number().int().optional(),
    min_baths: z.number().int().optional(),
    min_garages: z.number().int().optional(),
    status: z.string().optional(),
});
