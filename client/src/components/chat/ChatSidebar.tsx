import { useState } from 'react';
import { User, LogOut, Settings, Plus, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import LogoutConfirmModal from './LogoutConfirmModal';
import type { ChatRoom } from '@/pages/chat';
import type { User as UserType } from '@/hooks/useAuth';

interface ChatSidebarProps {
  rooms: ChatRoom[];
  currentRoomId: number | null;
  onRoomSelect: (roomId: number) => void;
  onProfileClick: () => void;
  onLogout: () => void;
  user: UserType | null;
}

export default function ChatSidebar({ 
  rooms, 
  currentRoomId, 
  onRoomSelect, 
  onProfileClick, 
  onLogout, 
  user 
}: ChatSidebarProps) {
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const handleLogoutClick = () => {
    setShowLogoutModal(true);
  };

  const handleLogoutConfirm = () => {
    setShowLogoutModal(false);
    onLogout();
  };
  return (
    <div className="chat-sidebar">
      {/* User Profile Header */}
      <div className="p-4 border-b border-slate-700">
        <div className="flex items-center space-x-3">
          <Avatar className="w-12 h-12">
            <AvatarImage src={user?.avatar || undefined} />
            <AvatarFallback className="bg-slate-600 text-white">
              <User className="w-6 h-6" />
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <h3 className="font-semibold text-white">{user?.username}</h3>
            <p className="text-sm text-gray-400">В сети</p>
          </div>
          <Button
            onClick={onProfileClick}
            variant="ghost"
            size="sm"
            className="text-gray-400 hover:text-white"
          >
            <Settings className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Security Status */}
      <div className="p-4 bg-green-900/20 border-b border-slate-700">
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-green-400 rounded-full online-status"></div>
          <span className="text-sm text-green-400">Шифрование активно</span>
          <div className="w-3 h-3 bg-green-400 rounded-full flex items-center justify-center">
            <div className="w-1 h-1 bg-white rounded-full"></div>
          </div>
        </div>
        <p className="text-xs text-gray-400 mt-1">End-to-end шифрование AES-256</p>
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4">
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
            Чаты
          </h3>
          <div className="space-y-2">
            {rooms.map((room) => (
              <div
                key={room.id}
                className={`rounded-lg p-3 cursor-pointer transition-colors ${
                  currentRoomId === room.id
                    ? 'bg-blue-600/20 border border-blue-600/30'
                    : 'hover:bg-slate-700/50'
                }`}
                onClick={() => onRoomSelect(room.id)}
              >
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-slate-600 rounded-full flex items-center justify-center">
                    <Users className="w-5 h-5 text-gray-300" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-white">{room.name}</h4>
                    <p className="text-sm text-gray-400">
                      {room.isGeneral ? 'Общий чат' : 'Приватный чат'}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="w-2 h-2 bg-green-400 rounded-full online-status"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="p-4 border-t border-slate-700">
        <div className="flex space-x-2">
          <Button className="flex-1 chat-button primary">
            <Plus className="w-4 h-4 mr-2" />
            Новый чат
          </Button>
          <Button
            onClick={handleLogoutClick}
            variant="outline"
            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-gray-300 border-slate-600"
          >
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <LogoutConfirmModal
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onConfirm={handleLogoutConfirm}
      />
    </div>
  );
}
