"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
    Pagination,
    PaginationContent,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from "@/components/ui/pagination";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { User } from "@/interfaces/user";
import { formatCPF } from "@/lib/utils";
import { Pencil, Trash2, Users, View } from "lucide-react";

interface UserTableProps {
    users: User[];
    page: number;
    totalPages: number;
    onPageChange: (page: number) => void;
    onView: (user: User) => void;
    onEdit: (user: User) => void;
    onDelete: (user: User) => void;
    onAddUser: () => void;
}

const getInitials = (name: string) => {
    const names = name.split(" ");
    if (names.length > 1) {
        return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
};

const getMaskedCpf = (cpf?: string | null) => (cpf ? formatCPF(cpf) : "Não informado");

export function UserTable({
    users,
    page,
    totalPages,
    onPageChange,
    onView,
    onEdit,
    onDelete,
    onAddUser,
}: UserTableProps) {
    if (users.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center text-center py-16">
                <Users className="h-16 w-16 text-gray-400 mb-4" />
                <h3 className="text-xl font-semibold mb-2">Nenhum usuário encontrado</h3>
                <p className="text-gray-500 mb-4">Parece que não há usuários para exibir no momento.</p>
                <Button className="cursor-pointer" onClick={onAddUser}>
                    Adicionar Novo Usuário
                </Button>
            </div>
        );
    }

    return (
        <TooltipProvider>
            <div>
                {/* Desktop / Tablet table */}
                <div className="hidden sm:block overflow-x-auto">
                    <Table className="min-w-full">
                        <TableHeader>
                            <TableRow>
                                <TableHead>Nome</TableHead>
                                <TableHead>Email</TableHead>
                                <TableHead>CPF</TableHead>
                                <TableHead className="text-right">Ações</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {users.map(user => (
                                <TableRow key={user.id} onClick={() => onView(user)}>
                                    <TableCell className="py-4 font-medium">
                                        <div className="flex items-center gap-3">
                                            <Avatar>
                                                <AvatarImage src={user.photoUrl} alt={user.fullName} />
                                                <AvatarFallback>{getInitials(user.fullName)}</AvatarFallback>
                                            </Avatar>
                                            {user.fullName}
                                        </div>
                                    </TableCell>
                                    <TableCell className="py-4">{user.email}</TableCell>
                                    <TableCell className="py-4">{getMaskedCpf(user.cpf)}</TableCell>
                                    <TableCell className="py-4 text-right space-x-2">
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <Button
                                                    variant="outline"
                                                    size="icon"
                                                    className="cursor-pointer"
                                                    onClick={e => {
                                                        e.stopPropagation();
                                                        onView(user);
                                                    }}
                                                >
                                                    <View className="h-4 w-4" />
                                                </Button>
                                            </TooltipTrigger>
                                            <TooltipContent>
                                                <p>Visualizar</p>
                                            </TooltipContent>
                                        </Tooltip>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <Button
                                                    variant="outline"
                                                    size="icon"
                                                    className="cursor-pointer"
                                                    onClick={e => {
                                                        e.stopPropagation();
                                                        onEdit(user);
                                                    }}
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
                                                    onClick={e => {
                                                        e.stopPropagation();
                                                        onDelete(user);
                                                    }}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </TooltipTrigger>
                                            <TooltipContent>
                                                <p>Deletar</p>
                                            </TooltipContent>
                                        </Tooltip>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>

                {/* Mobile card list */}
                <div className="block sm:hidden space-y-3">
                    {users.map(user => (
                        <div
                            key={user.id}
                            onClick={() => onView(user)}
                            className="bg-card border rounded-lg p-3 flex items-start justify-between gap-3"
                        >
                            <div className="flex items-center gap-3 overflow-hidden">
                                <Avatar>
                                    <AvatarImage src={user.photoUrl} alt={user.fullName} />
                                    <AvatarFallback>{getInitials(user.fullName)}</AvatarFallback>
                                </Avatar>
                                <div>
                                    <div className="text-sm font-medium">{user.fullName}</div>
                                    <div className="text-xs text-muted-foreground">{user.email}</div>
                                    <div className="text-xs text-muted-foreground">{getMaskedCpf(user.cpf)}</div>
                                </div>
                            </div>
                            <div className="flex flex-col items-end gap-2">
                                <div className="flex items-center gap-2">
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        className="cursor-pointer"
                                        onClick={e => {
                                            e.stopPropagation();
                                            onView(user);
                                        }}
                                    >
                                        <View className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        className="cursor-pointer"
                                        onClick={e => {
                                            e.stopPropagation();
                                            onEdit(user);
                                        }}
                                    >
                                        <Pencil className="h-4 w-4" />
                                    </Button>
                                </div>
                                <Button
                                    variant="destructive"
                                    size="sm"
                                    className="cursor-pointer"
                                    onClick={e => {
                                        e.stopPropagation();
                                        onDelete(user);
                                    }}
                                >
                                    Deletar
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
                {totalPages > 1 && (
                    <Pagination className="mt-4">
                        <PaginationContent>
                            <PaginationItem>
                                <PaginationPrevious
                                    href="#"
                                    onClick={e => {
                                        e.preventDefault();
                                        onPageChange(page - 1);
                                    }}
                                    className={page <= 1 ? "pointer-events-none opacity-50" : ""}
                                />
                            </PaginationItem>
                            {[...Array(totalPages)].map((_, i) => (
                                <PaginationItem key={i}>
                                    <PaginationLink
                                        href="#"
                                        onClick={e => {
                                            e.preventDefault();
                                            onPageChange(i + 1);
                                        }}
                                        isActive={page === i + 1}
                                    >
                                        {i + 1}
                                    </PaginationLink>
                                </PaginationItem>
                            ))}
                            <PaginationItem>
                                <PaginationNext
                                    href="#"
                                    onClick={e => {
                                        e.preventDefault();
                                        onPageChange(page + 1);
                                    }}
                                    className={page >= totalPages ? "pointer-events-none opacity-50" : ""}
                                />
                            </PaginationItem>
                        </PaginationContent>
                    </Pagination>
                )}
            </div>
        </TooltipProvider>
    );
}

export function UserTableSkeleton() {
    return (
        <div className="space-y-4">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>
                            <Skeleton className="h-5 w-24" />
                        </TableHead>
                        <TableHead>
                            <Skeleton className="h-5 w-32" />
                        </TableHead>
                        <TableHead>
                            <Skeleton className="h-5 w-28" />
                        </TableHead>
                        <TableHead className="text-right">
                            <Skeleton className="h-5 w-16 ml-auto" />
                        </TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {[...Array(5)].map((_, i) => (
                        <TableRow key={i}>
                            <TableCell className="py-4">
                                <div className="flex items-center gap-3">
                                    <Skeleton className="h-10 w-10 rounded-full" />
                                    <Skeleton className="h-5 w-40" />
                                </div>
                            </TableCell>
                            <TableCell className="py-4">
                                <Skeleton className="h-5 w-48" />
                            </TableCell>
                            <TableCell className="py-4">
                                <Skeleton className="h-5 w-32" />
                            </TableCell>
                            <TableCell className="py-4 text-right">
                                <Skeleton className="h-8 w-8 ml-auto" />
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
            <div className="flex justify-center">
                <Skeleton className="h-10 w-80" />
            </div>
        </div>
    );
}
