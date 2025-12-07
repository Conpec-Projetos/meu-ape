"use client";

import { Button } from "@/components/features/buttons/default-button";
import { PropertyLocationMap } from "@/components/features/maps/property-location-map";
import { JustInTimeDataModal } from "@/components/specifics/properties/justIn-time-data-modal";
import { PropertyHeader } from "@/components/specifics/properties/property-header";
import { PropertyImageGallery } from "@/components/specifics/properties/property-image-gallery";
import { ReservationModal } from "@/components/specifics/properties/reservation-modal";
import { UnitList, UnitSortDirection, UnitSortOption } from "@/components/specifics/properties/unit-list";
import { UnitSelector, UnitStructure } from "@/components/specifics/properties/unit-selector";
import { VisitModal } from "@/components/specifics/properties/visit-modal";
import { Skeleton } from "@/components/ui/skeleton";
import { actionRequirements } from "@/config/actionRequirements";
import { auth } from "@/firebase/firebase-config";
import { Property } from "@/interfaces/property";
import { Unit } from "@/interfaces/unit";
import { User } from "@/interfaces/user";
import { CalendarDays, ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

type DetailResponse = { property: Property; unitNavigation: UnitStructure };

function PropertyPageContent() {
    const params = useParams();
    const router = useRouter();
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
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [activeTourIndex, setActiveTourIndex] = useState(0);
    const [sortOption, setSortOption] = useState<UnitSortOption>("price");
    const [sortDirection, setSortDirection] = useState<UnitSortDirection>("asc");

    const refetchUserData = async () => {
        if (!auth.currentUser) {
            setCurrentUser(null);
            return null;
        }

        try {
            const response = await fetch("/api/user/profile", {
                method: "GET",
                credentials: "include",
                cache: "no-store",
            });

            if (!response.ok) {
                if (response.status === 401) {
                    setCurrentUser(null);
                    return null;
                }
                const errorPayload = await response.json().catch(() => null);
                console.error("Erro ao buscar dados do usuário:", errorPayload);
                setCurrentUser(null);
                return null;
            }

            const payload = await response.json();
            const data = (payload?.user as User) ?? null;
            setCurrentUser(data);
            return data;
        } catch (error) {
            console.error("Erro ao buscar dados do usuário:", error);
            setCurrentUser(null);
            return null;
        }
    };

    useEffect(() => {
        refetchUserData();
    }, []);

    useEffect(() => {
        setActiveTourIndex(0);
    }, [id]);

    const [visitModal, setVisitModal] = useState<boolean>(false);
    const [unit, setUnit] = useState<Unit>();
    const openVisitCalendarModal = () => setVisitModal(true);

    const [reservationModal, setReservationModal] = useState<boolean>(false);
    const openReservationConfirmModal = () => setReservationModal(true);

    const [isJitModalOpen, setIsJitModalOpen] = useState(false);
    const [missingFields, setMissingFields] = useState<string[]>([]);
    const [lastAction, setLastAction] = useState<string>("");

    const buildRedirectPath = () => {
        if (typeof window === "undefined") {
            return `/properties/${id}`;
        }
        return `${window.location.pathname}${window.location.search}`;
    };

    const handleGuardedAction = async (actionType: "REQUEST_VISIT" | "REQUEST_RESERVATION", unitData: Unit) => {
        if (!auth.currentUser) {
            const redirectPath = encodeURIComponent(buildRedirectPath());
            router.push(`/login?redirect=${redirectPath}`);
            return;
        }

        const required = actionRequirements[actionType];
        const userData = (await refetchUserData()) ?? currentUser;
        const currentMissingFields: string[] = [];
        const requiredDocs = ["addressProof", "incomeProof", "identityDoc", "bmCert"];
        const documentsRecord = (userData?.documents ?? {}) as Record<string, unknown>;
        const userRecord = (userData ?? {}) as Record<string, unknown>;

        required.forEach(field => {
            if (requiredDocs.includes(field)) {
                const docValue = documentsRecord[field];
                if (!Array.isArray(docValue) || docValue.length === 0) {
                    currentMissingFields.push(field);
                }
            } else {
                const profileValue = userRecord[field];
                if (
                    profileValue === undefined ||
                    profileValue === null ||
                    (typeof profileValue === "string" && profileValue.trim() === "")
                ) {
                    currentMissingFields.push(field);
                }
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

    const formatImportantDate = (value?: Date | string | null) => {
        if (!value) return null;
        const parsed = value instanceof Date ? value : new Date(value);
        if (Number.isNaN(parsed.getTime())) return null;
        return new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric" }).format(parsed);
    };

    const launchDateLabel = formatImportantDate(property?.launchDate ?? null);
    const deliveryDateLabel = formatImportantDate(property?.deliveryDate ?? null);

    const sortedUnits = useMemo(() => {
        const getMetric = (unit: Unit) => {
            if (sortOption === "price") return unit.price;
            if (sortOption === "size") return unit.size_sqm;
            return unit.floor;
        };

        return [...units].sort((a, b) => {
            const rawA = getMetric(a);
            const rawB = getMetric(b);
            const hasValueA = typeof rawA === "number" && !Number.isNaN(rawA);
            const hasValueB = typeof rawB === "number" && !Number.isNaN(rawB);

            if (!hasValueA && !hasValueB) return 0;
            if (!hasValueA) return 1;
            if (!hasValueB) return -1;

            const diff = (rawA as number) - (rawB as number);
            return sortDirection === "asc" ? diff : -diff;
        });
    }, [units, sortOption, sortDirection]);

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
        const isSameSelection = selectedBlock === block && selectedCategory === category;

        if (isSameSelection) {
            setSelectedBlock(undefined);
            setSelectedCategory(undefined);
        } else {
            setSelectedBlock(block);
            setSelectedCategory(category);
        }

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
    const hasMatterport = matterportUrls.length > 0;
    const activeMatterportUrl = matterportUrls[activeTourIndex] ?? null;
    const handleOpenMatterportFullscreen = () => {
        if (activeMatterportUrl) {
            window.open(activeMatterportUrl, "_blank", "noopener,noreferrer");
        }
    };
    const goToPreviousTour = () => {
        if (matterportUrls.length <= 1) return;
        setActiveTourIndex(prev => (prev - 1 + matterportUrls.length) % matterportUrls.length);
    };
    const goToNextTour = () => {
        if (matterportUrls.length <= 1) return;
        setActiveTourIndex(prev => (prev + 1) % matterportUrls.length);
    };
    const scrollToUnits = () => {
        if (typeof window === "undefined") return;
        document.getElementById("units-section")?.scrollIntoView({ behavior: "smooth" });
    };

    const unitListSection =
        selectedBlock && selectedCategory ? (
            <UnitList
                units={sortedUnits}
                onLoadMore={handleLoadMore}
                hasNextPage={hasNextPage}
                isLoading={isLoadingUnits}
                handleGuardedAction={handleGuardedAction}
                sortOption={sortOption}
                onSortChange={setSortOption}
                sortDirection={sortDirection}
                onSortDirectionChange={setSortDirection}
            />
        ) : (
            <div className="flex items-start justify-center h-full bg-secondary/30 rounded-xl p-8">
                <p className="text-muted-foreground text-center">
                    Selecione um bloco e uma tipologia para ver as unidades disponíveis.
                </p>
            </div>
        );

    return (
        <div className="py-15 bg-background text-foreground pt-20">
            <div className="container mx-auto px-4 py-8">
                <PropertyHeader id={property.id || ""} name={property.name} address={property.address} />
                {hasMatterport && activeMatterportUrl && (
                    <section className="mt-8 rounded-4xl border border-white/10 bg-slate-950 text-white shadow-2xl">
                        <div className="grid items-center gap-10 p-6 sm:p-10 lg:grid-cols-[1.05fr_0.95fr]">
                            <div>
                                <p className="text-sm uppercase tracking-[0.3em] text-primary/80">Tour 3D exclusivo</p>
                                <h2 className="mt-4 text-3xl font-semibold leading-tight sm:text-4xl">
                                    Explore o {property.name} sem sair de casa
                                </h2>
                                <p className="mt-4 text-base text-slate-200">
                                    Navegue pela planta real em alta definição, descubra acabamentos e tenha a noção
                                    exata de proporções antes mesmo da visita presencial.
                                </p>
                                <div className="mt-8 flex flex-wrap gap-4">
                                    <Button
                                        size="lg"
                                        className="cursor-pointer bg-primary text-primary-foreground"
                                        onClick={handleOpenMatterportFullscreen}
                                    >
                                        Ver em tela cheia
                                    </Button>
                                    <Button
                                        variant="secondary"
                                        size="lg"
                                        className="cursor-pointer bg-white/5 text-white hover:bg-white/10"
                                        onClick={scrollToUnits}
                                    >
                                        Ver unidades disponíveis
                                    </Button>
                                </div>
                            </div>
                            <div className="relative h-[360px] w-full overflow-hidden rounded-3xl border border-white/10 bg-black/40 shadow-2xl sm:h-[460px]">
                                <iframe
                                    src={activeMatterportUrl}
                                    title={`Tour 3D ${property.name}`}
                                    allowFullScreen
                                    loading="lazy"
                                    className="h-full w-full border-0"
                                />
                                <div className="pointer-events-none absolute inset-0 rounded-3xl border border-white/10" />
                                {matterportUrls.length > 1 && (
                                    <>
                                        <button
                                            type="button"
                                            className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-white/20 p-2 text-white backdrop-blur transition hover:bg-white/40 cursor-pointer"
                                            onClick={goToPreviousTour}
                                            aria-label="Ver tour anterior"
                                        >
                                            <ChevronLeft className="h-5 w-5" />
                                        </button>
                                        <button
                                            type="button"
                                            className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-white/20 p-2 text-white backdrop-blur transition hover:bg-white/40 cursor-pointer"
                                            onClick={goToNextTour}
                                            aria-label="Ver próximo tour"
                                        >
                                            <ChevronRight className="h-5 w-5" />
                                        </button>
                                        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-black/50 px-4 py-1 text-xs font-medium tracking-wide">
                                            {activeTourIndex + 1} / {matterportUrls.length}
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    </section>
                )}
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
                        {(launchDateLabel || deliveryDateLabel) && (
                            <div className="flex flex-col sm:flex-row gap-4">
                                {launchDateLabel && (
                                    <div className="relative overflow-hidden rounded-lg border border-primary/10 bg-white px-3 py-4 text-primary shadow-sm">
                                        <div className="flex items-center gap-2">
                                            <div className="rounded-full bg-white/10 p-1 text-primary">
                                                <Sparkles className="h-3.5 w-3.5" />
                                            </div>
                                            <div>
                                                <p className="text-[10px] uppercase tracking-[0.3em] text-primary/70">
                                                    Lançamento
                                                </p>
                                                <p className="text-sm font-medium text-primary mt-0.5">
                                                    {launchDateLabel}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                                {deliveryDateLabel && (
                                    <div className="relative overflow-hidden rounded-lg border border-primary/50 bg-slate-950 text-white px-3.5 py-2.5 shadow-lg">
                                        <div className="flex items-center gap-2.5">
                                            <div className="rounded-full bg-primary p-1.5 text-primary-foreground shadow-md shadow-primary/40">
                                                <CalendarDays className="h-[18px] w-[18px]" />
                                            </div>
                                            <div>
                                                <p className="text-[12px] uppercase tracking-[0.35em] text-secondary/80">
                                                    Entrega
                                                </p>
                                                <p className="text-xl font-semibold text-white mt-0.5">
                                                    {deliveryDateLabel}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
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
                        <div className="max-w-md" id="units-section">
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
                        <div className="mt-6 lg:hidden">{unitListSection}</div>
                        {property.areasImages && property.areasImages.length > 0 && (
                            <div className="space-y-4">
                                <h3 className="text-xl font-semibold text-primary">Áreas Comuns</h3>
                                <div className="shadow-lg rounded-xl overflow-hidden">
                                    <PropertyImageGallery
                                        images={property.areasImages}
                                        propertyName={`${property.name} - Areas Comuns`}
                                    />
                                </div>
                            </div>
                        )}
                        <div>
                            <h3 className="text-2xl font-semibold text-primary mb-4">Localização</h3>
                            <div className="h-[700px] w-full rounded-lg overflow-hidden">
                                <PropertyLocationMap property={property} />
                            </div>
                        </div>
                    </div>
                    <div className="lg:col-span-2 hidden lg:block">{unitListSection}</div>
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
