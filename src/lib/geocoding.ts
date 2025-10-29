export type GeocodeResult = { lat: number; lng: number };

// ------------------------------
// Google Maps Platform helpers
// ------------------------------
// Prefer a server-side key, but gracefully fall back to other common env names
const GOOGLE_KEY = process.env.GOOGLE_MAPS_SECRET_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

// Geocode an address using Google Geocoding API (server-side)
export async function geocodeWithGoogle(address: string): Promise<GeocodeResult | null> {
    if (!GOOGLE_KEY || !address?.trim()) return null;
    try {
        const url = new URL("https://maps.googleapis.com/maps/api/geocode/json");
        url.searchParams.set("address", address);
        url.searchParams.set("key", GOOGLE_KEY);
        url.searchParams.set("language", "pt-BR");
        // Bias to Brazil (optional)
        url.searchParams.set("components", "country:BR");

        const res = await fetch(url.toString(), { cache: "no-store" });
        if (!res.ok) return null;
        const data = (await res.json()) as {
            status: string;
            results?: Array<{ geometry?: { location?: { lat: number; lng: number } } }>;
        };
        if (data.status !== "OK" || !data.results?.length) return null;
        const loc = data.results[0]?.geometry?.location;
        if (!loc || !Number.isFinite(loc.lat) || !Number.isFinite(loc.lng)) return null;
        return { lat: loc.lat, lng: loc.lng };
    } catch {
        return null;
    }
}

// Get coordinates from a Google Place ID using Places Details API (server-side)
export async function geocodePlaceId(placeId: string): Promise<GeocodeResult | null> {
    if (!GOOGLE_KEY || !placeId?.trim()) return null;
    try {
        const url = new URL("https://maps.googleapis.com/maps/api/place/details/json");
        url.searchParams.set("place_id", placeId);
        url.searchParams.set("fields", "geometry");
        url.searchParams.set("language", "pt-BR");
        url.searchParams.set("key", GOOGLE_KEY);
        const res = await fetch(url.toString(), { cache: "no-store" });
        if (!res.ok) return null;
        const data = (await res.json()) as {
            status: string;
            result?: { geometry?: { location?: { lat: number; lng: number } } };
        };
        if (data.status !== "OK") return null;
        const loc = data.result?.geometry?.location;
        if (!loc || !Number.isFinite(loc.lat) || !Number.isFinite(loc.lng)) return null;
        return { lat: loc.lat, lng: loc.lng };
    } catch {
        return null;
    }
}

// ------------------------------
// OpenStreetMap Nominatim (fallback)
// ------------------------------
// Respect usage policy: keep requests server-side, include a User-Agent, and rate limit in production.
export async function geocodeWithNominatim(address: string): Promise<GeocodeResult | null> {
    if (!address || !address.trim()) return null;
    try {
        const url = new URL("https://nominatim.openstreetmap.org/search");
        url.searchParams.set("format", "json");
        url.searchParams.set("q", address);
        url.searchParams.set("limit", "1");
        url.searchParams.set("addressdetails", "0");
        // Bias to Brazil; remove or change as needed
        url.searchParams.set("countrycodes", "br");

        const res = await fetch(url.toString(), {
            headers: {
                "User-Agent": "meu-ape/1.0 (geocoding)",
                "Accept-Language": "pt-BR",
            },
            cache: "no-store",
        });
        if (!res.ok) return null;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const data: any = await res.json();
        if (!Array.isArray(data) || data.length === 0) return null;
        const item = data[0];
        const lat = parseFloat(item.lat);
        const lng = parseFloat(item.lon);
        if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
        return { lat, lng };
    } catch {
        return null;
    }
}

// ------------------------------
// Smart geocoding entry points
// ------------------------------
// Try Google first for higher accuracy, then fallback to Nominatim.
export async function geocodeAddressSmart(address: string): Promise<GeocodeResult | null> {
    if (!address?.trim()) return null;
    // Prefer Google if key is available; fallback to Nominatim
    const google = await geocodeWithGoogle(address);
    if (google) return google;
    return geocodeWithNominatim(address);
}

// Try Place Details (if you have a placeId) then fallback to text-based approach.
export async function geocodeSmart(params: { placeId?: string; address?: string }): Promise<GeocodeResult | null> {
    const { placeId, address } = params;
    if (placeId) {
        const byPlace = await geocodePlaceId(placeId);
        if (byPlace) return byPlace;
    }
    if (address) return geocodeAddressSmart(address);
    return null;
}
