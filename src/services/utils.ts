import { WordArray } from 'crypto-es/lib/core'
import { ethers } from 'ethers'
import { EIP712SafeTx, EoaTx, Transaction } from '../types'

export const formatAddress = (address: string) => {
  if (address === 'yourself') {
    return 'yourself'
  }
  return address.slice(0, 4) + '...' + address.slice(-2)
}

export const formatAmount = (amount: string | number): string => {
  const num = Number(amount)

  // Handle very small numbers (less than 0.000001)
  if (num > 0 && num < 0.000001) {
    return num.toExponential(2)
  }

  // Handle whole numbers (no decimals needed)
  if (Number.isInteger(num)) {
    return num.toLocaleString()
  }

  // For regular numbers, show up to 6 decimal places if needed
  const parts = num.toString().split('.')
  const wholePart = Number(parts[0]).toLocaleString()

  if (parts.length === 1) {
    return wholePart
  }

  // Remove trailing zeros from decimal part
  const decimalPart = parts[1].replace(/0+$/, '')

  // If decimal part is empty after removing zeros, return whole part
  if (!decimalPart) {
    return wholePart
  }

  // Format decimal part with up to 6 significant digits
  const significantDecimals = Number('0.' + decimalPart)
    .toFixed(6)
    .slice(2)
    .replace(/0+$/, '')

  return `${wholePart}.${significantDecimals}`
}

export const wordArrayToUint8Array = (wordArray: WordArray) => {
  const { words, sigBytes } = wordArray
  const u8 = new Uint8Array(sigBytes)
  for (let i = 0; i < sigBytes; i++) {
    u8[i] = (words[i >>> 2] >>> (24 - (i % 4) * 8)) & 0xff
  }
  return u8
}

// ------------ 🔧 Sanitize Helpers ------------

// Format hex-encoded numbers (e.g. gas, value, nonce, fees)
export const toHexNumber = (
  value: string | number | undefined | null
): string => {
  if (value === undefined || value === null || value === '0') return '0x0'

  // Already hex
  if (typeof value === 'string' && value.startsWith('0x')) {
    let clean = value.slice(2).replace(/^0+/, '')
    if (clean === '') clean = '0'
    return '0x' + clean
  }

  // Number or decimal string → hex
  const hex = ethers.toBeHex(value)
  return toHexNumber(hex) // re-use to strip leading zeros
}

// Format hex-encoded bytes (e.g. data, input, bytecode)
export const toHexBytes = (value: string | undefined | null): string => {
  if (!value || value === '0x' || value === '0') return '0x'
  if (typeof value !== 'string') throw new Error('Invalid hex byte input')

  let hex = value.startsWith('0x') ? value.slice(2) : value

  if (hex.length % 2 !== 0) {
    hex = '0' + hex // pad to even length if needed
  }

  return '0x' + hex.toLowerCase()
}

// Format Ethereum addresses or other hex values
export const toHexAddress = (value: string | undefined | null): string => {
  if (!value) throw new Error('Invalid address')
  return ethers.getAddress(value.toLowerCase())
}

// ------------ 🚀 Forge Transaction ------------

const DEFAULT_GAS_LIMIT = '0x7A120' // 500,000 gas
const DEFAULT_GAS_PRICE = '0x2E90EDD00' // 12 Gwei

export const forgeTransaction = (
  tx: EIP712SafeTx | EoaTx,
  requestId: string,
  creationDate: string
): Transaction => {
  const isSafeTx = 'safeAddress' in tx

  return {
    id: requestId,
    status: 'pending',
    requestType: isSafeTx ? 'eip712' : 'eoa_transaction',
    timestamp: new Date(creationDate).getTime(),

    chainId: toHexNumber(tx.chainId),
    from: isSafeTx ? toHexAddress(tx.safeAddress) : toHexAddress(tx.from),
    to: toHexAddress(tx.to),
    value: toHexNumber(tx.value),
    data: toHexBytes(tx.data),

    gas: toHexNumber(isSafeTx ? DEFAULT_GAS_LIMIT : tx.gas),
    maxFeePerGas: toHexNumber(isSafeTx ? DEFAULT_GAS_PRICE : tx.maxFeePerGas),
    maxPriorityFeePerGas: toHexNumber(
      isSafeTx ? DEFAULT_GAS_PRICE : tx.maxPriorityFeePerGas
    ),
    nonce: toHexNumber(tx.nonce),
  }
}
