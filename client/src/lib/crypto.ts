// Simple client-side encryption utilities
// Note: This is basic encryption for demonstration. In production, use proper encryption libraries

export class SimpleCrypto {
  private key: string;

  constructor(key: string = 'default-key') {
    this.key = key;
  }

  // Simple XOR encryption (for demonstration only)
  encrypt(text: string): string {
    let encrypted = '';
    for (let i = 0; i < text.length; i++) {
      encrypted += String.fromCharCode(
        text.charCodeAt(i) ^ this.key.charCodeAt(i % this.key.length)
      );
    }
    return btoa(encrypted);
  }

  decrypt(encryptedText: string): string {
    try {
      const decoded = atob(encryptedText);
      let decrypted = '';
      for (let i = 0; i < decoded.length; i++) {
        decrypted += String.fromCharCode(
          decoded.charCodeAt(i) ^ this.key.charCodeAt(i % this.key.length)
        );
      }
      return decrypted;
    } catch (error) {
      console.error('Decryption error:', error);
      return '';
    }
  }

  // Generate a simple hash for message integrity
  hash(text: string): string {
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      const char = text.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString(16);
  }
}

// Create a global instance
export const crypto = new SimpleCrypto();
