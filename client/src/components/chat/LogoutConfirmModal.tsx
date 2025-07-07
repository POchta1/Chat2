import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { LogOut, X } from 'lucide-react';

interface LogoutConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export default function LogoutConfirmModal({ isOpen, onClose, onConfirm }: LogoutConfirmModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-slate-800 border-slate-600 text-white">
        <DialogHeader className="text-center">
          <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <LogOut className="w-8 h-8 text-white" />
          </div>
          <DialogTitle className="text-xl font-semibold text-white">
            Подтверждение выхода
          </DialogTitle>
          <DialogDescription className="text-gray-400 mt-2">
            Вы уверены, что хотите выйти из приложения? Вы будете перенаправлены на страницу входа.
          </DialogDescription>
        </DialogHeader>
        
        <DialogFooter className="flex flex-col sm:flex-row gap-2 mt-6">
          <Button
            variant="outline"
            onClick={onClose}
            className="flex-1 bg-slate-700 hover:bg-slate-600 text-white border-slate-600"
          >
            <X className="w-4 h-4 mr-2" />
            Отменить
          </Button>
          <Button
            onClick={onConfirm}
            className="flex-1 bg-red-600 hover:bg-red-700 text-white"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Да, выйти
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}