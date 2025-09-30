import z from "zod";

const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

export const propertySchema = z.object({
    nome: z.string().min(1, "Nome obrigatório"),
    localizacao: z.string().min(1, "Localização obrigatória"),
    dataLancamento: z.string().refine(val => dateRegex.test(val), {
        message: "Data deve estar no formato AAAA-MM-DD",
    }),
    dataEntrega: z.string().refine(val => dateRegex.test(val), {
        message: "Data deve estar no formato AAAA-MM-DD",
    }),
});
