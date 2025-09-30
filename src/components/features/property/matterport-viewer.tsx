
"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface MatterportViewerProps {
  url: string;
  isOpen: boolean;
  onClose: () => void;
}

export function MatterportViewer({ url, isOpen, onClose }: MatterportViewerProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl h-[80vh]">
        <DialogHeader>
          <DialogTitle>Tour 3D Imersivo</DialogTitle>
        </DialogHeader>
        <iframe
          src={url}
          className="w-full h-full border-0"
          allowFullScreen
        ></iframe>
      </DialogContent>
    </Dialog>
  );
}
