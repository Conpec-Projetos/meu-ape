import { ReservationRequestListItem } from "@/interfaces/adminRequestsResponse";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export type RequestStatusUrl = "pendente" | "aprovada" | "negada";

export type RequestTab = "visits" | "reservations";

export const TAB_URL_TO_INTERNAL: Record<string, RequestTab> = {
    visitas: "visits",
    reservas: "reservations",
};

export const TAB_INTERNAL_TO_URL: Record<RequestTab, string> = {
    visits: "visitas",
    reservations: "reservas",
};

export const STATUS_URL_TO_INTERNAL: Record<RequestStatusUrl, "pending" | "approved" | "denied"> = {
    pendente: "pending",
    aprovada: "approved",
    negada: "denied",
};

export const STATUS_INTERNAL_TO_URL: Record<"pending" | "approved" | "denied", RequestStatusUrl> = {
    pending: "pendente",
    approved: "aprovada",
    denied: "negada",
};

export const STATUS_BADGE_MAP: Record<
    string,
    { label: string; variant: "default" | "secondary" | "outline" | "destructive" }
> = {
    pending: { label: "Pendente", variant: "secondary" },
    approved: { label: "Aprovada", variant: "default" },
    denied: { label: "Negada", variant: "destructive" },
    completed: { label: "Concluída", variant: "outline" },
};

export const STATUS_FILTER_OPTIONS: Array<{ urlValue?: RequestStatusUrl; label: string }> = [
    { urlValue: undefined, label: "Todas" },
    { urlValue: "pendente", label: "Pendentes" },
    { urlValue: "aprovada", label: "Aprovadas" },
    { urlValue: "negada", label: "Negadas" },
];

export const DOCUMENT_GROUPS: Array<{
    key: keyof Pick<ReservationRequestListItem["client"], "identityDoc" | "incomeProof" | "addressProof" | "bmCert">;
    label: string;
}> = [
    { key: "identityDoc", label: "Documentos de identidade" },
    { key: "incomeProof", label: "Comprovantes de renda" },
    { key: "addressProof", label: "Comprovantes de endereço" },
    { key: "bmCert", label: "Certidões" },
];

export const ITEMS_PER_PAGE_LABEL = 15;

export function formatDateTime(value?: string | null) {
    if (!value) return "-";
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return "-";
    return format(parsed, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
}
