"use client";

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
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Unit } from "@/interfaces/unit";
import { Edit, PlusCircle, Trash2 } from "lucide-react";
import { useState } from "react";
import { UnitModal } from "./unit-modal";

type DraftUnit = Partial<Unit> & {
    floorPlanUrls?: string[];
    floorPlanPreviews?: string[];
    floorPlanFiles?: File[];
    floorPlanToRemove?: string[];
    imageFiles?: File[];
    imagePreviews?: string[];
    imagesToRemove?: string[];
    status?: "new" | "updated" | "deleted";
};

interface UnitTableProps {
    units: DraftUnit[];
    onUnitsChange: (units: DraftUnit[]) => void;
}

export default function UnitTable({ units, onUnitsChange }: UnitTableProps) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingUnit, setEditingUnit] = useState<Partial<Unit> | null>(null);
    const [unitToDelete, setUnitToDelete] = useState<Partial<Unit> | null>(null);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);

    const handleAddNew = () => {
        setEditingUnit(null);
        setIsModalOpen(true);
    };

    const handleEdit = (unit: Unit) => {
        setEditingUnit(unit);
        setIsModalOpen(true);
    };

    const handleOpenDelete = (unit: Unit) => {
        setUnitToDelete(unit);
        setIsDeleteOpen(true);
    };

    const handleConfirmDelete = () => {
        if (!unitToDelete?.id) {
            setIsDeleteOpen(false);
            return;
        }
        const unitId = unitToDelete.id;
        const isPersisted = unitId && !String(unitId).startsWith("temp-");
        const updatedUnits = isPersisted
            ? units.map(u => (u.id === unitId ? { ...u, status: "deleted" } : u))
            : units.filter(u => u.id !== unitId);
        onUnitsChange(updatedUnits as DraftUnit[]);
        setIsDeleteOpen(false);
        setUnitToDelete(null);
    };

    const handleSaveUnit = (unit: Unit) => {
        let updatedUnits;
        if (unit.id) {
            updatedUnits = units.map(u => (u.id === unit.id ? unit : u));
        } else {
            updatedUnits = [...units, { ...unit, id: `temp-${Date.now()}` }];
        }
        onUnitsChange(updatedUnits);
        setIsModalOpen(false);
    };

    return (
        <div className="w-full">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
                <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-2">
                    <h3 className="font-semibold">Unidades do Imóvel</h3>
                    <span className="text-xs text-muted-foreground">{units.length} cadastrada(s)</span>
                </div>
                <Button type="button" onClick={handleAddNew} size="sm" className="cursor-pointer w-full sm:w-auto">
                    <PlusCircle className="h-4 w-4 mr-2" /> Adicionar Unidade
                </Button>
            </div>
            {/* Desktop table */}
            <div className="hidden sm:block border rounded-md overflow-hidden">
                <div className="overflow-x-auto">
                    <Table className="min-w-[1200px]">
                        <TableHeader>
                            <TableRow>
                                <TableHead>Identificador</TableHead>
                                <TableHead>Preço</TableHead>

                                <TableHead>Bloco</TableHead>
                                <TableHead>Categoria</TableHead>
                                <TableHead>Área (m²)</TableHead>
                                <TableHead>Quartos</TableHead>
                                <TableHead>Suítes</TableHead>
                                <TableHead>Banheiros</TableHead>
                                <TableHead>Vagas</TableHead>
                                <TableHead>Andar</TableHead>
                                <TableHead>Final</TableHead>
                                <TableHead>Depósito</TableHead>
                                <TableHead>Imagens</TableHead>
                                <TableHead>Plantas</TableHead>
                                <TableHead>Disponível</TableHead>
                                <TableHead className="text-right">Ações</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {units.filter(u => u.status !== "deleted").length > 0 ? (
                                units
                                    .filter(u => u.status !== "deleted")
                                    .map(unit => (
                                        <TableRow key={unit.id} className="odd:bg-muted/30">
                                            <TableCell>{unit.identifier}</TableCell>
                                            <TableCell>
                                                {new Intl.NumberFormat("pt-BR", {
                                                    style: "currency",
                                                    currency: "BRL",
                                                }).format(unit.price || 0)}
                                            </TableCell>
                                            <TableCell>{unit.block || "-"}</TableCell>
                                            <TableCell>{unit.category || "-"}</TableCell>
                                            <TableCell>
                                                {typeof unit.size_sqm === "number" ? `${unit.size_sqm} m²` : "-"}
                                            </TableCell>
                                            <TableCell>{unit.bedrooms}</TableCell>
                                            <TableCell>{typeof unit.suites === "number" ? unit.suites : "-"}</TableCell>
                                            <TableCell>{unit.baths}</TableCell>
                                            <TableCell>{unit.garages}</TableCell>
                                            <TableCell>{typeof unit.floor === "number" ? unit.floor : "-"}</TableCell>
                                            <TableCell>{typeof unit.final === "number" ? unit.final : "-"}</TableCell>
                                            <TableCell>
                                                {typeof unit.deposit === "number"
                                                    ? new Intl.NumberFormat("pt-BR", {
                                                          style: "currency",
                                                          currency: "BRL",
                                                      }).format(unit.deposit)
                                                    : "-"}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex gap-2 items-center">
                                                    {((unit.images || [])[0] || (unit.imagePreviews || [])[0]) && (
                                                        // eslint-disable-next-line @next/next/no-img-element
                                                        <img
                                                            src={
                                                                (unit.images || [])[0] ||
                                                                (unit.imagePreviews || [])[0] ||
                                                                ""
                                                            }
                                                            alt="Imagem"
                                                            className="h-10 w-10 object-cover rounded"
                                                        />
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex gap-2 items-center">
                                                    {((unit.floorPlanUrls || [])[0] ||
                                                        (unit.floorPlanPreviews || [])[0]) && (
                                                        // eslint-disable-next-line @next/next/no-img-element
                                                        <img
                                                            src={
                                                                (unit.floorPlanUrls || [])[0] ||
                                                                (unit.floorPlanPreviews || [])[0] ||
                                                                ""
                                                            }
                                                            alt="Planta"
                                                            className="h-10 w-10 object-cover rounded"
                                                        />
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell>{unit.isAvailable ? "Sim" : "Não"}</TableCell>
                                            <TableCell className="text-right">
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleEdit(unit as Unit)}
                                                    className="cursor-pointer"
                                                >
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => unit.id && handleOpenDelete(unit as Unit)}
                                                    className="cursor-pointer"
                                                >
                                                    <Trash2 className="h-4 w-4 text-red-500" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={16} className="text-center h-24 text-muted-foreground">
                                        Nenhuma unidade cadastrada.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>

            {/* Mobile cards */}
            <div className="space-y-3 sm:hidden">
                {units.filter(u => u.status !== "deleted").length > 0 ? (
                    units
                        .filter(u => u.status !== "deleted")
                        .map(unit => (
                            <div key={unit.id} className="rounded-md border p-4 shadow-sm bg-background">
                                <div className="flex items-start justify-between gap-3">
                                    <div>
                                        <p className="text-sm text-muted-foreground">Identificador</p>
                                        <p className="font-semibold">{unit.identifier}</p>
                                        <p className="text-sm text-muted-foreground mt-1">
                                            {unit.category || "Sem categoria"}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm text-muted-foreground">Preço</p>
                                        <p className="font-semibold">
                                            {new Intl.NumberFormat("pt-BR", {
                                                style: "currency",
                                                currency: "BRL",
                                            }).format(unit.price || 0)}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            Depósito:{" "}
                                            {typeof unit.deposit === "number"
                                                ? new Intl.NumberFormat("pt-BR", {
                                                      style: "currency",
                                                      currency: "BRL",
                                                  }).format(unit.deposit)
                                                : "-"}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            {unit.isAvailable ? "Disponível" : "Indisponível"}
                                        </p>
                                    </div>
                                </div>

                                <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                                    <div>
                                        <p className="text-muted-foreground">Área</p>
                                        <p className="font-medium">
                                            {typeof unit.size_sqm === "number" ? `${unit.size_sqm} m²` : "-"}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-muted-foreground">Quartos</p>
                                        <p className="font-medium">{unit.bedrooms}</p>
                                    </div>
                                    <div>
                                        <p className="text-muted-foreground">Banheiros</p>
                                        <p className="font-medium">{unit.baths}</p>
                                    </div>
                                    <div>
                                        <p className="text-muted-foreground">Vagas</p>
                                        <p className="font-medium">{unit.garages}</p>
                                    </div>
                                </div>

                                <div className="mt-3 flex gap-3">
                                    {((unit.images || [])[0] || (unit.imagePreviews || [])[0]) && (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img
                                            src={(unit.images || [])[0] || (unit.imagePreviews || [])[0] || ""}
                                            alt="Imagem"
                                            className="h-16 w-16 object-cover rounded"
                                        />
                                    )}
                                    {((unit.floorPlanUrls || [])[0] || (unit.floorPlanPreviews || [])[0]) && (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img
                                            src={
                                                (unit.floorPlanUrls || [])[0] || (unit.floorPlanPreviews || [])[0] || ""
                                            }
                                            alt="Planta"
                                            className="h-16 w-16 object-cover rounded"
                                        />
                                    )}
                                </div>

                                <div className="mt-4 flex gap-2">
                                    <Button
                                        type="button"
                                        variant="secondary"
                                        className="flex-1 cursor-pointer"
                                        onClick={() => handleEdit(unit as Unit)}
                                    >
                                        <Edit className="h-4 w-4 mr-2" /> Editar
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="destructive"
                                        className="flex-1 cursor-pointer"
                                        onClick={() => unit.id && handleOpenDelete(unit as Unit)}
                                    >
                                        <Trash2 className="h-4 w-4 mr-2" /> Excluir
                                    </Button>
                                </div>
                            </div>
                        ))
                ) : (
                    <div className="rounded-md border p-6 text-center text-muted-foreground">
                        Nenhuma unidade cadastrada.
                    </div>
                )}
            </div>

            {isModalOpen && (
                <UnitModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    onSave={handleSaveUnit}
                    unit={editingUnit}
                />
            )}

            <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Excluir unidade</AlertDialogTitle>
                        <AlertDialogDescription>
                            Essa ação irá marcar a unidade como removida. Deseja continuar?
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel className="cursor-pointer" onClick={() => setUnitToDelete(null)}>
                            Cancelar
                        </AlertDialogCancel>
                        <AlertDialogAction className="cursor-pointer" onClick={handleConfirmDelete}>
                            Excluir
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
