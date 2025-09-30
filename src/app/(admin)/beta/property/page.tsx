"use client";

import blurImgUrl from "@/assets/blur_img_placeholder.jpg";
import { Button } from "@/components/features/buttons/default-button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/features/cards/default-card";
import { buscarPropriedadesPaginado, excluirPropriedade } from "@/firebase/properties/service";
import { Property } from "@/interfaces/propertyOld";
import { QueryDocumentSnapshot } from "firebase/firestore";
import { Building, Calendar, Clock, ImageIcon, MapPin, Pencil, Trash2 } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export default function PropertiesListPage() {
    const [properties, setProperties] = useState<Property[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [lastDoc, setLastDoc] = useState<QueryDocumentSnapshot | null>(null);
    const [hasMore, setHasMore] = useState(true);
    const router = useRouter();

    useEffect(() => {
        async function fetchProperties() {
            try {
                setIsLoading(true);
                const data = await buscarPropriedadesPaginado(30);
                setProperties(data.properties);
                setLastDoc(data.lastDoc);
                setHasMore(data.hasMore);
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
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
        }).format(date);
    };

    const loadMoreProperties = async () => {
        if (!hasMore || isLoadingMore || !lastDoc) return;

        try {
            setIsLoadingMore(true);
            const result = await buscarPropriedadesPaginado(30, lastDoc);
            setProperties(prev => [...prev, ...result.properties]);
            setLastDoc(result.lastDoc);
            setHasMore(result.hasMore);
        } catch {
            toast.error("Erro ao carregar mais empreendimentos.");
        } finally {
            setIsLoadingMore(false);
        }
    };

    const handleDelete = async (id: string, nome: string) => {
        toast(`Tem certeza que deseja excluir o empreendimento "${nome}"?`, {
            action: {
                label: "Excluir",
                onClick: async () => {
                    try {
                        await excluirPropriedade(id);
                        setProperties(properties.filter(p => p.id !== id));
                        toast.success("Empreendimento excluído com sucesso!");
                    } catch {
                        toast.error("Erro ao excluir empreendimento. Tente novamente.");
                    }
                },
            },
        });
    };

    return (
        <div className="pt-15 min-h-screen bg-gray-50 flex flex-col">
            <div className="w-full flex justify-between items-center p-4 bg-white shadow-sm">
                <Button variant="outline" className="cursor-pointer" onClick={() => router.push("/")}>
                    Voltar ao Início
                </Button>
                <Button onClick={() => router.push("/beta/property/write")} className="cursor-pointer">
                    Novo Empreendimento
                </Button>
            </div>

            <div className="w-full h-fit p-4">
                <div className="mb-8 w-full flex flex-col items-center">
                    <h1 className="text-center text-3xl font-bold text-gray-900">Lista de Empreendimentos</h1>
                    <p className="text-center text-gray-600 mt-2">Gerencie todos os seus empreendimentos cadastrados</p>
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
                        <p className="text-center text-gray-600 mb-6">Comece cadastrando seu primeiro empreendimento</p>
                        <Button onClick={() => router.push("/beta/property/write")}>
                            Cadastrar Primeiro Empreendimento
                        </Button>
                    </div>
                ) : (
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 w-full">
                        {properties.map(property => (
                            <Card key={property.id} className="hover:shadow-lg transition-shadow">
                                <CardHeader>
                                    <div className="flex justify-between items-start">
                                        <div className="grid grid-cols-[auto_1fr] w-3/4 max-w-3/4 gap-3 items-start">
                                            {/* Property Image Preview */}
                                            <div className="w-16 h-16 rounded-lg relative bg-gray-100">
                                                {property.imagens && property.imagens.length > 0 ? (
                                                    <Image
                                                        src={property.imagens[0]}
                                                        alt={property.nomeEmpreendimento}
                                                        fill
                                                        className="object-cover rounded-lg"
                                                        sizes="(max-width: 768px) 100vw, 50vw"
                                                        placeholder="blur"
                                                        blurDataURL={blurImgUrl.src}
                                                        unoptimized
                                                    />
                                                ) : (
                                                    <div className="flex items-center justify-center w-full h-full">
                                                        <ImageIcon className="h-6 w-6 text-gray-400" />
                                                    </div>
                                                )}
                                            </div>

                                            {/* Property Info */}
                                            <div>
                                                <CardTitle className="text-lg">{property.nomeEmpreendimento}</CardTitle>
                                                <CardDescription className="flex items-start gap-2 mt-2">
                                                    <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
                                                    <span className="text-sm line-clamp-2">
                                                        {property.enderecoCompleto}
                                                    </span>
                                                </CardDescription>
                                            </div>
                                        </div>

                                        {/* Action Buttons */}
                                        <div className="flex gap-1 flex-shrink-0">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="text-sky-600 hover:text-sky-800 hover:bg-sky-50 cursor-pointer p-2"
                                                onClick={() => router.push(`/beta/property/write/${property.id}`)}
                                            >
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="text-red-600 hover:text-red-800 hover:bg-red-50 cursor-pointer p-2"
                                                onClick={() => handleDelete(property.id!, property.nomeEmpreendimento)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-2 text-sm text-gray-600">
                                            <Clock className="h-4 w-4" />
                                            <span>
                                                <strong>Prazo:</strong> {formatDate(property.prazoEntrega)}
                                            </span>
                                        </div>

                                        <div className="flex items-center gap-2 text-sm text-gray-600">
                                            <Calendar className="h-4 w-4" />
                                            <span>
                                                <strong>Lançamento:</strong> {formatDate(property.dataLancamento)}
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

                {/* Load More Button */}
                {!isLoading && properties.length > 0 && hasMore && (
                    <div className="flex justify-center mt-8">
                        <Button
                            onClick={loadMoreProperties}
                            disabled={isLoadingMore}
                            variant="default"
                            className="cursor-pointer"
                        >
                            {isLoadingMore ? (
                                <div className="flex items-center gap-2">
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900"></div>
                                    Carregando mais...
                                </div>
                            ) : (
                                "Carregar mais empreendimentos"
                            )}
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}
