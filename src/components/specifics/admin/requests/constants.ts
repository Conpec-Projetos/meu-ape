import { ReservationRequestListItem } from "@/interfaces/adminRequestsResponse";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CheckCircle2, Clock, XCircle, type LucideIcon } from "lucide-react";

export type RequestStatusUrl = "pendente" | "aprovada" | "negada" | "concluida";

export type RequestTab = "visits" | "reservations";

export const TAB_URL_TO_INTERNAL: Record<string, RequestTab> = {
    visitas: "visits",
    reservas: "reservations",
};

export const TAB_INTERNAL_TO_URL: Record<RequestTab, string> = {
    visits: "visitas",
    reservations: "reservas",
};

export const STATUS_URL_TO_INTERNAL: Record<RequestStatusUrl, "pending" | "approved" | "denied" | "completed"> = {
    pendente: "pending",
    aprovada: "approved",
    negada: "denied",
    concluida: "completed",
};

export const STATUS_INTERNAL_TO_URL: Record<"pending" | "approved" | "denied" | "completed", RequestStatusUrl> = {
    pending: "pendente",
    approved: "aprovada",
    denied: "negada",
    completed: "concluida",
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

// Visual meta for status badges with colors and icons, aligned with /dashboard
export const STATUS_META: Record<string, { label: string; classes: string; Icon: LucideIcon }> = {
    pending: {
        label: "Pendente",
        Icon: Clock,
        classes: "border-amber-300 text-amber-700 bg-amber-50 dark:bg-amber-950/40",
    },
    approved: {
        label: "Aprovada",
        Icon: CheckCircle2,
        classes: "border-emerald-300 text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40",
    },
    completed: {
        label: "Concluída",
        Icon: CheckCircle2,
        classes: "border-emerald-300 text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40",
    },
    denied: {
        label: "Negada",
        Icon: XCircle,
        classes: "border-rose-300 text-rose-700 bg-rose-50 dark:bg-rose-950/40",
    },
};

export const STATUS_FILTER_OPTIONS: Array<{ urlValue?: RequestStatusUrl; label: string }> = [
    { urlValue: undefined, label: "Todas" },
    { urlValue: "pendente", label: "Pendentes" },
    { urlValue: "aprovada", label: "Aprovadas" },
    { urlValue: "negada", label: "Negadas" },
    { urlValue: "concluida", label: "Concluídas" },
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
