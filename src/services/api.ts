import { getCurrentAuthToken } from './auth'
import { API_BASE_URL } from '../constants/api'
import { getDecryptionKey } from './secureStorage'
import { EIP712SafeTx } from '../types'
import CryptoES from 'crypto-es'
import { wordArrayToUint8Array } from './utils'
// @ts-ignore
import { decode } from 'cbor-js'

interface Request {
  request_id: string
  request_type: 'eoa_transaction' | 'eip712'
  content: EIP712SafeTx // Always EIP712SafeTx after decryption
  from_device: string
  creation_date: string
}

interface ApiResponse {
  status: string
  data: {
    requests: Request[]
  }
}

// Helper function to decrypt a single transaction
async function decryptTransaction(encryptedContent: string, decryptionKey: string): Promise<EIP712SafeTx> {
  try {
    // 1. Decode base64 input to Uint8Array
    const binary = Uint8Array.from(atob(encryptedContent), (c) => c.charCodeAt(0))

    // 2. Extract IV (first 16 bytes)
    const ivBytes = binary.slice(0, 16)
    const iv = CryptoES.lib.WordArray.create(ivBytes)

    // 3. Extract ciphertext (remaining bytes)
    const ciphertextBytes = binary.slice(16)
    const ciphertext = CryptoES.lib.WordArray.create(ciphertextBytes)

    // 4. Decode base64 key to WordArray
    const key = CryptoES.enc.Base64.parse(decryptionKey)

    // 5. Decrypt with AES-CTR, no padding
    const decrypted = CryptoES.AES.decrypt({ ciphertext }, key, {
      mode: CryptoES.mode.CTR,
      padding: CryptoES.pad.NoPadding,
      iv,
    })

    // 6. Convert decrypted data to Uint8Array
    const decryptedBytes = wordArrayToUint8Array(decrypted)

    // 7. Decode CBOR to get original JSON
    const decoded = decode(decryptedBytes.buffer.slice(decryptedBytes.byteOffset, decryptedBytes.byteOffset + decryptedBytes.byteLength))

    return decoded as EIP712SafeTx
  } catch (error) {
    console.error('[Decryption] Error decrypting transaction:', error)
    throw error
  }
}

export const fetchTransactions = async (
  token: string,
  minTimestamp?: string,
  excludeIds: string[] = []
): Promise<Request[]> => {
  try {
    const queryParams = new URLSearchParams()
    if (minTimestamp) queryParams.append('min_timestamp', minTimestamp)
    excludeIds.forEach((id) => queryParams.append('exclude', id))

    const url = `${API_BASE_URL}/requests?${queryParams.toString()}`

    console.log('[API] Fetching transactions with params:', url)

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('[API] Error response:', {
        status: response.status,
        statusText: response.statusText,
        body: errorText,
      })
      throw new Error(
        `Failed to fetch transactions: ${response.status} ${response.statusText}`
      )
    }

    const data: ApiResponse = await response.json()
    const decryptionKey = await getDecryptionKey()
    if (!decryptionKey) {
      throw new Error('No decryption key available')
    }

    // Decrypt each transaction
    const decryptedTransactions = await Promise.all(
      data.data.requests.map(async (request) => ({
        ...request,
        content: await decryptTransaction(request.content as unknown as string, decryptionKey)
      }))
    )

    return decryptedTransactions
  } catch (error) {
    console.error('[API] Error fetching past transactions:', error)
    throw error
  }
}

export interface LinkedDevice {
  device_id: string
  device_name: string
  device_type: 'observer' | 'initiator'
}

export interface LinkedDevicesResponse {
  status: string
  data: {
    peers: LinkedDevice[]
    trusted: LinkedDevice[]
    trusters: LinkedDevice[]
  }
}

export const fetchLinkedDevices = async (): Promise<LinkedDevicesResponse> => {
  const token = await getCurrentAuthToken()
  if (!token) {
    throw new Error('No authentication token available')
  }

  const response = await fetch(`${API_BASE_URL}/linked_devices`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  })

  if (!response.ok) {
    throw new Error('Failed to fetch linked devices')
  }

  return response.json()
}
