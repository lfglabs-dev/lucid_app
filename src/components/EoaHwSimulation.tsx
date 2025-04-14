import React from 'react'
import { View, Text, StyleSheet, Image } from 'react-native'
import { formatAddress } from '../services/utils'

interface EoaHwSimulationProps {
  transactionHash: string
  to: string
}

export const EoaHwSimulation: React.FC<EoaHwSimulationProps> = ({
  transactionHash, // To re-add later when we'll be able to make it work
  to,
}) => {
  return (
    <>
      <View style={styles.header}>
        <Text style={styles.title}>Hardware Wallet Simulation</Text>
        <Text style={styles.subtitle}>
          Verify the first and last 4 characters on your hardware wallet
          hashes{' '}
        </Text>
      </View>
      <View style={styles.section}>
        {/* <Text style={styles.sectionTitle}>Transaction Hash</Text>
        <View style={styles.hashContainer}>
          <Text style={styles.hashHighlightMessageHash}>
            {formatAddress(transactionHash)}
          </Text>
        </View> */}
        <View style={styles.hashContainer}>
          <Text style={styles.sectionTitle}>To Address</Text>

          <Text style={styles.hashHighlightDomainHash}>
            {formatAddress(to)}
          </Text>
        </View>
        <View style={styles.imageContainer}>
          <Image
            source={require('../../assets/onboarding/no_transactions.png')}
            style={styles.image}
            resizeMode="contain"
          />
        </View>
      </View>
    </>
  )
}

const styles = StyleSheet.create({
  header: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6c757d',
  },
  section: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#212529',
  },
  hashContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
  },
  hashHighlightMessageHash: {
    fontSize: 35,
    fontWeight: 'bold',
    color: 'orange',
    backgroundColor: '#ffefc4',
    padding: 4,
    borderRadius: 4,
  },
  hashHighlightDomainHash: {
    fontSize: 35,
    fontWeight: 'bold',
    color: 'purple',
    backgroundColor: '#e8d5ff',
    padding: 4,
    borderRadius: 4,
  },
  imageContainer: {
    width: '100%',
    height: 230,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
  },
  image: {
    width: '100%',
    height: '100%',
  },
})
