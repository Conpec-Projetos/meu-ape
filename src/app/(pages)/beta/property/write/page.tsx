"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { criarPropriedade } from "@/firebase/properties/service";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { LayoutGrid, Upload, X } from "lucide-react";
import Image from "next/image";
import imageCompression from 'browser-image-compression';

const formSchema = z.object({
  nomeEmpreendimento: z.string().min(1, {
    message: "Nome do empreendimento é obrigatório.",
  }),
  enderecoCompleto: z.string().min(1, {
    message: "Endereço completo é obrigatório.",
  }),
  prazoEntrega: z.string().min(1, {
    message: "Prazo de entrega é obrigatório.",
  }),
  dataLancamento: z.string().min(1, {
    message: "Data de lançamento é obrigatória.",
  }),
});

export default function PropertyPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [isUploadingImages, setIsUploadingImages] = useState(false);
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const router = useRouter();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nomeEmpreendimento: "",
      enderecoCompleto: "",
      prazoEntrega: "",
      dataLancamento: "",
    },
  });

  const handleImageSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      setIsUploadingImages(true);
      const fileArray = Array.from(files);
      
      try {
        const options = {
          maxSizeMB: 1,
          useWebWorker: true,
          fileType: 'image/jpeg',
          initialQuality: 0.8,
        };

        const compressedFiles: File[] = [];
        const previews: string[] = [];

        for (const file of fileArray) {
          try {
            const compressedFile = await imageCompression(file, options);
            compressedFiles.push(compressedFile);

            const reader = new FileReader();
            reader.onload = (e) => {
              previews.push(e.target?.result as string);
              if (previews.length === fileArray.length) {
                setImagePreviews(prev => [...prev, ...previews]);
              }
            };
            console.log(`Compressed image size: ${compressedFile.size / 1024 / 1024} MB`);
            reader.readAsDataURL(compressedFile);
          } catch (error) {
            console.error('Error compressing image:', error);
            // Using the original file if compression fails
            console.warn('Using original file due to compression error:', file.name);
            compressedFiles.push(file);
            
            const reader = new FileReader();
            reader.onload = (e) => {
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
        console.error('Error processing images:', error);
        toast.error('Erro ao processar imagens. Tente novamente.');
      } finally {
        setIsUploadingImages(false);
      }
    }
  };

  const removeImage = (index: number) => {
    setSelectedImages((prev) => prev.filter((_, i) => i !== index));
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);

    try {
      const propertyData = {
        ...values,
        dataLancamento: new Date(values.dataLancamento),
        prazoEntrega: new Date(values.prazoEntrega),
      };

      if (selectedImages.length > 0) {
        toast.loading(`Carregando empreendimento e ${selectedImages.length} imagem(ns)...`, {
          id: 'upload-progress'
        });
      } else {
        toast.loading('Salvando empreendimento...', {
          id: 'upload-progress'
        });
      }

      await criarPropriedade(propertyData, selectedImages);
      
      toast.dismiss('upload-progress');
      toast.success("Empreendimento cadastrado com sucesso! 🎉");
      
      form.reset();
      setSelectedImages([]);
      setImagePreviews([]);
    } catch {
      toast.dismiss('upload-progress');
      toast.error("Erro ao cadastrar empreendimento. Verifique sua conexão e tente novamente.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="h-screen">
      <div className="w-full flex justify-between items-center p-4 bg-white shadow-sm">
        <Button
          variant="outline"
          className="cursor-pointer"
          onClick={() => router.push("/beta/property")}
        >
          <LayoutGrid />Voltar a Lista
        </Button>
      </div>
      <div className="h-fit flex flex-col items-center justify-center py-4 px-4">
        <Card>
          <CardHeader>
            <CardTitle>Cadastrar Novo Empreendimento</CardTitle>
            <CardDescription>
              Preencha as informações do novo empreendimento para adicionar ao
              seu catálogo.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-6"
              >
                <FormField
                  control={form.control}
                  name="nomeEmpreendimento"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome do Empreendimento</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Ex: Residencial Jardim das Flores"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Digite o nome completo do empreendimento
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="enderecoCompleto"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Endereço Completo</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Ex: Rua das Palmeiras, 123, Bairro Centro, São Paulo - SP"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Endereço completo incluindo rua, número, bairro, cidade
                        e estado
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="dataLancamento"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Data de Lançamento</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormDescription>
                        Data de início da construção do empreendimento
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="prazoEntrega"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Prazo de Entrega</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormDescription>
                        Prazo estimado para entrega do empreendimento
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="w-full">
                  <div>
                    <h1 className="text-sm font-medium">
                      Imagens do Empreendimento
                    </h1>
                    <p className="text-sm text-gray-600 mt-1">
                      Adicione fotos do empreendimento para torná-lo mais
                      atrativo
                    </p>
                  </div>

                  <div className="w-full mt-4">
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 w-full auto-rows-max">
                      {imagePreviews.map((preview, index) => (
                        <div
                          key={index}
                          className="relative w-full aspect-square"
                        >
                          <Image
                            src={preview}
                            alt={`Preview ${index + 1}`}
                            className="w-full h-full object-cover rounded-lg border"
                            fill
                            unoptimized
                          />
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            className="absolute top-1 right-1 h-6 w-6 p-0 cursor-pointer"
                            onClick={() => removeImage(index)}
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

                <Button
                  type="submit"
                  className="w-full cursor-pointer"
                  disabled={isLoading || isUploadingImages}
                >
                  {isLoading 
                    ? selectedImages.length > 0 
                      ? `Salvando com ${selectedImages.length} imagem(ns)...` 
                      : "Salvando..." 
                    : "Cadastrar Empreendimento"
                  }
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
