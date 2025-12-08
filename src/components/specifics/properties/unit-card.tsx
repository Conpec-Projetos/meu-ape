"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import NextJsImage from "@/components/ui/lightbox-image";
import { Unit } from "@/interfaces/unit";
import { Bath, Bed, BedDouble, Building2, Car, Images, LayoutTemplate, Square } from "lucide-react";
import { useState } from "react";
import Lightbox from "yet-another-react-lightbox";
import Counter from "yet-another-react-lightbox/plugins/counter";
import "yet-another-react-lightbox/plugins/counter.css";
import Thumbnails from "yet-another-react-lightbox/plugins/thumbnails";
import "yet-another-react-lightbox/plugins/thumbnails.css";
import Zoom from "yet-another-react-lightbox/plugins/zoom";
import "yet-another-react-lightbox/styles.css";

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
    const floorLabel = typeof unit.floor === "number" ? `${unit.floor}º Andar` : "Andar nao informado";
    const [showImagesGallery, setShowImagesGallery] = useState(false);
    const [showFloorPlanGallery, setShowFloorPlanGallery] = useState(false);
    const hasUnitImages = Array.isArray(unit.images) && unit.images.length > 0;
    const hasFloorPlans = Array.isArray(unit.floorPlanUrls) && unit.floorPlanUrls.length > 0;
    const imageSlides = hasUnitImages ? unit.images.map(src => ({ src })) : [];
    const floorPlanSlides = hasFloorPlans && unit.floorPlanUrls ? unit.floorPlanUrls.map(src => ({ src })) : [];

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
                    <Building2 className="h-5 w-5 text-primary/80" />
                    <span className="font-medium">{floorLabel}</span>
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
            <Lightbox
                open={showImagesGallery}
                close={() => setShowImagesGallery(false)}
                slides={imageSlides}
                render={{ slide: NextJsImage }}
                plugins={[Zoom, Thumbnails, Counter]}
                zoom={{ maxZoomPixelRatio: 3, zoomInMultiplier: 2, doubleTapDelay: 300 }}
                thumbnails={{
                    position: "bottom",
                    width: 120,
                    height: 80,
                    border: 2,
                    borderRadius: 4,
                    padding: 4,
                    gap: 16,
                }}
                styles={{ container: { backgroundColor: "rgba(0, 0, 0, .9)" } }}
            />
            <Lightbox
                open={showFloorPlanGallery}
                close={() => setShowFloorPlanGallery(false)}
                slides={floorPlanSlides}
                render={{ slide: NextJsImage }}
                plugins={[Zoom, Thumbnails, Counter]}
                zoom={{ maxZoomPixelRatio: 3, zoomInMultiplier: 2, doubleTapDelay: 300 }}
                thumbnails={{
                    position: "bottom",
                    width: 120,
                    height: 80,
                    border: 2,
                    borderRadius: 4,
                    padding: 4,
                    gap: 16,
                }}
                styles={{ container: { backgroundColor: "rgba(0, 0, 0, .9)" } }}
            />
        </Card>
    );
}
