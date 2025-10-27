
"use client";

import { GoogleMap, useJsApiLoader, Marker } from "@react-google-maps/api";
import { GeoPoint } from "firebase/firestore";
import { Skeleton } from "@/components/ui/skeleton";

interface PropertyMapProps {
  location: GeoPoint;
}

const containerStyle = {
  width: "100%",
  height: "1000px",
  borderRadius: "0.5rem",
};

export function PropertyMap({ location }: PropertyMapProps) {
  const { isLoaded } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
  });

  const center = {
    lat: location.latitude,
    lng: location.longitude,
  };

  if (!isLoaded) {
    return <Skeleton className="w-full h-[400px] rounded-lg" />;
  }

  return (
    <div className="mt-8">
        <h3 className="text-2xl font-semibold text-primary mb-4">Localização</h3>
        <GoogleMap
            mapContainerStyle={containerStyle}
            center={center}
            zoom={15}
        >
            <Marker position={center} />
        </GoogleMap>
    </div>

  );
}
