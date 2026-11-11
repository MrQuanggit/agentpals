'use client';

import { useAgents, type Connection } from '@/lib/useAgents';
import { DEFAULT_LOOKS, SOURCE_LABEL, STATUS, agentName } from '@/lib/look';
import { Office, SEAT_COUNT } from './Office';

const CONN_TEXT: Record<Connection, string> = {
  connecting: 'Đang kết nối…',
  open: 'Đã kết nối · 127.0.0.1',
  closed: 'Mất kết nối, đang thử lại…',
  'no-token': 'Thiếu ?token= trong URL, hãy mở đúng link server in ra',
};

export function Dashboard() {
  const { agents, conn } = useAgents();
  const extra = agents.length - SEAT_COUNT;

  return (
    <div className="app">
      <header className="top">
        <strong className="logo">AgentPals</strong>
        <span className={`conn conn-${conn}`}>{CONN_TEXT[conn]}</span>
        <span className="muted">{agents.length} agent đang mở</span>
      </header>

      <main className="main">
        <section className="card scene">
          <div className="scene-head">
            <h1>Văn phòng</h1>
            <div className="legend">
              {(['typing', 'reading', 'waiting', 'idle'] as const).map((s) => (
                <span key={s}>
                  <i style={{ background: STATUS[s].screen }} />
                  {STATUS[s].label}
                </span>
              ))}
            </div>
          </div>
          <Office agents={agents} />
          {extra > 0 && <p className="muted">+{extra} agent chưa có bàn (văn phòng hiện có {SEAT_COUNT} chỗ).</p>}
        </section>

        <aside className="card panel">
          <h2>Agent</h2>
          {agents.length === 0 && <p className="muted">Chưa có agent nào. Mở Claude Code ở một project bất kỳ.</p>}
          {agents.map((a, i) => {
            const meta = STATUS[a.status];
            const look = DEFAULT_LOOKS[i % DEFAULT_LOOKS.length]!;
            return (
              <div key={a.agentId} className={`agent ${meta.pose === 'waiting' ? 'agent-waiting' : ''}`}>
                <svg width="40" height="40" viewBox="0 0 40 40" aria-hidden="true">
                  <rect width="40" height="40" rx="10" fill="#ECEEF1" />
                  <rect x="9" y="26" width="22" height="14" rx="6" fill={look.shirt} />
                  <circle cx="20" cy="19" r="8" fill={look.skin} />
                  <ellipse cx="21.5" cy="16" rx="8.5" ry="6.5" fill={look.hair} />
                </svg>
                <div className="agent-body">
                  <div className="row">
                    <strong>{agentName(a)}</strong>
                    <span className="chip">{SOURCE_LABEL[a.source]}</span>
                    <span className={`pill pill-${meta.pose}`}>{meta.label}</span>
                  </div>
                  {a.cwd && <code className="path">{a.cwd}</code>}
                  {a.detail && <div className="detail">{a.detail}</div>}
                </div>
              </div>
            );
          })}
        </aside>
      </main>
    </div>
  );
}
