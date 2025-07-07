import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, X } from 'lucide-react';

interface NewChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateChat: (chatName: string) => void;
}

export default function NewChatModal({ isOpen, onClose, onCreateChat }: NewChatModalProps) {
  const [chatName, setChatName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (chatName.trim()) {
      onCreateChat(chatName.trim());
      setChatName('');
      onClose();
    }
  };

  const handleClose = () => {
    setChatName('');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md bg-slate-800 border-slate-600 text-white">
        <DialogHeader className="text-center">
          <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Plus className="w-8 h-8 text-white" />
          </div>
          <DialogTitle className="text-xl font-semibold text-white">
            Создать новый чат
          </DialogTitle>
          <DialogDescription className="text-gray-400 mt-2">
            Введите название для нового чата
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="chatName" className="text-sm font-medium text-gray-300">
              Название чата
            </Label>
            <Input
              id="chatName"
              value={chatName}
              onChange={(e) => setChatName(e.target.value)}
              placeholder="Введите название чата..."
              className="bg-slate-700 border-slate-600 text-white placeholder-gray-400 focus:border-blue-500 focus:ring-blue-500"
              autoFocus
              required
            />
          </div>
          
          <DialogFooter className="flex flex-col sm:flex-row gap-2 mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              className="flex-1 bg-slate-700 hover:bg-slate-600 text-white border-slate-600"
            >
              <X className="w-4 h-4 mr-2" />
              Отменить
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
              disabled={!chatName.trim()}
            >
              <Plus className="w-4 h-4 mr-2" />
              Создать чат
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}