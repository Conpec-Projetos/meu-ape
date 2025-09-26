import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Edit, Trash } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import AddUnitModal from "./AddUnitModal";

interface Property {
  id: string;
  identificador: string;
  preco: number;
  tamanho: number;
  quartos: number;
  banheiros: number;
  garagem: number;
}

export default function PropertyTable({ onEdit, onDelete }: {
  onEdit: (property: Property) => void;
  onDelete: (id: string) => void;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [properties, setProperties] = useState<Property[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(Number(searchParams.get("page")) || 1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    setLoading(true);
    // Simula fetch do backend
    setTimeout(() => {
      setProperties([
        {
          id: "1",
          identificador: "0001",
          preco: 3000,
          tamanho: 30,
          quartos: 2,
          banheiros: 2,
          garagem: 5,
        },
        {
          id: "2",
          identificador: "1200",
          preco: 3000,
          tamanho: 30,
          quartos: 2,
          banheiros: 2,
          garagem: 5,
        },
        {
          id: "3",
          identificador: "1023",
          preco: 3000,
          tamanho: 30,
          quartos: 2,
          banheiros: 2,
          garagem: 5,
        },
        {
          id: "4",
          identificador: "0034",
          preco: 3000,
          tamanho: 30,
          quartos: 2,
          banheiros: 2,
          garagem: 5,
        },
        {
          id: "5",
          identificador: "0234",
          preco: 3000,
          tamanho: 30,
          quartos: 2,
          banheiros: 2,
          garagem: 5,
        },
        {
          id: "6",
          identificador: "4000",
          preco: 3000,
          tamanho: 30,
          quartos: 2,
          banheiros: 2,
          garagem: 5,
        },
      ]);
      setTotalPages(3);
      setLoading(false);
    }, 1000);
  }, [page]);

  function handlePageChange(newPage: number) {
    router.push(`?page=${newPage}`);
    setPage(newPage);
  }

  function handleAddUnit(unit: Omit<Property, "id">) {
    setProperties(prev => [...prev, { id: String(Date.now()), ...unit }]);
    setShowAddModal(false);
  }
    

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Unidades</h1>
  <Button onClick={() => setShowAddModal(true)}>Adicionar unidade</Button>
      </div>
      <table className="w-full border rounded-lg overflow-hidden">
        <thead className="bg-gray-100">
          <tr>
            <th className="p-3 text-left">Id</th>
            <th className="p-3 text-left">Preço total</th>
            <th className="p-3 text-left">Tamanho</th>
            <th className="p-3 text-left">Quartos</th>
            <th className="p-3 text-left">Banheiros</th>
            <th className="p-3 text-center">Vagas de garagem</th>
            <th className="p-3 text-center">Ações</th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <tr key={i}>
                <td colSpan={5} className="p-3">
                  <Skeleton className="h-6 w-full" />
                </td>
              </tr>
            ))
          ) : (
            properties.map((property) => (
              <tr key={property.id} className="border-b">
                <td className="p-3">{property.identificador}</td>
                 <td className="p-3">R${property.preco}</td>
                <td className="p-3 text-center">{property.tamanho}m²</td>
                <td className="p-3 text-center">{property.quartos}</td>
                <td className="p-3 text-center">{property.banheiros}</td>
                <td className="p-3 text-center">{property.garagem}</td>
                <td className="p-3 text-center flex gap-2 justify-center">
                  <Button size="icon" variant="ghost" onClick={() => onEdit(property)}>
                    <Edit className="w-5 h-5" />
                  </Button>
                  <Button size="icon" variant="ghost" onClick={() => onDelete(property.id)}>
                    <Trash className="w-5 h-5" />
                  </Button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
      {showAddModal && (
        <AddUnitModal
          onClose={() => setShowAddModal(false)}
          onSave={handleAddUnit}
        />
      )}
      <div className="flex justify-center items-center gap-2 mt-6">
        <Button disabled={page === 1} onClick={() => handlePageChange(page - 1)}>
          Anterior
        </Button>
        <span>Página {page} de {totalPages}</span>
        <Button disabled={page === totalPages} onClick={() => handlePageChange(page + 1)}>
          Próxima
        </Button>
      </div>
    </div>
  );
}
