import { ethers } from 'ethers';
import { TokenInfoService } from './tokenInfo';

// Types
interface EthereumLog {
    address: string;
    topics: string[];
    data: string;
    blockNumber?: string;
    transactionHash?: string;
    logIndex?: string;
}

interface SimulationResponse {
    result?: Array<{
        number: string;
        baseFeePerGas: string;
        gasUsed: string;
        timestamp: string;
        calls?: Array<{
            status: string;
            logs?: EthereumLog[];
            gasUsed: string;
            error?: {
                message: string;
            };
        }>;
    }>;
    error?: {
        message: string;
    };
}

export interface SimulationData {
    type: 'transfer' | 'approval';
    contractAddress: string;
    amount: string;
    from: string;
    to: string;
    changes: Array<{
        type: 'decrease' | 'increase';
        assetIcon: string;
        assetSymbol: string;
        amount: string;
    }>;
    chainId: string;
}

export class SimulationParser {
    private readonly TRANSFER_EVENT_SIGNATURE = '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef';
    private readonly APPROVAL_EVENT_SIGNATURE = '0x8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b925';
    
    constructor(private tokenInfoService: TokenInfoService = TokenInfoService.getInstance()) {
        console.log('SimulationParser initialized');
    }

    async simulateSafeTransaction(transaction: {
        from: string;
        to: string;
        data: string;
        value: string;
        gas: string;
        maxFeePerGas: string;
        maxPriorityFeePerGas: string;
        chainId: string;
    }): Promise<SimulationData | null> {
        try { 
            console.log('Starting transaction simulation:', {
                from: transaction.from,
                to: transaction.to,
                chainId: transaction.chainId,
                dataLength: transaction.data.length
            });

            // Prepare simulation request
            const simulationRequest = {
                jsonrpc: "2.0",
                method: "eth_simulateV1",
                params: [{
                    blockStateCalls: [{
                        blockOverrides: {
                            baseFeePerGas: transaction.maxFeePerGas
                        },
                        calls: [{
                            from: transaction.from,
                            to: transaction.to,
                            data: transaction.data,
                            value: transaction.value,
                            gas: transaction.gas,
                            maxFeePerGas: transaction.maxFeePerGas,
                            maxPriorityFeePerGas: transaction.maxPriorityFeePerGas
                        }]
                    }],
                    validation: true,
                    traceTransfers: true
                }, "latest"],
                id: 1
            };

            console.log('Making RPC call to QuickNode...');
            // Make RPC call
            const response = await fetch('https://docs-demo.quiknode.pro/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(simulationRequest)
            });

            if (!response.ok) {
                console.error('RPC call failed:', response.status, response.statusText);
                throw new Error('Simulation request failed');
            }

            console.log('RPC call successful, parsing response...');
            const result: SimulationResponse = await response.json();
            return this.parseSimulationResult(result, transaction.chainId);
        } catch (error) {
            console.error('Simulation error:', error);
            return null;
        }
    }

    private async parseSimulationResult(response: SimulationResponse, chainId: string): Promise<SimulationData | null> {
        try {
            console.log('Parsing simulation result...');
            
            if (!response.result?.[0]?.calls?.[0]) {
                console.error('Invalid simulation response structure:', response);
                throw new Error('Invalid simulation response structure');
            }

            const call = response.result[0].calls[0];
            console.log('Simulation call details:', {
                status: call.status,
                gasUsed: call.gasUsed,
                logsCount: call.logs?.length || 0
            });
            
            if (call.error) {
                console.error('Call error:', call.error);
                throw new Error(call.error.message);
            }

            // Look for Transfer or Approval events in the logs
            const transferEvent = call.logs?.find(log => 
                log.topics[0] === this.TRANSFER_EVENT_SIGNATURE
            );

            const approvalEvent = call.logs?.find(log => 
                log.topics[0] === this.APPROVAL_EVENT_SIGNATURE
            );

            if (!transferEvent && !approvalEvent) {
                console.log('No transfer or approval events found in logs');
                return null;
            }

            // Get token information
            const tokenAddress = transferEvent?.address || approvalEvent?.address;
            if (!tokenAddress) {
                console.error('No token address found in events');
                throw new Error('No token address found in events');
            }

            console.log('Fetching token metadata for:', tokenAddress);
            const token = await this.tokenInfoService.getTokenMetadata(chainId, tokenAddress);
            
            if (!token) {
                console.error('Token metadata not found for:', tokenAddress);
                throw new Error('Token metadata not found');
            }

            console.log('Token metadata found:', {
                symbol: token.symbol,
                decimals: token.decimals,
                icon: token.icon
            });

            if (transferEvent) {
                console.log('Found transfer event:', {
                    address: transferEvent.address,
                    topics: transferEvent.topics,
                    data: transferEvent.data
                });

                // Parse transfer event data
                const from = '0x' + transferEvent.topics[1].slice(26);
                const to = '0x' + transferEvent.topics[2].slice(26);
                const amount = BigInt(transferEvent.data);
                const formattedAmount = ethers.formatUnits(amount, token.decimals);

                console.log('Parsed transfer data:', {
                    from,
                    to,
                    amount: amount.toString()
                });

                return {
                    type: 'transfer',
                    contractAddress: tokenAddress,
                    amount: formattedAmount,
                    from,
                    to,
                    changes: [
                        {
                            type: 'decrease' as const,
                            assetIcon: token.icon,
                            assetSymbol: token.symbol,
                            amount: formattedAmount,
                        }
                    ],
                    chainId
                };
            }

            if (approvalEvent) {
                console.log('Found approval event:', {
                    address: approvalEvent.address,
                    topics: approvalEvent.topics,
                    data: approvalEvent.data
                });

                // Parse approval event data
                const owner = '0x' + approvalEvent.topics[1].slice(26);
                const spender = '0x' + approvalEvent.topics[2].slice(26);
                const amount = BigInt(approvalEvent.data);
                const formattedAmount = ethers.formatUnits(amount, token.decimals);

                console.log('Parsed approval data:', {
                    owner,
                    spender,
                    amount: amount.toString()
                });

                return {
                    type: 'approval',
                    contractAddress: tokenAddress,
                    amount: formattedAmount,
                    from: owner,
                    to: spender,
                    changes: [
                        {
                            type: 'increase' as const,
                            assetIcon: token.icon,
                            assetSymbol: token.symbol,
                            amount: formattedAmount,
                        }
                    ],
                    chainId
                };
            }

            return null;
        } catch (error) {
            console.error('Parse simulation error:', error);
            return null;
        }
    }
}