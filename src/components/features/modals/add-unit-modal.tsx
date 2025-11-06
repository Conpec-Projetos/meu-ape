import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { lockBodyScroll, unlockBodyScroll } from "@/lib/scrollLock";
import { useEffect, useState } from "react";

export default function AddUnitModal({
    onClose,
    onSave,
}: {
    onClose: () => void;
    onSave: (unit: {
        identificador: string;
        preco: number;
        tamanho: number;
        quartos: number;
        banheiros: number;
        garagem: number;
    }) => void;
}) {
    const [form, setForm] = useState({
        identificador: "",
        preco: "",
        tamanho: "",
        quartos: "",
        banheiros: "",
        garagem: "",
    });

    function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
        setForm({ ...form, [e.target.id]: e.target.value });
    }

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        onSave({
            identificador: form.identificador,
            preco: Number(form.preco),
            tamanho: Number(form.tamanho),
            quartos: Number(form.quartos),
            banheiros: Number(form.banheiros),
            garagem: Number(form.garagem),
        });
        onClose();
    }

    useEffect(() => {
        lockBodyScroll();
        return () => unlockBodyScroll();
    }, []);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
            <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-sm">
                <h2 className="text-lg font-bold mb-4">Adicionar Unidade</h2>
                <form className="flex flex-col gap-3" onSubmit={handleSubmit}>
                    <Input
                        id="identificador"
                        value={form.identificador}
                        onChange={handleChange}
                        placeholder="Identificador"
                        required
                    />
                    <Input
                        id="preco"
                        value={form.preco}
                        onChange={handleChange}
                        placeholder="Preço total"
                        type="number"
                        required
                    />
                    <Input
                        id="tamanho"
                        value={form.tamanho}
                        onChange={handleChange}
                        placeholder="Tamanho (m²)"
                        type="number"
                        required
                    />
                    <Input
                        id="quartos"
                        value={form.quartos}
                        onChange={handleChange}
                        placeholder="Numero de quartos"
                        type="number"
                        required
                    />
                    <Input
                        id="banheiros"
                        value={form.banheiros}
                        onChange={handleChange}
                        placeholder="Numero de banheiros"
                        type="number"
                        required
                    />
                    <Input
                        id="garagem"
                        value={form.garagem}
                        onChange={handleChange}
                        placeholder="Vagas de garagem"
                        type="number"
                        required
                    />
                    <div className="flex justify-end gap-2 mt-4">
                        <Button type="button" variant="outline" onClick={onClose}>
                            Cancelar
                        </Button>
                        <Button type="submit" className="bg-[#332475] text-white">
                            Salvar
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
