"use client";

import { Button } from "@/components/features/buttons/default-button";
import { Card, CardContent, CardHeader } from "@/components/features/cards/default-card";
import { Checkbox } from "@/components/features/checkboxes/default-checkbox";
import { JustInTimeDataModal } from "@/components/specifics/properties/justIn-time-data-modal";
import { auth } from "@/firebase/firebase-config";
import { Property } from "@/interfaces/property";
import { Unit } from "@/interfaces/unit";
import { User } from "@/interfaces/user";
import { lockBodyScroll, unlockBodyScroll } from "@/lib/scrollLock";
import { notifyError, notifySuccess } from "@/services/notificationService";
import { Loader, SquareCheck, SquareX } from "lucide-react";
import { useEffect, useState } from "react";

interface ReservationModalProps {
    unit: Unit;
    property: Property;
    onClose: () => void;
    onSubmit: () => void;
    isOpen: boolean;
}

export function ReservationModal({ onClose, unit, property, onSubmit, isOpen }: ReservationModalProps) {
    const [clientName, setClientName] = useState<string>("");
    const [haveFiles, setHaveFiles] = useState<{
        addressProof: boolean;
        incomeProof: boolean;
        identityDoc: boolean;
        marriageCert: boolean;
    }>({
        addressProof: false,
        incomeProof: false,
        identityDoc: false,
        marriageCert: false,
    });
    const [missingFields, setMissingFields] = useState<string[]>([]);
    const [termsAccepted, setTermsAccepted] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [jitOpen, setJitOpen] = useState<boolean>(false);
    const [jitFields, setJitFields] = useState<string[]>([]);

    useEffect(() => {
        if (isOpen) {
            lockBodyScroll();
            return () => unlockBodyScroll();
        }
    }, [isOpen]);

    useEffect(() => {
        if (!isOpen) {
            setTermsAccepted(false);
        }
    }, [isOpen]);

    async function loadUserAndStatus() {
        if (!auth.currentUser) {
            setClientName("");
            setHaveFiles({ addressProof: false, incomeProof: false, identityDoc: false, marriageCert: false });
            setMissingFields([
                "fullName",
                "cpf",
                "address",
                "phone",
                "addressProof",
                "incomeProof",
                "identityDoc",
                "bmCert",
            ]);
            return;
        }

        try {
            const response = await fetch("/api/user/profile", {
                method: "GET",
                credentials: "include",
                cache: "no-store",
            });

            if (!response.ok) {
                if (response.status === 401) {
                    setClientName("");
                    setHaveFiles({ addressProof: false, incomeProof: false, identityDoc: false, marriageCert: false });
                    setMissingFields([
                        "fullName",
                        "cpf",
                        "address",
                        "phone",
                        "addressProof",
                        "incomeProof",
                        "identityDoc",
                        "bmCert",
                    ]);
                    return;
                }
                const errPayload = await response.json().catch(() => null);
                console.error("Erro ao buscar perfil do usuário:", errPayload);
                return;
            }

            const payload = await response.json();
            const userData = (payload?.user as User | undefined) ?? null;

            if (!userData) {
                setClientName("");
                setMissingFields([
                    "fullName",
                    "cpf",
                    "address",
                    "phone",
                    "addressProof",
                    "incomeProof",
                    "identityDoc",
                    "bmCert",
                ]);
                setHaveFiles({ addressProof: false, incomeProof: false, identityDoc: false, marriageCert: false });
                return;
            }

            setClientName(userData.fullName ?? "");
            const documentsRecord = (userData.documents ?? {}) as Record<string, unknown>;
            const hasDoc = (key: string) => {
                const value = documentsRecord[key];
                return Array.isArray(value) && value.length > 0;
            };

            const filesStatus = {
                addressProof: hasDoc("addressProof"),
                incomeProof: hasDoc("incomeProof"),
                identityDoc: hasDoc("identityDoc"),
                marriageCert: hasDoc("bmCert") || hasDoc("marriageCert"),
            };
            setHaveFiles(filesStatus);

            const missing: string[] = [];
            const requiredFields = ["fullName", "cpf", "address", "phone"] as const;
            requiredFields.forEach(field => {
                const value = userData[field];
                if (!value || (typeof value === "string" && value.trim() === "")) {
                    missing.push(field);
                }
            });
            if (!filesStatus.addressProof) missing.push("addressProof");
            if (!filesStatus.incomeProof) missing.push("incomeProof");
            if (!filesStatus.identityDoc) missing.push("identityDoc");
            if (!filesStatus.marriageCert) missing.push("bmCert");
            setMissingFields(missing);
        } catch (error) {
            console.error("Erro ao carregar dados do usuário:", error);
        }
    }

    useEffect(() => {
        if (!isOpen) return;
        loadUserAndStatus();
    }, [isOpen]);

    const openJIT = (fields?: string[]) => {
        const toEdit = fields && fields.length > 0 ? fields : missingFields;
        if (toEdit.length === 0) return;
        setJitFields(toEdit);
        setJitOpen(true);
    };

    const handleReserve = async () => {
        if (!haveFiles.addressProof || !haveFiles.incomeProof || !haveFiles.identityDoc || !haveFiles.marriageCert) {
            const docsMissing = [
                !haveFiles.addressProof ? "addressProof" : null,
                !haveFiles.incomeProof ? "incomeProof" : null,
                !haveFiles.identityDoc ? "identityDoc" : null,
                !haveFiles.marriageCert ? "bmCert" : null,
            ].filter(Boolean) as string[];
            openJIT(docsMissing);
            return;
        }
        if (!termsAccepted) {
            notifyError("Por favor, aceite os termos e condições antes de reservar a unidade.");
            return;
        }

        try {
            setIsLoading(true);
            const res = await fetch("/api/requests/reservation", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    property: { id: property.id, name: property.name },
                    unit: { id: unit.id, identifier: unit.identifier, block: unit.block || "" },
                }),
            });

            const data = await res.json();

            if (res.ok) {
                notifySuccess("Sua solicitação de reserva foi enviada e está em análise!");
                onSubmit();
            } else {
                if (res.status === 409) {
                    switch (data.code) {
                        case "AVAILABILITY":
                            notifyError("Esta unidade acabou de se tornar indisponível.");
                            break;
                        case "DUPLICITY":
                            notifyError("Você já possui uma solicitação para esta unidade.");
                            break;
                        default:
                            notifyError("Conflito desconhecido ocorreu.");
                            break;
                    }
                } else {
                    notifyError("Falha ao criar a solicitação de reserva.");
                }
            }
        } catch (err) {
            console.error(err);
            notifyError("Erro de conexão com o servidor");
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 overflow-auto p-4">
            <div className="relative max-w-full max-h-full w-full sm:w-[90%] lg:w-[750px]">
                <Card className="p-4 overflow-auto max-h-[90vh] max-w-full">
                    <CardHeader>
                        <h2 className="text-center text-xl font-semibold">
                            Reserve a unidade {unit.identifier} no {property.name}
                        </h2>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-5 max-h-[60vh] overflow-y-auto px-1">
                            {missingFields.length > 0 && (
                                <div className="rounded-md border bg-amber-50 text-amber-900 p-3">
                                    <p className="text-sm">
                                        Existem informações pendentes no seu cadastro. Complete-as para prosseguir.
                                    </p>
                                    <div className="mt-2 flex gap-2 justify-end">
                                        <Button size="sm" variant="outline" onClick={() => openJIT()}>
                                            Completar agora
                                        </Button>
                                    </div>
                                </div>
                            )}

                            {/* Info destaque */}
                            <div className="rounded-lg border bg-muted/30 p-4 grid gap-4">
                                <div>
                                    <div className="text-[11px] uppercase tracking-wide text-muted-foreground">
                                        Imóvel
                                    </div>
                                    <div className="text-lg sm:text-xl font-semibold">{property.name}</div>
                                </div>
                                <>
                                    {unit.block && (
                                        <div>
                                            <div className="text-[11px] uppercase tracking-wide text-muted-foreground">
                                                Bloco
                                            </div>
                                            <div className="text-lg sm:text-xl font-semibold">{unit.block}</div>
                                        </div>
                                    )}
                                </>
                                <div>
                                    <div className="text-[11px] uppercase tracking-wide text-muted-foreground">
                                        Unidade
                                    </div>
                                    <div className="text-lg sm:text-xl font-semibold">{unit.identifier}</div>
                                </div>
                                <div className="flex items-center flex-wrap gap-2">
                                    <div>
                                        <div className="text-[11px] uppercase tracking-wide text-muted-foreground">
                                            Requerente
                                        </div>
                                        <div className="text-lg sm:text-xl font-semibold">{clientName || "—"}</div>
                                    </div>
                                    {(["fullName", "cpf", "address", "phone"].some(f => missingFields.includes(f)) && (
                                        <Button
                                            type="button"
                                            size="sm"
                                            variant="ghost"
                                            className="px-2 h-7 text-blue-600 underline"
                                            onClick={() =>
                                                openJIT(
                                                    ["fullName", "cpf", "address", "phone"].filter(f =>
                                                        missingFields.includes(f)
                                                    )
                                                )
                                            }
                                        >
                                            Completar dados
                                        </Button>
                                    )) ||
                                        null}
                                </div>
                            </div>

                            {/* Documentos em destaque */}
                            <div className="space-y-2">
                                <div className="flex items-baseline justify-between">
                                    <h3 className="text-lg font-semibold">Documentos</h3>
                                    <p className="text-xs text-muted-foreground ml-3">
                                        Envie os documentos obrigatórios para prosseguir
                                    </p>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {/* Endereço */}
                                    <div
                                        className={`rounded-lg border p-3 flex items-center justify-between ${
                                            haveFiles.addressProof
                                                ? "bg-green-50 border-green-200"
                                                : "bg-destructive/5 border-destructive/30"
                                        }`}
                                    >
                                        <div className="flex items-center gap-2">
                                            {haveFiles.addressProof ? (
                                                <SquareCheck className="h-6 w-6 text-green-600" />
                                            ) : (
                                                <SquareX className="h-6 w-6 text-red-600" />
                                            )}
                                            <span className="font-medium">Comprovante de Endereço</span>
                                        </div>
                                        {!haveFiles.addressProof && (
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => openJIT(["addressProof"])}
                                            >
                                                Enviar
                                            </Button>
                                        )}
                                    </div>

                                    {/* Renda */}
                                    <div
                                        className={`rounded-lg border p-3 flex items-center justify-between ${
                                            haveFiles.incomeProof
                                                ? "bg-green-50 border-green-200"
                                                : "bg-destructive/5 border-destructive/30"
                                        }`}
                                    >
                                        <div className="flex items-center gap-2">
                                            {haveFiles.incomeProof ? (
                                                <SquareCheck className="h-6 w-6 text-green-600" />
                                            ) : (
                                                <SquareX className="h-6 w-6 text-red-600" />
                                            )}
                                            <span className="font-medium">Comprovante de Renda</span>
                                        </div>
                                        {!haveFiles.incomeProof && (
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => openJIT(["incomeProof"])}
                                            >
                                                Enviar
                                            </Button>
                                        )}
                                    </div>

                                    {/* Identidade */}
                                    <div
                                        className={`rounded-lg border p-3 flex items-center justify-between ${
                                            haveFiles.identityDoc
                                                ? "bg-green-50 border-green-200"
                                                : "bg-destructive/5 border-destructive/30"
                                        }`}
                                    >
                                        <div className="flex items-center gap-2">
                                            {haveFiles.identityDoc ? (
                                                <SquareCheck className="h-6 w-6 text-green-600" />
                                            ) : (
                                                <SquareX className="h-6 w-6 text-red-600" />
                                            )}
                                            <span className="font-medium">Documento de Identidade</span>
                                        </div>
                                        {!haveFiles.identityDoc && (
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => openJIT(["identityDoc"])}
                                            >
                                                Enviar
                                            </Button>
                                        )}
                                    </div>

                                    {/* Casamento */}
                                    <div
                                        className={`rounded-lg border p-3 flex items-center justify-between ${
                                            haveFiles.marriageCert
                                                ? "bg-green-50 border-green-200"
                                                : "bg-destructive/5 border-destructive/30"
                                        }`}
                                    >
                                        <div className="flex items-center gap-2">
                                            {haveFiles.marriageCert ? (
                                                <SquareCheck className="h-6 w-6 text-green-600" />
                                            ) : (
                                                <SquareX className="h-6 w-6 text-red-600" />
                                            )}
                                            <span className="font-medium">Cert. de Nascimento/Casamento</span>
                                        </div>
                                        {!haveFiles.marriageCert && (
                                            <Button size="sm" variant="outline" onClick={() => openJIT(["bmCert"])}>
                                                Enviar
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Aceite dos termos em destaque */}
                            <div className="rounded-lg p-4 flex items-center gap-4">
                                <Checkbox
                                    id="terms"
                                    className="border border-black scale-110 cursor-pointer"
                                    checked={termsAccepted}
                                    onCheckedChange={checked => setTermsAccepted(!!checked)}
                                />
                                <label htmlFor="terms" className="text-base">
                                    <span className="font-medium">Li e aceito os</span>
                                    <a
                                        className="text-blue-500 underline ml-1 font-medium"
                                        href="https://meu-ape-conpec.vercel.app/terms-and-conditions"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                    >
                                        termos e condições
                                    </a>
                                </label>
                            </div>
                        </div>

                        {/* Sticky footer like other modals */}
                        <div className="mt-6 pt-4 border-t sticky -bottom-4 bg-background flex justify-end gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={onClose}
                                disabled={isLoading}
                                className="cursor-pointer"
                            >
                                Cancelar
                            </Button>
                            <Button
                                type="button"
                                onClick={handleReserve}
                                disabled={isLoading || !termsAccepted}
                                className="cursor-pointer"
                            >
                                {isLoading ? <Loader className="animate-spin size-4" /> : "Enviar"}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
                <JustInTimeDataModal
                    isOpen={jitOpen}
                    missingFields={jitFields}
                    onClose={() => setJitOpen(false)}
                    onSubmit={async () => {
                        await loadUserAndStatus();
                        setJitOpen(false);
                        notifySuccess("Informações atualizadas.");
                    }}
                />
            </div>
        </div>
    );
}
