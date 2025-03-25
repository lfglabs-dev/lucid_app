import React from 'react'
import { View, Text, StyleSheet } from 'react-native'

interface ErrorStateProps {
  message: string
}

export const ErrorState: React.FC<ErrorStateProps> = ({ message }) => {
  return (
    <View style={styles.centerContainer}>
      <Text style={styles.errorText}>⚠️ {message}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 20,
    marginTop: -24,
  },
  errorText: {
    fontSize: 16,
    color: '#E53E3E',
    textAlign: 'center',
  },
})
