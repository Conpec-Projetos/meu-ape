"use client";

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

    const handleAddNew = () => {
        setEditingUnit(null); // Garante que o modal esteja vazio para adicionar
        setIsModalOpen(true);
    };

    const handleEdit = (unit: Unit) => {
        setEditingUnit(unit);
        setIsModalOpen(true);
    };

    const handleDelete = (unitId: string) => {
        if (confirm("Tem certeza que deseja excluir esta unidade?")) {
            const isPersisted = unitId && !String(unitId).startsWith("temp-");
            // For persisted units, mark as deleted so API can remove them on save.
            // For temp (unsaved) units, just remove from the list.
            const updatedUnits = isPersisted
                ? units.map(u => (u.id === unitId ? { ...u, status: "deleted" } : u))
                : units.filter(u => u.id !== unitId);
            onUnitsChange(updatedUnits as DraftUnit[]);
        }
    };

    const handleSaveUnit = (unit: Unit) => {
        let updatedUnits;
        if (unit.id) {
            // Editando unidade existente
            updatedUnits = units.map(u => (u.id === unit.id ? unit : u));
        } else {
            // Adicionando nova unidade (com um ID temporário)
            updatedUnits = [...units, { ...unit, id: `temp-${Date.now()}` }];
        }
        onUnitsChange(updatedUnits);
        setIsModalOpen(false);
    };

    return (
        <div className="w-full">
            <div className="flex justify-between items-center mb-4">
                <div className="flex items-baseline gap-2">
                    <h3 className="font-semibold">Unidades do Imóvel</h3>
                    <span className="text-xs text-muted-foreground">{units.length} cadastrada(s)</span>
                </div>
                <Button type="button" onClick={handleAddNew} size="sm" className="cursor-pointer">
                    <PlusCircle className="h-4 w-4 mr-2" /> Adicionar Unidade
                </Button>
            </div>
            <div className="border rounded-md overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Identificador</TableHead>
                            <TableHead>Preço</TableHead>
                            <TableHead>Bloco</TableHead>
                            <TableHead>Categoria</TableHead>
                            <TableHead>Quartos</TableHead>
                            <TableHead>Suítes</TableHead>
                            <TableHead>Banheiros</TableHead>
                            <TableHead>Área (m²)</TableHead>
                            <TableHead>Andar</TableHead>
                            <TableHead>Final</TableHead>
                            <TableHead>Imagens</TableHead>
                            <TableHead>Plantas</TableHead>
                            <TableHead>Vagas</TableHead>
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
                                        <TableCell>{unit.bedrooms}</TableCell>
                                        <TableCell>{typeof unit.suites === "number" ? unit.suites : "-"}</TableCell>
                                        <TableCell>{unit.baths}</TableCell>
                                        <TableCell>
                                            {typeof unit.size_sqm === "number" ? `${unit.size_sqm} m²` : "-"}
                                        </TableCell>
                                        <TableCell>{typeof unit.floor === "number" ? unit.floor : "-"}</TableCell>
                                        <TableCell>{typeof unit.final === "number" ? unit.final : "-"}</TableCell>
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
                                        <TableCell>{unit.garages}</TableCell>
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
                                                onClick={() => unit.id && handleDelete(unit.id)}
                                                className="cursor-pointer"
                                            >
                                                <Trash2 className="h-4 w-4 text-red-500" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={15} className="text-center h-24 text-muted-foreground">
                                    Nenhuma unidade cadastrada.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            {isModalOpen && (
                <UnitModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    onSave={handleSaveUnit}
                    unit={editingUnit}
                />
            )}
        </div>
    );
}
