import { CanvasTexture, RepeatWrapping, SRGBColorSpace } from 'three';
import type { Pose } from '@/lib/look';

/** All textures are drawn in code (no image downloads), and cached. */
const cache = new Map<string, CanvasTexture>();

function make(key: string, w: number, h: number, draw: (ctx: CanvasRenderingContext2D, rnd: () => number) => void): CanvasTexture {
  const hit = cache.get(key);
  if (hit) return hit;
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  let seed = 7;
  const rnd = () => (seed = (seed * 1664525 + 1013904223) % 4294967296) / 4294967296;
  draw(c.getContext('2d')!, rnd);
  const t = new CanvasTexture(c);
  t.colorSpace = SRGBColorSpace;
  t.anisotropy = 8;
  cache.set(key, t);
  return t;
}

export function woodTexture(): CanvasTexture {
  return make('wood', 1024, 512, (ctx, rnd) => {
    ctx.fillStyle = '#C8A06C';
    ctx.fillRect(0, 0, 1024, 512);
    for (let i = 0; i < 260; i++) {
      const y = rnd() * 512;
      ctx.strokeStyle = `rgba(${90 + rnd() * 50},${60 + rnd() * 30},${30 + rnd() * 20},${0.05 + rnd() * 0.12})`;
      ctx.lineWidth = 0.6 + rnd() * 2.2;
      ctx.beginPath();
      ctx.moveTo(0, y);
      const wob = rnd() * 10;
      ctx.bezierCurveTo(340, y + wob, 680, y - wob, 1024, y + (rnd() - 0.5) * 8);
      ctx.stroke();
    }
    for (let i = 0; i < 40; i++) {
      ctx.fillStyle = `rgba(255,235,200,${rnd() * 0.06})`;
      ctx.fillRect(0, rnd() * 512, 1024, 4 + rnd() * 14);
    }
  });
}

export function carpetTexture(): CanvasTexture {
  const t = make('carpet', 256, 256, (ctx, rnd) => {
    ctx.fillStyle = '#C9BBA6';
    ctx.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 9000; i++) {
      const v = rnd();
      ctx.fillStyle = v > 0.5 ? `rgba(255,255,255,${rnd() * 0.1})` : `rgba(70,55,40,${rnd() * 0.1})`;
      ctx.fillRect(rnd() * 256, rnd() * 256, 1.5, 1.5);
    }
  });
  t.wrapS = t.wrapT = RepeatWrapping;
  t.repeat.set(7, 4.5);
  return t;
}

export function tileTexture(): CanvasTexture {
  const t = make('tile', 128, 128, (ctx) => {
    ctx.fillStyle = '#EFEBE4';
    ctx.fillRect(0, 0, 128, 128);
    ctx.strokeStyle = '#D3CCC0';
    ctx.lineWidth = 3;
    ctx.strokeRect(0, 0, 128, 128);
  });
  t.wrapS = t.wrapT = RepeatWrapping;
  t.repeat.set(6, 13);
  return t;
}

/** Night skyline seen through the big window. */
export function cityTexture(): CanvasTexture {
  return make('city', 1024, 384, (ctx, rnd) => {
    const sky = ctx.createLinearGradient(0, 0, 0, 384);
    sky.addColorStop(0, '#232B45');
    sky.addColorStop(0.55, '#5B5773');
    sky.addColorStop(1, '#C48B76');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, 1024, 384);
    for (let i = 0; i < 14; i++) {
      ctx.fillStyle = `rgba(255,255,255,${0.03 + rnd() * 0.05})`;
      ctx.beginPath();
      ctx.ellipse(rnd() * 1024, 40 + rnd() * 120, 80 + rnd() * 140, 10 + rnd() * 16, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    for (let layer = 0; layer < 2; layer++) {
      let x = -10;
      while (x < 1024) {
        const w = 34 + rnd() * 60;
        const h = (layer ? 90 : 150) + rnd() * (layer ? 130 : 120);
        ctx.fillStyle = layer ? '#141A2B' : '#27304A';
        ctx.fillRect(x, 384 - h, w, h);
        for (let wy = 384 - h + 8; wy < 380; wy += 9) {
          for (let wx = x + 5; wx < x + w - 5; wx += 7) {
            if (rnd() > 0.55) {
              ctx.fillStyle = rnd() > 0.3 ? `rgba(255,214,140,${0.5 + rnd() * 0.5})` : 'rgba(170,210,255,0.8)';
              ctx.fillRect(wx, wy, 3, 4);
            }
          }
        }
        x += w + rnd() * 10;
      }
    }
  });
}

const CODE = ['#7AA2F7', '#9ECE6A', '#E0AF68', '#BB9AF7', '#7DCFFF'];

/** Monitor content. `code` is the left screen; the others are the right screen per pose. */
export function screenTexture(kind: 'code' | 'off' | Exclude<Pose, 'idle'>, accent = '#2F6FD6'): CanvasTexture {
  return make(`screen-${kind}-${accent}`, 320, 192, (ctx, rnd) => {
    const lines = (color: string | string[], x0: number, y0: number, n: number, maxW: number, gap = 18) => {
      for (let i = 0; i < n; i++) {
        ctx.fillStyle = Array.isArray(color) ? color[i % color.length]! : color;
        const indent = i % 3 === 1 ? 22 : i % 4 === 2 ? 44 : 0;
        ctx.fillRect(x0 + indent, y0 + i * gap, maxW * (0.35 + rnd() * 0.6) - indent, 7);
      }
    };
    if (kind === 'off') {
      ctx.fillStyle = '#20252F';
      ctx.fillRect(0, 0, 320, 192);
      ctx.fillStyle = '#596274';
      ctx.beginPath();
      ctx.arc(160, 96, 6, 0, Math.PI * 2);
      ctx.fill();
      return;
    }
    if (kind === 'code') {
      ctx.fillStyle = '#1B2130';
      ctx.fillRect(0, 0, 320, 192);
      ctx.fillStyle = '#2A3347';
      ctx.fillRect(0, 0, 320, 20);
      ctx.fillRect(0, 20, 54, 172);
      lines('#46536E', 8, 34, 7, 40, 20);
      lines(CODE, 66, 34, 8, 240);
      return;
    }
    ctx.fillStyle = accent;
    ctx.fillRect(0, 0, 320, 192);
    ctx.fillStyle = 'rgba(0,0,0,0.18)';
    ctx.fillRect(0, 0, 320, 20);
    if (kind === 'typing') lines('rgba(255,255,255,0.92)', 18, 38, 8, 280);
    if (kind === 'reading') {
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(60, 32, 200, 148);
      ctx.fillStyle = accent;
      ctx.fillRect(76, 46, 110, 10);
      lines('#B8C2CF', 76, 68, 6, 168, 17);
    }
    if (kind === 'waiting') {
      ctx.fillStyle = '#FFFFFF';
      ctx.font = '800 120px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('!', 160, 150);
    }
  });
}
