import { z } from "zod";

export const resetPasswordSchema = z.object({
    email: z.string({ required_error: "Email é obrigatório" }).trim().email("Insira um email válido"),
});

export type ResetPasswordData = z.infer<typeof resetPasswordSchema>;
