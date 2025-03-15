import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Dimensions } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useStore } from '../store/useStore';
import { getCurrentAuthToken } from '../services/auth';
import { API_BASE_URL } from '../constants/api';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinkStackParamList } from '../navigation/AppNavigator';

type NavigationProp = NativeStackNavigationProp<LinkStackParamList>;

export const LinkDeviceScreen = () => {
    const { addPairedDevice } = useStore();
    const [permission, requestPermission] = useCameraPermissions();
    const [isProcessing, setIsProcessing] = useState(false);
    // Ref for immediate checks
    const processingRef = useRef(false);
    const navigation = useNavigation<NavigationProp>();

    const approveLink = async (linkToken: string) => {
        try {
            // Get the current auth token
            const authToken = await getCurrentAuthToken();
            if (!authToken) {
                throw new Error('No auth token available');
            }
            console.log('Body:', JSON.stringify({ token: linkToken }));

            const response = await fetch(`${API_BASE_URL}/approve_link`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authToken}`,
                },
                body: JSON.stringify({ token: linkToken }),
            });

            if (!response.ok) {
                const errorData = await response.text();
                console.error('API Error response:', {
                    status: response.status,
                    statusText: response.statusText,
                    body: errorData
                });
                throw new Error(`Failed to link token: ${response.status} ${response.statusText}`);
            }

            return true;
        } catch (error) {
            if (error instanceof TypeError && error.message === 'Network request failed') {
                console.error('Network error - Is the server running at', API_BASE_URL, '?');
            }
            console.error('Error linking token:', {
                error,
                message: error instanceof Error ? error.message : 'Unknown error',
                stack: error instanceof Error ? error.stack : undefined
            });
            return false;
        }
    };

    const handleBarCodeScanned = async ({ data }: { data: string }) => {
        // Synchronous check and set using ref
        if (processingRef.current) {
            console.log('Ignoring scan - already processing');
            return;
        }
        processingRef.current = true;
        setIsProcessing(true);

        try {
            const qrData = JSON.parse(data);
            console.log('Parsed QR data:', qrData);

            // Validate required fields
            if (!qrData.app || !qrData.token) {
                console.error('Missing required fields:', {
                    hasApp: !!qrData.app,
                    hasToken: !!qrData.token,
                    qrData
                });
                throw new Error('Invalid QR code format');
            }

            // Extract the actual token (remove 'token-' prefix)
            const linkToken = qrData.token.replace('token-', '');
            console.log('Extracted token:', linkToken);

            if (!linkToken) {
                console.error('Token is empty after prefix removal');
                throw new Error('Invalid token format');
            }

            // Link the token with the API
            console.log('Attempting to link token with API...');
            const isLinked = await approveLink(linkToken);

            if (!isLinked) {
                console.error('API linking failed');
                throw new Error('Failed to link token with server');
            }

            console.log('Token linked successfully, adding paired device ', qrData.name);
            // Add the paired device with the token
            addPairedDevice(linkToken, qrData.name || 'Chrome Extension');

            // Navigate to success screen with device name
            navigation.navigate('LinkDeviceSuccess', {
                title: 'Device Connected!',
                deviceName: qrData.name || 'Chrome Extension', // fallback if name not provided
                action: 'connect'
            });
            // Reset states only after successful linking
            setIsProcessing(false);
            processingRef.current = false;

        } catch (error) {
            console.error('Error in QR code processing:', {
                error,
                message: error instanceof Error ? error.message : 'Unknown error',
                stack: error instanceof Error ? error.stack : undefined
            });

            // Reset states before showing alert
            setIsProcessing(false);
            processingRef.current = false;

            Alert.alert(
                'Invalid QR Code',
                'Please scan a valid QR code from the Chrome extension',
                [
                    {
                        text: 'OK',
                        onPress: () => {
                            console.log('Alert dismissed');
                        }
                    }
                ]
            );
        }
    };

    if (!permission) {
        return (
            <View style={styles.container}>
                <Text style={styles.permissionText}>Requesting camera permission...</Text>
            </View>
        );
    }

    if (!permission.granted) {
        return (
            <View style={styles.container}>
                <Text style={styles.permissionText}>
                    Camera permission is required to scan QR codes
                </Text>
                <TouchableOpacity
                    style={styles.permissionButton}
                    onPress={requestPermission}
                >
                    <Text style={styles.permissionButtonText}>
                        Grant Camera Permission
                    </Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.cameraContainer}>
                {!isProcessing && (
                    <CameraView
                        style={styles.camera}
                        facing="back"
                        onBarcodeScanned={handleBarCodeScanned}
                        barcodeScannerSettings={{
                            barcodeTypes: ['qr'],
                        }}
                    />
                )}
                {isProcessing && (
                    <View style={[styles.camera, styles.processingOverlay]}>
                        <Text style={styles.processingText}>Processing...</Text>
                    </View>
                )}
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
                    2. Scan the QR code displayed on your device
                </Text>
            </View>
        </View>
    );
};

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
}); 