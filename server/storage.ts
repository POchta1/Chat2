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
  getAvailableWords(): string[];
  
  // Chat room operations
  getChatRooms(): Promise<ChatRoom[]>;
  createChatRoom(name: string, isGeneral?: boolean): Promise<ChatRoom>;
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
  private availableWords: string[] = [];
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
    // Разделяем ключ на слова
    const words = key.split('-');
    
    // Проверяем, что выбрано ровно 10 слов
    if (words.length !== 10) {
      return false;
    }
    
    // Проверяем, что все слова есть в доступном списке
    const validWords = words.every(word => this.availableWords.includes(word));
    if (!validWords) {
      return false;
    }
    
    // Проверяем, что этот ключ еще не использовался
    const secretKey = this.secretKeys.get(key);
    return secretKey ? !secretKey.isUsed : true; // Если ключ новый, он валидный
  }

  async markSecretKeyAsUsed(key: string, userId: number): Promise<void> {
    let secretKey = this.secretKeys.get(key);
    
    // Если ключ не существует, создаем новый
    if (!secretKey) {
      secretKey = {
        id: this.currentSecretKeyId++,
        key: key,
        isUsed: false,
        usedBy: null,
        createdAt: new Date(),
      };
    }
    
    // Отмечаем как использованный
    secretKey.isUsed = true;
    secretKey.usedBy = userId;
    this.secretKeys.set(key, secretKey);
  }

  async initializeSecretKeys(): Promise<void> {
    // Создаем большой список слов для выбора
    const words = [
      "солнце", "море", "дом", "мир", "свет", "небо", "земля", "вода", "огонь", "ветер",
      "лес", "гора", "река", "город", "дорога", "звезда", "луна", "цветок", "дерево", "трава",
      "птица", "рыба", "кот", "собака", "конь", "волк", "медведь", "лиса", "заяц", "белка",
      "книга", "письмо", "слово", "музыка", "песня", "танец", "смех", "радость", "счастье", "любовь",
      "друг", "семья", "мама", "папа", "брат", "сестра", "дедушка", "бабушка", "ребенок", "человек",
      "работа", "учеба", "школа", "дом", "квартира", "комната", "кухня", "спальня", "окно", "дверь",
      "утро", "день", "вечер", "ночь", "время", "год", "месяц", "неделя", "час", "минута",
      "зима", "весна", "лето", "осень", "снег", "дождь", "солнце", "облако", "туман", "радуга",
      "хлеб", "молоко", "мясо", "овощи", "фрукты", "чай", "кофе", "сахар", "соль", "масло",
      "красный", "синий", "зеленый", "желтый", "белый", "черный", "серый", "коричневый", "розовый", "фиолетовый"
    ];

    // Сохраняем полный список слов для API
    this.availableWords = words;

    // Генерируем несколько комбинаций для тестирования
    const testCombinations = [
      "солнце-море-дом-мир-свет-небо-земля-вода-огонь-ветер",
      "лес-гора-река-город-дорога-звезда-луна-цветок-дерево-трава",
      "птица-рыба-кот-собака-конь-волк-медведь-лиса-заяц-белка"
    ];

    testCombinations.forEach((keyString, index) => {
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

  // Метод для получения доступных слов
  getAvailableWords(): string[] {
    return this.availableWords || [];
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
