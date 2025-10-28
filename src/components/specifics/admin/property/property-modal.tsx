"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Property } from "@/interfaces/property";
import PropertyManagementForm from "./property-management-modal";

interface PropertyModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: () => void;
    property: Property | null;
}

export function PropertyModal({ isOpen, onClose, onSave, property }: PropertyModalProps) {
    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            {/* Ensure the modal is wide enough across breakpoints and not constrained by default sm:max-w-lg */}
            <DialogContent className="w-[95vw] sm:max-w-[95vw] md:max-w-3xl lg:max-w-5xl xl:max-w-6xl 2xl:max-w-[1700px] max-w-[1200px] h-[90vh] p-0 overflow-hidden rounded-lg">
                <DialogHeader className="sticky top-0 z-10 border-b bg-background/80 backdrop-blur supports-backdrop-filter:bg-background/60 px-6 py-4">
                    <DialogTitle className="text-lg font-semibold tracking-tight">
                        {property ? "Editar Imóvel" : "Adicionar Novo Imóvel"}
                    </DialogTitle>
                </DialogHeader>
                <div className="flex-1 overflow-y-auto p-6">
                    <PropertyManagementForm property={property} onSave={onSave} onClose={onClose} />
                </div>
            </DialogContent>
        </Dialog>
    );
}
