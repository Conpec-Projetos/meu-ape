"use client";

import { Button } from "@/components/features/buttons/default-button";
import { Card, CardContent, CardHeader } from "@/components/features/cards/default-card";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Property } from "@/interfaces/property";
import { Unit } from "@/interfaces/unit";
import { lockBodyScroll, unlockBodyScroll } from "@/lib/scrollLock";
import { notifyError } from "@/services/notificationService";
import { Loader } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { ptBR } from "react-day-picker/locale";
import { toast } from "sonner";

interface VisitModalProps {
    unit: Unit;
    property: Property;
    onClose: () => void;
    onSubmit: () => void;
    isOpen: boolean;
}

const times = Array.from({ length: 20 }, (_, i) => {
    const hour = 8 + Math.floor(i / 2);
    const minutes = i % 2 === 0 ? "00" : "30";
    return `${hour.toString().padStart(2, "0")}:${minutes}`;
});

export function VisitModal({ onClose, unit, property, onSubmit, isOpen }: VisitModalProps) {
    const [selectedDay, setSelectedDay] = useState<Date | undefined>(() => {
        const d = new Date();
        d.setDate(d.getDate() + 1);
        return d;
    });

    const [selected, setSelected] = useState<Record<string, boolean>>({});
    const [disabledKeys, setDisabledKeys] = useState<Set<string>>(new Set());
    const [conflictLoading, setConflictLoading] = useState(false);

    const tomorrow = useMemo(() => {
        const d = new Date();
        d.setDate(d.getDate() + 1);
        return d;
    }, []);

    const endDate = useMemo(() => {
        const d = new Date();
        d.setDate(d.getDate() + 14);
        return d;
    }, []);

    const normalizeDate = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
    const isDateInAllowedRange = (d: Date) => {
        const nd = normalizeDate(d);
        const min = normalizeDate(tomorrow);
        const max = normalizeDate(endDate);
        return nd.getTime() >= min.getTime() && nd.getTime() <= max.getTime();
    };

    const makeDayLabel = (date: Date) => {
        const weekday = date.toLocaleDateString("pt-BR", { weekday: "short" });
        const dd = String(date.getDate()).padStart(2, "0");
        const mm = String(date.getMonth() + 1).padStart(2, "0");
        return `${weekday} ${dd}/${mm}`;
    };

    const makeKey = (date: Date, time: string) => `${makeDayLabel(date)}-${time}`;

    const toggleTime = (time: string) => {
        if (!selectedDay) return;
        if (!isDateInAllowedRange(selectedDay)) return; // Não permite fora da janela
        const key = makeKey(selectedDay, time);
        if (disabledKeys.has(key)) return; // Bloqueia horários já solicitados
        setSelected(prev => ({ ...prev, [key]: !prev[key] }));
    };

    useEffect(() => {
        if (isOpen) {
            lockBodyScroll();
            return () => unlockBodyScroll();
        }
    }, [isOpen]);

    const [loading, setLoading] = useState(false);
    const SELECT_PERSIST_TTL_MS = 5 * 60 * 1000; // 5 minutos

    useEffect(() => {
        if (!isOpen) return;
        try {
            const key = `visitSelection:${property.id}:${unit.id}`;
            const raw = localStorage.getItem(key);
            if (!raw) return;
            const data = JSON.parse(raw) as {
                ts: number;
                selected: Record<string, boolean>;
                selectedDay?: string | null;
            };
            if (!data || !data.ts || Date.now() - data.ts > SELECT_PERSIST_TTL_MS) return;
            if (data.selected) setSelected(data.selected);
            if (data.selectedDay) {
                const d = new Date(data.selectedDay);
                if (!isNaN(d.getTime())) {
                    setSelectedDay(isDateInAllowedRange(d) ? d : tomorrow);
                }
            }
        } catch {}
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen, property.id, unit.id]);

    useEffect(() => {
        if (!isOpen) return;
        try {
            const key = `visitSelection:${property.id}:${unit.id}`;
            localStorage.setItem(
                key,
                JSON.stringify({
                    ts: Date.now(),
                    selected,
                    selectedDay: selectedDay ? selectedDay.toISOString() : null,
                })
            );
        } catch {}
    }, [isOpen, selected, selectedDay, property.id, unit.id]);

    // Desabilitar horários já solicitados
    const coerceDate = (val: unknown): Date | undefined => {
        if (!val) return undefined;
        if (val instanceof Date) return val;
        if (typeof val === "string") {
            const t = Date.parse(val);
            if (!Number.isNaN(t)) return new Date(t);
        }
        if (typeof val === "number") return new Date(val);
        return undefined;
    };

    const fetchConflicts = async () => {
        try {
            setConflictLoading(true);
            let cursor: string | undefined = undefined;
            const disabled = new Set<string>();
            do {
                const url = new URL(`/api/user/requests`, window.location.origin);
                url.searchParams.set("type", "visits");
                if (cursor) url.searchParams.set("cursor", cursor);
                const res = await fetch(url.toString());
                if (!res.ok) break;
                const data: {
                    requests: Array<{
                        status: string;
                        property?: { id?: string; name?: string };
                        requestedSlots?: unknown[];
                    }>;
                    nextPageCursor: string | null;
                    hasNextPage: boolean;
                } = await res.json();

                for (const r of data.requests) {
                    const status = (r.status || "").toLowerCase();
                    if (status !== "pending" && status !== "approved") continue;
                    const sameProperty =
                        (r.property && r.property.id && property.id && r.property.id === property.id) ||
                        (r.property && r.property.name && r.property.name === property.name);
                    if (!sameProperty) continue;
                    if (!Array.isArray(r.requestedSlots)) continue;
                    for (const s of r.requestedSlots) {
                        const d = coerceDate(s);
                        if (!d) continue;
                        const hh = String(d.getHours()).padStart(2, "0");
                        const mm = String(d.getMinutes()).padStart(2, "0");
                        const time = `${hh}:${mm}`;
                        const key = `${makeDayLabel(d)}-${time}`;
                        disabled.add(key);
                    }
                }

                cursor = data.hasNextPage && data.nextPageCursor ? data.nextPageCursor : undefined;
            } while (cursor);

            setDisabledKeys(disabled);
        } catch (e) {
            console.error("Erro ao buscar conflitos de horários", e);
        } finally {
            setConflictLoading(false);
        }
    };

    useEffect(() => {
        if (!isOpen) return;
        fetchConflicts();
        const id = setInterval(fetchConflicts, 30000);
        return () => clearInterval(id);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen, property.id]);
    const handleSave = async () => {
        const selectedSlots = Object.entries(selected)
            .filter(([, isSelected]) => isSelected)
            .map(([key]) => key);

        if (selectedSlots.length === 0) {
            toast.error("Por favor, selecione ao menos um horário para a visita");
        } else {
            try {
                setLoading(true);
                const res = await fetch("/api/requests/visit", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ requestedSlots: selectedSlots, property: property, unit: unit }),
                });

                const data = await res.json();

                if (res.ok) {
                    toast.success("Sua solicitação foi enviada!");
                    onSubmit();
                } else {
                    console.error(data);
                    if (res.status == 409) {
                        notifyError("Você já possui uma solicitação para este imóvel");
                    } else {
                        notifyError(data.error);
                    }
                }
            } catch (err) {
                console.error(err);
                notifyError("Erro de conexão com o servidor");
            } finally {
                setLoading(false);
            }
        }
    };

    function parseDateTime(str: string) {
        const parts = str.split(" ")[1];
        const [datePart, timePart] = parts.split("-");
        const [day, month] = datePart.split("/").map(Number);
        const [hour, minute] = timePart.split(":").map(Number);

        return { day, month, hour, minute };
    }

    // Função de comparação para sort
    function compareDateTime(a: [string, boolean], b: [string, boolean]) {
        const d1 = parseDateTime(a[0]);
        const d2 = parseDateTime(b[0]);

        if (d1.month !== d2.month) return d1.month - d2.month;
        if (d1.day !== d2.day) return d1.day - d2.day;
        if (d1.hour !== d2.hour) return d1.hour - d2.hour;
        return d1.minute - d2.minute;
    }

    useEffect(() => {
        if (!isOpen) {
            setSelected({});
        }
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 overflow-auto p-4">
            <div className="relative max-w-full max-h-full w-full sm:w-[90%] lg:w-[850px]">
                <Card className="p-6 overflow-auto max-h-[90vh] max-w-full">
                    <CardHeader>
                        <h2 className="text-lg font-bold text-center">
                            Selecione as datas e horários disponíveis para a visita
                        </h2>
                    </CardHeader>

                    <CardContent className="overflow-auto p-6 flex-1">
                        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                            {/* Calendar */}
                            <div className="lg:col-span-2">
                                <Calendar
                                    mode="single"
                                    selected={selectedDay}
                                    onSelect={setSelectedDay}
                                    fromDate={tomorrow}
                                    toDate={endDate}
                                    locale={ptBR}
                                    disabled={{ before: tomorrow, after: endDate }}
                                />
                            </div>

                            {/* Time slots */}
                            <div className="lg:col-span-3">
                                <h3 className="text-md font-semibold mb-3">Horários</h3>
                                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
                                    {times.map(time => {
                                        const key = selectedDay ? makeKey(selectedDay, time) : undefined;
                                        const isSelected = key ? !!selected[key] : false;
                                        const isDayOut = selectedDay ? !isDateInAllowedRange(selectedDay) : true;
                                        const isDisabled = key ? disabledKeys.has(key) || isDayOut : true;
                                        return (
                                            <button
                                                key={time}
                                                type="button"
                                                onClick={() => toggleTime(time)}
                                                disabled={!selectedDay || isDisabled}
                                                className={`text-sm px-3 py-2 rounded border transition-colors ${
                                                    isSelected
                                                        ? "bg-primary text-primary-foreground border-primary"
                                                        : isDisabled
                                                          ? "bg-muted text-muted-foreground border-muted/50 cursor-not-allowed"
                                                          : "bg-background text-foreground border-muted hover:bg-accent"
                                                } ${!selectedDay || isDisabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
                                                title={
                                                    !selectedDay
                                                        ? "Selecione um dia"
                                                        : isDisabled
                                                          ? isDayOut
                                                              ? "Fora da janela permitida"
                                                              : "Horário já solicitado"
                                                          : `${makeDayLabel(selectedDay)} ${time}`
                                                }
                                            >
                                                {time}
                                            </button>
                                        );
                                    })}
                                </div>

                                {/* Selected list */}
                                <div className="mt-5">
                                    <h4 className="text-sm font-medium mb-2">Horários selecionados</h4>
                                    {Object.entries(selected).filter(([, v]) => v).length === 0 ? (
                                        <p className="text-sm text-muted-foreground">Nenhum horário selecionado.</p>
                                    ) : (
                                        <div className="flex flex-wrap gap-2">
                                            {Object.entries(selected)
                                                .filter(([, v]) => v)
                                                .sort(compareDateTime)
                                                .map(([key]) => (
                                                    <span
                                                        key={key}
                                                        className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm bg-green-50 text-green-900 border-green-200"
                                                    >
                                                        {key.replace("-", " às ")}
                                                        <button
                                                            type="button"
                                                            className="cursor-pointer ml-1 text-xs text-green-900/70 hover:text-green-900"
                                                            onClick={() =>
                                                                setSelected(prev => ({ ...prev, [key]: false }))
                                                            }
                                                            aria-label={`Remover ${key}`}
                                                        >
                                                            ×
                                                        </button>
                                                    </span>
                                                ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </CardContent>

                    <CardContent>
                        <div className="p-4 bg-white">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                                <div className="flex items-center gap-2">
                                    {selectedDay && (
                                        <Badge variant="secondary">
                                            Dia selecionado: {String(selectedDay.getDate()).padStart(2, "0")}/
                                            {String(selectedDay.getMonth() + 1).padStart(2, "0")}
                                        </Badge>
                                    )}
                                    <Badge variant="outline">
                                        {Object.values(selected).filter(Boolean).length} horário(s)
                                    </Badge>
                                    {conflictLoading && (
                                        <span className="text-xs text-muted-foreground">Atualizando conflitos…</span>
                                    )}
                                </div>
                                <div className="flex justify-center gap-2">
                                    <Button
                                        className="cursor-pointer"
                                        onClick={onClose}
                                        variant={"outline"}
                                        disabled={loading}
                                    >
                                        Cancelar
                                    </Button>
                                    <Button
                                        onClick={handleSave}
                                        variant={"default"}
                                        disabled={loading || Object.values(selected).every(v => !v)}
                                        className="cursor-pointer"
                                    >
                                        <span className={loading ? "invisible" : "visible"}>Enviar</span>
                                        {loading && (
                                            <Loader
                                                className="w-5 h-5 text-muted-foreground absolute"
                                                style={{ animation: "spin 4s linear infinite" }}
                                            />
                                        )}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
