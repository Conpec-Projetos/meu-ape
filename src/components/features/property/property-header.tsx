
"use client";

import { Button } from "@/components/ui/button";
import { Heart } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface PropertyHeaderProps {
  name: string;
  address: string;
}

export function PropertyHeader({ name, address }: PropertyHeaderProps) {
  return (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
      <div className="space-y-1">
        <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold text-primary">{name}</h1>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="icon" className="rounded-full h-9 w-9">
                    <Heart className="h-4 w-4" />
                    <span className="sr-only">Favorite</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Adicionar aos favoritos</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
        </div>
        <p className="text-muted-foreground mt-1">{address}</p>
      </div>
    </div>
  );
}
