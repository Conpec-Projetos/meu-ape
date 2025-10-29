"use client";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Unit } from "@/interfaces/unit";
import { Check, X } from "lucide-react";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";

interface UnitModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (unit: Unit) => void;
    unit: Partial<Unit> | null;
}

export function UnitModal({ isOpen, onClose, onSave, unit }: UnitModalProps) {
    const [formData, setFormData] = useState<Partial<Unit>>({});
    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const imagesFileInputRef = useRef<HTMLInputElement | null>(null);
    const [floorPlanFiles, setFloorPlanFiles] = useState<File[]>([]);
    const [floorPlanPreviews, setFloorPlanPreviews] = useState<string[]>([]);
    const [floorPlanUrls, setFloorPlanUrls] = useState<string[]>([]); // existing URLs
    const [floorPlanToRemove, setFloorPlanToRemove] = useState<string[]>([]);
    const [imageFiles, setImageFiles] = useState<File[]>([]);
    const [imagePreviews, setImagePreviews] = useState<string[]>([]);
    const [imageUrls, setImageUrls] = useState<string[]>([]);
    const [imagesToRemove, setImagesToRemove] = useState<string[]>([]);

    useEffect(() => {
        setFormData(unit || {});
        const existingFloor = (unit?.floorPlanUrls as string[] | undefined) || [];
        setFloorPlanUrls(existingFloor);
        const existingImages = (unit?.images as string[] | undefined) || [];
        setImageUrls(existingImages);
        // reset new files and revoke previous previews safely
        setFloorPlanFiles([]);
        setFloorPlanPreviews(old => {
            old.forEach(url => URL.revokeObjectURL(url));
            return [];
        });
        setFloorPlanToRemove([]);
        setImageFiles([]);
        setImagePreviews(old => {
            old.forEach(url => URL.revokeObjectURL(url));
            return [];
        });
        setImagesToRemove([]);
    }, [unit]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { id, value, type } = e.target;
        const finalValue = type === "number" ? (value === "" ? undefined : Number(value)) : value;
        setFormData(prev => ({ ...prev, [id]: finalValue }));
    };

    const onSelectFloorPlans = (files: FileList | null) => {
        if (!files || files.length === 0) return;
        const valid: File[] = [];
        Array.from(files).forEach(file => {
            const ok = ["image/jpeg", "image/png"].includes(file.type);
            if (ok) valid.push(file);
        });
        const previews = valid.map(f => URL.createObjectURL(f));
        setFloorPlanFiles(prev => [...prev, ...valid]);
        setFloorPlanPreviews(prev => [...prev, ...previews]);
    };

    const onSelectImages = (files: FileList | null) => {
        if (!files || files.length === 0) return;
        const valid: File[] = [];
        Array.from(files).forEach(file => {
            const ok = ["image/jpeg", "image/png"].includes(file.type);
            if (ok) valid.push(file);
        });
        const previews = valid.map(f => URL.createObjectURL(f));
        setImageFiles(prev => [...prev, ...valid]);
        setImagePreviews(prev => [...prev, ...previews]);
    };

    const removeExistingFloorPlan = (url: string) => {
        setFloorPlanToRemove(prev => [...prev, url]);
        setFloorPlanUrls(prev => prev.filter(u => u !== url));
    };

    const removeNewFloorPlan = (index: number) => {
        setFloorPlanFiles(prev => prev.filter((_, i) => i !== index));
        const url = floorPlanPreviews[index];
        URL.revokeObjectURL(url);
        setFloorPlanPreviews(prev => prev.filter((_, i) => i !== index));
    };

    const removeExistingImage = (url: string) => {
        setImagesToRemove(prev => [...prev, url]);
        setImageUrls(prev => prev.filter(u => u !== url));
    };

    const removeNewImage = (index: number) => {
        setImageFiles(prev => prev.filter((_, i) => i !== index));
        const url = imagePreviews[index];
        URL.revokeObjectURL(url);
        setImagePreviews(prev => prev.filter((_, i) => i !== index));
    };

    const handleSave = () => {
        // Adicionar validação com Zod aqui se necessário
        onSave({
            ...(formData as Unit),
            // persist existing urls kept
            floorPlanUrls,
            images: imageUrls,
            // attach ephemeral props for upload/deletion handling by parent
            floorPlanFiles,
            floorPlanToRemove,
            floorPlanPreviews,
            imageFiles,
            imagePreviews,
            imagesToRemove,
        } as unknown as Unit);
        onClose();
    };

    return (
        <Dialog
            open={isOpen}
            onOpenChange={open => {
                if (!open) onClose();
            }}
        >
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>{unit?.id ? "Editar Unidade" : "Adicionar Nova Unidade"}</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="identifier" className="text-right">
                            Identificador <span className="text-red-500">*</span>
                        </Label>
                        <Input
                            id="identifier"
                            value={formData.identifier || ""}
                            onChange={handleChange}
                            className="col-span-3"
                            aria-required="true"
                        />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="block" className="text-right">
                            Bloco
                        </Label>
                        <Input id="block" value={formData.block || ""} onChange={handleChange} className="col-span-3" />
                    </div>

                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="category" className="text-right">
                            Categoria
                        </Label>
                        <Input
                            id="category"
                            value={formData.category || ""}
                            onChange={handleChange}
                            className="col-span-3"
                        />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="price" className="text-right">
                            Preço <span className="text-red-500">*</span>
                        </Label>
                        <Input
                            id="price"
                            type="number"
                            value={formData.price ?? ""}
                            onChange={handleChange}
                            className="col-span-3"
                            aria-required="true"
                        />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="bedrooms" className="text-right">
                            Quartos <span className="text-red-500">*</span>
                        </Label>
                        <Input
                            id="bedrooms"
                            type="number"
                            value={formData.bedrooms ?? ""}
                            onChange={handleChange}
                            className="col-span-3"
                            aria-required="true"
                        />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="baths" className="text-right">
                            Banheiros <span className="text-red-500">*</span>
                        </Label>
                        <Input
                            id="baths"
                            type="number"
                            value={formData.baths ?? ""}
                            onChange={handleChange}
                            className="col-span-3"
                            aria-required="true"
                        />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="size_sqm" className="text-right">
                            Área (m²) <span className="text-red-500">*</span>
                        </Label>
                        <Input
                            id="size_sqm"
                            type="number"
                            value={formData.size_sqm ?? ""}
                            onChange={handleChange}
                            className="col-span-3"
                            aria-required="true"
                        />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="garages" className="text-right">
                            Vagas <span className="text-red-500">*</span>
                        </Label>
                        <Input
                            id="garages"
                            type="number"
                            value={formData.garages ?? ""}
                            onChange={handleChange}
                            className="col-span-3"
                            aria-required="true"
                        />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="floor" className="text-right">
                            Andar
                        </Label>
                        <Input
                            id="floor"
                            type="number"
                            value={formData.floor ?? ""}
                            onChange={handleChange}
                            className="col-span-3"
                        />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="isAvailable" className="text-right">
                            Disponível
                        </Label>
                        <div className="col-span-3">
                            <Switch
                                id="isAvailable"
                                checked={Boolean(formData.isAvailable)}
                                onCheckedChange={checked =>
                                    setFormData(prev => ({ ...prev, isAvailable: Boolean(checked) }))
                                }
                                className="cursor-pointer"
                            />
                        </div>
                    </div>
                    {/* Floor plan images */}
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <Label>Plantas da Unidade</Label>
                            <div>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/jpeg,image/png"
                                    multiple
                                    className="hidden"
                                    onChange={e => onSelectFloorPlans(e.target.files)}
                                />
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => fileInputRef.current?.click()}
                                    className="cursor-pointer"
                                >
                                    Adicionar Imagens +
                                </Button>
                            </div>
                        </div>

                        {/* Existing floor plan URLs */}
                        {floorPlanUrls.length > 0 && (
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                {floorPlanUrls.map((url, idx) => (
                                    <div key={`existing-${idx}`} className="relative group">
                                        <Image
                                            src={url}
                                            alt="Planta"
                                            width={500}
                                            height={500}
                                            className="h-24 w-full object-cover rounded"
                                        />
                                        <button
                                            type="button"
                                            className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity bg-black/60 text-white text-xs px-2 py-1 rounded cursor-pointer"
                                            onClick={() => removeExistingFloorPlan(url)}
                                        >
                                            Remover
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* New floor plan previews */}
                        {floorPlanPreviews.length > 0 && (
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                {floorPlanPreviews.map((url, idx) => (
                                    <div key={`new-${idx}`} className="relative group">
                                        <Image
                                            src={url}
                                            alt="Preview"
                                            width={500}
                                            height={500}
                                            className="h-24 w-full object-cover rounded"
                                        />
                                        <button
                                            type="button"
                                            className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity bg-black/60 text-white text-xs px-2 py-1 rounded cursor-pointer"
                                            onClick={() => removeNewFloorPlan(idx)}
                                        >
                                            Remover
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Unit images */}
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <Label>Imagens da Unidade</Label>
                            <div>
                                <input
                                    ref={imagesFileInputRef}
                                    type="file"
                                    accept="image/jpeg,image/png"
                                    multiple
                                    className="hidden"
                                    onChange={e => onSelectImages(e.target.files)}
                                />
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => imagesFileInputRef.current?.click()}
                                    className="cursor-pointer"
                                >
                                    Adicionar Imagens +
                                </Button>
                            </div>
                        </div>

                        {/* Existing unit images */}
                        {imageUrls.length > 0 && (
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                {imageUrls.map((url, idx) => (
                                    <div key={`img-existing-${idx}`} className="relative group">
                                        <Image
                                            src={url}
                                            alt="Imagem da unidade"
                                            className="h-24 w-full object-cover rounded"
                                            width={500}
                                            height={500}
                                        />
                                        <button
                                            type="button"
                                            className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity bg-black/60 text-white text-xs px-2 py-1 rounded cursor-pointer"
                                            onClick={() => removeExistingImage(url)}
                                        >
                                            Remover
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* New unit images previews */}
                        {imagePreviews.length > 0 && (
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                {imagePreviews.map((url, idx) => (
                                    <div key={`img-new-${idx}`} className="relative group">
                                        <Image
                                            src={url}
                                            alt="Preview"
                                            width={500}
                                            height={500}
                                            className="h-24 w-full object-cover rounded"
                                        />
                                        <button
                                            type="button"
                                            className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity bg-black/60 text-white text-xs px-2 py-1 rounded cursor-pointer"
                                            onClick={() => removeNewImage(idx)}
                                        >
                                            Remover
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
                <DialogFooter>
                    <p className="text-xs text-muted-foreground mr-auto self-center">
                        Campos marcados com * são obrigatórios.
                    </p>
                    <Button type="button" variant="outline" onClick={onClose} className="cursor-pointer">
                        <X className="w-4 h-4 mr-2" /> Cancelar
                    </Button>
                    <Button type="button" onClick={handleSave} className="cursor-pointer">
                        <Check className="w-4 h-4 mr-2" /> Salvar
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
