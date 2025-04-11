import React from 'react'
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native'
import { Ionicons } from '@expo/vector-icons'

interface InstallExtensionScreenProps {
  onMainAction: () => void
  onSecondaryAction?: () => void
}

export const InstallExtensionScreen = ({
  onMainAction,
  onSecondaryAction,
}: InstallExtensionScreenProps) => {
  return (
    <View style={styles.screenContainer}>
      <View style={styles.contentContainer}>
        <Text style={styles.title}>
          Add the Lucid extension to your Browser
        </Text>
        <Text style={styles.body}>
          The extension will intercept transactions from your favorite wallets
          (MetaMask, Safe, etc.) and simulate them clearly on your mobile
          screen.
        </Text>

        <View style={styles.imageContainer}>
          <Image
            source={require('../../../assets/onboarding/extension_screen.png')}
            style={styles.image}
            resizeMode="contain"
          />
        </View>
      </View>
      <TouchableOpacity style={styles.button} onPress={onMainAction}>
        <Text style={styles.buttonText}>Send Link to my laptop</Text>
        <Ionicons name="arrow-forward" size={20} color="#fff" />
      </TouchableOpacity>
      <TouchableOpacity style={styles.linkButton} onPress={onSecondaryAction}>
        <Text style={styles.linkText}>I've already installed it</Text>
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
    marginVertical: 20,
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
