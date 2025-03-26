import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { SimulationData } from '../services/simulation'
import { TransferSimulationView } from './TransferSimulationView'
import { ApprovalSimulationView } from './ApprovalSimulationView'
import { LedgerSimulation } from './LedgerSimulation'
import { VerificationStep } from '../screens/TransactionSimulation'

interface TransactionVerificationsViewProps {
  messageHash: string
  domainHash: string
  simulationData?: SimulationData
  currentStep: VerificationStep
}

export const TransactionVerificationsView = ({
  messageHash,
  domainHash,
  simulationData,
  currentStep,
}: TransactionVerificationsViewProps) => {
  console.log('simulationData:', simulationData)

  return (
    <View style={styles.container}>
      {simulationData && currentStep === 'simulation' ? (
        simulationData.type === 'transfer' ? (
          <TransferSimulationView simulationData={simulationData} />
        ) : simulationData.type === 'approval' ? (
          <ApprovalSimulationView simulationData={simulationData} />
        ) : null
      ) : currentStep === 'verification' ? (
        <LedgerSimulation messageHash={messageHash} domainHash={domainHash} />
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6c757d',
  },
  section: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#212529',
  },

  hashContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
  },

  hashHighlightMessageHash: {
    fontSize: 35,
    fontWeight: 'bold',
    color: 'orange',
    backgroundColor: '#ffefc4',
    padding: 4,
    borderRadius: 4,
  },
  hashHighlightDomainHash: {
    fontSize: 35,
    fontWeight: 'bold',
    color: 'purple',
    backgroundColor: '#e8d5ff',
    padding: 4,
    borderRadius: 4,
  },
  hashText: {
    fontSize: 35,
    color: '#495057',
    marginHorizontal: 4,
  },
  verificationText: {
    fontSize: 16,
    color: '#495057',
    fontStyle: 'italic',
  },
})
