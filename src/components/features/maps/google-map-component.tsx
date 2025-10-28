"use client";

import { Property } from "@/interfaces/property";
import { AdvancedMarker, Map, Pin, useApiIsLoaded, useMap } from "@vis.gl/react-google-maps";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

function MapEvents() {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const map = useMap();
    const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const DEBOUNCE_DELAY = 600;

    useEffect(() => {
        if (!map) return;

        const handleIdle = () => {
            if (debounceTimeoutRef.current) {
                clearTimeout(debounceTimeoutRef.current);
            }

            debounceTimeoutRef.current = setTimeout(() => {
                const bounds = map.getBounds();
                if (bounds) {
                    const ne = bounds.getNorthEast();
                    const sw = bounds.getSouthWest();
                    const newBoundsString = `${sw.lat()},${sw.lng()},${ne.lat()},${ne.lng()}`;
                    const currentBoundsString = searchParams.get("bounds");

                    if (newBoundsString !== currentBoundsString) {
                        const params = new URLSearchParams(searchParams.toString());
                        params.set("bounds", newBoundsString);
                        router.replace(`${pathname}?${params.toString()}`, { scroll: false });
                    }
                }
            }, DEBOUNCE_DELAY);
        };

        const listener = map.addListener("idle", handleIdle);

        return () => {
            google.maps.event.removeListener(listener);
            if (debounceTimeoutRef.current) {
                clearTimeout(debounceTimeoutRef.current);
            }
        };
    }, [map, router, pathname, searchParams]);

    return null;
}

export function GoogleMapComponent({ properties, isLoading }: { properties: Property[]; isLoading: boolean }) {
    const isLoaded = useApiIsLoaded();
    const router = useRouter();
    const [colorScheme, setColorScheme] = useState<google.maps.ColorScheme | null>(null);

    const handleMarkerClick = useCallback(
        (propertyId: string) => {
            router.push(`/properties/${propertyId}`);
        },
        [router]
    );

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

    return (
        <div className="w-full h-full">
            <Map
                defaultCenter={{ lat: -22.90556, lng: -47.06083 }} // Campinas
                defaultZoom={12}
                disableDefaultUI={true}
                zoomControl={true}
                {...(colorScheme && { colorScheme: colorScheme })}
                mapId={process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID!}
                gestureHandling={"greedy"}
            >
                <MapEvents />
                {!isLoading &&
                    properties.map(
                        prop =>
                            prop.location?.lat &&
                            prop.location?.lng && (
                                <AdvancedMarker
                                    key={prop.id}
                                    position={{ lat: prop.location.lat, lng: prop.location.lng }}
                                    onClick={() => handleMarkerClick(prop.id!)}
                                >
                                    <Pin background={"#FBBC04"} borderColor={"#000"} glyphColor={"#000"} scale={1.5} />
                                </AdvancedMarker>
                            )
                    )}
            </Map>
        </div>
    );
}
