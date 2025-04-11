import React from 'react'
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import LottieView from 'lottie-react-native'

interface SuccessScreenProps {
  onMainAction: () => void
}

export const SuccessScreen = ({ onMainAction }: SuccessScreenProps) => {
  return (
    <View style={styles.screenContainer}>
      <View style={styles.contentContainer}>
        <Text style={styles.title}>You're all set ✅</Text>
        <Text style={styles.body}>
          You just need to send a transaction form your Metamask or Safe wallet
          and you'll be able to simulate it on Lucid!
        </Text>

        <View style={styles.lottieContainer}>
          <LottieView
            source={require('../../../assets/verifiedLottie.json')}
            autoPlay
            loop={false}
            style={styles.lottieAnimation}
          />
        </View>
      </View>
      <TouchableOpacity style={styles.soloButton} onPress={onMainAction}>
        <Text style={styles.buttonText}>Go to Transactions Screen</Text>
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
  lottieContainer: {
    width: '100%',
    height: 200,
    marginVertical: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  lottieAnimation: {
    width: 200,
    height: 200,
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
