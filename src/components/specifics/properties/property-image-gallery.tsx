"use client";

import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { cn } from "@/lib/utils";
import Image from "next/image";

interface PropertyImageGalleryProps {
    images: string[];
    propertyName: string;
    fit?: "cover" | "contain";
}

export function PropertyImageGallery({ images, propertyName, fit = "cover" }: PropertyImageGalleryProps) {
    if (!images || images.length === 0) {
        return (
            <div className="flex items-center justify-center w-full h-96 bg-muted rounded-lg">
                <p className="text-muted-foreground">Nenhuma imagem disponível</p>
            </div>
        );
    }

    return (
        <Carousel className="w-full">
            <CarouselContent>
                {images.map((src, index) => (
                    <CarouselItem key={index}>
                        <div className="overflow-hidden rounded-lg">
                            <div
                                className={cn(
                                    "relative flex aspect-[2.4/1] items-center justify-center overflow-hidden",
                                    fit === "contain" ? "" : ""
                                )}
                            >
                                <Image
                                    src={src}
                                    alt={`${propertyName} - Image ${index + 1}`}
                                    fill
                                    sizes="100vw"
                                    className={cn(
                                        "transition-transform duration-500",
                                        fit === "contain" ? "object-contain" : "object-cover"
                                    )}
                                />
                            </div>
                        </div>
                    </CarouselItem>
                ))}
            </CarouselContent>
            <CarouselPrevious className="absolute left-2 top-1/2 -translate-y-1/2 z-10 bg-black/50 text-white hover:bg-black/70 border-none cursor-pointer" />
            <CarouselNext className="absolute right-2 top-1/2 -translate-y-1/2 z-10 bg-black/50 text-white hover:bg-black/70 border-none cursor-pointer" />
        </Carousel>
    );
}
