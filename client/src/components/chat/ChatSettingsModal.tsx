import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Settings, Users, UserPlus, UserMinus, Trash2, Edit3, Crown } from 'lucide-react';
import type { ChatRoom } from '@/pages/chat';

interface ChatSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  room: ChatRoom;
  onUpdateRoom?: (roomId: number, data: { name?: string }) => void;
  onDeleteRoom?: (roomId: number) => void;
}

export default function ChatSettingsModal({ 
  isOpen, 
  onClose, 
  room,
  onUpdateRoom,
  onDeleteRoom 
}: ChatSettingsModalProps) {
  const [roomName, setRoomName] = useState(room.name);
  const [newMemberUsername, setNewMemberUsername] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  const handleUpdateRoomName = () => {
    if (roomName.trim() && roomName !== room.name) {
      onUpdateRoom?.(room.id, { name: roomName.trim() });
    }
  };

  const handleAddMember = () => {
    if (newMemberUsername.trim()) {
      // TODO: Implement add member functionality
      console.log('Adding member:', newMemberUsername);
      setNewMemberUsername('');
    }
  };

  const handleDeleteRoom = () => {
    if (isDeleting) {
      onDeleteRoom?.(room.id);
      onClose();
    } else {
      setIsDeleting(true);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-slate-800 border-slate-600 text-white">
        <DialogHeader className="text-center">
          <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Settings className="w-8 h-8 text-white" />
          </div>
          <DialogTitle className="text-xl font-semibold text-white">
            Настройки чата
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            {room.name}
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="general" className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-slate-700">
            <TabsTrigger value="general" className="text-gray-300 data-[state=active]:bg-blue-600 data-[state=active]:text-white">
              <Settings className="w-4 h-4 mr-2" />
              Общие
            </TabsTrigger>
            <TabsTrigger value="members" className="text-gray-300 data-[state=active]:bg-blue-600 data-[state=active]:text-white">
              <Users className="w-4 h-4 mr-2" />
              Участники
            </TabsTrigger>
            <TabsTrigger value="danger" className="text-gray-300 data-[state=active]:bg-red-600 data-[state=active]:text-white">
              <Trash2 className="w-4 h-4 mr-2" />
              Опасно
            </TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-4 mt-4">
            <div>
              <Label htmlFor="roomName" className="text-sm font-medium text-gray-300">
                Название чата
              </Label>
              <div className="flex space-x-2 mt-2">
                <Input
                  id="roomName"
                  value={roomName}
                  onChange={(e) => setRoomName(e.target.value)}
                  className="bg-slate-700 border-slate-600 text-white"
                  disabled={room.isGeneral}
                />
                <Button 
                  onClick={handleUpdateRoomName}
                  disabled={room.isGeneral || roomName.trim() === room.name}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Edit3 className="w-4 h-4" />
                </Button>
              </div>
              {room.isGeneral && (
                <p className="text-xs text-gray-400 mt-1">
                  Общий чат нельзя переименовать
                </p>
              )}
            </div>

            <div className="space-y-2">
              <h4 className="text-sm font-medium text-gray-300">Информация о чате</h4>
              <div className="text-xs text-gray-400 space-y-1">
                <p>ID чата: {room.id}</p>
                <p>Создан: {new Date(room.createdAt).toLocaleDateString('ru-RU')}</p>
                <p>Тип: {room.isGeneral ? 'Общий чат' : 'Пользовательский чат'}</p>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="members" className="space-y-4 mt-4">
            <div>
              <Label htmlFor="newMember" className="text-sm font-medium text-gray-300">
                Добавить участника
              </Label>
              <div className="flex space-x-2 mt-2">
                <Input
                  id="newMember"
                  value={newMemberUsername}
                  onChange={(e) => setNewMemberUsername(e.target.value)}
                  placeholder="Имя пользователя"
                  className="bg-slate-700 border-slate-600 text-white"
                />
                <Button 
                  onClick={handleAddMember}
                  disabled={!newMemberUsername.trim()}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <UserPlus className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <Separator className="bg-slate-600" />

            <div>
              <h4 className="text-sm font-medium text-gray-300 mb-2">Участники чата</h4>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                <div className="flex items-center justify-between p-2 bg-slate-700 rounded">
                  <div className="flex items-center space-x-2">
                    <Crown className="w-4 h-4 text-yellow-400" />
                    <span className="text-sm text-white">Вы (владелец)</span>
                  </div>
                </div>
                <p className="text-xs text-gray-400 text-center py-2">
                  Функция управления участниками будет добавлена позже
                </p>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="danger" className="space-y-4 mt-4">
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-red-400">Опасная зона</h4>
              
              {!room.isGeneral ? (
                <div>
                  <p className="text-xs text-gray-400 mb-3">
                    Удаление чата необратимо. Все сообщения и данные будут потеряны.
                  </p>
                  <Button
                    onClick={handleDeleteRoom}
                    variant={isDeleting ? "destructive" : "outline"}
                    className={isDeleting 
                      ? "w-full bg-red-600 hover:bg-red-700 text-white" 
                      : "w-full border-red-600 text-red-400 hover:bg-red-600 hover:text-white"
                    }
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    {isDeleting ? "Подтвердить удаление" : "Удалить чат"}
                  </Button>
                  {isDeleting && (
                    <Button
                      onClick={() => setIsDeleting(false)}
                      variant="outline"
                      className="w-full mt-2 border-slate-600 text-gray-300"
                    >
                      Отменить
                    </Button>
                  )}
                </div>
              ) : (
                <p className="text-xs text-gray-400">
                  Общий чат нельзя удалить
                </p>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}