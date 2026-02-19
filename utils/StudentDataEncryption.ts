/**
 * utils/StudentDataEncryption.ts
 *
 * Application-level AES-256-GCM encryption for PII not covered by pgsodium TCE.
 *
 * Encryption layers:
 *  Layer 1 — DB: pgsodium TCE (salary, tax_id, bank_iban in employees table)
 *  Layer 2 — App: THIS FILE — PII handled in-flight or in Supabase Storage
 *
 * Algorithm: AES-256-GCM
 *  - 256-bit key, 96-bit random IV per encryption, 128-bit auth tag
 *  - Output: base64(iv || ciphertext || authTag)
 *
 * Key management:
 *  Store the key in Supabase Vault. NEVER hardcode it.
 */

const ALGORITHM  = 'AES-GCM';
const KEY_LENGTH = 256;
const IV_LENGTH  = 12;
const TAG_LENGTH = 128;

function getSubtleCrypto(): SubtleCrypto {
  if (typeof window !== 'undefined' && window.crypto?.subtle) return window.crypto.subtle;
  if (typeof globalThis !== 'undefined' && (globalThis as any).crypto?.subtle)
    return (globalThis as any).crypto.subtle as SubtleCrypto;
  throw new Error('[StudentDataEncryption] SubtleCrypto not available.');
}

function base64Encode(buffer: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(buffer)));
}

function base64Decode(str: string): Uint8Array {
  const binary = atob(str);
  const bytes   = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

export class StudentDataEncryption {
  private constructor(private readonly cryptoKey: CryptoKey) {}

  /**
   * Load from Supabase Vault secret (base64-encoded 32-byte key).
   */
  static async fromVaultSecret(vaultSecret: string): Promise<StudentDataEncryption> {
    const cryptoKey = await getSubtleCrypto().importKey(
      'raw', base64Decode(vaultSecret),
      { name: ALGORITHM }, false, ['encrypt', 'decrypt']
    );
    return new StudentDataEncryption(cryptoKey);
  }

  /**
   * Dev/testing only: generate a random key and log it for Vault storage.
   * NEVER use without persisting the key first.
   */
  static async generateKey(): Promise<{ instance: StudentDataEncryption; base64Key: string }> {
    const subtle    = getSubtleCrypto();
    const cryptoKey = await subtle.generateKey(
      { name: ALGORITHM, length: KEY_LENGTH }, true, ['encrypt', 'decrypt']
    );
    const base64Key = base64Encode(await subtle.exportKey('raw', cryptoKey));
    return { instance: new StudentDataEncryption(cryptoKey), base64Key };
  }

  /**
   * Encrypts a plaintext string.
   * Output format: base64(IV[12] || ciphertext+GCMtag)
   */
  async encrypt(plaintext: string): Promise<string> {
    if (!plaintext) return '';
    const subtle  = getSubtleCrypto();
    const iv      = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
    const cipher  = await subtle.encrypt(
      { name: ALGORITHM, iv, tagLength: TAG_LENGTH },
      this.cryptoKey,
      new TextEncoder().encode(plaintext)
    );
    const combined = new Uint8Array(IV_LENGTH + cipher.byteLength);
    combined.set(iv, 0);
    combined.set(new Uint8Array(cipher), IV_LENGTH);
    return base64Encode(combined.buffer);
  }

  /**
   * Decrypts a value from encrypt().
   * Throws if data has been tampered with (GCM auth tag failure).
   */
  async decrypt(encryptedBase64: string): Promise<string> {
    if (!encryptedBase64) return '';
    const subtle   = getSubtleCrypto();
    const combined = base64Decode(encryptedBase64);
    const iv        = combined.slice(0, IV_LENGTH);
    const ciphertext = combined.slice(IV_LENGTH);
    let plainBuffer: ArrayBuffer;
    try {
      plainBuffer = await subtle.decrypt(
        { name: ALGORITHM, iv, tagLength: TAG_LENGTH },
        this.cryptoKey, ciphertext
      );
    } catch {
      throw new Error(
        '[StudentDataEncryption] Decryption failed — data may have been tampered with.'
      );
    }
    return new TextDecoder().decode(plainBuffer);
  }

  async encryptRecord<T extends Record<string, string | undefined>>(record: T): Promise<T> {
    const result: Record<string, string | undefined> = {};
    for (const [k, v] of Object.entries(record))
      result[k] = v != null ? await this.encrypt(v) : undefined;
    return result as T;
  }

  async decryptRecord<T extends Record<string, string | undefined>>(record: T): Promise<T> {
    const result: Record<string, string | undefined> = {};
    for (const [k, v] of Object.entries(record))
      result[k] = v != null ? await this.decrypt(v) : undefined;
    return result as T;
  }
}

let _instance: StudentDataEncryption | null = null;

export async function getEncryptionService(
  vaultSecret: string
): Promise<StudentDataEncryption> {
  if (!_instance) _instance = await StudentDataEncryption.fromVaultSecret(vaultSecret);
  return _instance;
}
