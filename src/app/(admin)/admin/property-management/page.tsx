"use client";

import PropertyTable from "@/components/features/tables/PropertyTable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { propertySchema } from "@/schemas/propertySchema";
import { Check, X } from "lucide-react";
import { useState } from "react";
import { ZodError } from "zod";

export default function AdminPropertyManagementPage() {
    const [form, setForm] = useState({
        nome: "",
        localizacao: "",
        dataLancamento: "",
        dataEntrega: "",
    });
    const [errors, setErrors] = useState<{ [key: string]: string }>({});

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

    const [construtoras] = useState([
        "Construtora A",
        "Construtora B",
        "Construtora C",
    ]);

    return (
        <div className="py-20 flex items-center justify-center min-h-screen bg-gray-100">
            <div className="relative w-full max-w-11/12 bg-[#e5e5e5] dark:bg-[#222] rounded-xl shadow-lg p-10 flex flex-col">
                <button className="absolute top-8 right-8 text-gray-500 hover:text-gray-700" aria-label="Fechar">
                    <X size={32} />
                </button>
                <h2 className="text-2xl font-bold mb-8">EDIÇÃO DE IMÓVEIS</h2>
                <form className="flex flex-col md:flex-row gap-8" onSubmit={handleSubmit}>
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

                        <h2 className="font-semibold">Construtora</h2>
                        <select className="w-full mb-2 border shadow rounded">
                        <option value="">Selecione uma construtora</option>
                        {construtoras.map((c) => (
                            <option key={c} value={c}>
                            {c}
                            </option>
                        ))}
                        </select>


                        <Label htmlFor="pavimentos">Número de pavimentos</Label>
                        <Input id="pavimentos" placeholder="Número" />
                        <Label htmlFor="unidades-andar">Número de unidades por andar</Label>
                        <Input id="unidades-andar" placeholder="Número" />
                        <Label htmlFor="descricao">Descrição do empreendimento</Label>
                        <Input id="descricao" placeholder="Descrição" />
                        <Label htmlFor="descricao">Scan 3D Matterport</Label>
                        <Input id="descricao" placeholder="Link" />
                    </div>
                    {/* Separador vertical */}
                    <div className="hidden md:block w-px bg-gray-400 mx-4" />
                    {/* Coluna direita */}
                    <div className="flex-1 flex flex-col gap-4">
                        <PropertyTable
                            onEdit={() => {
                                /* lógica para editar */
                            }}
                            onDelete={() => {
                                /* lógica para excluir */
                            }}
                        />
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
