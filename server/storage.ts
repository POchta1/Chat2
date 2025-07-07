import { 
  users, 
  secretKeys, 
  chatRooms, 
  messages, 
  roomMembers, 
  typingIndicators,
  type User, 
  type InsertUser, 
  type Message, 
  type InsertMessage, 
  type ChatRoom, 
  type SecretKey,
  type UpdateProfileData
} from "@shared/schema";
import { eq, desc, and, or } from "drizzle-orm";
import bcrypt from "bcrypt";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, data: UpdateProfileData): Promise<User>;
  updateUserOnlineStatus(id: number, isOnline: boolean): Promise<void>;
  
  // Secret key operations
  validateSecretKey(key: string): Promise<boolean>;
  markSecretKeyAsUsed(key: string, userId: number): Promise<void>;
  initializeSecretKeys(): Promise<void>;
  getAvailableKeys(): string[];
  
  // Chat room operations
  getChatRooms(): Promise<ChatRoom[]>;
  createChatRoom(name: string, isGeneral?: boolean): Promise<ChatRoom>;
  updateChatRoom(roomId: number, data: { name?: string }): Promise<ChatRoom>;
  deleteChatRoom(roomId: number): Promise<void>;
  joinRoom(userId: number, roomId: number): Promise<void>;
  
  // Message operations
  getMessages(roomId: number, limit?: number): Promise<Message[]>;
  createMessage(message: InsertMessage): Promise<Message>;
  
  // Typing indicators
  setTypingStatus(userId: number, roomId: number, isTyping: boolean): Promise<void>;
  getTypingUsers(roomId: number): Promise<User[]>;
  
  // Authentication
  authenticateUser(username: string, password: string): Promise<User | null>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User> = new Map();
  private secretKeys: Map<string, SecretKey> = new Map();
  private chatRooms: Map<number, ChatRoom> = new Map();
  private messages: Map<number, Message> = new Map();
  private roomMembers: Map<string, { userId: number; roomId: number }> = new Map();
  private typingIndicators: Map<string, { userId: number; roomId: number; isTyping: boolean }> = new Map();
  private currentUserId = 1;
  private currentRoomId = 1;
  private currentMessageId = 1;
  private currentSecretKeyId = 1;

  constructor() {
    this.initializeSecretKeys();
    this.createDefaultRoom();
  }

  private async createDefaultRoom() {
    const generalRoom: ChatRoom = {
      id: this.currentRoomId++,
      name: "Общий чат",
      isGeneral: true,
      createdAt: new Date(),
    };
    this.chatRooms.set(generalRoom.id, generalRoom);
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.username === username);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const hashedPassword = await bcrypt.hash(insertUser.password, 10);
    const user: User = {
      id: this.currentUserId++,
      username: insertUser.username,
      password: hashedPassword,
      avatar: null,
      isOnline: true,
      lastSeen: new Date(),
      createdAt: new Date(),
    };
    this.users.set(user.id, user);
    
    // Auto-join general room
    const generalRoom = Array.from(this.chatRooms.values()).find(room => room.isGeneral);
    if (generalRoom) {
      await this.joinRoom(user.id, generalRoom.id);
    }
    
    return user;
  }

  async updateUser(id: number, data: UpdateProfileData): Promise<User> {
    const user = this.users.get(id);
    if (!user) {
      throw new Error("User not found");
    }

    const updatedUser: User = {
      ...user,
      username: data.username || user.username,
      avatar: data.avatar || user.avatar,
      password: data.password ? await bcrypt.hash(data.password, 10) : user.password,
    };

    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async updateUserOnlineStatus(id: number, isOnline: boolean): Promise<void> {
    const user = this.users.get(id);
    if (user) {
      user.isOnline = isOnline;
      user.lastSeen = new Date();
      this.users.set(id, user);
    }
  }

  async validateSecretKey(key: string): Promise<boolean> {
    const secretKey = this.secretKeys.get(key);
    return secretKey ? !secretKey.isUsed : false;
  }

  async markSecretKeyAsUsed(key: string, userId: number): Promise<void> {
    const secretKey = this.secretKeys.get(key);
    if (secretKey) {
      secretKey.isUsed = true;
      secretKey.usedBy = userId;
      this.secretKeys.set(key, secretKey);
    }
  }

  async initializeSecretKeys(): Promise<void> {
    // Создаем 10 фиксированных секретных ключей
    const secretKeys = [
      "SK-7H9J2K8L3M4N5P6Q",
      "SK-R2T4Y6U8I9O0P1A3", 
      "SK-S5D7F9G1H3J4K6L8",
      "SK-Z9X8C7V6B5N4M3Q2",
      "SK-W1E3R5T7Y9U2I4O6",
      "SK-P8O9I0U7Y6T5R4E3",
      "SK-A2S4D6F8G9H1J3K5",
      "SK-L7Z9X2C4V6B8N0M1",
      "SK-Q3W5E7R9T1Y3U5I7",
      "SK-O9P1A3S5D7F9G2H4"
    ];

    secretKeys.forEach((keyString, index) => {
      const secretKey: SecretKey = {
        id: this.currentSecretKeyId++,
        key: keyString,
        isUsed: false,
        usedBy: null,
        createdAt: new Date(),
      };
      this.secretKeys.set(keyString, secretKey);
    });
  }

  // Метод для получения доступных ключей
  getAvailableKeys(): string[] {
    return Array.from(this.secretKeys.values())
      .filter(key => !key.isUsed)
      .map(key => key.key);
  }

  async getChatRooms(): Promise<ChatRoom[]> {
    return Array.from(this.chatRooms.values());
  }

  async createChatRoom(name: string, isGeneral = false): Promise<ChatRoom> {
    const room: ChatRoom = {
      id: this.currentRoomId++,
      name,
      isGeneral,
      createdAt: new Date(),
    };
    this.chatRooms.set(room.id, room);
    return room;
  }

  async updateChatRoom(roomId: number, data: { name?: string }): Promise<ChatRoom> {
    const room = this.chatRooms.get(roomId);
    if (!room) {
      throw new Error('Чат не найден');
    }

    if (room.isGeneral) {
      throw new Error('Общий чат нельзя редактировать');
    }

    const updatedRoom: ChatRoom = {
      ...room,
      ...data,
    };

    this.chatRooms.set(roomId, updatedRoom);
    return updatedRoom;
  }

  async deleteChatRoom(roomId: number): Promise<void> {
    const room = this.chatRooms.get(roomId);
    if (!room) {
      throw new Error('Чат не найден');
    }

    if (room.isGeneral) {
      throw new Error('Общий чат нельзя удалить');
    }

    // Удаляем чат
    this.chatRooms.delete(roomId);

    // Удаляем все сообщения из чата
    const messagesToDelete: number[] = [];
    this.messages.forEach((message, id) => {
      if (message.roomId === roomId) {
        messagesToDelete.push(id);
      }
    });
    messagesToDelete.forEach(id => this.messages.delete(id));

    // Удаляем участников чата
    const membersToDelete: string[] = [];
    this.roomMembers.forEach((member, key) => {
      if (member.roomId === roomId) {
        membersToDelete.push(key);
      }
    });
    membersToDelete.forEach(key => this.roomMembers.delete(key));

    // Удаляем индикаторы печати
    const typingToDelete: string[] = [];
    this.typingIndicators.forEach((typing, key) => {
      if (typing.roomId === roomId) {
        typingToDelete.push(key);
      }
    });
    typingToDelete.forEach(key => this.typingIndicators.delete(key));
  }

  async joinRoom(userId: number, roomId: number): Promise<void> {
    const key = `${userId}-${roomId}`;
    this.roomMembers.set(key, { userId, roomId });
  }

  async getMessages(roomId: number, limit = 50): Promise<Message[]> {
    return Array.from(this.messages.values())
      .filter(msg => msg.roomId === roomId)
      .sort((a, b) => a.createdAt!.getTime() - b.createdAt!.getTime())
      .slice(-limit);
  }

  async createMessage(insertMessage: InsertMessage): Promise<Message> {
    const message: Message = {
      id: this.currentMessageId++,
      content: insertMessage.content,
      encryptedContent: null,
      senderId: insertMessage.senderId,
      roomId: insertMessage.roomId,
      messageType: insertMessage.messageType || "text",
      fileUrl: insertMessage.fileUrl || null,
      fileName: insertMessage.fileName || null,
      fileSize: insertMessage.fileSize || null,
      createdAt: new Date(),
    };
    this.messages.set(message.id, message);
    return message;
  }

  async setTypingStatus(userId: number, roomId: number, isTyping: boolean): Promise<void> {
    const key = `${userId}-${roomId}`;
    this.typingIndicators.set(key, { userId, roomId, isTyping });
  }

  async getTypingUsers(roomId: number): Promise<User[]> {
    const typingUserIds = Array.from(this.typingIndicators.values())
      .filter(indicator => indicator.roomId === roomId && indicator.isTyping)
      .map(indicator => indicator.userId);

    return typingUserIds
      .map(id => this.users.get(id))
      .filter(Boolean) as User[];
  }

  async authenticateUser(username: string, password: string): Promise<User | null> {
    const user = await this.getUserByUsername(username);
    if (!user) return null;

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) return null;

    await this.updateUserOnlineStatus(user.id, true);
    return user;
  }
}

export const storage = new MemStorage();
