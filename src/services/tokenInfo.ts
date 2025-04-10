import { ethers } from 'ethers'
import { TokenInfo, ChainInfo } from '../types'
import { CHAIN_ID_TO_NAME, formatAddress } from './utils'
import { useStore } from '../store/useStore'
import {
  getGasCurrencyIcon,
  getIconByChainId,
  getSymbolByChainId,
} from '../services/utils'

// Standard ERC20 ABI for the functions we need
const ERC20_ABI = [
  'function name() view returns (string)',
  'function symbol() view returns (string)',
  'function decimals() view returns (uint8)',
  'function totalSupply() view returns (uint256)',
  'function balanceOf(address) view returns (uint256)',
  'function transfer(address, uint256) returns (bool)',
  'function allowance(address, address) view returns (uint256)',
  'function approve(address, uint256) returns (bool)',
  'function transferFrom(address, address, uint256) returns (bool)',
  'event Transfer(address indexed from, address indexed to, uint256 value)',
  'event Approval(address indexed owner, address indexed spender, uint256 value)',
]

export class TokenInfoService {
  private static instance: TokenInfoService
  private tokenCache: Map<string, TokenInfo> = new Map()
  private chainCache: Map<string, ChainInfo> = new Map()
  private readonly TOKEN_REPO_COMMIT =
    '61028d1026418456cb86eb18a3d89eda998ebbff'
  private chainId: string = '0x1' // Default to Ethereum mainnet

  private constructor(chainId: string) {
    this.chainId = chainId
  }

  public static getInstance(chainId: string): TokenInfoService {
    if (!TokenInfoService.instance) {
      TokenInfoService.instance = new TokenInfoService(chainId)
    } else if (chainId) {
      // Update the chainId if provided
      TokenInfoService.instance.chainId = chainId
    }
    return TokenInfoService.instance
  }

  public setChainId(chainId: string): void {
    this.chainId = chainId
  }

  public getChainId(): string {
    return this.chainId
  }

  public clearCache(): void {
    this.tokenCache.clear()
    this.chainCache.clear()
  }

  private async getTokenInfo(tokenAddress: string): Promise<TokenInfo | null> {
    try {
      // Get the chain name from the chain ID
      const chainName = CHAIN_ID_TO_NAME[this.chainId] || 'ethereum'

      const url = `https://raw.githubusercontent.com/lfglabs-dev/lucid_tokens/${this.TOKEN_REPO_COMMIT}/tokens/${chainName}/${ethers.getAddress(tokenAddress).toLowerCase()}.json`
      const response = await fetch(url)

      if (!response.ok) {
        console.log(
          'Token metadata not found in lucid_tokens for address: ',
          ethers.getAddress(tokenAddress),
          ' on chain: ',
          chainName,
          ' attempting to fetch from RPC'
        )
        // Try to fetch from RPC
        return await this.getTokenInfoFromRPC(tokenAddress)
      }

      const data = await response.json()

      const tokenInfo: TokenInfo = {
        chainId: this.chainId,
        address: tokenAddress,
        name: data.name,
        symbol: data.symbol.toUpperCase(),
        decimals: data.decimals,
        icon: data.logo.src || '﹖',
      }

      return tokenInfo
    } catch (error) {
      console.error('Error fetching token info:', error)
      return null
    }
  }

  private async getTokenInfoFromRPC(
    tokenAddress: string
  ): Promise<TokenInfo | null> {
    try {
      // Use RPC API for token metadata
      const rpcUrl = useStore.getState().getRpcUrlByChainId(this.chainId)
      const provider = new ethers.JsonRpcProvider(rpcUrl)

      // Create a contract instance with the ERC20 ABI
      const tokenContract = new ethers.Contract(
        tokenAddress,
        ERC20_ABI,
        provider
      )

      // Fetch token data using standard ERC20 methods
      const [decimals] = await Promise.all([
        tokenContract.decimals().catch(() => 18),
      ])

      // If we got at least some data, return it
      if (decimals) {
        return {
          chainId: this.chainId,
          address: tokenAddress,
          name: `Token ${formatAddress(tokenAddress)}`, // do not add name for security reasons
          symbol: formatAddress(tokenAddress), // do not add symbol for security reasons
          decimals: Number(decimals),
          icon: '﹖', // Standard ERC20 doesn't provide an icon
          warning: 'This token is not verified, use at your own risk',
        }
      }
    } catch (error) {
      console.error('Error fetching from RPC API:', error)
    }

    // Single fallback for both error case and no data case
    return {
      chainId: this.chainId,
      address: tokenAddress,
      name: `Token ${formatAddress(tokenAddress)}`,
      symbol: `${formatAddress(tokenAddress)}`,
      decimals: 18,
      icon: '﹖',
      warning: 'Unknown token - verify contract address',
    }
  }

  public async getTokenMetadata(
    tokenAddress: string
  ): Promise<TokenInfo | null> {
    try {
      // Handle ETH token
      if (
        tokenAddress.toLowerCase() ===
        '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee'
      ) {
        const chainInfo = await this.getChainMetadata()
        if (!chainInfo) {
          throw new Error('Chain metadata not found')
        }
        return chainInfo.currency
      }

      // Check cache first
      const cacheKey = `${this.chainId}-${tokenAddress}`
      const cachedToken = this.tokenCache.get(cacheKey)
      if (cachedToken) {
        return cachedToken
      }

      if (!tokenAddress) {
        console.error('Token address is required')
        return null
      }

      const tokenInfo = await this.getTokenInfo(tokenAddress)
      if (!tokenInfo) {
        console.error('Token not found:', tokenAddress)
        return null
      }

      this.tokenCache.set(cacheKey, tokenInfo)
      return tokenInfo
    } catch (error) {
      console.error('Error in getTokenMetadata:', error)
      return null
    }
  }

  public async getChainMetadata(): Promise<ChainInfo | null> {
    try {
      if (this.chainCache.has(this.chainId)) {
        return this.chainCache.get(this.chainId)!
      }

      // Get the chain name from the chain ID
      const chainName = CHAIN_ID_TO_NAME[this.chainId] || 'ethereum'

      const gasCurrency: TokenInfo = {
        chainId: this.chainId,
        address: '0x0000000000000000000000000000000000000000',
        name: getSymbolByChainId(this.chainId),
        symbol: getSymbolByChainId(this.chainId),
        decimals: 18,
        icon: getGasCurrencyIcon(this.chainId),
      }

      const chainInfo: ChainInfo = {
        chainId: this.chainId,
        name: chainName,
        currency: gasCurrency,
        icon: getIconByChainId(this.chainId),
      }

      this.chainCache.set(this.chainId, chainInfo)
      return chainInfo
    } catch (error) {
      console.error('Error in getChainMetadata:', error)
      return null
    }
  }
}
