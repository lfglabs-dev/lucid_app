import AsyncStorage from '@react-native-async-storage/async-storage'
import { Platform } from 'react-native'
import * as Device from 'expo-device'
const AUTH_STORAGE_KEY = '@lucid_auth'
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
    console.log('[Auth] Starting device registration process...')
    const deviceName = await getDeviceName()
    console.log('[Auth] Device details:', {
      name: deviceName,
      platform: Platform.OS,
      model: Device.modelName,
      osVersion: Device.osVersion,
    })

    const url = `${process.env.API_BASE_URL}/register_device`
    console.log('[Auth] Making registration request to:', url)

    const requestBody = {
      device_name: deviceName,
      device_type: 'observer',
    }
    console.log('[Auth] Request payload:', requestBody)

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    })

    console.log('[Auth] Registration response status:', response.status)
    console.log(
      '[Auth] Registration response headers:',
      Object.fromEntries(response.headers.entries())
    )

    if (!response.ok) {
      const errorText = await response.text()
      console.error('[Auth] Registration failed:', {
        status: response.status,
        statusText: response.statusText,
        error: errorText,
      })
      throw new Error(`Failed to register device: ${response.status} - ${errorText}`)
    }

    const responseData = await response.json()
    console.log('[Auth] Registration successful:', {
      device_id: responseData.data.device_id,
      device_type: responseData.data.device_type,
      jwt_length: responseData.data.jwt.length,
    })
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

    const response = await fetch(`${process.env.API_BASE_URL}/refresh_session`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${jwt}`,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      debugLog('Refresh failed', { status: response.status, error: errorText })
      throw new Error(`Failed to refresh session: ${response.status} - ${errorText}`)
    }

    const data = await response.json()
    debugLog('Refresh success', { device_id: data.data?.device_id })
    return data
  } catch (error) {
    debugLog('Refresh error', error instanceof Error ? error.message : 'Unknown error')
    throw error
  }
}

export async function getOrRefreshAuth(): Promise<AuthResponse> {
  try {
    const storedAuth = await AsyncStorage.getItem(AUTH_STORAGE_KEY)
    const auth = storedAuth ? JSON.parse(storedAuth) : null

    if (auth?.data?.jwt) {
      if (!needsRefresh(auth.data.jwt)) {
        return auth
      }
      try {
        const refreshed = await refreshSession(auth.data.jwt)
        await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(refreshed))
        return refreshed
      } catch (error) {
        debugLog(
          'Refresh failed, registering new device',
          error instanceof Error ? error.message : 'Unknown error'
        )
      }
    }

    const newAuth = await registerDevice()
    await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(newAuth))
    return newAuth
  } catch (error) {
    debugLog('Auth error', error instanceof Error ? error.message : 'Unknown error')
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
