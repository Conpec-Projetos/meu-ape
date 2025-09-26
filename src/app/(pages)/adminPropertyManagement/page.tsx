"use client"

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { X } from "lucide-react";
import { z } from "zod";
import { useState } from "react";
import PropertyTable from "./PropertyTable";

const dateRegex = /^\d{2}\/\d{2}\/\d{4}$/;

const propertySchema = z.object({
  nome: z.string().min(1, "Nome obrigatório"),
  localizacao: z.string().min(1, "Localização obrigatória"),
  dataLancamento: z.string().refine(val => dateRegex.test(val), {
    message: "Data deve estar no formato DD/MM/AAAA"  
  }),
  dataEntrega: z.string().refine(val => dateRegex.test(val), {
    message: "Data deve estar no formato DD/MM/AAAA"
  }),
});


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
    } catch (err: any) {
      setErrors(prev => ({ ...prev, [id]: err.errors[0].message }));
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
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="relative w-full max-w-6xl bg-[#e5e5e5] dark:bg-[#222] rounded-xl shadow-lg p-10 flex flex-col">
        <button
          className="absolute top-8 right-8 text-gray-500 hover:text-gray-700"
          aria-label="Fechar"
        >
          <X size={32} />
        </button>
        <h2 className="text-2xl font-bold mb-8">EDIÇÃO DE IMÓVEIS</h2>
        <form className="flex flex-col md:flex-row gap-8" onSubmit={handleSubmit}>
          {/* Coluna esquerda */}
          <div className="flex-1 flex flex-col gap-4">
            <Label htmlFor="nome">Nome do empreendimento</Label>
            <Input id="nome" value={form.nome} onChange={handleChange} onBlur={handleBlur} placeholder="Nome" />
            {errors.nome && <span className="text-red-500 text-sm">{errors.nome}</span>}
            <Label htmlFor="localizacao">Localização</Label>
            <Input id="localizacao" value={form.localizacao} onChange={handleChange} onBlur={handleBlur} placeholder="Endereço completo" />
            {errors.localizacao && <span className="text-red-500 text-sm">{errors.localizacao}</span>}
            <Label>Imagens do empreendimento</Label>
            <div className="flex items-center gap-2 mb-2">
              <Button type="button" variant="outline" className="rounded-full p-2">+</Button>
            </div>
            <div className="flex gap-2">
              <div className="flex-1">
                <Label htmlFor="dataLancamento">Data de lançamento</Label>
                <Input id="dataLancamento" value={form.dataLancamento} onChange={handleChange} onBlur={handleBlur} type="text" placeholder="DD/MM/AAAA" />
                {errors.dataLancamento && <span className="text-red-500 text-sm">{errors.dataLancamento}</span>}
              </div>
              <div className="flex-1">
                <Label htmlFor="dataEntrega">Data de entrega</Label>
                <Input id="dataEntrega" value={form.dataEntrega} onChange={handleChange} onBlur={handleBlur} type="text" placeholder="DD/MM/AAAA" />
                {errors.dataEntrega && <span className="text-red-500 text-sm">{errors.dataEntrega}</span>}
              </div>
            </div>
            <Label htmlFor="caracteristicas">Lista de características</Label>
            <Input id="caracteristicas" placeholder="Ex: academia, espaço de lazer." />
            <Label htmlFor="pavimentos">Número de pavimentos</Label>
            <Input id="pavimentos" placeholder="Número" />
            <Label htmlFor="unidades-andar">Número de unidades por andar</Label>
            <Input id="unidades-andar" placeholder="Número" />
            <Label htmlFor="descricao">Descrição do empreendimento</Label>
            <Input id="descricao" placeholder="Descrição" />
          </div>
          {/* Separador vertical */}
          <div className="hidden md:block w-px bg-gray-400 mx-4" />
          {/* Coluna direita */}
          <div className="flex-1 flex flex-col gap-4">
            <PropertyTable
              onEdit={(property) => {/* lógica para editar */}}
              onDelete={(id) => {/* lógica para excluir */}}
              
            />
          </div>
        </form>
        <div className="flex flex-col md:flex-row justify-center items-center mt-10 gap-4 gap-x-12">
          <Button variant="outline" className="flex items-center gap-2 px- py-4 text-lg">
            <span role="img" aria-label="delete">🗑️</span> Excluir imóvel
          </Button>
          <Button type="submit" form="" className="flex items-center gap-2 px-8 py-4 text-lg bg-[#332475] text-white">
            <span role="img" aria-label="save">💾</span> Salvar
          </Button>
        </div>
      </div>
    </div>
  );
}