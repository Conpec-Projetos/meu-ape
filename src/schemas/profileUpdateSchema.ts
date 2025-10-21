import { z } from "zod";

const cpfClean = (s: string) => (typeof s === "string" ? s.replace(/\D/g, "") : "");


const cpfIsValid = (digits: string) => {
  if (!/^[0-9]{11}$/.test(digits)) return false;
  if (/^(\d)\1{10}$/.test(digits)) return false;
  const calc = (t: number) => {
    let sum = 0;
    for (let i = 0; i < t - 1; i++) sum += parseInt(digits.charAt(i)) * (t - i);
    const r = (sum * 10) % 11;
    return r === 10 ? 0 : r;
  };
  const d1 = calc(10);
  const d2 = calc(11);
  return d1 === parseInt(digits.charAt(9)) && d2 === parseInt(digits.charAt(10));
};

export const profileUpdateSchema = z
  .object({
    fullName: z
      .preprocess((v) => (typeof v === "string" ? v.trim() : v), z.string().min(2).max(100))
      .optional(),
    address: z
      .preprocess((v) => (typeof v === "string" ? v.trim() : v), z.string().max(200))
      .optional(),
    phone: z
      .preprocess((v) => (typeof v === "string" ? v.replace(/\D/g, "") : v), z.string())
      .refine((p) => typeof p === "string" && p.length >= 8 && p.length <= 15, { message: "Telefone Invalido" })
      .optional(),
    cpf: z
      .preprocess((v) => (typeof v === "string" ? cpfClean(v) : v), z.string())
      .refine((c) => typeof c === "string" && cpfIsValid(c), { message: "CPF inválido" })
      .optional(),
  })
  .refine((obj) => Object.values(obj).some((v) => v !== undefined), { message: "Nenhum campo para atualizar" });

export type ProfileUpdate = z.infer<typeof profileUpdateSchema>;
