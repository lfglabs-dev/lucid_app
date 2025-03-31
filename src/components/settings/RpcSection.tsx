import React, { useState } from 'react'
import { View, Text, StyleSheet, TextInput, Alert } from 'react-native'
import { useStore } from '../../store/useStore'

export const RpcSection = () => {
  const { settings, setCustomRpcUrl } = useStore()
  const [inputValue, setInputValue] = useState(settings.customRpcUrl || '')

  const handleSave = () => {
    if (inputValue.trim()) {
      setCustomRpcUrl(inputValue.trim())
      Alert.alert('Success', 'Custom RPC URL has been saved')
    } else {
      setCustomRpcUrl(null)
      Alert.alert('Success', 'Custom RPC URL has been cleared')
    }
  }

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>RPC Configuration</Text>
      <View style={styles.warningContainer}>
        <Text style={styles.warningText}>
          ⚠️ Warning: The RPC must support eth_simulatev1 method for transaction simulation to work
        </Text>
      </View>
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={inputValue}
          onChangeText={setInputValue}
          placeholder="Enter custom RPC URL"
          placeholderTextColor="#999"
        />
        <Text style={styles.saveButton} onPress={handleSave}>
          Save
        </Text>
      </View>
      {settings.customRpcUrl && (
        <Text style={styles.currentRpc}>Current RPC: {settings.customRpcUrl}</Text>
      )}
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
  warningContainer: {
    backgroundColor: '#FFF3CD',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  warningText: {
    color: '#856404',
    fontSize: 14,
    lineHeight: 20,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginRight: 12,
  },
  saveButton: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
  },
  currentRpc: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
  },
}) 