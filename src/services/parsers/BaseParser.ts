import { ethers } from 'ethers';
import { TokenInfo } from '../../types/index';

export interface EthereumLog {
    address: string;
    topics: string[];
    data: string;
    blockNumber?: string;
    transactionHash?: string;
    transactionIndex?: string;
    blockHash?: string;
    logIndex?: string;
    removed?: boolean;
}

export interface SimulationCall {
    status: string;
    logs?: EthereumLog[];
    gasUsed: string;
    error?: {
        message: string;
    };
}

export interface SimulationBlock {
    number: string;
    baseFeePerGas: string;
    gasUsed: string;
    timestamp: string;
    calls?: SimulationCall[];
}

export interface SimulationResponse {
    result?: SimulationBlock[];
    error?: {
        message: string;
    };
}

export type TransactionType = 'ERC20_TRANSFER' | 'ERC20_APPROVE' | 'UNKNOWN';

export interface ParsedTransaction {
    type: TransactionType;
    success: boolean;
    error?: string;
    token?: TokenInfo;
    amount?: string;
    recipient?: string;
}

export interface ParsedLog {
    type: string;
    success: boolean;
    error?: string;
    rawLog: EthereumLog;
    data?: Record<string, any>;
}

export abstract class BaseParser {
    abstract canParse(data: string): boolean;
    
    abstract parseInput(chainId: string, to: string, data: string): Promise<ParsedTransaction>;
    
    abstract parseLogs(chainId: string, logs: EthereumLog[]): Promise<ParsedLog[]>;
    
    abstract parseSimulationResponse(chainId: string, response: SimulationResponse): Promise<ParsedTransaction>;

    protected createSuccessResult(type: TransactionType, token: TokenInfo, amount: string, recipient: string): ParsedTransaction {
        return {
            type,
            success: true,
            token,
            amount,
            recipient
        };
    }

    protected createErrorResult(error: string): ParsedTransaction {
        return {
            type: 'UNKNOWN',
            success: false,
            error
        };
    }
} 