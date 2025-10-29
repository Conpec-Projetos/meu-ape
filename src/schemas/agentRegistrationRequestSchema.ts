import { z } from "zod";

export const agentSchema = z
    .object({
        email: z.string().nonempty("Email é obrigatório").email("Email inválido"),
        fullName: z.string().min(2, "Nome muito curto").nonempty("Nome completo é obrigatório"),
        cpf: z
            .string()
            .nonempty("CPF é obrigatório")
            .min(11, "CPF muito curto")
            .max(14, "CPF muito longo")
            .regex(/^\d{3}\.?\d{3}\.?\d{3}-?\d{2}$/, "CPF deve conter apenas números e pontos/hífens opcionais"),
        rg: z
            .string()
            .nonempty("RG é obrigatório")
            .min(7, "RG muito curto")
            .max(12, "RG muito longo")
            .regex(/^\d{1,2}\.?\d{3}\.?\d{3}-?[0-9Xx]$/, "RG deve conter apenas números e pontos/hífens opcionais"),
        address: z.string().nonempty("Endereço é obrigatório").min(5, "Endereço muito curto"),
        city: z.string().nonempty("Cidade é obrigatória").min(2, "Cidade muito curta"),
        creci: z.string().nonempty("CRECI é obrigatório"),
        creciCardPhoto: z
            .array(z.instanceof(File))
            .min(1, { message: "Carteirinha do CRECI obrigatória" })
            .refine(files => files[0]?.size > 0, {
                message: "Arquivo inválido.",
            }),
        creciCert: z
            .array(z.instanceof(File))
            .min(1, { message: "Certidão de regularidade do CRECI obrigatória" })
            .refine(files => files[0]?.size > 0, {
                message: "Arquivo inválido.",
            }),
        password: z.string().nonempty("Senha é obrigatória").min(8, "Senha deve ter no mínimo 8 caracteres"),
        confirmPassword: z
            .string()
            .nonempty("Confirmação de senha é obrigatória")
            .min(8, "Confirmação de senha deve ter no mínimo 8 caracteres"),
        phone: z
            .string()
            .nonempty("Telefone é obrigatório")
            .min(10, "Telefone muito curto")
            .max(15, "Telefone muito longo")
            .regex(/^\(?\d{2}\)?\s?\d{4,5}-?\d{4}$/, "Telefone deve conter apenas números e o formato (XX) XXXXX-XXXX"),
    })
    .refine(data => data.password === data.confirmPassword, {
        message: "As senhas não coincidem",
        path: ["confirmPassword"],
    });

export type AgentFormData = z.infer<typeof agentSchema>;
