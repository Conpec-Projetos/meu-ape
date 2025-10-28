"use client";

import { PropertiesTable } from "@/components/specifics/admin/property/properties-table";
import { PropertyModal } from "@/components/specifics/admin/property/property-modal";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useProperties } from "@/hooks/use-properties";
import { Property } from "@/interfaces/property";
import { Search } from "lucide-react";
import { Suspense, useEffect, useRef, useState } from "react";
import InfiniteScroll from "react-infinite-scroll-component";
import { toast } from "sonner";

function PropertyManagementContent() {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
    const { properties, isLoading, error, hasMore, fetchMoreProperties, refreshProperties, searchProperties } =
        useProperties();
    const [searchQuery, setSearchQuery] = useState("");
    const debounceRef = useRef<number | null>(null);

    // Debounce search input and trigger server search
    useEffect(() => {
        if (debounceRef.current) {
            clearTimeout(debounceRef.current);
        }
        // window.setTimeout returns a number in browser environments
        debounceRef.current = window.setTimeout(() => {
            const q = searchQuery.trim();
            // Use fuzzy search by default
            // When the search input is cleared, pass an empty string so the
            // hook treats it as an explicit (empty) query and clears the server-side filter.
            searchProperties(q.length ? q : "", true);
        }, 400) as unknown as number;

        return () => {
            if (debounceRef.current) clearTimeout(debounceRef.current);
        };
    }, [searchQuery, searchProperties]);

    const handleAddProperty = () => {
        setSelectedProperty(null);
        setIsModalOpen(true);
    };

    const handleEditProperty = (property: Property) => {
        setSelectedProperty(property);
        setIsModalOpen(true);
    };

    const handleDeleteProperty = async (property: Property) => {
        if (confirm(`Tem certeza que deseja excluir o imóvel "${property.name}"?`)) {
            try {
                const response = await fetch(`/api/admin/properties/${property.id}`, {
                    method: "DELETE",
                });

                if (!response.ok) {
                    throw new Error("Falha ao excluir o imóvel.");
                }

                toast.success("Imóvel excluído com sucesso!");
                refreshProperties();
            } catch (error) {
                console.error("Erro ao excluir imóvel:", error);
                toast.error(error instanceof Error ? error.message : "Falha ao excluir o imóvel.");
            }
        }
    };

    const handleModalClose = () => {
        setIsModalOpen(false);
        setSelectedProperty(null);
    };

    const handleModalSave = () => {
        handleModalClose();
        refreshProperties();
    };

    const renderContent = () => {
        if (isLoading && properties.length === 0) {
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
            // Use max-height so the container shrinks to fit small result sets
            // but still scrolls when content exceeds the viewport fraction.
            <div id="scrollableDiv" className="max-h-[60vh] overflow-y-auto">
                <InfiniteScroll
                    dataLength={properties.length}
                    next={fetchMoreProperties}
                    hasMore={hasMore}
                    loader={<p className="text-center py-4">Carregando mais imóveis...</p>}
                    endMessage={
                        properties.length > 0 && (
                            <p className="text-center py-4">
                                <b>Você chegou ao fim!</b>
                            </p>
                        )
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
                    <Input
                        value={searchQuery}
                        onChange={e => setSearchQuery((e.target as HTMLInputElement).value)}
                        placeholder="Procurar por título ou endereço..."
                        className="pl-8 w-full"
                    />
                </div>
                <Button onClick={handleAddProperty} className="cursor-pointer w-full sm:w-auto">
                    Adicionar Novo Imóvel
                </Button>
            </div>

            {/* search is handled via effect */}

            <Card>
                <CardHeader>
                    <CardTitle>Todos os Imóveis</CardTitle>
                </CardHeader>
                <CardContent>{renderContent()}</CardContent>
            </Card>

            {isModalOpen && (
                <PropertyModal
                    isOpen={isModalOpen}
                    onClose={handleModalClose}
                    onSave={handleModalSave}
                    property={selectedProperty}
                />
            )}
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
