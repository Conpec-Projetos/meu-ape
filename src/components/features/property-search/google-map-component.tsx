"use client";

import { Property } from "@/interfaces/property";
import { AdvancedMarker, Map, useApiIsLoaded, useMap } from "@vis.gl/react-google-maps";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

function MapEvents() {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const map = useMap();

    useEffect(() => {
        if (!map) return;

        const listener = map.addListener("idle", () => {
            const bounds = map.getBounds();
            if (bounds) {
                const ne = bounds.getNorthEast();
                const sw = bounds.getSouthWest();
                const newBoundsString = `${sw.lat()},${sw.lng()},${ne.lat()},${ne.lng()}`;
                const currentBoundsString = searchParams.get("bounds");

                if (newBoundsString !== currentBoundsString) {
                    const params = new URLSearchParams(searchParams.toString());
                    params.set("bounds", newBoundsString);
                    router.replace(`${pathname}?${params.toString()}`);
                }
            }
        });

        return () => google.maps.event.removeListener(listener);
    }, [map, router, pathname, searchParams]);

    return null;
}

export function GoogleMapComponent({ properties, isLoading }: { properties: Property[]; isLoading: boolean }) {
    const isLoaded = useApiIsLoaded();
    const [colorScheme, setColorScheme] = useState<google.maps.ColorScheme | null>(null);

    useEffect(() => {
        if (isLoaded) {
            google.maps.importLibrary("core").then(() => {
                setColorScheme(google.maps.ColorScheme.DARK);
            });
        }
    }, [isLoaded]);

    if (!isLoaded || !colorScheme) {
        return <div className="w-full h-full bg-gray-200 animate-pulse" />;
    }

    return (
        <div className="w-full h-full">
            <Map
                defaultCenter={{ lat: -22.90556, lng: -47.06083 }}
                defaultZoom={12}
                disableDefaultUI={true}
                zoomControl={true}
                colorScheme={colorScheme}
                mapId={process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID!}
            >
                <MapEvents />
                {!isLoading &&
                    properties.map(prop => (
                        <AdvancedMarker
                            key={prop.id}
                            position={{ lat: prop.location.latitude, lng: prop.location.longitude }}
                            title={prop.name}
                        />
                    ))}
            </Map>
        </div>
    );
}