"use client";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Unit } from "@/interfaces/unit";
import { useEffect, useState } from "react";

interface UnitModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (unit: Unit) => void;
    unit: Partial<Unit> | null;
}

export function UnitModal({ isOpen, onClose, onSave, unit }: UnitModalProps) {
    const [formData, setFormData] = useState<Partial<Unit>>({});

    useEffect(() => {
        setFormData(unit || {});
    }, [unit]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { id, value, type } = e.target;
        const finalValue = type === "number" ? Number(value) : value;
        setFormData(prev => ({ ...prev, [id]: finalValue }));
    };

    const handleSave = () => {
        // Adicionar validação com Zod aqui se necessário
        onSave(formData as Unit);
        onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{unit?.id ? "Editar Unidade" : "Adicionar Nova Unidade"}</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="identifier" className="text-right">
                            Número
                        </Label>
                        <Input
                            id="identifier"
                            value={formData.identifier || ""}
                            onChange={handleChange}
                            className="col-span-3"
                        />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="price" className="text-right">
                            Preço
                        </Label>
                        <Input
                            id="price"
                            type="number"
                            value={formData.price || ""}
                            onChange={handleChange}
                            className="col-span-3"
                        />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="bedrooms" className="text-right">
                            Quartos
                        </Label>
                        <Input
                            id="bedrooms"
                            type="number"
                            value={formData.bedrooms || ""}
                            onChange={handleChange}
                            className="col-span-3"
                        />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="baths" className="text-right">
                            Banheiros
                        </Label>
                        <Input
                            id="baths"
                            type="number"
                            value={formData.baths || ""}
                            onChange={handleChange}
                            className="col-span-3"
                        />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="size_sqm" className="text-right">
                            Área (m²)
                        </Label>
                        <Input
                            id="size_sqm"
                            type="number"
                            value={formData.size_sqm || ""}
                            onChange={handleChange}
                            className="col-span-3"
                        />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="garages" className="text-right">
                            Vagas
                        </Label>
                        <Input
                            id="garages"
                            type="number"
                            value={formData.garages || ""}
                            onChange={handleChange}
                            className="col-span-3"
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>
                        Cancelar
                    </Button>
                    <Button onClick={handleSave}>Salvar</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
