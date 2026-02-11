'use client';

import { useState } from 'react';
import { TxSecureRecord } from '@mirfa/crypto';

export default function HomePage() {
  const [partyId, setPartyId] = useState('');
  const [jsonPayload, setJsonPayload] = useState('');
  const [recordId, setRecordId] = useState('');
  const [encryptedRecord, setEncryptedRecord] = useState<TxSecureRecord | null>(null);
  const [decryptedPayload, setDecryptedPayload] = useState<unknown>(null);
  const [error, setError] = useState('');

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

  const handleEncryptAndSave = async () => {
    setError('');
    setEncryptedRecord(null);
    setDecryptedPayload(null);

    if (!partyId.trim()) {
      setError('Party ID is required');
      return;
    }

    if (!jsonPayload.trim()) {
      setError('JSON payload is required');
      return;
    }

    let payload: unknown;
    try {
      payload = JSON.parse(jsonPayload);
    } catch (err) {
      setError('Invalid JSON payload');
      return;
    }

    try {
      const response = await fetch(`${API_URL}/tx/encrypt`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ partyId, payload }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Encryption failed');
      }

      const record: TxSecureRecord = await response.json();
      setEncryptedRecord(record);
      setRecordId(record.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to encrypt payload');
    }
  };

  const handleFetchById = async () => {
    setError('');
    setEncryptedRecord(null);
    setDecryptedPayload(null);

    if (!recordId.trim()) {
      setError('Record ID is required');
      return;
    }

    try {
      const response = await fetch(`${API_URL}/tx/${recordId}`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch record');
      }

      const record: TxSecureRecord = await response.json();
      setEncryptedRecord(record);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch record');
    }
  };

  const handleDecrypt = async () => {
    setError('');
    setDecryptedPayload(null);

    if (!recordId.trim()) {
      setError('Record ID is required');
      return;
    }

    try {
      const response = await fetch(`${API_URL}/tx/${recordId}/decrypt`, {
        method: 'POST',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Decryption failed');
      }

      const data = await response.json();
      setDecryptedPayload(data.payload);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to decrypt payload');
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '40px 20px' }}>
      <h1 style={{ fontSize: '32px', marginBottom: '30px' }}>
        Secure Transactions Mini-App
      </h1>

      {error && (
        <div
          style={{
            padding: '15px',
            marginBottom: '20px',
            backgroundColor: '#fee',
            border: '1px solid #fcc',
            borderRadius: '4px',
            color: '#c00',
          }}
        >
          {error}
        </div>
      )}

      <div style={{ marginBottom: '30px' }}>
        <h2 style={{ fontSize: '20px', marginBottom: '15px' }}>Create Encrypted Record</h2>
        
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            Party ID
          </label>
          <input
            type="text"
            value={partyId}
            onChange={(e) => setPartyId(e.target.value)}
            placeholder="Enter party ID"
            style={{
              width: '100%',
              padding: '10px',
              fontSize: '14px',
              border: '1px solid #ccc',
              borderRadius: '4px',
              boxSizing: 'border-box',
            }}
          />
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            JSON Payload
          </label>
          <textarea
            value={jsonPayload}
            onChange={(e) => setJsonPayload(e.target.value)}
            placeholder='{"key": "value"}'
            rows={6}
            style={{
              width: '100%',
              padding: '10px',
              fontSize: '14px',
              border: '1px solid #ccc',
              borderRadius: '4px',
              fontFamily: 'monospace',
              boxSizing: 'border-box',
            }}
          />
        </div>

        <button
          onClick={handleEncryptAndSave}
          style={{
            padding: '12px 24px',
            fontSize: '16px',
            backgroundColor: '#0070f3',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontWeight: 'bold',
          }}
        >
          Encrypt & Save
        </button>
      </div>

      <div style={{ marginBottom: '30px', borderTop: '2px solid #eee', paddingTop: '30px' }}>
        <h2 style={{ fontSize: '20px', marginBottom: '15px' }}>Fetch & Decrypt</h2>
        
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            Record ID
          </label>
          <input
            type="text"
            value={recordId}
            onChange={(e) => setRecordId(e.target.value)}
            placeholder="Enter record ID"
            style={{
              width: '100%',
              padding: '10px',
              fontSize: '14px',
              border: '1px solid #ccc',
              borderRadius: '4px',
              boxSizing: 'border-box',
            }}
          />
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={handleFetchById}
            style={{
              padding: '12px 24px',
              fontSize: '16px',
              backgroundColor: '#10b981',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: 'bold',
            }}
          >
            Fetch by ID
          </button>

          <button
            onClick={handleDecrypt}
            style={{
              padding: '12px 24px',
              fontSize: '16px',
              backgroundColor: '#f59e0b',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: 'bold',
            }}
          >
            Decrypt
          </button>
        </div>
      </div>

      {encryptedRecord && (
        <div style={{ marginBottom: '30px' }}>
          <h3 style={{ fontSize: '18px', marginBottom: '10px' }}>Encrypted Record</h3>
          <pre
            style={{
              padding: '15px',
              backgroundColor: '#f5f5f5',
              border: '1px solid #ddd',
              borderRadius: '4px',
              overflow: 'auto',
              fontSize: '12px',
              fontFamily: 'monospace',
            }}
          >
            {JSON.stringify(encryptedRecord, null, 2)}
          </pre>
        </div>
      )}

      {decryptedPayload !== null && (
        <div style={{ marginBottom: '30px' }}>
          <h3 style={{ fontSize: '18px', marginBottom: '10px' }}>Decrypted Payload</h3>
          <pre
            style={{
              padding: '15px',
              backgroundColor: '#f0fdf4',
              border: '1px solid #86efac',
              borderRadius: '4px',
              overflow: 'auto',
              fontSize: '12px',
              fontFamily: 'monospace',
            }}
          >
            {JSON.stringify(decryptedPayload, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
