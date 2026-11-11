#!/usr/bin/env -S npx tsx
import { HOST, PORT, getOrCreateToken } from './config.ts';
import { installClaudeHooks, uninstallClaudeHooks } from './hooksInstaller.ts';
import { runDemo } from './demo.ts';
import { createAgentPalsServer } from './server.ts';

const [cmd = 'start'] = process.argv.slice(2);

switch (cmd) {
  case 'start': {
    const token = getOrCreateToken();
    createAgentPalsServer({ host: HOST, port: PORT, token });
    const uiPort = Number(process.env.AGENTPALS_UI_PORT ?? 3000); // Next.js app (packages/ui)
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
  case 'demo':
    await runDemo();
    break;
  default:
    console.log('Dùng: agentpals [start | install-hooks | uninstall-hooks | demo]');
    process.exitCode = 1;
}
