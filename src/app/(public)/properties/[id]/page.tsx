"use client";

import { Button } from "@/components/features/buttons/default-button";
import { PropertyLocationMap } from "@/components/features/maps/property-location-map";
import { EmbeddedMatterportViewer } from "@/components/specifics/properties/embedded-matterport-viewer";
import { JustInTimeDataModal } from "@/components/specifics/properties/justIn-time-data-modal";
import { MatterportGallery } from "@/components/specifics/properties/matterport-gallery";
import { PropertyHeader } from "@/components/specifics/properties/property-header";
import { PropertyImageGallery } from "@/components/specifics/properties/property-image-gallery";
import { ReservationModal } from "@/components/specifics/properties/reservation-modal";
import { UnitList } from "@/components/specifics/properties/unit-list";
import { UnitSelector, UnitStructure } from "@/components/specifics/properties/unit-selector";
import { VisitModal } from "@/components/specifics/properties/visit-modal";
import { Skeleton } from "@/components/ui/skeleton";
import { actionRequirements } from "@/config/actionRequirements";
import { auth, db } from "@/firebase/firebase-config";
import { Property } from "@/interfaces/property";
import { Unit } from "@/interfaces/unit";
import { doc, DocumentData, getDoc } from "firebase/firestore";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

type DetailResponse = { property: Property; unitNavigation: UnitStructure };

function PropertyPageContent() {
    const params = useParams();
    const id = params.id as string;
    const [property, setProperty] = useState<Property | null>(null);
    const [unitStructure, setUnitStructure] = useState<UnitStructure | null>(null);
    const [units, setUnits] = useState<Unit[]>([]);
    const [selectedBlock, setSelectedBlock] = useState<string | undefined>();
    const [selectedCategory, setSelectedCategory] = useState<string | undefined>();
    const [cursor, setCursor] = useState<{ identifier: string; id: string } | null>(null);
    const [hasNextPage, setHasNextPage] = useState(true);
    const [isLoading, setIsLoading] = useState(true);
    const [isLoadingUnits, setIsLoadingUnits] = useState(false);
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
        await refetchUserData();
        const userData = currentUser;
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
            try {
                setIsLoading(true);
                const res = await fetch(`/api/properties/${id}`);
                if (!res.ok) throw new Error("Falha ao carregar dados do imóvel");
                const data: DetailResponse = await res.json();
                setProperty(data.property);
                setUnitStructure(data.unitNavigation);
            } catch (e) {
                console.error(e);
                setProperty(null);
            } finally {
                setIsLoading(false);
            }
        };
        if (id) fetchPropertyData();
    }, [id]);

    useEffect(() => {
        if (!selectedBlock || !selectedCategory) return;
        const fetchUnits = async () => {
            try {
                setIsLoadingUnits(true);
                const url = new URL(`/api/properties/${id}/units`, window.location.origin);
                url.searchParams.set("block", selectedBlock);
                url.searchParams.set("category", selectedCategory);
                const res = await fetch(url.toString());
                if (!res.ok) throw new Error("Falha ao carregar unidades");
                const data: {
                    units: Unit[];
                    nextCursor: { identifier: string; id: string } | null;
                    hasNextPage: boolean;
                } = await res.json();
                setUnits(data.units);
                setCursor(data.nextCursor);
                setHasNextPage(data.hasNextPage);
            } catch (e) {
                console.error(e);
                setUnits([]);
                setCursor(null);
                setHasNextPage(false);
            } finally {
                setIsLoadingUnits(false);
            }
        };
        fetchUnits();
    }, [selectedBlock, selectedCategory, id]);

    const handleLoadMore = async () => {
        if (!hasNextPage || isLoadingUnits || !selectedBlock || !selectedCategory || !cursor) return;
        try {
            setIsLoadingUnits(true);
            const url = new URL(`/api/properties/${id}/units`, window.location.origin);
            url.searchParams.set("block", selectedBlock);
            url.searchParams.set("category", selectedCategory);
            url.searchParams.set("cursorIdentifier", cursor.identifier);
            url.searchParams.set("cursorId", cursor.id);
            const res = await fetch(url.toString());
            if (!res.ok) throw new Error("Falha ao carregar mais unidades");
            const data: { units: Unit[]; nextCursor: { identifier: string; id: string } | null; hasNextPage: boolean } =
                await res.json();
            setUnits(prev => [...prev, ...data.units]);
            setCursor(data.nextCursor);
            setHasNextPage(data.hasNextPage);
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoadingUnits(false);
        }
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

    const matterportUrls = property.matterportUrls ?? [];

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
                        <div>
                            <h3 className="text-xl font-semibold text-primary mb-4">Área Comum</h3>
                            <div className="my-8 px-0">
                                <div className="shadow-lg rounded-xl overflow-hidden">
                                    <PropertyImageGallery images={property.areasImages || []} propertyName={property.name} />
                                </div>
                            </div>                            
                        </div>
                        {matterportUrls.length > 0 && (
                            <div>
                                <h3 className="text-xl font-semibold text-primary mb-4">Tour 3D Imersivo</h3>
                                {matterportUrls.length > 1 ? (
                                    <MatterportGallery urls={matterportUrls} />
                                ) : (
                                    <EmbeddedMatterportViewer url={matterportUrls[0]} />
                                )}
                            </div>
                        )}
                        <div>
                            <h3 className="text-2xl font-semibold text-primary mb-4">Localização</h3>
                            <div className="h-[800px] w-full rounded-lg overflow-hidden">
                                <PropertyLocationMap property={property} />
                            </div>
                        </div>
                    </div>
                    <div className="lg:col-span-2">
                        {selectedBlock && selectedCategory ? (
                            <UnitList
                                units={units}
                                onLoadMore={handleLoadMore}
                                hasNextPage={hasNextPage}
                                isLoading={isLoadingUnits}
                                handleGuardedAction={handleGuardedAction}
                            />
                        ) : (
                            <div className="flex items-start justify-center h-full bg-secondary/30 rounded-xl p-8">
                                <p className="text-muted-foreground text-center">
                                    Selecione um bloco e uma tipologia para ver as unidades disponíveis.
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <JustInTimeDataModal
                missingFields={missingFields}
                onClose={() => setIsJitModalOpen(false)}
                isOpen={isJitModalOpen}
                onSubmit={() => {
                    toast.success("Informações atualizadas com sucesso!");
                    setIsJitModalOpen(false);
                    refetchUserData();
                    if (unit) {
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

            {unit && property && (
                <VisitModal
                    onClose={() => setVisitModal(false)}
                    unit={unit}
                    property={property}
                    onSubmit={() => setVisitModal(false)}
                    isOpen={visitModal}
                />
            )}

            {unit && property && (
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
    return <PropertyPageContent />;
}
