"use client";

import { JustInTimeDataModal } from "@/components/features/modals/justIn-time-data-modal";
import { ReservationModal } from "@/components/features/modals/reservation-modal";
import { VisitModal } from "@/components/features/modals/visit-modal";
// Importar o novo componente Matterport (que será criado/adaptado)
import { EmbeddedMatterportViewer } from "@/components/features/property/embedded-matterport-viewer"; // Renomeado para clareza
import { PropertyHeader } from "@/components/features/property/property-header";
import { PropertyImageGallery } from "@/components/features/property/property-image-gallery";
// Importar o GoogleMapComponent
import { GoogleMapComponent } from "@/components/features/property-search";
import { UnitList } from "@/components/features/property/unit-list";
import { UnitSelector, UnitStructure } from "@/components/features/property/unit-selector";
import { Skeleton } from "@/components/ui/skeleton";
import { actionRequirements } from "@/config/actionRequirements";
import { auth, db } from "@/firebase/firebase-config";
import { Property } from "@/interfaces/property";
import { Unit } from "@/interfaces/unit";
// Importar o MapProvider
import { MapProvider } from "@/providers/google-maps-provider";
import { doc, DocumentData, DocumentReference, GeoPoint, getDoc, Timestamp } from "firebase/firestore";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

// Mock data (MANTIDO PARA EXEMPLO, SUBSTITUIR POR CHAMADAS REAIS)
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
    developerName: "Construtora Teste",
    features: ["Piscina", "Academia", "Sauna", "Playground", "Salão de Festas", "Portaria 24h"],
    floors: 20,
    unitsPerFloor: 4,
    location: new GeoPoint(34.0522, -118.2437),
    matterportUrl: ["https://my.matterport.com/show/?m=EmsYeDcMSPu"],
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
    images: [],
    developerRef: {} as DocumentReference,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
}));
// --- FIM DOS MOCKS ---

function PropertyPageContent() { // Extraído para usar dentro do MapProvider
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

    // REMOVIDO: Estados relacionados ao modal Matterport
    // const [matterportUrl, setMatterportUrl] = useState("");
    // const [isMatterportOpen, setIsMatterportOpen] = useState(false);

    const [currentUser, setCurrentUser] = useState<DocumentData>();
    const refetchUserData = async () => {
        const user = auth.currentUser;
        if (!user) {
            setCurrentUser(undefined);
            return;
        }
        const userDocRef = doc(db, "users", user.uid);
        try {
            const docSnap = await getDoc(userDocRef);
            if (docSnap.exists()) {
                setCurrentUser(docSnap.data());
            } else {
                console.error("Usuário não encontrado no Firestore.");
                setCurrentUser(undefined);
            }
        } catch (error: unknown) {
            console.error("Erro ao buscar dados do usuário:", String(error));
        }
    };

    useEffect(() => {
        refetchUserData();
    }, []);

    const [visitModal, setVisitModal] = useState<boolean>(false);
    const [unit, setUnit] = useState<Unit>();
    const openVisitCalendarModal = () => setVisitModal(true);

    const [reservationModal, setReservationModal] = useState<boolean>(false);
    const openReservationConfirmModal = () => setReservationModal(true);

    const [isJitModalOpen, setIsJitModalOpen] = useState(false);
    const [missingFields, setMissingFields] = useState<string[]>([]);
    const [lastAction, setLastAction] = useState<string>("");

    const handleGuardedAction = async (actionType: "REQUEST_VISIT" | "REQUEST_RESERVATION", unitData: Unit) => {
        const required = actionRequirements[actionType];
        await refetchUserData(); // Garante que temos os dados mais recentes

        const userData = currentUser; // Usa o estado atualizado
        const currentMissingFields: string[] = [];
        const requiredDocs = ["addressProof", "incomeProof", "identityDoc", "bmCert"];

        required.forEach(field => {
            if (requiredDocs.includes(field)) {
                if (!userData?.documents || !userData?.documents[field] || userData?.documents[field].length === 0) {
                    currentMissingFields.push(field);
                }
            } else if (!userData?.[field]) {
                currentMissingFields.push(field);
            }
        });

        setUnit(unitData); // Define a unidade para os modais
        setLastAction(actionType);

        if (currentMissingFields.length > 0) {
            setMissingFields(currentMissingFields);
            setIsJitModalOpen(true);
        } else {
            if (actionType === "REQUEST_VISIT") {
                openVisitCalendarModal();
            } else if (actionType === "REQUEST_RESERVATION") {
                openReservationConfirmModal();
            }
        }
    };

    useEffect(() => {
        const fetchPropertyData = async () => {
            setIsLoading(true);
            // TODO: Substituir mocks por chamadas reais à API/Firebase
            const prop = mockProperty; // await getPropertyById(id);
            setProperty(prop);
            const structure = mockUnitStructure; // await getUnitStructureForProperty(id);
            setUnitStructure(structure);
            setIsLoading(false);
        };
        if (id) {
            fetchPropertyData();
        }
    }, [id]);

    useEffect(() => {
        if (!selectedBlock || !selectedCategory) return;

        const fetchUnits = async () => {
            setIsLoadingUnits(true);
            // TODO: Substituir mock por chamada real
            const newUnits = mockUnits; // await getUnitsPaginated(id, { block: selectedBlock, category: selectedCategory });
            const nextCursor = "next-page-cursor"; // Simula cursor

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
        // TODO: Substituir mock por chamada real
        const newUnits = mockUnits.map(u => ({ ...u, id: u.id + "-more" })); // Simula novos dados
        const nextCursor = null; // Simula fim da lista

        setUnits(prev => [...prev, ...newUnits]);
        setCursor(nextCursor);
        setHasNextPage(!!nextCursor);
        setIsLoadingUnits(false);
    };

    const handleSelectUnitType = (block: string, category: string) => {
        setSelectedBlock(block);
        setSelectedCategory(category);
        setUnits([]);
        setCursor(null);
        setHasNextPage(true);
    };

    if (isLoading) {
        return (
             <div className="container mx-auto px-4 py-8 space-y-8 pt-20">
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
                        <Skeleton className="h-64 w-full" />
                        <Skeleton className="h-64 w-full" /> 
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
        return <div className="text-center py-12 pt-20">Imóvel não encontrado.</div>;
    }

    // Obter a URL do Matterport da propriedade (pegando a primeira, se houver)
    const propertyMatterportUrl = property.matterportUrl?.[0];

    return (
        <div className="py-15 bg-background text-foreground pt-20">
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

                        {/* Matterport Viewer Embutido */}
                         {propertyMatterportUrl && (
                            <div>
                                <h3 className="text-xl font-semibold text-primary mb-4">Tour 3D Imersivo</h3>
                                <EmbeddedMatterportViewer url={propertyMatterportUrl} />
                            </div>
                         )}


                        {/* Map Section - Usando GoogleMapComponent */}
                        <div>
                            <h3 className="text-2xl font-semibold text-primary mb-4">Localização</h3>
                            <div className="h-[800px] w-full rounded-lg overflow-hidden">
                                 {/* Passa a propriedade inteira, ou apenas a localização */}
                                <GoogleMapComponent properties={[property]} isLoading={false} />
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Unit List */}
                    <div className="lg:col-span-2">
                        {selectedBlock && selectedCategory ? (
                            <UnitList
                                units={units}
                                onLoadMore={handleLoadMore}
                                hasNextPage={hasNextPage}
                                isLoading={isLoadingUnits}
                                // REMOVIDO: onViewMatterport
                                handleGuardedAction={handleGuardedAction}
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

            {/* REMOVIDO: Modal MatterportViewer */}

            {/* JustInTime modal*/}
            <JustInTimeDataModal
                missingFields={missingFields}
                onClose={() => setIsJitModalOpen(false)}
                isOpen={isJitModalOpen}
                onSubmit={() => {
                    toast.success("Informações atualizadas com sucesso!");
                    setIsJitModalOpen(false);
                    refetchUserData(); // Rebusca dados após JIT

                    // Continua a ação original APÓS atualização
                    if (unit) { // Verifica se 'unit' ainda está definido
                         if (lastAction === "REQUEST_VISIT") {
                            openVisitCalendarModal();
                         } else if (lastAction === "REQUEST_RESERVATION") {
                            openReservationConfirmModal();
                         }
                    } else {
                         console.error("Estado 'unit' perdido após JIT modal.");
                         toast.error("Erro ao continuar ação. Tente novamente.");
                    }
                }}
            />


            {/* Request Visit Modal*/}
            {unit && property && ( // Garante que unit e property existem antes de renderizar
                <VisitModal
                    onClose={() => setVisitModal(false)}
                    unit={unit}
                    property={property}
                    onSubmit={() => setVisitModal(false)}
                    isOpen={visitModal}
                />
             )}


            {/* Request Reservation modal*/}
            {unit && property && ( // Garante que unit e property existem antes de renderizar
                <ReservationModal
                    onClose={() => setReservationModal(false)}
                    unit={unit}
                    property={property}
                    onSubmit={() => setReservationModal(false)}
                    isOpen={reservationModal}
                />
             )}
        </div>
    );
}


export default function PropertyPage() {
    return (
        // Envolve o conteúdo com o MapProvider
        <MapProvider>
            <PropertyPageContent />
        </MapProvider>
    );
}