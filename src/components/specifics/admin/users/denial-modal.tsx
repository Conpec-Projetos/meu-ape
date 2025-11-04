"use client";

import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";

interface DenialModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (reason: string) => void;
}

export function DenialModal({ isOpen, onClose, onConfirm }: DenialModalProps) {
    const [reason, setReason] = useState("");

    return (
        <AlertDialog open={isOpen} onOpenChange={onClose}>
            <AlertDialogContent className="w-[95vw] sm:max-w-md p-4 sm:p-6 rounded-md">
                <AlertDialogHeader>
                    <AlertDialogTitle>Negar Solicitação</AlertDialogTitle>
                    <AlertDialogDescription>
                        Por favor, forneça um motivo para negar a solicitação. O motivo será enviado para o solicitante.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <div className="grid w-full gap-1.5">
                    <Label htmlFor="reason">Motivo</Label>
                    <Textarea
                        id="reason"
                        value={reason}
                        onChange={e => setReason(e.target.value)}
                        placeholder="Digite o motivo da negação..."
                        className="min-h-28"
                    />
                </div>
                <AlertDialogFooter>
                    <AlertDialogCancel onClick={onClose} className="cursor-pointer">
                        Cancelar
                    </AlertDialogCancel>
                    <AlertDialogAction
                        onClick={() => onConfirm(reason)}
                        className="cursor-pointer"
                        disabled={!reason.trim()}
                    >
                        Confirmar Negação
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
