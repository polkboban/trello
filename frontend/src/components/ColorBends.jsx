'use client';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useRef, useMemo } from 'react';
import * as THREE from 'three';

// --- Shader Code ---
const vertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const fragmentShader = `
  uniform float uTime;
  uniform vec3 uColor1;
  uniform vec3 uColor2;
  uniform vec3 uColor3;
  uniform float uSpeed;
  uniform float uNoiseStrength;
  uniform float uWarpStrength;
  
  varying vec2 vUv;

  // Simple pseudo-random noise
  float random(vec2 st) {
      return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
  }

  // 2D Noise
  float noise(vec2 st) {
      vec2 i = floor(st);
      vec2 f = fract(st);
      float a = random(i);
      float b = random(i + vec2(1.0, 0.0));
      float c = random(i + vec2(0.0, 1.0));
      float d = random(i + vec2(1.0, 1.0));
      vec2 u = f * f * (3.0 - 2.0 * f);
      return mix(a, b, u.x) + (c - a)* u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
  }

  void main() {
    vec2 uv = vUv;
    float time = uTime * uSpeed;

    // Domain Warping / "Bends"
    float n = noise(uv * 3.0 + time * 0.2);
    
    vec2 warp = vec2(
      sin(uv.y * 10.0 + time + n * uWarpStrength),
      cos(uv.x * 10.0 - time + n * uWarpStrength)
    );
    
    vec2 distortedUv = uv + warp * 0.1 * uWarpStrength;

    // Color Mixing based on distorted coordinates
    float mixFactor = sin(distortedUv.x * 5.0 + time) * 0.5 + 0.5;
    float mixFactor2 = cos(distortedUv.y * 5.0 - time * 0.8) * 0.5 + 0.5;

    vec3 color = mix(uColor1, uColor2, mixFactor);
    color = mix(color, uColor3, mixFactor2);

    // Add subtle grain
    float grain = (random(uv + time) - 0.5) * uNoiseStrength;
    
    gl_FragColor = vec4(color + grain, 1.0);
  }
`;

function GradientMesh({ colors, speed, noiseStrength, warpStrength }) {
  const mesh = useRef();
  const { viewport } = useThree();

  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uColor1: { value: new THREE.Color(colors[0]) },
    uColor2: { value: new THREE.Color(colors[1]) },
    uColor3: { value: new THREE.Color(colors[2]) },
    uSpeed: { value: speed },
    uNoiseStrength: { value: noiseStrength },
    uWarpStrength: { value: warpStrength }
  }), [colors, speed, noiseStrength, warpStrength]);

  useFrame((state) => {
    if (mesh.current) {
      mesh.current.material.uniforms.uTime.value = state.clock.getElapsedTime();
    }
  });

  return (
    <mesh ref={mesh} scale={[viewport.width, viewport.height, 1]}>
      <planeGeometry args={[1, 1]} />
      <shaderMaterial
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
      />
    </mesh>
  );
}

export default function ColorBends({
  colors = ['#00c6ff', '#0072ff', '#0F2027'], // Default Blue/Deep gradient
  speed = 0.5,
  noiseStrength = 0.05,
  warpStrength = 2.0
}) {
  return (
    <div className="absolute inset-0 -z-10 w-full h-full bg-[#0B0C10]">
      <Canvas camera={{ position: [0, 0, 1] }} dpr={[1, 2]}>
        <GradientMesh 
          colors={colors} 
          speed={speed} 
          noiseStrength={noiseStrength}
          warpStrength={warpStrength}
        />
      </Canvas>
      {/* Overlay for better text readability */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"></div>
    </div>
  );
}