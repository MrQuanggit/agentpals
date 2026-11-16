# Bảo mật AgentPals

AgentPals là ứng dụng chạy **trên máy của bạn**, cho **chính bạn** xem. Tài liệu này ghi lại AgentPals tin ai, không tin ai, và đã chặn những gì.

## Mô hình tin cậy

| Thành phần | Tin cậy? | Lý do |
| --- | --- | --- |
| Tài khoản người dùng hiện tại trên máy | Có | Đọc được token, chạy được hook. Ai đã chạy code dưới tài khoản của bạn thì AgentPals không bảo vệ được gì thêm. |
| Người dùng khác trên cùng máy | Không | Thư mục `~/.agentpals` có quyền 700, file token quyền 600. Server cần token cho mọi dữ liệu. |
| Trang web đang mở trong trình duyệt | Không | Chặn bằng token, kiểm tra Host (chống DNS rebinding), kiểm tra Origin cho WebSocket và CSP. |
| Nội dung agent đọc hoặc chạy (repo, web, prompt injection) | Không | Mọi chuỗi từ hook đều bị kiểm tra kiểu, giới hạn độ dài, lọc ký tự điều khiển terminal và che bí mật trước khi hiển thị hoặc ghi log. AgentPals chỉ **hiển thị**, không bao giờ chạy lệnh hay mở file theo dữ liệu từ hook. |

## Các biện pháp đã có

**Server (`packages/server`)**
- Chỉ bind `127.0.0.1`. Header `Host` phải là địa chỉ loopback, nếu không trả 403 (chống DNS rebinding).
- Token 24 byte ngẫu nhiên, so sánh bằng `timingSafeEqual`. Server **từ chối khởi động** nếu token rỗng hoặc sai định dạng; token hỏng sẽ được tạo lại.
- `/api/*`, `/hook/*` và WebSocket `/ws` đều cần token. WebSocket còn kiểm tra `Origin` phải là trang loopback.
- Hook body tối đa 64 KB; WebSocket không nhận message từ client (giới hạn 1 KB); tối đa 100 agent.
- Header bảo mật trên mọi response: CSP chặt (`script-src 'self'`, `frame-ancestors 'none'`, …), `nosniff`, `Referrer-Policy: no-referrer`, `X-Frame-Options: DENY`, COOP/CORP. API trả `Cache-Control: no-store`.
- Dữ liệu từ hook: kiểm tra kiểu (`normalizePayload`), cắt độ dài, bỏ ký tự điều khiển (chặn chèn mã ANSI vào terminal) và che bí mật (`KEY=…`, `Bearer …`, `user:pass@`, `sk-…`, `ghp_…`, `AKIA…`, JWT, …) **trước khi** đưa lên UI hoặc in log.

**Cấu hình nhân vật (`~/.agentpals/config.yaml`, `/api/characters`)**
- API cần token như mọi route khác; body tối đa 8 KB; tối đa 200 nhân vật.
- Dữ liệu từ API và từ file sửa tay đều đi qua `sanitizeCharacter`: màu phải đúng `#RRGGBB`, kiểu tóc/phụ kiện phải nằm trong danh sách, tên ≤ 24 và câu nói ≤ 60 ký tự, bỏ ký tự điều khiển, bỏ mọi trường lạ. Khoá `__proto__`/`constructor`/`prototype` bị từ chối.
- YAML chỉ được phân tích thành dữ liệu (thư viện `yaml`, không chạy mã, tag lạ bị bỏ). File hỏng thì server chạy với cấu hình rỗng.
- File ghi nguyên tử, quyền 600.

**Script hook (`hooks/claude-hook.mjs`)**
- Chỉ gửi các trường cần cho UI. Nội dung file (`Write`/`Edit`), nội dung patch, `transcript_path` **không bao giờ** rời khỏi script; patch chỉ còn dòng tên file (kể cả khi Codex gửi patch trong `tool_input.command`).
- Token gửi qua header, không qua tham số dòng lệnh. Luôn exit 0, timeout 1 giây, không in ra gì.

**Bộ cài hook**
- Từ chối đường dẫn chứa ký tự shell có thể diễn giải (`"`, `` ` ``, `$`, `%`, `!`, xuống dòng).
- Không sửa file settings nếu JSON hỏng hoặc mục `hooks` có cấu trúc lạ.
- Ghi nguyên tử (file tạm rồi đổi tên), giữ nguyên quyền file gốc, chỉ backup **bản gốc trước lần cài đầu tiên** (`*.agentpals.bak`).
- Chỉ thêm/gỡ hook có cờ `--agentpals`, không đụng hook khác của bạn.

**UI (`packages/ui`)**
- Token lấy từ `?token=` một lần, lưu `sessionStorage` của tab rồi **xoá khỏi thanh địa chỉ**. Thêm `<meta name="referrer" content="no-referrer">`.
- React tự escape mọi chuỗi; không dùng `dangerouslySetInnerHTML`.
- Văn phòng 3D (three.js) chạy hoàn toàn trong trình duyệt: texture vẽ bằng canvas trong code, không tải model, ảnh hay HDR từ mạng; bundle không dùng `eval`, `new Function` hay Web Worker nên CSP `script-src 'self'` giữ nguyên. Nhãn tên là phần tử DOM do React render.

**Chuỗi cung ứng**
- `pnpm audit` chạy trong CI; GitHub Actions pin theo commit SHA, quyền `contents: read`; Dependabot cập nhật hằng tuần.
- pnpm chỉ cho phép script cài đặt của `esbuild`.

## Giới hạn đã biết

- Lần rà soát gần nhất: 2026-11-12, sau khi thêm văn phòng 3D. Kiểm tra lại `pnpm audit`, bundle, header, Host/token/path traversal/giới hạn body và chèn HTML qua tên project trên bản đang chạy; không có phát hiện mới.
- three, @react-three/fiber và @react-three/drei chỉ được đối chiếu với cơ sở dữ liệu lỗ hổng đã công bố, chưa đọc mã nguồn.
- UI tải font từ Google Fonts, nên Google biết IP của bạn khi mở trang (không kèm token vì `no-referrer`). Có thể tự host font nếu cần.
- Việc che bí mật dựa trên mẫu nhận dạng, không bắt được mọi kiểu. Nó là lớp phòng thủ thêm; dữ liệu vốn chỉ hiển thị trên máy bạn.
- File settings của Claude Code/Codex chứa đường dẫn tuyệt đối tới `hooks/claude-hook.mjs`. Ai sửa được thư mục repo thì chạy được code mỗi khi agent dùng tool, nên đừng đặt repo ở thư mục người khác ghi được.

## Báo lỗi bảo mật

Đừng mở issue công khai. Hãy dùng **GitHub → Security → Report a vulnerability** của repo này.
