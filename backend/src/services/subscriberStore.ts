import { query } from './db';

export async function addSubscriber(email: string) {
  const normalized = email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) throw new Error('Please enter a valid email address.');
  await query('INSERT INTO subscribers (email) VALUES ($1) ON CONFLICT (email) DO NOTHING', [normalized]);
  return { email: normalized };
}
