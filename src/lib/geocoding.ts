export type GeocodeResult = { lat: number; lng: number };

// Simple server-side geocoding using OpenStreetMap Nominatim.
// Respect usage policy: keep requests server-side, include a User-Agent, and rate limit in production.
export async function geocodeAddress(address: string): Promise<GeocodeResult | null> {
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
            // Avoid caching in edge/CDN during edits
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
