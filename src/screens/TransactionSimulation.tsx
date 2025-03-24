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
import { TransactionSimulationView } from '../components/TransactionSimulationView';
import { TransactionVerificationView } from '../components/TransactionVerificationView';
import { SuccessView } from '../components/SuccessView';
import { ParserRegistry } from '../services/parsers/ParserRegistry';
import { TokenInfoService } from '../services/tokenInfo';
import { formatAddress } from '../services/utils';
import { ParsedTransaction } from '../services/parsers/BaseParser';

type NavigationProp = NativeStackNavigationProp<TransactionStackParamList>;

type RouteParams = {
    TransactionSimulation: {
        transaction: Transaction;
    };
};

type Step = 'simulation' | 'verification' | 'success';

export const TransactionSimulation = () => {
    const route = useRoute<RouteProp<RouteParams, 'TransactionSimulation'>>();
    const navigation = useNavigation<NavigationProp>();
    const { transaction } = route.params;
    const { updateTransactionStatus } = useStore();
    const [currentStep, setCurrentStep] = useState<Step>('simulation');
    const [simulationData, setSimulationData] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const parserRegistry = new ParserRegistry();

    useEffect(() => {
        const simulateTransaction = async () => {
            try {
                setIsLoading(true);
                setError(null);

                // Validate transaction data
                if (!transaction.data) {
                    throw new Error('Transaction data is missing');
                }

                // Parse the transaction data using the registry
                const parsedInput = await parserRegistry.parseTransaction(
                    transaction.chainId,
                    transaction.to,
                    transaction.data
                );

                if (!parsedInput.success) {
                    throw new Error(parsedInput.error || 'Invalid transaction data');
                }

                const tx = {
                    from: transaction.from,
                    to: transaction.to,
                    data: transaction.data,
                    value: transaction.value,
                    gas: transaction.gas,
                    maxFeePerGas: transaction.maxFeePerGas,
                    maxPriorityFeePerGas: transaction.maxPriorityFeePerGas
                };

                // Prepare RPC payload
                const rpcPayload = {
                    jsonrpc: "2.0",
                    method: "eth_simulateV1",
                    params: [
                        {
                            blockStateCalls: [
                                {
                                    blockOverrides: {
                                        baseFeePerGas: transaction.maxFeePerGas
                                    },
                                    calls: [tx]
                                }
                            ],
                            validation: true,
                            traceTransfers: true
                        },
                        "latest"
                    ],
                    id: 1
                };

                // Make the RPC call
                const response = await fetch('https://docs-demo.quiknode.pro/', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(rpcPayload),
                });

                if (!response.ok) {
                    const errorText = await response.text();
                    throw new Error('RPC simulation failed: ' + errorText);
                }

                const result = await response.json();
                if (result.error) {
                    throw new Error(result.error.message);
                }

                // Get the appropriate parser and parse the simulation response
                const parser = parserRegistry.getParserForTransaction(transaction.data);
                if (!parser) {
                    throw new Error('No parser found for transaction type');
                }

                const parsedSimulation = await parserRegistry.parseSimulationResponse(parser, result, transaction.chainId);
                if (!parsedSimulation.success) {
                    throw new Error(parsedSimulation.error || 'Simulation failed');
                }

                // Use the parsed input for display as it contains more information
                const newSimulationData = {
                    type: parsedInput.type === 'ERC20_TRANSFER' ? 'Send token' : 'Approve token',
                    contractAddress: parsedInput.token?.address,
                    amount: parsedInput.amount,
                    from: transaction.from,
                    to: parsedInput.recipient,
                    changes: [
                        {
                            type: 'decrease' as const,
                            assetIcon: parsedInput.token?.icon,
                            assetSymbol: parsedInput.token?.symbol,
                            amount: parsedInput.amount,
                            holder: formatAddress(transaction.from),
                        }
                    ],
                    chainId: transaction.chainId
                };
                setSimulationData(newSimulationData);

            } catch (err) {
                console.error('Simulation error:', err);
                setError(err instanceof Error ? err.message : 'Failed to simulate transaction');
            } finally {
                setIsLoading(false);
            }
        };

        simulateTransaction();
    }, [transaction]);

    const handleConfirm = () => {
        if (currentStep === 'simulation') {
            setCurrentStep('verification');
        } else if (currentStep === 'verification') {
            updateTransactionStatus(transaction.id, 'signed');
            setCurrentStep('success');
        }
    };

    const handleDecline = () => {
        updateTransactionStatus(transaction.id, 'rejected');
        navigation.goBack();
    };

    const handleSuccessComplete = () => {
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

    if (isLoading) {
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
                {currentStep === 'simulation' ? (
                    <TransactionSimulationView simulationData={simulationData} />
                ) : (
                    <TransactionVerificationView messageHash="0xEFD8DC......1CB8E" domainHash="0Xbad9......02412" />
                )}
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