import React from 'react'
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native'

interface LoadingStateProps {
  message?: string
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  message = 'Loading transactions...',
}) => {
  return (
    <View style={styles.centerContainer}>
      <ActivityIndicator size="large" color="#0000ff" />
      <Text style={styles.loadingText}>{message}</Text>
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
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
})
