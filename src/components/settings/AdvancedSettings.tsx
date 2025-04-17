import React, { useEffect, useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  Alert,
  TouchableOpacity,
  Switch,
} from 'react-native'
import { useStore } from '../../store/useStore'
import { MaterialIcons } from '@expo/vector-icons'
import { useNotification } from '../../context/NotificationContext'

export const AdvancedSettings = () => {
  const [notificationsEnabled, setNotificationsEnabled] = useState(false)
  const { expoPushToken, requestPermissions } = useNotification()
  const { settings, setCustomRpcUrl, toggleLedgerHashCheck } = useStore()

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

  const handleEnableNotifications = async () => {
    const token = await requestPermissions()
    if (token) {
      setNotificationsEnabled(true)
    } else {
      setNotificationsEnabled(false)
      Alert.alert(
        'Enable Notifications',
        'Please enable notifications in your device settings to receive alerts about transactions.',
        [
          {
            text: 'OK',
            onPress: () => setNotificationsEnabled(false),
          },
        ]
      )
    }
  }

  useEffect(() => {
    setNotificationsEnabled(Boolean(expoPushToken))
  }, [expoPushToken])

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Advanced Settings</Text>
      <View style={styles.settingRow}>
        <Text style={styles.settingLabel}>Enable Ledger Hash Check</Text>
        <Switch
          value={settings.ledgerHashCheckEnabled}
          onValueChange={toggleLedgerHashCheck}
        />
      </View>
      {!notificationsEnabled && (
        <View style={styles.settingRow}>
          <Text style={styles.settingLabel}>Enable Notifications</Text>
          <Switch
            value={notificationsEnabled}
            onValueChange={handleEnableNotifications}
          />
        </View>
      )}
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
          <MaterialIcons
            name="edit"
            size={16}
            color="#666"
            style={styles.editIcon}
          />
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
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  settingLabel: {
    fontSize: 16,
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
