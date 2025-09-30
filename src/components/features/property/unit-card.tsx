
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Bed, Bath, Car, Square } from "lucide-react";
import { Unit } from "@/interfaces/unit";

interface UnitCardProps {
  unit: Unit;
  onViewMatterport: (url: string) => void;
}

export function UnitCard({ unit, onViewMatterport }: UnitCardProps) {
  return (
    <Card className="w-full shadow-md hover:shadow-lg transition-shadow border border-border/40 rounded-xl overflow-hidden">
      <CardHeader className="bg-secondary/30 p-4 border-b border-border/40">
        <CardTitle className="text-xl font-bold text-primary">Unidade {unit.identifier}</CardTitle>
      </CardHeader>
      <CardContent className="p-4 grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
        <div className="flex items-center gap-2">
          <Square className="h-5 w-5 text-primary/80" />
          <span className="font-medium">{unit.size} m²</span>
        </div>
        <div className="flex items-center gap-2">
          <Bed className="h-5 w-5 text-primary/80" />
          <span className="font-medium">{unit.bedrooms} Dorms.</span>
        </div>
        <div className="flex items-center gap-2">
          <Bath className="h-5 w-5 text-primary/80" />
          <span className="font-medium">{unit.baths} Banheiros</span>
        </div>
        <div className="flex items-center gap-2">
          <Car className="h-5 w-5 text-primary/80" />
          <span className="font-medium">{unit.garages} Vagas</span>
        </div>
      </CardContent>
      <CardFooter className="bg-secondary/30 p-4 flex flex-col items-start gap-4">
        <div className="w-full flex flex-col sm:flex-row justify-between items-center gap-3">
            <p className="text-2xl font-extrabold text-primary">
            {new Intl.NumberFormat("pt-BR", {
                style: "currency",
                currency: "BRL",
                minimumFractionDigits: 0,
            }).format(unit.price)}
            </p>
            <div className="flex gap-2 w-full sm:w-auto flex-wrap justify-end">
                {unit.matterportUrl && (
                <Button 
                    variant="outline" 
                    size="sm"
                    className="flex-1"
                    onClick={() => onViewMatterport(unit.matterportUrl!)}
                >
                    Tour 3D
                </Button>
                )}
                <Button variant="outline" size="sm" className="flex-1">Agendar Visita</Button>
                <Button size="sm" className="flex-1">Solicitar Reserva</Button>
            </div>
        </div>
      </CardFooter>
    </Card>
  );
}
