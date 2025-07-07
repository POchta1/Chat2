import { useState, useEffect, useRef, useCallback } from 'react';

export interface WebSocketMessage {
  type: string;
  [key: string]: any;
}

export interface UseWebSocketReturn {
  socket: WebSocket | null;
  isConnected: boolean;
  sendMessage: (message: WebSocketMessage) => void;
  lastMessage: WebSocketMessage | null;
}

export function useWebSocket(url: string, userId?: number): UseWebSocketReturn {
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);
  const socketRef = useRef<WebSocket | null>(null);
  const userIdRef = useRef(userId);

  userIdRef.current = userId;

  const connect = useCallback(() => {
    if (!userIdRef.current) return;
    
    // Не создаем новое соединение если уже есть активное
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    try {
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const wsUrl = `${protocol}//${window.location.host}/ws`;
      
      console.log('Создаем WebSocket соединение:', wsUrl);
      const ws = new WebSocket(wsUrl);
      
      ws.onopen = () => {
        console.log('WebSocket подключен');
        setIsConnected(true);
        socketRef.current = ws;
        
        // Аутентификация пользователя
        if (userIdRef.current) {
          ws.send(JSON.stringify({ type: 'auth', userId: userIdRef.current }));
        }
      };

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          setLastMessage(message);
        } catch (error) {
          console.error('Ошибка парсинга WebSocket сообщения:', error);
        }
      };

      ws.onclose = () => {
        console.log('WebSocket отключен');
        setIsConnected(false);
        socketRef.current = null;
      };

      ws.onerror = (error) => {
        console.error('Ошибка WebSocket:', error);
        setIsConnected(false);
      };

    } catch (error) {
      console.error('Ошибка создания WebSocket:', error);
    }
  }, []);

  const sendMessage = useCallback((message: WebSocketMessage) => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      console.log('Отправляем сообщение:', message);
      socketRef.current.send(JSON.stringify(message));
    } else {
      console.log('WebSocket не подключен');
    }
  }, []);

  useEffect(() => {
    if (userId) {
      connect();
    }

    return () => {
      if (socketRef.current) {
        socketRef.current.close();
        socketRef.current = null;
      }
    };
  }, [userId, connect]);

  return {
    socket: socketRef.current,
    isConnected,
    sendMessage,
    lastMessage,
  };
}