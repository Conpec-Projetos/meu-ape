"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Property } from "@/interfaces/property";
import { Pencil, Trash2 } from "lucide-react";
import Image from "next/image";

interface PropertiesTableProps {
    properties: Property[];
    onEdit: (property: Property) => void;
    onDelete: (property: Property) => void;
}

const getInitials = (name: string) => {
    if (!name) return "";
    const names = name.split(" ");
    if (names.length > 1) {
        return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
};

export function PropertiesTable({ properties, onEdit, onDelete }: PropertiesTableProps) {
    return (
        <TooltipProvider>
            <div>
                {/* Desktop / Tablet table - hidden on small screens */}
                <div className="hidden sm:block overflow-x-auto">
                    <Table className="min-w-full">
                        <TableHeader>
                            <TableRow>
                                <TableHead>Título</TableHead>
                                <TableHead>Endereço</TableHead>
                                <TableHead className="text-right">Ações</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {properties.map(property => {
                                const imageUrl = property.propertyImages?.[0];

                                return (
                                    <TableRow key={property.id}>
                                        <TableCell className="font-medium">
                                            <div className="flex items-center gap-3">
                                                <Avatar>
                                                    {imageUrl ? (
                                                        <div className="relative h-10 w-10">
                                                            <Image
                                                                src={imageUrl}
                                                                alt={property.name}
                                                                fill
                                                                sizes="40px"
                                                                className="rounded-full object-cover"
                                                            />
                                                        </div>
                                                    ) : (
                                                        <AvatarFallback>{getInitials(property.name)}</AvatarFallback>
                                                    )}
                                                </Avatar>
                                                {property.name}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <span
                                                className="truncate block max-w-[200px] sm:max-w-xs"
                                                title={property.address as string}
                                            >
                                                {property.address as string}
                                            </span>
                                        </TableCell>
                                        <TableCell className="py-4 text-right space-x-2">
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <Button
                                                        variant="outline"
                                                        size="icon"
                                                        className="cursor-pointer"
                                                        onClick={() => onEdit(property)}
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
                                                        onClick={() => onDelete(property)}
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
                                );
                            })}
                        </TableBody>
                    </Table>
                </div>

                {/* Mobile card list - visible on small screens */}
                <div className="block sm:hidden space-y-3">
                    {properties.map(property => {
                        const imageUrl = property.propertyImages?.[0];
                        return (
                            <div
                                key={property.id}
                                onClick={() => onEdit(property)}
                                className="bg-card border rounded-lg p-3 flex items-start justify-between gap-3"
                            >
                                <div className="flex items-center gap-3 overflow-hidden">
                                    <Avatar>
                                        {imageUrl ? (
                                            <div className="relative h-10 w-10">
                                                <Image
                                                    src={imageUrl}
                                                    alt={property.name}
                                                    fill
                                                    sizes="40px"
                                                    className="rounded-full object-cover"
                                                />
                                            </div>
                                        ) : (
                                            <AvatarFallback>{getInitials(property.name)}</AvatarFallback>
                                        )}
                                    </Avatar>
                                    <div>
                                        <div className="text-sm font-medium truncate max-w-[200px]">
                                            {property.name}
                                        </div>
                                        <div className="text-xs text-muted-foreground truncate max-w-60">
                                            {property.address}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        className="cursor-pointer"
                                        onClick={e => {
                                            e.stopPropagation();
                                            onEdit(property);
                                        }}
                                    >
                                        <Pencil className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        variant="destructive"
                                        size="icon"
                                        className="cursor-pointer"
                                        onClick={e => {
                                            e.stopPropagation();
                                            onDelete(property);
                                        }}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </TooltipProvider>
    );
}
