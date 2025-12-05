"use client";

import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useFavorites } from "@/hooks/use-favorites";
import { cn } from "@/lib/utils";
import { Heart } from "lucide-react";

interface PropertyHeaderProps {
    id: string;
    name: string;
    address: string;
}

export function PropertyHeader({ id, name, address }: PropertyHeaderProps) {
    const { toggleFavorite, isFavorited, isLoading } = useFavorites();

    return (
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
            <div className="space-y-1">
                <div className="flex items-center gap-3">
                    <h1 className="text-3xl font-bold text-primary">{name}</h1>
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button 
                                    variant="outline" 
                                    size="icon" 
                                    className="rounded-full h-9 w-9 cursor-pointer"
                                    onClick={() => toggleFavorite(id)}
                                    disabled={isLoading}
                                >
                                    <Heart className={cn(
                                        isFavorited(id) ? "fill-primary" : ""
                                    )}/>
                                    <span className="sr-only">Favorite</span>
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                                {isFavorited(id) ? (
                                    <p>Remover dos favoritos</p>
                                ) : (
                                    <p>Adicionar aos favoritos</p>
                                )}
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                </div>
                <p className="text-muted-foreground mt-1">{address}</p>
            </div>
        </div>
    );
}
