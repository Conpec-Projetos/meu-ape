'use client';

import { Skeleton } from '@/components/ui/skeleton';
import { Property } from '@/interfaces/property';
import { PropertyCard } from './property-card';

interface PropertyListProps {
  properties: Property[];
  isLoading: boolean;
  innerRef?: (node?: Element | null) => void;
}

export function PropertyList({ properties, isLoading, innerRef }: PropertyListProps) {
  return (
    <div className="h-full flex flex-col">
      <div className="flex-grow overflow-y-auto p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-4">
          {isLoading
            ? Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-[350px] w-full" />)
            : properties.map((prop, index) => (
                <div key={prop.id} ref={properties.length === index + 1 ? innerRef : null}>
                  <PropertyCard property={prop} />
                </div>
              ))}
        </div>
      </div>
    </div>
  );
}