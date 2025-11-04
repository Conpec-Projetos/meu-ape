"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { useEffect, useRef, useState } from "react";
import { useInView } from "react-intersection-observer";

interface EmbeddedMatterportViewerProps {
    url: string;
}

export function EmbeddedMatterportViewer({ url }: EmbeddedMatterportViewerProps) {
    const { ref, inView } = useInView({
        triggerOnce: true, // Carrega apenas uma vez quando entra na view
        threshold: 0.1, // Carrega quando 10% do componente está visível
    });
    const [isLoaded, setIsLoaded] = useState(false);
    const iframeRef = useRef<HTMLIFrameElement>(null);

    useEffect(() => {
        // Adiciona um listener para saber quando o iframe terminou de carregar
        const handleLoad = () => setIsLoaded(true);
        const iframe = iframeRef.current;
        if (inView && iframe) {
            iframe.addEventListener("load", handleLoad);
            // Define o src somente quando estiver inView para iniciar o carregamento
            iframe.src = url;
            return () => iframe.removeEventListener("load", handleLoad);
        }
    }, [inView, url]);

    return (
        <div ref={ref} className="aspect-video w-full relative rounded-lg overflow-hidden border">
            {/* Skeleton enquanto não está visível ou carregando */}
            {(!inView || (inView && !isLoaded)) && <Skeleton className="absolute inset-0 w-full h-full" />}
            {/* Iframe que será carregado */}
            <iframe
                ref={iframeRef}
                title="Tour 3D Imersivo"
                className={`w-full h-full border-0 transition-opacity duration-300 ${isLoaded && inView ? "opacity-100" : "opacity-0"}`}
                allowFullScreen
                // O src é definido no useEffect
            ></iframe>
        </div>
    );
}
