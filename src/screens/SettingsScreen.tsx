import React from 'react'
import { ScrollView, StyleSheet } from 'react-native'
import { ClearSigningSection } from '../components/settings/ClearSigningSection'
import { LinkedDevicesSection } from '../components/settings/LinkedDevicesSection'
import { AboutSection } from '../components/settings/AboutSection'
import { RpcSection } from '../components/settings/RpcSection'
import { AddressLabelsSection } from '../components/settings/AddressLabelsSection'

export const SettingsScreen = () => {
  return (
    <ScrollView style={styles.container}>
      <AddressLabelsSection />
      <LinkedDevicesSection />
      <ClearSigningSection />
      <RpcSection />
      <AboutSection />
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
})
