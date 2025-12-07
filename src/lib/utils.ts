import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export const digitsOnly = (value?: string) => (value || "").replace(/\D/g, "");

export const formatCPF = (value: string) => {
    const digits = digitsOnly(value).slice(0, 11);
    if (!digits) return "";
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
    if (digits.length <= 9) {
        return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
    }
    return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
};

export const formatPhone = (value: string) => {
    const digits = digitsOnly(value).slice(0, 11);
    if (!digits) return "";
    if (digits.length <= 2) return `(${digits}`;
    if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
    if (digits.length <= 10) {
        return `(${digits.slice(0, 2)}) ${digits.slice(2, digits.length - 4)}-${digits.slice(digits.length - 4)}`;
    }
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`;
};

export const isValidCPF = (value: string) => {
    const digits = digitsOnly(value);
    if (digits.length !== 11 || /^([0-9])\1{10}$/.test(digits)) return false;

    const calcCheckDigit = (length: number) => {
        let sum = 0;
        for (let i = 0; i < length; i += 1) {
            sum += parseInt(digits[i] ?? "0", 10) * (length + 1 - i);
        }
        const mod = (sum * 10) % 11;
        return mod === 10 ? 0 : mod;
    };

    const firstDigit = calcCheckDigit(9);
    const secondDigit = calcCheckDigit(10);

    return firstDigit === parseInt(digits[9] ?? "-1", 10) && secondDigit === parseInt(digits[10] ?? "-1", 10);
};
