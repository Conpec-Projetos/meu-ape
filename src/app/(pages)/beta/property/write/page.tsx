"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { useState } from "react";
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

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);

    try {
      const propertyData = {
        ...values,
        dataLancamento: new Date(values.dataLancamento),
      };
      await criarPropriedade(propertyData);
      toast.success("Empreendimento cadastrado com sucesso! 🎉");
      form.reset();
    } catch {
      toast.error("Erro ao cadastrar empreendimento. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="h-screen w-screen">
      <div className="w-full flex justify-between items-center p-4 bg-white shadow-sm">
        <Button variant="outline" onClick={() => router.push("/")}>
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
                  name="prazoEntrega"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Prazo de Entrega</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: Dezembro 2025" {...field} />
                      </FormControl>
                      <FormDescription>
                        Prazo estimado para entrega do empreendimento
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

                <Button type="submit" className="w-full" disabled={isLoading}>
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
