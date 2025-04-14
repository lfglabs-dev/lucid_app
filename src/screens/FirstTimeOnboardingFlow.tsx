import React, { useState } from 'react'
import { View, StyleSheet, Share, Text, Alert } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useOnboarding } from '../hooks/useOnboarding'
import { WelcomeScreen } from '../components/onboarding/WelcomeScreen'
import { HardwareWalletScreen } from '../components/onboarding/HardwareWalletScreen'
import { EnableNotificationsScreen } from '../components/onboarding/EnableNotificationsScreen'
import { InstallExtensionScreen } from '../components/onboarding/InstallExtensionScreen'
import { ScanQRScreen } from '../components/onboarding/ScanQRScreen'
import { SuccessScreen } from '../components/onboarding/SuccessScreen'
import { CHROME_EXTENSION_URL, SHARE_MESSAGE } from '../constants/api'

export const FirstTimeOnboardingFlow = () => {
  const { completeOnboarding } = useOnboarding()
  const [currentScreen, setCurrentScreen] = useState(0)
  const totalScreens = 6

  const handleNext = () => {
    if (currentScreen < totalScreens - 1) {
      setCurrentScreen(currentScreen + 1)
    } else {
      completeOnboarding()
    }
  }

  const handleSendLink = async () => {
    try {
      await Share.share({
        message: `${SHARE_MESSAGE} ${CHROME_EXTENSION_URL}`,
        title: 'Install Lucid Extension',
      }).then(() => {
        handleNext()
      })
    } catch (error) {
      console.error('Error sharing:', error)
    }
  }

  const handleEnableNotifications = async () => {
    Alert.alert(
      'Enable Notifications',
      'Please enable notifications in your device settings to receive alerts about transactions.',
      [
        {
          text: 'OK',
          onPress: handleNext,
        },
      ]
    )
  }

  const renderScreen = () => {
    switch (currentScreen) {
      case 0:
        return <WelcomeScreen onMainAction={handleNext} />
      case 1:
        return <HardwareWalletScreen onMainAction={handleNext} />
      case 2:
        return (
          <EnableNotificationsScreen
            onMainAction={handleEnableNotifications}
            onSecondaryAction={handleNext}
          />
        )
      case 3:
        return (
          <InstallExtensionScreen
            onMainAction={handleSendLink}
            onSecondaryAction={handleNext}
          />
        )
      case 4:
        return (
          <ScanQRScreen
            onMainAction={handleNext}
            onSecondaryAction={handleNext}
          />
        )
      case 5:
        return <SuccessScreen onMainAction={handleNext} />
      default:
        return <WelcomeScreen onMainAction={handleNext} />
    }
  }

  const renderStepIndicator = () => {
    const indicators = []
    for (let i = 0; i < totalScreens; i++) {
      indicators.push(
        <View key={i} style={styles.stepContainer}>
          <View
            style={[
              styles.stepIndicator,
              i <= currentScreen && styles.activeStep,
            ]}
          >
            {i < currentScreen ? (
              <Ionicons name="checkmark" size={16} color="#fff" />
            ) : (
              <Text
                style={[
                  styles.stepText,
                  i <= currentScreen && styles.activeStepText,
                ]}
              >
                {i + 1}
              </Text>
            )}
          </View>
          {i < totalScreens - 1 && (
            <View
              style={[styles.line, i < currentScreen && styles.activeLine]}
            />
          )}
        </View>
      )
    }
    return <View style={styles.indicatorContainer}>{indicators}</View>
  }

  return (
    <View style={styles.container}>
      <View style={styles.safeArea} />
      {renderStepIndicator()}
      {renderScreen()}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  safeArea: {
    height: 60,
  },
  indicatorContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    marginBottom: 20,
  },
  stepContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepIndicator: {
    width: 22,
    height: 22,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeStep: {
    borderColor: '#007AFF',
    backgroundColor: '#007AFF',
  },
  stepText: {
    color: '#999',
    fontWeight: 'bold',
    fontSize: 12,
  },
  activeStepText: {
    color: 'white',
  },
  line: {
    width: 30,
    height: 2,
    backgroundColor: '#E0E0E0',
    marginHorizontal: 5,
  },
  activeLine: {
    backgroundColor: '#007AFF',
  },
})
