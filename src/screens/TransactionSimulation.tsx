import React, { useState, useEffect } from 'react'
import { View, StyleSheet, ScrollView, Text } from 'react-native'
import { RouteProp, useRoute, useNavigation } from '@react-navigation/native'
import { Transaction } from '../types'
import { TransactionStackParamList } from '../navigation/AppNavigator'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { useStore } from '../store/useStore'
import { ConfirmVerification } from '../components/ConfirmVerification'
import { TransactionVerificationsView } from '../components/TransactionVerificationsView'
import { SuccessView } from '../components/SuccessView'
import {
  SimulationData,
  SimulationParser,
  SimulationError,
} from '../services/simulation'

type NavigationProp = NativeStackNavigationProp<TransactionStackParamList>

type RouteParams = {
  TransactionSimulation: {
    transaction: Transaction
  }
}

export type VerificationStep = 'simulation' | 'verification' | 'success'

interface SimulationErrorState {
  message: string
  code?: number
  data?: string
}

export const TransactionSimulation = () => {
  const route = useRoute<RouteProp<RouteParams, 'TransactionSimulation'>>()
  const navigation = useNavigation<NavigationProp>()
  const { transaction } = route.params
  const { updateTransactionStatus } = useStore()
  const [currentStep, setCurrentStep] = useState<VerificationStep>('simulation')
  const [simulationData, setSimulationData] = useState<SimulationData | null>(
    null
  )
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<SimulationErrorState | null>(null)
  const [domainHash, setDomainHash] = useState<string>('')
  const [messageHash, setMessageHash] = useState<string>('')

  useEffect(() => {
    const simulationParser = new SimulationParser({
      from: transaction.from,
      to: transaction.to,
      data: transaction.data,
      value: transaction.value,
      gas: transaction.gas,
      maxFeePerGas: transaction.maxFeePerGas,
      maxPriorityFeePerGas: transaction.maxPriorityFeePerGas,
      chainId: transaction.chainId,
      nonce: transaction.nonce,
    })

    const simulateTransaction = async () => {
      try {
        setIsLoading(true)
        setError(null)

        // Validate transaction data
        if (!transaction.data) {
          throw new SimulationError('Transaction data is missing')
        }

        // Calculate domain hash
        setDomainHash(simulationParser.calculateDomainHash())

        // Calculate message hash
        setMessageHash(simulationParser.calculateMessageHash())

        const result = await simulationParser.simulateSafeTransaction()

        setSimulationData(result)

        console.log('Simulation data:', result)
      } catch (err) {
        if (err instanceof SimulationError) {
          setError({
            message: err.message,
            code: err.code,
            data: err.data,
          })
        } else {
          setError({
            message: 'Failed to simulate transaction',
          })
        }
      } finally {
        setIsLoading(false)
      }
    }

    simulateTransaction()
  }, [transaction])

  const handleConfirm = () => {
    if (currentStep === 'simulation') {
      setCurrentStep('verification')
    } else if (currentStep === 'verification') {
      updateTransactionStatus(transaction.id, 'signed')
      setCurrentStep('success')
    }
  }

  const handleDecline = () => {
    updateTransactionStatus(transaction.id, 'rejected')
    navigation.goBack()
  }

  const handleSuccessComplete = () => {
    navigation.goBack()
  }

  if (currentStep === 'success') {
    return (
      <SuccessView
        title="Transaction Verified"
        description="Congrats! You verified what you were signing..."
        onComplete={handleSuccessComplete}
      />
    )
  }

  if ((isLoading || !simulationData) && !error) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Simulating transaction...</Text>
      </View>
    )
  }

  if (error) {
    return (
      <View style={styles.container}>
        <ScrollView style={styles.scrollView}>
          <Text style={styles.errorTitle}>Transaction Error</Text>
          <Text style={styles.errorIcon}>⚠️</Text>
          <Text style={styles.errorText}>
            {error.code ? `Error ${error.code}: ` : ''}
            {error.message}
          </Text>
        </ScrollView>
        <ConfirmVerification
          onConfirm={handleConfirm}
          onDecline={handleDecline}
          confirmText="Continue"
          declineText="Close"
        />
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <TransactionVerificationsView
          messageHash={messageHash}
          domainHash={domainHash}
          simulationData={simulationData!}
          currentStep={currentStep}
        />
      </ScrollView>
      <ConfirmVerification
        onConfirm={handleConfirm}
        onDecline={handleDecline}
        confirmText={currentStep === 'simulation' ? 'Continue' : 'Confirm'}
        declineText="Decline"
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollView: {
    flex: 1,
  },
  loadingText: {
    textAlign: 'center',
    marginTop: 20,
    fontSize: 16,
  },
  errorTitle: {
    textAlign: 'center',
    marginTop: 20,
    fontSize: 30,
    fontWeight: 'bold',
    color: '#FF4B4B',
  },
  errorText: {
    textAlign: 'center',
    marginTop: 20,
    fontSize: 20,
    color: '#FF4B4B',
    paddingHorizontal: 20,
  },
  errorIcon: {
    textAlign: 'center',
    marginTop: 20,
    fontSize: 120,
    paddingHorizontal: 20,
  },
})
