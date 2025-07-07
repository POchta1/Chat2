import fs from 'fs';
import path from 'path';
import { 
  type User, 
  type InsertUser, 
  type Message, 
  type InsertMessage, 
  type ChatRoom, 
  type SecretKey,
  type UpdateProfileData
} from "@shared/schema";
import bcrypt from "bcrypt";
import { IStorage } from "./storage";

interface FileData {
  users: User[];
  secretKeys: SecretKey[];
  chatRooms: ChatRoom[];
  messages: Message[];
  roomMembers: { userId: number; roomId: number }[];
  typingIndicators: { userId: number; roomId: number; isTyping: boolean }[];
  counters: {
    userId: number;
    roomId: number;
    messageId: number;
    secretKeyId: number;
  };
}

export class FileStorage implements IStorage {
  private dataFile: string;
  private data: FileData;

  constructor() {
    this.dataFile = path.join(process.cwd(), 'data', 'storage.json');
    this.ensureDataDirectory();
    this.loadData();
  }

  private ensureDataDirectory() {
    const dataDir = path.dirname(this.dataFile);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
  }

  private loadData() {
    try {
      if (fs.existsSync(this.dataFile)) {
        const fileContent = fs.readFileSync(this.dataFile, 'utf-8');
        this.data = JSON.parse(fileContent);
      } else {
        this.data = this.getDefaultData();
        this.initializeDefaultContent();
      }
    } catch (error) {
      console.error('Error loading data file:', error);
      this.data = this.getDefaultData();
      this.initializeDefaultContent();
    }
  }

  private saveData() {
    try {
      fs.writeFileSync(this.dataFile, JSON.stringify(this.data, null, 2));
    } catch (error) {
      console.error('Error saving data file:', error);
    }
  }

  private getDefaultData(): FileData {
    return {
      users: [],
      secretKeys: [],
      chatRooms: [],
      messages: [],
      roomMembers: [],
      typingIndicators: [],
      counters: {
        userId: 1,
        roomId: 1,
        messageId: 1,
        secretKeyId: 1,
      }
    };
  }

  private async initializeDefaultContent() {
    // Create default general room
    await this.createDefaultRoom();
    // Initialize secret keys
    await this.initializeSecretKeys();
    this.saveData();
  }

  private async createDefaultRoom() {
    const generalRoom: ChatRoom = {
      id: this.data.counters.roomId++,
      name: "Общий чат",
      isGeneral: true,
      createdAt: new Date(),
    };
    this.data.chatRooms.push(generalRoom);
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.data.users.find(user => user.id === id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return this.data.users.find(user => user.username === username);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const hashedPassword = await bcrypt.hash(insertUser.password, 10);
    
    const user: User = {
      id: this.data.counters.userId++,
      username: insertUser.username,
      password: hashedPassword,
      avatar: null,
      createdAt: new Date(),
      isOnline: false,
    };
    
    this.data.users.push(user);
    this.saveData();
    return user;
  }

  async updateUser(id: number, updateData: UpdateProfileData): Promise<User> {
    const userIndex = this.data.users.findIndex(user => user.id === id);
    if (userIndex === -1) {
      throw new Error("User not found");
    }

    const updatedUser: User = {
      ...this.data.users[userIndex],
      ...updateData,
    };
    
    this.data.users[userIndex] = updatedUser;
    this.saveData();
    return updatedUser;
  }

  async updateUserOnlineStatus(id: number, isOnline: boolean): Promise<void> {
    const user = this.data.users.find(user => user.id === id);
    if (user) {
      user.isOnline = isOnline;
      this.saveData();
    }
  }

  async validateSecretKey(key: string): Promise<boolean> {
    const secretKey = this.data.secretKeys.find(sk => sk.key === key);
    return secretKey ? !secretKey.isUsed : false;
  }

  async markSecretKeyAsUsed(key: string, userId: number): Promise<void> {
    const secretKey = this.data.secretKeys.find(sk => sk.key === key);
    if (secretKey) {
      secretKey.isUsed = true;
      secretKey.usedBy = userId;
      secretKey.usedAt = new Date();
      this.saveData();
    }
  }

  async initializeSecretKeys(): Promise<void> {
    if (this.data.secretKeys.length === 0) {
      const keys = [
        'SECRET_KEY_001', 'SECRET_KEY_002', 'SECRET_KEY_003', 'SECRET_KEY_004', 'SECRET_KEY_005',
        'SECRET_KEY_006', 'SECRET_KEY_007', 'SECRET_KEY_008', 'SECRET_KEY_009', 'SECRET_KEY_010'
      ];

      for (const key of keys) {
        const secretKey: SecretKey = {
          id: this.data.counters.secretKeyId++,
          key,
          isUsed: false,
          createdAt: new Date(),
          usedAt: null,
          usedBy: null,
        };
        this.data.secretKeys.push(secretKey);
      }
      this.saveData();
    }
  }

  getAvailableKeys(): string[] {
    return this.data.secretKeys
      .filter(sk => !sk.isUsed)
      .map(sk => sk.key);
  }

  async getChatRooms(): Promise<ChatRoom[]> {
    return [...this.data.chatRooms];
  }

  async createChatRoom(name: string, isGeneral = false): Promise<ChatRoom> {
    const room: ChatRoom = {
      id: this.data.counters.roomId++,
      name,
      isGeneral,
      createdAt: new Date(),
    };
    
    this.data.chatRooms.push(room);
    this.saveData();
    return room;
  }

  async updateChatRoom(roomId: number, updateData: { name?: string }): Promise<ChatRoom> {
    const roomIndex = this.data.chatRooms.findIndex(room => room.id === roomId);
    if (roomIndex === -1) {
      throw new Error("Room not found");
    }

    const updatedRoom: ChatRoom = {
      ...this.data.chatRooms[roomIndex],
      ...updateData,
    };
    
    this.data.chatRooms[roomIndex] = updatedRoom;
    this.saveData();
    return updatedRoom;
  }

  async deleteChatRoom(roomId: number): Promise<void> {
    this.data.chatRooms = this.data.chatRooms.filter(room => room.id !== roomId);
    this.data.messages = this.data.messages.filter(message => message.roomId !== roomId);
    this.data.roomMembers = this.data.roomMembers.filter(member => member.roomId !== roomId);
    this.saveData();
  }

  async joinRoom(userId: number, roomId: number): Promise<void> {
    const existing = this.data.roomMembers.find(
      member => member.userId === userId && member.roomId === roomId
    );
    
    if (!existing) {
      this.data.roomMembers.push({ userId, roomId });
      this.saveData();
    }
  }

  async kickUserFromRoom(userId: number, roomId: number): Promise<void> {
    this.data.roomMembers = this.data.roomMembers.filter(
      member => !(member.userId === userId && member.roomId === roomId)
    );
    
    // Also clear typing status
    this.data.typingIndicators = this.data.typingIndicators.filter(
      indicator => !(indicator.userId === userId && indicator.roomId === roomId)
    );
    
    this.saveData();
  }

  async getRoomMembers(roomId: number): Promise<User[]> {
    const memberUserIds = this.data.roomMembers
      .filter(member => member.roomId === roomId)
      .map(member => member.userId);
    
    return this.data.users.filter(user => memberUserIds.includes(user.id));
  }

  async getMessages(roomId: number, limit = 50): Promise<Message[]> {
    return this.data.messages
      .filter(message => message.roomId === roomId)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
      .slice(-limit)
      .map(message => {
        const sender = this.data.users.find(user => user.id === message.senderId);
        return {
          ...message,
          sender: sender ? {
            id: sender.id,
            username: sender.username,
            avatar: sender.avatar,
          } : {
            id: message.senderId,
            username: 'Unknown User',
            avatar: null,
          }
        };
      });
  }

  async createMessage(insertMessage: InsertMessage): Promise<Message> {
    const message: Message = {
      id: this.data.counters.messageId++,
      content: insertMessage.content,
      encryptedContent: null,
      senderId: insertMessage.senderId,
      roomId: insertMessage.roomId,
      messageType: insertMessage.messageType || "text",
      fileUrl: insertMessage.fileUrl || null,
      fileName: insertMessage.fileName || null,
      fileSize: insertMessage.fileSize || null,
      createdAt: new Date(),
      sender: undefined as any, // Will be populated when retrieved
    };
    
    this.data.messages.push(message);
    this.saveData();
    
    // Return with sender info
    const sender = this.data.users.find(user => user.id === message.senderId);
    return {
      ...message,
      sender: sender ? {
        id: sender.id,
        username: sender.username,
        avatar: sender.avatar,
      } : {
        id: message.senderId,
        username: 'Unknown User',
        avatar: null,
      }
    };
  }

  async setTypingStatus(userId: number, roomId: number, isTyping: boolean): Promise<void> {
    const existingIndex = this.data.typingIndicators.findIndex(
      indicator => indicator.userId === userId && indicator.roomId === roomId
    );

    if (existingIndex >= 0) {
      if (isTyping) {
        this.data.typingIndicators[existingIndex].isTyping = true;
      } else {
        this.data.typingIndicators.splice(existingIndex, 1);
      }
    } else if (isTyping) {
      this.data.typingIndicators.push({ userId, roomId, isTyping });
    }
    // Note: Don't save on every typing change to avoid frequent file writes
  }

  async getTypingUsers(roomId: number): Promise<User[]> {
    const typingUserIds = this.data.typingIndicators
      .filter(indicator => indicator.roomId === roomId && indicator.isTyping)
      .map(indicator => indicator.userId);
    
    return this.data.users.filter(user => typingUserIds.includes(user.id));
  }

  async authenticateUser(username: string, password: string): Promise<User | null> {
    const user = await this.getUserByUsername(username);
    if (!user) return null;
    
    const isValidPassword = await bcrypt.compare(password, user.password);
    return isValidPassword ? user : null;
  }
}