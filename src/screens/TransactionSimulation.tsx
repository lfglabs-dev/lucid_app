import React, { useState } from 'react';
import {
    View,
    StyleSheet,
    ScrollView,
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

    const messageHash = "0x90Bc0b43fA89027B2f2df93fA7028357370a026a";

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

    // Mock simulation data
    const simulationData = {
        type: 'Token Transfer',
        token: 'USDC',
        amount: '1000',
        from: '0x88ffb774b8583c1c9a2b71b7391861c0be253993',
        to: '0x676ad4839a3cbb3739000153e4802bf4ce6aef3f',
        changes: [
            {
                type: 'decrease' as const,
                asset: 'USDC',
                amount: '1000',
                holder: '0x88ff...3993',
            },
            {
                type: 'increase' as const,
                asset: 'USDC',
                amount: '1000',
                holder: '0x676a...3f3f',
            }
        ]
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

    return (
        <View style={styles.container}>
            <ScrollView style={styles.scrollView}>
                {currentStep === 'simulation' ? (
                    <TransactionSimulationView simulationData={simulationData} />
                ) : (
                    <TransactionVerificationView messageHash={messageHash} />
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
}); 