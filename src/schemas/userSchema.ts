import { z } from "zod";

export const userSchema = z.object({
    email: z.string().email(),
    password: z.string().min(6).optional(),
    role: z.enum(["client", "agent", "admin"]),
    fullName: z.string().min(3),
    rg: z.string().optional(),
    cpf: z.string().optional(),
    address: z.string().optional(),
    phone: z.string().optional(),
    agentProfile: z
        .object({
            creci: z.string(),
            city: z.string(),
        })
        .optional(),
});
