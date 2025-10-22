"use client";

import { PropertyModal } from "@/components/features/modals/property-modal";
import { PropertiesTable } from "@/components/features/tables/properties-table";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { DocumentData, QueryDocumentSnapshot } from "firebase/firestore";
import { Search } from "lucide-react";
import { Suspense, useEffect, useState } from "react";
import InfiniteScroll from "react-infinite-scroll-component";
import { deleteProperty, getPropertiesPage } from "@/firebase/properties/properties";
import { Property } from "@/firebase/properties/property";

// Hook para buscar imóveis com paginação
function useProperties() {
    const [properties, setProperties] = useState<Property[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [lastDoc, setLastDoc] = useState<QueryDocumentSnapshot<DocumentData> | null>(null);
    const [hasMore, setHasMore] = useState(true);

    const fetchInitialProperties = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const { properties: newProperties, lastDoc: newLastDoc, hasMore: newHasMore } = await getPropertiesPage();
            setProperties(newProperties as Property[]);
            setLastDoc(newLastDoc);
            setHasMore(newHasMore);
        } catch (e) {
            console.error("Erro ao buscar imóveis:", e);
            setError("Falha ao buscar imóveis.");
        } finally {
            setIsLoading(false);
        }
    };

    const fetchMoreProperties = async () => {
        if (!hasMore) return;
        const {
            properties: newProperties,
            lastDoc: newLastDoc,
            hasMore: newHasMore,
        } = await getPropertiesPage(lastDoc);
        setProperties(prev => [...prev, ...(newProperties as Property[])]);
        setLastDoc(newLastDoc);
        setHasMore(newHasMore);
    };

    useEffect(() => {
        fetchInitialProperties();
    }, []);

    return { properties, isLoading, error, hasMore, fetchMoreProperties, refresh: fetchInitialProperties };
}

function PropertyManagementContent() {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const { properties, isLoading, error, hasMore, fetchMoreProperties, refresh: refreshProperties } = useProperties();

    const handleAddProperty = () => {
        setIsModalOpen(true);
    };

    const handleEditProperty = (property: Property) => {
        // Lógica para abrir modal de edição
        console.log("Editar imóvel:", property.id);
        // Para edição, você usaria uma rota de interceptação similar, ex:
        // <Link href={`/admin/property-management/${property.id}`}>
    };

    const handleDeleteProperty = async (property: Property) => {
        // Lógica para abrir modal de confirmação de exclusão
        if (confirm(`Tem certeza que deseja excluir o imóvel "${property.title}"?`)) {
            try {
                await deleteProperty(property.id);
                alert("Imóvel excluído com sucesso!");
                refreshProperties(); // Para atualizar a lista após deletar
            } catch (error) {
                console.error("Erro ao excluir imóvel:", error);
                alert("Falha ao excluir o imóvel.");
            }
        }
    };

    const renderContent = () => {
        if (isLoading) {
            // TODO: Criar um componente de Skeleton para a tabela de imóveis
            return (
                <div className="flex items-center justify-center py-16">
                    <p>Carregando imóveis...</p>
                </div>
            );
        }

        if (error) {
            return <p className="text-red-500">{error}</p>;
        }

        return (
            <div id="scrollableDiv" className="h-[60vh] overflow-y-auto">
                <InfiniteScroll
                    dataLength={properties.length}
                    next={fetchMoreProperties}
                    hasMore={hasMore}
                    loader={<p className="text-center py-4">Carregando mais imóveis...</p>}
                    endMessage={
                        <p className="text-center py-4">
                            <b>Você chegou ao fim!</b>
                        </p>
                    }
                    scrollableTarget="scrollableDiv"
                >
                    <PropertiesTable
                        properties={properties}
                        onEdit={handleEditProperty}
                        onDelete={handleDeleteProperty}
                    />
                </InfiniteScroll>
            </div>
        );
    };

    return (
        // Removido o h-screen para que a altura da página seja flexível
        <div className="container mx-auto py-20">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
                <div>
                    <h1 className="text-3xl font-bold">Gerenciamento de Imóveis</h1>
                    <p className="text-muted-foreground">Visualize, adicione e gerencie todos os imóveis do sistema.</p>
                </div>
            </div>

            <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-4">
                <div className="relative w-full sm:max-w-xs">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="Procurar por título ou endereço..." className="pl-8 w-full" />
                </div>
                <Button onClick={handleAddProperty} className="cursor-pointer w-full sm:w-auto">
                    Adicionar Novo Imóvel
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Todos os Imóveis</CardTitle>
                </CardHeader>
                <CardContent>{renderContent()}</CardContent>
            </Card>

            <PropertyModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
        </div>
    );
}

export default function AdminPropertiesPage() {
    return (
        <Suspense fallback={<div>Carregando...</div>}>
            <PropertyManagementContent />
        </Suspense>
    );
}
