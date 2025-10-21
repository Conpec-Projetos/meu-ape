import { APIProvider } from "@vis.gl/react-google-maps";
import { ReactNode } from "react";

export function MapProvider({ children }: { children: ReactNode }) {
    return (
        <APIProvider apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!} onLoad={() => console.log("Maps API has loaded.")}>
            {children}
        </APIProvider>
    );
}
