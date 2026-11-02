import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useTexture } from "@react-three/drei";
import * as THREE from "three";
import type { Mood, Plant } from "./store";
const art = `${import.meta.env.BASE_URL}art/sanctuary.jpg`;
const random = (i: number) => {
  const n = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return n - Math.floor(n);
};
const fragment = `uniform sampler2D scene;uniform float time;uniform float aspect;uniform float imageAspect;uniform float night;varying vec2 vUv;
void main(){vec2 uv=vUv;float ratio=aspect/imageAspect;if(ratio>1.)uv.y=(uv.y-.5)/ratio+.5;else uv.x=(uv.x-.5)*ratio+.5;
float leaves=smoothstep(.48,.78,uv.y);float water=smoothstep(.1,.2,uv.y)*(1.-smoothstep(.42,.52,uv.y))*smoothstep(.34,.5,uv.x)*(1.-smoothstep(.86,.98,uv.x));
vec2 wind=vec2(sin(uv.y*28.+time*.6)*sin(time*.43+uv.x*11.),cos(uv.x*31.+time*.5))*.00085*leaves;
vec2 ripple=vec2(sin(uv.y*290.+time*1.1),cos(uv.x*110.+time*.8))*.00065*water;
vec3 col=texture2D(scene,uv+wind+ripple).rgb;float shimmer=pow(max(0.,sin(uv.y*430.+time*1.4)*sin(uv.x*170.+time*.7)),14.)*water*.055;col+=shimmer;
col=mix(col,col*vec3(.30,.43,.66),night);gl_FragColor=vec4(col,1.);
#include <tonemapping_fragment>
#include <colorspace_fragment>
}`;
function Environment({ mood, reduced }: { mood: Mood; reduced: boolean }) {
  const texture = useTexture(art);
  texture.colorSpace = THREE.SRGBColorSpace;
  const ref = useRef<THREE.ShaderMaterial>(null);
  const { viewport, size } = useThree();
  const uniforms = useMemo(
    () => ({
      scene: { value: texture },
      time: { value: 0 },
      aspect: { value: 1 },
      imageAspect: { value: texture.image.width / texture.image.height },
      night: { value: 0 },
    }),
    [texture],
  );
  useFrame((_, dt) => {
    if (!ref.current) return;
    const u = ref.current.uniforms;
    if (!reduced) u.time.value += Math.min(dt, 0.05);
    u.aspect.value = size.width / size.height;
    u.night.value = THREE.MathUtils.damp(
      u.night.value,
      mood === "moonlight"
        ? 0.9
        : mood === "twilight"
          ? 0.42
          : mood === "rain"
            ? 0.24
            : 0,
      1.2,
      dt,
    );
  });
  return (
    <mesh>
      <planeGeometry args={[viewport.width, viewport.height]} />
      <shaderMaterial
        toneMapped={false}
        ref={ref}
        uniforms={uniforms}
        vertexShader="varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}"
        fragmentShader={fragment}
      />
    </mesh>
  );
}
function Botanical({ plant }: { plant: Plant }) {
  const seed = plant.seed;
  const stage = plant.growth;
  const id = `plant-${plant.id}`;
  return (
    <svg viewBox="0 0 120 160" aria-hidden="true">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
          <stop stopColor="#ecf2a4" />
          <stop offset=".4" stopColor="#94b15b" />
          <stop offset="1" stopColor="#345b37" />
        </linearGradient>
        <radialGradient id={`${id}-petal`}>
          <stop stopColor="#fffde8" />
          <stop offset=".65" stopColor="#f5e7d9" />
          <stop offset="1" stopColor="#dba9b3" />
        </radialGradient>
      </defs>
      {plant.kind === "thought" ? (
        <g className="thought-light">
          <circle cx="60" cy="90" r="5" fill="#fff8c6" />
          {Array.from({ length: stage + 2 }, (_, i) => (
            <circle
              key={i}
              cx={60 + Math.sin(i * 2) * 23}
              cy={95 + Math.cos(i * 2) * 14}
              r="1.5"
              fill="#fff5c4"
            />
          ))}
        </g>
      ) : plant.kind === "idea" ? (
        <g>
          {Array.from({ length: stage + 1 }, (_, i) => {
            const x = 35 + random(seed + i) * 50,
              y = 115 + random(seed + i + 20) * 22;
            return (
              <g key={i}>
                <path
                  d={`M${x} ${y + 12} Q${x - 4} ${y - 2} ${x + 2} ${y - 13}`}
                  fill="none"
                  stroke="#e4d3b1"
                  strokeWidth="4"
                />
                <path
                  d={`M${x - 16} ${y - 10} Q${x - 14} ${y - 34} ${x + 3} ${y - 33} Q${x + 20} ${y - 28} ${x + 19} ${y - 10} Q${x} ${y - 4} ${x - 16} ${y - 10}`}
                  fill="#a58baf"
                  stroke="#e2c4c7"
                  strokeWidth="1"
                />
                {[0, 1, 2].map((j) => (
                  <circle
                    key={j}
                    cx={x - 7 + j * 9}
                    cy={y - 18 - (j % 2) * 6}
                    r="1.5"
                    fill="#e9dec0"
                  />
                ))}
              </g>
            );
          })}
        </g>
      ) : plant.kind === "goal" ? (
        <g>
          <path
            d="M60 151 Q52 105 64 39 M59 125 Q24 104 21 78 M59 110 Q92 89 98 66 M61 89 Q35 64 39 44"
            fill="none"
            stroke="#7d7951"
            strokeWidth="2.5"
          />
          {Array.from({ length: 25 + stage * 12 }, (_, i) => {
            const x = 20 + random(seed + i) * 80,
              y = 35 + random(seed + i + 31) * 88;
            return (
              <path
                key={i}
                d={`M${x} ${y} q-13 -7 -7 -17 q12 2 7 17`}
                fill={`url(#${id})`}
                opacity={0.75 + random(i) * 0.25}
                transform={`rotate(${random(i + 3) * 100 - 50},${x},${y})`}
              />
            );
          })}
          {stage === 4 &&
            Array.from({ length: 12 }, (_, i) => (
              <circle
                key={i}
                cx={25 + random(i + seed) * 70}
                cy={45 + random(i + seed + 7) * 60}
                r="2"
                fill="#f9e8d5"
              />
            ))}
        </g>
      ) : (
        <g>
          <path
            d={`M60 150 Q47 112 60 ${100 - stage * 15}`}
            stroke="#7e9851"
            strokeWidth="2"
            fill="none"
          />
          {[0, 1, 2].slice(0, stage + 1).map((i) => (
            <path
              key={i}
              d={`M56 ${132 - i * 14} q${i % 2 ? 22 : -23} -1 ${i % 2 ? 23 : -20} -21 q${i % 2 ? -20 : 23} 1 ${i % 2 ? -23 : 20} 21`}
              fill={`url(#${id})`}
            />
          ))}
          {stage > 1 ? (
            <g
              transform={`translate(60,${100 - stage * 15})`}
              className="flower-head"
            >
              {Array.from({ length: stage === 4 ? 10 : 6 }, (_, i) => (
                <ellipse
                  key={i}
                  cx="0"
                  cy="-11"
                  rx="5"
                  ry="14"
                  transform={`rotate(${(i * 360) / (stage === 4 ? 10 : 6)})`}
                  fill={`url(#${id}-petal)`}
                />
              ))}
              <circle r="5" fill="#dfb653" />
            </g>
          ) : (
            <ellipse
              cx="60"
              cy={100 - stage * 15}
              rx="4"
              ry="7"
              fill="#c0bf7e"
            />
          )}
        </g>
      )}
    </svg>
  );
}
export function GardenScene({
  mood,
  plants,
  selected,
  onSelect,
  onGround,
}: {
  mood: Mood;
  plants: Plant[];
  selected: string | null;
  onSelect: (id: string) => void;
  onGround: (p: [number, number]) => void;
}) {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const media = matchMedia("(prefers-reduced-motion: reduce)");
    const change = () => setReduced(media.matches);
    change();
    media.addEventListener("change", change);
    return () => media.removeEventListener("change", change);
  }, []);
  return (
    <div
      className={`sanctuary sanctuary-${mood}`}
      style={{ backgroundImage: `url(${art})` }}
    >
      <Canvas
        orthographic
        dpr={[1, 1.75]}
        camera={{ position: [0, 0, 1], zoom: 1 }}
        gl={{ alpha: true, antialias: false }}
        fallback={<span />}
      >
        <Suspense fallback={null}>
          <Environment mood={mood} reduced={reduced} />
        </Suspense>
      </Canvas>
      <div className="sunbeams" />
      <div className="atmosphere" />
      <div className="pollen" aria-hidden="true">
        {Array.from({ length: 38 }, (_, i) => (
          <i
            key={i}
            style={{
              left: `${random(i) * 100}%`,
              top: `${random(i + 50) * 100}%`,
              animationDelay: `-${random(i + 8) * 35}s`,
              animationDuration: `${18 + random(i + 9) * 20}s`,
              width: i % 5 === 0 ? 4 : 2,
              height: i % 5 === 0 ? 4 : 2,
            }}
          />
        ))}
      </div>
      {mood === "rain" && <div className="rain-veil" />}
      <button
        className="open-soil"
        aria-label="Plant in the garden"
        onClick={() => onGround([-2.7, 1.5])}
      />
      <div className="living-botanicals">
        {plants.map((p) => (
          <button
            key={p.id}
            className={`botanical ${selected === p.id ? "selected" : ""}`}
            style={{
              left: `${p.x < 0 ? 35 + p.x * 4 : 81 + p.x * 2.5}%`,
              top: `${70 + p.z * 4}%`,
              width: `${80 + p.growth * 7}px`,
              animationDelay: `-${p.seed % 8}s`,
            }}
            onClick={() => onSelect(p.id)}
            aria-label={`Tend ${p.title}`}
          >
            <Botanical plant={p} />
            <span className="botanical-label">{p.title}</span>
            <span className="plant-marker" />
          </button>
        ))}
      </div>
    </div>
  );
}
