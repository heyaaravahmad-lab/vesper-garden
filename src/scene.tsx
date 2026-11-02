import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, type ThreeEvent } from "@react-three/fiber";
import { ContactShadows, Float } from "@react-three/drei";
import * as T from "three";
import type { Mood, Plant } from "./store";
const rand = (n: number) => {
  const v = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return v - Math.floor(v);
};
const palette = {
  twilight: {
    sky: "#172d35",
    ground: "#35564b",
    light: "#ffe0b2",
    ambient: "#b2b8db",
    water: "#406e73",
    fog: "#152d32",
  },
  dawn: {
    sky: "#738f89",
    ground: "#557356",
    light: "#fff0c5",
    ambient: "#e3e8d9",
    water: "#8eb8ae",
    fog: "#8bada3",
  },
  rain: {
    sky: "#273a43",
    ground: "#365b51",
    light: "#bfdae0",
    ambient: "#b0c4d4",
    water: "#527d83",
    fog: "#2a4147",
  },
  moonlight: {
    sky: "#101f36",
    ground: "#294d49",
    light: "#b3c6ff",
    ambient: "#929bc8",
    water: "#365773",
    fog: "#152638",
  },
};
let reduced = false;
function Wind({
  children,
  seed = 1,
  amount = 0.035,
}: {
  children: React.ReactNode;
  seed?: number;
  amount?: number;
}) {
  const ref = useRef<T.Group>(null);
  useFrame(({ clock }) => {
    if (ref.current && !reduced) {
      ref.current.rotation.z =
        Math.sin(clock.elapsedTime * 0.7 + seed) * amount;
      ref.current.rotation.x =
        Math.cos(clock.elapsedTime * 0.6 + seed) * amount * 0.5;
    }
  });
  return <group ref={ref}>{children}</group>;
}
function Branch({
  from,
  to,
  r = 0.05,
  color = "#796e52",
}: {
  from: [number, number, number];
  to: [number, number, number];
  r?: number;
  color?: string;
}) {
  const { mid, length, quaternion } = useMemo(() => {
    const a = new T.Vector3(...from),
      b = new T.Vector3(...to),
      dir = b.clone().sub(a);
    return {
      mid: a.add(b).multiplyScalar(0.5),
      length: dir.length(),
      quaternion: new T.Quaternion().setFromUnitVectors(
        new T.Vector3(0, 1, 0),
        dir.normalize(),
      ),
    };
  }, [...from, ...to]);
  return (
    <mesh position={mid} quaternion={quaternion} castShadow>
      <cylinderGeometry args={[r * 0.5, r, length, 7]} />
      <meshStandardMaterial color={color} roughness={0.95} />
    </mesh>
  );
}
function Leaf({
  position,
  rotation = [0, 0, 0],
  scale = 1,
  color = "#8aaf82",
}: {
  position: [number, number, number];
  rotation?: [number, number, number];
  scale?: number;
  color?: string;
}) {
  return (
    <mesh
      position={position}
      rotation={rotation}
      scale={[scale * 0.12, scale * 0.32, scale * 0.045]}
      castShadow
    >
      <sphereGeometry args={[1, 8, 6]} />
      <meshStandardMaterial color={color} roughness={0.8} />
    </mesh>
  );
}
function Flower({
  height = 0.8,
  color = "#e7abc4",
  seed = 1,
  bloom = true,
}: {
  height?: number;
  color?: string;
  seed?: number;
  bloom?: boolean;
}) {
  return (
    <Wind seed={seed} amount={0.045}>
      <Branch
        from={[0, 0, 0]}
        to={[0.06, height, 0]}
        r={0.018}
        color="#6e9261"
      />
      <Leaf
        position={[-0.09, height * 0.4, 0]}
        rotation={[0, 0, 0.9]}
        scale={0.65}
      />
      <Leaf
        position={[0.13, height * 0.62, 0]}
        rotation={[0, 0, -0.8]}
        scale={0.6}
      />
      <group position={[0.06, height, 0]} rotation={[0.15, seed, 0]}>
        {bloom ? (
          Array.from({ length: 7 }, (_, i) => {
            const a = (i * Math.PI * 2) / 7;
            return (
              <mesh
                key={i}
                position={[Math.cos(a) * 0.12, 0.015, Math.sin(a) * 0.12]}
                rotation={[0.15, -a + Math.PI / 2, 0]}
                scale={[0.085, 0.035, 0.17]}
              >
                <sphereGeometry args={[1, 12, 8]} />
                <meshStandardMaterial
                  color={color}
                  roughness={0.65}
                  side={T.DoubleSide}
                />
              </mesh>
            );
          })
        ) : (
          <mesh scale={[0.07, 0.13, 0.07]}>
            <sphereGeometry args={[1, 12, 8]} />
            <meshStandardMaterial color={color} />
          </mesh>
        )}
        <mesh position={[0, 0.05, 0]}>
          <sphereGeometry args={[0.065, 12, 8]} />
          <meshStandardMaterial
            color="#f7d88d"
            emissive="#e8b354"
            emissiveIntensity={0.25}
          />
        </mesh>
      </group>
    </Wind>
  );
}
function Mushroom({
  scale = 1,
  color = "#cf9777",
  glow = false,
}: {
  scale?: number;
  color?: string;
  glow?: boolean;
}) {
  return (
    <group scale={scale}>
      <mesh position={[0, 0.2, 0]} castShadow>
        <cylinderGeometry args={[0.065, 0.095, 0.4, 10]} />
        <meshStandardMaterial color="#d4c7a8" />
      </mesh>
      <mesh position={[0, 0.4, 0]} scale={[1, 0.55, 1]} castShadow>
        <sphereGeometry
          args={[0.27, 24, 12, 0, Math.PI * 2, 0, Math.PI * 0.57]}
        />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={glow ? 0.5 : 0.08}
          roughness={0.6}
          side={T.DoubleSide}
        />
      </mesh>
      <mesh position={[0, 0.375, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.25, 24]} />
        <meshStandardMaterial
          color="#f1d9b2"
          emissive="#d5b889"
          emissiveIntensity={0.25}
          side={T.DoubleSide}
        />
      </mesh>
      {[0, 1, 2, 3, 4].map((i) => (
        <mesh
          key={i}
          position={[
            Math.cos(i * 2.4) * 0.16,
            0.49 + rand(i) * 0.03,
            Math.sin(i * 2.4) * 0.16,
          ]}
          scale={[0.035, 0.015, 0.025]}
        >
          <sphereGeometry args={[1, 7, 5]} />
          <meshStandardMaterial color="#f6e1bc" />
        </mesh>
      ))}
    </group>
  );
}
function Tree({
  size = 1,
  seed = 1,
  flowering = false,
  stage = 4,
}: {
  size?: number;
  seed?: number;
  flowering?: boolean;
  stage?: number;
}) {
  return (
    <group scale={size}>
      <Wind seed={seed} amount={0.009}>
        <Branch from={[0, 0, 0]} to={[-0.12, 2.7, 0]} r={0.19} />
        {Array.from({ length: 3 + Math.min(4, stage) * 2 }, (_, i) => {
          const a = i * 2.4 + seed,
            y = 1 + i * 0.18;
          const end: [number, number, number] = [
            Math.cos(a) * (1.05 + rand(i) * 0.4),
            y + 0.6,
            Math.sin(a) * 0.85,
          ];
          return (
            <group key={i}>
              <Branch from={[-0.08, y, 0]} to={end} r={0.07} />
              {[0, 1, 2].map((j) => (
                <mesh
                  key={j}
                  position={[
                    end[0] + (rand(i * 7 + j) - 0.5) * 0.7,
                    end[1] + j * 0.18,
                    end[2] + (rand(i * 3 + j) - 0.5) * 0.5,
                  ]}
                  scale={[0.55, 0.47, 0.5]}
                  castShadow
                >
                  <icosahedronGeometry args={[1, 2]} />
                  <meshStandardMaterial
                    color={
                      flowering
                        ? ["#d6b5c2", "#b695b1", "#f0c4c4"][j]
                        : ["#6b8871", "#82a084", "#506f61"][j]
                    }
                    roughness={0.95}
                  />
                </mesh>
              ))}
            </group>
          );
        })}
        <mesh position={[-0.1, 3, 0]} scale={[0.6, 0.5, 0.55]} castShadow>
          <icosahedronGeometry args={[1, 2]} />
          <meshStandardMaterial color={flowering ? "#e2bbcc" : "#89a287"} />
        </mesh>
      </Wind>
    </group>
  );
}
function Lantern({
  position,
  scale = 1,
}: {
  position: [number, number, number];
  scale?: number;
}) {
  return (
    <group position={position} scale={scale}>
      <mesh position={[0, 0.45, 0]} castShadow>
        <cylinderGeometry args={[0.025, 0.035, 0.9, 7]} />
        <meshStandardMaterial color="#535953" />
      </mesh>
      <group position={[0, 0.97, 0]}>
        <mesh>
          <boxGeometry args={[0.19, 0.29, 0.19]} />
          <meshStandardMaterial
            color="#ffd49a"
            emissive="#ffc46c"
            emissiveIntensity={2}
          />
        </mesh>
        <mesh position={[0, 0.19, 0]} rotation={[0, Math.PI / 4, 0]}>
          <coneGeometry args={[0.22, 0.14, 4]} />
          <meshStandardMaterial
            color="#495456"
            metalness={0.4}
            roughness={0.6}
          />
        </mesh>
        <mesh position={[0, -0.17, 0]}>
          <boxGeometry args={[0.25, 0.05, 0.25]} />
          <meshStandardMaterial color="#495456" />
        </mesh>
        {[-1, 1].flatMap((x) =>
          [-1, 1].map((z) => (
            <mesh key={`${x}${z}`} position={[x * 0.102, 0, z * 0.102]}>
              <boxGeometry args={[0.022, 0.31, 0.022]} />
              <meshStandardMaterial color="#495456" />
            </mesh>
          )),
        )}
        <Glow color="#ffc87b" size={1.5} />
      </group>
    </group>
  );
}
let glowTexture: T.CanvasTexture;
function Glow({
  color = "#ffe2a1",
  size = 1,
}: {
  color?: string;
  size?: number;
}) {
  const tex = useMemo(() => {
    if (!glowTexture) {
      const c = document.createElement("canvas");
      c.width = c.height = 64;
      const ctx = c.getContext("2d")!;
      const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
      g.addColorStop(0, "rgba(255,255,255,.65)");
      g.addColorStop(0.2, "rgba(255,255,255,.18)");
      g.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, 64, 64);
      glowTexture = new T.CanvasTexture(c);
    }
    return glowTexture;
  }, []);
  return (
    <sprite scale={[size, size, 1]}>
      <spriteMaterial
        map={tex}
        color={color}
        transparent
        depthWrite={false}
        blending={T.AdditiveBlending}
      />
    </sprite>
  );
}
function Grass() {
  const ref = useRef<T.InstancedMesh>(null);
  const dummy = useMemo(() => new T.Object3D(), []);
  useEffect(() => {
    const m = ref.current!;
    for (let i = 0; i < 1800; i++) {
      const angle = rand(i + 1) * Math.PI * 2,
        r = Math.sqrt(rand(i + 600));
      const x = Math.cos(angle) * r * 5.3,
        z = Math.sin(angle) * r * 3.45;
      const pond = ((x - 0.6) / 1.6) ** 2 + ((z - 0.1) / 1.2) ** 2 < 1;
      if (pond) {
        dummy.scale.setScalar(0);
      } else {
        const h = 0.08 + rand(i + 300) * 0.26;
        dummy.position.set(x, h * 0.5 + 0.07, z);
        dummy.rotation.set(
          (rand(i) - 0.5) * 0.5,
          rand(i + 19) * 6,
          (rand(i + 2) - 0.5) * 0.5,
        );
        dummy.scale.set(0.016 + rand(i + 44) * 0.02, h, 0.018);
      }
      dummy.updateMatrix();
      m.setMatrixAt(i, dummy.matrix);
      m.setColorAt(
        i,
        new T.Color(["#6d8e6c", "#9aa67b", "#547d65", "#a9b78d"][i % 4]),
      );
    }
    m.instanceMatrix.needsUpdate = true;
  }, [dummy]);
  return (
    <instancedMesh ref={ref} args={[undefined, undefined, 1800]}>
      <coneGeometry args={[1, 1, 3]} />
      <meshStandardMaterial roughness={1} />
    </instancedMesh>
  );
}
const waterFrag = `uniform float time; uniform vec3 waterColor; varying vec2 vUv; void main(){vec2 p=vUv-.5;float d=length(p*vec2(1.,1.3));float w=sin(d*100.-time*.9)*.5+.5;float lines=pow(w,18.)*.07;float shimmer=sin(vUv.x*55.+vUv.y*8.+time*.35)*sin(vUv.y*60.+time*.25)*.018;float moon=exp(-pow((vUv.x-.45)*12.,2.))*pow(sin(vUv.y*130.),8.)*.15;gl_FragColor=vec4(waterColor+lines+shimmer+moon,1.);
#include <tonemapping_fragment>
#include <colorspace_fragment>
}`;
function Pond({ mood }: { mood: Mood }) {
  const mat = useRef<T.ShaderMaterial>(null);
  const uniforms = useMemo(
    () => ({
      time: { value: 0 },
      waterColor: { value: new T.Color(palette[mood].water) },
    }),
    [],
  );
  useFrame(({ clock }) => {
    if (mat.current) {
      mat.current.uniforms.time.value = reduced ? 0 : clock.elapsedTime;
      mat.current.uniforms.waterColor.value.lerp(
        new T.Color(palette[mood].water),
        0.02,
      );
    }
  });
  return (
    <group position={[0.6, 0.14, 0.1]}>
      <mesh rotation={[-Math.PI / 2, 0, -0.25]} scale={[1.62, 1.12, 1]}>
        <circleGeometry args={[1, 80]} />
        <shaderMaterial
          ref={mat}
          uniforms={uniforms}
          vertexShader="varying vec2 vUv; void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}"
          fragmentShader={waterFrag}
        />
      </mesh>
      {Array.from({ length: 25 }, (_, i) => {
        const a = (i * Math.PI * 2) / 25;
        return (
          <mesh
            key={i}
            position={[Math.cos(a) * 1.67, -0.015, Math.sin(a) * 1.17]}
            rotation={[rand(i), rand(i + 3) * 4, rand(i) * 0.3]}
            scale={[0.22 + rand(i) * 0.18, 0.1 + rand(i + 2) * 0.08, 0.18]}
            castShadow
          >
            <icosahedronGeometry args={[1, 1]} />
            <meshStandardMaterial
              color={["#74877c", "#87988a", "#5a706a"][i % 3]}
              roughness={1}
            />
          </mesh>
        );
      })}
      {[0, 1, 2, 3].map((i) => (
        <group
          key={i}
          position={[
            (rand(i + 30) - 0.5) * 1.7,
            0.015,
            (rand(i + 55) - 0.5) * 1.1,
          ]}
        >
          <mesh rotation={[-Math.PI / 2, 0, i]}>
            <circleGeometry
              args={[0.15 + rand(i) * 0.08, 24, 0.2, Math.PI * 1.9]}
            />
            <meshStandardMaterial color="#7a997e" side={T.DoubleSide} />
          </mesh>
          {i === 1 && (
            <group scale={0.5}>
              <Flower height={0.12} color="#e5b6c6" />
            </group>
          )}
        </group>
      ))}
    </group>
  );
}
function Fireflies({ rain = false }: { rain?: boolean }) {
  const points = useRef<T.Points>(null);
  const positions = useMemo(() => new Float32Array(80 * 3), []);
  useFrame(({ clock }) => {
    const t = reduced ? 0 : clock.elapsedTime;
    for (let i = 0; i < 80; i++) {
      positions[i * 3] = Math.sin(i * 28.1) * 5 + Math.sin(t * 0.17 + i) * 0.5;
      positions[i * 3 + 1] = rain
        ? (((rand(i + 4) * 9 - t * 2) % 7) + 7) % 7
        : 0.3 + rand(i + 4) * 2.7 + Math.sin(t * 0.6 + i) * 0.15;
      positions[i * 3 + 2] =
        Math.cos(i * 12.3) * 3.5 + Math.sin(t * 0.2 + i) * 0.3;
    }
    if (points.current)
      points.current.geometry.attributes.position.needsUpdate = true;
  });
  return (
    <points ref={points}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        color={rain ? "#a9c8d2" : "#e9e1a6"}
        size={rain ? 0.025 : 0.045}
        transparent
        opacity={rain ? 0.45 : 0.8}
        sizeAttenuation
        depthWrite={false}
      />
    </points>
  );
}
function LivingPlant({
  plant,
  selected,
  onSelect,
}: {
  plant: Plant;
  selected: boolean;
  onSelect: (id: string) => void;
}) {
  const [hover, setHover] = useState(false);
  const ref = useRef<T.Group>(null);
  const target = 0.7 + plant.growth * 0.19;
  useFrame((_, dt) => {
    if (ref.current) {
      const s = T.MathUtils.damp(
        ref.current.scale.x,
        target,
        4,
        Math.min(dt, 0.1),
      );
      ref.current.scale.setScalar(s);
    }
  });
  function select(e: ThreeEvent<MouseEvent>) {
    e.stopPropagation();
    onSelect(plant.id);
  }
  return (
    <group
      position={[plant.x, 0.12, plant.z]}
      onClick={select}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHover(true);
        document.body.style.cursor = "pointer";
      }}
      onPointerOut={() => {
        setHover(false);
        document.body.style.cursor = "auto";
      }}
    >
      <group ref={ref} scale={0.3}>
        {plant.kind === "goal" ? (
          <Tree
            size={0.63}
            seed={plant.seed}
            stage={plant.growth}
            flowering={plant.growth === 4}
          />
        ) : plant.kind === "idea" ? (
          <group>
            {Array.from({ length: plant.growth + 1 }, (_, i) => (
              <group
                key={i}
                position={[
                  (rand(i + plant.seed) - 0.5) * 0.8,
                  0,
                  (rand(i + plant.seed + 4) - 0.5) * 0.7,
                ]}
              >
                <Mushroom
                  scale={i === 0 ? 1.35 : 0.6 + rand(i) * 0.4}
                  color="#b5a1d4"
                  glow
                />
              </group>
            ))}
          </group>
        ) : plant.kind === "task" ? (
          <group>
            {Array.from({ length: plant.growth === 4 ? 3 : 1 }, (_, i) => (
              <group key={i} position={[i * 0.17, 0, Math.sin(i * 3) * 0.16]}>
                <Flower
                  seed={plant.seed + i}
                  height={0.55 + i * 0.14}
                  color={
                    ["#e4b6c8", "#e8c493", "#a9c8d8"][
                      Math.floor(plant.seed) % 3
                    ]
                  }
                  bloom={plant.growth >= 3}
                />
              </group>
            ))}
          </group>
        ) : (
          <Float
            speed={reduced ? 0 : 1.8}
            rotationIntensity={0.15}
            floatIntensity={0.3}
          >
            <group position={[0, 0.55, 0]}>
              <mesh>
                <icosahedronGeometry args={[0.07, 2]} />
                <meshStandardMaterial
                  color="#ffdf9c"
                  emissive="#ffd38b"
                  emissiveIntensity={3}
                />
              </mesh>
              <Glow size={1.25} />
              {Array.from({ length: plant.growth }, (_, i) => (
                <mesh
                  key={i}
                  position={[
                    Math.cos(i * 2) * 0.3,
                    Math.sin(i) * 0.15,
                    Math.sin(i * 2) * 0.3,
                  ]}
                >
                  <sphereGeometry args={[0.025, 8, 6]} />
                  <meshStandardMaterial
                    color="#f9e3a0"
                    emissive="#f9e3a0"
                    emissiveIntensity={2}
                  />
                </mesh>
              ))}
            </group>
          </Float>
        )}
      </group>
      <mesh position={[0, 0.4, 0]} visible={false}>
        <cylinderGeometry args={[0.55, 0.55, 1.1, 8]} />
        <meshBasicMaterial />
      </mesh>
      {(hover || selected) && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
          <ringGeometry args={[0.49, 0.51, 48]} />
          <meshBasicMaterial color="#e9d7a7" transparent opacity={0.7} />
        </mesh>
      )}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.005, 0]}>
        <circleGeometry args={[0.35, 24]} />
        <meshStandardMaterial color="#4b6051" transparent opacity={0.5} />
      </mesh>
    </group>
  );
}
function Butterflies() {
  const ref = useRef<T.Group>(null);
  const wings = useRef<T.Group>(null);
  useFrame(({ clock }) => {
    if (reduced) return;
    const t = clock.elapsedTime * 0.22;
    if (ref.current) {
      ref.current.position.set(
        Math.sin(t) * 2.4,
        1.15 + Math.sin(t * 2) * 0.35,
        Math.cos(t) * 1.7,
      );
      ref.current.rotation.y = -t;
    }
    if (wings.current)
      wings.current.scale.x =
        0.25 + Math.abs(Math.sin(clock.elapsedTime * 7)) * 0.75;
  });
  return (
    <group ref={ref}>
      <group ref={wings}>
        {[-1, 1].map((sign) => (
          <mesh
            key={sign}
            position={[sign * 0.1, 0, 0]}
            rotation={[0.4, 0, sign * 0.3]}
            scale={[0.1, 0.012, 0.14]}
          >
            <sphereGeometry args={[1, 10, 8]} />
            <meshStandardMaterial
              color="#e5bb97"
              emissive="#d6b084"
              emissiveIntensity={0.2}
              side={T.DoubleSide}
            />
          </mesh>
        ))}
      </group>
    </group>
  );
}
function World({ mood, plants, selected, onSelect, onGround }: SceneProps) {
  const p = palette[mood];
  const island = useMemo(() => {
    const s = new T.Shape();
    for (let i = 0; i <= 100; i++) {
      const a = (i / 100) * Math.PI * 2;
      const r = 1 + Math.sin(a * 7) * 0.018 + Math.cos(a * 11) * 0.012;
      const x = Math.cos(a) * 5.65 * r,
        y = Math.sin(a) * 3.8 * r;
      if (i === 0) s.moveTo(x, y);
      else s.lineTo(x, y);
    }
    s.closePath();
    return s;
  }, []);
  return (
    <>
      <ambientLight
        intensity={mood === "dawn" ? 1.25 : 0.8}
        color={p.ambient}
      />
      <hemisphereLight args={["#b5c9da", "#2d3e35", 1]} />
      <directionalLight
        position={[-4, 9, 2]}
        intensity={mood === "dawn" ? 3 : 1.5}
        color={p.light}
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-camera-left={-9}
        shadow-camera-right={9}
        shadow-camera-top={9}
        shadow-camera-bottom={-9}
        shadow-bias={-0.001}
      />
      <pointLight
        position={[1, 2, 2]}
        color="#efb46b"
        intensity={3}
        distance={8}
      />
      <group position={[0, -0.4, 0]}>
        <mesh
          rotation={[-Math.PI / 2, 0, 0]}
          position={[0, -0.5, 0]}
          receiveShadow
          castShadow
        >
          <extrudeGeometry
            args={[
              island,
              {
                depth: 0.48,
                bevelEnabled: true,
                bevelSegments: 3,
                steps: 1,
                bevelSize: 0.18,
                bevelThickness: 0.14,
                curveSegments: 64,
              },
            ]}
          />
          <meshStandardMaterial color={p.ground} roughness={1} />
        </mesh>
        <mesh
          rotation={[-Math.PI / 2, 0, 0]}
          position={[0, 0.05, 0]}
          onClick={(e) => {
            e.stopPropagation();
            if (
              Math.hypot((e.point.x - 0.6) / 1.6, (e.point.z - 0.1) / 1.2) > 1
            )
              onGround([
                T.MathUtils.clamp(e.point.x, -5, 5),
                T.MathUtils.clamp(e.point.z, -3.4, 3.4),
              ]);
          }}
        >
          <shapeGeometry args={[island]} />
          <meshStandardMaterial color={p.ground} roughness={1} />
        </mesh>
        <Grass />
        <Pond mood={mood} />
        {mood !== "rain" && <Butterflies />}
        <group position={[-3.3, 0.12, -1.8]}>
          <Tree size={0.85} seed={16} />
        </group>
        <group position={[3.6, 0.1, -2.1]}>
          <Tree size={0.7} seed={7} />
        </group>
        {Array.from({ length: 32 }, (_, i) => {
          const a = i * 2.4,
            r = 3 + rand(i + 11) * 1.8,
            x = Math.cos(a) * r,
            z = Math.sin(a) * r * 0.65;
          return (
            <group key={i} position={[x, 0.1, z]}>
              {i % 5 === 0 ? (
                <Mushroom
                  scale={0.55 + rand(i) * 0.45}
                  color={i % 2 ? "#d2a17e" : "#c5b0bd"}
                />
              ) : (
                <Flower
                  height={0.22 + rand(i) * 0.27}
                  seed={i}
                  color={["#d8b9c5", "#c9d7bb", "#d3c19a", "#aebbcf"][i % 4]}
                />
              )}
            </group>
          );
        })}
        {Array.from({ length: 10 }, (_, i) => (
          <mesh
            key={i}
            position={[-1.5 + i * 0.22, 0.08, 3.3 - i * 0.45]}
            rotation={[0, i * 0.3, 0]}
            scale={[0.25, 0.075, 0.18]}
            receiveShadow
            castShadow
          >
            <cylinderGeometry args={[1, 0.9, 1, 7]} />
            <meshStandardMaterial
              color={["#9ca497", "#88998c", "#b3b3a1"][i % 3]}
              roughness={1}
            />
          </mesh>
        ))}
        <Lantern position={[-2.2, 0.1, 1.1]} />
        <Lantern position={[2.6, 0.1, -1.9]} scale={0.85} />
        <Lantern position={[3.9, 0.1, 2.2]} scale={0.7} />
        {Array.from({ length: 12 }, (_, i) => {
          const a = i * 2.5;
          return (
            <mesh
              key={i}
              position={[Math.cos(a) * 5.45, -0.04, Math.sin(a) * 3.55]}
              scale={[0.3 + rand(i) * 0.3, 0.15 + rand(i + 3) * 0.15, 0.25]}
              rotation={[0, i, 0]}
              castShadow
            >
              <icosahedronGeometry args={[1, 1]} />
              <meshStandardMaterial color="#617b6b" roughness={1} />
            </mesh>
          );
        })}
        {plants.map((plant) => (
          <LivingPlant
            key={plant.id}
            plant={plant}
            selected={selected === plant.id}
            onSelect={onSelect}
          />
        ))}
        <Fireflies rain={mood === "rain"} />
      </group>
      <ContactShadows
        position={[0, -1.12, 0]}
        opacity={0.4}
        scale={25}
        blur={3.5}
        far={8}
        resolution={256}
        color="#000d13"
        frames={1}
      />
    </>
  );
}
type SceneProps = {
  mood: Mood;
  plants: Plant[];
  selected: string | null;
  onSelect: (id: string) => void;
  onGround: (pos: [number, number]) => void;
};
function CameraFit() {
  const size = useRef({ w: 0, h: 0 });
  useFrame(({ camera, size: s }) => {
    if (size.current.w !== s.width || size.current.h !== s.height) {
      size.current = { w: s.width, h: s.height };
      const c = camera as T.OrthographicCamera;
      c.zoom = Math.min(s.width / 14.8, s.height / 10.5);
      c.updateProjectionMatrix();
    }
  });
  return null;
}
export function GardenScene(props: SceneProps) {
  useEffect(() => {
    const m = matchMedia("(prefers-reduced-motion: reduce)");
    const change = () => {
      reduced = m.matches;
    };
    change();
    m.addEventListener("change", change);
    return () => m.removeEventListener("change", change);
  }, []);
  return (
    <Canvas
      fallback={
        <div className="scene-loading">
          This garden needs WebGL. You can still tend your plants in Field
          notes.
        </div>
      }
      shadows
      dpr={[1, 1.6]}
      orthographic
      camera={{ position: [10, 12, 17], zoom: 65, near: 0.1, far: 100 }}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      onCreated={({ camera }) => camera.lookAt(0, 0.5, 0)}
    >
      <CameraFit />
      <Suspense fallback={null}>
        <World {...props} />
      </Suspense>
    </Canvas>
  );
}
