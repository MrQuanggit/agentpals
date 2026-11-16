import { RoundedBox } from '@react-three/drei';
import type { ReactNode } from 'react';
import { DoubleSide } from 'three';
import type { Pose } from '@/lib/look';
import { carpetTexture, cityTexture, screenTexture, tileTexture, woodTexture } from './textures';

type V3 = [number, number, number];

const DARK = '#2B2724';
const METAL = '#33302D';
const CREAM = '#E9E2D4';
const WALNUT = '#8A6A4A';

function Box({ at, size, color, rough = 0.8, metal = 0, shadow = true, rot }: { at: V3; size: V3; color: string; rough?: number; metal?: number; shadow?: boolean; rot?: V3 }) {
  return (
    <mesh position={at} rotation={rot} castShadow={shadow} receiveShadow>
      <boxGeometry args={size} />
      <meshStandardMaterial color={color} roughness={rough} metalness={metal} />
    </mesh>
  );
}

/** A curved panel (slice of a cylinder) whose concave side faces the sitter at -z. */
function Arc({ r, h, span, y, z, color, opacity = 1, rough = 0.9 }: { r: number; h: number; span: number; y: number; z: number; color: string; opacity?: number; rough?: number }) {
  return (
    <mesh position={[0, y, z - r]} castShadow>
      <cylinderGeometry args={[r, r, h, 20, 1, true, -span / 2, span]} />
      <meshStandardMaterial color={color} roughness={rough} side={DoubleSide} transparent={opacity < 1} opacity={opacity} />
    </mesh>
  );
}

/** Ergonomic chair: curved mesh back, lumbar pad, headrest, T-arms. On the floor at the origin; the sitter faces -z. */
export function Chair({ accent = '#E07B39' }: { accent?: string }) {
  const graphite = '#1F2023';
  return (
    <group>
      {[0, 1, 2, 3, 4].map((i) => (
        <group key={i} rotation={[0, (i / 5) * Math.PI * 2, 0]}>
          <Box at={[0.16, 0.075, 0]} size={[0.32, 0.03, 0.05]} color="#C9CCD1" rough={0.25} metal={0.8} rot={[0, 0, -0.08]} />
          <mesh position={[0.32, 0.035, 0]} castShadow>
            <sphereGeometry args={[0.036, 10, 8]} />
            <meshStandardMaterial color={graphite} roughness={0.5} />
          </mesh>
        </group>
      ))}
      <mesh position={[0, 0.25, 0]} castShadow>
        <cylinderGeometry args={[0.026, 0.04, 0.32, 12]} />
        <meshStandardMaterial color="#B8BBC0" roughness={0.2} metalness={0.9} />
      </mesh>
      <Box at={[0, 0.42, 0.04]} size={[0.22, 0.05, 0.32]} color={graphite} rough={0.5} />
      {/* seat with a waterfall front edge */}
      <RoundedBox args={[0.52, 0.09, 0.5]} radius={0.04} smoothness={4} position={[0, 0.49, 0]} castShadow receiveShadow>
        <meshStandardMaterial color="#2F3136" roughness={0.95} />
      </RoundedBox>
      {/* back: spine, mesh, frame rims, lumbar pad, headrest */}
      <Box at={[0, 0.74, 0.335]} size={[0.07, 0.62, 0.035]} color={graphite} rough={0.4} rot={[0.05, 0, 0]} />
      <Arc r={0.42} h={0.6} span={1.25} y={0.93} z={0.3} color="#44474E" opacity={0.86} />
      <Arc r={0.421} h={0.035} span={1.3} y={1.235} z={0.3} color={graphite} rough={0.4} />
      <Arc r={0.421} h={0.035} span={1.3} y={0.625} z={0.3} color={graphite} rough={0.4} />
      <Arc r={0.4} h={0.11} span={0.85} y={0.79} z={0.285} color={accent} rough={0.8} />
      <Box at={[0, 1.3, 0.33]} size={[0.04, 0.16, 0.03]} color={graphite} rough={0.4} />
      <Arc r={0.3} h={0.15} span={0.95} y={1.41} z={0.31} color="#2F3136" />
      {/* T-arms */}
      {[-1, 1].map((s) => (
        <group key={s}>
          <Box at={[0.31 * s, 0.6, 0.06]} size={[0.035, 0.22, 0.05]} color={graphite} rough={0.4} />
          <RoundedBox args={[0.085, 0.035, 0.28]} radius={0.015} position={[0.31 * s, 0.725, 0]} castShadow>
            <meshStandardMaterial color="#2F3136" roughness={0.7} />
          </RoundedBox>
        </group>
      ))}
    </group>
  );
}

type ScreenKind = Parameters<typeof screenTexture>[0];

/** A monitor standing on the desk surface (local y = 0), facing +z. `arm` mounts it on a pole instead of a foot. */
function Monitor({ at, yaw, kind, accent, w = 0.58, h = 0.36, arm = false }: { at: V3; yaw: number; kind: ScreenKind; accent?: string; w?: number; h?: number; arm?: boolean }) {
  const cy = (arm ? 0.2 : 0.14) + h / 2;
  return (
    <group position={at} rotation={[0, yaw, 0]}>
      {arm ? (
        <>
          <mesh position={[0, cy / 2, -0.09]} castShadow>
            <cylinderGeometry args={[0.018, 0.018, cy, 10]} />
            <meshStandardMaterial color="#1F2023" roughness={0.3} metalness={0.7} />
          </mesh>
          <Box at={[0, cy, -0.05]} size={[0.05, 0.05, 0.08]} color="#1F2023" rough={0.3} metal={0.7} />
          <Box at={[0, 0.012, -0.09]} size={[0.09, 0.024, 0.09]} color="#1F2023" rough={0.3} metal={0.7} />
        </>
      ) : (
        <>
          <mesh position={[0, 0.008, -0.02]} castShadow>
            <cylinderGeometry args={[0.1, 0.11, 0.015, 20]} />
            <meshStandardMaterial color="#D9D6D0" roughness={0.3} metalness={0.6} />
          </mesh>
          <Box at={[0, 0.09, -0.03]} size={[0.035, 0.18, 0.02]} color="#D9D6D0" rough={0.3} metal={0.6} />
        </>
      )}
      <RoundedBox args={[w, h, 0.028]} radius={0.012} smoothness={3} position={[0, cy, 0]} castShadow>
        <meshStandardMaterial color="#17181B" roughness={0.35} />
      </RoundedBox>
      <mesh position={[0, cy, 0.0155]}>
        <planeGeometry args={[w - 0.035, h - 0.035]} />
        <meshBasicMaterial map={screenTexture(kind, accent)} toneMapped={false} />
      </mesh>
    </group>
  );
}

/** Laptop on a small stand, on the desk surface, facing +z. */
function Laptop({ at, yaw, kind, accent }: { at: V3; yaw: number; kind: ScreenKind; accent?: string }) {
  return (
    <group position={at} rotation={[0, yaw, 0]}>
      <Box at={[0, 0.04, -0.04]} size={[0.24, 0.08, 0.03]} color="#C9CCD1" rough={0.3} metal={0.7} />
      <group position={[0, 0.075, 0]} rotation={[0.16, 0, 0]}>
        <RoundedBox args={[0.34, 0.014, 0.23]} radius={0.006} castShadow>
          <meshStandardMaterial color="#C9CCD1" roughness={0.35} metalness={0.6} />
        </RoundedBox>
        <group position={[0, 0.007, -0.115]} rotation={[-0.35, 0, 0]}>
          <RoundedBox args={[0.34, 0.22, 0.01]} radius={0.005} position={[0, 0.11, 0]} castShadow>
            <meshStandardMaterial color="#C9CCD1" roughness={0.35} metalness={0.6} />
          </RoundedBox>
          <mesh position={[0, 0.11, 0.006]}>
            <planeGeometry args={[0.32, 0.2]} />
            <meshBasicMaterial map={screenTexture(kind, accent)} toneMapped={false} />
          </mesh>
        </group>
      </group>
    </group>
  );
}

function DeskLamp({ at }: { at: V3 }) {
  return (
    <group position={at}>
      <mesh position={[0, 0.01, 0]} castShadow>
        <cylinderGeometry args={[0.07, 0.075, 0.02, 18]} />
        <meshStandardMaterial color="#E3A72F" roughness={0.4} />
      </mesh>
      <Box at={[0, 0.17, -0.03]} size={[0.014, 0.32, 0.014]} color="#E3A72F" rough={0.4} rot={[-0.2, 0, 0]} />
      <Box at={[0, 0.36, 0.03]} size={[0.014, 0.26, 0.014]} color="#E3A72F" rough={0.4} rot={[0.9, 0, 0]} />
      <mesh position={[0, 0.42, 0.14]} rotation={[0.5, 0, 0]} castShadow>
        <coneGeometry args={[0.065, 0.1, 18, 1, true]} />
        <meshStandardMaterial color="#E3A72F" roughness={0.4} side={DoubleSide} />
      </mesh>
      <mesh position={[0, 0.4, 0.15]}>
        <sphereGeometry args={[0.022, 10, 8]} />
        <meshBasicMaterial color="#FFE9C4" toneMapped={false} />
      </mesh>
      <pointLight position={[0, 0.36, 0.17]} color="#FFDFA8" intensity={0.6} distance={1.4} decay={2} />
    </group>
  );
}

const STATION = [
  { chair: '#E07B39', mat: '#2E3138', mug: '#FFFFFF' },
  { chair: '#3F8F5F', mat: '#55654F', mug: '#E07B39' },
  { chair: '#2F5FC4', mat: '#6B4636', mug: '#2F5FC4' },
  { chair: '#E3A72F', mat: '#39456B', mug: '#F4C7C3' },
] as const;

/**
 * One seat at the shared desk, each with its own setup (`variant` 0–3).
 * Local frame: desk centre line at z = 0, the sitter at z = +1.25 facing -z. `flip` turns it to the far side.
 * One screen always shows the agent's status; the other shows code.
 */
export function Workstation({ x, flip, variant, pose, accent, children }: { x: number; flip: boolean; variant: number; pose: Pose | null; accent: string; children?: ReactNode }) {
  const active = pose !== null && pose !== 'idle';
  const status: ScreenKind = active ? (pose as Exclude<Pose, 'idle'>) : 'off';
  const code: ScreenKind = active ? 'code' : 'off';
  const st = STATION[variant % STATION.length]!;
  const top = 0.78;
  return (
    <group position={[x, 0, 0]} rotation={[0, flip ? Math.PI : 0, 0]}>
      {variant % 4 === 0 && (
        <>
          <Monitor at={[-0.31, top, 0.32]} yaw={0.2} kind={code} arm />
          <Monitor at={[0.31, top, 0.32]} yaw={-0.2} kind={status} accent={accent} arm />
          <DeskLamp at={[-0.82, top, 0.4]} />
        </>
      )}
      {variant % 4 === 1 && (
        <>
          <Monitor at={[0.12, top, 0.3]} yaw={0} kind={status} accent={accent} w={0.98} h={0.38} />
          <Laptop at={[-0.7, top, 0.52]} yaw={0.45} kind={code} />
          <mesh position={[0.82, top + 0.11, 0.42]} castShadow>
            <cylinderGeometry args={[0.035, 0.035, 0.22, 14]} />
            <meshStandardMaterial color="#7DB7C9" roughness={0.2} metalness={0.3} />
          </mesh>
        </>
      )}
      {variant % 4 === 2 && (
        <>
          <Monitor at={[-0.2, top, 0.3]} yaw={0.12} kind={status} accent={accent} w={0.62} h={0.38} />
          <Monitor at={[0.42, top, 0.34]} yaw={-0.32} kind={code} w={0.34} h={0.56} arm />
          <Plant at={[-0.8, top, 0.42]} scale={0.26} />
        </>
      )}
      {variant % 4 === 3 && (
        <>
          <Monitor at={[0.22, top, 0.3]} yaw={-0.08} kind={status} accent={accent} w={0.68} h={0.42} arm />
          <Laptop at={[-0.52, top, 0.46]} yaw={0.3} kind={code} />
          {['#C2552D', '#E8E2D4', '#3A4F7A'].map((c, i) => (
            <Box key={c} at={[0.84, top + 0.02 + i * 0.035, 0.45]} size={[0.24 - i * 0.02, 0.033, 0.17]} color={c} rot={[0, 0.2 * i, 0]} />
          ))}
        </>
      )}
      {active && <pointLight position={[0, 1.15, 0.55]} color={accent} intensity={0.5} distance={1.6} decay={2} />}
      {/* felt desk mat, keyboard, mouse, mug */}
      <RoundedBox args={[0.82, 0.006, 0.34]} radius={0.003} position={[0.04, top + 0.003, 0.72]} receiveShadow>
        <meshStandardMaterial color={st.mat} roughness={1} />
      </RoundedBox>
      <RoundedBox args={[0.42, 0.018, 0.14]} radius={0.006} position={[0, top + 0.016, 0.7]} castShadow>
        <meshStandardMaterial color={variant % 2 ? '#2B2D31' : '#ECECEA'} roughness={0.5} />
      </RoundedBox>
      <RoundedBox args={[0.06, 0.025, 0.1]} radius={0.012} position={[0.33, top + 0.018, 0.72]} castShadow>
        <meshStandardMaterial color={variant % 2 ? '#2B2D31' : '#ECECEA'} roughness={0.4} />
      </RoundedBox>
      <mesh position={[-0.52, top + 0.05, 0.76]} castShadow>
        <cylinderGeometry args={[0.04, 0.035, 0.09, 16]} />
        <meshStandardMaterial color={st.mug} roughness={0.3} />
      </mesh>
      <group position={[0, 0, 1.25]}>
        <Chair accent={st.chair} />
        {children}
      </group>
    </group>
  );
}

const FELT = ['#8FA58B', '#C98263', '#D9B25A', '#7C8FA8'];

/** Seat spacing along the row, in metres. */
export const SEAT_GAP = 2.2;

/**
 * One long bench for four, everyone side by side facing the window.
 * Origin: middle of the row on the floor. Shares the Workstation frame: back edge near z = 0, sitters at z = +1.25.
 */
export function RowDesk() {
  const wood = woodTexture();
  const white = '#F1EEE8';
  const len = SEAT_GAP * 4;
  const seats = [-1.5, -0.5, 0.5, 1.5].map((k) => k * SEAT_GAP);
  return (
    <group>
      <RoundedBox args={[len, 0.05, 0.94]} radius={0.02} smoothness={3} position={[0, 0.755, 0.53]} castShadow receiveShadow>
        <meshStandardMaterial map={wood} roughness={0.5} />
      </RoundedBox>
      <Box at={[0, 0.715, 0.53]} size={[len - 0.2, 0.03, 0.8]} color={white} rough={0.5} />
      <Box at={[0, 0.6, 0.2]} size={[len - 0.6, 0.02, 0.22]} color="#C9CCD1" rough={0.4} metal={0.5} />
      {/* loop legs at both ends */}
      {[-len / 2 + 0.08, len / 2 - 0.08].map((x) => (
        <group key={x} position={[x, 0, 0.53]}>
          {[-0.38, 0.38].map((z) => (
            <RoundedBox key={z} args={[0.07, 0.7, 0.07]} radius={0.02} position={[0, 0.35, z]} castShadow>
              <meshStandardMaterial color={white} roughness={0.4} />
            </RoundedBox>
          ))}
          <RoundedBox args={[0.07, 0.05, 0.83]} radius={0.02} position={[0, 0.025, 0]} castShadow>
            <meshStandardMaterial color={white} roughness={0.4} />
          </RoundedBox>
        </group>
      ))}
      {/* drawer pedestals between neighbours (alternating finishes), with a PC tower beside each */}
      {[-1, 0, 1].map((k) => (
        <group key={k} position={[k * SEAT_GAP, 0, 0.5]}>
          <RoundedBox args={[0.46, 0.64, 0.6]} radius={0.02} position={[0, 0.36, 0]} castShadow receiveShadow>
            <meshStandardMaterial color={k === 0 ? WALNUT : white} roughness={0.6} />
          </RoundedBox>
          {[0.56, 0.38, 0.2].map((y) => (
            <Box key={y} at={[0, y, 0.305]} size={[0.14, 0.018, 0.012]} color={k === 0 ? '#E9E2D4' : '#B98A57'} shadow={false} />
          ))}
          {[-0.42, 0.42].map((x) => (
            <group key={x}>
              <RoundedBox args={[0.2, 0.44, 0.45]} radius={0.015} position={[x, 0.24, -0.02]} castShadow>
                <meshStandardMaterial color="#232428" roughness={0.4} />
              </RoundedBox>
              <Box at={[x, 0.3, 0.21]} size={[0.16, 0.01, 0.006]} color="#7DCFFF" shadow={false} />
            </group>
          ))}
        </group>
      ))}
      {/* a felt privacy screen per seat, each in its own colour, on a white rail */}
      <RoundedBox args={[len - 0.1, 0.06, 0.1]} radius={0.02} position={[0, 0.81, 0.12]} castShadow>
        <meshStandardMaterial color={white} roughness={0.45} />
      </RoundedBox>
      {seats.map((x, i) => (
        <RoundedBox key={x} args={[SEAT_GAP - 0.5, 0.4, 0.035]} radius={0.016} position={[x, 1.04, 0.12]} castShadow>
          <meshStandardMaterial color={FELT[i]!} roughness={1} />
        </RoundedBox>
      ))}
      {[-1, 0, 1].map((k) => (
        <group key={k} position={[k * SEAT_GAP, 0.84, 0.14]}>
          <RoundedBox args={[0.42, 0.14, 0.18]} radius={0.02} position={[0, 0.07, 0]} castShadow>
            <meshStandardMaterial color={WALNUT} roughness={0.6} />
          </RoundedBox>
          {[-0.13, -0.03, 0.08, 0.15].map((dx, j) => (
            <mesh key={dx} position={[dx, 0.2 + (j % 2) * 0.05, j % 2 ? 0.02 : -0.02]} castShadow>
              <icosahedronGeometry args={[0.08 + (j % 2) * 0.02, 1]} />
              <meshStandardMaterial color={j % 2 ? '#4C9C6B' : '#2F7A4F'} roughness={0.9} flatShading />
            </mesh>
          ))}
        </group>
      ))}
      {/* a dome pendant above every seat */}
      {seats.map((x) => (
        <group key={x} position={[x, 2.25, 0.75]}>
          <Box at={[0, 0.6, 0]} size={[0.012, 0.95, 0.012]} color="#201D1B" shadow={false} />
          <mesh castShadow>
            <sphereGeometry args={[0.2, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
            <meshStandardMaterial color="#B98A3E" roughness={0.35} metalness={0.6} side={DoubleSide} />
          </mesh>
          <mesh position={[0, 0.02, 0]}>
            <sphereGeometry args={[0.07, 14, 10]} />
            <meshBasicMaterial color="#FFE9C4" toneMapped={false} />
          </mesh>
          <pointLight position={[0, -0.15, 0]} color="#FFDFB0" intensity={4} distance={4} decay={2} />
        </group>
      ))}
      {/* rug that ties the work zone together */}
      <mesh position={[0, 0.007, 1.0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[len + 0.7, 3.3]} />
        <meshStandardMaterial color="#8E9BA8" roughness={1} />
      </mesh>
      <mesh position={[0, 0.009, 1.0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[len + 0.3, 2.9]} />
        <meshStandardMaterial color="#A3AFBA" roughness={1} />
      </mesh>
    </group>
  );
}

function Armchair({ at, rot, color }: { at: V3; rot: number; color: string }) {
  return (
    <group position={at} rotation={[0, rot, 0]}>
      <RoundedBox args={[0.8, 0.3, 0.78]} radius={0.09} smoothness={4} position={[0, 0.3, 0]} castShadow receiveShadow>
        <meshStandardMaterial color={color} roughness={0.95} />
      </RoundedBox>
      <RoundedBox args={[0.8, 0.55, 0.22]} radius={0.09} smoothness={4} position={[0, 0.62, 0.3]} castShadow>
        <meshStandardMaterial color={color} roughness={0.95} />
      </RoundedBox>
      {[-0.34, 0.34].map((x) => (
        <RoundedBox key={x} args={[0.16, 0.34, 0.7]} radius={0.07} smoothness={4} position={[x, 0.5, 0.02]} castShadow>
          <meshStandardMaterial color={color} roughness={0.95} />
        </RoundedBox>
      ))}
      {[-0.3, 0.3].map((x) =>
        [-0.28, 0.28].map((z) => <Box key={`${x}${z}`} at={[x, 0.08, z]} size={[0.05, 0.16, 0.05]} color={WALNUT} />),
      )}
    </group>
  );
}

/** Small meeting corner: round rug, coffee table, two armchairs and a floor lamp. */
export function MeetingNook({ at }: { at: V3 }) {
  return (
    <group position={at}>
      <mesh position={[0, 0.008, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[1.7, 48]} />
        <meshStandardMaterial color="#9DB39A" roughness={1} />
      </mesh>
      <mesh position={[0, 0.4, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.48, 0.48, 0.04, 36]} />
        <meshStandardMaterial map={woodTexture()} roughness={0.5} />
      </mesh>
      {[0, 1, 2].map((i) => (
        <Box key={i} at={[Math.cos(i * 2.1) * 0.3, 0.2, Math.sin(i * 2.1) * 0.3]} size={[0.04, 0.4, 0.04]} color={DARK} rot={[0, 0, 0]} />
      ))}
      <Box at={[0.1, 0.44, 0.05]} size={[0.26, 0.03, 0.19]} color="#3A4F7A" rot={[0, 0.4, 0]} />
      <mesh position={[-0.18, 0.47, -0.1]} castShadow>
        <cylinderGeometry args={[0.04, 0.035, 0.09, 14]} />
        <meshStandardMaterial color="#FFFFFF" roughness={0.3} />
      </mesh>
      <Armchair at={[-1.0, 0, 0.1]} rot={-Math.PI / 2 - 0.2} color="#D9B25A" />
      <Armchair at={[0.25, 0, 1.05]} rot={0.25} color="#3E5C8A" />
      {/* floor lamp */}
      <group position={[-1.1, 0, -1.05]}>
        <mesh position={[0, 0.015, 0]} castShadow>
          <cylinderGeometry args={[0.16, 0.17, 0.03, 20]} />
          <meshStandardMaterial color={DARK} roughness={0.4} />
        </mesh>
        <Box at={[0, 0.8, 0]} size={[0.02, 1.6, 0.02]} color={DARK} />
        <mesh position={[0, 1.65, 0]} castShadow>
          <cylinderGeometry args={[0.16, 0.22, 0.3, 24, 1, true]} />
          <meshStandardMaterial color="#F4E9D2" emissive="#FFD9A0" emissiveIntensity={0.6} roughness={0.9} side={DoubleSide} />
        </mesh>
        <pointLight position={[0, 1.55, 0]} color="#FFD9A0" intensity={3} distance={4} decay={2} />
      </group>
    </group>
  );
}

function Plant({ at, scale = 1 }: { at: V3; scale?: number }) {
  return (
    <group position={at} scale={scale}>
      <mesh position={[0, 0.25, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.24, 0.18, 0.5, 20]} />
        <meshStandardMaterial color="#D8D2C6" roughness={0.7} />
      </mesh>
      {(
        [
          [0, 0.95, 0, 0.36],
          [0.2, 0.75, 0.1, 0.26],
          [-0.2, 0.8, -0.05, 0.28],
          [0.05, 1.25, -0.1, 0.26],
          [-0.1, 1.1, 0.18, 0.22],
        ] as Array<[number, number, number, number]>
      ).map(([x, y, z, r], i) => (
        <mesh key={i} position={[x, y, z]} castShadow>
          <icosahedronGeometry args={[r, 1]} />
          <meshStandardMaterial color={i % 2 ? '#3F8F5F' : '#2F7A4F'} roughness={0.9} flatShading />
        </mesh>
      ))}
    </group>
  );
}

/** Glass-door cabinet with warm lit shelves, standing against the back wall. */
function Cabinet({ at }: { at: V3 }) {
  const books = ['#C2552D', '#E8E2D4', '#2F5FC4', '#D9A040', '#3F8F5F', '#E8E2D4', '#7A4FBF'];
  return (
    <group position={at}>
      <Box at={[0, 0.5, 0]} size={[2.5, 1.0, 0.5]} color={WALNUT} rough={0.6} />
      {[-0.63, 0, 0.63].map((x) => (
        <Box key={x} at={[x, 0.5, 0.255]} size={[0.012, 0.9, 0.01]} color="#5E4631" shadow={false} />
      ))}
      <Box at={[0, 2.0, -0.05]} size={[2.5, 2.0, 0.4]} color={DARK} rough={0.6} />
      <mesh position={[0, 2.0, 0.152]}>
        <planeGeometry args={[2.36, 1.86]} />
        <meshStandardMaterial color="#6B5138" emissive="#FFB766" emissiveIntensity={0.35} roughness={0.8} />
      </mesh>
      {[1.5, 2.1, 2.7].map((y, row) => (
        <group key={y}>
          <Box at={[0, y - 0.02, 0.2]} size={[2.36, 0.03, 0.1]} color={DARK} shadow={false} />
          {books.map((c, i) => (
            <Box key={i} at={[-1.0 + i * 0.075 + row * 0.5, y + 0.14, 0.2]} size={[0.06, 0.28 - (i % 3) * 0.03, 0.08]} color={books[(i + row * 2) % books.length]!} shadow={false} />
          ))}
          <mesh position={[0.7 - row * 0.9, y + 0.1, 0.2]}>
            <sphereGeometry args={[0.09, 14, 10]} />
            <meshStandardMaterial color="#E8E2D4" roughness={0.4} />
          </mesh>
        </group>
      ))}
      <mesh position={[0, 2.0, 0.26]}>
        <planeGeometry args={[2.4, 1.9]} />
        <meshStandardMaterial color="#BFD3E0" transparent opacity={0.12} roughness={0.05} metalness={0.4} />
      </mesh>
      {[-1.2, -0.4, 0.4, 1.2].map((x) => (
        <Box key={x} at={[x, 2.0, 0.265]} size={[0.035, 1.95, 0.02]} color="#17181B" shadow={false} />
      ))}
      <pointLight position={[0, 2.1, 0.9]} color="#FFC58A" intensity={2.5} distance={4} decay={2} />
    </group>
  );
}

/** Kitchenette along the back wall, plus a standing table, sofa and rug. */
function Pantry() {
  return (
    <group>
      <mesh position={[5.0, 0.004, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[4, 9]} />
        <meshStandardMaterial map={tileTexture()} roughness={0.5} />
      </mesh>
      {/* counter */}
      <group position={[4.5, 0, -4.15]}>
        <Box at={[0, 0.44, 0]} size={[2.4, 0.88, 0.62]} color="#55606E" rough={0.6} />
        {[-0.6, 0, 0.6].map((x) => (
          <Box key={x} at={[x, 0.46, 0.315]} size={[0.012, 0.8, 0.01]} color="#3C4550" shadow={false} />
        ))}
        <RoundedBox args={[2.46, 0.045, 0.66]} radius={0.012} position={[0, 0.905, 0.01]} castShadow receiveShadow>
          <meshStandardMaterial color="#F5F3EE" roughness={0.25} />
        </RoundedBox>
        <Box at={[0, 1.3, -0.3]} size={[2.4, 0.74, 0.02]} color="#E3EBEE" rough={0.3} shadow={false} />
        <Box at={[0, 2.05, -0.12]} size={[2.4, 0.7, 0.38]} color={CREAM} rough={0.6} />
        {[-0.6, 0, 0.6].map((x) => (
          <Box key={x} at={[x, 2.05, 0.075]} size={[0.012, 0.64, 0.01]} color="#C9C0AE" shadow={false} />
        ))}
        <mesh position={[0, 1.68, -0.05]}>
          <boxGeometry args={[2.3, 0.02, 0.2]} />
          <meshStandardMaterial color="#FFF2DC" emissive="#FFE2B0" emissiveIntensity={1.2} />
        </mesh>
        <pointLight position={[0, 1.55, 0.25]} color="#FFE2B0" intensity={1.6} distance={3} decay={2} />
        {/* coffee machine */}
        <RoundedBox args={[0.3, 0.38, 0.34]} radius={0.02} position={[-0.75, 1.12, -0.05]} castShadow>
          <meshStandardMaterial color="#1E1F22" roughness={0.35} metalness={0.3} />
        </RoundedBox>
        <Box at={[-0.75, 0.97, 0.14]} size={[0.24, 0.02, 0.1]} color="#8F8F8F" rough={0.3} metal={0.8} />
        <mesh position={[-0.66, 1.24, 0.125]}>
          <sphereGeometry args={[0.014, 8, 8]} />
          <meshBasicMaterial color="#FFB13B" toneMapped={false} />
        </mesh>
        <mesh position={[-0.75, 1.02, 0.14]} castShadow>
          <cylinderGeometry args={[0.035, 0.03, 0.07, 14]} />
          <meshStandardMaterial color="#FFFFFF" roughness={0.3} />
        </mesh>
        {/* kettle + mugs + fruit bowl */}
        <mesh position={[0.1, 1.04, -0.05]} castShadow>
          <cylinderGeometry args={[0.07, 0.09, 0.22, 18]} />
          <meshStandardMaterial color="#C9CCD1" roughness={0.2} metalness={0.9} />
        </mesh>
        {['#E07B39', '#2F5FC4', '#F5F3EE'].map((c, i) => (
          <mesh key={c} position={[0.45 + i * 0.13, 0.975, 0.02 + (i % 2) * 0.08]} castShadow>
            <cylinderGeometry args={[0.04, 0.035, 0.09, 14]} />
            <meshStandardMaterial color={c} roughness={0.3} />
          </mesh>
        ))}
        <mesh position={[0.95, 0.96, -0.05]} castShadow>
          <cylinderGeometry args={[0.13, 0.08, 0.07, 20]} />
          <meshStandardMaterial color="#B98A57" roughness={0.6} />
        </mesh>
        {[
          [0.91, '#E3A72F'],
          [0.99, '#D9482F'],
        ].map(([x, c]) => (
          <mesh key={c as string} position={[x as number, 1.02, -0.05]}>
            <sphereGeometry args={[0.05, 12, 10]} />
            <meshStandardMaterial color={c as string} roughness={0.5} />
          </mesh>
        ))}
      </group>
      {/* fridge */}
      <group position={[6.35, 0, -4.1]}>
        <RoundedBox args={[0.8, 1.95, 0.72]} radius={0.03} position={[0, 0.975, 0]} castShadow receiveShadow>
          <meshStandardMaterial color="#D5D8DC" roughness={0.3} metalness={0.5} />
        </RoundedBox>
        <Box at={[0, 1.25, 0.362]} size={[0.78, 0.01, 0.01]} color="#8D9299" shadow={false} />
        <Box at={[-0.3, 1.55, 0.38]} size={[0.03, 0.4, 0.03]} color="#6F747B" rough={0.3} metal={0.8} />
        <Box at={[-0.3, 0.85, 0.38]} size={[0.03, 0.5, 0.03]} color="#6F747B" rough={0.3} metal={0.8} />
      </group>
      {/* standing table */}
      <group position={[5.05, 0, 0.3]}>
        <mesh position={[0, 1.06, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[0.5, 0.5, 0.045, 36]} />
          <meshStandardMaterial map={woodTexture()} roughness={0.5} />
        </mesh>
        <mesh position={[0, 0.53, 0]} castShadow>
          <cylinderGeometry args={[0.035, 0.035, 1.04, 12]} />
          <meshStandardMaterial color={DARK} roughness={0.4} metalness={0.5} />
        </mesh>
        <mesh position={[0, 0.02, 0]} castShadow>
          <cylinderGeometry args={[0.3, 0.32, 0.03, 28]} />
          <meshStandardMaterial color={DARK} roughness={0.4} metalness={0.5} />
        </mesh>
        <mesh position={[0.15, 1.13, 0.1]} castShadow>
          <cylinderGeometry args={[0.04, 0.035, 0.09, 14]} />
          <meshStandardMaterial color="#FFFFFF" roughness={0.3} />
        </mesh>
        <Plant at={[-0.18, 1.08, -0.12]} scale={0.22} />
      </group>
      {/* sofa + rug */}
      <mesh position={[5.6, 0.008, 2.9]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[2.6, 2.4]} />
        <meshStandardMaterial color="#B9805A" roughness={1} />
      </mesh>
      <group position={[6.35, 0, 2.9]}>
        <RoundedBox args={[0.9, 0.36, 2.0]} radius={0.08} smoothness={4} position={[0, 0.27, 0]} castShadow receiveShadow>
          <meshStandardMaterial color="#2F7D6D" roughness={0.95} />
        </RoundedBox>
        <RoundedBox args={[0.26, 0.6, 2.0]} radius={0.09} smoothness={4} position={[0.33, 0.62, 0]} castShadow>
          <meshStandardMaterial color="#2A6F61" roughness={0.95} />
        </RoundedBox>
        {[-1, 1].map((s) => (
          <RoundedBox key={s} args={[0.9, 0.5, 0.24]} radius={0.09} smoothness={4} position={[0, 0.42, 0.95 * s]} castShadow>
            <meshStandardMaterial color="#2A6F61" roughness={0.95} />
          </RoundedBox>
        ))}
        <RoundedBox args={[0.14, 0.36, 0.36]} radius={0.06} smoothness={4} position={[0.14, 0.62, -0.5]} rotation={[0, 0, 0.3]} castShadow>
          <meshStandardMaterial color="#E9B949" roughness={0.9} />
        </RoundedBox>
        <RoundedBox args={[0.14, 0.34, 0.34]} radius={0.06} smoothness={4} position={[0.14, 0.62, 0.45]} rotation={[0, 0, 0.3]} castShadow>
          <meshStandardMaterial color="#E9E2D4" roughness={0.9} />
        </RoundedBox>
      </group>
      <Plant at={[6.45, 0, 4.2 - 0.25]} scale={0.85} />
    </group>
  );
}

/** Floor, walls, skyline window, cabinet, pantry and the meeting corner. */
export function Room() {
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[14, 9]} />
        <meshStandardMaterial map={carpetTexture()} roughness={1} />
      </mesh>
      <Box at={[0, -0.12, 0]} size={[14.3, 0.2, 9.3]} color="#8E8272" shadow={false} />
      {/* walls */}
      <Box at={[0, 1.7, -4.575]} size={[14.3, 3.4, 0.15]} color="#4A413A" rough={0.9} />
      <Box at={[-7.075, 1.7, 0]} size={[0.15, 3.4, 9]} color="#544A42" rough={0.9} />
      <Box at={[0, 0.06, -4.49]} size={[14, 0.12, 0.03]} color={DARK} shadow={false} />
      <Box at={[-6.99, 0.06, 0]} size={[0.03, 0.12, 9]} color={DARK} shadow={false} />

      {/* skyline window on the back wall */}
      <group position={[-3.45, 1.75, -4.49]}>
        <mesh>
          <planeGeometry args={[6.5, 2.5]} />
          <meshBasicMaterial map={cityTexture()} toneMapped={false} />
        </mesh>
        <Box at={[0, 1.27, 0.02]} size={[6.6, 0.07, 0.07]} color="#17181B" shadow={false} />
        <Box at={[0, -1.27, 0.03]} size={[6.6, 0.09, 0.12]} color="#17181B" shadow={false} />
        {[-3.27, -1.63, 0, 1.63, 3.27].map((x) => (
          <Box key={x} at={[x, 0, 0.02]} size={[0.07, 2.55, 0.07]} color="#17181B" shadow={false} />
        ))}
        <Box at={[0, -0.45, 0.02]} size={[6.5, 0.035, 0.04]} color="#17181B" shadow={false} />
        <pointLight position={[0, 0, 1]} color="#8FA6FF" intensity={3} distance={6} decay={2} />
      </group>

      {/* sprint board on the left wall */}
      <group position={[-6.99, 1.8, 0.4]} rotation={[0, Math.PI / 2, 0]}>
        <Box at={[0, 0, 0]} size={[2.6, 1.4, 0.04]} color="#F4F1EA" shadow={false} />
        {['#F6CB6E', '#B9D3EE', '#CDEBDF', '#F4C7C3', '#F6CB6E', '#B9D3EE', '#CDEBDF', '#F6CB6E'].map((c, i) => (
          <Box key={i} at={[-0.95 + (i % 4) * 0.62, 0.3 - Math.floor(i / 4) * 0.55, 0.025]} size={[0.36, 0.36, 0.01]} color={c} shadow={false} />
        ))}
      </group>

      <Cabinet at={[1.55, 0, -4.25]} />
      <Pantry />
      <MeetingNook at={[-3.6, 0, 2.5]} />
      <Plant at={[-6.4, 0, -3.9]} />
      <Plant at={[-0.3, 0, -4.0]} scale={0.8} />
    </group>
  );
}
