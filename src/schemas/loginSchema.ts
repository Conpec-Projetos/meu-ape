import { z } from "zod";

export const loginSchema = z.object({
    email: z.string().email({ message: "E-mail inválido" }),
    password: z.string().min(1, { message: "Senha é obrigatória" }),
});

export type LoginData = z.infer<typeof loginSchema>;
