import { Platform } from 'react-native'
import * as Device from 'expo-device'
import { API_BASE_URL } from '../constants/api'
import { storeAuthToken, getAuthToken } from './secureStorage'

const ONE_DAY_MS = 24 * 60 * 60 * 1000

// Debug helper
const debugLog = (action: string, data: any) => {
  // Only log essential info in a compact format
  console.log(`[Auth] ${action}:`, data)
}

interface AuthResponse {
  status: string
  data: {
    device_id: string
    device_type: 'observer'
    jwt: string
  }
}

function isJWTExpired(token: string): boolean {
  try {
    // Split the token into parts and get the payload
    const [, payloadBase64] = token.split('.')

    // Decode the base64 payload
    const payload = JSON.parse(atob(payloadBase64))

    // Compare current time with expiration
    // exp is in seconds, Date.now() is in milliseconds
    return Date.now() > payload.exp * 1000
  } catch (error) {
    // If there's any error parsing the token, consider it expired
    console.error('Error parsing JWT:', error)
    return true
  }
}

function needsRefresh(jwt: string): boolean {
  if (isJWTExpired(jwt)) return true

  try {
    // Split the token and get the payload
    const [, payloadBase64] = jwt.split('.')
    const payload = JSON.parse(atob(payloadBase64))

    // Check if token will expire in less than a day
    return payload.exp * 1000 - Date.now() < ONE_DAY_MS
  } catch (error) {
    console.error('Error checking JWT refresh:', error)
    return true
  }
}

async function getDeviceName(): Promise<string> {
  return `${Device.deviceName || 'Unknown Device'} (${Platform.OS})`
}

async function registerDevice(): Promise<AuthResponse> {
  try {
    const deviceName = await getDeviceName()

    const url = `${API_BASE_URL}/register_device`

    const requestBody = {
      device_name: deviceName,
      device_type: 'observer',
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('[Auth] Registration failed:', {
        status: response.status,
        statusText: response.statusText,
        error: errorText,
      })
      throw new Error(
        `Failed to register device: ${response.status} - ${errorText}`
      )
    }

    const responseData = await response.json()

    return responseData
  } catch (error) {
    console.error('[Auth] Registration error:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    })
    throw error
  }
}

async function refreshSession(jwt: string): Promise<AuthResponse> {
  try {
    debugLog('Refresh', { token: jwt.substring(0, 10) + '...' })

    const response = await fetch(`${API_BASE_URL}/refresh_session`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${jwt}`,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      debugLog('Refresh failed', { status: response.status, error: errorText })
      throw new Error(
        `Failed to refresh session: ${response.status} - ${errorText}`
      )
    }

    const data = await response.json()
    debugLog('Refresh success', { device_id: data.data?.device_id })
    return data
  } catch (error) {
    debugLog(
      'Refresh error',
      error instanceof Error ? error.message : 'Unknown error'
    )
    throw error
  }
}

export async function getOrRefreshAuth(): Promise<AuthResponse> {
  try {
    const auth = await getAuthToken()

    if (auth?.data?.jwt) {
      if (!needsRefresh(auth.data.jwt)) {
        return auth
      }
      try {
        const refreshed = await refreshSession(auth.data.jwt)
        await storeAuthToken(refreshed)
        return refreshed
      } catch (error) {
        debugLog(
          'Refresh failed, registering new device',
          error instanceof Error ? error.message : 'Unknown error'
        )
      }
    }

    const newAuth = await registerDevice()
    await storeAuthToken(newAuth)
    return newAuth
  } catch (error) {
    debugLog(
      'Auth error',
      error instanceof Error ? error.message : 'Unknown error'
    )
    throw error
  }
}

// Helper function to get the current JWT token
export async function getCurrentAuthToken(): Promise<string | null> {
  try {
    const auth = await getOrRefreshAuth()
    return auth.data.jwt
  } catch (error) {
    console.error('Error getting current token:', error)
    return null
  }
}
