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
    contacts?: DeveloperContactForm[];
}

interface DeveloperContactForm {
    id?: string;
    name: string;
    email: string;
    phone: string;
    state: string;
    city: string;
}

const emptyContact: DeveloperContactForm = {
    name: "",
    email: "",
    phone: "",
    state: "",
    city: "",
};

const onlyDigits = (value?: string | null) => (value ?? "").replace(/\D/g, "");

const formatPhone = (value?: string | null) => {
    const digits = onlyDigits(value).slice(0, 11);
    if (!digits) return "";
    if (digits.length <= 2) return `(${digits}`;
    if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
    if (digits.length <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
};

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onSave: () => void;
    developer: Developer | null;
}

export default function DeveloperModal({ isOpen, onClose, onSave, developer }: Props) {
    const sanitizeOptionalField = (value?: string | null) => {
        const trimmed = value?.trim() ?? "";
        return trimmed.length > 0 ? trimmed : null;
    };

    const [form, setForm] = useState<Developer>({});
    const [logoFile, setLogoFile] = useState<File | null>(null);
    const [logoPreview, setLogoPreview] = useState<string | null>(null);
    const [removedExistingLogo, setRemovedExistingLogo] = useState(false);
    const logoInputRef = useRef<HTMLInputElement | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [contacts, setContacts] = useState<DeveloperContactForm[]>([]);
    const [isLoadingDetails, setIsLoadingDetails] = useState(false);
    const [isContactModalOpen, setIsContactModalOpen] = useState(false);
    const [contactDraft, setContactDraft] = useState<DeveloperContactForm>(emptyContact);
    const [editingContactIndex, setEditingContactIndex] = useState<number | null>(null);

    useEffect(() => {
        setForm(developer ? { ...developer, phone: formatPhone(developer.phone) } : {});
        const formattedContacts = (developer?.contacts ?? []).map(contact => ({
            ...contact,
            phone: formatPhone(contact.phone),
        }));
        setContacts(formattedContacts);
        setLogoFile(null);
        setRemovedExistingLogo(false);
        setLogoPreview(prev => {
            if (prev) URL.revokeObjectURL(prev);
            return null;
        });
        setContactDraft(emptyContact);
        setEditingContactIndex(null);
        setIsContactModalOpen(false);
    }, [developer]);

    useEffect(() => {
        if (!isOpen || !developer?.id) return;
        let active = true;

        const fetchDeveloperContacts = async () => {
            setIsLoadingDetails(true);
            try {
                const res = await fetch(`/api/admin/developers/${developer.id}/contacts`);
                const data = await res.json().catch(() => null);
                if (!res.ok) {
                    throw new Error(data?.error || "Falha ao carregar contatos da construtora");
                }
                if (!active) return;
                const normalizedContacts = Array.isArray(data?.contacts)
                    ? data.contacts.map((contact: Partial<DeveloperContactForm>) => ({
                          id: contact.id,
                          name: contact.name || "",
                          email: contact.email || "",
                          phone: formatPhone(contact.phone),
                          state: (contact.state || "").toUpperCase(),
                          city: contact.city || "",
                      }))
                    : [];
                setContacts(normalizedContacts);
            } catch (error) {
                if (!active) return;
                console.error(error);
                toast.error(error instanceof Error ? error.message : "Erro ao carregar contatos da construtora");
            } finally {
                if (active) {
                    setIsLoadingDetails(false);
                }
            }
        };

        fetchDeveloperContacts();
        return () => {
            active = false;
        };
    }, [developer?.id, isOpen]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { id, value } = e.target;
        setForm(prev => ({
            ...prev,
            [id]: id === "phone" ? formatPhone(value) : value,
        }));
    };

    const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
        const f = e.target.files?.[0] || null;
        setLogoPreview(prev => {
            if (prev) URL.revokeObjectURL(prev);
            return null;
        });
        setLogoFile(f);
        if (f) {
            const url = URL.createObjectURL(f);
            setLogoPreview(url);
        }
        setRemovedExistingLogo(false);
    };

    const openNewContactModal = () => {
        setContactDraft(emptyContact);
        setEditingContactIndex(null);
        setIsContactModalOpen(true);
    };

    const openEditContactModal = (index: number) => {
        const contact = contacts[index];
        if (!contact) return;
        setContactDraft({
            id: contact.id,
            name: contact.name || "",
            email: contact.email || "",
            phone: formatPhone(contact.phone),
            state: (contact.state || "").toUpperCase(),
            city: contact.city || "",
        });
        setEditingContactIndex(index);
        setIsContactModalOpen(true);
    };

    const closeContactModal = () => {
        setIsContactModalOpen(false);
        setContactDraft(emptyContact);
        setEditingContactIndex(null);
    };

    const handleContactInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const field = e.target.name as keyof DeveloperContactForm;
        const value = e.target.value;
        setContactDraft(prev => {
            if (field === "state") {
                return { ...prev, [field]: value.toUpperCase().slice(0, 2) };
            }
            if (field === "phone") {
                return { ...prev, [field]: formatPhone(value) };
            }
            return { ...prev, [field]: value };
        });
    };

    const handleSaveContact = () => {
        const requiredFields: Array<keyof DeveloperContactForm> = ["name", "email", "phone", "state", "city"];
        const hasEmptyField = requiredFields.some(field => !contactDraft[field]?.trim());
        if (hasEmptyField) {
            toast.error("Preencha todos os campos do contato");
            return;
        }

        const sanitizedContact: DeveloperContactForm = {
            ...contactDraft,
            name: contactDraft.name.trim(),
            email: contactDraft.email.trim(),
            phone: formatPhone(contactDraft.phone),
            state: contactDraft.state.trim().toUpperCase(),
            city: contactDraft.city.trim(),
        };

        setContacts(prev => {
            const next = [...prev];
            if (editingContactIndex === null) {
                next.push(sanitizedContact);
            } else {
                next[editingContactIndex] = { ...next[editingContactIndex], ...sanitizedContact };
            }
            return next;
        });
        closeContactModal();
    };

    const handleRemoveContact = (index: number) => {
        setContacts(prev => prev.filter((_, i) => i !== index));
    };

    useEffect(() => {
        if (!isOpen) {
            closeContactModal();
        }
    }, [isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            let logoUrl = !removedExistingLogo ? form.logo_url : undefined;
            const oldUrl = form.logo_url;
            if (logoFile) {
                logoUrl = await uploadDeveloperLogo(logoFile);
                if (oldUrl && oldUrl !== logoUrl) {
                    try {
                        await deleteDeveloperLogo(oldUrl);
                    } catch {}
                }
            }

            const payload: Record<string, unknown> = {
                name: (form.name || "").trim(),
                website: sanitizeOptionalField(form.website),
                email: sanitizeOptionalField(form.email),
                phone: sanitizeOptionalField(onlyDigits(form.phone)),
                logo_url: removedExistingLogo && !logoFile ? null : logoUrl || undefined,
            };

            payload.contacts = contacts.map(contact => ({
                id: contact.id,
                name: contact.name.trim(),
                email: contact.email.trim(),
                phone: onlyDigits(contact.phone),
                state: contact.state.trim().toUpperCase(),
                city: contact.city.trim(),
            }));

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
        <>
            <Dialog open={isOpen} onOpenChange={onClose}>
                <DialogContent className="w-[90vw] max-w-lg max-h-[90vh] overflow-y-auto">
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
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => logoInputRef.current?.click()}
                                        className="cursor-pointer"
                                    >
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
                                            className="cursor-pointer absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity bg-black/60 text-white text-xs px-2 py-1 rounded"
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

                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <Label>Contatos</Label>
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="cursor-pointer"
                                    onClick={openNewContactModal}
                                    disabled={isLoadingDetails}
                                >
                                    Adicionar Contato
                                </Button>
                            </div>
                            {isLoadingDetails ? (
                                <p className="text-sm text-muted-foreground">Carregando contatos...</p>
                            ) : contacts.length === 0 ? (
                                <p className="text-sm text-muted-foreground">Nenhum contato cadastrado.</p>
                            ) : (
                                <div className="space-y-2">
                                    {contacts.map((contact, index) => {
                                        const stateLabel = (contact.state || "").toUpperCase();
                                        const location =
                                            [contact.city, stateLabel].filter(Boolean).join(" / ") || "Sem localização";
                                        return (
                                            <div
                                                key={contact.id ?? index}
                                                className="rounded-lg border p-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
                                            >
                                                <div className="space-y-1">
                                                    <p className="font-medium">{contact.name}</p>
                                                    <p className="text-sm text-muted-foreground break-all">
                                                        {contact.email}
                                                    </p>
                                                    <p className="text-sm text-muted-foreground break-all">
                                                        {contact.phone}
                                                    </p>
                                                    <p className="text-sm text-muted-foreground">{location}</p>
                                                </div>
                                                <div className="flex gap-2">
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        size="sm"
                                                        className="cursor-pointer"
                                                        onClick={() => openEditContactModal(index)}
                                                    >
                                                        Editar
                                                    </Button>
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        size="sm"
                                                        className="cursor-pointer border-red-500 text-red-500 hover:bg-red-500 hover:text-white"
                                                        onClick={() => handleRemoveContact(index)}
                                                    >
                                                        Remover
                                                    </Button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        <div className="flex items-center justify-between">
                            <p className="text-xs text-muted-foreground">Campos marcados com * são obrigatórios.</p>
                            <div className="flex gap-2">
                                <Button variant="outline" onClick={onClose} type="button" className="cursor-pointer">
                                    Cancelar
                                </Button>
                                <Button type="submit" disabled={isSubmitting} className="cursor-pointer">
                                    {isSubmitting ? "Salvando..." : "Salvar"}
                                </Button>
                            </div>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>

            <Dialog
                open={isContactModalOpen}
                onOpenChange={open => {
                    if (!open) {
                        closeContactModal();
                    } else {
                        setIsContactModalOpen(true);
                    }
                }}
            >
                <DialogContent className="w-[90vw] max-w-md">
                    <DialogHeader>
                        <DialogTitle>
                            {editingContactIndex === null ? "Adicionar Contato" : "Editar Contato"}
                        </DialogTitle>
                    </DialogHeader>
                    <form
                        className="space-y-4 py-2"
                        onSubmit={e => {
                            e.preventDefault();
                            handleSaveContact();
                        }}
                    >
                        <div className="space-y-2">
                            <Label htmlFor="contact-name">
                                Nome <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                id="contact-name"
                                name="name"
                                value={contactDraft.name}
                                onChange={handleContactInputChange}
                                aria-required="true"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="contact-email">
                                E-mail <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                id="contact-email"
                                name="email"
                                value={contactDraft.email}
                                onChange={handleContactInputChange}
                                aria-required="true"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="contact-phone">
                                Telefone <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                id="contact-phone"
                                name="phone"
                                value={contactDraft.phone}
                                onChange={handleContactInputChange}
                                aria-required="true"
                            />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="contact-state">
                                    Estado (UF) <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                    id="contact-state"
                                    name="state"
                                    value={contactDraft.state}
                                    onChange={handleContactInputChange}
                                    maxLength={2}
                                    aria-required="true"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="contact-city">
                                    Cidade <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                    id="contact-city"
                                    name="city"
                                    value={contactDraft.city}
                                    onChange={handleContactInputChange}
                                    aria-required="true"
                                />
                            </div>
                        </div>
                        <div className="flex items-center justify-end gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={closeContactModal}
                                className="cursor-pointer"
                            >
                                Cancelar
                            </Button>
                            <Button type="submit" className="cursor-pointer">
                                Salvar Contato
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>
        </>
    );
}
