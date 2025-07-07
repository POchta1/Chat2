import { useState, useRef } from 'react';
import { Send, Paperclip, Image, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface MessageInputProps {
  onSendMessage: (content: string, messageType?: string, fileData?: any) => void;
  onTyping: (isTyping: boolean) => void;
  onFileUpload: () => void;
}

export default function MessageInput({ onSendMessage, onTyping, onFileUpload }: MessageInputProps) {
  const [message, setMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setMessage(value);

    // Handle typing indicator
    if (value.length > 0 && !isTyping) {
      setIsTyping(true);
      onTyping(true);
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout to stop typing indicator
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      onTyping(false);
    }, 1000);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (message.trim()) {
      onSendMessage(message.trim());
      setMessage('');
      
      // Stop typing indicator
      if (isTyping) {
        setIsTyping(false);
        onTyping(false);
      }
      
      // Clear timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex items-center space-x-3">
      <Button
        type="button"
        onClick={onFileUpload}
        variant="ghost"
        size="sm"
        className="text-gray-400 hover:text-white"
      >
        <Paperclip className="w-4 h-4" />
      </Button>
      
      <Button
        type="button"
        onClick={onFileUpload}
        variant="ghost"
        size="sm"
        className="text-gray-400 hover:text-white"
      >
        <Image className="w-4 h-4" />
      </Button>
      
      <div className="flex-1 relative">
        <Input
          type="text"
          value={message}
          onChange={handleInputChange}
          onKeyPress={handleKeyPress}
          placeholder="Введите сообщение..."
          className="chat-input pr-10"
        />
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">
          <Lock className="w-4 h-4" />
        </div>
      </div>
      
      <Button
        type="submit"
        className="chat-button primary"
        disabled={!message.trim()}
      >
        <Send className="w-4 h-4" />
      </Button>
    </form>
  );
}
