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
            <DialogContent className="sm:max-w-[95vw] h-[95vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>{property ? "Editar Imóvel" : "Adicionar Novo Imóvel"}</DialogTitle>
                </DialogHeader>
                <div className="grow overflow-y-auto pr-6">
                    <PropertyManagementForm property={property} onSave={onSave} onClose={onClose} />
                </div>
            </DialogContent>
        </Dialog>
    );
}
