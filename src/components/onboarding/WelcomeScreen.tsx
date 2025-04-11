import React from 'react'
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native'
import { Ionicons } from '@expo/vector-icons'

interface WelcomeScreenProps {
  onMainAction: () => void
}

export const WelcomeScreen = ({ onMainAction }: WelcomeScreenProps) => {
  return (
    <View style={styles.screenContainer}>
      <View style={styles.contentContainer}>
        <Text style={styles.title}>Welcome to Lucid 👋</Text>
        <Text style={styles.body}>
          Lucid helps you simulate and verify every blockchain transaction on a
          secure second screen.
        </Text>

        <View style={styles.imageContainer}>
          <Image
            source={require('../../../assets/onboarding/welcome_screen.png')}
            style={styles.image}
            resizeMode="contain"
          />
        </View>
      </View>
      <TouchableOpacity style={styles.soloButton} onPress={onMainAction}>
        <Text style={styles.buttonText}>Get Started</Text>
        <Ionicons name="arrow-forward" size={20} color="#fff" />
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
    width: '120%',
    height: 250,
    marginVertical: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  soloButton: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 35,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 8,
  },
})
