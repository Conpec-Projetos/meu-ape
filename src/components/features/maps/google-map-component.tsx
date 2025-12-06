"use client";

import { Property } from "@/interfaces/property";
import { AdvancedMarker, Map, Pin, useApiIsLoaded, useMap } from "@vis.gl/react-google-maps";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState, useMemo } from "react";

const hasMovedSignificantly = (
    oldBounds: string | null,
    newBounds: { ne: { lat: number; lng: number }; sw: { lat: number; lng: number } }
) => {
    if (!oldBounds) return true;
    const [minLat, minLng, maxLat, maxLng] = oldBounds.split(',').map(Number);
    
    const EPSILON = 0.0005; // ~50 metros de tolerancia

    return (
        Math.abs(newBounds.sw.lat - minLat) > EPSILON ||
        Math.abs(newBounds.sw.lng - minLng) > EPSILON ||
        Math.abs(newBounds.ne.lat - maxLat) > EPSILON ||
        Math.abs(newBounds.ne.lng - maxLng) > EPSILON
    );
};

function MapEvents() {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const map = useMap();
    
    const searchParamsRef = useRef(searchParams);
    const routerRef = useRef(router);
    const pathnameRef = useRef(pathname);
    const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const isFirstLoadRef = useRef(true);

    useEffect(() => {
        searchParamsRef.current = searchParams;
        routerRef.current = router;
        pathnameRef.current = pathname;
    }, [searchParams, router, pathname]);

    useEffect(() => {
        if (!map) return;

        const handleIdle = () => {
            if (debounceTimeoutRef.current) {
                clearTimeout(debounceTimeoutRef.current);
            }

            debounceTimeoutRef.current = setTimeout(() => {
                const bounds = map.getBounds();
                if (!bounds) return;

                const ne = bounds.getNorthEast();
                const sw = bounds.getSouthWest();

                const newBoundsObj = {
                    sw: { lat: sw.lat(), lng: sw.lng() },
                    ne: { lat: ne.lat(), lng: ne.lng() }
                };

                const newBoundsString = [
                    newBoundsObj.sw.lat.toFixed(4),
                    newBoundsObj.sw.lng.toFixed(4),
                    newBoundsObj.ne.lat.toFixed(4),
                    newBoundsObj.ne.lng.toFixed(4)
                ].join(',');

                const currentParams = new URLSearchParams(searchParamsRef.current.toString());
                const currentBoundsString = currentParams.get("bounds");

                if (isFirstLoadRef.current) {
                    isFirstLoadRef.current = false;
                    if (!currentBoundsString) return; 
                }

                if (
                    newBoundsString !== currentBoundsString && 
                    hasMovedSignificantly(currentBoundsString, newBoundsObj)
                ) {
                    currentParams.set("bounds", newBoundsString);
                    routerRef.current.replace(`${pathnameRef.current}?${currentParams.toString()}`, { 
                        scroll: false 
                    });
                }
            }, 800); // Debounce
        };

        const listener = map.addListener("idle", handleIdle);

        return () => {
            google.maps.event.removeListener(listener);
            if (debounceTimeoutRef.current) {
                clearTimeout(debounceTimeoutRef.current);
            }
        };
    }, [map]);

    return null;
}

export function GoogleMapComponent({ properties}: { properties: Property[]}) {
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

    // useMemo para os marcadores evita re-cálculos desnecessários durante re-renders do componente pai
    const markers = useMemo(() => {
        return properties.map(
            prop =>
                prop.location?.lat &&
                prop.location?.lng && (
                    <AdvancedMarker
                        key={prop.id}
                        position={{ lat: prop.location.lat, lng: prop.location.lng }}
                        onClick={() => handleMarkerClick(prop.id!)}
                    >
                        <Pin background={"oklch(0.704 0.191 22.216)"} borderColor={"oklch(1 0 0)"} glyphColor={"oklch(1 0 0)"} scale={1} />
                    </AdvancedMarker>
                )
        );
    }, [properties, handleMarkerClick]);

    if (!isLoaded) {
        return <div className="w-full h-full bg-gray-200 animate-pulse" />;
    }

    return (
        <div className="w-full h-full">
            <Map
                defaultCenter={{ lat: -22.90556, lng: -47.06083 }}
                defaultZoom={12}
                disableDefaultUI={true}
                zoomControl={true}
                minZoom={10} 
                maxZoom={18}
                {...(colorScheme && { colorScheme: colorScheme })}
                mapId={process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID!}
                gestureHandling={"greedy"}
                reuseMaps={true}
            >
                <MapEvents />
                {markers}
            </Map>
        </div>
    );
}
