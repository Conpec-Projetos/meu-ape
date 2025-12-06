"use client";

import { GoogleMapComponent } from "@/components/features/maps/google-map-component";
import { PropertyList } from "@/components/specifics/property-search/property-list";
import { SearchBar } from "@/components/specifics/property-search/search-bar";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useIsMobile } from "@/hooks/use-mobile";
import { Property } from "@/interfaces/property";
import { ListFilter, Map } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useRef, useState, memo } from "react";
import { useInView } from "react-intersection-observer";

const MemoizedGoogleMap = memo(GoogleMapComponent);

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
    const searchBarContainerRef = useRef<HTMLDivElement | null>(null);
    const [viewportHeight, setViewportHeight] = useState<number | null>(null);
    const [searchBarHeight, setSearchBarHeight] = useState(0);
    const abortControllerRef = useRef<AbortController | null>(null);

    const { ref, inView } = useInView({
        threshold: 0,
        triggerOnce: false,
    });

    const fetchProperties = useCallback(
        async (pageToFetch: number) => {
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
            
            const controller = new AbortController();
            abortControllerRef.current = controller;

            if (pageToFetch === 1) {
                setIsLoading(true);
            } else {
                setIsFetchingMore(true);
            }
            setError(null);

            const params = new URLSearchParams(searchParams.toString());
            params.set("page", String(pageToFetch));

            try {
                const response = await fetch(`/api/properties?${params.toString()}`, {
                    signal: controller.signal
                });
                
                if (!response.ok) {
                    throw new Error(`Failed to fetch: ${response.statusText}`);
                }
                const data = await response.json();

                setProperties(prev => (pageToFetch === 1 ? data.properties : [...prev, ...data.properties]));
                setNextPageCursor(data.nextPageCursor);
                setHasNextPage(data.hasNextPage);
                setTotalProperties(data.totalProperties || 0);
            } catch (e) {
                if (e instanceof DOMException && e.name === 'AbortError') {
                    return;
                }
                setError(e instanceof Error ? e.message : "An unknown error occurred");
            } finally {
                if (!controller.signal.aborted) {
                    setIsLoading(false);
                    setIsFetchingMore(false);
                }
            }
        },
        [searchParams]
    );

    useEffect(() => {
        fetchProperties(1);
    }, [searchParams, fetchProperties]);

    useEffect(() => {
        if (inView && hasNextPage && !isLoading && !isFetchingMore && nextPageCursor) {
            fetchProperties(Number(nextPageCursor));
        }
    }, [inView, hasNextPage, isLoading, isFetchingMore, nextPageCursor, fetchProperties]);

    useEffect(() => {
        if (!isMobile || typeof window === "undefined") {
            return;
        }

        const updateViewportHeight = () => {
            setViewportHeight(window.innerHeight);
        };

        updateViewportHeight();
        window.addEventListener("resize", updateViewportHeight);
        window.addEventListener("orientationchange", updateViewportHeight);

        return () => {
            window.removeEventListener("resize", updateViewportHeight);
            window.removeEventListener("orientationchange", updateViewportHeight);
        };
    }, [isMobile]);

    useEffect(() => {
        if (!isMobile || !searchBarContainerRef.current) {
            return;
        }

        const element = searchBarContainerRef.current;
        setSearchBarHeight(element.offsetHeight);

        if (typeof ResizeObserver === "undefined") {
            return;
        }

        const observer = new ResizeObserver(entries => {
            if (!entries.length) {
                return;
            }
            setSearchBarHeight(entries[0].contentRect.height);
        });

        observer.observe(element);

        return () => observer.disconnect();
    }, [isMobile]);

    const HEADER_OFFSET = 80;
    const TABS_LIST_HEIGHT = 56;
    const MIN_TAB_CONTENT_HEIGHT = 320;

    const tabsAvailableHeight =
        isMobile && viewportHeight
            ? Math.max(viewportHeight - HEADER_OFFSET - searchBarHeight, TABS_LIST_HEIGHT + MIN_TAB_CONTENT_HEIGHT)
            : undefined;
    const tabPanelsHeight = tabsAvailableHeight ? tabsAvailableHeight - TABS_LIST_HEIGHT : undefined;

    if (isMobile) {
        return (
            <div className="pt-20 flex flex-col min-h-screen">
                <div ref={searchBarContainerRef} className="shrink-0">
                    <SearchBar />
                </div>
                <Tabs
                    defaultValue="list"
                    className="grow flex flex-col min-h-0"
                    style={tabsAvailableHeight ? { height: tabsAvailableHeight } : undefined}
                >
                    <TabsList className="grid w-full grid-cols-2 rounded-none h-14">
                        <TabsTrigger value="list" className="text-base h-full">
                            <ListFilter className="mr-2" /> Lista ({totalProperties})
                        </TabsTrigger>
                        <TabsTrigger value="map" className="text-base h-full">
                            <Map className="mr-2" /> Mapa
                        </TabsTrigger>
                    </TabsList>
                    <TabsContent
                        value="list"
                        className="grow overflow-y-auto min-h-0"
                        style={tabPanelsHeight ? { height: tabPanelsHeight } : undefined}
                    >
                        <PropertyList properties={properties} isLoading={isLoading && !isFetchingMore && properties.length === 0} innerRef={ref} />
                        {isFetchingMore && <div className="text-center p-4">Carregando mais...</div>}
                        {!hasNextPage && properties.length > 0 && (
                            <div className="text-center p-4 text-gray-500">Fim dos resultados.</div>
                        )}
                        {error && <div className="text-center text-red-500 p-4">Erro: {error}</div>}
                    </TabsContent>
                    <TabsContent
                        value="map"
                        className="grow flex flex-col min-h-0"
                        style={tabPanelsHeight ? { height: tabPanelsHeight } : undefined}
                    >
                        <div className="flex-1 min-h-80">
                            <MemoizedGoogleMap properties={properties} />
                        </div>
                    </TabsContent>
                </Tabs>
            </div>
        );
    }

    return (
        <div className="pt-20 flex flex-col min-h-screen">
            <SearchBar />
            <ResizablePanelGroup direction="horizontal" className="grow border-t">
                <ResizablePanel defaultSize={55} minSize={30}>
                    <MemoizedGoogleMap properties={properties} />
                </ResizablePanel>
                <ResizableHandle withHandle />
                <ResizablePanel defaultSize={45} minSize={30}>
                    <div className="flex flex-col h-full">
                        <div className="grow overflow-y-auto">
                            <PropertyList
                                properties={properties}
                                isLoading={isLoading && !isFetchingMore && properties.length === 0}
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
            <PropertySearchPageContent />
        </Suspense>
    );
}
