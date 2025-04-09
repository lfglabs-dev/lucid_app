import React from 'react'
import { View, Text, StyleSheet, Alert, TouchableOpacity } from 'react-native'
import { useStore } from '../../store/useStore'
import { MaterialIcons } from '@expo/vector-icons'

export const RpcSection = () => {
  const { settings, setCustomRpcUrl } = useStore()

  const handleEditRpc = () => {
    Alert.prompt(
      'Edit RPC URL',
      'Enter a custom RPC URL',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Save',
          onPress: (newRpcUrl) => {
            if (newRpcUrl && newRpcUrl.trim()) {
              setCustomRpcUrl(newRpcUrl.trim())
              Alert.alert('Success', 'Custom RPC URL has been saved')
            } else {
              setCustomRpcUrl(null)
              Alert.alert('Success', 'Custom RPC URL has been cleared')
            }
          },
        },
      ],
      'plain-text',
      settings.customRpcUrl || ''
    )
  }

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>RPC Configuration</Text>
      <View style={styles.warningContainer}>
        <Text style={styles.warningText}>
          ⚠️ Warning: The RPC must support eth_simulatev1 method for transaction
          simulation to work
        </Text>
      </View>
      <TouchableOpacity 
        style={styles.rpcItem}
        onPress={handleEditRpc}
        activeOpacity={0.7}
      >
        <View style={styles.rpcContent}>
          <View style={styles.rpcInfo}>
            <Text style={styles.rpcLabel}>RPC URL</Text>
            <Text style={styles.rpcValue}>
              {settings.customRpcUrl || 'Default RPC'}
            </Text>
          </View>
          <MaterialIcons name="edit" size={16} color="#666" style={styles.editIcon} />
        </View>
      </TouchableOpacity>
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
  rpcItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  rpcContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rpcInfo: {
    flex: 1,
  },
  rpcLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1D1F',
    marginBottom: 4,
  },
  rpcValue: {
    fontSize: 14,
    color: '#666',
  },
  editIcon: {
    marginLeft: 8,
  },
})
