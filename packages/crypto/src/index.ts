import crypto from 'node:crypto';
import { TxSecureRecord } from './types.js';

export { TxSecureRecord };

/**
 * Encrypts a payload using AES-256-GCM envelope encryption
 * 
 * Process:
 * 1. Generate a random Data Encryption Key (DEK) - 32 bytes
 * 2. Encrypt the payload with the DEK using AES-256-GCM
 * 3. Wrap (encrypt) the DEK with the Master Key using AES-256-GCM
 * 4. Return all components as hex strings
 * 
 * @param partyId - Party identifier
 * @param payload - Data to encrypt
 * @returns Encrypted record with all necessary decryption metadata
 * @throws Error if encryption fails or MASTER_KEY is invalid
 */
export function encryptPayload(partyId: string, payload: unknown): TxSecureRecord {
  const masterKey = getMasterKey();
  
  // Generate a random 256-bit DEK
  const dek = crypto.randomBytes(32);
  
  // Serialize payload
  const payloadString = JSON.stringify(payload);
  const payloadBuffer = Buffer.from(payloadString, 'utf8');
  
  // Encrypt payload with DEK (AES-256-GCM)
  const payloadNonce = crypto.randomBytes(12); // 12 bytes for GCM
  const payloadCipher = crypto.createCipheriv('aes-256-gcm', dek, payloadNonce);
  
  const encryptedPayloadParts = [
    payloadCipher.update(payloadBuffer),
    payloadCipher.final()
  ];
  const payloadCt = Buffer.concat(encryptedPayloadParts);
  const payloadTag = payloadCipher.getAuthTag(); // 16 bytes for GCM
  
  // Wrap DEK with Master Key (AES-256-GCM)
  const dekWrapNonce = crypto.randomBytes(12); // 12 bytes for GCM
  const dekCipher = crypto.createCipheriv('aes-256-gcm', masterKey, dekWrapNonce);
  
  const encryptedDekParts = [
    dekCipher.update(dek),
    dekCipher.final()
  ];
  const dekWrapped = Buffer.concat(encryptedDekParts);
  const dekWrapTag = dekCipher.getAuthTag(); // 16 bytes for GCM
  
  return {
    id: crypto.randomUUID(),
    partyId,
    createdAt: new Date().toISOString(),
    payload_nonce: payloadNonce.toString('hex'),
    payload_ct: payloadCt.toString('hex'),
    payload_tag: payloadTag.toString('hex'),
    dek_wrap_nonce: dekWrapNonce.toString('hex'),
    dek_wrapped: dekWrapped.toString('hex'),
    dek_wrap_tag: dekWrapTag.toString('hex'),
    alg: 'AES-256-GCM',
    mk_version: 1
  };
}

/**
 * Decrypts a secure transaction record
 * 
 * Process:
 * 1. Validate all inputs (hex format, nonce/tag lengths)
 * 2. Unwrap (decrypt) the DEK using the Master Key
 * 3. Decrypt the payload using the unwrapped DEK
 * 4. Parse and return the original payload
 * 
 * @param record - Encrypted record to decrypt
 * @returns Original payload
 * @throws Error if validation fails, decryption fails, or data is tampered
 */
export function decryptPayload(record: TxSecureRecord): unknown {
  // Validate record structure
  validateRecord(record);
  
  const masterKey = getMasterKey();
  
  try {
    // Unwrap DEK with Master Key
    const dekWrapNonce = Buffer.from(record.dek_wrap_nonce, 'hex');
    const dekWrapped = Buffer.from(record.dek_wrapped, 'hex');
    const dekWrapTag = Buffer.from(record.dek_wrap_tag, 'hex');
    
    const dekDecipher = crypto.createDecipheriv(
      'aes-256-gcm',
      masterKey,
      dekWrapNonce
    );
    dekDecipher.setAuthTag(dekWrapTag);
    
    const dekParts = [
      dekDecipher.update(dekWrapped),
      dekDecipher.final()
    ];
    const dek = Buffer.concat(dekParts);
    
    // Decrypt payload with DEK
    const payloadNonce = Buffer.from(record.payload_nonce, 'hex');
    const payloadCt = Buffer.from(record.payload_ct, 'hex');
    const payloadTag = Buffer.from(record.payload_tag, 'hex');
    
    const payloadDecipher = crypto.createDecipheriv(
      'aes-256-gcm',
      dek,
      payloadNonce
    );
    payloadDecipher.setAuthTag(payloadTag);
    
    const payloadParts = [
      payloadDecipher.update(payloadCt),
      payloadDecipher.final()
    ];
    const decryptedPayload = Buffer.concat(payloadParts);
    
    return JSON.parse(decryptedPayload.toString('utf8'));
  } catch (error) {
    if (error instanceof Error) {
      // GCM authentication failures indicate tampering
      if (error.message.includes('Unsupported state') || 
          error.message.includes('bad decrypt')) {
        throw new Error('Decryption failed: data may be tampered or corrupted');
      }
      throw new Error(`Decryption failed: ${error.message}`);
    }
    throw new Error('Decryption failed: unknown error');
  }
}

/**
 * Validates a TxSecureRecord before decryption
 * 
 * Checks:
 * - All hex fields are valid hex strings
 * - Nonces are exactly 12 bytes (24 hex chars)
 * - Tags are exactly 16 bytes (32 hex chars)
 * - Algorithm and version are correct
 * 
 * @param record - Record to validate
 * @throws Error if validation fails
 */
function validateRecord(record: TxSecureRecord): void {
  // Validate algorithm
  if (record.alg !== 'AES-256-GCM') {
    throw new Error(`Unsupported algorithm: ${record.alg}`);
  }
  
  // Validate master key version
  if (record.mk_version !== 1) {
    throw new Error(`Unsupported master key version: ${record.mk_version}`);
  }
  
  // Validate hex format and lengths
  const hexFields: Array<{ name: string; value: string; expectedBytes?: number }> = [
    { name: 'payload_nonce', value: record.payload_nonce, expectedBytes: 12 },
    { name: 'payload_ct', value: record.payload_ct },
    { name: 'payload_tag', value: record.payload_tag, expectedBytes: 16 },
    { name: 'dek_wrap_nonce', value: record.dek_wrap_nonce, expectedBytes: 12 },
    { name: 'dek_wrapped', value: record.dek_wrapped },
    { name: 'dek_wrap_tag', value: record.dek_wrap_tag, expectedBytes: 16 },
  ];
  
  for (const field of hexFields) {
    // Check if valid hex string
    if (!/^[0-9a-fA-F]*$/.test(field.value)) {
      throw new Error(`Invalid hex in field '${field.name}'`);
    }
    
    // Check if even length (valid hex encoding)
    if (field.value.length % 2 !== 0) {
      throw new Error(`Invalid hex length in field '${field.name}': must be even`);
    }
    
    // Check expected byte length if specified
    if (field.expectedBytes !== undefined) {
      const actualBytes = field.value.length / 2;
      if (actualBytes !== field.expectedBytes) {
        throw new Error(
          `Invalid ${field.name} length: expected ${field.expectedBytes} bytes ` +
          `(${field.expectedBytes * 2} hex chars), got ${actualBytes} bytes ` +
          `(${field.value.length} hex chars)`
        );
      }
    }
  }
}

/**
 * Retrieves and validates the Master Key from environment
 * @throws Error if MASTER_KEY is not defined or invalid
 */
function getMasterKey(): Buffer {
  const masterKeyHex = process.env.MASTER_KEY;
  
  if (!masterKeyHex) {
    throw new Error('MASTER_KEY environment variable is not defined');
  }
  
  // Validate hex format
  if (!/^[0-9a-fA-F]+$/.test(masterKeyHex)) {
    throw new Error('MASTER_KEY must be a valid hex string');
  }
  
  const masterKey = Buffer.from(masterKeyHex, 'hex');
  
  if (masterKey.length !== 32) {
    throw new Error(
      `MASTER_KEY must be exactly 32 bytes (64 hex characters), got ${masterKey.length} bytes`
    );
  }
  
  return masterKey;
}
