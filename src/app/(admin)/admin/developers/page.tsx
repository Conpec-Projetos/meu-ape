"use client";

import DeveloperModal from "@/components/specifics/admin/developer/developer-modal";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Pencil, Trash2 } from "lucide-react";
import Image from "next/image";
import { Suspense, useEffect, useState } from "react";
import { toast } from "sonner";

interface Developer {
    id: string;
    name: string;
    website?: string;
    email?: string;
    phone?: string;
    logo_url?: string;
}

const onlyDigits = (value?: string | null) => (value ?? "").replace(/\D/g, "");

const formatPhone = (value?: string | null) => {
    const digits = onlyDigits(value).slice(0, 11);
    if (!digits) return "";
    if (digits.length <= 2) return `(${digits}`;
    if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
    if (digits.length <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
};

function AdminDevelopersPageContent() {
    const [developers, setDevelopers] = useState<Developer[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editing, setEditing] = useState<Developer | null>(null);
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [toDelete, setToDelete] = useState<Developer | null>(null);
    const [deleting, setDeleting] = useState(false);

    const fetchDevelopers = async () => {
        try {
            const res = await fetch("/api/admin/developers");
            if (!res.ok) throw new Error("Falha ao buscar construtoras");
            const data = await res.json();
            setDevelopers(data.developers || []);
        } catch (e) {
            console.error(e);
            toast.error(e instanceof Error ? e.message : "Erro ao carregar construtoras");
        }
    };

    useEffect(() => {
        fetchDevelopers();
    }, []);

    const getInitials = (name: string) => {
        if (!name) return "";
        const parts = name.trim().split(" ");
        if (parts.length > 1) return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
        return name.substring(0, 2).toUpperCase();
    };

    const handleAdd = () => {
        setEditing(null);
        setIsModalOpen(true);
    };

    const handleEdit = (dev: Developer) => {
        setEditing(dev);
        setIsModalOpen(true);
    };

    const handleDelete = async (dev: Developer) => {
        try {
            const res = await fetch(`/api/admin/developers/${dev.id}`, { method: "DELETE" });
            if (!res.ok) throw new Error("Falha ao deletar");
            toast.success("Construtora removida");
            fetchDevelopers();
        } catch (e) {
            console.error(e);
            toast.error(e instanceof Error ? e.message : "Erro ao excluir");
        }
    };

    const confirmDelete = async () => {
        if (!toDelete) return;
        try {
            setDeleting(true);
            await handleDelete(toDelete);
            setConfirmOpen(false);
            setToDelete(null);
        } finally {
            setDeleting(false);
        }
    };

    return (
        <div className="min-h-screen container mx-auto px-4 py-20">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
                <div>
                    <h1 className="text-3xl font-bold">Gerenciamento de Construtoras</h1>
                    <p className="text-muted-foreground">Adicione, edite e remova construtoras parceiras.</p>
                </div>
                <Button className="cursor-pointer w-full sm:w-auto" onClick={handleAdd}>
                    Adicionar Nova Construtora
                </Button>
            </div>

            {/* Mobile list (cards) */}
            <Card className="py-6 md:hidden">
                <CardHeader>
                    <CardTitle>Construtoras</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        {developers.length === 0 && (
                            <p className="text-sm text-muted-foreground">Nenhuma construtora cadastrada.</p>
                        )}
                        {developers.map(dev => (
                            <div key={dev.id} className="rounded-lg border p-3">
                                <div className="flex items-center justify-between gap-3">
                                    <div className="flex items-center gap-3 min-w-0">
                                        <Avatar>
                                            {dev.logo_url ? (
                                                <div className="relative h-10 w-10">
                                                    <Image
                                                        src={dev.logo_url}
                                                        alt={dev.name}
                                                        fill
                                                        sizes="40px"
                                                        className="rounded-full object-contain"
                                                    />
                                                </div>
                                            ) : (
                                                <AvatarFallback>{getInitials(dev.name)}</AvatarFallback>
                                            )}
                                        </Avatar>
                                        <div className="truncate">
                                            <div className="font-medium truncate">{dev.name}</div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0">
                                        <Button
                                            variant="outline"
                                            size="icon"
                                            aria-label="Editar construtora"
                                            className="cursor-pointer"
                                            onClick={() => handleEdit(dev)}
                                        >
                                            <Pencil className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="icon"
                                            aria-label="Excluir construtora"
                                            className="cursor-pointer border-red-500 text-red-500 hover:bg-red-500 hover:text-white"
                                            onClick={() => {
                                                setToDelete(dev);
                                                setConfirmOpen(true);
                                            }}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                                <div className="mt-3 grid grid-cols-1 gap-1 text-sm">
                                    <div className="flex items-start gap-2">
                                        <span className="text-muted-foreground">Website:</span>
                                        <span className="break-all">{dev.website || "—"}</span>
                                    </div>
                                    <div className="flex items-start gap-2">
                                        <span className="text-muted-foreground">E-mail:</span>
                                        <span className="break-all">{dev.email || "—"}</span>
                                    </div>
                                    <div className="flex items-start gap-2">
                                        <span className="text-muted-foreground">Telefone:</span>
                                        <span className="break-all">{formatPhone(dev.phone) || "—"}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Desktop table */}
            <Card className="py-6 hidden md:block">
                <CardHeader>
                    <CardTitle>Construtoras</CardTitle>
                </CardHeader>
                <CardContent>
                    <TooltipProvider>
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-100">Nome</TableHead>
                                        <TableHead className="w-100">Website</TableHead>
                                        <TableHead className="w-100">E-mail</TableHead>
                                        <TableHead className="w-25">Telefone</TableHead>
                                        <TableHead className="text-right">Ações</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {developers.map(dev => (
                                        <TableRow key={dev.id}>
                                            <TableCell className="font-medium w-[220px]">
                                                <div className="flex items-center gap-3 max-w-100 truncate align-middle">
                                                    <Avatar>
                                                        {dev.logo_url ? (
                                                            <div className="relative h-10 w-10">
                                                                <Image
                                                                    src={dev.logo_url}
                                                                    alt={dev.name}
                                                                    fill
                                                                    sizes="40px"
                                                                    className="rounded-full object-contain"
                                                                />
                                                            </div>
                                                        ) : (
                                                            <AvatarFallback>{getInitials(dev.name)}</AvatarFallback>
                                                        )}
                                                    </Avatar>
                                                    {dev.name}
                                                </div>
                                            </TableCell>
                                            <TableCell className="w-[220px]">
                                                <span
                                                    className="inline-block max-w-100 truncate align-middle"
                                                    title={dev.website || ""}
                                                >
                                                    {dev.website || "—"}
                                                </span>
                                            </TableCell>
                                            <TableCell className="w-[220px]">
                                                <span
                                                    className="inline-block max-w-100 truncate align-middle"
                                                    title={dev.email || ""}
                                                >
                                                    {dev.email || "—"}
                                                </span>
                                            </TableCell>
                                            <TableCell>{formatPhone(dev.phone) || "—"}</TableCell>
                                            <TableCell className="py-4 text-right space-x-2">
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <Button
                                                            variant="outline"
                                                            size="icon"
                                                            className="cursor-pointer"
                                                            onClick={() => handleEdit(dev)}
                                                        >
                                                            <Pencil className="h-4 w-4" />
                                                        </Button>
                                                    </TooltipTrigger>
                                                    <TooltipContent>
                                                        <p>Editar</p>
                                                    </TooltipContent>
                                                </Tooltip>
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <Button
                                                            variant="outline"
                                                            size="icon"
                                                            className="cursor-pointer border-red-500 text-red-500 hover:bg-red-500 hover:text-white"
                                                            onClick={() => {
                                                                setToDelete(dev);
                                                                setConfirmOpen(true);
                                                            }}
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </TooltipTrigger>
                                                    <TooltipContent>
                                                        <p>Excluir</p>
                                                    </TooltipContent>
                                                </Tooltip>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </TooltipProvider>
                </CardContent>
            </Card>

            {/* Delete confirmation dialog */}
            <AlertDialog
                open={confirmOpen}
                onOpenChange={open => {
                    setConfirmOpen(open);
                    if (!open) {
                        setToDelete(null);
                        setDeleting(false);
                    }
                }}
            >
                <AlertDialogContent className="w-[95vw] max-w-md p-4 sm:p-6">
                    <AlertDialogHeader>
                        <AlertDialogTitle>Excluir construtora?</AlertDialogTitle>
                        <AlertDialogDescription>
                            {toDelete
                                ? `Esta ação é permanente e removerá a construtora "${toDelete.name}" e todos os empreendimentos associados a ela!`
                                : "Esta ação é permanente e removerá a construtorae todos os empreendimentos associados a ela!"}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="flex flex-col-reverse sm:flex-row gap-2">
                        <AlertDialogCancel disabled={deleting} className="cursor-pointer w-full sm:w-auto">
                            Cancelar
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={confirmDelete}
                            disabled={deleting}
                            className="bg-destructive hover:bg-destructive/90 cursor-pointer w-full sm:w-auto"
                        >
                            {deleting ? "Removendo..." : "Remover"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {isModalOpen && (
                <DeveloperModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    onSave={() => {
                        setIsModalOpen(false);
                        fetchDevelopers();
                    }}
                    developer={editing}
                />
            )}
        </div>
    );
}

export default function AdminDevelopersPage() {
    return (
        <Suspense fallback={<div>Carregando...</div>}>
            <AdminDevelopersPageContent />
        </Suspense>
    );
}
