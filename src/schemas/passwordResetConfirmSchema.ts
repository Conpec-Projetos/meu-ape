import { z } from "zod";

export const passwordResetConfirmSchema = z
    .object({
        password: z
            .string({ required_error: "Senha é obrigatória" })
            .min(8, "A nova senha deve ter pelo menos 8 caracteres"),
        confirmPassword: z.string({ required_error: "Confirme a nova senha" }),
    })
    .refine(data => data.password === data.confirmPassword, {
        message: "As senhas precisam ser iguais",
        path: ["confirmPassword"],
    });

export type PasswordResetConfirmData = z.infer<typeof passwordResetConfirmSchema>;
