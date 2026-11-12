import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import { Quaternion, Vector3, type Group } from 'three';
import type { Look, Pose } from '@/lib/look';

type V3 = [number, number, number];
const UP = new Vector3(0, 1, 0);

/** A rounded limb (capsule) between two points. */
function Limb({ a, b, r, color }: { a: V3; b: V3; r: number; color: string }) {
  const { pos, quat, len } = useMemo(() => {
    const va = new Vector3(...a);
    const vb = new Vector3(...b);
    const dir = vb.clone().sub(va);
    const len = dir.length();
    return { pos: va.add(vb).multiplyScalar(0.5), quat: new Quaternion().setFromUnitVectors(UP, dir.normalize()), len };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [a.join(), b.join()]);
  return (
    <mesh position={pos} quaternion={quat} castShadow>
      <capsuleGeometry args={[r, len, 6, 14]} />
      <meshStandardMaterial color={color} roughness={0.85} />
    </mesh>
  );
}

function Hand({ at, skin }: { at: V3; skin: string }) {
  return (
    <mesh position={at} castShadow>
      <sphereGeometry args={[0.05, 16, 12]} />
      <meshStandardMaterial color={skin} roughness={0.7} />
    </mesh>
  );
}

/** Head at the origin, facing -z. */
function Head({ look }: { look: Look }) {
  const hair = <meshStandardMaterial color={look.hair} roughness={0.9} />;
  const dark = <meshStandardMaterial color="#22262E" roughness={0.5} />;
  return (
    <group>
      <mesh castShadow>
        <sphereGeometry args={[0.135, 28, 20]} />
        <meshStandardMaterial color={look.skin} roughness={0.7} />
      </mesh>
      {[-0.05, 0.05].map((x) => (
        <mesh key={x} position={[x, 0.012, -0.124]}>
          <sphereGeometry args={[0.014, 10, 8]} />
          {dark}
        </mesh>
      ))}
      {[-0.133, 0.133].map((x) => (
        <mesh key={x} position={[x, -0.005, 0]}>
          <sphereGeometry args={[0.028, 10, 8]} />
          <meshStandardMaterial color={look.skin} roughness={0.7} />
        </mesh>
      ))}

      {/* hair: a cap tilted back so the face stays visible */}
      <mesh rotation={[0.5, 0, 0]} castShadow>
        <sphereGeometry args={[0.145, 28, 18, 0, Math.PI * 2, 0, Math.PI * 0.56]} />
        {hair}
      </mesh>
      {look.hairStyle === 'long' && (
        <mesh position={[0, -0.1, 0.085]} scale={[1, 1.25, 0.6]} castShadow>
          <sphereGeometry args={[0.14, 20, 14]} />
          {hair}
        </mesh>
      )}
      {look.hairStyle === 'bun' && (
        <mesh position={[0, 0.14, 0.08]} castShadow>
          <sphereGeometry args={[0.062, 16, 12]} />
          {hair}
        </mesh>
      )}
      {look.hairStyle === 'curly' &&
        (
          [
            [-0.1, 0.08, 0.02],
            [0.1, 0.08, 0.02],
            [0, 0.13, -0.02],
            [-0.06, 0.11, 0.08],
            [0.06, 0.11, 0.08],
            [-0.1, 0, 0.09],
            [0.1, 0, 0.09],
            [0, 0.02, 0.13],
          ] as V3[]
        ).map((p, i) => (
          <mesh key={i} position={p} castShadow>
            <sphereGeometry args={[0.062, 12, 10]} />
            {hair}
          </mesh>
        ))}

      {look.accessory === 'headphones' && (
        <group>
          <mesh>
            <torusGeometry args={[0.15, 0.014, 8, 28, Math.PI]} />
            {dark}
          </mesh>
          {[-0.148, 0.148].map((x) => (
            <mesh key={x} position={[x, -0.01, 0]} rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.052, 0.052, 0.04, 18]} />
              <meshStandardMaterial color="#E07B39" roughness={0.5} />
            </mesh>
          ))}
        </group>
      )}
      {look.accessory === 'glasses' && (
        <group position={[0, 0.012, -0.13]}>
          {[-0.05, 0.05].map((x) => (
            <mesh key={x} position={[x, 0, 0]}>
              <torusGeometry args={[0.034, 0.006, 6, 20]} />
              {dark}
            </mesh>
          ))}
          <mesh>
            <boxGeometry args={[0.035, 0.006, 0.006]} />
            {dark}
          </mesh>
        </group>
      )}
    </group>
  );
}

function Hood({ y, look }: { y: number; look: Look }) {
  if (!look.hoodie) return null;
  return (
    <mesh position={[0, y, 0.035]} rotation={[Math.PI / 2 - 0.25, 0, 0]} castShadow>
      <torusGeometry args={[0.095, 0.05, 10, 22]} />
      <meshStandardMaterial color={look.shirt} roughness={0.9} />
    </mesh>
  );
}

function Shoes({ y, z, color }: { y: number; z: number; color: string }) {
  return (
    <>
      {[-0.105, 0.105].map((x) => (
        <mesh key={x} position={[x, y, z]} castShadow>
          <boxGeometry args={[0.105, 0.08, 0.25]} />
          <meshStandardMaterial color={color} roughness={0.6} />
        </mesh>
      ))}
    </>
  );
}

/** Sitting on a chair at the origin, facing -z (towards the monitors). */
export function SeatedPerson3D({ look, pose }: { look: Look; pose: Exclude<Pose, 'idle'> }) {
  const left = useRef<Group>(null);
  const right = useRef<Group>(null);
  const wave = useRef<Group>(null);
  const head = useRef<Group>(null);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    if (pose === 'typing') {
      if (left.current) left.current.position.y = Math.sin(t * 15) * 0.012;
      if (right.current) right.current.position.y = Math.sin(t * 15 + 1.7) * 0.012;
    }
    if (wave.current) wave.current.rotation.z = Math.sin(t * 6) * 0.22;
    if (head.current) head.current.rotation.y = pose === 'reading' ? Math.sin(t * 0.8) * 0.12 : pose === 'waiting' ? Math.sin(t * 1.5) * 0.25 : 0;
  });

  const { shirt, skin, pants } = look;
  const onDesk = (side: 1 | -1, ref?: React.Ref<Group>) => (
    <>
      <Limb a={[0.24 * side, 1.02, 0]} b={[0.27 * side, 0.82, -0.2]} r={0.06} color={shirt} />
      <group ref={ref}>
        <Limb a={[0.27 * side, 0.82, -0.2]} b={[0.14 * side, 0.83, -0.5]} r={0.052} color={shirt} />
        <Hand at={[0.13 * side, 0.835, -0.54]} skin={skin} />
      </group>
    </>
  );

  return (
    <group>
      {/* legs */}
      {[-1, 1].map((s) => (
        <group key={s}>
          <Limb a={[0.1 * s, 0.59, 0.02]} b={[0.105 * s, 0.59, -0.4]} r={0.078} color={pants} />
          <Limb a={[0.105 * s, 0.56, -0.42]} b={[0.105 * s, 0.13, -0.45]} r={0.062} color={pants} />
        </group>
      ))}
      <Shoes y={0.045} z={-0.5} color={look.shoes} />

      {/* body */}
      <Limb a={[0, 0.64, 0.04]} b={[0, 0.98, 0]} r={0.175} color={shirt} />
      <Limb a={[-0.17, 1.03, 0]} b={[0.17, 1.03, 0]} r={0.085} color={shirt} />
      <Limb a={[0, 1.08, 0]} b={[0, 1.2, -0.01]} r={0.05} color={skin} />
      <Hood y={1.1} look={look} />
      <group ref={head} position={[0, 1.31, -0.02]}>
        <Head look={look} />
      </group>

      {/* arms */}
      {pose === 'typing' && (
        <>
          {onDesk(-1, left)}
          {onDesk(1, right)}
        </>
      )}
      {pose === 'reading' && (
        <>
          {onDesk(-1)}
          <Limb a={[0.24, 1.02, 0]} b={[0.25, 0.84, -0.3]} r={0.06} color={shirt} />
          <Limb a={[0.25, 0.84, -0.3]} b={[0.09, 1.17, -0.16]} r={0.052} color={shirt} />
          <Hand at={[0.07, 1.2, -0.15]} skin={skin} />
        </>
      )}
      {pose === 'waiting' && (
        <>
          {onDesk(-1)}
          <group ref={wave} position={[0.24, 1.02, 0]}>
            <Limb a={[0, 0, 0]} b={[0.12, 0.25, 0]} r={0.06} color={shirt} />
            <Limb a={[0.12, 0.25, 0]} b={[0.08, 0.55, 0]} r={0.052} color={shirt} />
            <Hand at={[0.075, 0.6, 0]} skin={skin} />
          </group>
        </>
      )}
    </group>
  );
}

/** One straight arm hanging from the shoulder; the group pivots there so it can swing. */
function HangingArm({ side, look, armRef }: { side: 1 | -1; look: Look; armRef?: React.Ref<Group> }) {
  return (
    <group ref={armRef} position={[0.25 * side, 1.4, 0]}>
      <Limb a={[0, 0, 0]} b={[0.03 * side, -0.26, 0.02]} r={0.06} color={look.shirt} />
      <Limb a={[0.03 * side, -0.26, 0.02]} b={[0.02 * side, -0.48, -0.03]} r={0.052} color={look.shirt} />
      <Hand at={[0.02 * side, -0.52, -0.03]} skin={look.skin} />
    </group>
  );
}

/**
 * Upright figure, feet at the origin, facing -z.
 * Standing still it holds a steaming mug; with `walking` the legs and arms swing.
 */
export function StandingPerson3D({ look, walking = false }: { look: Look; walking?: boolean }) {
  const body = useRef<Group>(null);
  const steam = useRef<Group>(null);
  const legL = useRef<Group>(null);
  const legR = useRef<Group>(null);
  const armL = useRef<Group>(null);
  const armR = useRef<Group>(null);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    const swing = walking ? Math.sin(t * 9) : 0;
    if (legL.current) legL.current.rotation.x = swing * 0.55;
    if (legR.current) legR.current.rotation.x = -swing * 0.55;
    if (armL.current) armL.current.rotation.x = -swing * 0.45;
    if (armR.current) armR.current.rotation.x = swing * 0.45;
    if (body.current) {
      body.current.rotation.z = walking ? 0 : Math.sin(t * 0.9) * 0.015;
      body.current.position.y = walking ? Math.abs(Math.cos(t * 9)) * 0.025 : 0;
    }
    if (steam.current) {
      steam.current.position.y = (t * 0.12) % 0.14;
      steam.current.scale.setScalar(1 - ((t * 0.12) % 0.14) * 4);
    }
  });
  const { shirt, skin, pants } = look;
  return (
    <group ref={body}>
      {([-1, 1] as const).map((s) => (
        <group key={s} ref={s < 0 ? legL : legR} position={[0.085 * s, 0.9, 0]}>
          <Limb a={[0, 0, 0]} b={[0.005 * s, -0.78, 0]} r={0.072} color={pants} />
          <mesh position={[0.02 * s, -0.855, -0.04]} castShadow>
            <boxGeometry args={[0.105, 0.08, 0.25]} />
            <meshStandardMaterial color={look.shoes} roughness={0.6} />
          </mesh>
        </group>
      ))}
      <Limb a={[0, 0.98, 0]} b={[0, 1.36, 0]} r={0.175} color={shirt} />
      <Limb a={[-0.17, 1.41, 0]} b={[0.17, 1.41, 0]} r={0.085} color={shirt} />
      <Limb a={[0, 1.46, 0]} b={[0, 1.58, 0]} r={0.05} color={skin} />
      <Hood y={1.48} look={look} />
      <group position={[0, 1.69, 0]}>
        <Head look={look} />
      </group>
      <HangingArm side={-1} look={look} armRef={armL} />
      {walking ? (
        <HangingArm side={1} look={look} armRef={armR} />
      ) : (
        <>
          {/* arm with mug */}
          <Limb a={[0.25, 1.4, 0]} b={[0.28, 1.15, -0.05]} r={0.06} color={shirt} />
          <Limb a={[0.28, 1.15, -0.05]} b={[0.15, 1.2, -0.27]} r={0.052} color={shirt} />
          <Hand at={[0.14, 1.21, -0.3]} skin={skin} />
          <mesh position={[0.13, 1.27, -0.33]} castShadow>
            <cylinderGeometry args={[0.042, 0.036, 0.095, 18]} />
            <meshStandardMaterial color="#FFFFFF" roughness={0.3} />
          </mesh>
          <group position={[0.13, 1.34, -0.33]}>
            <group ref={steam}>
              <mesh>
                <sphereGeometry args={[0.022, 10, 8]} />
                <meshStandardMaterial color="#FFFFFF" transparent opacity={0.45} />
              </mesh>
            </group>
          </group>
        </>
      )}
    </group>
  );
}
