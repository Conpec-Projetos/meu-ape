"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Unit } from "@/interfaces/unit";

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
        const finalValue = type === 'number' ? Number(value) : value;
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
                        <Label htmlFor="number" className="text-right">Número</Label>
                        <Input id="number" value={formData.number || ''} onChange={handleChange} className="col-span-3" />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="price" className="text-right">Preço</Label>
                        <Input id="price" type="number" value={formData.price || ''} onChange={handleChange} className="col-span-3" />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="bedrooms" className="text-right">Quartos</Label>
                        <Input id="bedrooms" type="number" value={formData.bedrooms || ''} onChange={handleChange} className="col-span-3" />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="bathrooms" className="text-right">Banheiros</Label>
                        <Input id="bathrooms" type="number" value={formData.bathrooms || ''} onChange={handleChange} className="col-span-3" />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="size" className="text-right">Área (m²)</Label>
                        <Input id="size" type="number" value={formData.size || ''} onChange={handleChange} className="col-span-3" />
                    </div>
                     <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="parking_spots" className="text-right">Vagas</Label>
                        <Input id="parking_spots" type="number" value={formData.parking_spots || ''} onChange={handleChange} className="col-span-3" />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>Cancelar</Button>
                    <Button onClick={handleSave}>Salvar</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
