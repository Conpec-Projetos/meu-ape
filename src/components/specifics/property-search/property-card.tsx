"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useFavorites } from "@/hooks/use-favorites";
import { Property } from "@/interfaces/property";
import { cn } from "@/lib/utils";
import { Bath, BedDouble, Calendar, Car, Heart, Square } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

const truncate = (value: number) => Math.trunc(value);

const formatCurrency = (value?: number | null) => {
    if (typeof value !== "number") return null;
    const truncated = truncate(value);
    return new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
        minimumFractionDigits: 0,
    }).format(truncated);
};

const formatNumber = (value: number) => new Intl.NumberFormat("pt-BR").format(truncate(value));

const formatArrayRange = (values?: number[]) => {
    if (!values || values.length === 0) return null;
    const unique = Array.from(new Set(values.map(num => truncate(num)))).sort((a, b) => a - b);
    const min = unique[0];
    const max = unique[unique.length - 1];
    return min === max ? `${min}` : `${min}-${max}`;
};

const formatSizeRange = (min?: number | null, max?: number | null) => {
    if (min == null && max == null) return null;
    const lowerValue = truncate((min ?? max) as number);
    const upperValue = truncate((max ?? min) as number);
    const formattedLower = formatNumber(lowerValue);
    const formattedUpper = formatNumber(upperValue);
    const range = lowerValue === upperValue ? formattedLower : `${formattedLower} - ${formattedUpper}`;
    return `${range} m²`;
};

const formatDeliveryDate = (value?: Date | string | null) => {
    if (!value) return null;
    const parsedDate = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(parsedDate.getTime())) return null;
    return new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric" }).format(parsedDate);
};

export function PropertyCard({ property }: { property: Property }) {
    const { toggleFavorite, isFavorited, isLoading } = useFavorites();
    const stats = property.searchableUnitFeats;
    const priceLabel = formatCurrency(stats?.minPrice);
    const sizeLabel = formatSizeRange(stats?.minSize, stats?.maxSize);
    const bedroomsLabel = formatArrayRange(stats?.bedrooms);
    const bathsLabel = formatArrayRange(stats?.baths);
    const garagesLabel = formatArrayRange(stats?.garages);
    const deliveryDate = property.deliveryDate ? new Date(property.deliveryDate) : null;
    const deliveryDateLabel = formatDeliveryDate(deliveryDate);
    const isUnderConstruction = deliveryDate ? deliveryDate.getTime() > Date.now() : false;

    return (
        <Link href={`/properties/${property.id}`} className="block h-full">
            <Card className="overflow-hidden shadow-md hover:shadow-xl transition-shadow duration-300 cursor-pointer h-full flex flex-col border-0">
                <div className="relative w-full h-48 sm:h-60 rounded-t-xl overflow-hidden">
                    <Image
                        src={property.propertyImages?.[0] || "/placeholder.png"}
                        alt={property.name}
                        fill
                        className="object-cover"
                    />
                    <Button
                        variant="ghost"
                        size="icon"
                        className="absolute top-2 right-2 bg-white/70 hover:bg-white rounded-full cursor-pointer"
                        onClick={e => {
                            e.preventDefault();
                            e.stopPropagation();
                            toggleFavorite(property.id || "");
                        }}
                        disabled={isLoading}
                        aria-label={
                            isFavorited(property.id || "") ? "Remover dos favoritos" : "Adicionar aos favoritos"
                        }
                    >
                        <Heart className={cn(isFavorited(property.id || "") ? "fill-primary" : "")} />
                    </Button>
                </div>
                <CardContent className="p-4 flex flex-col flex-1">
                    <h3 className="font-bold text-lg truncate">{property.name}</h3>
                    <p className="text-sm text-muted-foreground truncate">{property.address}</p>
                    <p className="font-semibold text-xl text-primary mt-2">
                        {priceLabel ? `A partir de ${priceLabel}` : "Consulte valores"}
                    </p>
                    {deliveryDateLabel && (
                        <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground mt-2">
                            <span className="inline-flex items-center gap-1">
                                <Calendar size={16} /> Entrega: {deliveryDateLabel}
                            </span>
                            {isUnderConstruction && (
                                <span className="inline-flex items-center rounded-full bg-amber-100 text-amber-900 px-2 py-0.5 text-xs font-semibold">
                                    Em construção
                                </span>
                            )}
                        </div>
                    )}
                    <div className="grid grid-cols-2 sm:flex sm:flex-wrap sm:items-center sm:justify-between text-muted-foreground mt-3 text-sm border-t pt-3 gap-3">
                        <div className="flex items-center gap-1">
                            <Square size={16} /> {sizeLabel ?? "Tamanho indisp."}
                        </div>
                        <div className="flex items-center gap-1">
                            <BedDouble size={16} /> {bedroomsLabel ? `${bedroomsLabel} dorms.` : "Dados indisponiveis"}
                        </div>
                        <div className="flex items-center gap-1">
                            <Bath size={16} /> {bathsLabel ? `${bathsLabel} banh.` : "Banh. indisp."}
                        </div>
                        <div className="flex items-center gap-1">
                            <Car size={16} /> {garagesLabel ? `${garagesLabel} vagas` : "Vagas indisp."}
                        </div>
                    </div>
                </CardContent>
            </Card>
        </Link>
    );
}
