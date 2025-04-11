import React from 'react'
import {
  ScrollView,
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Alert,
} from 'react-native'
import { ClearSigningSection } from '../components/settings/ClearSigningSection'
import { LinkedDevicesSection } from '../components/settings/LinkedDevicesSection'
import { AboutSection } from '../components/settings/AboutSection'
import { RpcSection } from '../components/settings/RpcSection'
import { AddressLabelsSection } from '../components/settings/AddressLabelsSection'
import { useStore } from '../store/useStore'
import { clearSecureStorage } from '../services/secureStorage'

export const SettingsScreen = () => {
  const { setHasCompletedOnboarding } = useStore()

  const resetOnboarding = () => {
    setHasCompletedOnboarding(false)
  }

  const deleteAllUserData = async () => {
    Alert.alert(
      'Delete All User Data',
      'This will delete all your data including decryption keys and settings. This action cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              // Clear secure storage (decryption keys, etc.)
              await clearSecureStorage()

              // Reset onboarding state
              setHasCompletedOnboarding(false)

              // You can add more reset functions here as needed

              Alert.alert('Success', 'All user data has been deleted')
            } catch (error) {
              console.error('Error deleting user data:', error)
              Alert.alert('Error', 'Failed to delete user data')
            }
          },
        },
      ]
    )
  }

  return (
    <ScrollView style={styles.container}>
      <AddressLabelsSection />
      <LinkedDevicesSection />
      <ClearSigningSection />
      <RpcSection />
      <AboutSection />

      {/* Developer Tools Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Developer Tools</Text>
        <TouchableOpacity style={styles.button} onPress={resetOnboarding}>
          <Text style={styles.buttonText}>Reset Onboarding Flow</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.dangerButton}
          onPress={deleteAllUserData}
        >
          <Text style={styles.dangerButtonText}>Delete All User Data</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  section: {
    marginTop: 20,
    padding: 15,
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  dangerButton: {
    backgroundColor: '#FF3B30',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  dangerButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
})
