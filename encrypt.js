import crypto from 'crypto';

const key = crypto.randomBytes(32);

console.log(`Encryption key: ${key.toString('hex')}`);