import { randomBytes } from 'node:crypto';
import { chmodSync, existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

export const HOST = '127.0.0.1';
export const PORT = Number(process.env.AGENTPALS_PORT ?? 4777);

export const HOME_DIR = process.env.AGENTPALS_HOME ?? join(homedir(), '.agentpals');
export const TOKEN_FILE = join(HOME_DIR, 'token');

/** A valid token is 48 hex chars (24 random bytes). Anything else is regenerated. */
export const TOKEN_RE = /^[0-9a-f]{48}$/;

const isPosix = process.platform !== 'win32';

/** Read the shared secret used by hooks + UI, creating (or replacing an invalid) one. */
export function getOrCreateToken(): string {
  if (!existsSync(HOME_DIR)) mkdirSync(HOME_DIR, { recursive: true, mode: 0o700 });
  if (existsSync(TOKEN_FILE)) {
    const token = readFileSync(TOKEN_FILE, 'utf8').trim();
    if (TOKEN_RE.test(token)) {
      // Tighten permissions if the file became readable by others.
      if (isPosix && (statSync(TOKEN_FILE).mode & 0o077) !== 0) chmodSync(TOKEN_FILE, 0o600);
      return token;
    }
  }
  const token = randomBytes(24).toString('hex');
  writeFileSync(TOKEN_FILE, token, { mode: 0o600 });
  if (isPosix) chmodSync(TOKEN_FILE, 0o600); // mode is ignored when the file already existed
  return token;
}
