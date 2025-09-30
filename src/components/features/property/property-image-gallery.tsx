
"use client";

import Image from "next/image";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

interface PropertyImageGalleryProps {
  images: string[];
  propertyName: string;
}

export function PropertyImageGallery({
  images,
  propertyName,
}: PropertyImageGalleryProps) {
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
              <div className="relative flex aspect-[2.4/1] items-center justify-center overflow-hidden">
                  <Image
                    src={src}
                    alt={`${propertyName} - Image ${index + 1}`}
                    layout="fill"
                    objectFit="cover"
                  />
              </div>
            </div>
          </CarouselItem>
        ))}
      </CarouselContent>
      <CarouselPrevious className="absolute left-2 top-1/2 -translate-y-1/2 z-10 bg-black/50 text-white hover:bg-black/70 border-none" />
      <CarouselNext className="absolute right-2 top-1/2 -translate-y-1/2 z-10 bg-black/50 text-white hover:bg-black/70 border-none" />
    </Carousel>
  );
}
