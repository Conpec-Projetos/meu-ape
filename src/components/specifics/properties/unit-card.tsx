"use client";

import { PropertyImageGallery } from "@/components/specifics/properties/property-image-gallery";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Unit } from "@/interfaces/unit";
import { Bath, Bed, BedDouble, Car, Images, LayoutTemplate, Square } from "lucide-react";
import { useState } from "react";

interface UnitCardProps {
    unit: Unit;
    handleGuardedAction: (actionType: "REQUEST_VISIT" | "REQUEST_RESERVATION", unit: Unit) => void;
}

export function UnitCard({ unit, handleGuardedAction }: UnitCardProps) {
    const suitesLabel =
        typeof unit.suites === "number"
            ? `${unit.suites} Suite${unit.suites === 1 ? "" : "s"}`
            : "Suites nao informadas";
    const sizeLabel = typeof unit.size_sqm === "number" ? `${unit.size_sqm} m²` : "Tamanho nao informado";
    const bedroomsLabel =
        typeof unit.bedrooms === "number"
            ? `${unit.bedrooms} Dorm${unit.bedrooms === 1 ? "" : "s"}`
            : "Dormitorios nao informados";
    const bathsLabel =
        typeof unit.baths === "number"
            ? `${unit.baths} Banheiro${unit.baths === 1 ? "" : "s"}`
            : "Banheiros nao informados";
    const garagesLabel =
        typeof unit.garages === "number"
            ? `${unit.garages} Vaga${unit.garages === 1 ? "" : "s"}`
            : "Vagas nao informadas";
    const [showImagesGallery, setShowImagesGallery] = useState(false);
    const [showFloorPlanGallery, setShowFloorPlanGallery] = useState(false);
    const hasUnitImages = Array.isArray(unit.images) && unit.images.length > 0;
    const hasFloorPlans = Array.isArray(unit.floorPlanUrls) && unit.floorPlanUrls.length > 0;

    return (
        <Card className="w-full shadow-md hover:shadow-lg transition-shadow border border-border/40 rounded-xl overflow-hidden">
            <CardHeader className="bg-secondary/30 p-4 border-b border-border/40">
                <CardTitle className="text-xl font-bold text-primary">Unidade {unit.identifier}</CardTitle>
            </CardHeader>
            <CardContent className="p-4 grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
                <div className="flex items-center gap-2">
                    <Square className="h-5 w-5 text-primary/80" />
                    <span className="font-medium">{sizeLabel}</span>
                </div>
                <div className="flex items-center gap-2">
                    <Bed className="h-5 w-5 text-primary/80" />
                    <span className="font-medium">{bedroomsLabel}</span>
                </div>
                <div className="flex items-center gap-2">
                    <BedDouble className="h-5 w-5 text-primary/80" />
                    <span className="font-medium">{suitesLabel}</span>
                </div>
                <div className="flex items-center gap-2">
                    <Bath className="h-5 w-5 text-primary/80" />
                    <span className="font-medium">{bathsLabel}</span>
                </div>
                <div className="flex items-center gap-2">
                    <Car className="h-5 w-5 text-primary/80" />
                    <span className="font-medium">{garagesLabel}</span>
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
                        <Button
                            variant="outline"
                            size="sm"
                            className="cursor-pointer flex-1"
                            onClick={() => handleGuardedAction("REQUEST_VISIT", unit)}
                        >
                            Agendar Visita
                        </Button>
                        <Button
                            size="sm"
                            className="cursor-pointer flex-1"
                            onClick={() => handleGuardedAction("REQUEST_RESERVATION", unit)}
                        >
                            Solicitar Reserva
                        </Button>
                    </div>
                </div>
                <div className="w-full flex flex-col sm:flex-row gap-2">
                    <Button
                        variant="secondary"
                        size="sm"
                        className="flex-1 cursor-pointer"
                        onClick={() => setShowImagesGallery(true)}
                        disabled={!hasUnitImages}
                    >
                        <Images className="h-4 w-4 mr-1" /> Fotos da unidade
                    </Button>
                    <Button
                        variant="secondary"
                        size="sm"
                        className="flex-1 cursor-pointer"
                        onClick={() => setShowFloorPlanGallery(true)}
                        disabled={!hasFloorPlans}
                    >
                        <LayoutTemplate className="h-4 w-4 mr-1" /> Plantas da unidade
                    </Button>
                </div>
            </CardFooter>
            <Dialog open={showImagesGallery} onOpenChange={setShowImagesGallery}>
                <DialogContent className="w-full max-w-5xl lg:max-w-6xl max-h-[90vh] overflow-y-auto" showCloseButton>
                    <DialogHeader>
                        <DialogTitle>Fotos da Unidade {unit.identifier}</DialogTitle>
                    </DialogHeader>
                    {hasUnitImages ? (
                        <PropertyImageGallery
                            images={unit.images || []}
                            propertyName={`Unidade ${unit.identifier}`}
                            fit="contain"
                        />
                    ) : (
                        <p className="text-muted-foreground text-sm">Nenhuma foto cadastrada.</p>
                    )}
                </DialogContent>
            </Dialog>
            <Dialog open={showFloorPlanGallery} onOpenChange={setShowFloorPlanGallery}>
                <DialogContent className="w-full max-w-5xl lg:max-w-6xl max-h-[90vh] overflow-y-auto" showCloseButton>
                    <DialogHeader>
                        <DialogTitle>Plantas da Unidade {unit.identifier}</DialogTitle>
                    </DialogHeader>
                    {hasFloorPlans ? (
                        <PropertyImageGallery
                            images={unit.floorPlanUrls || []}
                            propertyName={`Plantas da Unidade ${unit.identifier}`}
                            fit="contain"
                        />
                    ) : (
                        <p className="text-muted-foreground text-sm">Nenhuma planta cadastrada.</p>
                    )}
                </DialogContent>
            </Dialog>
        </Card>
    );
}
