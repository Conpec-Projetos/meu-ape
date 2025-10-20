"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { Property } from "@/interfaces/property";
import { GoogleMap, Marker, useJsApiLoader } from "@react-google-maps/api";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import React from "react";

export function GoogleMapComponent({ properties, isLoading }: { properties: Property[]; isLoading: boolean }) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const { isLoaded, loadError } = useJsApiLoader({
        id: "google-map-script",
        googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
    });

    const mapRef = React.useRef<google.maps.Map | null>(null);

    const onMapIdle = () => {
        if (mapRef.current) {
            const bounds = mapRef.current.getBounds();
            if (bounds) {
                const ne = bounds.getNorthEast();
                const sw = bounds.getSouthWest();
                const newBoundsString = `${sw.lat()},${sw.lng()},${ne.lat()},${ne.lng()}`;
                const currentBoundsString = searchParams.get("bounds");

                if (newBoundsString !== currentBoundsString) {
                    const params = new URLSearchParams(searchParams.toString());
                    params.set("bounds", newBoundsString);
                    // Use replace to avoid polluting browser history on map move
                    router.replace(`${pathname}?${params.toString()}`);
                }
            }
        }
    };

    if (loadError) return <div>Error loading maps</div>;
    if (!isLoaded) return <Skeleton className="w-full h-full" />;

    return (
        <GoogleMap
            mapContainerClassName="w-full h-full"
            center={{ lat: -22.90556, lng: -47.06083 }}
            zoom={12}
            onLoad={map => {
                mapRef.current = map;
            }}
            onIdle={onMapIdle}
            options={{
                disableDefaultUI: true,
                zoomControl: true,
            }}
        >
            {!isLoading &&
                properties.map(prop => (
                    <Marker
                        key={prop.id}
                        position={{ lat: prop.location.latitude, lng: prop.location.longitude }}
                        title={prop.name}
                    />
                ))}
        </GoogleMap>
    );
}