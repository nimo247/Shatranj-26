import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = 'file:./dev.db?connection_limit=1';
}

function getRequiredSecret(name: 'JWT_SECRET' | 'ADMIN_KEYWORD'): string {
  const value = process.env[name]?.trim();
  if (!value || value.startsWith('replace-with-')) {
    throw new Error(`${name} must be configured in the environment`);
  }
  return value;
}

export const JWT_SECRET = getRequiredSecret('JWT_SECRET');
export const ADMIN_KEYWORD = getRequiredSecret('ADMIN_KEYWORD');
export const PORT = Number(process.env.PORT || 3000);
