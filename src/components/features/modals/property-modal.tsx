'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import AdminPropertyManagementPage from './property-management-modal'

interface PropertyModalProps {
  isOpen: boolean
  onClose: () => void
}

export function PropertyModal({ isOpen, onClose }: PropertyModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[95vw] h-[95vh] flex flex-col">
        <DialogHeader>
          {/* O título já está na sua página, então podemos deixar este vazio ou remover */}
        </DialogHeader>
        <div className="flex-grow overflow-y-auto pr-6">
          <AdminPropertyManagementPage />
        </div>
      </DialogContent>
    </Dialog>
  )
}
