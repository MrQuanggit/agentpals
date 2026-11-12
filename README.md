# AgentPals

Ứng dụng chạy local, biến các agent **Claude Code** và **Codex CLI** đang chạy trên máy bạn thành những nhân vật trong một văn phòng 3D, xoay và phóng to được.

![AgentPals](docs/screenshot.png)

- 4 agent ngồi một hàng ngang ở bàn dài, mỗi chỗ một bộ thiết bị riêng và ghế công thái học.
- Nhân vật đổi tư thế theo việc agent đang làm: gõ phím khi sửa file hoặc chạy lệnh, chống cằm khi đọc, giơ tay khi cần bạn duyệt.
- Hết việc thì agent rời bàn ra pantry cầm cốc cà phê.
- Bên phải là danh sách agent kèm project và việc đang làm.

> Đang xây dựng. Ý tưởng lấy cảm hứng từ pixel-agents; toàn bộ code và hình ảnh ở đây là tự viết.

## Cài đặt

Cần Node 20.19+ và pnpm (`npm i -g pnpm`). Dùng với Codex thì cần Codex CLI ≥ 0.124.

```bash
git clone https://github.com/MrQuanggit/agentpals.git
cd agentpals
pnpm install
pnpm start
```

Mở link `http://127.0.0.1:4777/?token=...` mà terminal in ra. Token bị xoá khỏi thanh địa chỉ sau khi trang tải, nên mỗi tab mới hãy mở lại bằng link này.

**Xem thử với agent giả** (terminal thứ hai, trong lúc `pnpm start` đang chạy):

```bash
pnpm demo
```

**Dùng với agent thật** (chạy một lần):

```bash
pnpm install-hooks
```

- Lệnh này thêm hook vào `~/.claude/settings.json` và `~/.codex/hooks.json`, chỉ cho agent nào có trên máy. Hook sẵn có của bạn được giữ nguyên, bản gốc lưu ở `*.agentpals.bak`.
- Sau đó mở Claude Code hoặc Codex ở project bất kỳ, nhân vật sẽ hiện ra.
- Codex: lần đầu mở sau khi cài, gõ `/hooks` để duyệt hook mới.
- Đừng di chuyển thư mục `agentpals` sau khi cài hook. Lỡ di chuyển thì chạy lại `pnpm install-hooks`.

Gỡ hook: `pnpm uninstall-hooks`.

## Các lệnh

| Lệnh | Việc |
| --- | --- |
| `pnpm start` | Build UI rồi chạy server ở `127.0.0.1:4777` (1 tiến trình, 1 port) |
| `pnpm dev` | Chế độ sửa code: server `:4777` + Vite `:5173` có hot reload |
| `pnpm demo` | Gửi sự kiện của 4 agent giả tới server đang chạy |
| `pnpm install-hooks` / `pnpm uninstall-hooks` | Cài / gỡ hook cho Claude Code và Codex |
| `pnpm typecheck` / `pnpm test` | Kiểm tra kiểu / chạy test |

## Ghi chú khi dùng

- Văn phòng có 4 bàn và 4 chỗ ở pantry. Agent thứ 5 trở đi chỉ hiện trong danh sách bên phải, trừ khi đang rảnh và pantry còn chỗ.
- Agent rảnh quá 30 phút sẽ tự rời văn phòng (Codex không báo khi phiên kết thúc).
- Kéo chuột để xoay góc nhìn, cuộn để phóng to. Máy không có WebGL sẽ tự dùng bản văn phòng phẳng (SVG).
- Nếu terminal in `bỏ qua payload: …` thì đó là sự kiện chưa được nhận diện; hãy mở issue kèm dòng đó.
- Phần Codex viết theo tài liệu hook của Codex và chưa được thử với Codex thật.

## Cách hoạt động

```
Claude Code / Codex ──hook (stdin JSON)──> hooks/claude-hook.mjs ──POST /hook/{claude|codex}──> server
                                                                      │  mapClaudeHook / mapCodexHook → AgentEvent
                                                                      │  applyEvent → AgentState
                                                              WebSocket /ws
                                                                      ▼
                                                             React UI (3D)
```

- `packages/core` – kiểu `AgentEvent`, `AgentState`, reducer `applyEvent`.
- `packages/server` – Hono + ws, provider Claude và Codex, cài/gỡ hook, CLI. Phục vụ luôn UI đã build.
- `packages/ui` – React + Vite. Văn phòng 3D bằng three.js / react-three-fiber ở `src/components/office3d`; mọi texture vẽ bằng code, không tải ảnh từ mạng.
- `hooks/claude-hook.mjs` – script cả hai agent gọi; luôn exit 0, không bao giờ làm chậm agent.

## Bảo mật

- Server chỉ nghe ở `127.0.0.1`, kiểm tra Host và Origin. API, hook và WebSocket đều cần token trong `~/.agentpals/token` (tự tạo, quyền 600).
- Hook chỉ gửi tên file và lệnh, không gửi nội dung file. Bí mật trong lệnh (`API_KEY=…`, `Bearer …`) bị che trước khi hiển thị hoặc ghi log.
- Trang chỉ gọi ra ngoài một nơi: Google Fonts.
- Mô hình bảo mật, các biện pháp và giới hạn: [SECURITY.md](SECURITY.md).

## Lộ trình

1. ✅ Khung monorepo, CI
2. ✅ Hook Claude Code → server
3. ✅ WebSocket → danh sách agent
4. ✅ Provider Codex (qua Codex hooks)
5. ✅ Rà soát và gia cố bảo mật
6. ✅ Văn phòng 3D: hàng bàn 4 chỗ, ghế công thái học, pantry, góc họp
7. ⬜ Tuỳ chỉnh nhân vật (tên, ngoại hình, câu nói), lưu `~/.agentpals/config.yaml`
8. ⬜ Thử và chỉnh với Codex thật
9. ⬜ GIF demo

## License

MIT
