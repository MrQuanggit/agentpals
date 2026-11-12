import { RoundedBox } from '@react-three/drei';
import type { ReactNode } from 'react';
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

/** Mesh office chair on the floor at the origin; the sitter faces -z. */
export function Chair() {
  return (
    <group>
      {[0, 1, 2, 3, 4].map((i) => {
        const a = (i / 5) * Math.PI * 2;
        return (
          <group key={i} rotation={[0, a, 0]}>
            <Box at={[0.15, 0.07, 0]} size={[0.3, 0.03, 0.045]} color={METAL} rough={0.4} metal={0.5} />
            <mesh position={[0.3, 0.035, 0]} castShadow>
              <sphereGeometry args={[0.035, 10, 8]} />
              <meshStandardMaterial color="#1B1B1D" roughness={0.5} />
            </mesh>
          </group>
        );
      })}
      <mesh position={[0, 0.27, 0]} castShadow>
        <cylinderGeometry args={[0.028, 0.035, 0.38, 12]} />
        <meshStandardMaterial color="#6E6A66" roughness={0.3} metalness={0.7} />
      </mesh>
      <RoundedBox args={[0.5, 0.08, 0.5]} radius={0.035} smoothness={3} position={[0, 0.49, 0]} castShadow receiveShadow>
        <meshStandardMaterial color="#3B3835" roughness={0.95} />
      </RoundedBox>
      <group position={[0, 0.88, 0.27]} rotation={[0.12, 0, 0]}>
        <RoundedBox args={[0.47, 0.56, 0.045]} radius={0.02} smoothness={3} castShadow>
          <meshStandardMaterial color="#4A4541" roughness={1} transparent opacity={0.93} />
        </RoundedBox>
        <Box at={[0, -0.36, 0.02]} size={[0.07, 0.3, 0.03]} color={METAL} rough={0.4} metal={0.5} />
      </group>
      {[-1, 1].map((s) => (
        <group key={s}>
          <RoundedBox args={[0.055, 0.03, 0.3]} radius={0.012} position={[0.28 * s, 0.7, 0.04]} castShadow>
            <meshStandardMaterial color={METAL} roughness={0.5} />
          </RoundedBox>
          <Box at={[0.28 * s, 0.6, 0.12]} size={[0.03, 0.2, 0.04]} color={METAL} rough={0.4} metal={0.5} />
        </group>
      ))}
    </group>
  );
}

function Monitor({ at, yaw, kind, accent }: { at: V3; yaw: number; kind: Parameters<typeof screenTexture>[0]; accent?: string }) {
  return (
    <group position={at} rotation={[0, yaw, 0]}>
      <mesh position={[0, 0.01, -0.02]} castShadow>
        <cylinderGeometry args={[0.1, 0.11, 0.015, 20]} />
        <meshStandardMaterial color="#D9D6D0" roughness={0.3} metalness={0.6} />
      </mesh>
      <Box at={[0, 0.1, -0.03]} size={[0.035, 0.2, 0.02]} color="#D9D6D0" rough={0.3} metal={0.6} />
      <RoundedBox args={[0.58, 0.36, 0.028]} radius={0.012} smoothness={3} position={[0, 0.33, 0]} castShadow>
        <meshStandardMaterial color="#17181B" roughness={0.35} />
      </RoundedBox>
      <mesh position={[0, 0.335, 0.0155]}>
        <planeGeometry args={[0.545, 0.325]} />
        <meshBasicMaterial map={screenTexture(kind, accent)} toneMapped={false} />
      </mesh>
    </group>
  );
}

/**
 * One seat at the shared desk. Local frame: desk centre line at z = 0, the sitter at z = +1.25 facing -z.
 * `flip` turns the whole station around for the far side of the desk.
 */
export function Workstation({ x, flip, pose, accent, children }: { x: number; flip: boolean; pose: Pose | null; accent: string; children?: ReactNode }) {
  const active = pose !== null && pose !== 'idle';
  return (
    <group position={[x, 0, 0]} rotation={[0, flip ? Math.PI : 0, 0]}>
      <Monitor at={[-0.31, 0.78, 0.3]} yaw={0.2} kind={active ? 'code' : 'off'} />
      <Monitor at={[0.31, 0.78, 0.3]} yaw={-0.2} kind={active ? (pose as Exclude<Pose, 'idle'>) : 'off'} accent={accent} />
      {active && <pointLight position={[0, 1.1, 0.55]} color={accent} intensity={0.5} distance={1.6} decay={2} />}
      {/* keyboard, mouse, mug, notebook */}
      <RoundedBox args={[0.42, 0.018, 0.14]} radius={0.006} position={[0, 0.79, 0.7]} castShadow>
        <meshStandardMaterial color="#ECECEA" roughness={0.5} />
      </RoundedBox>
      <RoundedBox args={[0.06, 0.025, 0.1]} radius={0.012} position={[0.33, 0.792, 0.72]} castShadow>
        <meshStandardMaterial color="#ECECEA" roughness={0.4} />
      </RoundedBox>
      <mesh position={[-0.52, 0.83, 0.62]} castShadow>
        <cylinderGeometry args={[0.04, 0.035, 0.09, 16]} />
        <meshStandardMaterial color="#FFFFFF" roughness={0.3} />
      </mesh>
      <Box at={[0.6, 0.787, 0.6]} size={[0.2, 0.012, 0.27]} color="#F4F1EA" rot={[0, 0.25, 0]} />
      <Box at={[0.6, 0.796, 0.6]} size={[0.2, 0.006, 0.27]} color="#3A4F7A" rot={[0, 0.32, 0]} />
      <group position={[0, 0, 1.25]}>
        <Chair />
        {children}
      </group>
    </group>
  );
}

/** The big shared table (centre at the origin), like a bench desk for four. */
export function SharedDesk() {
  const wood = woodTexture();
  return (
    <group>
      <RoundedBox args={[5.5, 0.06, 1.95]} radius={0.015} smoothness={3} position={[0, 0.75, 0]} castShadow receiveShadow>
        <meshStandardMaterial map={wood} roughness={0.55} />
      </RoundedBox>
      <Box at={[0, 0.7, 0]} size={[5.2, 0.05, 0.12]} color={DARK} rough={0.5} />
      {[-2.55, 2.55].map((x) => (
        <group key={x} position={[x, 0, 0]}>
          <Box at={[0, 0.69, 0]} size={[0.08, 0.06, 1.7]} color={DARK} rough={0.5} />
          {[-1, 1].map((s) => (
            <Box key={s} at={[0, 0.35, 0.7 * s]} size={[0.07, 0.74, 0.09]} color={DARK} rough={0.5} rot={[0.16 * s, 0, 0]} />
          ))}
        </group>
      ))}
      {/* drawer pedestals + PC towers between the seats */}
      {[-1, 1].map((s) => (
        <group key={s} position={[0, 0, 0.55 * s]}>
          <RoundedBox args={[0.46, 0.66, 0.6]} radius={0.015} position={[0, 0.36, 0]} castShadow receiveShadow>
            <meshStandardMaterial color={CREAM} roughness={0.6} />
          </RoundedBox>
          {[0.56, 0.36].map((y) => (
            <Box key={y} at={[0, y, 0.305 * s]} size={[0.1, 0.02, 0.012]} color={DARK} shadow={false} />
          ))}
          {[-0.42, 0.42].map((x) => (
            <Box key={x} at={[x, 0.24, -0.05 * s]} size={[0.2, 0.44, 0.45]} color="#26272B" rough={0.4} />
          ))}
        </group>
      ))}
      {/* fabric dividers with a metal frame */}
      {[-1.4, 1.4].map((x) => (
        <group key={x} position={[x, 0, 0]}>
          <RoundedBox args={[1.05, 0.26, 0.035]} radius={0.015} position={[0, 0.96, 0]} castShadow>
            <meshStandardMaterial color="#B9B2A7" roughness={1} />
          </RoundedBox>
          {[-0.56, 0.56].map((dx) => (
            <Box key={dx} at={[dx, 0.9, 0]} size={[0.04, 0.26, 0.06]} color={DARK} rough={0.5} />
          ))}
        </group>
      ))}
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

/** Floor, walls, skyline window, pendant lamp, cabinet and pantry. Desk centre is passed in. */
export function Room({ desk }: { desk: V3 }) {
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

      {/* pendant lamp over the desk */}
      <group position={[desk[0], 2.35, desk[2]]}>
        <RoundedBox args={[4.3, 0.09, 0.3]} radius={0.03} castShadow>
          <meshStandardMaterial color="#201D1B" roughness={0.4} />
        </RoundedBox>
        <mesh position={[0, -0.05, 0]}>
          <boxGeometry args={[4.15, 0.02, 0.2]} />
          <meshBasicMaterial color="#FFE9C4" toneMapped={false} />
        </mesh>
        {[-1.8, 1.8].map((x) => (
          <Box key={x} at={[x, 0.55, 0]} size={[0.012, 1.1, 0.012]} color="#201D1B" shadow={false} />
        ))}
        {[-1.4, 1.4].map((x) => (
          <pointLight key={x} position={[x, -0.3, 0]} color="#FFDFB0" intensity={7} distance={5} decay={2} />
        ))}
      </group>

      <Cabinet at={[1.55, 0, -4.25]} />
      <Pantry />
      <Plant at={[-6.3, 0, 3.8]} />
    </group>
  );
}
