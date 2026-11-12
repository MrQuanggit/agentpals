import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { loadCharacters, saveCharacters } from './characters.ts';

const file = () => join(mkdtempSync(join(tmpdir(), 'agentpals-chars-')), 'config.yaml');

describe('characters config', () => {
  it('round-trips through YAML', () => {
    const f = file();
    saveCharacters(f, new Map([['/p/api', { name: 'Kai', hair: '#2F5FC4', hoodie: true, lines: { idle: 'Đi pha cà phê' } }]]));
    expect(Object.fromEntries(loadCharacters(f))).toEqual({ '/p/api': { name: 'Kai', hair: '#2F5FC4', hoodie: true, lines: { idle: 'Đi pha cà phê' } } });
  });

  it('treats a hand-edited file as untrusted', () => {
    const f = file();
    writeFileSync(f, 'characters:\n  /p/web:\n    name: Mina\n    hair: not-a-color\n    evil: !!js/function "x"\n  __proto__:\n    name: bad\n  /p/list: [1, 2]\n');
    expect(Object.fromEntries(loadCharacters(f))).toEqual({ '/p/web': { name: 'Mina' } });
  });

  it('returns nothing for a broken or missing file', () => {
    const f = file();
    expect(loadCharacters(f).size).toBe(0);
    writeFileSync(f, 'characters: [unclosed');
    expect(loadCharacters(f).size).toBe(0);
    writeFileSync(f, 'just a string');
    expect(loadCharacters(f).size).toBe(0);
  });
});
