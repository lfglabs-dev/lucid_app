export const formatAddress = (address: string) => {
  if (address === 'yourself') {
    return 'yourself'
  }
  return address.slice(0, 6) + '...' + address.slice(-4)
}

export const formatAmount = (amount: string | number) => {
  return Number(amount).toLocaleString(undefined, { minimumFractionDigits: 3, maximumFractionDigits: 3 })
}
