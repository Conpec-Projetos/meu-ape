"use client";

import { GoogleMapComponent } from "@/components/features/maps/google-map-component";
import { PropertyList } from "@/components/specifics/property-search/property-list";
import { SearchBar } from "@/components/specifics/property-search/search-bar";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useIsMobile } from "@/hooks/use-mobile";
import { Property } from "@/interfaces/property";
import { MapProvider } from "@/providers/google-maps-provider";
import { ListFilter, Map } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useState } from "react";
import { useInView } from "react-intersection-observer";

function PropertySearchPageContent() {
    const searchParams = useSearchParams();
    const isMobile = useIsMobile();
    const [properties, setProperties] = useState<Property[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isFetchingMore, setIsFetchingMore] = useState(false);
    const [nextPageCursor, setNextPageCursor] = useState<string | null>(null);
    const [hasNextPage, setHasNextPage] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [totalProperties, setTotalProperties] = useState(0);

    const { ref, inView } = useInView({
        threshold: 0,
        triggerOnce: false,
    });

    const fetchProperties = useCallback(
        async (pageToFetch: number) => {
            if (pageToFetch === 1) {
                setIsLoading(true);
                setProperties([]); // Clear properties on a new search (page 1)
            } else {
                setIsFetchingMore(true);
            }
            setError(null);

            const params = new URLSearchParams(searchParams.toString());
            params.set("page", String(pageToFetch));

            try {
                const response = await fetch(`/api/properties?${params.toString()}`);
                if (!response.ok) {
                    throw new Error(`Failed to fetch: ${response.statusText}`);
                }
                const data = await response.json();

                setProperties(prev => (pageToFetch === 1 ? data.properties : [...prev, ...data.properties]));
                setNextPageCursor(data.nextPageCursor);
                setHasNextPage(data.hasNextPage);
                setTotalProperties(data.totalProperties || 0);
            } catch (e) {
                setError(e instanceof Error ? e.message : "An unknown error occurred");
            } finally {
                setIsLoading(false);
                setIsFetchingMore(false);
            }
        },
        [searchParams]
    );

    // Effect for initial load and search param changes
    useEffect(() => {
        // This effect triggers whenever the search filters change.
        // We reset the state and fetch the first page.
        fetchProperties(1);
    }, [searchParams, fetchProperties]);

    // Effect for infinite scroll
    useEffect(() => {
        if (inView && hasNextPage && !isLoading && !isFetchingMore && nextPageCursor) {
            fetchProperties(Number(nextPageCursor));
        }
    }, [inView, hasNextPage, isLoading, isFetchingMore, nextPageCursor, fetchProperties]);

    if (isMobile) {
        return (
            <div className="pt-20 flex flex-col h-screen">
                <SearchBar />
                <Tabs defaultValue="list" className="grow flex flex-col">
                    <TabsList className="grid w-full grid-cols-2 rounded-none h-14">
                        <TabsTrigger value="list" className="text-base h-full">
                            <ListFilter className="mr-2" /> Lista ({totalProperties})
                        </TabsTrigger>
                        <TabsTrigger value="map" className="text-base h-full">
                            <Map className="mr-2" /> Mapa
                        </TabsTrigger>
                    </TabsList>
                    <TabsContent value="list" className="grow overflow-y-auto">
                        <PropertyList properties={properties} isLoading={isLoading && !isFetchingMore} innerRef={ref} />
                        {isFetchingMore && <div className="text-center p-4">Carregando mais...</div>}
                        {!hasNextPage && properties.length > 0 && (
                            <div className="text-center p-4 text-gray-500">Fim dos resultados.</div>
                        )}
                        {error && <div className="text-center text-red-500 p-4">Erro: {error}</div>}
                    </TabsContent>
                    <TabsContent value="map" className="grow">
                        <GoogleMapComponent properties={properties} isLoading={isLoading} />
                    </TabsContent>
                </Tabs>
            </div>
        );
    }

    return (
        <div className="pt-20 flex flex-col h-screen">
            <SearchBar />
            <ResizablePanelGroup direction="horizontal" className="grow border-t">
                <ResizablePanel defaultSize={55} minSize={30}>
                    <GoogleMapComponent properties={properties} isLoading={isLoading} />
                </ResizablePanel>
                <ResizableHandle withHandle />
                <ResizablePanel defaultSize={45} minSize={30}>
                    <div className="flex flex-col h-full">
                        <div className="grow overflow-y-auto">
                            <PropertyList
                                properties={properties}
                                isLoading={isLoading && !isFetchingMore}
                                innerRef={ref}
                            />
                            {isFetchingMore && <div className="text-center p-4">Carregando mais...</div>}
                            {!hasNextPage && properties.length > 0 && (
                                <div className="text-center p-4 text-gray-500">Fim dos resultados.</div>
                            )}
                            {error && <div className="text-center text-red-500 p-4">Erro: {error}</div>}
                        </div>
                    </div>
                </ResizablePanel>
            </ResizablePanelGroup>
        </div>
    );
}

export default function PropertySearchPage() {
    return (
        <Suspense fallback={<div className="flex items-center justify-center h-screen">Carregando...</div>}>
            <MapProvider>
                <PropertySearchPageContent />
            </MapProvider>
        </Suspense>
    );
}
