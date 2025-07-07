import { useState, useRef, useEffect } from 'react';
import { Phone, Video, MoreVertical, Shield, Lock, Settings, Users, UserPlus, Info } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import MessageInput from './MessageInput';
import ChatSettingsModal from './ChatSettingsModal';
import type { Message, ChatRoom } from '@/pages/chat';
import type { User } from '@/hooks/useAuth';

interface ChatAreaProps {
  room: ChatRoom | undefined;
  messages: Message[];
  typingUsers: string[];
  onSendMessage: (content: string, messageType?: string, fileData?: any) => void;
  onTyping: (isTyping: boolean) => void;
  onFileUpload: () => void;
  currentUser: User | null;
  onUpdateRoom?: (roomId: number, data: { name?: string }) => void;
  onDeleteRoom?: (roomId: number) => void;
}

export default function ChatArea({
  room,
  messages,
  typingUsers,
  onSendMessage,
  onTyping,
  onFileUpload,
  currentUser,
  onUpdateRoom,
  onDeleteRoom,
}: ChatAreaProps) {
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('ru-RU', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const isOwnMessage = (message: Message) => {
    return message.senderId === currentUser?.id;
  };

  const handleVideoCall = () => {
    toast({
      title: "Видеозвонок",
      description: `Начинаем видеозвонок в чате "${room?.name}"`,
    });
    // Here you would implement actual video call functionality
    // For now, we'll just show a notification
  };

  const handleAudioCall = () => {
    toast({
      title: "Аудиозвонок", 
      description: `Начинаем аудиозвонок в чате "${room?.name}"`,
    });
    // Here you would implement actual audio call functionality
    // For now, we'll just show a notification
  };

  const renderMessage = (message: Message) => {
    const isOwn = isOwnMessage(message);
    
    return (
      <div key={message.id} className={`flex items-start space-x-3 ${isOwn ? 'justify-end' : ''}`}>
        {!isOwn && (
          <Avatar className="w-8 h-8">
            <AvatarImage src={message.sender.avatar || undefined} />
            <AvatarFallback className="bg-slate-600 text-white text-xs">
              {message.sender.username[0].toUpperCase()}
            </AvatarFallback>
          </Avatar>
        )}
        
        <div className={`flex-1 ${isOwn ? 'text-right' : ''}`}>
          <div className={`flex items-center space-x-2 mb-1 ${isOwn ? 'justify-end' : ''}`}>
            {!isOwn && (
              <span className="text-sm font-medium text-gray-300">
                {message.sender.username}
              </span>
            )}
            <span className="text-xs text-gray-400">
              {formatTime(message.createdAt)}
            </span>
            {isOwn && (
              <span className="text-sm font-medium text-gray-300">Вы</span>
            )}
          </div>
          
          <div className={`message-bubble ${isOwn ? 'own' : 'other'}`}>
            {message.messageType === 'image' && message.fileUrl && (
              <img
                src={message.fileUrl}
                alt={message.fileName || 'Image'}
                className="rounded-lg max-w-full h-auto mb-2"
              />
            )}
            
            {message.messageType === 'video' && message.fileUrl && (
              <video
                src={message.fileUrl}
                controls
                className="rounded-lg max-w-full h-auto mb-2"
              />
            )}
            
            {message.messageType === 'file' && message.fileUrl && (
              <div className="flex items-center space-x-2 mb-2 p-2 bg-black/20 rounded">
                <div className="w-8 h-8 bg-blue-500 rounded flex items-center justify-center">
                  <span className="text-xs text-white">📄</span>
                </div>
                <div>
                  <p className="text-sm font-medium">{message.fileName}</p>
                  <p className="text-xs text-gray-300">
                    {message.fileSize && `${(message.fileSize / 1024).toFixed(1)} KB`}
                  </p>
                </div>
              </div>
            )}
            
            {message.content && <p className="text-sm">{message.content}</p>}
          </div>
        </div>
        
        {isOwn && (
          <Avatar className="w-8 h-8">
            <AvatarImage src={currentUser?.avatar || undefined} />
            <AvatarFallback className="bg-slate-600 text-white text-xs">
              {currentUser?.username[0].toUpperCase()}
            </AvatarFallback>
          </Avatar>
        )}
      </div>
    );
  };

  const renderTypingIndicator = () => {
    if (typingUsers.length === 0) return null;
    
    return (
      <div className="flex items-start space-x-3">
        <div className="w-8 h-8 bg-slate-600 rounded-full flex items-center justify-center">
          <span className="text-xs">👤</span>
        </div>
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-1">
            <span className="text-sm font-medium text-gray-300">
              {typingUsers.join(', ')}
            </span>
            <span className="text-xs text-gray-400">печатает...</span>
          </div>
          <div className="message-bubble other">
            <div className="typing-indicator">
              <div className="typing-dot animate-typing"></div>
              <div className="typing-dot animate-typing" style={{ animationDelay: '0.2s' }}></div>
              <div className="typing-dot animate-typing" style={{ animationDelay: '0.4s' }}></div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (!room) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <h3 className="text-lg font-medium text-gray-400">Выберите чат</h3>
          <p className="text-sm text-gray-500">Выберите чат из списка слева</p>
        </div>
      </div>
    );
  }

  return (
    <div className="chat-main">
      {/* Chat Header */}
      <div className="chat-header">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-slate-600 rounded-full flex items-center justify-center">
              <span className="text-sm">👥</span>
            </div>
            <div>
              <h3 className="font-semibold text-white">{room.name}</h3>
              <p className="text-sm text-gray-400">
                {room.isGeneral ? 'Общий чат' : 'Приватный чат'}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              className="text-gray-400 hover:text-white"
              onClick={handleVideoCall}
              title="Видеозвонок"
            >
              <Video className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-gray-400 hover:text-white"
              onClick={handleAudioCall}
              title="Аудиозвонок"
            >
              <Phone className="w-4 h-4" />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-gray-400 hover:text-white"
                >
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56 bg-slate-800 border-slate-600 text-white">
                <DropdownMenuItem 
                  onClick={() => setShowSettingsModal(true)}
                  className="cursor-pointer hover:bg-slate-700"
                >
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Настройки чата</span>
                </DropdownMenuItem>
                
                <DropdownMenuItem className="cursor-pointer hover:bg-slate-700">
                  <Users className="mr-2 h-4 w-4" />
                  <span>Участники ({messages.filter((m, i, arr) => arr.findIndex(msg => msg.senderId === m.senderId) === i).length})</span>
                </DropdownMenuItem>
                
                <DropdownMenuSeparator className="bg-slate-600" />
                
                <DropdownMenuItem className="cursor-pointer hover:bg-slate-700">
                  <UserPlus className="mr-2 h-4 w-4" />
                  <span>Пригласить пользователя</span>
                </DropdownMenuItem>
                
                <DropdownMenuItem className="cursor-pointer hover:bg-slate-700">
                  <Info className="mr-2 h-4 w-4" />
                  <span>Информация о чате</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="chat-messages">
        {/* System Message */}
        <div className="text-center">
          <div className="inline-block bg-slate-700 text-gray-300 px-3 py-1 rounded-full text-sm">
            <Shield className="w-4 h-4 inline mr-2 text-green-400" />
            Чат защищен end-to-end шифрованием
          </div>
        </div>

        {/* Messages */}
        {messages.map(renderMessage)}
        
        {/* Typing Indicator */}
        {renderTypingIndicator()}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="chat-input-area">
        <MessageInput
          onSendMessage={onSendMessage}
          onTyping={onTyping}
          onFileUpload={onFileUpload}
        />
        <div className="flex items-center justify-between mt-2 text-xs text-gray-400">
          <span className="flex items-center">
            <Lock className="w-3 h-3 mr-1" />
            Сообщения шифруются автоматически
          </span>
          <span>Нажмите Enter для отправки</span>
        </div>
      </div>

      {showSettingsModal && room && (
        <ChatSettingsModal
          isOpen={showSettingsModal}
          onClose={() => setShowSettingsModal(false)}
          room={room}
          onUpdateRoom={onUpdateRoom}
          onDeleteRoom={onDeleteRoom}
        />
      )}
    </div>
  );
}
