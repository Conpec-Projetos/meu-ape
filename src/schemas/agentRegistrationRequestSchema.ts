import { z } from "zod";

const cleanCpf = (value: string) => value.replace(/\D/g, "");

const cpfIsValid = (digits: string) => {
    if (!/^[0-9]{11}$/.test(digits)) return false;
    if (/^(\d)\1{10}$/.test(digits)) return false;

    const calcDigit = (length: number) => {
        let sum = 0;
        for (let i = 0; i < length - 1; i += 1) {
            sum += parseInt(digits.charAt(i), 10) * (length - i);
        }
        const remainder = (sum * 10) % 11;
        return remainder === 10 ? 0 : remainder;
    };

    const digit1 = calcDigit(10);
    const digit2 = calcDigit(11);

    return digit1 === parseInt(digits.charAt(9), 10) && digit2 === parseInt(digits.charAt(10), 10);
};

export const agentSchema = z
    .object({
        email: z.string().nonempty("Email é obrigatório").email("Email inválido"),
        fullName: z.string().min(2, "Nome muito curto").nonempty("Nome completo é obrigatório"),
        cpf: z
            .string()
            .nonempty("CPF é obrigatório")
            .regex(/^\d{3}\.\d{3}\.\d{3}-\d{2}$/, "CPF deve estar no formato 000.000.000-00")
            .refine(value => cpfIsValid(cleanCpf(value)), {
                message: "CPF inválido",
            }),
        rg: z
            .string()
            .nonempty("RG é obrigatório")
            .regex(/^[0-9]{2}\.[0-9]{3}\.[0-9]{3}-[0-9Xx]$/, "RG deve estar no formato 00.000.000-0"),
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
            .regex(/^\(\d{2}\)\s\d{4,5}-\d{4}$/, "Telefone deve estar no formato (00) 0000-0000 ou (00) 00000-0000"),
    })
    .refine(data => data.password === data.confirmPassword, {
        message: "As senhas não coincidem",
        path: ["confirmPassword"],
    });

export type AgentFormData = z.infer<typeof agentSchema>;
