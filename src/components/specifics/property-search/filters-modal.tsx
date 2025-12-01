"use client";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { zodResolver } from "@hookform/resolvers/zod";
import { ListFilter } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";

const filterSchema = z.object({
    priceRange: z.array(z.number()),
    bedrooms: z.array(z.number()),
    bathrooms: z.array(z.number()),
    garages: z.array(z.number()),
});

type FilterValues = z.infer<typeof filterSchema>;

export function FiltersModal() {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const form = useForm<FilterValues>({
        resolver: zodResolver(filterSchema),
        defaultValues: {
            priceRange: [Number(searchParams.get("minPrice")) || 0, Number(searchParams.get("maxPrice")) || 2000000],
            bedrooms: searchParams.getAll("bedrooms").map(Number),
            bathrooms: searchParams.getAll("bathrooms").map(Number),
            garages: searchParams.getAll("garages").map(Number),
        },
    });

    const onSubmit = (data: FilterValues) => {
        const params = new URLSearchParams(searchParams.toString());
        params.set("minPrice", String(data.priceRange[0]));
        params.set("maxPrice", String(data.priceRange[1]));

        params.delete("bedrooms");
        data.bedrooms.forEach(b => params.append("bedrooms", String(b)));

        params.delete("bathrooms");
        data.bathrooms.forEach(b => params.append("bathrooms", String(b)));

        params.delete("garages");
        data.garages.forEach(g => params.append("garages", String(g)));

        router.push(`${pathname}?${params.toString()}`);
    };

    const numberOptions = [1, 2, 3, 4];

    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button variant="outline" className="h-12 px-4">
                    <ListFilter className="mr-2 h-5 w-5" />
                    <span className="hidden sm:inline">Filtros</span>
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Filtrar Imóveis</DialogTitle>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                        {/* Price Range */}
                        <FormField
                            control={form.control}
                            name="priceRange"
                            render={({ field }) => {
                                const fallbackRange: [number, number] = [0, 2000000];
                                const currentValue =
                                    Array.isArray(field.value) && field.value.length === 2
                                        ? field.value
                                        : fallbackRange;

                                return (
                                    <FormItem>
                                        <FormLabel>Faixa de Preço</FormLabel>
                                        <FormControl>
                                            <div>
                                                <Slider
                                                    min={0}
                                                    max={5000000}
                                                    step={50000}
                                                    value={currentValue}
                                                    onValueChange={field.onChange}
                                                />
                                                <div className="flex justify-between text-sm text-muted-foreground mt-2">
                                                    <span>R$ {currentValue[0].toLocaleString("pt-BR")}</span>
                                                    <span>R$ {currentValue[1].toLocaleString("pt-BR")}</span>
                                                </div>
                                            </div>
                                        </FormControl>
                                    </FormItem>
                                );
                            }}
                        />
                        {/* Bedrooms, Bathrooms, Garages */}
                        {(["bedrooms", "bathrooms", "garages"] as const).map(filter => (
                            <FormField
                                key={filter}
                                control={form.control}
                                name={filter}
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="capitalize">
                                            {filter === "bedrooms"
                                                ? "Quartos"
                                                : filter === "bathrooms"
                                                  ? "Banheiros"
                                                  : "Vagas"}
                                        </FormLabel>
                                        <div className="flex space-x-2">
                                            {numberOptions.map(num => (
                                                <div key={num} className="flex items-center space-x-2">
                                                    <Checkbox
                                                        id={`${filter}-${num}`}
                                                        checked={field.value?.includes(num)}
                                                        onCheckedChange={checked => {
                                                            return checked
                                                                ? field.onChange([...(field.value || []), num])
                                                                : field.onChange(
                                                                      (field.value || []).filter(v => v !== num)
                                                                  );
                                                        }}
                                                    />
                                                    <Label htmlFor={`${filter}-${num}`}>
                                                        {num}
                                                        {num === 4 ? "+" : ""}
                                                    </Label>
                                                </div>
                                            ))}
                                        </div>
                                    </FormItem>
                                )}
                            />
                        ))}
                        <Button type="submit" className="w-full">
                            Aplicar Filtros
                        </Button>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
