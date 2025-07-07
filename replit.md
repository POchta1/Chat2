# Encrypted Chat Application

## Overview

This is a secure, real-time chat application built with React, Express, and PostgreSQL. The application features end-to-end encryption, real-time messaging via WebSockets, file sharing capabilities, and a modern dark-themed UI. The system requires secret keys for user registration to maintain exclusivity and security.

## System Architecture

### Full-Stack Monolith with Separation of Concerns
- **Frontend**: React with TypeScript, using Vite for development and build
- **Backend**: Express.js with TypeScript, WebSocket support for real-time features
- **Database**: PostgreSQL with Drizzle ORM
- **Build System**: Vite for frontend, esbuild for backend bundling
- **UI Framework**: Tailwind CSS with shadcn/ui components

### Directory Structure
```
├── client/          # React frontend application
├── server/          # Express backend application
├── shared/          # Shared types and schemas
├── migrations/      # Database migrations
└── uploads/         # File upload storage
```

## Key Components

### Authentication & Security
- **Secret Key System**: 10 fixed secret keys for controlled registration (keys not visible to users)
- **Session-based Authentication**: Express sessions for user authentication
- **Password Hashing**: bcrypt for secure password storage
- **Encryption Service**: Custom encryption for sensitive data using AES-256-GCM

### Real-time Communication
- **WebSocket Server**: Built-in WebSocket server for real-time messaging
- **Typing Indicators**: Real-time typing status updates
- **Online Status**: User presence tracking
- **Message Delivery**: Instant message delivery with connection state management

### Database Schema
- **Users**: User accounts with authentication and profile data
- **Secret Keys**: Pre-generated registration keys with usage tracking
- **Chat Rooms**: Support for multiple chat rooms including general channels
- **Messages**: Encrypted message storage with file attachment support
- **Room Members**: User-room relationship management
- **Typing Indicators**: Real-time typing state tracking

### File Management
- **File Upload**: Support for images, videos, and documents up to 10MB
- **File Storage**: Local filesystem storage with organized directory structure
- **File Types**: Validation for allowed file types (images, videos, documents)
- **File Metadata**: Storage of file names, sizes, and URLs

## Data Flow

### User Registration Flow
1. User provides username, password, and one of 10 secret keys
2. System validates that the secret key exists and hasn't been used
3. Password is hashed using bcrypt
4. User record is created and secret key is marked as used
5. User is automatically logged in
6. Secret keys are never displayed to users (for maximum security)

### Message Flow
1. User types message in chat interface
2. Message is encrypted client-side (basic encryption)
3. Message is sent via WebSocket to server
4. Server validates user authentication
5. Message is stored in database with encryption
6. Message is broadcast to all room members
7. Recipients receive and decrypt message

### File Upload Flow
1. User selects file through upload interface
2. File is validated for type and size
3. File is uploaded to server storage
4. File metadata is stored in database
5. File URL is shared as a message
6. Recipients can download/view file

## External Dependencies

### Frontend Dependencies
- **React Ecosystem**: React, React DOM, React Query for state management
- **UI Components**: Radix UI primitives with shadcn/ui styling
- **Routing**: Wouter for client-side routing
- **Styling**: Tailwind CSS with custom chat theme
- **Icons**: Lucide React for iconography

### Backend Dependencies
- **Express Framework**: Core web framework with middleware
- **Database**: Drizzle ORM with Neon PostgreSQL connector
- **WebSocket**: Built-in WebSocket server for real-time features
- **File Upload**: Multer for handling multipart/form-data
- **Security**: bcrypt for password hashing, crypto for encryption
- **Session Management**: Express sessions with PostgreSQL store

### Development Dependencies
- **Build Tools**: Vite for frontend, esbuild for backend
- **TypeScript**: Full TypeScript support across the stack
- **Replit Integration**: Cartographer plugin for Replit environment

## Deployment Strategy

### Development Environment
- **Dev Server**: Vite development server with HMR
- **Backend**: tsx for TypeScript execution with hot reload
- **Database**: Drizzle migrations with push command
- **Environment**: Replit-optimized with banner integration

### Production Build
- **Frontend**: Vite build to `dist/public`
- **Backend**: esbuild bundle to `dist/index.js`
- **Database**: Drizzle migrations for schema deployment
- **File Storage**: Local filesystem with upload directory

### Environment Variables
- `DATABASE_URL`: PostgreSQL connection string
- `ENCRYPTION_KEY`: Secret key for data encryption
- `NODE_ENV`: Environment mode (development/production)

## Changelog

```
Changelog:
- July 07, 2025. Initial setup
- July 07, 2025. Successfully migrated from Replit Agent to standard Replit environment
- July 07, 2025. Fixed authentication redirect issue - users now automatically navigate to chat after login/registration
```

## User Preferences

```
Preferred communication style: Simple, everyday language.
```