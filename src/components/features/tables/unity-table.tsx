import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Edit, Trash, Image as ImageIcon } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import AddUnitModal from "../modals/add-unit-modal";
import EditImagesModal from "../modals/edit-images-modal";

interface Property {
  id: string;
  categoria: string;
  identificador: string;
  preco: number;
  andar: number;
  tamanho: number;
  quartos: number;
  banheiros: number;
  garagem: number;
  disponibilidade: string;
  images?: string[];
  planta?: string[];
}

export default function PropertyTable({ onEdit, onDelete }: {
  onEdit: (property: Property) => void;
  onDelete: (id: string) => void;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [properties, setProperties] = useState<Property[]>([]);
  const [showEditImagesModal, setShowEditImagesModal] = useState<{ open: boolean; id: string | null }>({ open: false, id: null });
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
          categoria: "A",
          identificador: "0001",
          preco: 3000,
          andar: 2,
          tamanho: 30,
          quartos: 2,
          banheiros: 2,
          garagem: 1,
          disponibilidade: "sim",
          images: [],
          planta: [],
        },
        {
          id: "2",
          categoria: "A",
          identificador: "0002",
          preco: 3800,
          andar: 2,
          tamanho: 30,
          quartos: 2,
          banheiros: 2,
          garagem: 2,
          images: [],
          disponibilidade: "sim",
          planta: [],
        }
        
        // ...restante dos mocks
      ]);
      setTotalPages(3);
      setLoading(false);
    }, 1000);
  }, [page]);
  function handleEditImages(id: string) {
    setShowEditImagesModal({ open: true, id });
  }

  function handleSaveImages(imgs: string[]) {
    if (showEditImagesModal.id) {
      setProperties(prev => prev.map(p => p.id === showEditImagesModal.id ? { ...p, images: imgs } : p));
    }
    setShowEditImagesModal({ open: false, id: null });
  }

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
          <tr className="">
            <th className="p-3 text-left">Id</th>
            <th className="p-3 text-left">Categoria</th>
            <th className="p-3 text-left">Valor</th>
            <th className="p-3 text-left">Andar</th>
            <th className="p-3 text-left">Espaço</th>
            <th className="p-3 text-left">Quartos</th>
            <th className="p-3 text-left">Banheiros</th>
            <th className="p-3 text-center">Vagas de garagem</th>
            <th className="p-3 text-center">Disponível</th>
            <th className="p-3 text-center">Fotos</th>
            <th className="p-3 text-center">Planta</th>
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
                <td className="p-3 text-center">{property.categoria}</td>
                <td className="p-3">R${property.preco}</td>
                <td className="p-3 text-center">{property.andar}</td>
                <td className="p-3 text-center">{property.tamanho}m²</td>
                <td className="p-3 text-center">{property.quartos}</td>
                <td className="p-3 text-center">{property.banheiros}</td>
                <td className="p-3 text-center">{property.garagem}</td>
                <td className="p-3 text-center">{property.disponibilidade}</td>
                <td className="p-3 text-center">
                  <Button size="icon" variant="ghost" onClick={() => handleEditImages(property.id)}>
                    <ImageIcon className="w-5 h-5" />
                  </Button>
                </td>
                <td className="p-3 text-center">
                  <Button size="icon" variant="ghost" onClick={() => handleEditImages(property.id)}>
                    <ImageIcon className="w-5 h-5" />
                  </Button>
                </td> 
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
      {showEditImagesModal.open && (
        <EditImagesModal
          onClose={() => setShowEditImagesModal({ open: false, id: null })}
          onSave={handleSaveImages}
          images={properties.find(p => p.id === showEditImagesModal.id)?.images || []}
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
