"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  buscarPropriedades,
  excluirPropriedade,
} from "@/firebase/properties/service";
import { Property } from "@/interfaces/property";
import { useRouter } from "next/navigation";
import { Calendar, MapPin, Clock, Building, Trash2 } from "lucide-react";
import { toast } from "sonner";

export default function PropertiesListPage() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function fetchProperties() {
      try {
        setIsLoading(true);
        const data = await buscarPropriedades();
        setProperties(data);
      } catch {
        toast.error("Erro ao carregar a lista de empreendimentos.");
      } finally {
        setIsLoading(false);
      }
    }

    fetchProperties();
  }, []);

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(date);
  };

  const handleDelete = async (id: string, nome: string) => {
    toast(`Tem certeza que deseja excluir o empreendimento "${nome}"?`, {
      action: {
        label: "Excluir",
        onClick: async () => {
          try {
            await excluirPropriedade(id);
            setProperties(properties.filter((p) => p.id !== id));
            toast.success("Empreendimento excluído com sucesso!");
          } catch {
            toast.error("Erro ao excluir empreendimento. Tente novamente.");
          }
        },
      },
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="w-full flex justify-between items-center p-4 bg-white shadow-sm">
        <Button
          variant="outline"
          className="cursor-pointer"
          onClick={() => router.push("/")}
        >
          Voltar ao Início
        </Button>
        <Button
          onClick={() => router.push("/beta/property/write")}
          className="cursor-pointer"
        >
          Novo Empreendimento
        </Button>
      </div>

      <div className="w-full h-fit p-4">
        <div className="mb-8 w-full flex flex-col items-center">
          <h1 className="text-center text-3xl font-bold text-gray-900">
            Lista de Empreendimentos
          </h1>
          <p className="text-center text-gray-600 mt-2">
            Gerencie todos os seus empreendimentos cadastrados
          </p>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-full py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            <p className="mt-4 text-gray-600">Carregando empreendimentos...</p>
          </div>
        ) : properties.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full py-12">
            <Building size={48} className="text-gray-400 mb-4" />
            <h2 className="text-center text-xl font-semibold text-gray-900 mb-2">
              Nenhum empreendimento encontrado
            </h2>
            <p className="text-center text-gray-600 mb-6">
              Comece cadastrando seu primeiro empreendimento
            </p>
            <Button onClick={() => router.push("/beta/property/write")}>
              Cadastrar Primeiro Empreendimento
            </Button>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 w-full">
            {properties.map((property) => (
              <Card
                key={property.id}
                className="hover:shadow-lg transition-shadow"
              >
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <CardTitle className="text-lg">
                        {property.nomeEmpreendimento}
                      </CardTitle>
                      <CardDescription className="flex items-start gap-2 mt-2">
                        <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
                        <span className="text-sm">
                          {property.enderecoCompleto}
                        </span>
                      </CardDescription>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-red-600 hover:text-red-800 hover:bg-red-50 cursor-pointer"
                      onClick={() =>
                        handleDelete(property.id!, property.nomeEmpreendimento)
                      }
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Clock className="h-4 w-4" />
                      <span>
                        <strong>Prazo:</strong>{" "}
                        {formatDate(property.prazoEntrega)}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Calendar className="h-4 w-4" />
                      <span>
                        <strong>Lançamento:</strong>{" "}
                        {formatDate(property.dataLancamento)}
                      </span>
                    </div>

                    <div className="text-xs text-gray-500 pt-2 border-t">
                      Cadastrado em: {formatDate(property.criadoEm)}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
