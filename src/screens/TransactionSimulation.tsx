import React, { useState, useEffect } from 'react';
import {
    View,
    StyleSheet,
    ScrollView,
    Text,
} from 'react-native';
import { RouteProp, useRoute, useNavigation } from '@react-navigation/native';
import { Transaction } from '../types';
import { TransactionStackParamList } from '../navigation/AppNavigator';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useStore } from '../store/useStore';
import { ConfirmVerification } from '../components/ConfirmVerification';
import { TransactionVerificationsView } from '../components/TransactionVerificationsView';
import { SuccessView } from '../components/SuccessView';
import { SimulationData, SimulationParser } from '../services/simulation';

type NavigationProp = NativeStackNavigationProp<TransactionStackParamList>;

type RouteParams = {
    TransactionSimulation: {
        transaction: Transaction;
    };
};

export type VerificationStep = 'simulation' | 'verification' | 'success';

export const TransactionSimulation = () => {
    const route = useRoute<RouteProp<RouteParams, 'TransactionSimulation'>>();
    const navigation = useNavigation<NavigationProp>();
    const { transaction } = route.params;
    const { updateTransactionStatus } = useStore();
    const [currentStep, setCurrentStep] = useState<VerificationStep>('simulation');
    const [simulationData, setSimulationData] = useState<SimulationData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    console.log('TransactionSimulation mounted with transaction:', {
        id: transaction.id,
        from: transaction.from,
        to: transaction.to,
        chainId: transaction.chainId,
        dataLength: transaction.data?.length
    });

    const simulationParser = new SimulationParser();

    useEffect(() => {
        const simulateTransaction = async () => {
            try {
                console.log('Starting transaction simulation process...');
                setIsLoading(true);
                setError(null);

                // Validate transaction data
                if (!transaction.data) {
                    console.error('Transaction data is missing');
                    throw new Error('Transaction data is missing');
                }

                console.log('Calling simulation parser...');
                const result = await simulationParser.simulateSafeTransaction({
                    from: transaction.from,
                    to: transaction.to,
                    data: transaction.data,
                    value: transaction.value,
                    gas: transaction.gas,
                    maxFeePerGas: transaction.maxFeePerGas,
                    maxPriorityFeePerGas: transaction.maxPriorityFeePerGas,
                    chainId: transaction.chainId
                });

                if (!result) {
                    console.error('No token transfers found in transaction');
                    throw new Error('No token transfers found in transaction');
                }

                console.log('Simulation successful, setting data:', result);
                setSimulationData(result);

            } catch (err) {
                console.error('Simulation error:', err);
                setError(err instanceof Error ? err.message : 'Failed to simulate transaction');
            } finally {
                console.log('Simulation process completed');
                setIsLoading(false);
            }
        };

        simulateTransaction();
    }, [transaction]);

    const handleConfirm = () => {
        console.log('Confirm button pressed, current step:', currentStep);
        if (currentStep === 'simulation') {
            setCurrentStep('verification');
        } else if (currentStep === 'verification') {
            console.log('Updating transaction status to signed');
            updateTransactionStatus(transaction.id, 'signed');
            setCurrentStep('success');
        }
    };

    const handleDecline = () => {
        console.log('Decline button pressed, updating status to rejected');
        updateTransactionStatus(transaction.id, 'rejected');
        navigation.goBack();
    };

    const handleSuccessComplete = () => {
        console.log('Success view completed, navigating back');
        navigation.goBack();
    };

    if (currentStep === 'success') {
        return (
            <SuccessView
                title="Transaction Verified"
                description="Congrats! You verified what you were signing..."
                onComplete={handleSuccessComplete}
            />
        );
    }

    if (isLoading || !simulationData) {
        return (
            <View style={styles.container}>
                <Text style={styles.loadingText}>Simulating transaction...</Text>
            </View>
        );
    }

    if (error) {
        return (
            <View style={styles.container}>
                <Text style={styles.errorText}>Error: {error}</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <ScrollView style={styles.scrollView}>
                <TransactionVerificationsView messageHash="0x6131B5fae19EA4f9D964eAc0408E4408b66337b5" domainHash="0x6131B5fae19EA4f9D964eAc0408E4408b66337b5" simulationData={simulationData} currentStep={currentStep} />
            </ScrollView>
            <ConfirmVerification
                onConfirm={handleConfirm}
                onDecline={handleDecline}
                confirmText={currentStep === 'simulation' ? "Continue" : "Sign"}
                declineText="Decline"
            />
        </View>
    );
};

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
    errorText: {
        textAlign: 'center',
        marginTop: 20,
        fontSize: 16,
        color: '#FF4B4B',
    },
}); 