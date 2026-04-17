import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'crypto'

const ALGORITHM = 'aes-256-gcm'
const IV_LENGTH = 16
const AUTH_TAG_LENGTH = 16
const KEY_LENGTH = 32

/**
 * Derives a 32-byte key from the ENCRYPTION_KEY environment variable.
 * Uses scrypt with a static salt (acceptable for single-tenant key derivation).
 */
function deriveKey(rawKey: string): Buffer {
  const salt = 'dian-encryption-salt'
  return scryptSync(rawKey, salt, KEY_LENGTH)
}

/**
 * Encrypts a JSON-serializable object and returns a hex string.
 * Format: iv(32) + authTag(32) + encryptedPayload(hex)
 */
export function encryptSecret<T extends Record<string, unknown>>(data: T): string {
  const key = deriveKey(process.env.ENCRYPTION_KEY!)
  const iv = randomBytes(IV_LENGTH)

  const plaintext = JSON.stringify(data)
  const cipher = createCipheriv(ALGORITHM, key, iv)

  let encrypted = cipher.update(plaintext, 'utf8', 'hex')
  encrypted += cipher.final('hex')

  const authTag = cipher.getAuthTag().toString('hex')

  return `${iv.toString('hex')}${authTag}${encrypted}`
}

/**
 * Decrypts a hex string back to the original object.
 * Returns null if the key is missing, invalid, or tampered.
 */
export function decryptSecret<T extends Record<string, unknown>>(payload: string): T | null {
  const rawKey = process.env.ENCRYPTION_KEY
  if (!rawKey) return null

  try {
    const key = deriveKey(rawKey)

    const ivHex = payload.slice(0, IV_LENGTH * 2)
    const authTagHex = payload.slice(IV_LENGTH * 2, IV_LENGTH * 2 + AUTH_TAG_LENGTH * 2)
    const encrypted = payload.slice(IV_LENGTH * 2 + AUTH_TAG_LENGTH * 2)

    const iv = Buffer.from(ivHex, 'hex')
    const authTag = Buffer.from(authTagHex, 'hex')

    const decipher = createDecipheriv(ALGORITHM, key, iv)
    decipher.setAuthTag(authTag)

    let decrypted = decipher.update(encrypted, 'hex', 'utf8')
    decrypted += decipher.final('utf8')

    return JSON.parse(decrypted) as T
  } catch {
    return null
  }
}
