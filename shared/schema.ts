import { pgTable, text, serial, timestamp, integer, boolean, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  avatar: text("avatar"),
  isOnline: boolean("is_online").default(false),
  lastSeen: timestamp("last_seen").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const secretKeys = pgTable("secret_keys", {
  id: serial("id").primaryKey(),
  key: text("key").notNull().unique(),
  isUsed: boolean("is_used").default(false),
  usedBy: integer("used_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

export const chatRooms = pgTable("chat_rooms", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  isGeneral: boolean("is_general").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  content: text("content").notNull(),
  encryptedContent: text("encrypted_content"),
  senderId: integer("sender_id").references(() => users.id).notNull(),
  roomId: integer("room_id").references(() => chatRooms.id).notNull(),
  messageType: text("message_type").default("text"), // text, image, video, file
  fileUrl: text("file_url"),
  fileName: text("file_name"),
  fileSize: integer("file_size"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const roomMembers = pgTable("room_members", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  roomId: integer("room_id").references(() => chatRooms.id).notNull(),
  joinedAt: timestamp("joined_at").defaultNow(),
});

export const typingIndicators = pgTable("typing_indicators", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  roomId: integer("room_id").references(() => chatRooms.id).notNull(),
  isTyping: boolean("is_typing").default(false),
  lastUpdated: timestamp("last_updated").defaultNow(),
});

// Zod schemas
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertMessageSchema = createInsertSchema(messages).pick({
  content: true,
  senderId: true,
  roomId: true,
  messageType: true,
  fileUrl: true,
  fileName: true,
  fileSize: true,
});

export const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

export const registerSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string(),
  secretKey: z.string().min(1, "Secret key is required"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export const updateProfileSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters").optional(),
  password: z.string().min(6, "Password must be at least 6 characters").optional(),
  avatar: z.string().optional(),
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Message = typeof messages.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type ChatRoom = typeof chatRooms.$inferSelect;
export type SecretKey = typeof secretKeys.$inferSelect;
export type LoginData = z.infer<typeof loginSchema>;
export type RegisterData = z.infer<typeof registerSchema>;
export type UpdateProfileData = z.infer<typeof updateProfileSchema>;
