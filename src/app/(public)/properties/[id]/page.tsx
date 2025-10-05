"use client";

import { MatterportViewer } from "@/components/features/property/matterport-viewer";
import { PropertyHeader } from "@/components/features/property/property-header";
import { PropertyImageGallery } from "@/components/features/property/property-image-gallery";
import { PropertyMap } from "@/components/features/property/property-map";
import { UnitList } from "@/components/features/property/unit-list";
import { UnitSelector, UnitStructure } from "@/components/features/property/unit-selector";
import { Skeleton } from "@/components/ui/skeleton";
import { Property } from "@/interfaces/property";
import { Unit } from "@/interfaces/unit";
import { DocumentReference, GeoPoint, Timestamp } from "firebase/firestore";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

// Mock data and functions to simulate Firebase calls
const mockProperty: Property = {
    id: "mock-property-id",
    name: "Residencial Elysian",
    address: "Rua Paraíso, 123, Arcádia",
    propertyImages: ["/register/background.png", "/assets/background.png"],
    description:
        "Um empreendimento magnífico com muito a oferecer. Vistas deslumbrantes, lazer completo e a tranquilidade que você sempre sonhou.",
    deliveryDate: Timestamp.now(),
    launchDate: Timestamp.now(),
    developerRef: {} as DocumentReference,
    features: ["Piscina", "Academia", "Sauna", "Playground", "Salão de Festas", "Portaria 24h"],
    floors: 20,
    unitsPerFloor: 4,
    location: new GeoPoint(34.0522, -118.2437),
    searchableUnitFeats: {
        minPrice: 500000,
        maxPrice: 1200000,
        sizes: [60, 70, 80],
        bedrooms: [1, 2, 3],
        baths: [1, 2],
        garages: [1, 2],
        minSize: 60,
        maxSize: 80,
    },
    availableUnits: 10,
    groups: [],
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
};

const mockUnitStructure: UnitStructure = {
    "Bloco A": ["Apartamentos de 60m²", "Apartamentos de 70m²"],
    "Bloco B": ["Coberturas de 80m²"],
};

const mockUnits: Unit[] = Array.from({ length: 5 }).map((_, i) => ({
    id: `unit-${i}`,
    identifier: `A${101 + i}`,
    price: 500000 + i * 10000,
    size: 60,
    bedrooms: 2,
    baths: 1,
    garages: 1,
    isAvailable: true,
    floor: 10 + i,
    matterportUrl: i % 2 === 0 ? "https://my.matterport.com/show/?m=1234567890" : undefined,
    images: [],
    developerRef: {} as DocumentReference,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
}));

export default function PropertyPage() {
    const params = useParams();
    const id = params.id as string;
    const [property, setProperty] = useState<Property | null>(null);
    const [unitStructure, setUnitStructure] = useState<UnitStructure | null>(null);
    const [units, setUnits] = useState<Unit[]>([]);
    const [selectedBlock, setSelectedBlock] = useState<string | undefined>();
    const [selectedCategory, setSelectedCategory] = useState<string | undefined>();
    const [, setCursor] = useState<string | null>(null);
    const [hasNextPage, setHasNextPage] = useState(true);
    const [isLoading, setIsLoading] = useState(true);
    const [isLoadingUnits, setIsLoadingUnits] = useState(false);

    const [matterportUrl, setMatterportUrl] = useState("");
    const [isMatterportOpen, setIsMatterportOpen] = useState(false);

    // Initial data fetching for the property
    useEffect(() => {
        const fetchPropertyData = async () => {
            setIsLoading(true);
            // TODO: Replace with actual API call: const prop = await getPropertyById(id);
            const prop = mockProperty;
            setProperty(prop);

            // TODO: Replace with actual API call: const structure = await getUnitStructureForProperty(id);
            const structure = mockUnitStructure;
            setUnitStructure(structure);

            setIsLoading(false);
        };
        if (id) {
            fetchPropertyData();
        }
    }, [id]);

    // Fetch units when selection changes
    useEffect(() => {
        if (!selectedBlock || !selectedCategory) return;

        const fetchUnits = async () => {
            setIsLoadingUnits(true);
            // TODO: Replace with actual API call
            // const { units: newUnits, nextCursor } = await getUnitsPaginated(id, { block: selectedBlock, category: selectedCategory });
            const newUnits = mockUnits;
            const nextCursor = "next-page-cursor"; // Simulate next cursor

            setUnits(newUnits);
            setCursor(nextCursor);
            setHasNextPage(!!nextCursor);
            setIsLoadingUnits(false);
        };

        fetchUnits();
    }, [selectedBlock, selectedCategory, id]);

    const handleLoadMore = async () => {
        if (!hasNextPage || isLoadingUnits) return;

        setIsLoadingUnits(true);
        // TODO: Replace with actual API call
        // console.log("Loading more items starting after:", cursor);
        // const { units: newUnits, nextCursor } = await getUnitsPaginated(id, { block: selectedBlock, category: selectedCategory, startAfter: cursor });
        const newUnits = mockUnits.map(u => ({ ...u, id: u.id + "-more" })); // Simulate new data
        const nextCursor = null; // Simulate end of list

        setUnits(prev => [...prev, ...newUnits]);
        setCursor(nextCursor);
        setHasNextPage(!!nextCursor);
        setIsLoadingUnits(false);
    };

    const handleSelectUnitType = (block: string, category: string) => {
        setSelectedBlock(block);
        setSelectedCategory(category);
        setUnits([]); // Reset units on new selection
        setCursor(null);
        setHasNextPage(true);
    };

    const handleViewMatterport = (url: string) => {
        setMatterportUrl(url);
        setIsMatterportOpen(true);
    };

    if (isLoading) {
        return (
            <div className="container mx-auto px-4 py-8 space-y-8">
                <div className="flex justify-between items-center">
                    <Skeleton className="h-12 w-1/3" />
                    <Skeleton className="h-10 w-32" />
                </div>
                <Skeleton className="h-[40vh] w-full rounded-xl" />
                <div className="grid md:grid-cols-5 gap-8">
                    <div className="md:col-span-3 space-y-6">
                        <Skeleton className="h-32 w-full" />
                        <Skeleton className="h-24 w-full" />
                        <Skeleton className="h-48 w-full" />
                    </div>
                    <div className="md:col-span-2 space-y-4">
                        <Skeleton className="h-64 w-full" />
                        <Skeleton className="h-64 w-full" />
                    </div>
                </div>
            </div>
        );
    }

    if (!property) {
        return <div className="text-center py-12">Imóvel não encontrado.</div>;
    }

    return (
        <div className="py-15 bg-background text-foreground">
            <div className="container mx-auto px-4 py-8">
                <PropertyHeader name={property.name} address={property.address} />

                <div className="my-8 px-0 md:px-8 lg:px-16">
                    <div className="shadow-lg rounded-xl overflow-hidden">
                        <PropertyImageGallery images={property.propertyImages || []} propertyName={property.name} />
                    </div>
                </div>

                <div className="grid lg:grid-cols-5 gap-8 xl:gap-12 mt-12">
                    {/* Left Column */}
                    <div className="lg:col-span-3 space-y-8">
                        <div>
                            <h2 className="text-2xl font-bold text-primary mb-4">Sobre o imóvel</h2>
                            <p className="text-muted-foreground">{property.description}</p>
                        </div>
                        <div>
                            <h3 className="text-xl font-semibold text-primary mb-4">Características</h3>
                            <ul className="grid grid-cols-2 gap-2">
                                {property.features.map(feat => (
                                    <li key={feat} className="flex items-center gap-2 text-sm">
                                        <div className="w-1.5 h-1.5 rounded-full bg-primary"></div>
                                        {feat}
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <div className="max-w-md">
                            <h3 className="text-xl font-semibold text-primary mb-4">Unidades Disponíveis</h3>
                            {unitStructure && (
                                <UnitSelector
                                    structure={unitStructure}
                                    onSelect={handleSelectUnitType}
                                    selectedBlock={selectedBlock}
                                    selectedCategory={selectedCategory}
                                />
                            )}
                        </div>
                        {/* Map Section */}
                        <PropertyMap location={property.location} />
                    </div>

                    {/* Right Column: Unit List */}
                    <div className="lg:col-span-2">
                        {selectedBlock && selectedCategory ? (
                            <UnitList
                                units={units}
                                onLoadMore={handleLoadMore}
                                hasNextPage={hasNextPage}
                                isLoading={isLoadingUnits}
                                onViewMatterport={handleViewMatterport}
                            />
                        ) : (
                            <div className="flex items-center justify-center h-full bg-secondary/30 rounded-xl p-8">
                                <p className="text-muted-foreground text-center">
                                    Selecione um bloco e uma tipologia para ver as unidades disponíveis.
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Matterport Modal */}
            <MatterportViewer
                url={matterportUrl}
                isOpen={isMatterportOpen}
                onClose={() => setIsMatterportOpen(false)}
            />
        </div>
    );
}
