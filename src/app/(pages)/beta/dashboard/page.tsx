"use client";

import { countProperties } from "@/firebase/properties/service";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

export default function DashboardPage() {
  const [propertiesNum, setPropertiesNum] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchPropertiesNum = async () => {
      try {
        setLoading(true);

        const num = await countProperties();
        setPropertiesNum(num);

        console.log(`Successfully fetched ${num} properties`);
      } catch {
        toast.error("Erro ao carregar dados do dashboard");
      } finally {
        setLoading(false);
      }
    };

    fetchPropertiesNum();
  }, []);

  return (
    <div className="h-screen w-screen bg-gray-50 p-6">
      <div className="w-full mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-2">
          Visão geral do Meu Apê
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total de Empreendimentos
            </CardTitle>
            <Building className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-start mt-2">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"></div>
                <span className="ml-2 text-sm text-gray-600">
                  Carregando...
                </span>
              </div>
            ) : (
              <>
                <div className="text-2xl font-bold">{propertiesNum}</div>
                <p className="text-xs text-muted-foreground">
                  {propertiesNum === 1
                    ? "empreendimento cadastrado"
                    : "empreendimentos cadastrados"}
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Ações Rápidas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Link
              href="/beta/property/write"
              className="block w-full p-4 text-left bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200 transition-colors"
            >
              <h3 className="font-semibold text-blue-900">
                Novo Empreendimento
              </h3>
              <p className="text-sm text-blue-700">
                Cadastrar um novo empreendimento
              </p>
            </Link>

            <Link
              href="/beta/property"
              className="block w-full p-4 text-left bg-green-50 hover:bg-green-100 rounded-lg border border-green-200 transition-colors"
            >
              <h3 className="font-semibold text-green-900">
                Ver Empreendimentos
              </h3>
              <p className="text-sm text-green-700">
                Listar todos os empreendimentos
              </p>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Estatísticas Gerais</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">
                  Status do Sistema:
                </span>
                <span className="text-green-600 font-semibold">Online</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
