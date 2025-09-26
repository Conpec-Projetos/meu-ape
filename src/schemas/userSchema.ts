import { z } from "zod";

// Schema mock de usuário
export const userSchema = z.object({
    fullName: z.string().min(2),
    email: z.string().email(),
    role: z.enum(["client", "agent", "admin"]),
    cpf: z.string().min(11).max(11).optional(),
    // TODO: adicionar o resto dos campos necessários para validação
});

// Inferindo o tipo a partir do schema
export type User = z.infer<typeof userSchema>;
