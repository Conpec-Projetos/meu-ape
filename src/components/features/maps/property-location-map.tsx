"use client";

import { Property } from "@/interfaces/property";
import { AdvancedMarker, Map, Pin, useApiIsLoaded } from "@vis.gl/react-google-maps";
import { useEffect, useState } from "react";

interface PropertyLocationMapProps {
    property: Property;
    zoom?: number;
}

export function PropertyLocationMap({ property, zoom = 15 }: PropertyLocationMapProps) {
    const isLoaded = useApiIsLoaded();
    const [colorScheme, setColorScheme] = useState<google.maps.ColorScheme | null>(null);

    useEffect(() => {
        if (isLoaded) {
            google.maps.importLibrary("core").then(() => {
                setColorScheme(google.maps.ColorScheme.DARK);
            });
        }
    }, [isLoaded]);

    if (!isLoaded) {
        return <div className="w-full h-full bg-gray-200 animate-pulse" />;
    }

    const center =
        property.location?.lat && property.location?.lng
            ? { lat: property.location.lat, lng: property.location.lng }
            : { lat: -22.90556, lng: -47.06083 }; // Fallback: Campinas

    return (
        <div className="w-full h-full">
            <Map
                defaultCenter={center}
                defaultZoom={zoom}
                disableDefaultUI={true}
                zoomControl={true}
                {...(colorScheme && { colorScheme })}
                mapId={process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID!}
                gestureHandling="greedy"
            >
                {property.location?.lat && property.location?.lng && (
                    <AdvancedMarker position={center}>
                        <Pin
                            background={"oklch(0.704 0.191 22.216)"}
                            borderColor={"oklch(1 0 0)"}
                            glyphColor={"oklch(1 0 0)"}
                        />
                    </AdvancedMarker>
                )}
            </Map>
        </div>
    );
}
