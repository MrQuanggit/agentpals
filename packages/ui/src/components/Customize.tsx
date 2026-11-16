import { useEffect, useId, useRef, useState, type FormEvent } from 'react';
import { ACCESSORIES, HAIR_STYLES, LINE_POSES, characterKey, type AgentState, type Character, type LinePose } from '@agentpals/core';
import { SOURCE_LABEL, agentName, type Look } from '@/lib/look';
import { StandingPerson } from './office/People';

const HAIR_LABEL = { short: 'Ngắn', long: 'Dài', bun: 'Búi', curly: 'Xoăn' } as const;
const ACC_LABEL = { none: 'Không', headphones: 'Tai nghe', glasses: 'Kính' } as const;
const LINE_LABEL: Record<LinePose, { label: string; hint: string }> = {
  typing: { label: 'Đang gõ', hint: 'Đang sửa {detail}' },
  reading: { label: 'Đang đọc', hint: 'Để xem {detail} nào…' },
  waiting: { label: 'Chờ bạn', hint: 'Ê, duyệt giúp mình với!' },
  idle: { label: 'Nghỉ ở pantry', hint: 'Xong rồi, đi pha cà phê' },
};

const SWATCHES = {
  hair: ['#2F5FC4', '#D9692C', '#3B2A20', '#1C2230', '#8E95A1', '#C2417A'],
  shirt: ['#2E3138', '#2F7D6D', '#7A4FBF', '#B5473A', '#3B6FD8', '#E3A72F'],
  skin: ['#F2C9A0', '#D9A27A', '#A86F4C', '#6E4630'],
  pants: ['#7A5230', '#3E4A63', '#3A3F4A', '#5A6B4F'],
} as const;
const COLOR_LABEL = { hair: 'Màu tóc', shirt: 'Màu áo', skin: 'Màu da', pants: 'Màu quần' } as const;

interface Props {
  agent: AgentState;
  /** The look currently shown for this agent (defaults + saved choices). */
  look: Look;
  saved: Character | undefined;
  onSave: (key: string, character: Character | null) => Promise<void>;
  onClose: () => void;
}

/** Dialog to rename and restyle the character of one project. */
export function Customize({ agent, look, saved, onSave, onClose }: Props) {
  const [name, setName] = useState(saved?.name ?? '');
  const [draft, setDraft] = useState<Look>(look);
  const [lines, setLines] = useState<Partial<Record<LinePose, string>>>(saved?.lines ?? {});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const titleId = useId();
  const firstField = useRef<HTMLInputElement>(null);

  useEffect(() => {
    firstField.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const set = <K extends keyof Look>(k: K, v: Look[K]) => setDraft((d) => ({ ...d, [k]: v }));

  const run = async (character: Character | null) => {
    setBusy(true);
    setError('');
    try {
      await onSave(characterKey(agent), character);
      onClose();
    } catch (e) {
      setError(`Không lưu được (${e instanceof Error ? e.message : 'lỗi'}). Server còn chạy không?`);
      setBusy(false);
    }
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const cleanLines = Object.fromEntries(Object.entries(lines).filter(([, v]) => v?.trim()));
    void run({
      name: name.trim() || undefined,
      hair: draft.hair,
      hairStyle: draft.hairStyle,
      accessory: draft.accessory,
      shirt: draft.shirt,
      hoodie: draft.hoodie,
      skin: draft.skin,
      pants: draft.pants,
      lines: Object.keys(cleanLines).length ? cleanLines : undefined,
    });
  };

  return (
    <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <form className="modal" role="dialog" aria-modal="true" aria-labelledby={titleId} onSubmit={submit}>
        <div className="modal-preview">
          <svg viewBox="-70 -135 140 150" role="img" aria-label="Xem trước nhân vật">
            <StandingPerson look={draft} />
          </svg>
          <strong>{name.trim() || agentName(agent)}</strong>
          <span className="muted">{SOURCE_LABEL[agent.source]}</span>
          <code className="path">{agent.cwd ?? agent.sessionId}</code>
        </div>

        <div className="modal-form">
          <h2 id={titleId}>Tuỳ chỉnh nhân vật</h2>

          <label className="field">
            Tên nhân vật
            <input ref={firstField} value={name} maxLength={24} placeholder={agentName(agent)} onChange={(e) => setName(e.target.value)} />
          </label>

          <div className="field-row">
            <fieldset className="field">
              <legend>Kiểu tóc</legend>
              <div className="pills">
                {HAIR_STYLES.map((h) => (
                  <button type="button" key={h} aria-pressed={draft.hairStyle === h} onClick={() => set('hairStyle', h)}>
                    {HAIR_LABEL[h]}
                  </button>
                ))}
              </div>
            </fieldset>
            <fieldset className="field">
              <legend>Phụ kiện</legend>
              <div className="pills">
                {ACCESSORIES.map((a) => (
                  <button type="button" key={a} aria-pressed={draft.accessory === a} onClick={() => set('accessory', a)}>
                    {ACC_LABEL[a]}
                  </button>
                ))}
              </div>
            </fieldset>
          </div>

          <div className="field-row">
            {(Object.keys(SWATCHES) as Array<keyof typeof SWATCHES>).map((k) => (
              <fieldset className="field" key={k}>
                <legend>{COLOR_LABEL[k]}</legend>
                <div className="swatches">
                  {SWATCHES[k].map((c) => (
                    <button type="button" key={c} aria-label={`${COLOR_LABEL[k]} ${c}`} aria-pressed={draft[k].toUpperCase() === c} style={{ background: c }} onClick={() => set(k, c)} />
                  ))}
                  <input type="color" aria-label={`${COLOR_LABEL[k]} tuỳ chọn`} value={draft[k]} onChange={(e) => set(k, e.target.value)} />
                </div>
              </fieldset>
            ))}
          </div>

          <label className="check">
            <input type="checkbox" checked={draft.hoodie} onChange={(e) => set('hoodie', e.target.checked)} />
            Áo hoodie (có mũ)
          </label>

          <fieldset className="field">
            <legend>
              Câu nói theo trạng thái <span className="muted">(viết {'{detail}'} để chèn việc agent đang làm)</span>
            </legend>
            <div className="lines">
              {LINE_POSES.map((p) => (
                <label key={p}>
                  <span className={`pill pill-${p}`}>{LINE_LABEL[p].label}</span>
                  <input value={lines[p] ?? ''} maxLength={60} placeholder={LINE_LABEL[p].hint} onChange={(e) => setLines((l) => ({ ...l, [p]: e.target.value }))} />
                </label>
              ))}
            </div>
          </fieldset>

          {error && (
            <p className="error" role="alert">
              {error}
            </p>
          )}

          <div className="modal-actions">
            {saved && (
              <button type="button" className="btn btn-quiet" disabled={busy} onClick={() => void run(null)}>
                Về mặc định
              </button>
            )}
            <span className="spacer" />
            <button type="button" className="btn" disabled={busy} onClick={onClose}>
              Huỷ
            </button>
            <button type="submit" className="btn btn-primary" disabled={busy}>
              {busy ? 'Đang lưu…' : 'Lưu nhân vật'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
