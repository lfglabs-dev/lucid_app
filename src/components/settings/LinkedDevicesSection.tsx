import React, { useEffect, useState } from 'react'
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native'
import { fetchLinkedDevices, LinkedDevice } from '../../services/api'

const DeviceList = ({ devices }: { devices: LinkedDevice[] }) => {
  if (devices.length === 0) {
    return (
      <View style={styles.deviceSection}>
        <Text style={styles.deviceName}>No linked devices</Text>
      </View>
    )
  }

  return (
    <View style={styles.deviceSection}>
      {devices.map((device) => (
        <View key={device.device_id} style={styles.deviceRow}>
          <View style={styles.deviceInfo}>
            <Text style={styles.deviceName}>{device.device_name}</Text>
            <Text style={styles.deviceType}>Type: {device.device_type}</Text>
          </View>
        </View>
      ))}
    </View>
  )
}

export const LinkedDevicesSection = () => {
  const [linkedDevices, setLinkedDevices] = useState<{
    peers: LinkedDevice[]
    trusted: LinkedDevice[]
    trusters: LinkedDevice[]
  } | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadLinkedDevices = async () => {
      try {
        setIsLoading(true)
        setError(null)
        const response = await fetchLinkedDevices()

        // Deduplicate devices based on device_id
        const uniquePeers = response.data.peers.filter(
          (device, index, self) =>
            index === self.findIndex((d) => d.device_id === device.device_id)
        )

        setLinkedDevices({
          ...response.data,
          peers: uniquePeers,
        })
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Failed to load linked devices'
        )
      } finally {
        setIsLoading(false)
      }
    }

    loadLinkedDevices()
  }, [])

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Linked Devices</Text>
      {isLoading ? (
        <ActivityIndicator size="large" color="#0000ff" />
      ) : error ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : linkedDevices ? (
        <DeviceList devices={linkedDevices.peers} />
      ) : null}
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
  deviceSection: {
    marginBottom: 20,
  },
  deviceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  deviceInfo: {
    flex: 1,
  },
  deviceName: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  deviceType: {
    fontSize: 14,
    color: '#666',
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 10,
  },
})
