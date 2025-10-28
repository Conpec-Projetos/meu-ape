"use client";

import DeveloperModal from "@/components/specifics/admin/developer/developer-modal";
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

function AdminDevelopersPageContent() {
    const [developers, setDevelopers] = useState<Developer[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editing, setEditing] = useState<Developer | null>(null);

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
        if (!confirm(`Deseja realmente excluir a construtora "${dev.name}"?`)) return;
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

    return (
        <div className="container mx-auto py-20">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-3xl font-bold">Gerenciamento de Construtoras</h1>
                    <p className="text-muted-foreground">Adicione, edite e remova construtoras parceiras.</p>
                </div>
                <Button onClick={handleAdd}>Adicionar Nova Construtora</Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Construtoras</CardTitle>
                </CardHeader>
                <CardContent>
                    <TooltipProvider>
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Nome</TableHead>
                                        <TableHead>Website</TableHead>
                                        <TableHead>E-mail</TableHead>
                                        <TableHead>Telefone</TableHead>
                                        <TableHead className="text-right">Ações</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {developers.map(dev => (
                                        <TableRow key={dev.id}>
                                            <TableCell className="font-medium">
                                                <div className="flex items-center gap-3">
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
                                            <TableCell>{dev.website || "—"}</TableCell>
                                            <TableCell>{dev.email || "—"}</TableCell>
                                            <TableCell>{dev.phone || "—"}</TableCell>
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
                                                            onClick={() => handleDelete(dev)}
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
