import { ethers } from 'ethers'
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args))

async function fetchTokenInfo() {
  const commitHash = 'fa2403278ad8487d5be412381718194e810449cd'
  const tokenAddress = ethers.getAddress('0xa3931d71877C0E7a3148CB7Eb4463524FEc27fbD')
  const url = `https://raw.githubusercontent.com/trustwallet/assets/${commitHash}/blockchains/ethereum/assets/${tokenAddress}/info.json`

  try {
    const response = await fetch(url)

    if (response.ok) {
      const data = await response.json()
      console.log('Token Information:', JSON.stringify(data, null, 2))
    } else {
      console.error(`Failed to retrieve data. Status code: ${response.status}`)
    }
  } catch (error) {
    console.error('Error:', error)
  }
}

// Run the script
fetchTokenInfo()
