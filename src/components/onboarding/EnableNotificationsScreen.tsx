import React from 'react'
import { View, Text, StyleSheet, TouchableOpacity, Image, Alert } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useNotification } from '../../context/NotificationContext'

interface EnableNotificationsScreenProps {
  onMainAction: () => void
  onSecondaryAction?: () => void
}

export const EnableNotificationsScreen = ({
  onMainAction,
  onSecondaryAction,
}: EnableNotificationsScreenProps) => {
  const { requestPermissions } = useNotification()

  const handleEnableNotifications = async () => {
    console.log('👋 User initiated notification permission request');
    const token = await requestPermissions()
    if (token) {
      console.log('✅ Notification permission granted, proceeding with onboarding');
      onMainAction()
    } else {
      Alert.alert(
        'Enable Notifications',
        'Please enable notifications in your device settings to receive alerts about transactions.',
        [
          {
            text: 'OK',
            onPress: onMainAction,
          },
        ]
      )
    }
  }

  return (
    <View style={styles.screenContainer}>
      <View style={styles.contentContainer}>
        <Text style={styles.title}>Stay Lucid in Real Time</Text>
        <Text style={styles.body}>
          We'll notify you instantly when there's a transaction to simulate, or
          if something suspicious happens.
        </Text>

        <View style={styles.imageContainer}>
          <Image
            source={require('../../../assets/onboarding/notification_screen.png')}
            style={styles.image}
            resizeMode="contain"
          />
        </View>
      </View>
      <TouchableOpacity style={styles.button} onPress={handleEnableNotifications}>
        <Text style={styles.buttonText}>Enable Notifications</Text>
        <Ionicons name="arrow-forward" size={20} color="#fff" />
      </TouchableOpacity>
      <TouchableOpacity style={styles.linkButton} onPress={onSecondaryAction}>
        <Text style={styles.linkText}>Skip for now</Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
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
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  body: {
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
    marginBottom: 20,
  },
  imageContainer: {
    width: '110%',
    height: 230,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
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
