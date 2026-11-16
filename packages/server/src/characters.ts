import { chmodSync, existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { parse, stringify } from 'yaml';
import { MAX_CHARACTERS, isCharacterKey, sanitizeCharacter, type Character } from '@agentpals/core';

const HEADER = `# AgentPals: nhân vật theo project (khoá là thư mục project).
# Sửa trong giao diện (nút "Sửa" ở danh sách agent), hoặc sửa tay rồi khởi động lại server.
# Trường nào bỏ trống sẽ dùng mặc định. Màu dạng "#RRGGBB".
`;

/**
 * Read characters from the YAML config. The file is user-editable, so it is treated as untrusted:
 * every entry goes through sanitizeCharacter and a broken file yields an empty map instead of a crash.
 */
export function loadCharacters(file: string): Map<string, Character> {
  const out = new Map<string, Character>();
  if (!existsSync(file)) return out;
  let doc: unknown;
  try {
    doc = parse(readFileSync(file, 'utf8'));
  } catch (e) {
    console.warn(`[agentpals] không đọc được ${file}: ${e instanceof Error ? e.message.split('\n')[0] : e}`);
    return out;
  }
  const chars = doc && typeof doc === 'object' && !Array.isArray(doc) ? (doc as Record<string, unknown>).characters : undefined;
  if (!chars || typeof chars !== 'object' || Array.isArray(chars)) return out;
  for (const [key, raw] of Object.entries(chars)) {
    if (out.size >= MAX_CHARACTERS) break;
    const c = isCharacterKey(key) ? sanitizeCharacter(raw) : null;
    if (c) out.set(key, c);
  }
  return out;
}

/** Atomic write, readable by the owner only. */
export function saveCharacters(file: string, characters: Map<string, Character>): void {
  mkdirSync(dirname(file), { recursive: true, mode: 0o700 });
  const tmp = `${file}.tmp`;
  writeFileSync(tmp, HEADER + stringify({ characters: Object.fromEntries(characters) }), { mode: 0o600 });
  if (process.platform !== 'win32') chmodSync(tmp, 0o600);
  renameSync(tmp, file);
}
