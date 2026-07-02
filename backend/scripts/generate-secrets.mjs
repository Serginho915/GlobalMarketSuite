import crypto from 'crypto';

console.log(`JWT_SECRET=${crypto.randomBytes(48).toString('base64url')}`);
console.log(`REFRESH_TOKEN_SECRET=${crypto.randomBytes(48).toString('base64url')}`);
