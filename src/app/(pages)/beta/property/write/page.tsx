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
import { Upload, X } from "lucide-react";

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

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      const fileArray = Array.from(files);
      setSelectedImages(prev => [...prev, ...fileArray]);
      
      fileArray.forEach(file => {
        const reader = new FileReader();
        reader.onload = (e) => {
          setImagePreviews(prev => [...prev, e.target?.result as string]);
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const removeImage = (index: number) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);

    try {
      const propertyData = {
        ...values,
        dataLancamento: new Date(values.dataLancamento),
        prazoEntrega: new Date(values.prazoEntrega),
      };
      await criarPropriedade(propertyData, selectedImages);
      toast.success("Empreendimento cadastrado com sucesso! 🎉");
      form.reset();
      setSelectedImages([]);
      setImagePreviews([]);
    } catch {
      toast.error("Erro ao cadastrar empreendimento. Tente novamente.");
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
          onClick={() => router.push("/")}
        >
          Voltar ao Início
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
                    <h1 className="text-sm font-medium">Imagens do Empreendimento</h1>
                    <p className="text-sm text-gray-600 mt-1">
                      Adicione fotos do empreendimento para torná-lo mais atrativo
                    </p>
                  </div>
                  
                  <div className="w-full mt-4">
                    <div
                      className="grid grid-cols-2 sm:grid-cols-3 gap-4 w-full"
                    >
                      {imagePreviews.map((preview, index) => (
                        <div key={index} className="relative w-full max-w-[128px]">
                          <img
                            src={preview}
                            alt={`Preview ${index + 1}`}
                            className="w-full h-24 sm:h-32 lg:h-40 object-cover rounded-lg border"
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
                        className="w-full max-w-[128px] h-24 sm:h-32 lg:h-40 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-gray-400 transition-colors"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <Upload className="h-6 w-6 sm:h-8 sm:w-8 lg:h-10 lg:w-10 text-gray-400 mb-1" />
                        <span className="text-xs sm:text-sm text-gray-600 text-center px-2">
                          Adicionar Imagem
                        </span>
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
                  disabled={isLoading}
                >
                  {isLoading ? "Salvando..." : "Cadastrar Empreendimento"}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
