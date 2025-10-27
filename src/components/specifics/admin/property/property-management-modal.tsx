"use client";

import UnityTable from "@/components/specifics/admin/property/unit-table";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Property } from "@/interfaces/property";
import { Unit } from "@/interfaces/unit";
import { propertySchema } from "@/schemas/propertySchema";
import { Check, ChevronsUpDown, PlusCircle, Trash2, X } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface PropertyManagementFormProps {
    property: Property | null;
    onSave: () => void;
    onClose: () => void;
}

export default function PropertyManagementForm({ property, onSave, onClose }: PropertyManagementFormProps) {
    const [form, setForm] = useState<Partial<Property>>({});
    const [units, setUnits] = useState<Partial<Unit>[]>([]);
    const [developerId, setDeveloperId] = useState<string | undefined>(undefined);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Mock data
    const [developers] = useState([
        { id: "1", name: "Construtora X" },
        { id: "2", name: "Construtora Y" },
    ]);
    const [groups] = useState([
        { id: "corretores-sp", name: "Corretores SP" },
        { id: "corretores-rj", name: "Corretores RJ" },
    ]);

    useEffect(() => {
        if (property) {
            const {
                units: propertyUnits,
                developerId: propDeveloperId,
                ...restOfProperty
            } = property as Property & { units: Unit[]; developerId: string };
            setForm(restOfProperty);
            setUnits(propertyUnits || []);
            setDeveloperId(propDeveloperId);
        } else {
            setForm({
                name: "",
                address: "",
                description: "",
                propertyImages: [],
                areasImages: [],
                features: [],
                matterportUrls: [""],
                groups: [],
            });
            setUnits([]);
            setDeveloperId(undefined);
        }
    }, [property]);

    function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
        const { id, value, type } = e.target;
        const finalValue = type === "number" ? (value === "" ? null : Number(value)) : value;
        setForm({ ...form, [id]: finalValue });
    }

    const handleMatterportChange = (index: number, value: string) => {
        const updatedUrls = [...(form.matterportUrls || [])];
        updatedUrls[index] = value;
        setForm(prev => ({ ...prev, matterportUrls: updatedUrls }));
    };

    const addMatterportField = () => {
        setForm(prev => ({ ...prev, matterportUrls: [...(prev.matterportUrls || []), ""] }));
    };

    const removeMatterportField = (index: number) => {
        const updatedUrls = [...(form.matterportUrls || [])];
        updatedUrls.splice(index, 1);
        setForm(prev => ({ ...prev, matterportUrls: updatedUrls }));
    };

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setIsSubmitting(true);

        const dataToValidate = { ...form, units, developerId };
        const result = propertySchema.safeParse(dataToValidate);

        if (!result.success) {
            setIsSubmitting(false);
            toast.error("Por favor, corrija os erros no formulário.");
            return;
        }

        try {
            const url = property ? `/api/admin/properties/${property.id}` : "/api/admin/properties";
            const method = property ? "PUT" : "POST";

            const response = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(result.data),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || "Falha ao salvar o imóvel.");
            }

            toast.success(`Imóvel ${property ? "atualizado" : "criado"} com sucesso!`);
            onSave();
        } catch (err) {
            console.error(err);
            toast.error(err instanceof Error ? err.message : "Ocorreu um erro inesperado.");
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <div className="w-full flex flex-col">
            <form className="flex flex-col xl:flex-row gap-8" onSubmit={handleSubmit}>
                {/* Coluna esquerda */}
                <div className="flex-1 flex flex-col gap-4">
                    <Label htmlFor="name">Nome do empreendimento</Label>
                    <Input id="name" value={form.name || ""} onChange={handleChange} />

                    <Label htmlFor="address">Localização</Label>
                    <Input id="address" value={form.address || ""} onChange={handleChange} />

                    <Label htmlFor="description">Descrição</Label>
                    <Textarea id="description" value={form.description || ""} onChange={handleChange} />

                    <div className="flex gap-4">
                        <div className="flex-1">
                            <Label htmlFor="launchDate">Data de lançamento</Label>
                            <Input
                                id="launchDate"
                                value={form.launchDate ? new Date(form.launchDate).toISOString().split("T")[0] : ""}
                                onChange={handleChange}
                                type="date"
                            />
                        </div>
                        <div className="flex-1">
                            <Label htmlFor="deliveryDate">Data de entrega</Label>
                            <Input
                                id="deliveryDate"
                                value={form.deliveryDate ? new Date(form.deliveryDate).toISOString().split("T")[0] : ""}
                                onChange={handleChange}
                                type="date"
                            />
                        </div>
                    </div>

                    <div className="flex gap-4">
                        <div className="flex-1">
                            <Label htmlFor="floors">Nº de pavimentos</Label>
                            <Input id="floors" value={form.floors || ""} onChange={handleChange} type="number" />
                        </div>
                        <div className="flex-1">
                            <Label htmlFor="unitsPerFloor">Unidades por andar</Label>
                            <Input
                                id="unitsPerFloor"
                                value={form.unitsPerFloor || ""}
                                onChange={handleChange}
                                type="number"
                            />
                        </div>
                    </div>

                    <Label>Scans 3D Matterport</Label>
                    {form.matterportUrls?.map((url, index) => (
                        <div key={index} className="flex items-center gap-2">
                            <Input
                                value={url}
                                onChange={e => handleMatterportChange(index, e.target.value)}
                                placeholder="https://my.matterport.com/..."
                            />
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => removeMatterportField(index)}
                            >
                                <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                        </div>
                    ))}
                    <Button type="button" variant="outline" size="sm" className="w-fit" onClick={addMatterportField}>
                        <PlusCircle className="h-4 w-4 mr-2" />
                        Adicionar URL
                    </Button>

                    <div className="flex gap-4">
                        <div className="flex-1">
                            <Label>Construtora</Label>
                            <Select value={developerId || ""} onValueChange={value => setDeveloperId(value)}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecione" />
                                </SelectTrigger>
                                <SelectContent>
                                    {developers.map(dev => (
                                        <SelectItem key={dev.id} value={dev.id}>
                                            {dev.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex-1">
                            <Label>Grupos Visíveis</Label>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="outline" className="w-full justify-between">
                                        {form.groups?.length || 0} selecionados{" "}
                                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent className="w-[--radix-dropdown-menu-trigger-width]">
                                    {groups.map(group => (
                                        <DropdownMenuCheckboxItem
                                            key={group.id}
                                            checked={form.groups?.includes(group.id)}
                                            onCheckedChange={checked => {
                                                const newGroups = checked
                                                    ? [...(form.groups || []), group.id]
                                                    : form.groups?.filter(id => id !== group.id);
                                                setForm(prev => ({ ...prev, groups: newGroups }));
                                            }}
                                        >
                                            {group.name}
                                        </DropdownMenuCheckboxItem>
                                    ))}
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </div>

                    <Label>Imagens do Imóvel</Label>
                    <Button type="button" variant="outline" className="w-fit">
                        Adicionar Imagens +
                    </Button>

                    <Label>Imagens das Áreas Comuns</Label>
                    <Button type="button" variant="outline" className="w-fit">
                        Adicionar Imagens +
                    </Button>
                </div>

                {/* Separador vertical */}
                <div className="hidden xl:block w-px bg-gray-300 mx-4" />

                {/* Coluna direita (Unidades) */}
                <div className="flex-1 flex flex-col gap-4">
                    <UnityTable units={units} onUnitsChange={updatedUnits => setUnits(updatedUnits)} />
                </div>
            </form>

            <div className="flex flex-col xl:flex-row justify-center items-center mt-10 gap-4 gap-x-12">
                <Button variant="outline" type="button" onClick={onClose} disabled={isSubmitting}>
                    <X className="w-5 h-5 mr-2" /> Cancelar
                </Button>
                <Button type="submit" onClick={handleSubmit} disabled={isSubmitting} className="bg-black text-white">
                    <Check className="w-5 h-5 mr-2" /> {isSubmitting ? "Salvando..." : "Salvar"}
                </Button>
            </div>
        </div>
    );
}
