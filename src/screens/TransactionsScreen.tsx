import React, { useEffect } from 'react';
import { View, FlatList, StyleSheet } from 'react-native';
import { useStore } from '../store/useStore';
import { getOrRefreshAuth } from '../services/auth';
import { CustomRefreshControl } from '../components/CustomRefreshControl';
import { TransactionItem } from '../components/TransactionItem';
import { LoadingState } from '../components/LoadingState';
import { ErrorState } from '../components/ErrorState';
import { EmptyState } from '../components/EmptyState';

export const TransactionsScreen = () => {
    const { transactions, fetchTransactions } = useStore();
    const [isLoading, setIsLoading] = React.useState(true);
    const [error, setError] = React.useState<string | null>(null);
    const [refreshing, setRefreshing] = React.useState(false);

    const loadPastTransactions = async () => {

        setIsLoading(true);
        setError(null);
        try {
            const token = await getOrRefreshAuth();
            if (!token) {
                setError('No device paired. Please pair a device first.');
                return;
            }
            console.log('[Transactions] Loading transactions with token:', token.data.jwt.slice(0, 10) + '...');
            await fetchTransactions(token.data.jwt);
        } catch (error) {
            console.error('[Transactions] Error loading transactions:', error);
            setError(error instanceof Error ? error.message : 'Failed to load transactions');
        } finally {
            setIsLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        loadPastTransactions();
    }, []);

    const onRefresh = React.useCallback(() => {
        setRefreshing(true);
        loadPastTransactions();
    }, []);


    if (isLoading && !refreshing) {
        return <LoadingState />;
    }

    if (error) {
        return <ErrorState message={error} />;
    }

    if (transactions.length === 0) {
        return <EmptyState refreshing={refreshing} onRefresh={onRefresh} />;
    }

    return (
        <View style={styles.container}>
            <FlatList
                data={transactions}
                keyExtractor={(item) => item.id.toString()}
                renderItem={({ item }) => (
                    <TransactionItem item={item} isRefreshing={refreshing} />
                )}
                contentContainerStyle={styles.listContent}
                refreshControl={
                    <CustomRefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        tintColor="#0000ff"
                        colors={['#0000ff']}
                    />
                }
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
});