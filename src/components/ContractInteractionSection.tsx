import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { TokenRow } from './TokenRow'
import { formatAddress } from '../services/utils'
import { ChainInfo, SimulationData } from '../types'

interface ContractInteractionSectionProps {
  chainInfo: ChainInfo
  simulationData: SimulationData
}

export const ContractInteractionSection: React.FC<
  ContractInteractionSectionProps
> = ({ chainInfo, simulationData }) => {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Contract Interaction</Text>
      <View style={styles.tokenRows}>
        <TokenRow
          label="Chain"
          value={chainInfo.name}
          icon={{ uri: chainInfo.icon }}
        />
        <TokenRow label="Operation" value={simulationData.operation} />
        <TokenRow
          label="Interact Contract"
          value={formatAddress(simulationData.to)}
          rightIcon
        />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  section: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E6E8EC',
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1A1D1F',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  tokenRows: {
    gap: 8,
  },
})
