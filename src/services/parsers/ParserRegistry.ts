import { BaseParser, ParsedTransaction, SimulationResponse } from './BaseParser';
import { ERC20Parser } from './ERC20Parser';
import { TokenInfoService } from '../tokenInfo';

export class ParserRegistry {
    private parsers: BaseParser[] = [];

    constructor() {
        this.registerParser(new ERC20Parser(TokenInfoService.getInstance()));
    }

    registerParser(parser: BaseParser) {
        this.parsers.push(parser);
    }

    async parseTransaction(chainId: string, to: string, data: string): Promise<ParsedTransaction> {
        const parser = this.parsers.find(p => p.canParse(data));
        
        if (!parser) {
            console.log('No parser found for transaction data');
            return { type: 'UNKNOWN', success: false };
        }

        const result = await parser.parseInput(chainId, to, data);
        return result;
    }

    async parseSimulationResponse(parser: BaseParser, response: SimulationResponse, chainId: string): Promise<ParsedTransaction> {
        return parser.parseSimulationResponse(chainId, response);
    }

    getParserForTransaction(data: string): BaseParser | undefined {
        return this.parsers.find(p => p.canParse(data));
    }
} 