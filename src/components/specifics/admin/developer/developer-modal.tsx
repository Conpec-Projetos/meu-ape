"use client";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { deleteDeveloperLogo, uploadDeveloperLogo } from "@/firebase/developers/service";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

interface Developer {
    id?: string;
    name?: string;
    website?: string;
    email?: string;
    phone?: string;
    logo_url?: string;
}

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onSave: () => void;
    developer: Developer | null;
}

export default function DeveloperModal({ isOpen, onClose, onSave, developer }: Props) {
    const [form, setForm] = useState<Developer>({});
    const [logoFile, setLogoFile] = useState<File | null>(null);
    const [logoPreview, setLogoPreview] = useState<string | null>(null);
    const [removedExistingLogo, setRemovedExistingLogo] = useState(false);
    const logoInputRef = useRef<HTMLInputElement | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        setForm(developer || {});
        setLogoFile(null);
        setRemovedExistingLogo(false);
        setLogoPreview(prev => {
            if (prev) URL.revokeObjectURL(prev);
            return null;
        });
    }, [developer]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { id, value } = e.target;
        setForm(prev => ({ ...prev, [id]: value }));
    };

    const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
        const f = e.target.files?.[0] || null;
        // cleanup previous preview
        setLogoPreview(prev => {
            if (prev) URL.revokeObjectURL(prev);
            return null;
        });
        setLogoFile(f);
        if (f) {
            const url = URL.createObjectURL(f);
            setLogoPreview(url);
        }
        // if user picks a new logo, clear removal flag
        setRemovedExistingLogo(false);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            // Determine final logo url
            let logoUrl = !removedExistingLogo ? form.logo_url : undefined;
            const oldUrl = form.logo_url;
            if (logoFile) {
                logoUrl = await uploadDeveloperLogo(logoFile);
                // If there's an old logo and user replaced it, optionally delete the old file
                if (oldUrl && oldUrl !== logoUrl) {
                    // Non-blocking deletion; avoid throwing if it fails
                    try {
                        await deleteDeveloperLogo(oldUrl);
                    } catch {}
                }
            }

            const payload: Record<string, unknown> = {
                name: form.name || "",
                website: form.website || undefined,
                email: form.email || undefined,
                phone: form.phone || undefined,
                // To clear the logo in DB, send null explicitly
                logo_url: removedExistingLogo && !logoFile ? null : logoUrl || undefined,
            };

            const method = developer?.id ? "PUT" : "POST";
            const url = developer?.id ? `/api/admin/developers/${developer.id}` : "/api/admin/developers";

            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            if (!res.ok) {
                const data = await res.json().catch(() => null);
                throw new Error(data?.error || "Falha ao salvar construtora");
            }

            toast.success("Construtora salva com sucesso");
            onSave();
        } catch (err) {
            console.error(err);
            toast.error(err instanceof Error ? err.message : "Erro inesperado");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="w-[90vw] max-w-lg">
                <DialogHeader>
                    <DialogTitle>{developer ? "Editar Construtora" : "Adicionar Construtora"}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label>
                            Nome <span className="text-red-500">*</span>
                        </Label>
                        <Input id="name" value={form.name || ""} onChange={handleChange} aria-required="true" />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="space-y-2">
                            <Label>Website</Label>
                            <Input id="website" value={form.website || ""} onChange={handleChange} />
                        </div>
                        <div className="space-y-2">
                            <Label>E-mail</Label>
                            <Input id="email" type="email" value={form.email || ""} onChange={handleChange} />
                        </div>
                        <div className="space-y-2">
                            <Label>Telefone</Label>
                            <Input id="phone" value={form.phone || ""} onChange={handleChange} />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <Label>Logo</Label>
                            <div>
                                <input
                                    ref={logoInputRef}
                                    type="file"
                                    accept="image/jpeg,image/png"
                                    className="hidden"
                                    onChange={handleFile}
                                />
                                <Button type="button" variant="outline" onClick={() => logoInputRef.current?.click()}>
                                    Adicionar Imagem +
                                </Button>
                            </div>
                        </div>

                        {(logoPreview || (form.logo_url && !removedExistingLogo)) && (
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                <div className="relative group h-24 w-40">
                                    <div className="absolute inset-0">
                                        <Image
                                            src={logoPreview || (form.logo_url as string)}
                                            alt={form.name || "Logo"}
                                            fill
                                            sizes="160px"
                                            className="object-contain rounded"
                                        />
                                    </div>
                                    <button
                                        type="button"
                                        className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity bg-black/60 text-white text-xs px-2 py-1 rounded"
                                        onClick={() => {
                                            if (logoPreview) {
                                                URL.revokeObjectURL(logoPreview);
                                                setLogoPreview(null);
                                                setLogoFile(null);
                                            } else if (form.logo_url) {
                                                setRemovedExistingLogo(true);
                                            }
                                        }}
                                    >
                                        Remover
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="flex items-center justify-between">
                        <p className="text-xs text-muted-foreground">Campos marcados com * são obrigatórios.</p>
                        <div className="flex gap-2">
                            <Button variant="outline" onClick={onClose} type="button">
                                Cancelar
                            </Button>
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting ? "Salvando..." : "Salvar"}
                            </Button>
                        </div>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
