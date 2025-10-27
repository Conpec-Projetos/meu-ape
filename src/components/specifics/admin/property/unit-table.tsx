"use client";

import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Unit } from "@/interfaces/unit";
import { Edit, Trash2 } from "lucide-react";
import { useState } from "react";
import { UnitModal } from "./unit-modal";

interface UnityTableProps {
    units: Partial<Unit>[];
    onUnitsChange: (units: Partial<Unit>[]) => void;
}

export default function UnityTable({ units, onUnitsChange }: UnityTableProps) {
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
            const updatedUnits = units.filter(u => u.id !== unitId);
            onUnitsChange(updatedUnits);
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
                <h3 className="font-semibold">Unidades do Imóvel</h3>
                <Button type="button" variant="outline" size="sm" onClick={handleAddNew}>
                    Adicionar Unidade +
                </Button>
            </div>
            <div className="border rounded-md">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Número</TableHead>
                            <TableHead>Preço</TableHead>
                            <TableHead>Quartos</TableHead>
                            <TableHead className="text-right">Ações</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {units.length > 0 ? (
                            units.map(unit => (
                                <TableRow key={unit.id}>
                                    <TableCell>{unit.identifier}</TableCell>
                                    <TableCell>
                                        {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
                                            unit.price || 0
                                        )}
                                    </TableCell>
                                    <TableCell>{unit.bedrooms}</TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="ghost" size="icon" onClick={() => handleEdit(unit as Unit)}>
                                            <Edit className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => unit.id && handleDelete(unit.id)}
                                        >
                                            <Trash2 className="h-4 w-4 text-red-500" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={4} className="text-center h-24">
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
