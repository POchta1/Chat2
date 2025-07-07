import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
const KEY_LENGTH = 32;
const IV_LENGTH = 16;

export class EncryptionService {
  private key: Buffer;

  constructor() {
    // In production, this should be from environment variables
    this.key = crypto.scryptSync(process.env.ENCRYPTION_KEY || "default-secret-key", "salt", KEY_LENGTH);
  }

  encrypt(text: string): { encryptedData: string; iv: string; tag: string } {
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipherGCM(ALGORITHM, this.key, iv);
    
    let encrypted = cipher.update(text, "utf8", "hex");
    encrypted += cipher.final("hex");
    
    const tag = cipher.getAuthTag();
    
    return {
      encryptedData: encrypted,
      iv: iv.toString("hex"),
      tag: tag.toString("hex"),
    };
  }

  decrypt(encryptedData: string, iv: string, tag: string): string {
    const decipher = crypto.createDecipherGCM(ALGORITHM, this.key, Buffer.from(iv, "hex"));
    decipher.setAuthTag(Buffer.from(tag, "hex"));
    
    let decrypted = decipher.update(encryptedData, "hex", "utf8");
    decrypted += decipher.final("utf8");
    
    return decrypted;
  }

  generateKeyPair(): { publicKey: string; privateKey: string } {
    const { publicKey, privateKey } = crypto.generateKeyPairSync("rsa", {
      modulusLength: 2048,
      publicKeyEncoding: {
        type: "spki",
        format: "pem",
      },
      privateKeyEncoding: {
        type: "pkcs8",
        format: "pem",
      },
    });

    return { publicKey, privateKey };
  }
}

export const encryptionService = new EncryptionService();
