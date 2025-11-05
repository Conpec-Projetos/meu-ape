"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Property } from "@/interfaces/property";
import { Bath, BedDouble, Car, Heart, Square } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

const mockData = {
    minPrice: 100000,
    bedrooms: [3, 5],
    minSize: 75,
    maxSize: 150,
    baths: [3, 4],
    garages: [2, 4],
};

export function PropertyCard({ property }: { property: Property }) {
    return (
        <Link href={`/properties/${property.id}`} className="block">
            <Card className="overflow-hidden shadow-md hover:shadow-xl transition-shadow duration-300 cursor-pointer">
                <div className="relative aspect-4/3">
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
                        onClick={e => {
                            e.preventDefault();
                            e.stopPropagation();
                            // TODO: implement wishlist/favorite behavior here
                        }}
                        aria-label="Favoritar"
                    >
                        <Heart className="h-5 w-5 text-primary" />
                    </Button>
                </div>
                <CardContent className="p-4">
                    <h3 className="font-bold text-lg truncate">{property.name}</h3>
                    <p className="text-sm text-muted-foreground truncate">{property.address}</p>
                    <p className="font-semibold text-xl text-primary mt-2">
                        A partir de R$ {mockData.minPrice.toLocaleString("pt-BR")}
                    </p>
                    <div className="flex items-center justify-between text-muted-foreground mt-3 text-sm border-t pt-3">
                        <div className="flex items-center gap-1">
                            <BedDouble size={16} /> {mockData.bedrooms.join("-")} dorms.
                        </div>
                        <div className="flex items-center gap-1">
                            <Square size={16} /> {mockData.minSize}-{mockData.maxSize}m²
                        </div>
                        <div className="flex items-center gap-1">
                            <Bath size={16} /> {mockData.baths.join("-")} banh.
                        </div>
                        <div className="flex items-center gap-1">
                            <Car size={16} /> {mockData.garages.join("-")} vagas
                        </div>
                    </div>
                </CardContent>
            </Card>
        </Link>
    );
}
