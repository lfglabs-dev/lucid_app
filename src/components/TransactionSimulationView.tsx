import React from 'react';
import {
    View,
    Text,
    StyleSheet,
} from 'react-native';

type SimulationData = {
    type: string;
    token: string;
    amount: string;
    from: string;
    to: string;
    changes: Array<{
        type: 'decrease' | 'increase';
        asset: string;
        amount: string;
        holder: string;
    }>;
};

interface TransactionSimulationViewProps {
    simulationData: SimulationData;
}

export const TransactionSimulationView = ({ simulationData }: TransactionSimulationViewProps) => {
    return (
        <>
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Transaction Type</Text>
                <Text style={styles.sectionContent}>{simulationData.type}</Text>
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Details</Text>
                <Text style={styles.detail}>Token: {simulationData.token}</Text>
                <Text style={styles.detail}>Amount: {simulationData.amount} USDC</Text>
                <Text style={styles.detail}>From: {simulationData.from}</Text>
                <Text style={styles.detail}>To: {simulationData.to}</Text>
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Balance Changes</Text>
                {simulationData.changes.map((change, index) => (
                    <View key={index} style={styles.changeItem}>
                        <Text style={[
                            styles.changeAmount,
                            { color: change.type === 'decrease' ? '#FF4B4B' : '#4CAF50' }
                        ]}>
                            {change.type === 'decrease' ? '-' : '+'}{change.amount} {change.asset}
                        </Text>
                        <Text style={styles.changeHolder}>{change.holder}</Text>
                    </View>
                ))}
            </View>
        </>
    );
};

const styles = StyleSheet.create({
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
    sectionContent: {
        fontSize: 16,
        color: '#495057',
    },
    detail: {
        fontSize: 16,
        color: '#495057',
        marginBottom: 8,
    },
    changeItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#e9ecef',
    },
    changeAmount: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    changeHolder: {
        fontSize: 14,
        color: '#6c757d',
    },
}); 