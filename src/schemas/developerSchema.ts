import z from "zod";

export const contactSchema = z.object({
    id: z.string().optional(),
    name: z.string().min(1),
    email: z.string().email("E-mail inválido"),
    phone: z.string().min(1, "Telefone é obrigatório"),
    state: z.string().min(1, "Estado é obrigatório"),
    city: z.string().min(1, "Cidade é obrigatória"),
});

export const developerSchema = z.object({
    name: z.string().min(1),
    website: z.string().nullable().optional(),
    email: z.string().nullable().optional(),
    phone: z.string().nullable().optional(),
    logo_url: z.string().nullable().optional(),
    contacts: z.array(contactSchema).optional(),
});
