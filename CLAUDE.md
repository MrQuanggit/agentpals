# AgentPals – ghi chú cho agent

- Monorepo pnpm: `packages/core` (kiểu + reducer thuần), `packages/server` (Hono + ws, providers, CLI), `packages/ui` (React + Vite, TypeScript). Khi chạy thật, server phục vụ luôn `packages/ui/dist` trên cùng port 4777; khi dev, Vite (:5173) proxy `/api` và `/ws` sang server.
- Mọi provider (Claude, Codex, …) chỉ làm một việc: biến dữ liệu thô thành `AgentEvent` của `@agentpals/core`. Không để logic UI trong provider.
- Hook script (`hooks/claude-hook.mjs`, dùng chung cho Claude và Codex qua `--source`) phải luôn exit 0 và timeout ngắn — không bao giờ được chặn agent.
- Server chỉ bind 127.0.0.1; `/api/*`, `/hook/*` và WebSocket đều cần token (UI tĩnh thì không).
- Dữ liệu từ hook là không đáng tin: đi qua `normalizePayload` và `safeText` (server) trước khi hiển thị/log; script hook chỉ gửi trường cần thiết. Xem SECURITY.md trước khi đụng tới server, hook hoặc installer.
- Trước khi commit: `pnpm typecheck && pnpm test`.
- Design tham chiếu: https://claude.ai/artifact/Rm5znEVBJSiwSeub4e98K4
