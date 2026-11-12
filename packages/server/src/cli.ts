#!/usr/bin/env -S npx tsx
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { HOST, PORT, getOrCreateToken } from './config.ts';
import { installHooks, uninstallHooks } from './hooksInstaller.ts';
import { runDemo } from './demo.ts';
import { createAgentPalsServer } from './server.ts';

const [cmd = 'start', ...args] = process.argv.slice(2);
const UI_DIST = fileURLToPath(new URL('../../ui/dist', import.meta.url));

switch (cmd) {
  case 'start': {
    const token = getOrCreateToken();
    const dev = args.includes('--dev');
    const uiDir = dev ? undefined : UI_DIST;
    if (uiDir && !existsSync(join(uiDir, 'index.html'))) {
      console.warn('Chưa build UI. Chạy `pnpm build` trước, hoặc dùng `pnpm dev`.');
    }
    createAgentPalsServer({ host: HOST, port: PORT, token, uiDir });
    const uiPort = dev ? 5173 : PORT; // dev: Vite dev server; otherwise this server serves packages/ui/dist
    console.log(`AgentPals server: http://${HOST}:${PORT}`);
    console.log(`Mở UI: http://${HOST}:${uiPort}/?token=${token}`);
    break;
  }
  case 'install-hooks':
    for (const r of installHooks()) {
      if (r.error) {
        console.error(`✗ ${r.name}: ${r.error}`);
        process.exitCode = 1;
        continue;
      }
      console.log(r.done ? `✓ ${r.name}: đã cài hook vào ${r.file} (bản gốc lưu ở *.agentpals.bak)` : `- ${r.name}: không thấy cài trên máy, bỏ qua`);
      if (r.done && r.name === 'Codex') console.log('  Lần đầu mở Codex, gõ /hooks để duyệt (trust) hook mới. Cần Codex ≥ 0.124.');
    }
    break;
  case 'uninstall-hooks':
    for (const r of uninstallHooks()) {
      if (r.error) {
        console.error(`✗ ${r.name}: ${r.error}`);
        process.exitCode = 1;
      } else if (r.done) console.log(`✓ ${r.name}: đã gỡ hook khỏi ${r.file}`);
    }
    break;
  case 'demo':
    await runDemo();
    break;
  default:
    console.log('Dùng: agentpals [start | install-hooks | uninstall-hooks | demo]');
    process.exitCode = 1;
}
