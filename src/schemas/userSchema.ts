import { digitsOnly, isValidCPF } from "@/lib/utils";
import { z } from "zod";

const cpfOptionalSchema = z
    .string()
    .optional()
    .superRefine((value, ctx) => {
        if (!value?.trim()) return;
        const digits = digitsOnly(value);
        if (digits.length !== 11) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: "CPF deve ter 11 dígitos." });
            return;
        }
        if (!isValidCPF(digits)) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: "CPF inválido." });
        }
    });

const phoneSchema = z
    .string()
    .optional()
    .refine(value => {
        if (!value?.trim()) return true;
        const digits = digitsOnly(value);
        return digits.length >= 10 && digits.length <= 11;
    }, "Telefone deve ter 10 ou 11 dígitos.");

const optionalAgentField = (min: number, message: string) =>
    z
        .string()
        .optional()
        .refine(value => {
            if (!value?.trim()) return true;
            return value.trim().length >= min;
        }, message);

const agentProfileSchema = z.object({
    creci: optionalAgentField(3, "CRECI deve ter pelo menos 3 caracteres."),
    city: optionalAgentField(2, "Cidade deve ter pelo menos 2 caracteres."),
});

export const userSchemaBase = z.object({
    email: z.string().email("E-mail inválido"),
    password: z.string().min(6, "A senha deve ter pelo menos 6 caracteres.").optional(),
    role: z.enum(["client", "agent", "admin"], { required_error: "Selecione um tipo de usuário" }),
    fullName: z.string().min(3, "Nome deve ter pelo menos 3 caracteres."),
    rg: z.string().optional(),
    cpf: cpfOptionalSchema,
    address: z.string().optional(),
    phone: phoneSchema,
    agentProfile: agentProfileSchema.optional(),
});

export const enforceAgentProfileFields = (
    data: {
        role: "client" | "agent" | "admin";
        agentProfile?: { creci?: string | null; city?: string | null };
    },
    ctx: z.RefinementCtx
) => {
    if (data.role !== "agent") return;
    const creci = data.agentProfile?.creci?.trim();
    const city = data.agentProfile?.city?.trim();

    if (!creci) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "CRECI é obrigatório para corretores.",
            path: ["agentProfile", "creci"],
        });
    }

    if (!city) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Cidade é obrigatória para corretores.",
            path: ["agentProfile", "city"],
        });
    }
};

export const userSchema = userSchemaBase.superRefine(enforceAgentProfileFields);
