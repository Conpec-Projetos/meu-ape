"use client";

import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import NextJsImage from "@/components/ui/lightbox-image";
import { cn } from "@/lib/utils";
import { Expand } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import Lightbox from "yet-another-react-lightbox";
import Counter from "yet-another-react-lightbox/plugins/counter";
import "yet-another-react-lightbox/plugins/counter.css";
import Thumbnails from "yet-another-react-lightbox/plugins/thumbnails";
import "yet-another-react-lightbox/plugins/thumbnails.css";
import Zoom from "yet-another-react-lightbox/plugins/zoom";
import "yet-another-react-lightbox/styles.css";

interface PropertyImageGalleryProps {
    images: string[];
    propertyName: string;
    fit?: "cover" | "contain";
}

export function PropertyImageGallery({ images, propertyName, fit = "cover" }: PropertyImageGalleryProps) {
    const [index, setIndex] = useState(-1);

    if (!images || images.length === 0) {
        return (
            <div className="flex items-center justify-center w-full h-96 bg-muted rounded-lg">
                <p className="text-muted-foreground">Nenhuma imagem disponível</p>
            </div>
        );
    }

    // Formata os slides para o Lightbox
    const slides = images.map(src => ({ src, isAsset: true }));

    return (
        <>
            <Carousel className="w-full group">
                <CarouselContent>
                    {images.map((src, idx) => (
                        <CarouselItem key={idx}>
                            <div
                                className="overflow-hidden rounded-lg cursor-pointer relative"
                                onClick={() => setIndex(idx)}
                            >
                                {/* Ajuste de Aspect Ratio para Mobile: aspect-video no mobile, aspect original no desktop */}
                                <div
                                    className={cn(
                                        "relative flex aspect-video md:aspect-[2.4/1] items-center justify-center overflow-hidden",
                                        fit === "contain" ? "bg-black/5" : ""
                                    )}
                                >
                                    <Image
                                        src={src}
                                        alt={`${propertyName} - Image ${idx + 1}`}
                                        fill
                                        sizes="100vw"
                                        className={cn(
                                            "transition-transform duration-500 hover:scale-105",
                                            fit === "contain" ? "object-contain" : "object-cover"
                                        )}
                                        priority={idx === 0}
                                    />

                                    {/* Overlay indicando que é clicável para ampliar */}
                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                                        <div className="bg-black/50 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Expand className="w-6 h-6" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </CarouselItem>
                    ))}
                </CarouselContent>
                {images.length > 1 && (
                    <>
                        <CarouselPrevious className="absolute left-2 top-1/2 -translate-y-1/2 z-10 bg-black/50 text-white hover:bg-black/70 border-none cursor-pointer h-8 w-8 sm:h-10 sm:w-10" />
                        <CarouselNext className="absolute right-2 top-1/2 -translate-y-1/2 z-10 bg-black/50 text-white hover:bg-black/70 border-none cursor-pointer h-8 w-8 sm:h-10 sm:w-10" />
                    </>
                )}
            </Carousel>

            {/* Componente Lightbox Fullscreen */}
            <Lightbox
                open={index >= 0}
                index={index}
                close={() => setIndex(-1)}
                slides={slides}
                render={{ slide: NextJsImage }}
                plugins={[Zoom, Thumbnails, Counter]}
                zoom={{
                    maxZoomPixelRatio: 3,
                    zoomInMultiplier: 2,
                    doubleTapDelay: 300,
                }}
                thumbnails={{
                    position: "bottom",
                    width: 120,
                    height: 80,
                    border: 2,
                    borderRadius: 4,
                    padding: 4,
                    gap: 16,
                }}
                styles={{
                    container: { backgroundColor: "rgba(0, 0, 0, .9)" },
                }}
            />
        </>
    );
}
