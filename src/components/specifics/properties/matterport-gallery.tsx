"use client";

import { useState } from "react";
import { EmbeddedMatterportViewer } from "./embedded-matterport-viewer";

interface MatterportGalleryProps {
    urls: string[];
}

export function MatterportGallery({ urls }: MatterportGalleryProps) {
    const safeUrls = Array.isArray(urls) ? urls.filter(Boolean) : [];
    const [activeIndex, setActiveIndex] = useState(0);

    if (safeUrls.length === 0) return null;

    return (
        <div className="w-full space-y-3">
            <EmbeddedMatterportViewer url={safeUrls[activeIndex]} />
            {safeUrls.length > 1 && (
                <div className="flex gap-2 overflow-x-auto no-scrollbar py-1">
                    {safeUrls.map((u, i) => (
                        <button
                            key={`${u}-${i}`}
                            onClick={() => setActiveIndex(i)}
                            className={`cursor-pointer min-w-20 h-8 px-3 rounded-md border text-xs font-medium whitespace-nowrap transition-colors ${
                                i === activeIndex
                                    ? "bg-primary text-primary-foreground border-primary"
                                    : "bg-secondary/40 hover:bg-secondary"
                            }`}
                            aria-label={`Selecionar Tour ${i + 1}`}
                        >
                            Tour {i + 1}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
