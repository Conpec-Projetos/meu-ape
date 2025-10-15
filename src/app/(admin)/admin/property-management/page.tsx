"use client";

import PropertyTable from "@/components/features/tables/PropertyTable";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
    DropdownMenuContent,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { propertySchema } from "@/schemas/propertySchema";
import { Check, X, ChevronsUpDown } from "lucide-react";
import { useState, useMemo } from "react";
import { ZodError } from "zod";

export default function AdminPropertyManagementPage() {
    const [form, setForm] = useState({
        nome: "",
        localizacao: "",
        dataLancamento: "",
        dataEntrega: "",
    });
    const [errors, setErrors] = useState<{ [key: string]: string }>({});

    // Dados fictícios de usuários
    const [users] = useState([
        { id: "1", name: "Grupo A" },
        { id: "2", name: "Grupo B" },
        { id: "3", name: "Grupo C" },
        { id: "4", name: "Grupo D" },
        { id: "5", name: "Grupo E" },
    ]);
    const [selectedUsers, setSelectedUsers] = useState<typeof users>([]);
    const [selectedConstrutora, setSelectedConstrutora] = useState("");

    const [construtoras] = useState([
        "Construtora A",
        "Construtora B",
        "Construtora C",
    ]);

    function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
        setForm({ ...form, [e.target.id]: e.target.value });
    }

    function handleBlur(e: React.FocusEvent<HTMLInputElement>) {
        const { id, value } = e.target;
        const fieldSchema = propertySchema.shape[id as keyof typeof propertySchema.shape];
        try {
            fieldSchema.parse(value);
            setErrors(prev => ({ ...prev, [id]: "" }));
        } catch (err) {
            if (err instanceof ZodError) {
                const message = err.errors?.[0]?.message ?? "Valor inválido";
                setErrors(prev => ({ ...prev, [id]: message }));
            } else {
                setErrors(prev => ({ ...prev, [id]: "Valor inválido" }));
            }
        }
    }

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        const result = propertySchema.safeParse(form);
        if (!result.success) {
            const fieldErrors = result.error.flatten().fieldErrors;
            setErrors(fieldErrors as { [key: string]: string });
        } else {
            setErrors({});
            // Aqui você pode enviar os dados para o backend ou prosseguir
            alert("Dados válidos! Pronto para enviar.");
        }
    }

    return (
        <div className="py-20 flex items-center justify-center min-h-screen bg-gray-100">
            <div className="relative w-full max-w-11/12 bg-[#e5e5e5] dark:bg-[#222] rounded-xl shadow-lg p-10 flex flex-col">
                <button className="absolute top-8 right-8 text-gray-500 hover:text-gray-700" aria-label="Fechar">
                    <X size={32} />
                </button>
                <h2 className="text-2xl font-bold mb-8">EDIÇÃO DE IMÓVEIS</h2>
                <form className="flex flex-col xl:flex-row gap-8" onSubmit={handleSubmit}>
                    {/* Coluna esquerda */}
                    <div className="flex-1 flex flex-col gap-4">
                        <Label htmlFor="nome">Nome do empreendimento</Label>
                        <Input
                            id="nome"
                            value={form.nome}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            placeholder="Nome"
                        />
                        {errors.nome && <span className="text-red-500 text-sm">{errors.nome}</span>}
                        <Label htmlFor="localizacao">Localização</Label>
                        <Input
                            id="localizacao"
                            value={form.localizacao}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            placeholder="Endereço completo"
                        />
                        {errors.localizacao && <span className="text-red-500 text-sm">{errors.localizacao}</span>}

                        <Label>Imagens do empreendimento</Label>
                        <div className="flex items-center gap-2 mb-2">
                            <Button type="button" variant="outline" className="rounded-full p-2">
                                +
                            </Button>
                        </div>
                        <div className="flex gap-2">
                            <div className="flex-1">
                                <Label htmlFor="dataLancamento">Data de lançamento</Label>
                                <Input
                                    id="dataLancamento"
                                    value={form.dataLancamento}
                                    onChange={handleChange}
                                    onBlur={handleBlur}
                                    type="date"
                                    placeholder="Data de lançamento"
                                />
                            </div>
                            <div className="flex-1">
                                <Label htmlFor="dataEntrega">Data de entrega</Label>
                                <Input
                                    id="dataEntrega"
                                    value={form.dataEntrega}
                                    onChange={handleChange}
                                    onBlur={handleBlur}
                                    type="date"
                                    placeholder="Data de entrega"
                                />
                            </div>
                        </div>
                        <Label htmlFor="caracteristicas">Lista de características</Label>
                        <Input id="caracteristicas" placeholder="Ex: academia, espaço de lazer." />

                        <Label>Imagens das áreas comuns ao predio</Label>
                        <div className="flex items-center gap-2 mb-2">
                            <Button type="button" variant="outline" className="rounded-full p-2">
                                +
                            </Button>
                        </div>

                        <Label>Construtora</Label>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" className="w-full items-center justify-between bg-gray shadow hover:bg-gray hover:text-gray text-gray-500">
                                    {selectedConstrutora || "Selecione uma construtora"}
                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="w-[--radix-dropdown-menu-trigger-width]">
                                <DropdownMenuLabel>Construtoras</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuRadioGroup value={selectedConstrutora} onValueChange={setSelectedConstrutora}>
                                    {construtoras.map((c) => (
                                        <DropdownMenuRadioItem key={c} value={c}>
                                            {c}
                                        </DropdownMenuRadioItem>
                                    ))}
                                </DropdownMenuRadioGroup>
                            </DropdownMenuContent>
                        </DropdownMenu>
                        
                        <Label>Liberado para</Label>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <div
                                    role="combobox"
                                    tabIndex={0}
                                    className={`flex h-10 w-full items-center justify-between rounded-md border border-input px-3 py-2 text-sm shadow-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${
                                        selectedUsers.length === 0 ? "text-gray-600" : "text-black"
                                    }`}
                                >
                                    {selectedUsers.length > 0 ? `${selectedUsers.length} grupos(s) selecionado(s)` : "Selecione os grupos"}
                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </div>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="w-[--radix-dropdown-menu-trigger-width]">
                                <DropdownMenuLabel>Grupos</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                {users.map((user) => (
                                    <DropdownMenuCheckboxItem
                                        key={user.id}
                                        checked={selectedUsers.some(su => su.id === user.id)}
                                        onSelect={(e) => e.preventDefault()} // Previne que o menu feche ao clicar
                                        onCheckedChange={(checked) => {
                                            if (checked) {
                                                setSelectedUsers(prev => [...prev, user]);
                                            } else {
                                                setSelectedUsers(prev => prev.filter(u => u.id !== user.id));
                                            }
                                        }}
                                    >
                                        {user.name}
                                    </DropdownMenuCheckboxItem>
                                ))}
                            </DropdownMenuContent>
                        </DropdownMenu>


                        <Label htmlFor="pavimentos">Número de pavimentos</Label>
                        <Input id="pavimentos" placeholder="Número" />
                        <Label htmlFor="unidades-andar">Número de unidades por andar</Label>
                        <Input id="unidades-andar" placeholder="Número" />
                        <Label htmlFor="descricao">Descrição do empreendimento</Label>
                        <Input id="descricao" placeholder="Descrição" />
                        <Label htmlFor="matterport">Scan 3D Matterport</Label>
                        <Input id="matterport" placeholder="Link" />

                        
                    </div>
                    {/* Separador vertical */}
                    <div className="hidden md:block w-px bg-gray-400 mx-4" />
                    {/* Coluna direita */}
                    <div className="flex-1 flex flex-col gap-4">
                        <div className="overflow-x-auto">
                            <PropertyTable
                                onEdit={() => {
                                    /* lógica para editar */
                                }}
                                onDelete={() => {
                                    /* lógica para excluir */
                                }}
                            />
                        </div>
                    </div>
                </form>
                <div className="flex flex-col md:flex-row justify-center items-center mt-10 gap-4 gap-x-12">
                    <Button variant="outline" className="flex items-center gap-2 px-4 py-4 text-lg">
                        <X className="w-5 h-5" /> Excluir imóvel
                    </Button>
                    <Button
                        type="submit"
                        form=""
                        className="flex items-center gap-2 px-8 py-4 text-lg bg-black text-white"
                    >
                        <Check className="w-5 h-5" /> Salvar
                    </Button>
                </div>
            </div>
        </div>
    );
}
