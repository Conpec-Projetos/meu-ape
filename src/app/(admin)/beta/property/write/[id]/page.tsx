"use client";

import blurImgPlaceholder from "@/assets/img_placeholder.jpg";
import { Button } from "@/components/features/buttons/default-button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/features/cards/default-card";
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/features/forms/default-form";
import { Input } from "@/components/features/inputs/default-input";
import { atualizarPropriedade, buscarPropriedadePorId } from "@/firebase/properties/service";
import { PropertyOld } from "@/interfaces/propertyOld";
import { notifyError, notifySuccess } from "@/services/notificationService";
import { zodResolver } from "@hookform/resolvers/zod";
import imageCompression from "browser-image-compression";
import { LayoutGrid, Upload, X } from "lucide-react";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";

const formSchema = z.object({
    name: z.string().min(1, {
        message: "Nome do empreendimento é obrigatório.",
    }),
    address: z.string().min(1, {
        message: "Endereço completo é obrigatório.",
    }),
    deliveryDate: z.string().min(1, {
        message: "Prazo de entrega é obrigatório.",
    }),
    launchDate: z.string().min(1, {
        message: "Data de lançamento é obrigatória.",
    }),
});

export default function EditPropertyPage() {
    const [isLoading, setIsLoading] = useState(false);
    const [isUploadingImages, setIsUploadingImages] = useState(false);
    const [selectedImages, setSelectedImages] = useState<File[]>([]);
    const [imagePreviews, setImagePreviews] = useState<string[]>([]);
    const [existingImages, setExistingImages] = useState<string[]>([]);
    const [imagesToRemove, setImagesToRemove] = useState<string[]>([]);
    const [loadingProperty, setLoadingProperty] = useState(true);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const router = useRouter();
    const params = useParams();
    const propertyId = params.id as string;

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: "",
            address: "",
            deliveryDate: "",
            launchDate: "",
        },
    });

    const loadProperty = useCallback(async () => {
        try {
            const property = await buscarPropriedadePorId(propertyId);
            if (property) {
                form.reset({
                    name: property.name || "",
                    address: property.address || "",
                    deliveryDate: property.deliveryDate
                        ? new Date(property.deliveryDate as Date).toISOString().split("T")[0]
                        : "",
                    launchDate: property.launchDate
                        ? new Date(property.launchDate as Date).toISOString().split("T")[0]
                        : "",
                });
                setExistingImages(property.propertyImages || []);
            } else {
                notifyError("Propriedade não encontrada");
            }
        } catch {
            notifyError("Erro ao carregar propriedade");
        } finally {
            setLoadingProperty(false);
        }
    }, [propertyId, form]);

    useEffect(() => {
        loadProperty();
    }, [loadProperty]);

    const handleImageSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files;
        if (files) {
            setIsUploadingImages(true);
            const fileArray = Array.from(files);

            try {
                const options = {
                    maxSizeMB: 1,
                    useWebWorker: true,
                    fileType: "image/jpeg",
                    initialQuality: 0.8,
                };

                const compressedFiles: File[] = [];
                const previews: string[] = [];

                for (const file of fileArray) {
                    try {
                        const compressedFile = await imageCompression(file, options);
                        compressedFiles.push(compressedFile);

                        const reader = new FileReader();
                        reader.onload = e => {
                            previews.push(e.target?.result as string);
                            if (previews.length === fileArray.length) {
                                setImagePreviews(prev => [...prev, ...previews]);
                            }
                        };
                        console.log(`Compressed image size: ${compressedFile.size / 1024 / 1024} MB`);
                        reader.readAsDataURL(compressedFile);
                    } catch (error) {
                        console.error("Error compressing image:", error);
                        // Using the original file if compression fails
                        console.warn("Using original file due to compression error:", file.name);
                        compressedFiles.push(file);

                        const reader = new FileReader();
                        reader.onload = e => {
                            previews.push(e.target?.result as string);
                            if (previews.length === fileArray.length) {
                                setImagePreviews(prev => [...prev, ...previews]);
                            }
                        };
                        reader.readAsDataURL(file);
                    }
                }

                setSelectedImages(prev => [...prev, ...compressedFiles]);
            } catch (error) {
                console.error("Error processing images:", error);
                notifyError("Erro ao processar imagens. Tente novamente.");
            } finally {
                setIsUploadingImages(false);
                // Clearing the file input to allow selecting the same file again
                if (fileInputRef.current) {
                    fileInputRef.current.value = "";
                }
            }
        }
    };

    const removeSelectedImage = (index: number) => {
        setSelectedImages(prev => prev.filter((_, i) => i !== index));
        setImagePreviews(prev => prev.filter((_, i) => i !== index));
    };

    const removeExistingImage = (imageUrl: string) => {
        setExistingImages(prev => prev.filter(url => url !== imageUrl));
        setImagesToRemove(prev => [...prev, imageUrl]);
    };

    async function onSubmit(values: z.infer<typeof formSchema>) {
        setIsLoading(true);
        try {
            const propertyData: Partial<PropertyOld> = {
                name: values.name,
                address: values.address,
                deliveryDate: new Date(values.deliveryDate),
                launchDate: new Date(values.launchDate),
                propertyImages: existingImages,
            };

            await atualizarPropriedade(propertyId, propertyData, selectedImages, imagesToRemove);

            notifySuccess("Propriedade atualizada com sucesso!");

            setSelectedImages([]);
            setImagePreviews([]);
            setImagesToRemove([]);
            setExistingImages([]);

            // set the selected images in the existing images
            loadProperty();
        } catch {
            notifySuccess("Erro ao atualizar propriedade. Tente novamente.");
        } finally {
            setIsLoading(false);
        }
    }

    if (loadingProperty) {
        return (
            <div className="h-screen w-screen flex items-center justify-center p-4">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
                    <p>Carregando propriedade...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="pt-15 h-screen">
            <div className="w-full flex justify-between items-center p-4 bg-white shadow-sm">
                <Button variant="outline" className="cursor-pointer" onClick={() => router.push("/beta/property")}>
                    <LayoutGrid />
                    Voltar a Lista
                </Button>
            </div>
            <div className="h-fit flex flex-col items-center justify-center py-4 px-4">
                <Card>
                    <CardHeader>
                        <CardTitle>Editar Propriedade</CardTitle>
                        <CardDescription>Edite as informações da propriedade</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                                <FormField
                                    control={form.control}
                                    name="name"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Nome do Empreendimento</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Digite o nome do empreendimento" {...field} />
                                            </FormControl>
                                            <FormDescription>Nome do empreendimento ou propriedade</FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="address"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Endereço Completo</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Digite o endereço completo" {...field} />
                                            </FormControl>
                                            <FormDescription>Endereço completo da propriedade</FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="deliveryDate"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Prazo de Entrega</FormLabel>
                                                <FormControl>
                                                    <Input type="date" {...field} />
                                                </FormControl>
                                                <FormDescription>Data prevista para entrega</FormDescription>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="launchDate"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Data de Lançamento</FormLabel>
                                                <FormControl>
                                                    <Input type="date" {...field} />
                                                </FormControl>
                                                <FormDescription>Data de lançamento do empreendimento</FormDescription>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                <div className="w-full">
                                    <div>
                                        <h1 className="text-sm font-medium">Imagens do Empreendimento</h1>
                                        <p className="text-sm text-gray-600 mt-1">
                                            Adicione fotos do empreendimento para torná-lo mais atrativo
                                        </p>
                                    </div>

                                    <div className="w-full mt-4">
                                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 w-full auto-rows-max">
                                            {existingImages.map((imageUrl, index) => (
                                                <div
                                                    key={`existing-${index}`}
                                                    className="relative w-full aspect-square"
                                                >
                                                    <Image
                                                        src={imageUrl}
                                                        alt={`Imagem ${index + 1}`}
                                                        className="w-full h-full object-cover rounded-lg border"
                                                        fill
                                                        blurDataURL={blurImgPlaceholder.src}
                                                        placeholder="blur"
                                                        unoptimized
                                                    />
                                                    <Button
                                                        type="button"
                                                        variant="destructive"
                                                        size="sm"
                                                        className="absolute top-1 right-1 h-6 w-6 p-0 cursor-pointer"
                                                        onClick={() => removeExistingImage(imageUrl)}
                                                    >
                                                        <X className="h-3 w-3" />
                                                    </Button>
                                                </div>
                                            ))}

                                            {imagePreviews.map((preview, index) => (
                                                <div key={index} className="relative w-full aspect-square">
                                                    <Image
                                                        src={preview}
                                                        alt={`Preview ${index + 1}`}
                                                        className="w-full h-full object-cover rounded-lg border"
                                                        fill
                                                    />
                                                    <Button
                                                        type="button"
                                                        variant="destructive"
                                                        size="sm"
                                                        className="absolute top-1 right-1 h-6 w-6 p-0 cursor-pointer"
                                                        onClick={() => removeSelectedImage(index)}
                                                    >
                                                        <X className="h-3 w-3" />
                                                    </Button>
                                                </div>
                                            ))}

                                            <div
                                                className="w-full aspect-square border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-gray-400 transition-colors"
                                                onClick={() => !isUploadingImages && fileInputRef.current?.click()}
                                            >
                                                {isUploadingImages ? (
                                                    <>
                                                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-400 mb-1"></div>
                                                        <span className="text-xs text-gray-600">Processando...</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <Upload className="h-6 w-6 sm:h-8 sm:w-8 text-gray-400 mb-1" />
                                                        <span className="text-xs sm:text-sm text-gray-600 text-center px-2">
                                                            Adicionar Imagem
                                                        </span>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept="image/*"
                                        multiple
                                        onChange={handleImageSelect}
                                        className="hidden"
                                    />
                                </div>

                                <Button type="submit" disabled={isLoading} className="w-full cursor-pointer">
                                    {isLoading ? (
                                        <div className="flex items-center gap-2">
                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                            Atualizando...
                                        </div>
                                    ) : (
                                        "Atualizar Propriedade"
                                    )}
                                </Button>
                            </form>
                        </Form>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
