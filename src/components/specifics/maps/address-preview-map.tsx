"use client";

import { AdvancedMarker, Map, Pin, useApiIsLoaded } from "@vis.gl/react-google-maps";
import { memo, useEffect, useState } from "react";

type LatLng = { lat: number; lng: number };

interface AddressPreviewMapProps {
    center?: LatLng;
    marker?: LatLng | null;
    className?: string;
    zoom?: number;
}

/**
 * Lightweight Google Map preview used to show a selected address.
 */
function AddressPreviewMapBase({ center, marker, className, zoom = 15 }: AddressPreviewMapProps) {
    const isLoaded = useApiIsLoaded();
    const [colorScheme, setColorScheme] = useState<google.maps.ColorScheme | null>(null);
    const fallbackCenter: LatLng = center || { lat: -23.55052, lng: -46.633308 }; // São Paulo

    useEffect(() => {
        if (isLoaded) {
            google.maps.importLibrary("core").then(() => {
                setColorScheme(google.maps.ColorScheme.DARK);
            });
        }
    }, [isLoaded]);

    if (!isLoaded) {
        return <div className={className} />;
    }

    return (
        <div className={className}>
            <Map
                key={`apm-${fallbackCenter.lat}-${fallbackCenter.lng}-${colorScheme ?? "none"}`}
                center={fallbackCenter}
                zoom={marker ? zoom : 12}
                gestureHandling="greedy"
                disableDefaultUI={true}
                zoomControl={true}
                {...(colorScheme && { colorScheme })}
                mapId={process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID!}
                style={{ width: "100%", height: "100%", borderRadius: "0.5rem" }}
            >
                {marker && (
                    <AdvancedMarker position={marker}>
                        <Pin
                            background={"oklch(0.704 0.191 22.216)"}
                            borderColor={"oklch(1 0 0)"}
                            glyphColor={"oklch(1 0 0)"}
                            scale={1}
                        />
                    </AdvancedMarker>
                )}
            </Map>
        </div>
    );
}

const AddressPreviewMap = memo(AddressPreviewMapBase);
export default AddressPreviewMap;
