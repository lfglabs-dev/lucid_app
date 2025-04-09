import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
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
        <Text style={styles.title}>Verify Message Hash on Hardware Wallet</Text>
        <Text style={styles.subtitle}>
          Verify the first and last 4 characters on your hardware wallet hashes
        </Text>
      </View>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Domain Hash</Text>
        <View style={styles.hashContainer}>
          <Text style={styles.hashHighlightMessageHash}>
            {formatAddress(domainHash)}
          </Text>
        </View>
        <Text style={styles.sectionTitle}>Message Hash</Text>
        <View style={styles.hashContainer}>
          <Text style={styles.hashHighlightDomainHash}>
            {formatAddress(messageHash)}
          </Text>
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
    marginBottom: 12,
    color: '#212529',
  },
  hashContainer: {
    flexDirection: 'row',
    alignItems: 'center',
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
})
