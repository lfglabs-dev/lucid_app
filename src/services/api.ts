import { EIP712SafeTx } from '../types'
import { getCurrentAuthToken } from './auth'
import { API_BASE_URL } from '../constants/api'

interface Request {
  request_id: string
  request_type: 'eoa_transaction' | 'eip712'
  content: EIP712SafeTx
  from_device: string
  creation_date: string
}

interface ApiResponse {
  status: string
  data: {
    requests: Request[]
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
    excludeIds.forEach(id => queryParams.append('exclude', id))

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
      throw new Error(`Failed to fetch transactions: ${response.status} ${response.statusText}`)
    }

    const data: ApiResponse = await response.json()
    return data.data.requests
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
