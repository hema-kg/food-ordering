// Copied from CMS style: simple XOR + base64 to 16 chars
const key = Buffer.from('A3'); // Adjust as needed
function encrypt16Bit(plainText) {
  const plainBytes = Buffer.from(plainText, 'utf8');
  const encryptedBytes = Buffer.alloc(plainBytes.length);
  for (let i = 0; i < plainBytes.length; i++) {
    encryptedBytes[i] = plainBytes[i] ^ key[i % key.length];
  }
  const base64 = encryptedBytes.toString('base64');
  return (base64 + '==============').substring(0, 16);
}
function decrypt16Bit(encryptedText) {
  const padded = (encryptedText || '').padEnd(24, '=');
  const encryptedBytes = Buffer.from(padded, 'base64');
  const decryptedBytes = Buffer.alloc(encryptedBytes.length);
  for (let i = 0; i < encryptedBytes.length; i++) {
    decryptedBytes[i] = encryptedBytes[i] ^ key[i % key.length];
  }
  return decryptedBytes.toString('utf8');
}
module.exports = { encrypt16Bit, decrypt16Bit };
