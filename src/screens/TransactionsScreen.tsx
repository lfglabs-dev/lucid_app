import React from 'react';
import {
    View,
    FlatList,
    StyleSheet,
    Text,
    TouchableOpacity,
} from 'react-native';
import { useStore } from '../store/useStore';
import { Transaction } from '../types';

const getStatusEmoji = (status: Transaction['status']) => {
    switch (status) {
        case 'signed':
            return '✅';
        case 'rejected':
            return '❌';
        case 'pending':
        default:
            return '🟠';
    }
};

const TransactionItem = ({ item }: { item: Transaction }) => (
    <TouchableOpacity style={styles.transactionItem}>
        <View style={styles.transactionHeader}>
            <Text style={styles.title}>
                {item.title}
            </Text>
            <Text style={styles.timestamp}>
                {new Date(item.timestamp).toLocaleDateString()}
            </Text>
        </View>
        <Text style={styles.icon}>{getStatusEmoji(item.status)}</Text>
    </TouchableOpacity>
);

export const TransactionsScreen = () => {
    const { transactions } = useStore();

    return (
        <View style={styles.container}>
            <FlatList
                data={transactions}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                    <TransactionItem item={item} />
                )}
                contentContainerStyle={styles.listContent}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    listContent: {
        padding: 16,
    },
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
    transactionHeader: {
        flex: 1,
    },
    title: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    timestamp: {
        fontSize: 12,
        color: '#999',
    },
    icon: {
        fontSize: 20,
        marginLeft: 16,
    },
}); 
