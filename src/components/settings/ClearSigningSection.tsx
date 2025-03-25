import React from 'react'
import { View, Text, StyleSheet, Switch } from 'react-native'
import { useStore } from '../../store/useStore'

export const ClearSigningSection = () => {
  const { settings, toggleSafeHashCheck, toggleLedgerHashCheck } = useStore()

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Clear Signing</Text>
      <View style={styles.settingRow}>
        <Text style={styles.settingLabel}>Enable Safe hash Check</Text>
        <Switch value={settings.safeHashCheckEnabled} onValueChange={toggleSafeHashCheck} />
      </View>
      <View style={styles.settingRow}>
        <Text style={styles.settingLabel}>Enable Ledger hash Check</Text>
        <Switch value={settings.ledgerHashCheckEnabled} onValueChange={toggleLedgerHashCheck} />
      </View>
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
})
