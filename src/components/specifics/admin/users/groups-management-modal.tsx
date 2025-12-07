"use client";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

type AccessGroup = {
    id: string;
    name: string;
    description?: string | null;
};

interface GroupsManagementModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const mapGroupsPayload = (payload: unknown): AccessGroup[] => {
    if (Array.isArray(payload)) {
        return payload
            .filter(Boolean)
            .map(item => {
                const record = item as Partial<AccessGroup>;
                return {
                    id: String(record.id ?? ""),
                    name: String(record.name ?? ""),
                    description: (record.description as string | null | undefined) ?? null,
                };
            })
            .filter(group => Boolean(group.id));
    }

    if (payload && typeof payload === "object" && Array.isArray((payload as { groups?: unknown[] }).groups)) {
        return mapGroupsPayload((payload as { groups: unknown[] }).groups);
    }

    return [];
};

export function GroupsManagementModal({ isOpen, onClose }: GroupsManagementModalProps) {
    const [groups, setGroups] = useState<AccessGroup[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [fetchError, setFetchError] = useState<string | null>(null);
    const [formValues, setFormValues] = useState({ name: "", description: "" });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

    const sortedGroups = useMemo(() => {
        return [...groups].sort((a, b) => a.name.localeCompare(b.name, "pt-BR", { sensitivity: "base" }));
    }, [groups]);

    useEffect(() => {
        if (!isOpen) return;
        let active = true;

        async function fetchGroups() {
            setIsLoading(true);
            setFetchError(null);
            try {
                const response = await fetch("/api/admin/groups");
                const payload = await response.json().catch(() => ({}));
                if (!response.ok) {
                    throw new Error(payload?.error || "Não foi possível carregar os grupos.");
                }
                if (!active) return;
                setGroups(mapGroupsPayload(payload));
            } catch (error) {
                console.error("Erro ao carregar grupos", error);
                if (!active) return;
                setFetchError("Não foi possível carregar os grupos.");
            } finally {
                if (active) setIsLoading(false);
            }
        }

        fetchGroups();
        return () => {
            active = false;
        };
    }, [isOpen]);

    const handleCreateGroup = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const trimmedName = formValues.name.trim();
        if (!trimmedName) {
            toast.error("Informe o nome do grupo.");
            return;
        }

        setIsSubmitting(true);
        try {
            const response = await fetch("/api/admin/groups", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: trimmedName, description: formValues.description.trim() || null }),
            });
            const payload = await response.json().catch(() => ({}));
            if (!response.ok) {
                throw new Error(payload?.error || "Erro ao criar grupo.");
            }

            const createdList = mapGroupsPayload([payload]);
            if (createdList[0]) {
                setGroups(prev => [...prev, createdList[0]]);
            }
            setFormValues({ name: "", description: "" });
            toast.success("Grupo criado com sucesso.");
        } catch (error) {
            console.error("Erro ao criar grupo", error);
            toast.error(error instanceof Error ? error.message : "Erro ao criar grupo.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteGroup = async (groupId: string) => {
        setDeleteTarget(groupId);
        try {
            const response = await fetch(`/api/admin/groups/${groupId}`, { method: "DELETE" });
            const payload = await response.json().catch(() => ({}));
            if (!response.ok) {
                throw new Error(payload?.error || "Erro ao remover grupo.");
            }
            setGroups(prev => prev.filter(group => group.id !== groupId));
            toast.success("Grupo removido com sucesso.");
        } catch (error) {
            console.error("Erro ao remover grupo", error);
            toast.error(error instanceof Error ? error.message : "Erro ao remover grupo.");
        } finally {
            setDeleteTarget(null);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-lg">
                <DialogHeader>
                    <DialogTitle>Gerenciar Grupos</DialogTitle>
                    <DialogDescription>
                        Cadastre e remova grupos para controlar o acesso dos corretores.
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-6">
                    <form onSubmit={handleCreateGroup} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="group-name">Nome do Grupo</Label>
                            <Input
                                id="group-name"
                                placeholder="Ex.: Plaenge"
                                value={formValues.name}
                                onChange={event => setFormValues(prev => ({ ...prev, name: event.target.value }))}
                                disabled={isSubmitting}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="group-description">Descrição (opcional)</Label>
                            <Textarea
                                id="group-description"
                                placeholder="Detalhes para identificar o grupo"
                                value={formValues.description}
                                onChange={event =>
                                    setFormValues(prev => ({ ...prev, description: event.target.value }))
                                }
                                disabled={isSubmitting}
                            />
                        </div>
                        <div className="flex justify-end">
                            <Button type="submit" className="cursor-pointer" disabled={isSubmitting}>
                                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Adicionar Grupo
                            </Button>
                        </div>
                    </form>

                    <div className="space-y-3">
                        <div>
                            <h4 className="text-sm font-medium">Grupos cadastrados</h4>
                            <p className="text-sm text-muted-foreground">
                                {isLoading
                                    ? "Carregando..."
                                    : sortedGroups.length
                                      ? `${sortedGroups.length} grupo${sortedGroups.length > 1 ? "s" : ""}`
                                      : "Nenhum grupo cadastrado."}
                            </p>
                            {fetchError && <p className="text-sm text-destructive">{fetchError}</p>}
                        </div>
                        <div className="max-h-64 overflow-y-auto rounded-md border">
                            {sortedGroups.length === 0 && !isLoading ? (
                                <p className="p-4 text-sm text-muted-foreground">Nenhum grupo encontrado.</p>
                            ) : (
                                <ul className="divide-y">
                                    {sortedGroups.map(group => (
                                        <li key={group.id} className="flex items-start justify-between gap-3 p-4">
                                            <div>
                                                <p className="font-medium leading-5">{group.name}</p>
                                                {group.description && (
                                                    <p className="text-sm text-muted-foreground">{group.description}</p>
                                                )}
                                            </div>
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                className="text-muted-foreground hover:text-destructive cursor-pointer"
                                                onClick={() => handleDeleteGroup(group.id)}
                                                disabled={deleteTarget === group.id}
                                            >
                                                {deleteTarget === group.id ? (
                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                ) : (
                                                    <Trash2 className="h-4 w-4" />
                                                )}
                                            </Button>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
