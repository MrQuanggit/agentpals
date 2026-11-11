import type { AgentStatus } from '@agentpals/core';
import { useAgents } from './useAgents.ts';

const STATUS: Record<AgentStatus, { label: string; cls: string }> = {
  typing: { label: 'Đang gõ', cls: 'typing' },
  running: { label: 'Chạy lệnh', cls: 'typing' },
  thinking: { label: 'Suy nghĩ', cls: 'typing' },
  reading: { label: 'Đang đọc', cls: 'reading' },
  waiting: { label: 'Chờ bạn', cls: 'waiting' },
  idle: { label: 'Rảnh', cls: 'idle' },
};

const CONN_TEXT = {
  connecting: 'Đang kết nối…',
  open: 'Đã kết nối',
  closed: 'Mất kết nối, đang thử lại…',
  'no-token': 'Thiếu ?token= trong URL — mở đúng link server in ra',
};

export function App() {
  const { agents, conn } = useAgents();

  return (
    <div className="app">
      <header className="top">
        <strong className="logo">AgentPals</strong>
        <span className={`conn conn-${conn}`}>{CONN_TEXT[conn]}</span>
      </header>

      <main className="main">
        <section className="scene">
          {/* TODO(phase 4): isometric office scene from the Claude Design mockup */}
          <p className="muted">Văn phòng isometric sẽ ở đây (giai đoạn 4).</p>
        </section>

        <aside className="panel">
          <h2>Agent</h2>
          {agents.length === 0 && <p className="muted">Chưa có agent nào. Mở Claude Code ở một project bất kỳ.</p>}
          {agents.map((a) => (
            <div key={a.agentId} className="agent">
              <div className="row">
                <strong>{a.cwd?.split(/[\\/]/).pop() ?? a.sessionId.slice(0, 8)}</strong>
                <span className="chip">{a.source === 'claude' ? 'Claude Code' : 'Codex'}</span>
                <span className={`pill ${STATUS[a.status].cls}`}>{STATUS[a.status].label}</span>
              </div>
              {a.cwd && <code className="path">{a.cwd}</code>}
              {a.detail && <div className="detail">{a.detail}</div>}
            </div>
          ))}
        </aside>
      </main>
    </div>
  );
}
