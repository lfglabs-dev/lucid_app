import React, { useState, useRef } from 'react'
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native'
import { CameraView, useCameraPermissions } from 'expo-camera'
import { useIsFocused } from '@react-navigation/native'
import { getCurrentAuthToken } from '../../services/auth'
import { API_BASE_URL } from '../../constants/api'
import { storeDecryptionKey } from '../../services/secureStorage'

interface ScanQRScreenProps {
  onMainAction: () => void
  onSecondaryAction?: () => void
}

export const ScanQRScreen = ({
  onMainAction,
  onSecondaryAction,
}: ScanQRScreenProps) => {
  const [permission, requestPermission] = useCameraPermissions()
  const [isProcessing, setIsProcessing] = useState(false)
  const isFocused = useIsFocused()
  const processingRef = useRef(false)

  const approveLink = async (linkToken: string) => {
    try {
      console.log(
        '[ScanQR] Starting approveLink with token:',
        linkToken.substring(0, 10) + '...'
      )

      const authToken = await getCurrentAuthToken()
      if (!authToken) {
        console.error('[ScanQR] No auth token available')
        throw new Error('No auth token available')
      }
      console.log(
        '[ScanQR] Got auth token:',
        authToken.substring(0, 10) + '...'
      )

      console.log(
        '[ScanQR] Making API request to:',
        `${API_BASE_URL}/approve_link`
      )
      const response = await fetch(`${API_BASE_URL}/approve_link`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ token: linkToken }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('[ScanQR] API Error:', {
          status: response.status,
          statusText: response.statusText,
          body: errorText,
        })
        throw new Error(
          `Failed to link token: ${response.status} ${response.statusText}`
        )
      }

      const responseData = await response.json()
      console.log('[ScanQR] Link approved successfully:', responseData)
      return true
    } catch (error) {
      console.error('[ScanQR] Error in approveLink:', {
        error,
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      })
      return false
    }
  }

  const handleBarCodeScanned = async ({ data }: { data: string }) => {
    if (processingRef.current) {
      console.log('[ScanQR] Ignoring scan - already processing')
      return
    }

    processingRef.current = true
    setIsProcessing(true)
    console.log('[ScanQR] Starting QR code processing')

    try {
      console.log(
        '[ScanQR] Attempting to parse QR data:',
        data.substring(0, 50) + '...'
      )
      const qrData = JSON.parse(data)
      console.log('[ScanQR] Parsed QR data:', {
        hasApp: !!qrData.app,
        hasToken: !!qrData.token,
        hasDecryptionKey: !!qrData.decryptionKey,
      })

      if (!qrData.app || !qrData.token) {
        console.error('[ScanQR] Missing required fields:', {
          hasApp: !!qrData.app,
          hasToken: !!qrData.token,
        })
        throw new Error('Invalid QR code format')
      }

      const linkToken = qrData.token.replace('token-', '')
      console.log(
        '[ScanQR] Extracted link token:',
        linkToken.substring(0, 10) + '...'
      )

      if (!linkToken) {
        console.error('[ScanQR] Token is empty after prefix removal')
        throw new Error('Invalid token format')
      }

      console.log('[ScanQR] Attempting to link token with API')
      const isLinked = await approveLink(linkToken)

      if (!isLinked) {
        console.error('[ScanQR] API linking failed')
        throw new Error('Failed to link token with server')
      }

      if (qrData.decryptionKey) {
        try {
          console.log('[ScanQR] Attempting to store decryption key')
          const keyMaterial = qrData.decryptionKey.k
          if (!keyMaterial) {
            console.error('[ScanQR] No key material found in decryption key')
            throw new Error('Invalid decryption key format')
          }
          await storeDecryptionKey(String(keyMaterial))
          console.log('[ScanQR] Successfully stored decryption key')
        } catch (error) {
          console.error('[ScanQR] Error storing decryption key:', error)
        }
      }

      console.log('[ScanQR] Successfully completed QR processing')
      setIsProcessing(false)
      processingRef.current = false
      onMainAction()
    } catch (error) {
      console.error('[ScanQR] Error processing QR code:', {
        error,
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      })

      Alert.alert('Error', 'Failed to process QR code. Please try again.', [
        {
          text: 'OK',
          onPress: () => {
            setIsProcessing(false)
            processingRef.current = false
          },
        },
      ])
    }
  }

  if (!permission) {
    return (
      <View style={styles.container}>
        <Text style={styles.permissionText}>
          Requesting camera permission...
        </Text>
      </View>
    )
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.permissionText}>
          Camera permission is required to scan QR codes
        </Text>
        <TouchableOpacity style={styles.button} onPress={requestPermission}>
          <Text style={styles.buttonText}>Grant Camera Permission</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.linkButton} onPress={onSecondaryAction}>
          <Text style={styles.linkText}>Skip for now</Text>
        </TouchableOpacity>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <View style={styles.cameraContainer}>
        <CameraView
          style={styles.camera}
          facing="back"
          onBarcodeScanned={handleBarCodeScanned}
          barcodeScannerSettings={{
            barcodeTypes: ['qr'],
          }}
          active={isFocused && !isProcessing}
        />
        <View style={styles.scannerOverlay}>
          <Text style={styles.scannerText}>Scan QR Code</Text>
          <View style={styles.scannerFrame}>
            <View style={[styles.corner, styles.topLeft]} />
            <View style={[styles.corner, styles.topRight]} />
            <View style={[styles.corner, styles.bottomLeft]} />
            <View style={[styles.corner, styles.bottomRight]} />
          </View>
        </View>
      </View>

      <View style={styles.instructionsContainer}>
        <Text style={styles.instructionsTitle}>
          Open the Lucid Extension on your laptop and scan the QR code
        </Text>
        <TouchableOpacity style={styles.linkButton} onPress={onSecondaryAction}>
          <Text style={styles.linkText}>Skip for now</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  cameraContainer: {
    flex: 1,
    position: 'relative',
  },
  camera: {
    flex: 1,
  },
  scannerOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-start',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingTop: '35%',
  },
  scannerText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 40,
  },
  scannerFrame: {
    width: 250,
    height: 250,
    position: 'relative',
    backgroundColor: 'transparent',
  },
  corner: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderColor: '#fff',
    borderWidth: 3,
  },
  topLeft: {
    top: 0,
    left: 0,
    borderBottomWidth: 0,
    borderRightWidth: 0,
    borderTopLeftRadius: 12,
  },
  topRight: {
    top: 0,
    right: 0,
    borderBottomWidth: 0,
    borderLeftWidth: 0,
    borderTopRightRadius: 12,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderTopWidth: 0,
    borderRightWidth: 0,
    borderBottomLeftRadius: 12,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderTopWidth: 0,
    borderLeftWidth: 0,
    borderBottomRightRadius: 12,
  },
  permissionText: {
    fontSize: 16,
    color: '#fff',
    textAlign: 'center',
    marginBottom: 20,
    padding: 20,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 20,
    marginBottom: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  linkButton: {
    marginTop: 10,
    marginBottom: 35,
    alignItems: 'center',
  },
  linkText: {
    color: 'grey',
    fontSize: 15,
  },
  instructionsContainer: {
    backgroundColor: '#fff',
    padding: 20,
    paddingBottom: 40,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  instructionsTitle: {
    color: '#000',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  instructionsText: {
    color: '#333',
    fontSize: 14,
    lineHeight: 20,
  },
})
