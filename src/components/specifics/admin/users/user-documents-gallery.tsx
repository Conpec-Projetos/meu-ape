"use client";

import { Button } from "@/components/ui/button";
import NextJsImage from "@/components/ui/lightbox-image";
import { cn } from "@/lib/utils";
import { Download, Expand, ExternalLink } from "lucide-react";
import Image from "next/image";
import { useMemo, useState } from "react";
import Lightbox from "yet-another-react-lightbox";
import Counter from "yet-another-react-lightbox/plugins/counter";
import "yet-another-react-lightbox/plugins/counter.css";
import Thumbnails from "yet-another-react-lightbox/plugins/thumbnails";
import "yet-another-react-lightbox/plugins/thumbnails.css";
import Zoom from "yet-another-react-lightbox/plugins/zoom";
import "yet-another-react-lightbox/styles.css";

type DocSection = { title: string; items: string[] };

interface UserDocumentsGalleryProps {
    sections: DocSection[];
}

export function UserDocumentsGallery({ sections }: UserDocumentsGalleryProps) {
    const [index, setIndex] = useState(-1);

    const slides = useMemo(() => sections.flatMap(section => section.items.map(src => ({ src }))), [sections]);

    if (!slides.length) return null;

    let runningOffset = 0;
    const sectionsWithOffset = sections.map(section => {
        const start = runningOffset;
        runningOffset += section.items.length;
        return { ...section, start };
    });

    return (
        <div className="space-y-3">
            <h3 className="text-base font-semibold">Documentos</h3>
            {sectionsWithOffset.map(({ title, items, start }) =>
                items.length ? (
                    <div key={title} className="space-y-2">
                        <h4 className="text-sm font-medium text-muted-foreground">{title}</h4>
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                            {items.map((src, idx) => {
                                const flatIndex = start + idx;
                                return (
                                    <div key={`${title}-${idx}`} className="space-y-1">
                                        <button
                                            type="button"
                                            className={cn(
                                                "group relative block w-full overflow-hidden rounded border bg-muted/30",
                                                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                            )}
                                            onClick={() => setIndex(flatIndex)}
                                        >
                                            <div className="relative h-28 sm:h-32 md:h-36 w-full">
                                                <Image
                                                    src={src}
                                                    alt={`${title} ${idx + 1}`}
                                                    fill
                                                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                                                    className="object-cover transition-transform duration-200"
                                                    unoptimized
                                                />
                                            </div>
                                            <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/20 transition-colors">
                                                <div className="bg-black/60 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <Expand className="h-4 w-4" />
                                                </div>
                                            </div>
                                        </button>
                                        <div className="flex items-center gap-2">
                                            <Button variant="outline" size="icon" className="cursor-pointer" asChild>
                                                <a href={src} download onClick={e => e.stopPropagation()}>
                                                    <Download className="h-4 w-4" />
                                                </a>
                                            </Button>
                                            <Button variant="outline" size="icon" className="cursor-pointer" asChild>
                                                <a
                                                    href={src}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    onClick={e => e.stopPropagation()}
                                                >
                                                    <ExternalLink className="h-4 w-4" />
                                                </a>
                                            </Button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ) : null
            )}
            <Lightbox
                open={index >= 0}
                index={index}
                close={() => setIndex(-1)}
                slides={slides}
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
        </div>
    );
}
