import CryptoES from 'crypto-es'
import cbor from 'cbor-js'

const encryptedContent =
  'wfogaqKCwHDrMZm01Xm9YpyCacLqW80jGsIgGT7XgpDjYjYQ2aPlKXhbceN4VS8CKORjRXgQMr15qbaJcck1QLHweGCYs6yDBLBmGY5YpsEZKPUdVi7KWQupvdpquY5+/nt4oi+Fod3P4Vw+a2esunc1AmDTmsiPrXEtBZ6jw4fVSB3BXGhKPO4aHkAHuZqL+Qf6BhED2BGqp8/vBarOJsrH3jzrdMWaPYVZZBnR+bOrUoj+HWZxcBo8ENxaM/Xhjw9EMCOWxyBO8pwi2Wo2VjCr/mc34st/J+0Jqz8qRV5OyDlSMwndPNEgLZ/JbEvqd3qgKzaSJl52+yFIgWeBr/y2FWP6cI+pVPsUTIMl7JmWNxTs8YZlIRjSwwzRoyWKt3S+vSGCGRrRChITQUcp6IXcvFQyRq4aqsYDCe56Y593vkNRQBTU3NVT5QbxuEduhGXiqzKzRKRaJev2ej3KgFiLMvBJeytlo+9Z80xlesjm7A38fo+rEhVF+97kKdBGWXxieehKU+CMvRpksHDkovwTKypDXCXrBWaQdAH8oRTiAwo7lYe/q8d35N//FkEyrMfTGFA2Q+9mjk475hVZRpsZoBuExa3NPWMIn19ZTH17IkOwktOanljCdV2G4xboPqPvWn3UmmFFGb66laR3xlcxKloLClKEmsA/CsRns2+K6pNhCGyMMvhZRomoji6lNWXamA5LNGmk+XxOM5XHDgCVux1FiW7m90zbudDzWeLxaF6ZO+GQiAtZKHb7n5nKi8zi6eMfklqnUG5Xiz3hEN9TDGJ67uKkxX3jNC2I1f9L8KFrolzskaszmRzl9h72/YrJg7glidigCpHo4rgfh6cn573rKMCLJTbDb1dVyQs0cpE+1NnH/draY18K8A/ZEPmcpKQfcNSRSRuTLq3xzjLvsXTF8zjDbHwyiwN5JWhZKonnxFi9SjjCn7sn4l6mn84DKkPT2l2J3NrCk3bwVp/5CGKgxV4x/GWuZ4xYkaEGE2veiC9DSbsjmsDMCvpcSsd/r7IEgJgrInNFohdNEjaChh4T/jByo/522kYDtvCxI8PUhj+YQk+rqW5MO/Y5ia9f+9ggwpNCeFO67Rgqsh2CJIUP7f1nT0IUOL+TPx9fZVD42WYxQmwJ5SC63daaZba2FGyECCc3pzVJ5pOd6q+P8CAiOAv7232Pi7UK3l4hdfGhah5JruqowwY+7LP+OkLHJ4R9a/sGlzM/xjRVwngfD4TIgFoC1a8Kho7g8FqJ+n3Tb0WomCl30JlhjWlIxem3fRFk0l5zF7hRcnGBSiLUrXZ68PS1aJch22jIhdutn0VYf2e4LFD4v8gblUF30vxkZnM7oTeBzB/pGSi1+XGNer4LqRkFv7mnEfkOpMOEgyTbhMlQiWk0hgzwEc8xF7ViZdqVkPrT3IgaejSu+y/MdMAeQ/rPThFO1DHts9WyOySD5FxMsOeNmkw3XqaInd9la8CKQu40RJUUQv4qr4FUYDfzpeYR7t8Ns1EP6sWUdSOYUoY1'

const decryptionKey = '4trOeNw6slzIgcVapSGvn95AjnPNreH9z0W9ht9KVJY'

function wordArrayToUint8Array(wordArray) {
  const { words, sigBytes } = wordArray
  const u8 = new Uint8Array(sigBytes)
  for (let i = 0; i < sigBytes; i++) {
    u8[i] = (words[i >>> 2] >>> (24 - (i % 4) * 8)) & 0xff
  }
  return u8
}

try {
  console.log('Starting decryption...')

  // 1. Decode base64 input to Uint8Array
  const binary = Uint8Array.from(atob(encryptedContent), (c) => c.charCodeAt(0))

  // 2. Extract IV (first 16 bytes)
  const ivBytes = binary.slice(0, 16)
  const iv = CryptoES.lib.WordArray.create(ivBytes)

  // 3. Extract ciphertext (remaining bytes)
  const ciphertextBytes = binary.slice(16)
  const ciphertext = CryptoES.lib.WordArray.create(ciphertextBytes)

  // 4. Decode base64 key to WordArray
  const key = CryptoES.enc.Base64.parse(decryptionKey)

  // 5. Decrypt with AES-CTR, no padding
  const decrypted = CryptoES.AES.decrypt({ ciphertext }, key, {
    mode: CryptoES.mode.CTR,
    padding: CryptoES.pad.NoPadding,
    iv,
  })

  // 6. Convert decrypted data to Uint8Array
  const decryptedBytes = wordArrayToUint8Array(decrypted)

  // 7. Decode CBOR to get original JSON
    const decoded = cbor.decode(decryptedBytes.buffer.slice(decryptedBytes.byteOffset, decryptedBytes.byteOffset + decryptedBytes.byteLength))

  // 🎉 Final result
  console.log('\n✅ Decoded JSON:\n', JSON.stringify(decoded, null, 2))
} catch (err) {
  console.error('\n❌ Decryption failed:', err)
}
