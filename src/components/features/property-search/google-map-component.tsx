"use client";

import { Property } from "@/interfaces/property";
import { AdvancedMarker, Map, useApiIsLoaded, useMap } from "@vis.gl/react-google-maps";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useRef } from "react";

function MapEvents() {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const map = useMap();
    // Ref para guardar o ID do timeout
    const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    // Tempo de delay em milissegundos
    const DEBOUNCE_DELAY = 600;

    useEffect(() => {
        if (!map) return;

        const handleIdle = () => {
            // Limpa o timeout anterior se o usuário interagir novamente antes do delay
            if (debounceTimeoutRef.current) {
                clearTimeout(debounceTimeoutRef.current);
            }

            // Define um novo timeout para executar a atualização após o delay
            debounceTimeoutRef.current = setTimeout(() => {
                const bounds = map.getBounds();
                if (bounds) {
                    const ne = bounds.getNorthEast();
                    const sw = bounds.getSouthWest();
                    const newBoundsString = `${sw.lat()},${sw.lng()},${ne.lat()},${ne.lng()}`;
                    const currentBoundsString = searchParams.get("bounds");

                    // Só atualiza a URL se os limites realmente mudaram
                    if (newBoundsString !== currentBoundsString) {
                        console.log("Updating bounds after debounce:", newBoundsString);
                        const params = new URLSearchParams(searchParams.toString());
                        params.set("bounds", newBoundsString);
                        // Use replace para não adicionar ao histórico do navegador a cada atualização do mapa
                        router.replace(`${pathname}?${params.toString()}`);
                    }
                }
            }, DEBOUNCE_DELAY);
        };

        // Adiciona o listener para o evento 'idle'
        const listener = map.addListener("idle", handleIdle);

        // Remove o listener e limpa o timeout se o componente for desmontado
        return () => {
            google.maps.event.removeListener(listener);
            if (debounceTimeoutRef.current) {
                clearTimeout(debounceTimeoutRef.current);
            }
        };
    }, [map, router, pathname, searchParams, DEBOUNCE_DELAY]);

    return null;
}

export function GoogleMapComponent({ properties, isLoading }: { properties: Property[]; isLoading: boolean }) {
    const isLoaded = useApiIsLoaded();
    const [colorScheme, setColorScheme] = useState<google.maps.ColorScheme | null>(null);

    useEffect(() => {
        if (isLoaded) {
            google.maps.importLibrary("core").then(() => {
                // Tente obter a preferência do sistema ou defina um padrão
                // const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                // setColorScheme(prefersDark ? google.maps.ColorScheme.DARK : google.maps.ColorScheme.LIGHT);
                setColorScheme(google.maps.ColorScheme.DARK);

                // Opcional: ouvir mudanças no tema do sistema
                // window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', event => {
                //      setColorScheme(event.matches ? google.maps.ColorScheme.DARK : google.maps.ColorScheme.LIGHT);
                //  });
            });
        }
    }, [isLoaded]);


    if (!isLoaded) {
        return <div className="w-full h-full bg-gray-200 animate-pulse" />;
    }

    return (
        <div className="w-full h-full">
            <Map
                defaultCenter={{ lat: -22.90556, lng: -47.06083 }} // Campinas
                defaultZoom={12}
                disableDefaultUI={true}
                zoomControl={true}
                // Aplica o colorScheme apenas se ele já foi definido
                {...(colorScheme && { colorScheme: colorScheme })}
                mapId={process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID!}
                gestureHandling={'greedy'} // Melhora a experiência em mobile/touch
            >
                <MapEvents />
                {!isLoading &&
                    properties.map(prop => (
                         // Verifica se a localização e as coordenadas existem
                        prop.location?.latitude && prop.location?.longitude && (
                            <AdvancedMarker
                                key={prop.id}
                                position={{ lat: prop.location.latitude, lng: prop.location.longitude }}
                                title={prop.name}
                            />
                        )
                    ))}
            </Map>
        </div>
    );
}