import React from 'react'
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native'
import { useStore } from '../../store/useStore'

interface Props {
  onMainAction: () => void
}

export const HardwareWalletScreen = ({ onMainAction }: Props) => {
  const { settings } = useStore()

  const handleYes = () => {
    useStore.getState().toggleLedgerHashCheck()
    onMainAction()
  }

  const handleNo = () => {
    if (settings.ledgerHashCheckEnabled) {
      useStore.getState().toggleLedgerHashCheck()
    }
    onMainAction()
  }

  return (
    <View style={styles.screenContainer}>
      <View style={styles.contentContainer}>
        <Text style={styles.title}>Do you use a Hardware Wallet?</Text>
        <Text style={styles.body}>
          Let us know if you use a hardware wallet like Ledger to secure your
          assets. This helps us provide the right security features for you.
        </Text>

        <View style={styles.imageContainer}>
          <Image
            source={require('../../../assets/onboarding/no_transactions.png')}
            style={styles.image}
            resizeMode="contain"
          />
        </View>
      </View>
      <TouchableOpacity style={styles.button} onPress={handleYes}>
        <Text style={styles.buttonText}>Yes, I use a Hardware Wallet</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.linkButton} onPress={handleNo}>
        <Text style={styles.linkText}>No, I don't</Text>
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
