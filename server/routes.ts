import type { Express, Request, Response, NextFunction } from "express";
import express from "express";
import session from "express-session";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { encryptionService } from "./encryption";
import { 
  loginSchema, 
  registerSchema, 
  insertMessageSchema, 
  updateProfileSchema,
  type User,
  type Message
} from "@shared/schema";
import multer from "multer";
import path from "path";
import fs from "fs";

// Configure multer for file uploads
const uploadDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const upload = multer({
  dest: uploadDir,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow images, videos, and documents
    const allowedTypes = /jpeg|jpg|png|gif|mp4|avi|mov|pdf|doc|docx|txt/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error("Invalid file type"));
    }
  },
});

interface AuthenticatedRequest extends Request {
  user?: User;
}

// Session middleware
const authenticateToken = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const sessionUser = (req.session as any)?.user;
  
  if (!sessionUser) {
    return res.status(401).json({ message: "Authentication required" });
  }
  
  req.user = sessionUser;
  next();
};

// WebSocket connection management
const clients = new Map<number, WebSocket>();
const rooms = new Map<number, Set<number>>();

function broadcastToRoom(roomId: number, message: any, excludeUserId?: number) {
  const roomClients = rooms.get(roomId);
  if (!roomClients) return;

  roomClients.forEach(userId => {
    if (userId !== excludeUserId) {
      const client = clients.get(userId);
      if (client && client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(message));
      }
    }
  });
}

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);

  // WebSocket server
  const wss = new WebSocketServer({ server: httpServer, path: "/ws" });

  wss.on("connection", (ws: WebSocket, req) => {
    console.log("New WebSocket connection");
    
    let userId: number | null = null;
    let currentRoomId: number | null = null;

    ws.on("message", async (data) => {
      try {
        const message = JSON.parse(data.toString());
        
        switch (message.type) {
          case "auth":
            userId = message.userId;
            if (userId) {
              clients.set(userId, ws);
              await storage.updateUserOnlineStatus(userId, true);
            }
            break;
            
          case "join_room":
            if (userId) {
              currentRoomId = message.roomId;
              if (currentRoomId && !rooms.has(currentRoomId)) {
                rooms.set(currentRoomId, new Set());
              }
              if (currentRoomId) {
                rooms.get(currentRoomId)!.add(userId);
                await storage.joinRoom(userId, currentRoomId);
              }
            }
            break;
            
          case "typing":
            if (userId && currentRoomId) {
              await storage.setTypingStatus(userId, currentRoomId, message.isTyping);
              broadcastToRoom(currentRoomId, {
                type: "typing",
                userId,
                isTyping: message.isTyping,
              }, userId);
            }
            break;
            
          case "message":
            if (userId && currentRoomId) {
              console.log('Получено сообщение от пользователя:', userId, 'в комнату:', currentRoomId, 'содержание:', message.content);
              
              const newMessage = await storage.createMessage({
                content: message.content, // Сохраняем как есть, без шифрования
                senderId: userId,
                roomId: currentRoomId,
                messageType: message.messageType || "text",
                fileUrl: message.fileUrl,
                fileName: message.fileName,
                fileSize: message.fileSize,
              });
              
              const sender = await storage.getUser(userId);
              
              console.log('Отправляем сообщение в комнату:', currentRoomId);
              
              broadcastToRoom(currentRoomId, {
                type: "new_message",
                message: {
                  ...newMessage,
                  sender: {
                    id: sender!.id,
                    username: sender!.username,
                    avatar: sender!.avatar,
                  }
                }
              });
            }
            break;
        }
      } catch (error) {
        console.error("WebSocket message error:", error);
      }
    });

    ws.on("close", async () => {
      if (userId) {
        clients.delete(userId);
        if (currentRoomId) {
          rooms.get(currentRoomId)?.delete(userId);
        }
        await storage.updateUserOnlineStatus(userId, false);
      }
    });
  });

  // Session configuration
  app.use(session({
    secret: process.env.SESSION_SECRET || "your-secret-key",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false, // Set to true in production with HTTPS
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    },
  }));

  // Serve uploaded files
  app.use("/uploads", express.static(uploadDir));



  // Authentication routes
  app.post("/api/auth/register", async (req, res) => {
    try {
      const data = registerSchema.parse(req.body);
      
      // Check if username already exists
      const existingUser = await storage.getUserByUsername(data.username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }
      
      // Validate secret key
      const isValidKey = await storage.validateSecretKey(data.secretKey);
      if (!isValidKey) {
        return res.status(400).json({ message: "Invalid or already used secret key" });
      }
      
      // Create user
      const user = await storage.createUser({
        username: data.username,
        password: data.password,
      });
      
      // Mark secret key as used
      await storage.markSecretKeyAsUsed(data.secretKey, user.id);
      
      // Create session
      (req.session as any).user = user;
      
      res.json({ 
        message: "Registration successful", 
        user: { id: user.id, username: user.username, avatar: user.avatar } 
      });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const data = loginSchema.parse(req.body);
      
      const user = await storage.authenticateUser(data.username, data.password);
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      
      (req.session as any).user = user;
      
      res.json({ 
        message: "Login successful", 
        user: { id: user.id, username: user.username, avatar: user.avatar } 
      });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "Could not log out" });
      }
      res.json({ message: "Logged out successfully" });
    });
  });

  app.get("/api/auth/me", authenticateToken, (req: AuthenticatedRequest, res) => {
    res.json({ 
      user: { 
        id: req.user!.id, 
        username: req.user!.username, 
        avatar: req.user!.avatar 
      } 
    });
  });



  // User routes
  app.put("/api/users/profile", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const data = updateProfileSchema.parse(req.body);
      
      // Check if new username already exists
      if (data.username && data.username !== req.user!.username) {
        const existingUser = await storage.getUserByUsername(data.username);
        if (existingUser) {
          return res.status(400).json({ message: "Username already exists" });
        }
      }
      
      const updatedUser = await storage.updateUser(req.user!.id, data);
      
      // Update session
      (req.session as any).user = updatedUser;
      
      res.json({ 
        message: "Profile updated successfully", 
        user: { id: updatedUser.id, username: updatedUser.username, avatar: updatedUser.avatar } 
      });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Chat routes
  app.get("/api/chat/rooms", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const rooms = await storage.getChatRooms();
      res.json(rooms);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/chat/rooms", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const { name } = req.body;
      
      if (!name || typeof name !== 'string' || !name.trim()) {
        return res.status(400).json({ message: "Название чата обязательно" });
      }

      const room = await storage.createChatRoom(name.trim());
      
      // Автоматически добавляем создателя в комнату
      if (req.user) {
        await storage.joinRoom(req.user.id, room.id);
      }

      res.json({ 
        message: "Чат создан успешно", 
        room 
      });
    } catch (error: any) {
      console.error("Error creating room:", error);
      res.status(500).json({ message: "Не удалось создать чат" });
    }
  });

  app.put("/api/chat/rooms/:roomId", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const roomId = parseInt(req.params.roomId);
      const { name } = req.body;
      
      if (!name || typeof name !== 'string' || !name.trim()) {
        return res.status(400).json({ message: "Название чата обязательно" });
      }

      const room = await storage.updateChatRoom(roomId, { name: name.trim() });
      
      res.json({ 
        message: "Чат обновлен успешно", 
        room 
      });
    } catch (error: any) {
      console.error("Error updating room:", error);
      res.status(500).json({ message: "Не удалось обновить чат" });
    }
  });

  app.delete("/api/chat/rooms/:roomId", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const roomId = parseInt(req.params.roomId);
      
      // Проверяем, что это не общий чат
      const rooms = await storage.getChatRooms();
      const room = rooms.find(r => r.id === roomId);
      
      if (!room) {
        return res.status(404).json({ message: "Чат не найден" });
      }

      if (room.isGeneral) {
        return res.status(400).json({ message: "Общий чат нельзя удалить" });
      }

      await storage.deleteChatRoom(roomId);
      
      res.json({ 
        message: "Чат удален успешно" 
      });
    } catch (error: any) {
      console.error("Error deleting room:", error);
      res.status(500).json({ message: "Не удалось удалить чат" });
    }
  });

  app.get("/api/chat/messages/:roomId", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const roomId = parseInt(req.params.roomId);
      const messages = await storage.getMessages(roomId);
      
      // Get sender info for each message
      const messagesWithSenders = await Promise.all(
        messages.map(async (msg) => {
          const sender = await storage.getUser(msg.senderId);
          return {
            ...msg,
            sender: sender ? { id: sender.id, username: sender.username, avatar: sender.avatar } : null,
          };
        })
      );
      
      res.json(messagesWithSenders);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/chat/typing/:roomId", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const roomId = parseInt(req.params.roomId);
      const typingUsers = await storage.getTypingUsers(roomId);
      res.json(typingUsers);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/chat/members/:roomId", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const roomId = parseInt(req.params.roomId);
      const members = await storage.getRoomMembers(roomId);
      res.json(members);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/chat/kick/:roomId/:userId", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const roomId = parseInt(req.params.roomId);
      const userIdToKick = parseInt(req.params.userId);
      
      // Check if the room exists and is not general chat (can't kick from general)
      const rooms = await storage.getChatRooms();
      const room = rooms.find(r => r.id === roomId);
      
      if (!room) {
        return res.status(404).json({ message: "Чат не найден" });
      }

      if (room.isGeneral) {
        return res.status(400).json({ message: "Нельзя исключить из общего чата" });
      }

      // Don't allow kicking yourself
      if (userIdToKick === req.user!.id) {
        return res.status(400).json({ message: "Нельзя исключить самого себя" });
      }

      await storage.kickUserFromRoom(userIdToKick, roomId);
      
      // Notify the kicked user via WebSocket
      broadcastToRoom(roomId, {
        type: "user_kicked",
        userId: userIdToKick,
        roomId: roomId,
        message: "Вы были исключены из чата"
      });
      
      res.json({ message: "Пользователь исключен из чата" });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // File upload route
  app.post("/api/upload", authenticateToken, upload.single("file"), async (req: AuthenticatedRequest, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }
      
      const fileUrl = `/uploads/${req.file.filename}`;
      
      res.json({
        message: "File uploaded successfully",
        fileUrl,
        fileName: req.file.originalname,
        fileSize: req.file.size,
        mimeType: req.file.mimetype,
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Get available words for secret key generation
  app.get("/api/secret-words", async (req, res) => {
    try {
      const words = [
        "солнце", "море", "дом", "мир", "свет", "небо", "земля", "вода", "огонь", "ветер",
        "лес", "гора", "река", "город", "дорога", "звезда", "луна", "цветок", "дерево", "трава",
        "птица", "рыба", "кот", "собака", "конь", "волк", "медведь", "лиса", "заяц", "белка",
        "книга", "письмо", "слово", "музыка", "песня", "танец", "смех", "радость", "счастье", "любовь",
        "друг", "семья", "мама", "папа", "брат", "сестра", "дедушка", "бабушка", "ребенок", "человек",
        "работа", "учеба", "школа", "хлеб", "квартира", "комната", "кухня", "спальня", "окно", "дверь"
      ];
      
      res.json(words);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Validate generated secret key
  app.post("/api/validate-secret-key", async (req, res) => {
    try {
      const { words } = req.body;
      
      if (!words || !Array.isArray(words) || words.length !== 10) {
        return res.status(400).json({ message: "Нужно выбрать ровно 10 слов" });
      }
      
      const secretKey = words.join("-");
      const isValid = await storage.validateSecretKey(secretKey);
      
      res.json({ isValid, secretKey });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  return httpServer;
}
