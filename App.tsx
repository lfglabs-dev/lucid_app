import React, { useEffect } from 'react'
import { AppNavigator } from './src/navigation/AppNavigator'
import { getOrRefreshAuth } from './src/services/auth'

export default function App() {
  useEffect(() => {
    // Initialize auth when app starts
    const initAuth = async () => {
      try {
        await getOrRefreshAuth()
        console.log('Auth initialized successfully')
      } catch (error) {
        console.error('Failed to initialize auth:', error)
      }
    }

    initAuth()
  }, [])

  return <AppNavigator />
}
