import z from "zod";

export const userDataSchema = z.object({
    fullName: z.string().min(2, "Nome muito curto").nonempty("Nome completo é obrigatório"),
    cpf: z
        .string()
        .nonempty("CPF é obrigatório")
        .min(11, "CPF muito curto")
        .max(14, "CPF muito longo")
        .regex(/^\d{3}\.?\d{3}\.?\d{3}-?\d{2}$/, "CPF deve conter apenas números e pontos/hífens opcionais"),
    address: z.string().nonempty("Endereço é obrigatório").min(5, "Endereço muito curto"),
    phone: z
        .string()
        .nonempty("Telefone é obrigatório")
        .min(10, "Telefone muito curto")
        .max(15, "Telefone muito longo")
        .regex(/^\(?\d{2}\)?\s?\d{4,5}-?\d{4}$/, "Telefone deve conter apenas números e o formato (XX) XXXXX-XXXX"),
    addressProof: z
        .any()
        .refine(files => (files instanceof FileList || Array.isArray(files)) && files.length >= 1, {
            message: "Comprovante de endereço obrigatório",
        })
        .refine(
            files => {
                const arr = files instanceof FileList ? Array.from(files) : Array.isArray(files) ? files : [];
                const f = arr[0];
                return f && typeof (f as File).size === "number" && (f as File).size > 0;
            },
            {
                message: "Arquivo inválido",
            }
        ),
    incomeProof: z
        .any()
        .refine(files => (files instanceof FileList || Array.isArray(files)) && files.length >= 1, {
            message: "Comprovante de renda obrigatório",
        })
        .refine(
            files => {
                const arr = files instanceof FileList ? Array.from(files) : Array.isArray(files) ? files : [];
                const f = arr[0];
                return !!f && typeof (f as File).size === "number" && (f as File).size > 0;
            },
            {
                message: "Arquivo inválido",
            }
        ),
    identityDoc: z
        .any()
        .refine(files => (files instanceof FileList || Array.isArray(files)) && files.length >= 1, {
            message: "Documento de identidade obrigatório",
        })
        .refine(
            files => {
                const arr = files instanceof FileList ? Array.from(files) : Array.isArray(files) ? files : [];
                const f = arr[0];
                return !!f && typeof (f as File).size === "number" && (f as File).size > 0;
            },
            {
                message: "Arquivo inválido",
            }
        ),
    bmCert: z
        .any()
        .refine(files => (files instanceof FileList || Array.isArray(files)) && files.length >= 1, {
            message: "Certidão de nascimento ou casamento obrigatória",
        })
        .refine(
            files => {
                const arr = files instanceof FileList ? Array.from(files) : Array.isArray(files) ? files : [];
                const f = arr[0];
                return !!f && typeof (f as File).size === "number" && (f as File).size > 0;
            },
            {
                message: "Arquivo inválido",
            }
        ),
});
