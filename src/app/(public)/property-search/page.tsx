"use client";

import { GoogleMapComponent, PropertyList, SearchBar } from "@/components/features/property-search";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useIsMobile } from "@/hooks/use-mobile";
import { Property } from "@/interfaces/property";
import { MapProvider } from "@/providers/google-maps-provider";
import { ListFilter, Map } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useState } from "react";
import { useInView } from "react-intersection-observer";

// --- MAIN PAGE COMPONENT ---
function PropertySearchPageContent() {
    const searchParams = useSearchParams();
    const isMobile = useIsMobile();
    const [properties, setProperties] = useState<Property[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isFetchingMore, setIsFetchingMore] = useState(false);
    const [nextPageCursor, setNextPageCursor] = useState<string | null>(null);
    const [hasNextPage, setHasNextPage] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const { ref, inView } = useInView({
        threshold: 0,
        triggerOnce: false,
    });

    const fetchProperties = useCallback(
        async (cursor: string | null) => {
            if (!cursor) {
                setIsLoading(true);
            } else {
                setIsFetchingMore(true);
            }
            setError(null);

            const params = new URLSearchParams(searchParams.toString());
            if (cursor) {
                params.set("cursor", cursor);
            }

            try {
                const response = await fetch(`/api/properties?${params.toString()}`);
                if (!response.ok) {
                    throw new Error(`Failed to fetch: ${response.statusText}`);
                }
                const data = await response.json();

                setProperties(prev => (cursor ? [...prev, ...data.properties] : data.properties));
                setNextPageCursor(data.nextPageCursor);
                setHasNextPage(data.hasNextPage);
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
        setProperties([]);
        setNextPageCursor(null);
        setHasNextPage(true);
        fetchProperties(null);
    }, [fetchProperties]);

    // Effect for infinite scroll
    useEffect(() => {
        if (inView && hasNextPage && !isLoading && !isFetchingMore && nextPageCursor) {
            fetchProperties(nextPageCursor);
        }
    }, [inView, hasNextPage, isLoading, isFetchingMore, nextPageCursor, fetchProperties]);

    if (isMobile) {
        return (
            <div className="pt-20 flex flex-col h-screen">
                <SearchBar />
                <Tabs defaultValue="list" className="grow flex flex-col">
                    <TabsList className="grid w-full grid-cols-2 rounded-none h-14">
                        <TabsTrigger value="list" className="text-base h-full">
                            <ListFilter className="mr-2" /> Lista
                        </TabsTrigger>
                        <TabsTrigger value="map" className="text-base h-full">
                            <Map className="mr-2" /> Mapa
                        </TabsTrigger>
                    </TabsList>
                    <TabsContent value="list" className="grow overflow-y-auto">
                        <PropertyList properties={properties} isLoading={isLoading && !isFetchingMore} innerRef={ref} />
                        {isFetchingMore && <div className="text-center p-4">Carregando mais...</div>}
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
                    <PropertyList properties={properties} isLoading={isLoading && !isFetchingMore} innerRef={ref} />
                    {isFetchingMore && <div className="text-center p-4">Carregando mais...</div>}
                    {error && <div className="text-center text-red-500 p-4">Erro: {error}</div>}
                </ResizablePanel>
            </ResizablePanelGroup>
        </div>
    );
}

export default function PropertySearchPage() {
    return (
        <Suspense fallback={<div>Carregando...</div>}>
            <MapProvider>
                <PropertySearchPageContent />
            </MapProvider>
        </Suspense>
    );
}
