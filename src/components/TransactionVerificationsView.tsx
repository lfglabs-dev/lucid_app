import React from 'react'
import { View, StyleSheet } from 'react-native'
import { SimulationView } from './SimulationView'
import { EoaHwSimulation } from './EoaHwSimulation'
import { SafeHwSimulation } from './SafeHwSimulation'
import { SuccessView } from './SuccessView'
import { VerificationStep, SimulationData, CoverResult } from '../types'

interface TransactionVerificationsViewProps {
  currentStep: VerificationStep
  simulationData: SimulationData
  messageHash: string
  domainHash: string
  transactionHash: string
  coverResult?: CoverResult
  coverError?: string
}

export const TransactionVerificationsView = ({
  currentStep,
  simulationData,
  messageHash,
  domainHash,
  transactionHash,
  coverResult,
  coverError,
}: TransactionVerificationsViewProps) => {
  const isEoaTransaction = simulationData?.requestType === 'eoa_transaction'

  return (
    <View style={styles.container}>
      {currentStep === 'simulation' && (
        <SimulationView simulationData={simulationData} />
      )}
      {currentStep === 'verification' &&
        (isEoaTransaction ? (
          <EoaHwSimulation
            transactionHash={transactionHash}
            to={simulationData.to}
          />
        ) : (
          <SafeHwSimulation messageHash={messageHash} domainHash={domainHash} />
        ))}
      {currentStep === 'success' && (
        <SuccessView
          title="Transaction Verified"
          description="Your transaction has been verified successfully"
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
})
