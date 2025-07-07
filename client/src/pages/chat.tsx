import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useWebSocket } from '@/hooks/useWebSocket';
import { useQuery } from '@tanstack/react-query';
import ChatSidebar from '@/components/chat/ChatSidebar';
import ChatArea from '@/components/chat/ChatArea';
import ProfileModal from '@/components/chat/ProfileModal';
import FileUploadModal from '@/components/chat/FileUploadModal';

export interface Message {
  id: number;
  content: string;
  senderId: number;
  roomId: number;
  messageType: string;
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  createdAt: string;
  sender: {
    id: number;
    username: string;
    avatar?: string;
  };
}

export interface ChatRoom {
  id: number;
  name: string;
  isGeneral: boolean;
  createdAt: string;
}

export default function ChatPage() {
  const { user, logout } = useAuth();
  const [currentRoomId, setCurrentRoomId] = useState<number | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showFileUploadModal, setShowFileUploadModal] = useState(false);
  
  const { sendMessage, lastMessage, isConnected } = useWebSocket('/ws', user?.id);

  const { data: rooms = [] } = useQuery<ChatRoom[]>({
    queryKey: ['/api/chat/rooms'],
  });

  const { data: roomMessages = [] } = useQuery<Message[]>({
    queryKey: ['/api/chat/messages', currentRoomId],
    enabled: !!currentRoomId,
  });

  useEffect(() => {
    if (rooms.length > 0 && !currentRoomId) {
      const generalRoom = rooms.find(room => room.isGeneral);
      if (generalRoom) {
        setCurrentRoomId(generalRoom.id);
      }
    }
  }, [rooms, currentRoomId]);

  useEffect(() => {
    if (currentRoomId && isConnected) {
      sendMessage({ type: 'join_room', roomId: currentRoomId });
    }
  }, [currentRoomId, isConnected, sendMessage]);

  useEffect(() => {
    if (roomMessages.length > 0) {
      setMessages(roomMessages);
    }
  }, [roomMessages]);

  useEffect(() => {
    if (lastMessage) {
      switch (lastMessage.type) {
        case 'new_message':
          setMessages(prev => [...prev, lastMessage.message]);
          break;
        case 'typing':
          if (lastMessage.isTyping) {
            setTypingUsers(prev => [...prev, lastMessage.username]);
          } else {
            setTypingUsers(prev => prev.filter(u => u !== lastMessage.username));
          }
          break;
      }
    }
  }, [lastMessage]);

  const handleSendMessage = (content: string, messageType = 'text', fileData?: any) => {
    if (!currentRoomId || !content.trim()) return;

    sendMessage({
      type: 'message',
      content,
      messageType,
      fileUrl: fileData?.fileUrl,
      fileName: fileData?.fileName,
      fileSize: fileData?.fileSize,
    });
  };

  const handleTyping = (isTyping: boolean) => {
    if (!currentRoomId) return;
    
    sendMessage({
      type: 'typing',
      isTyping,
    });
  };

  const currentRoom = rooms.find(room => room.id === currentRoomId);

  return (
    <div className="chat-container">
      <ChatSidebar
        rooms={rooms}
        currentRoomId={currentRoomId}
        onRoomSelect={setCurrentRoomId}
        onProfileClick={() => setShowProfileModal(true)}
        onLogout={logout}
        user={user}
      />
      
      <ChatArea
        room={currentRoom}
        messages={messages}
        typingUsers={typingUsers}
        onSendMessage={handleSendMessage}
        onTyping={handleTyping}
        onFileUpload={() => setShowFileUploadModal(true)}
        currentUser={user}
      />

      {showProfileModal && (
        <ProfileModal
          user={user}
          onClose={() => setShowProfileModal(false)}
        />
      )}

      {showFileUploadModal && (
        <FileUploadModal
          onClose={() => setShowFileUploadModal(false)}
          onFileUpload={handleSendMessage}
        />
      )}
    </div>
  );
}
