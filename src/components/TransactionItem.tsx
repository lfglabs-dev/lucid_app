import React from 'react';
import { View, Text, TouchableOpacity, Alert, ActivityIndicator, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { TransactionStackParamList } from '../navigation/AppNavigator';
import { Transaction } from '../types';
import { useStore } from '../store/useStore';
import { formatAddress } from '../services/utils';

type NavigationProp = NativeStackNavigationProp<TransactionStackParamList>;

const getStatusEmoji = (status: 'pending' | 'signed' | 'rejected') => {
    switch (status) {
        case 'signed':
            return '✅';
        case 'rejected':
            return '❌';
        case 'pending':
        default:
            return '⚠️';
    }
};

interface TransactionItemProps {
    item: Transaction;
    isRefreshing?: boolean;
}

export const TransactionItem: React.FC<TransactionItemProps> = ({ item, isRefreshing }) => {
    const navigation = useNavigation<NavigationProp>();
    const { updateTransactionStatus, getTransactionStatus } = useStore();
    const isPending = item.status === 'pending';
    const isVerified = item.status === 'signed';
    const isRejected = item.status === 'rejected';

    const handlePress = () => {
        if (isPending) {
            navigation.navigate('TransactionSimulation', { transaction: item });
        } else if (isVerified || isRejected) {
            Alert.alert(
                'Reset Transaction',
                'Do you want to make this transaction pending again?',
                [
                    {
                        text: 'Cancel',
                        style: 'cancel',
                    },
                    {
                        text: 'Yes, Reset',
                        style: 'destructive',
                        onPress: () => updateTransactionStatus(item.id, 'pending'),
                    },
                ],
                { cancelable: true }
            );
        }
    };

    return (
        <TouchableOpacity
            style={[
                styles.transactionItem,
                isPending && styles.pendingTransaction,
                isVerified && styles.verifiedTransaction,
                isRefreshing && styles.refreshingTransaction
            ]}
            onPress={handlePress}
        >
            <View style={styles.transactionHeader}>
                <Text style={[
                    styles.title,
                    isPending && styles.pendingTitle,
                    isVerified && styles.verifiedTitle
                ]}>
                    Transaction to {formatAddress(item.to)}
                </Text>
                <Text style={styles.timestamp}>
                    from {formatAddress(item.from)} at {new Date(item.timestamp).toLocaleString('en-US', { dateStyle: 'short', timeStyle: 'short' })}
                </Text>
            </View>
            <View style={styles.statusContainer}>
                {isRefreshing ? (
                    <ActivityIndicator size="small" color="#0000ff" />
                ) : (
                    <Text style={styles.icon}>{getStatusEmoji(getTransactionStatus(item.id))}</Text>
                )}
            </View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    transactionItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        backgroundColor: '#fff',
        borderRadius: 8,
        marginBottom: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    pendingTransaction: {
        backgroundColor: '#FFF9E6',
        borderWidth: 1,
        borderColor: '#FFB800',
    },
    verifiedTransaction: {
        backgroundColor: '#F0FFF4',
        borderWidth: 1,
        borderColor: '#48BB78',
    },
    transactionHeader: {
        flex: 1,
    },
    title: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    pendingTitle: {
        color: '#B25B00',
        fontSize: 18,
    },
    verifiedTitle: {
        color: '#2F855A',
        fontSize: 18,
    },
    timestamp: {
        fontSize: 12,
        color: '#999',
    },
    icon: {
        fontSize: 20,
    },
    statusContainer: {
        width: 24,
        height: 24,
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 16,
    },
    refreshingTransaction: {
        opacity: 0.7,
    },
}); 