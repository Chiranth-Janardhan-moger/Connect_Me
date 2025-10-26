const crypto = require('crypto');
const secret = crypto.randomBytes(64).toString('hex'); // 512-bit hex
console.log(secret);

// used to generate the secret key for JWT signing