import React from 'react'
import { View, Text, StyleSheet, Image } from 'react-native'
import { formatAddress } from '../services/utils'

interface SafeHwSimulationProps {
  messageHash: string
  domainHash: string
}

export const SafeHwSimulation: React.FC<SafeHwSimulationProps> = ({
  messageHash,
  domainHash,
}) => {
  return (
    <>
      <View style={styles.header}>
        <Text style={styles.title}>Hardware Wallet Simulation</Text>
        <Text style={styles.subtitle}>
          Verify the first and last 4 characters on your hardware wallet hashes
        </Text>
      </View>
      <View style={styles.section}>
        <View style={styles.hashContainer}>
          <Text style={styles.sectionTitle}>Domain Hash</Text>
          <Text style={styles.hashHighlightMessageHash}>
            {formatAddress(domainHash)}
          </Text>
        </View>
        <View style={styles.hashContainer}>
          <Text style={styles.sectionTitle}>Message Hash</Text>
          <Text style={styles.hashHighlightDomainHash}>
            {formatAddress(messageHash)}
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
    width: '120%',
    height: 300,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
  },
  image: {
    width: '120%',
    height: '120%',
  },
})
