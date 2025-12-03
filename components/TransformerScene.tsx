import React, { useRef, useState, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, RoundedBox, Environment, Float, Stars, Html } from '@react-three/drei';
import * as THREE from 'three';
import { TransformerBlockData } from '../types';

// Add type declarations for React Three Fiber intrinsic elements to fix TypeScript errors
declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
      group: any;
      mesh: any;
      meshStandardMaterial: any;
      sphereGeometry: any;
      meshBasicMaterial: any;
      ambientLight: any;
      pointLight: any;
      spotLight: any;
      gridHelper: any;
      color: any;
    }
  }
}

declare global {
  namespace JSX {
    interface IntrinsicElements {
      group: any;
      mesh: any;
      meshStandardMaterial: any;
      sphereGeometry: any;
      meshBasicMaterial: any;
      ambientLight: any;
      pointLight: any;
      spotLight: any;
      gridHelper: any;
      color: any;
    }
  }
}

// Define the layout of the Transformer
// Left Tower: Encoder, Right Tower: Decoder
// More uniform dimensions for aesthetics
const BLOCK_WIDTH = 3.0;
const STD_BLOCK_HEIGHT = 0.8;
const BLOCK_DEPTH = 3.0;
const GAP = 0.3; // Slightly larger gap for clarity

const createStack = (offsetX: number, type: 'Encoder' | 'Decoder'): TransformerBlockData[] => {
  const blocks: TransformerBlockData[] = [];
  let currentY = -4.5; // Start slightly lower to fit everything nicely

  const addBlock = (id: string, label: string, color: string, height = STD_BLOCK_HEIGHT) => {
    blocks.push({
      id: `${type}-${id}`,
      label,
      type: 'mechanism',
      position: [offsetX, currentY, 0],
      color,
      dimensions: [BLOCK_WIDTH, height, BLOCK_DEPTH],
    });
    currentY += height + GAP;
  };

  // --- Encoder / Decoder Base ---
  // Inputs
  addBlock('inputs', type === 'Encoder' ? '输入 (Inputs)' : '输出 (Shifted)', '#475569'); // Slate 600
  
  // Embedding
  addBlock('embedding', '嵌入层 (Embedding)', '#ec4899'); // Pink 500
  
  // Positional Encoding (made same size as others for uniformity)
  addBlock('pos-enc', '位置编码', '#a855f7'); // Purple 500

  currentY += GAP * 1.5; // Slightly larger spacer before the N layers

  // --- The Nx Stack Layers ---
  
  // Decoder has an extra Masked Attention layer first
  if (type === 'Decoder') {
    addBlock('masked-attn', '掩码多头注意力', '#f97316'); // Orange 500
    addBlock('add-norm-1', '残差 & 归一化', '#eab308', 0.5); // Yellow 500 - Slightly thinner but distinct
  }

  // Main Attention Block
  const attnLabel = type === 'Encoder' ? '多头注意力' : '交叉注意力';
  addBlock('attention', attnLabel, '#f97316'); // Orange 500
  addBlock('add-norm-2', '残差 & 归一化', '#eab308', 0.5); // Yellow 500

  // Feed Forward Block
  addBlock('ffn', '前馈神经网络', '#3b82f6'); // Blue 500
  addBlock('add-norm-3', '残差 & 归一化', '#eab308', 0.5); // Yellow 500

  // --- Output Head (Decoder only) ---
  if (type === 'Decoder') {
    currentY += GAP * 1.5;
    addBlock('linear', '线性层 (Linear)', '#6366f1'); // Indigo 500
    addBlock('softmax', 'Softmax', '#10b981'); // Emerald 500
    addBlock('probs', '输出概率', '#475569');
  }

  return blocks;
};

const ENCODER_BLOCKS = createStack(-2.5, 'Encoder'); // Moved further left
const DECODER_BLOCKS = createStack(2.5, 'Decoder');  // Moved further right
const ALL_BLOCKS = [...ENCODER_BLOCKS, ...DECODER_BLOCKS];

interface BlockProps {
  data: TransformerBlockData;
  isSelected: boolean;
  onClick: (data: TransformerBlockData) => void;
}

const Block: React.FC<BlockProps> = ({ data, isSelected, onClick }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHover] = useState(false);

  useFrame((state) => {
    if (meshRef.current) {
      // Subtle float effect if selected
      if (isSelected) {
        meshRef.current.rotation.y = Math.sin(state.clock.elapsedTime) * 0.1;
      } else {
        meshRef.current.rotation.y = 0;
      }
    }
  });

  const emissiveColor = isSelected ? '#ffffff' : (hovered ? '#444' : '#000');
  const actualColor = isSelected ? new THREE.Color(data.color).offsetHSL(0, 0, 0.1) : data.color;

  return (
    <group position={new THREE.Vector3(...data.position)}>
      <RoundedBox
        ref={meshRef}
        args={data.dimensions}
        radius={0.15} // Slightly rounder for aesthetics
        smoothness={4}
        onClick={(e) => {
          e.stopPropagation();
          onClick(data);
        }}
        onPointerOver={() => setHover(true)}
        onPointerOut={() => setHover(false)}
      >
        <meshStandardMaterial
          color={actualColor}
          emissive={emissiveColor}
          emissiveIntensity={isSelected ? 0.4 : 0.1}
          roughness={0.3}
          metalness={0.5}
          transparent
          opacity={0.9}
        />
      </RoundedBox>
      <Html
        position={[0, 0, data.dimensions[2] / 2 + 0.1]}
        transform
        occlude
        center
        style={{
             pointerEvents: 'none',
             width: '200px',
             textAlign: 'center',
             color: 'white',
             fontFamily: 'sans-serif',
             fontWeight: 'bold',
             fontSize: '12px',
             textShadow: '0 2px 4px rgba(0,0,0,0.8)',
             userSelect: 'none',
             letterSpacing: '0.05em'
        }}
      >
        {data.label}
      </Html>
    </group>
  );
};

// Data Flow Particles
const DataFlow = () => {
    // A simple visual effect simulating data moving up
    const particleCount = 40; // Increased count
    const particles = useMemo(() => {
        return new Array(particleCount).fill(0).map(() => ({
            x: (Math.random() - 0.5) * 8,
            y: -5 + Math.random() * 12,
            z: (Math.random() - 0.5) * 4,
            speed: 0.02 + Math.random() * 0.06
        }))
    }, []);
    
    const meshRefs = useRef<THREE.Mesh[]>([]);

    useFrame(() => {
        meshRefs.current.forEach((mesh, i) => {
            if(!mesh) return;
            const p = particles[i];
            mesh.position.y += p.speed;
            if (mesh.position.y > 7) mesh.position.y = -5;
        });
    });

    return (
        <group>
            {particles.map((p, i) => (
                <mesh key={i} ref={(el) => { if (el) meshRefs.current[i] = el; }} position={[p.x, p.y, p.z]}>
                    <sphereGeometry args={[0.04, 8, 8]} />
                    <meshBasicMaterial color="#38bdf8" transparent opacity={0.6} />
                </mesh>
            ))}
        </group>
    )
}

interface SceneProps {
  onBlockSelect: (block: TransformerBlockData) => void;
  selectedBlockId: string | null;
}

export const TransformerScene: React.FC<SceneProps> = ({ onBlockSelect, selectedBlockId }) => {
  return (
    <Canvas camera={{ position: [0, 2, 16], fov: 40 }}>
      <color attach="background" args={['#0f172a']} />
      <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
      <ambientLight intensity={0.6} />
      <pointLight position={[10, 10, 10]} intensity={1.2} color="#60a5fa" />
      <pointLight position={[-10, 10, 10]} intensity={1.2} color="#c084fc" />
      <spotLight position={[0, 15, 5]} intensity={0.5} angle={0.6} penumbra={1} />
      
      <Environment preset="city" />

      <group position={[0, -2, 0]}>
        {/* Encoder Label */}
        <Html position={[-3.5, 8.5, 0]} center style={{ color: '#94a3b8', fontSize: '1.2rem', fontWeight: 'bold', whiteSpace: 'nowrap', userSelect: 'none', background: 'rgba(15, 23, 42, 0.5)', padding: '4px 12px', borderRadius: '8px' }}>
            编码器 (ENCODER)
        </Html>
        <Html position={[3.5, 8.5, 0]} center style={{ color: '#94a3b8', fontSize: '1.2rem', fontWeight: 'bold', whiteSpace: 'nowrap', userSelect: 'none', background: 'rgba(15, 23, 42, 0.5)', padding: '4px 12px', borderRadius: '8px' }}>
            解码器 (DECODER)
        </Html>

        <Float speed={1.5} rotationIntensity={0.05} floatIntensity={0.1}>
          {ALL_BLOCKS.map((block) => (
            <Block
              key={block.id}
              data={block}
              isSelected={selectedBlockId === block.id}
              onClick={onBlockSelect}
            />
          ))}
        </Float>
        
        <DataFlow />
      </group>

      <OrbitControls makeDefault minPolarAngle={0} maxPolarAngle={Math.PI / 1.5} enablePan={false} />
      <gridHelper args={[30, 30, 0x1e293b, 0x1e293b]} position={[0, -7, 0]} />
    </Canvas>
  );
};