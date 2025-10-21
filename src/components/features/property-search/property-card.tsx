"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Property } from "@/interfaces/property";
import { Bath, BedDouble, Car, Heart, Square } from "lucide-react";
import Image from "next/image";

export function PropertyCard({ property }: { property: Property }) {
    return (
        <Card className="overflow-hidden shadow-md hover:shadow-xl transition-shadow duration-300 cursor-pointer">
            <div className="relative aspect-[4/3]">
                <Image
                    src={property.propertyImages?.[0] || "/placeholder.png"}
                    alt={property.name}
                    fill
                    className="object-cover"
                />
                <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-2 right-2 bg-white/70 hover:bg-white rounded-full"
                >
                    <Heart className="h-5 w-5 text-primary" />
                </Button>
            </div>
            <CardContent className="p-4">
                <h3 className="font-bold text-lg truncate">{property.name}</h3>
                <p className="text-sm text-muted-foreground truncate">{property.address}</p>
                <p className="font-semibold text-xl text-primary mt-2">
                    A partir de R$ {property.searchableUnitFeats.minPrice.toLocaleString("pt-BR")}
                </p>
                <div className="flex items-center justify-between text-muted-foreground mt-3 text-sm border-t pt-3">
                    <div className="flex items-center gap-1">
                        <BedDouble size={16} /> {property.searchableUnitFeats.bedrooms.join("-")} dorms.
                    </div>
                    <div className="flex items-center gap-1">
                        <Square size={16} /> {property.searchableUnitFeats.minSize}-
                        {property.searchableUnitFeats.maxSize}m²
                    </div>
                    <div className="flex items-center gap-1">
                        <Bath size={16} /> {property.searchableUnitFeats.baths.join("-")} banh.
                    </div>
                    <div className="flex items-center gap-1">
                        <Car size={16} /> {property.searchableUnitFeats.garages.join("-")} vagas
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}