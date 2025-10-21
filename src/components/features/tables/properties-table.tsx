"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Pencil, Trash2 } from "lucide-react";
import { Property } from "../../../firebase/properties/property";

interface PropertiesTableProps {
    properties: Property[];
    onEdit: (property: Property) => void;
    onDelete: (property: Property) => void;
}

const getInitials = (name: string) => {
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
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Título</TableHead>
                            <TableHead>Endereço</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Ações</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {properties.map(property => (
                            <TableRow key={property.id}>
                                <TableCell className="font-medium">
                                    <div className="flex items-center gap-3">
                                        <Avatar>
                                            <AvatarImage src={property.imageUrl} alt={property.title} />
                                            <AvatarFallback>{getInitials(property.title)}</AvatarFallback>
                                        </Avatar>
                                        {property.title}
                                    </div>
                                </TableCell>
                                {/* Ajustado para exibir o endereço como uma string, que é como vem do Firestore */}
                                <TableCell>
                                    {/* Adicionado 'truncate' para cortar o texto e 'title' para exibir o endereço completo no hover */}
                                    <span
                                        className="truncate block max-w-[200px] sm:max-w-xs"
                                        title={property.address as unknown as string}
                                    >
                                        {property.address as unknown as string}
                                    </span>
                                </TableCell>
                                <TableCell>
                                    <Badge variant={property.status === "AVAILABLE" ? "default" : "secondary"}>
                                        {/* Ajuste para exibir o status corretamente */}
                                        {property.status === "AVAILABLE" ? "Disponível" : "Indisponível"}
                                    </Badge>
                                </TableCell>
                                <TableCell className="py-4 text-right space-x-2">
                                    <Tooltip>
                                        <TooltipTrigger asChild>
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
                                                    onDelete(property);
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
    );
}
