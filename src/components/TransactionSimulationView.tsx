import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ImageSourcePropType,
    Image,
    ActivityIndicator,
} from 'react-native';
import { TokenRow } from './TokenRow';
import { ENSAddress } from './ENSAddress';
import { TokenInfoService } from '../services/tokenInfo';
import { TokenInfo } from '../types';

type SimulationData = {
    type: string;
    contractAddress: string;
    amount: string;
    from: string;
    to: string;
    changes: Array<{
        type: 'decrease' | 'increase';
        assetIcon: ImageSourcePropType;
        assetSymbol: string;
        amount: string;
    }>;
    chainId: string;
};

interface TransactionSimulationViewProps {
    simulationData: SimulationData;
}

export const TransactionSimulationView = ({ simulationData }: TransactionSimulationViewProps) => {
    const [chainInfo, setChainInfo] = useState<TokenInfo | null>(null);
    const [tokenInfo, setTokenInfo] = useState<TokenInfo | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    console.log('tokenInfo:', tokenInfo);
    console.log('chainInfo:', chainInfo);

    useEffect(() => {
        const loadMetadata = async () => {
            setIsLoading(true);

            const tokenInfoService = TokenInfoService.getInstance();

            try {
                const [chain, token] = await Promise.all([
                    tokenInfoService.getChainMetadata(simulationData.chainId),
                    tokenInfoService.getTokenMetadata(simulationData.chainId, simulationData.contractAddress)
                ]);
                setChainInfo(chain);
                setTokenInfo(token);
            } catch (error) {
                console.error('Error loading metadata:', error);
            } finally {
                setIsLoading(false);
            }
        };

        loadMetadata();
    }, [simulationData.chainId, simulationData.contractAddress]);

    if (isLoading || !chainInfo || !tokenInfo) {
        return (
            <View style={[styles.container, styles.loadingContainer]}>
                <ActivityIndicator size="large" color="#0000ff" />
            </View>
        );
    }


    return (
        <View style={styles.container}>
            {/* Simulation Results Section */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Simulation Results</Text>
                {simulationData.changes.map((change, index) => (
                    <View key={index} style={styles.changeItem}>
                        <View style={tokenInfo?.warning ? styles.changeContentWithWarning : styles.changeContent}>
                            <Text style={[
                                styles.changeAmount,
                                { color: change.type === 'decrease' ? '#FF4B4B' : '#4CAF50' }
                            ]}>
                                {change.type === 'decrease' ? '-' : '+'}{change.amount} {tokenInfo.symbol} {tokenInfo?.warning ? '⚠️' : ''}
                            </Text>
                            {tokenInfo?.warning ? <Text style={styles.warning}>{tokenInfo.warning}</Text> : <Image source={{ uri: tokenInfo.icon }} style={styles.changeIcon} />}

                        </View>
                    </View>
                ))}
            </View>

            {/* Send Token Section */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Send Token</Text>
                <View style={styles.tokenRows}>
                    <TokenRow
                        label="Chain"
                        value={chainInfo.name}
                        icon={{ uri: chainInfo.icon }}
                    />
                    <TokenRow
                        label="Send token"
                        value={`${simulationData.amount} ${tokenInfo.symbol}`}
                        icon={{ uri: tokenInfo.icon }}
                        warning={Boolean(tokenInfo?.warning)}
                    />
                    <TokenRow
                        label="Send to"
                        value={
                            <ENSAddress
                                address={simulationData.to}
                                chainId={simulationData.chainId}
                            />
                        }
                        rightIcon
                    />
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    loadingContainer: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    section: {
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#E6E8EC',
    },
    sectionTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#1A1D1F',
        paddingHorizontal: 16,
        marginBottom: 16,
    },
    tokenRows: {
        borderTopWidth: 1,
        borderColor: '#E6E8EC',
    },
    changeItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 8,
    },
    changeContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    changeContentWithWarning: {
        flexDirection: 'column',
        alignItems: 'flex-start',
        gap: 8,
    },
    changeAmount: {
        fontSize: 30,
        fontWeight: 'bold',
    },
    changeIcon: {
        width: 30,
        height: 30,
        borderRadius: 10,
    },
    warning: {
        fontSize: 14,
        color: 'grey',
    },
}); 