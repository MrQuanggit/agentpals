import { randomBytes } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

export const HOST = '127.0.0.1';
export const PORT = Number(process.env.AGENTPALS_PORT ?? 4777);

export const HOME_DIR = process.env.AGENTPALS_HOME ?? join(homedir(), '.agentpals');
export const TOKEN_FILE = join(HOME_DIR, 'token');

/** Read the shared secret used by hooks + UI, creating it on first run. */
export function getOrCreateToken(): string {
  if (!existsSync(HOME_DIR)) mkdirSync(HOME_DIR, { recursive: true });
  if (existsSync(TOKEN_FILE)) return readFileSync(TOKEN_FILE, 'utf8').trim();
  const token = randomBytes(24).toString('hex');
  writeFileSync(TOKEN_FILE, token, { mode: 0o600 });
  return token;
}
