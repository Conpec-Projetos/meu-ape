"use client";

import AddressPreviewMap from "@/components/features/maps/address-preview-map";
import UnitTable from "@/components/specifics/admin/property/unit-table";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { deleteImages, uploadImagesInBatch } from "@/firebase/properties/service";
import { Property } from "@/interfaces/property";
import { Unit } from "@/interfaces/unit";
import { propertySchema } from "@/schemas/propertySchema";
import { useMapsLibrary } from "@vis.gl/react-google-maps";
import { Check, ChevronsUpDown, PlusCircle, Trash2, X } from "lucide-react";
import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import { ptBR } from "react-day-picker/locale";
import { toast } from "sonner";

interface PropertyManagementFormProps {
    property: Property | null;
    onSave: () => void;
    onClose: () => void;
}

export default function PropertyManagementForm({ property, onSave, onClose }: PropertyManagementFormProps) {
    type DraftUnit = Partial<Unit> & {
        floorPlanUrls?: string[];
        floorPlanPreviews?: string[];
        floorPlanFiles?: File[];
        floorPlanToRemove?: string[];
        status?: "new" | "updated" | "deleted";
        isAvailable?: boolean;
        imageFiles?: File[];
        imagePreviews?: string[];
        imagesToRemove?: string[];
    };

    const [form, setForm] = useState<Partial<Property>>({});
    const [units, setUnits] = useState<DraftUnit[]>([]);
    const [developerId, setDeveloperId] = useState<string | undefined>(undefined);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [placeId, setPlaceId] = useState<string | undefined>(undefined);
    const [addrPredictions, setAddrPredictions] = useState<Array<{ description: string; place_id: string }>>([]);
    const [addrOpen, setAddrOpen] = useState(false);
    const addrContainerRef = useRef<HTMLDivElement | null>(null);
    const [selectedCoords, setSelectedCoords] = useState<{ lat: number; lng: number } | null>(null);
    const [isAddrFocused, setIsAddrFocused] = useState(false);

    // Places Autocomplete
    const placesLib = useMapsLibrary("places");
    const autocompleteService = useMemo(() => {
        if (!placesLib || !google?.maps?.places?.AutocompleteService) return null;
        return new google.maps.places.AutocompleteService();
    }, [placesLib]);
    const placesServiceRef = useRef<google.maps.places.PlacesService | null>(null);

    useEffect(() => {
        if (!placesLib || !google?.maps?.places?.PlacesService) return;
        if (!placesServiceRef.current) {
            const dummy = document.createElement("div");
            placesServiceRef.current = new google.maps.places.PlacesService(dummy);
        }
    }, [placesLib]);

    const propertyImageInputRef = useRef<HTMLInputElement | null>(null);
    const areaImageInputRef = useRef<HTMLInputElement | null>(null);
    const [newPropertyImages, setNewPropertyImages] = useState<File[]>([]);
    const [newAreaImages, setNewAreaImages] = useState<File[]>([]);
    const [propertyImagePreviews, setPropertyImagePreviews] = useState<string[]>([]);
    const [areaImagePreviews, setAreaImagePreviews] = useState<string[]>([]);
    const [imagesToRemoveProperty, setImagesToRemoveProperty] = useState<string[]>([]);
    const [imagesToRemoveAreas, setImagesToRemoveAreas] = useState<string[]>([]);
    const [featureInput, setFeatureInput] = useState("");

    const [developers, setDevelopers] = useState<{ id: string; name: string }[]>([]);
    const [groups] = useState([
        { id: "corretores-sp", name: "Corretores SP" },
        { id: "corretores-rj", name: "Corretores RJ" },
    ]);

    const isValidCoords = (c: unknown): c is { lat: number; lng: number } => {
        const obj = c as { lat?: unknown; lng?: unknown };
        const lat = typeof obj?.lat === "number" ? obj.lat : Number.NaN;
        const lng = typeof obj?.lng === "number" ? obj.lng : Number.NaN;
        return Number.isFinite(lat) && Number.isFinite(lng) && !(lat === 0 && lng === 0);
    };

    useEffect(() => {
        if (property) {
            const {
                units: propertyUnits,
                developerId: propDeveloperId,
                ...restOfProperty
            } = property as Property & { units: Unit[]; developerId: string };
            setForm(restOfProperty);
            setUnits(propertyUnits || []);
            setDeveloperId(propDeveloperId);
            const rp = restOfProperty as Property;
            if (isValidCoords(rp?.location)) setSelectedCoords(rp.location);
            else setSelectedCoords(null);
        } else {
            setForm({
                name: "",
                address: "",
                description: "",
                propertyImages: [],
                areasImages: [],
                features: [],
                matterportUrls: [""],
                groups: [],
            });
            setUnits([]);
            setDeveloperId(undefined);
            setSelectedCoords(null);
        }
        setPlaceId(undefined);
        setNewPropertyImages([]);
        setNewAreaImages([]);
        setPropertyImagePreviews([]);
        setAreaImagePreviews([]);
        setImagesToRemoveProperty([]);
        setImagesToRemoveAreas([]);
    }, [property]);

    useEffect(() => {
        const address = (form.address || "").toString().trim();
        if (!placesServiceRef.current) return;
        if (selectedCoords && isValidCoords(selectedCoords)) return;
        if (isValidCoords(form.location)) {
            setSelectedCoords(form.location as { lat: number; lng: number });
            return;
        }
        if (!address || address.length < 3) return;

        let cancelled = false;
        placesServiceRef.current.findPlaceFromQuery({ query: address, fields: ["geometry"] }, (results, status) => {
            if (cancelled) return;
            if (
                status === google.maps.places.PlacesServiceStatus.OK &&
                Array.isArray(results) &&
                results[0]?.geometry?.location
            ) {
                const loc = results[0].geometry.location;
                const coords = { lat: loc.lat(), lng: loc.lng() };
                setSelectedCoords(coords);
            }
        });
        return () => {
            cancelled = true;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [placesServiceRef.current, form.address]);

    function addFeatureTag(raw?: string) {
        const value = (raw ?? featureInput).trim();
        if (!value) return;
        const lower = value.toLowerCase();
        const current = Array.isArray(form.features) ? form.features : [];
        const exists = current.some(f => (f || "").toLowerCase() === lower);
        if (exists) {
            setFeatureInput("");
            return;
        }
        setForm(prev => ({ ...prev, features: [...current, value] }));
        setFeatureInput("");
    }

    function removeFeatureTag(value: string) {
        const current = Array.isArray(form.features) ? form.features : [];
        setForm(prev => ({ ...prev, features: current.filter(f => f !== value) }));
    }

    useEffect(() => {
        let mounted = true;
        async function fetchDevelopers() {
            try {
                const res = await fetch(`/api/admin/developers`);
                if (!res.ok) return;
                const data = await res.json();
                if (!mounted) return;
                const list = Array.isArray(data) ? data : data?.developers || [];
                setDevelopers(
                    (list || []).map((d: unknown) => {
                        const dev = d as { id?: string; name?: string };
                        return { id: dev.id || "", name: dev.name || "" };
                    })
                );
            } catch (e) {
                console.error("Falha ao buscar construtoras:", e);
            }
        }
        fetchDevelopers();
        return () => {
            mounted = false;
        };
    }, []);

    useEffect(() => {
        async function fetchPropertyDetails() {
            if (!property?.id) return;
            try {
                const res = await fetch(`/api/admin/properties/${property.id}`);
                if (!res.ok) return;
                const data = await res.json();
                if (data?.developer_id && typeof data.developer_id === "string") {
                    setDeveloperId(data.developer_id);
                }
                const apiUnits: unknown = data?.units || [];
                if (Array.isArray(apiUnits) && (!Array.isArray(units) || units.length === 0)) {
                    const mapped = apiUnits.map((u: Record<string, unknown>) => {
                        const category = Array.isArray(u.category) ? (u.category[0] ?? "") : (u.category ?? "");
                        const draft: DraftUnit = {
                            id: u.id as string | undefined,
                            identifier: (u.identifier as string) || "",
                            block: (u.block as string | undefined) ?? undefined,
                            category,
                            price: typeof u.price === "number" ? (u.price as number) : Number(u.price) || 0,
                            size_sqm: typeof u.size_sqm === "number" ? (u.size_sqm as number) : Number(u.size_sqm) || 0,
                            bedrooms: typeof u.bedrooms === "number" ? (u.bedrooms as number) : Number(u.bedrooms) || 0,
                            suites: typeof u.suites === "number" ? (u.suites as number) : Number(u.suites) || 0,
                            garages: typeof u.garages === "number" ? (u.garages as number) : Number(u.garages) || 0,
                            baths: typeof u.baths === "number" ? (u.baths as number) : Number(u.baths) || 0,
                            floor:
                                typeof u.floor === "number"
                                    ? (u.floor as number)
                                    : u.floor !== undefined
                                      ? Number(u.floor)
                                      : undefined,
                            final: typeof u.final === "number" ? (u.final as number) : Number(u.final) || 0,
                            images: Array.isArray(u.images) ? (u.images as string[]) : [],
                            isAvailable: (u.is_available as boolean | undefined) ?? undefined,
                            floorPlanUrls: Array.isArray(u.floor_plan_urls) ? (u.floor_plan_urls as string[]) : [],
                        };
                        return draft;
                    });
                    setUnits(mapped);
                }
            } catch (e) {
                console.error("Falha ao buscar unidades da API:", e);
            }
        }
        fetchPropertyDetails();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [property?.id]);

    function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
        const { id, value, type } = e.target;
        const finalValue = type === "number" ? (value === "" ? null : Number(value)) : value;
        setForm({ ...form, [id]: finalValue });
        if (id === "address") {
            setPlaceId(undefined);
        }
    }

    const handleMatterportChange = (index: number, value: string) => {
        const updatedUrls = [...(form.matterportUrls || [])];
        updatedUrls[index] = value;
        setForm(prev => ({ ...prev, matterportUrls: updatedUrls }));
    };

    const addMatterportField = () => {
        setForm(prev => ({ ...prev, matterportUrls: [...(prev.matterportUrls || []), ""] }));
    };

    const removeMatterportField = (index: number) => {
        const updatedUrls = [...(form.matterportUrls || [])];
        updatedUrls.splice(index, 1);
        setForm(prev => ({ ...prev, matterportUrls: updatedUrls }));
    };

    function toYmdString(val?: unknown): string | undefined {
        if (!val) return undefined;
        try {
            if (typeof val === "string" && /^\d{4}-\d{2}-\d{2}$/.test(val)) return val;
            const d = typeof val === "string" ? new Date(val) : (val as Date);
            if (d instanceof Date && !isNaN(d.getTime())) {
                return new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate())).toISOString().split("T")[0];
            }
        } catch {
            return undefined;
        }
        return undefined;
    }

    function toIntOrUndefined(val: unknown): number | undefined {
        if (val === null || val === undefined || val === "") return undefined;
        const n = typeof val === "string" ? parseInt(val, 10) : (val as number);
        return Number.isFinite(n) ? n : undefined;
    }

    const coerceDate = (val: unknown): Date | undefined => {
        if (!val) return undefined;
        if (val instanceof Date) return val;
        if (typeof val === "string" || typeof val === "number") {
            const d = new Date(val);
            if (!isNaN(d.getTime())) return d;
        }
        return undefined;
    };

    function isUuid(value: unknown): value is string {
        return (
            typeof value === "string" &&
            /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/.test(value)
        );
    }

    function mapFormToSchemaShape() {
        return {
            developer_id: developerId,
            name: form.name || "",
            address: form.address || undefined,
            description: form.description || undefined,
            delivery_date: toYmdString(form.deliveryDate),
            launch_date: toYmdString(form.launchDate),
            features: Array.isArray(form.features) ? form.features : [],
            floors: toIntOrUndefined(form.floors),
            units_per_floor: toIntOrUndefined(form.unitsPerFloor),
            property_images: Array.isArray(form.propertyImages) ? form.propertyImages : [],
            areas_images: Array.isArray(form.areasImages) ? form.areasImages : [],
            matterport_urls: Array.isArray(form.matterportUrls) ? form.matterportUrls : [],
            groups: Array.isArray(form.groups) ? (form.groups as string[]).join(",") : undefined,
        };
    }

    function mapUnitToSnakeCase(u: DraftUnit): Record<string, unknown> {
        return {
            identifier: u.identifier || "",
            block: u.block || undefined,
            category: u.category || undefined,
            price: typeof u.price === "number" ? u.price : Number(u.price) || 0,
            size_sqm: typeof u.size_sqm === "number" ? u.size_sqm : Number(u.size_sqm) || 0,
            bedrooms: typeof u.bedrooms === "number" ? u.bedrooms : Number(u.bedrooms) || 0,
            suites: typeof u.suites === "number" ? u.suites : u.suites !== undefined ? Number(u.suites) : undefined,
            garages: typeof u.garages === "number" ? u.garages : Number(u.garages) || 0,
            baths: typeof u.baths === "number" ? u.baths : Number(u.baths) || 0,
            floor: typeof u.floor === "number" ? u.floor : u.floor !== undefined ? Number(u.floor) : undefined,
            final: typeof u.final === "number" ? u.final : u.final !== undefined ? Number(u.final) : undefined,
            images: Array.isArray(u.images) ? u.images : undefined,
            is_available: u.isAvailable ?? undefined,
            floor_plan_urls: u.floorPlanUrls || [],
        };
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setIsSubmitting(true);

        const propertyPayload = mapFormToSchemaShape();
        const result = propertySchema.safeParse(propertyPayload);

        if (!result.success) {
            setIsSubmitting(false);
            toast.error("Por favor, corrija os erros no formulário.");
            return;
        }

        try {
            let propertyId = property?.id;

            if (!propertyId) {
                const createRes = await fetch("/api/admin/properties", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        ...result.data,
                        placeId,
                        lat:
                            selectedCoords?.lat ??
                            (isValidCoords(form.location)
                                ? (form.location as { lat: number; lng: number }).lat
                                : undefined),
                        lng:
                            selectedCoords?.lng ??
                            (isValidCoords(form.location)
                                ? (form.location as { lat: number; lng: number }).lng
                                : undefined),
                        property_images: [],
                        areas_images: [],
                        units: [],
                    }),
                });
                if (!createRes.ok) {
                    const errorData = await safeJson(createRes);
                    throw new Error(errorData?.message || "Falha ao criar o imóvel.");
                }
                const created = await safeJson(createRes);
                if (created?.geocodingFailed) {
                    const createdId = created?.id || created?.property?.id || created?.data?.id;
                    toast.error("Falha ao geocodificar o endereço. Ajuste o endereço e tente novamente.");
                    if (createdId) {
                        try {
                            await fetch(`/api/admin/properties/${createdId}`, { method: "DELETE" });
                        } catch {
                        }
                    }
                    setIsSubmitting(false);
                    return;
                }
                propertyId = created?.id || created?.property?.id || created?.data?.id;
                if (!propertyId) {
                    throw new Error("O endpoint de criação não retornou o id do imóvel.");
                }
            }

            const toDelete = [...imagesToRemoveProperty, ...imagesToRemoveAreas];
            const unitDeletes = [
                ...units.flatMap(u => u.floorPlanToRemove || []),
                ...units.flatMap(u => u.imagesToRemove || []),
            ];
            const allDeletes = [...toDelete, ...unitDeletes];
            if (allDeletes.length) {
                await deleteImages(allDeletes);
            }

            const uploadedPropertyUrls = newPropertyImages.length
                ? await uploadImagesInBatch(newPropertyImages, propertyId)
                : [];
            const uploadedAreaUrls = newAreaImages.length ? await uploadImagesInBatch(newAreaImages, propertyId) : [];

            const unitsWithMedia = await Promise.all(
                units.map(async u => {
                    const fpFiles = u.floorPlanFiles || [];
                    const fpUploaded = fpFiles.length ? await uploadImagesInBatch(fpFiles, propertyId!) : [];
                    const fpKept = u.floorPlanUrls || [];
                    const finalFloorPlans = [...fpKept, ...fpUploaded];

                    const imgFiles = u.imageFiles || [];
                    const imgUploaded = imgFiles.length ? await uploadImagesInBatch(imgFiles, propertyId!) : [];
                    const keptImages = (u.images || []).filter(url => !(u.imagesToRemove || []).includes(url));
                    const finalImages = [...keptImages, ...imgUploaded];

                    return { ...u, floorPlanUrls: finalFloorPlans, images: finalImages } as DraftUnit;
                })
            );

            const currentPropertyUrls = (form.propertyImages || []).filter(
                url => !imagesToRemoveProperty.includes(url)
            );
            const currentAreaUrls = (form.areasImages || []).filter(url => !imagesToRemoveAreas.includes(url));

            const unitsPayload = unitsWithMedia.reduce(
                (acc: Array<{ id?: string; status: "new" | "updated" | "deleted"; [k: string]: unknown }>, u) => {
                    const hasValidId = isUuid(u.id);
                    if (u.status === "deleted") {
                        if (hasValidId) {
                            acc.push({ id: u.id as string, status: "deleted" });
                        }
                        return acc;
                    }
                    const base = mapUnitToSnakeCase(u);
                    if (!hasValidId) {
                        acc.push({ status: "new", ...base });
                    } else {
                        acc.push({ id: u.id as string, status: "updated", ...base });
                    }
                    return acc;
                },
                [] as Array<{ id?: string; status: "new" | "updated" | "deleted"; [k: string]: unknown }>
            );

            const finalBody = {
                ...result.data,
                placeId,
                lat:
                    selectedCoords?.lat ??
                    (isValidCoords(form.location) ? (form.location as { lat: number; lng: number }).lat : undefined),
                lng:
                    selectedCoords?.lng ??
                    (isValidCoords(form.location) ? (form.location as { lat: number; lng: number }).lng : undefined),
                property_images: [...currentPropertyUrls, ...uploadedPropertyUrls],
                areas_images: [...currentAreaUrls, ...uploadedAreaUrls],
                units: unitsPayload,
            };

            const updateRes = await fetch(`/api/admin/properties/${propertyId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(finalBody),
            });
            if (!updateRes.ok) {
                const errorData = await safeJson(updateRes);
                throw new Error(errorData?.message || "Falha ao salvar as imagens do imóvel.");
            }
            const updated = await safeJson(updateRes);
            if (updated?.geocodingFailed) {
                toast.error("Falha ao geocodificar o endereço. Ajuste o endereço e tente novamente.");
                setIsSubmitting(false);
                return;
            }

            toast.success(`Imóvel ${property ? "atualizado" : "criado"} com sucesso!`);
            onSave();
        } catch (err) {
            console.error(err);
            toast.error(err instanceof Error ? err.message : "Ocorreu um erro inesperado.");
        } finally {
            setIsSubmitting(false);
        }
    }

    useEffect(() => {
        if (!autocompleteService) return;
        const term = (form.address || "").toString().trim();
        if (!isAddrFocused || term.length < 3) {
            setAddrPredictions([]);
            setAddrOpen(false);
            return;
        }
        const controller = new AbortController();
        const timeout = setTimeout(() => {
            autocompleteService.getPlacePredictions(
                {
                    input: term,
                    componentRestrictions: { country: "br" },
                },
                (result, status) => {
                    if (controller.signal.aborted) return;
                    if (status === google.maps.places.PlacesServiceStatus.OK && Array.isArray(result)) {
                        const mapped = result.map(r => ({ description: r.description, place_id: r.place_id! }));
                        setAddrPredictions(mapped);
                        setAddrOpen(true);
                    } else {
                        setAddrPredictions([]);
                        setAddrOpen(false);
                    }
                }
            );
        }, 250);
        return () => {
            controller.abort();
            clearTimeout(timeout);
        };
    }, [form.address, autocompleteService, isAddrFocused]);

    useEffect(() => {
        const onDocClick = (e: MouseEvent) => {
            if (addrContainerRef.current && !addrContainerRef.current.contains(e.target as Node)) {
                setAddrOpen(false);
            }
        };
        document.addEventListener("mousedown", onDocClick);
        return () => document.removeEventListener("mousedown", onDocClick);
    }, []);

    const onPickAddress = async (p: { description: string; place_id: string }) => {
        setForm(prev => ({ ...prev, address: p.description }));
        setPlaceId(p.place_id);
        setAddrOpen(false);
        try {
            if (!placesServiceRef.current) return;
            await new Promise<void>(resolve => {
                placesServiceRef.current!.getDetails({ placeId: p.place_id, fields: ["geometry"] }, (res, status) => {
                    if (status === google.maps.places.PlacesServiceStatus.OK && res?.geometry?.location) {
                        const coords = {
                            lat: res.geometry.location.lat(),
                            lng: res.geometry.location.lng(),
                        };
                        setSelectedCoords(coords);
                    }
                    resolve();
                });
            });
        } catch (e) {
            console.error("Falha ao obter detalhes do local:", e);
        }
    };

    function onSelectImages(kind: "property" | "area", files: FileList | null) {
        if (!files || files.length === 0) return;
        const valid: File[] = [];
        Array.from(files).forEach(file => {
            const extOk = ["image/jpeg", "image/png"].includes(file.type);
            if (extOk) valid.push(file);
        });
        if (valid.length === 0) {
            toast.error("Selecione imagens .jpg ou .png");
            return;
        }
        const previews = valid.map(f => URL.createObjectURL(f));
        if (kind === "property") {
            setNewPropertyImages(prev => [...prev, ...valid]);
            setPropertyImagePreviews(prev => [...prev, ...previews]);
        } else {
            setNewAreaImages(prev => [...prev, ...valid]);
            setAreaImagePreviews(prev => [...prev, ...previews]);
        }
    }

    function removeExistingImage(kind: "property" | "area", url: string) {
        if (kind === "property") {
            setImagesToRemoveProperty(prev => [...prev, url]);
            setForm(prev => ({ ...prev, propertyImages: (prev.propertyImages || []).filter(u => u !== url) }));
        } else {
            setImagesToRemoveAreas(prev => [...prev, url]);
            setForm(prev => ({ ...prev, areasImages: (prev.areasImages || []).filter(u => u !== url) }));
        }
    }

    function removeNewImage(kind: "property" | "area", index: number) {
        if (kind === "property") {
            setNewPropertyImages(prev => prev.filter((_, i) => i !== index));
            const url = propertyImagePreviews[index];
            URL.revokeObjectURL(url);
            setPropertyImagePreviews(prev => prev.filter((_, i) => i !== index));
        } else {
            setNewAreaImages(prev => prev.filter((_, i) => i !== index));
            const url = areaImagePreviews[index];
            URL.revokeObjectURL(url);
            setAreaImagePreviews(prev => prev.filter((_, i) => i !== index));
        }
    }

    async function safeJson(res: Response) {
        try {
            return await res.json();
        } catch {
            return null;
        }
    }

    return (
        <div className="w-full flex flex-col">
            <form className="grid grid-cols-1 xl:grid-cols-2 gap-8" onSubmit={handleSubmit}>
                {/* Coluna esquerda */}
                <div className="flex flex-col gap-6">
                    <div className="space-y-2">
                        <h3 className="text-sm font-medium">Dados do empreendimento</h3>
                        <p className="text-sm text-muted-foreground">Informações básicas e descrição do imóvel.</p>
                    </div>

                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">
                                Nome do empreendimento <span className="text-red-500">*</span>
                            </Label>
                            <Input id="name" value={form.name || ""} onChange={handleChange} aria-required="true" />
                        </div>
                        <div className="space-y-2" ref={addrContainerRef}>
                            <Label htmlFor="address">Localização</Label>
                            <div className="relative">
                                <Input
                                    id="address"
                                    value={form.address || ""}
                                    onChange={handleChange}
                                    onFocus={() => setIsAddrFocused(true)}
                                    onBlur={() => {
                                        setIsAddrFocused(false);
                                        setAddrOpen(false);
                                    }}
                                />
                                {addrOpen && addrPredictions.length > 0 && (
                                    <div className="absolute z-20 mt-1 w-full rounded-md border bg-background shadow">
                                        <ul className="max-h-72 overflow-auto py-1">
                                            {addrPredictions.map(p => (
                                                <li
                                                    key={p.place_id}
                                                    className="px-3 py-2 text-sm hover:bg-muted cursor-pointer"
                                                    onMouseDown={e => e.preventDefault()}
                                                    onClick={() => onPickAddress(p)}
                                                >
                                                    {p.description}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>
                            {/* Preview map */}
                            <div className="mt-3">
                                <AddressPreviewMap
                                    center={
                                        selectedCoords ?? (form.location as { lat: number; lng: number } | undefined)
                                    }
                                    marker={
                                        (selectedCoords ??
                                            (form.location as { lat: number; lng: number } | undefined)) ||
                                        null
                                    }
                                    className="h-48 w-full rounded border"
                                />
                                {(selectedCoords || form.location) && (
                                    <p className="mt-2 text-xs text-muted-foreground">
                                        {(() => {
                                            const coords =
                                                selectedCoords ||
                                                (form.location as { lat: number; lng: number } | undefined);
                                            if (!coords) return null;
                                            return (
                                                <>
                                                    Coordenadas: {coords.lat.toFixed(6)}, {coords.lng.toFixed(6)}
                                                </>
                                            );
                                        })()}
                                    </p>
                                )}
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="description">Descrição</Label>
                            <Textarea id="description" value={form.description || ""} onChange={handleChange} />
                        </div>

                        {/* Features (tags) */}
                        <div className="space-y-2">
                            <Label htmlFor="featureInput">Características</Label>
                            <div className="flex items-center gap-2">
                                <Input
                                    id="featureInput"
                                    value={featureInput}
                                    onChange={e => setFeatureInput(e.target.value)}
                                    onKeyDown={e => {
                                        if (e.key === "Enter") {
                                            e.preventDefault();
                                            addFeatureTag();
                                        }
                                    }}
                                    placeholder="Digite e pressione Enter"
                                />
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => addFeatureTag()}
                                    className="cursor-pointer"
                                >
                                    <PlusCircle className="h-4 w-4 mr-2" /> Adicionar
                                </Button>
                            </div>
                            {Array.isArray(form.features) && form.features.length > 0 && (
                                <div className="flex flex-wrap gap-2">
                                    {form.features.map((feat, idx) => (
                                        <span
                                            key={`${feat}-${idx}`}
                                            className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-1 text-xs"
                                        >
                                            {feat}
                                            <button
                                                type="button"
                                                aria-label={`Remover ${feat}`}
                                                className="ml-1 text-muted-foreground hover:text-foreground cursor-pointer"
                                                onClick={() => removeFeatureTag(feat)}
                                            >
                                                <X className="text-red-400 h-3 w-3" />
                                            </button>
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <DatePicker
                                id="launchDate"
                                label="Data de lançamento"
                                value={coerceDate(form.launchDate)}
                                onChange={d => setForm(prev => ({ ...prev, launchDate: d || undefined }))}
                                locale={ptBR}
                            />
                            <DatePicker
                                id="deliveryDate"
                                label="Data de entrega"
                                value={coerceDate(form.deliveryDate)}
                                onChange={d => setForm(prev => ({ ...prev, deliveryDate: d || undefined }))}
                                locale={ptBR}
                            />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="floors">Nº de pavimentos</Label>
                                <Input id="floors" value={form.floors || ""} onChange={handleChange} type="text" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="unitsPerFloor">Unidades por pavimento</Label>
                                <Input
                                    id="unitsPerFloor"
                                    value={form.unitsPerFloor || ""}
                                    onChange={handleChange}
                                    type="text"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <h4 className="text-sm font-medium">Scans 3D Matterport</h4>
                        <div className="space-y-2">
                            {form.matterportUrls?.map((url, index) => (
                                <div key={index} className="flex items-center gap-2">
                                    <Input
                                        value={url}
                                        onChange={e => handleMatterportChange(index, e.target.value)}
                                        placeholder="https://my.matterport.com/..."
                                    />
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => removeMatterportField(index)}
                                        aria-label="Remover URL"
                                        className="cursor-pointer"
                                    >
                                        <Trash2 className="h-4 w-4 text-red-500" />
                                    </Button>
                                </div>
                            ))}
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="cursor-pointer w-fit"
                                onClick={addMatterportField}
                            >
                                <PlusCircle className="h-4 w-4 mr-2" />
                                Adicionar URL
                            </Button>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <h4 className="text-sm font-medium">Visibilidade</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>
                                    Construtora <span className="text-red-500">*</span>
                                </Label>
                                <Select value={developerId || ""} onValueChange={value => setDeveloperId(value)}>
                                    <SelectTrigger aria-required="true" className="cursor-pointer">
                                        <SelectValue placeholder="Selecione" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {developers.map(dev => (
                                            <SelectItem key={dev.id} value={dev.id} className="cursor-pointer">
                                                {dev.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Grupos Visíveis</Label>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="outline" className="w-full justify-between cursor-pointer">
                                            {form.groups?.length || 0} selecionados
                                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent className="w-[--radix-dropdown-menu-trigger-width]">
                                        {groups.map(group => (
                                            <DropdownMenuCheckboxItem
                                                key={group.id}
                                                checked={form.groups?.includes(group.id)}
                                                onCheckedChange={checked => {
                                                    const newGroups = checked
                                                        ? [...(form.groups || []), group.id]
                                                        : form.groups?.filter(id => id !== group.id);
                                                    setForm(prev => ({ ...prev, groups: newGroups }));
                                                }}
                                                className="cursor-pointer"
                                            >
                                                {group.name}
                                            </DropdownMenuCheckboxItem>
                                        ))}
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <h4 className="text-sm font-medium">Mídia</h4>
                        <div className="grid grid-cols-1 gap-6">
                            {/* Property Images */}
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <Label>Imagens do Imóvel</Label>
                                    <div>
                                        <input
                                            ref={propertyImageInputRef}
                                            type="file"
                                            accept="image/jpeg,image/png"
                                            multiple
                                            className="hidden"
                                            onChange={e => onSelectImages("property", e.target.files)}
                                        />
                                        <Button
                                            type="button"
                                            variant="outline"
                                            className="w-fit cursor-pointer"
                                            onClick={() => propertyImageInputRef.current?.click()}
                                        >
                                            Adicionar Imagens +
                                        </Button>
                                    </div>
                                </div>

                                {/* Existing property images */}
                                {form.propertyImages && form.propertyImages.length > 0 && (
                                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                                        {form.propertyImages.map((url, idx) => (
                                            <div key={`prop-existing-${idx}`} className="relative group">
                                                <Image
                                                    src={url}
                                                    alt="Imagem do imóvel"
                                                    width={500}
                                                    height={500}
                                                    className="h-28 w-full object-cover rounded"
                                                />
                                                <button
                                                    type="button"
                                                    className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity bg-black/60 text-white text-xs px-2 py-1 rounded cursor-pointer"
                                                    onClick={() => removeExistingImage("property", url)}
                                                >
                                                    Remover
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* New property images previews */}
                                {propertyImagePreviews.length > 0 && (
                                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                                        {propertyImagePreviews.map((url, idx) => (
                                            <div key={`prop-new-${idx}`} className="relative group">
                                                <Image
                                                    src={url}
                                                    alt="Preview"
                                                    width={500}
                                                    height={500}
                                                    className="h-28 w-full object-cover rounded"
                                                />
                                                <button
                                                    type="button"
                                                    className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity bg-black/60 text-white text-xs px-2 py-1 rounded cursor-pointer"
                                                    onClick={() => removeNewImage("property", idx)}
                                                >
                                                    Remover
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Areas Images */}
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <Label>Imagens das Áreas Comuns</Label>
                                    <div>
                                        <input
                                            ref={areaImageInputRef}
                                            type="file"
                                            accept="image/jpeg,image/png"
                                            multiple
                                            className="hidden"
                                            onChange={e => onSelectImages("area", e.target.files)}
                                        />
                                        <Button
                                            type="button"
                                            variant="outline"
                                            className="w-fit cursor-pointer"
                                            onClick={() => areaImageInputRef.current?.click()}
                                        >
                                            Adicionar Imagens +
                                        </Button>
                                    </div>
                                </div>

                                {/* Existing area images */}
                                {form.areasImages && form.areasImages.length > 0 && (
                                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                                        {form.areasImages.map((url, idx) => (
                                            <div key={`area-existing-${idx}`} className="relative group">
                                                <Image
                                                    src={url}
                                                    alt="Imagem da área comum"
                                                    width={500}
                                                    height={500}
                                                    className="h-28 w-full object-cover rounded"
                                                />
                                                <button
                                                    type="button"
                                                    className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity bg-black/60 text-white text-xs px-2 py-1 rounded cursor-pointer"
                                                    onClick={() => removeExistingImage("area", url)}
                                                >
                                                    Remover
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* New area images previews */}
                                {areaImagePreviews.length > 0 && (
                                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                                        {areaImagePreviews.map((url, idx) => (
                                            <div key={`area-new-${idx}`} className="relative group">
                                                <Image
                                                    src={url}
                                                    alt="Preview"
                                                    width={500}
                                                    height={500}
                                                    className="h-28 w-full object-cover rounded"
                                                />
                                                <button
                                                    type="button"
                                                    className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity bg-black/60 text-white text-xs px-2 py-1 rounded cursor-pointer"
                                                    onClick={() => removeNewImage("area", idx)}
                                                >
                                                    Remover
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Coluna direita (Unidades) */}
                <div className="flex flex-col gap-4">
                    <UnitTable units={units} onUnitsChange={updatedUnits => setUnits(updatedUnits)} />
                </div>

                {/* Barra de ações sticky */}
                <div className="col-span-full sticky -bottom-6 z-10 mt-2 border-t bg-background/80 backdrop-blur supports-backdrop-filter:bg-background/60">
                    <div className="flex justify-end gap-3 p-4">
                        <p className="text-xs text-muted-foreground mr-auto self-center">
                            Campos marcados com * são obrigatórios.
                        </p>
                        <Button
                            variant="outline"
                            type="button"
                            onClick={onClose}
                            disabled={isSubmitting}
                            className="cursor-pointer"
                        >
                            <X className="w-5 h-5" /> Cancelar
                        </Button>
                        <Button type="submit" disabled={isSubmitting} className="cursor-pointer">
                            <Check className="w-5 h-5 r" /> {isSubmitting ? "Salvando..." : "Salvar"}
                        </Button>
                    </div>
                </div>
            </form>
        </div>
    );
}
