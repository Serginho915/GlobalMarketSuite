import crypto from 'crypto';
import fs from 'fs';

const file = '.env.production';
if (fs.existsSync(file)) {
  console.log(`${file} already exists; leaving it unchanged.`);
} else {
  const secret = () => crypto.randomBytes(32).toString('base64url');
  const content = `POSTGRES_DB=globalmarketsuite
POSTGRES_USER=globalmarketsuite
POSTGRES_PASSWORD=${secret()}
VITE_API_URL=https://api.globalmarketsuite.com
VITE_GA_MEASUREMENT_ID=G-DJXSW2JR0R
`;

  fs.writeFileSync(file, content, { mode: 0o600 });
  console.log(`${file} created. Review domains before production deploy.`);
}

const secret = () => crypto.randomBytes(32).toString('base64url');
const backendFile = 'backend/.env.production';
if (!fs.existsSync(backendFile)) {
  const backendContent = `NODE_ENV=production
PORT=4000
REDIS_URL=redis://redis:6379
CORS_ORIGIN=https://globalmarketsuite.com
SITE_URL=https://globalmarketsuite.com
JWT_SECRET=${secret()}
REFRESH_TOKEN_SECRET=${secret()}
OPENROUTER_API_KEY=
OPENROUTER_MODEL=meta-llama/llama-3.1-8b-instruct
OPENROUTER_SITE_URL=https://globalmarketsuite.com
OPENROUTER_TIMEOUT_MS=90000
OPENROUTER_MAX_INPUT_CHARS=16000
OPENROUTER_MAX_OUTPUT_TOKENS=9000
OPENROUTER_TEMPERATURE=0.7
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
SMTP_FROM=
`;
  fs.writeFileSync(backendFile, backendContent, { mode: 0o600 });
  console.log(`${backendFile} created. Keep JWT_SECRET and REFRESH_TOKEN_SECRET stable.`);
}
