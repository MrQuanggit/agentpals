# AgentPals – ghi chú cho agent

- Monorepo pnpm: `packages/core` (kiểu + reducer thuần), `packages/server` (Hono + ws, providers, CLI), `packages/ui` (Next.js App Router + React, TypeScript). Next không có WebSocket nên UI nối thẳng tới server ở :4777.
- Mọi provider (Claude, Codex, …) chỉ làm một việc: biến dữ liệu thô thành `AgentEvent` của `@agentpals/core`. Không để logic UI trong provider.
- Hook script (`hooks/claude-hook.mjs`) phải luôn exit 0 và timeout ngắn — không bao giờ được chặn agent.
- Server chỉ bind 127.0.0.1, mọi route và WebSocket đều cần token.
- Trước khi commit: `pnpm typecheck && pnpm test`.
- Design tham chiếu: https://claude.ai/artifact/Rm5znEVBJSiwSeub4e98K4
