import React, { useEffect, useState } from 'react'
import { View, Text, StyleSheet, Image, ActivityIndicator } from 'react-native'
import { TokenInfoService } from '../services/tokenInfo'
import { TokenInfo } from '../types'
import { SimulationData } from '../services/simulation'
import { ContractInteractionSection } from './ContractInteractionSection'

interface ApprovalSimulationViewProps {
  simulationData: SimulationData
}

export const ApprovalSimulationView = ({ simulationData }: ApprovalSimulationViewProps) => {
  const [chainInfo, setChainInfo] = useState<TokenInfo | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const tokenInfoService = TokenInfoService.getInstance()
  const tokenSummaries = tokenInfoService.getSimulationSummary(simulationData)

  useEffect(() => {
    const loadMetadata = async () => {
      setIsLoading(true)

      try {
        const chain = await tokenInfoService.getChainMetadata(simulationData.chainId)
        setChainInfo(chain)
      } catch (error) {
        console.error('Error loading metadata:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadMetadata()
  }, [simulationData.chainId])

  if (isLoading || !chainInfo) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size='large' color='#0000ff' />
      </View>
    )
  }

  return (
    <View style={styles.container}>
      {/* Simulation Results Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Simulation Results</Text>
        {simulationData.changes.map((change, index) => (
          <View key={index} style={styles.changeItem}>
            <View
              style={change?.warning ? styles.changeContentWithWarning : styles.changeContent}
            >
              <Text style={styles.changeAmount}>
                {'Approve'}&nbsp;{change.amount} {change.assetSymbol} {change?.warning ? '⚠️' : ''}
              </Text>
              {change?.warning ? (
                <Text style={styles.warning}>{change.warning}</Text>
              ) : (
                <Image source={{ uri: change.assetIcon }} style={styles.changeIcon} />
              )}
            </View>
          </View>
        ))}
      </View>

      <ContractInteractionSection 
        chainInfo={chainInfo}
        simulationData={simulationData}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
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
    borderTopWidth: 1,
    borderColor: '#E6E8EC',
  },
  changeItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  changeContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  changeContentWithWarning: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: 8,
  },
  changeAmount: {
    fontSize: 30,
    fontWeight: 'bold',
    color: 'orange',
  },
  changeIcon: {
    width: 30,
    height: 30,
    borderRadius: 10,
  },
  warning: {
    fontSize: 14,
    color: 'grey',
  },
})
