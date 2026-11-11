#!/usr/bin/env -S npx tsx
import { HOST, PORT, getOrCreateToken } from './config.ts';
import { installClaudeHooks, uninstallClaudeHooks } from './hooksInstaller.ts';
import { createAgentPalsServer } from './server.ts';

const [cmd = 'start'] = process.argv.slice(2);

switch (cmd) {
  case 'start': {
    const token = getOrCreateToken();
    createAgentPalsServer({ host: HOST, port: PORT, token });
    // TODO(phase 4): serve the built UI from this server; until then the UI runs via `pnpm dev` on :5173.
    const uiPort = 5173;
    console.log(`AgentPals server: http://${HOST}:${PORT}`);
    console.log(`Mở UI: http://${HOST}:${uiPort}/?token=${token}`);
    break;
  }
  case 'install-hooks':
    console.log(`Đã cài hook AgentPals vào ${installClaudeHooks()} (bản cũ lưu ở *.agentpals.bak)`);
    break;
  case 'uninstall-hooks':
    console.log(`Đã gỡ hook AgentPals khỏi ${uninstallClaudeHooks()}`);
    break;
  default:
    console.log('Dùng: agentpals [start | install-hooks | uninstall-hooks]');
    process.exitCode = 1;
}
