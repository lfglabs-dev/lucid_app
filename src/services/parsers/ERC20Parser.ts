import { BaseParser, ParsedTransaction, SimulationResponse, EthereumLog, ParsedLog } from './BaseParser';
import { TokenInfoService } from '../tokenInfo';
import { TokenInfo } from '../../types/index';
import { ethers } from 'ethers';

export class ERC20Parser extends BaseParser {
    private readonly TRANSFER_METHOD_ID = '0xa9059cbb';
    private readonly APPROVE_METHOD_ID = '0x095ea7b3';
    private readonly TRANSFER_EVENT_SIGNATURE = '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef';

    constructor(private tokenInfoService: TokenInfoService = TokenInfoService.getInstance()) {
        super();
    }

    public canParse(data: string): boolean {
        const isTransfer = data.startsWith(this.TRANSFER_METHOD_ID);
        const isApprove = data.startsWith(this.APPROVE_METHOD_ID);
        return isTransfer || isApprove;
    }

    public async parseInput(chainId: string, to: string, data: string): Promise<ParsedTransaction> {
        try {
            const token = await this.tokenInfoService.getTokenMetadata(chainId, to);
            
            if (!token) {
                console.log('No metadata found for token');
                return this.createErrorResult('Token metadata not found');
            }

            if (data.startsWith(this.TRANSFER_METHOD_ID)) {
                const recipient = '0x' + data.slice(34, 74);
                const amount = ethers.formatUnits(BigInt('0x' + data.slice(74)), token.decimals);
                
                return this.createSuccessResult('ERC20_TRANSFER', token, amount, recipient);
            }

            if (data.startsWith(this.APPROVE_METHOD_ID)) {
                const spender = '0x' + data.slice(34, 74);
                const amount = ethers.formatUnits(BigInt('0x' + data.slice(74)), token.decimals);

                return this.createSuccessResult('ERC20_APPROVE', token, amount, spender);
            }

            return this.createErrorResult('Unsupported method');
        } catch (error) {
            console.error('Error in parseInput:', error);
            return this.createErrorResult('Failed to parse input');
        }
    }

    public async parseLogs(chainId: string, logs: EthereumLog[]): Promise<ParsedLog[]> {
        const parsedLogs: ParsedLog[] = [];
        
        for (const log of logs) {
            if (log.topics[0] === this.TRANSFER_EVENT_SIGNATURE) {
                parsedLogs.push({
                    type: 'ERC20_TRANSFER',
                    success: true,
                    rawLog: log,
                    data: {
                        from: '0x' + log.topics[1].slice(26),
                        to: '0x' + log.topics[2].slice(26),
                        amount: log.data
                    }
                });
            }
        }
        
        return parsedLogs;
    }

    public async parseSimulationResponse(chainId: string, response: SimulationResponse): Promise<ParsedTransaction> {
        try {
            if (!response.result?.[0]?.calls?.[0]) {
                console.log('Invalid simulation response structure');
                return this.createErrorResult('Invalid simulation response');
            }

            const call = response.result[0].calls[0];
            
            if (call.error) {
                console.log('Simulation error:', call.error);
                return this.createErrorResult(call.error.message);
            }

            return {
                type: 'ERC20_TRANSFER',
                success: true
            };
        } catch (error) {
            console.error('Error in parseSimulationResponse:', error);
            return this.createErrorResult('Failed to parse simulation response');
        }
    }

    public formatAmount(amount: bigint, decimals: number = 18): string {
        return ethers.formatUnits(amount, decimals);
    }
} 