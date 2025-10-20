"use client";

import { GoogleMapComponent, PropertyList, SearchBar } from "@/components/features/property-search";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useIsMobile } from "@/hooks/use-mobile";
import { Property } from "@/interfaces/property";
import { MapProvider } from "@/providers/google-maps-provider";
import { GeoPoint, Timestamp } from "firebase/firestore";
import { ListFilter, Map } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

// --- MOCK DATA (to be replaced with API calls) ---
const mockProperties: Property[] = Array.from({ length: 8 }).map((_, i) => ({
    id: `prop-${i}`,
    name: `Residencial Vista do Vale ${i + 1}`,
    address: "Av. Brasil, 1234, Campinas - SP",
    propertyImages: [], // placeholder for images in mock data; replace with actual fetch in real API call
    deliveryDate: Timestamp.now(),
    launchDate: Timestamp.now(),
    developerRef: {} as any,
    features: ["Piscina", "Academia"],
    floors: 20,
    unitsPerFloor: 4,
    location: new GeoPoint(-22.90556 + (Math.random() - 0.5) * 0.05, -47.06083 + (Math.random() - 0.5) * 0.05),
    searchableUnitFeats: {
        minPrice: 500000 + i * 50000,
        maxPrice: 1200000,
        sizes: [60, 75, 90],
        bedrooms: [2, 3],
        baths: [1, 2],
        garages: [1, 2],
        minSize: 60,
        maxSize: 90,
    },
    availableUnits: 10,
    groups: [],
    description: "Um empreendimento incrível.",
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
}));

// --- MAIN PAGE COMPONENT ---
function PropertySearchPageContent() {
    const searchParams = useSearchParams();
    const isMobile = useIsMobile();
    const [properties, setProperties] = useState<Property[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchProperties = async () => {
            setIsLoading(true);
            // MOCK API CALL
            // In a real app, you would call your Firebase function here, passing the searchParams
            console.log("Fetching properties with params:", searchParams.toString());
            await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate network delay
            setProperties(mockProperties);
            setIsLoading(false);
        };

        fetchProperties();
    }, [searchParams]);

    if (isMobile) {
        return (
            <div className="pt-20 flex flex-col h-screen">
                <SearchBar />
                <Tabs defaultValue="list" className="flex-grow flex flex-col">
                    <TabsList className="grid w-full grid-cols-2 rounded-none h-14">
                        <TabsTrigger value="list" className="text-base h-full">
                            <ListFilter className="mr-2" /> Lista
                        </TabsTrigger>
                        <TabsTrigger value="map" className="text-base h-full">
                            <Map className="mr-2" /> Mapa
                        </TabsTrigger>
                    </TabsList>
                    <TabsContent value="list" className="flex-grow overflow-y-auto">
                        <PropertyList properties={properties} isLoading={isLoading} />
                    </TabsContent>
                    <TabsContent value="map" className="flex-grow">
                        <GoogleMapComponent properties={properties} isLoading={isLoading} />
                    </TabsContent>
                </Tabs>
            </div>
        );
    }

    return (
        <div className="pt-20 flex flex-col h-screen">
            <SearchBar />
            <ResizablePanelGroup direction="horizontal" className="flex-grow border-t">
                <ResizablePanel defaultSize={55} minSize={30}>
                    <GoogleMapComponent properties={properties} isLoading={isLoading} />
                </ResizablePanel>
                <ResizableHandle withHandle />
                <ResizablePanel defaultSize={45} minSize={30}>
                    <PropertyList properties={properties} isLoading={isLoading} />
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