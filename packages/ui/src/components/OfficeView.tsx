import { Component, Suspense, lazy, useMemo, type ReactNode } from 'react';
import type { AgentState } from '@agentpals/core';
import { Office } from './Office';

// three.js is heavy: load the 3D office only when it can actually run.
const Office3D = lazy(() => import('./Office3D'));

function hasWebGL(): boolean {
  try {
    const c = document.createElement('canvas');
    return Boolean(c.getContext('webgl2') ?? c.getContext('webgl'));
  } catch {
    return false;
  }
}

/** If the 3D scene fails for any reason, fall back to the flat SVG office instead of a blank card. */
class Fallback extends Component<{ fallback: ReactNode; children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

export function OfficeView({ agents }: { agents: AgentState[] }) {
  const webgl = useMemo(hasWebGL, []);
  const flat = <Office agents={agents} />;
  if (!webgl) return flat;
  return (
    <Fallback fallback={flat}>
      <Suspense fallback={<div className="office3d office3d-loading">Đang dựng văn phòng…</div>}>
        <Office3D agents={agents} />
      </Suspense>
    </Fallback>
  );
}
