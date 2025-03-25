import React from 'react'
import { View, Text, StyleSheet } from 'react-native'

export const AboutSection = () => {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>About Lucid</Text>
      <Text style={styles.aboutText}>
        Lucid is a transaction verification mobile app that helps you simulate and verify your
        blockchain transactions before signing them.
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  section: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  aboutText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#333',
  },
})
