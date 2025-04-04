import * as SecureStore from 'expo-secure-store'

const DECRYPTION_KEY_STORAGE_KEY = 'decryptionkey'
const AUTH_STORAGE_KEY = 'auth'

export async function storeDecryptionKey(key: string): Promise<void> {
  try {
    await SecureStore.setItemAsync(DECRYPTION_KEY_STORAGE_KEY, key)
  } catch (error) {
    console.error('Error storing decryption key:', error)
    throw error
  }
}

export async function getDecryptionKey(): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(DECRYPTION_KEY_STORAGE_KEY)
  } catch (error) {
    console.error('Error retrieving decryption key:', error)
    return null
  }
}

export async function removeDecryptionKey(): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(DECRYPTION_KEY_STORAGE_KEY)
  } catch (error) {
    console.error('Error removing decryption key:', error)
    throw error
  }
}

export async function storeAuthToken(authData: any): Promise<void> {
  try {
    await SecureStore.setItemAsync(AUTH_STORAGE_KEY, JSON.stringify(authData))
  } catch (error) {
    console.error('Error storing auth token:', error)
    throw error
  }
}

export async function getAuthToken(): Promise<any | null> {
  try {
    const storedAuth = await SecureStore.getItemAsync(AUTH_STORAGE_KEY)
    return storedAuth ? JSON.parse(storedAuth) : null
  } catch (error) {
    console.error('Error retrieving auth token:', error)
    return null
  }
}

export async function removeAuthToken(): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(AUTH_STORAGE_KEY)
  } catch (error) {
    console.error('Error removing auth token:', error)
    throw error
  }
}
