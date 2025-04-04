import { WordArray } from "crypto-es/lib/core"

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