import React, { useState, useRef } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Image,
} from 'react-native'
import { CameraView, useCameraPermissions } from 'expo-camera'
import { getCurrentAuthToken } from '../services/auth'
import { API_BASE_URL } from '../constants/api'
import { SuccessView } from '../components/SuccessView'
import { useIsFocused } from '@react-navigation/native'
import { storeDecryptionKey } from '../services/secureStorage'
import { Ionicons } from '@expo/vector-icons'
export const LinkDeviceScreen = () => {
  const [permission, requestPermission] = useCameraPermissions()
  const [isProcessing, setIsProcessing] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [deviceName, setDeviceName] = useState('')
  const isFocused = useIsFocused()
  // Ref for immediate checks
  const processingRef = useRef(false)

  const approveLink = async (linkToken: string) => {
    try {
      // Get the current auth token
      const authToken = await getCurrentAuthToken()
      if (!authToken) {
        throw new Error('No auth token available')
      }

      const response = await fetch(`${API_BASE_URL}/approve_link`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ token: linkToken }),
      })

      if (!response.ok) {
        const errorData = await response.text()
        console.error('[LinkDevice] API Error response:', {
          status: response.status,
          statusText: response.statusText,
          body: errorData,
        })
        throw new Error(
          `Failed to link token: ${response.status} ${response.statusText}`
        )
      }

      const responseData = await response.json()
      console.log('[LinkDevice] Link approved successfully:', responseData)
      return true
    } catch (error) {
      if (
        error instanceof TypeError &&
        error.message === 'Network request failed'
      ) {
        console.error(
          '[LinkDevice] Network error - Is the server running at',
          API_BASE_URL,
          '?'
        )
      }
      console.error('[LinkDevice] Error linking token:', {
        error,
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      })
      return false
    }
  }

  const handleBarCodeScanned = async ({ data }: { data: string }) => {
    // Don't process if already processing
    if (processingRef.current) {
      console.log('[LinkDevice] Ignoring scan - already processing')
      return
    }
    processingRef.current = true
    setIsProcessing(true)

    try {
      const qrData = JSON.parse(data)
      console.log('[LinkDevice] QR data:', qrData)

      // Validate required fields
      if (!qrData.app || !qrData.token) {
        console.error('[LinkDevice] Missing required fields:', {
          hasApp: !!qrData.app,
          hasToken: !!qrData.token,
        })
        throw new Error('Invalid QR code format')
      }

      // Extract the actual token (remove 'token-' prefix)
      const linkToken = qrData.token.replace('token-', '')

      if (!linkToken) {
        console.error('[LinkDevice] Token is empty after prefix removal')
        throw new Error('Invalid token format')
      }

      // Link the token with the API
      const isLinked = await approveLink(linkToken)

      if (!isLinked) {
        console.error('[LinkDevice] API linking failed')
        throw new Error('Failed to link token with server')
      }

      // Store the decryption key if provided
      if (qrData.decryptionKey) {
        try {
          // Extract just the key material (k property) from the JWK object
          const keyMaterial = qrData.decryptionKey.k
          if (!keyMaterial) {
            console.error(
              '[LinkDevice] No key material found in decryption key'
            )
            throw new Error('Invalid decryption key format')
          }
          await storeDecryptionKey(String(keyMaterial))
        } catch (error) {
          console.error('[LinkDevice] Error storing decryption key:', error)
          // Continue with the linking process even if storing the key fails
        }
      }

      // Set device name and show success view
      setDeviceName(qrData.name || 'Chrome Extension')
      setShowSuccess(true)

      // Reset states only after successful linking
      setIsProcessing(false)
      processingRef.current = false
    } catch (error) {
      console.error('[LinkDevice] Error processing QR code:', error)
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

  if (showSuccess) {
    return (
      <SuccessView
        title="Device Connected!"
        description={deviceName}
        navigateToTab="Transactions"
      />
    )
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
      <View style={styles.screenContainer}>
        <View style={styles.contentContainer}>
          <View style={styles.imageContainer}>
            <Image
              source={require('../../assets/onboarding/qr_screen.png')}
              style={styles.image}
              resizeMode="contain"
            />
          </View>
          <Text style={styles.titleNoPermission}>
            Scan your extension QR code
          </Text>
          <Text style={styles.bodyNoPermission}>
            By scanning your extension QR code, you link your laptop wallets to
            your Lucid app and you'll be able to simulate all your transactions.
          </Text>
        </View>
        <TouchableOpacity style={styles.button} onPress={requestPermission}>
          <Text style={styles.buttonText}>Scan QR code</Text>
          <Ionicons name="arrow-forward" size={20} color="#fff" />
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
        <Text style={styles.instructionsTitle}>Link Your Laptop Wallets</Text>
        <Text style={styles.instructionsText}>
          1. Install the Lucid Chrome extension in the Chrome Web Store{'\n'}
          2. Scan the QR code displayed when you open it
        </Text>
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
  infoButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    padding: 8,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  closeButton: {
    padding: 5,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    color: '#333',
  },
  permissionText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
    padding: 20,
  },
  permissionButton: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 20,
  },
  permissionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  scanAgainButton: {
    position: 'absolute',
    top: 20,
    left: 20,
    right: 20,
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  scanAgainButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  instructionsContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    padding: 20,
    paddingBottom: 40,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  instructionsTitle: {
    color: '#000',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  instructionsText: {
    color: '#333',
    fontSize: 14,
    lineHeight: 20,
  },
  processingOverlay: {
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  processingText: {
    color: '#fff',
    fontSize: 18,
  },

  screenContainer: {
    flex: 1,
    padding: 20,
    justifyContent: 'space-between',
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  titleNoPermission: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  bodyNoPermission: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  imageContainer: {
    width: '100%',
    height: 230,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
    marginTop: 20,
  },
  image: {
    width: '100%',
    height: '100%',
  },

  button: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 8,
  },
  linkButton: {
    marginTop: 10,
    marginBottom: 35,
  },
  linkText: {
    color: 'grey',
    textAlign: 'center',
    fontSize: 15,
  },
})
