import { z } from "zod";

export const unitSchema = z.object({
    property_id: z.string().uuid(),
    identifier: z.string(),
    block: z.string().optional(),
    category: z.string().optional(),
    price: z.number(),
    size_sqm: z.number(),
    bedrooms: z.number().int(),
    garages: z.number().int(),
    baths: z.number().int(),
    floor: z.number().int().optional(),
    images: z.array(z.string()).optional(),
    is_available: z.boolean().optional(),
    floor_plan_urls: z.array(z.string()).optional(),
});
