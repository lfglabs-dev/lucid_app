import { ethers } from 'ethers'
const fetch = (...args) =>
  import('node-fetch').then(({ default: fetch }) => fetch(...args))

async function fetchTokenInfo() {
  const commitHash = 'c8287b6212fa26cfce025e7741998a3c70d84ec8'
  const tokenAddress = ethers
    .getAddress('0x9d1089802ee608ba84c5c98211afe5f37f96b36c')
    .toLowerCase()
  const url = `https://raw.githubusercontent.com/lfglabs-dev/lucid_tokens/${commitHash}/tokens/ethereum/${tokenAddress}.json`
  console.log('Fetching token info from:', url)
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
