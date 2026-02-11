/**
 * Secure transaction record structure using AES-256-GCM envelope encryption
 * All binary values are stored as hex strings
 */
export type TxSecureRecord = {
  /** Unique identifier for the record */
  id: string;
  
  /** Party identifier */
  partyId: string;
  
  /** Timestamp when the record was created (ISO 8601) */
  createdAt: string;
  
  /** Nonce for payload encryption (12 bytes hex) */
  payload_nonce: string;
  
  /** Encrypted payload ciphertext (hex) */
  payload_ct: string;
  
  /** Authentication tag for payload (16 bytes hex) */
  payload_tag: string;
  
  /** Nonce for DEK wrapping (12 bytes hex) */
  dek_wrap_nonce: string;
  
  /** Wrapped (encrypted) Data Encryption Key (hex) */
  dek_wrapped: string;
  
  /** Authentication tag for DEK wrapping (16 bytes hex) */
  dek_wrap_tag: string;
  
  /** Encryption algorithm used */
  alg: "AES-256-GCM";
  
  /** Master key version */
  mk_version: 1;
};
