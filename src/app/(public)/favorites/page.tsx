"use client";

import { GoogleMapComponent } from "@/components/features/maps/google-map-component";
import { PropertyList } from "@/components/specifics/property-search/property-list";
import { Button } from "@/components/ui/button";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useIsMobile } from "@/hooks/use-mobile";
import { Property } from "@/interfaces/property";
import { Heart, ListFilter, Map as MapIcon } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { memo, Suspense, useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

const MemoizedGoogleMap = memo(GoogleMapComponent);

function FavoritesPageContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const isMobile = useIsMobile();

    const [properties, setProperties] = useState<Property[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isFetchingMore, setIsFetchingMore] = useState(false);
    const [nextPageCursor, setNextPageCursor] = useState<string | null>(null);
    const [hasNextPage, setHasNextPage] = useState(false);
    const [, setTotalFavorites] = useState(0);

    const [viewportHeight, setViewportHeight] = useState<number | null>(null);

    const observer = useRef<IntersectionObserver | null>(null);
    const lastElementRef = useCallback(
        (node?: Element | null) => {
            if (isLoading || isFetchingMore) return;
            if (observer.current) observer.current.disconnect();
            observer.current = new IntersectionObserver(entries => {
                if (entries[0].isIntersecting && hasNextPage && nextPageCursor) {
                    const params = new URLSearchParams(searchParams.toString());
                    params.set("page", nextPageCursor);

                    router.replace(`/favorites?${params.toString()}`, { scroll: false });
                }
            });
            if (node) observer.current.observe(node);
        },
        [isLoading, isFetchingMore, hasNextPage, nextPageCursor, router, searchParams]
    );

    const fetchFavorites = useCallback(async () => {
        const page = searchParams.get("page") || "1";
        const isFirstPage = page === "1";

        if (isFirstPage) setIsLoading(true);
        else setIsFetchingMore(true);

        try {
            const res = await fetch(`/api/user/favorites/properties?page=${page}`);
            if (!res.ok) {
                if (res.status === 401) {
                    router.push("/login");
                    return;
                }
                throw new Error("Falha ao carregar favoritos");
            }

            const data = await res.json();

            setProperties(prev => (isFirstPage ? data.properties : [...prev, ...data.properties]));
            setNextPageCursor(data.nextPageCursor);
            setHasNextPage(data.hasNextPage);
            setTotalFavorites(data.total);
        } catch (error) {
            console.error(error);
            toast.error("Erro ao carregar seus favoritos.");
        } finally {
            setIsLoading(false);
            setIsFetchingMore(false);
        }
    }, [searchParams, router]);

    useEffect(() => {
        fetchFavorites();
    }, [fetchFavorites]);

    useEffect(() => {
        if (!isMobile || typeof window === "undefined") return;
        const updateHeight = () => setViewportHeight(window.innerHeight);
        updateHeight();
        window.addEventListener("resize", updateHeight);
        return () => window.removeEventListener("resize", updateHeight);
    }, [isMobile]);

    const HEADER_OFFSET = 80;
    const TABS_LIST_HEIGHT = 56;
    const availableHeight =
        isMobile && viewportHeight ? Math.max(0, viewportHeight - HEADER_OFFSET - TABS_LIST_HEIGHT) : undefined;

    if (isMobile) {
        return (
            <div className="pt-20 flex flex-col min-h-screen">
                <div className="px-4 py-3 w-full bg-white border-b ">
                    <h1 className="text-xl font-bold flex items-center gap-2 justify-center">
                        <Heart className="fill-primary text-primary h-5 w-5" />
                        Meus Favoritos
                    </h1>
                </div>

                <Tabs
                    defaultValue="list"
                    className="grow flex flex-col min-h-0"
                    style={availableHeight ? { height: availableHeight } : undefined}
                >
                    <TabsList className="grid w-full grid-cols-2 rounded-none h-14 shrink-0">
                        <TabsTrigger value="list" className="text-base h-full">
                            <ListFilter className="mr-2 h-4 w-4" /> Lista
                        </TabsTrigger>
                        <TabsTrigger value="map" className="text-base h-full">
                            <MapIcon className="mr-2 h-4 w-4" /> Mapa
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="list" className="grow overflow-y-auto min-h-0 p-0">
                        {!isLoading && properties.length === 0 ? (
                            <div className="flex flex-col items-center text-center gap-3 px-4 py-10 text-muted-foreground">
                                <Heart className="h-14 w-14 opacity-20" />
                                <h3 className="text-lg font-medium">Sua lista está vazia</h3>
                                <p>Explore imóveis e clique no coração para salvá-los aqui.</p>
                                <Button
                                    variant="outline"
                                    className="mt-2 cursor-pointer"
                                    onClick={() => router.push("/property-search")}
                                >
                                    Ir para busca
                                </Button>
                            </div>
                        ) : (
                            <>
                                <PropertyList
                                    properties={properties}
                                    isLoading={isLoading && !isFetchingMore}
                                    innerRef={lastElementRef}
                                />
                                {isFetchingMore && (
                                    <div className="text-center py-4 text-sm text-muted-foreground">
                                        Carregando mais...
                                    </div>
                                )}
                            </>
                        )}
                    </TabsContent>

                    <TabsContent value="map" className="grow flex flex-col min-h-0">
                        <div className="flex-1 min-h-80">
                            <MemoizedGoogleMap properties={properties} enableUrlUpdates={false} />
                        </div>
                    </TabsContent>
                </Tabs>
            </div>
        );
    }

    return (
        <div className="pt-20 flex flex-col h-screen overflow-hidden">
            <div className="px-6 py-4 bg-white border-b shrink-0 flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <Heart className="fill-primary text-primary h-6 w-6" />
                        Meus Favoritos
                    </h1>
                </div>
            </div>

            <div className="flex-1 min-h-0">
                <ResizablePanelGroup direction="horizontal" className="h-full border-t">
                    <ResizablePanel defaultSize={55} minSize={30}>
                        <div className="h-full w-full relative">
                            <MemoizedGoogleMap properties={properties} enableUrlUpdates={false} />

                            {!isLoading && properties.length === 0 && (
                                <div className="absolute inset-0 bg-black/10 flex items-center justify-center pointer-events-none">
                                    <div className="bg-white p-4 rounded-lg shadow-lg">
                                        <p>Seus favoritos aparecerão no mapa.</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </ResizablePanel>

                    <ResizableHandle withHandle />

                    <ResizablePanel defaultSize={45} minSize={30}>
                        <div className="flex flex-col h-full bg-white">
                            <div className="grow overflow-y-auto scroll-smooth">
                                {!isLoading && properties.length === 0 ? (
                                    <div className="flex flex-col items-center text-center gap-3 p-8 pt-10 text-muted-foreground">
                                        <Heart className="h-16 w-16 opacity-20" />
                                        <h3 className="text-lg font-medium">Sua lista está vazia</h3>
                                        <p>Explore imóveis e clique no coração para salvá-los aqui.</p>
                                        <Button
                                            variant="outline"
                                            className="mt-2 cursor-pointer"
                                            onClick={() => router.push("/property-search")}
                                        >
                                            Ir para busca
                                        </Button>
                                    </div>
                                ) : (
                                    <>
                                        <PropertyList
                                            properties={properties}
                                            isLoading={isLoading && !isFetchingMore}
                                            innerRef={lastElementRef}
                                        />
                                        {isFetchingMore && (
                                            <div className="py-4 text-center">
                                                <span className="text-sm text-muted-foreground">
                                                    Carregando mais favoritos...
                                                </span>
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>
                    </ResizablePanel>
                </ResizablePanelGroup>
            </div>
        </div>
    );
}

export default function FavoritesPage() {
    return (
        <Suspense fallback={<div className="flex items-center justify-center h-screen">Carregando...</div>}>
            <FavoritesPageContent />
        </Suspense>
    );
}
