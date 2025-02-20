import {randomBytes, createCipheriv, createDecipheriv} from 'node:crypto'

// Encryption key and IV (Initialization Vector)
const key = randomBytes(32); // 256-bit key
const iv = randomBytes(16);  // 128-bit IV

export function encryptInteger(integer: number) {
    const cipher = createCipheriv('aes-256-cbc', key, iv);
    let encrypted = cipher.update(integer.toString(), 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return encrypted;
}

export function decryptInteger(encrypted: string) {
    const decipher = createDecipheriv('aes-256-cbc', key, iv);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return Number.parseInt(decrypted);
}