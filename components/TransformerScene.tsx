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
const BLOCK_WIDTH = 2.5;
const BLOCK_HEIGHT = 0.8;
const BLOCK_DEPTH = 2.5;
const GAP = 0.2;

const createStack = (offsetX: number, type: 'Encoder' | 'Decoder'): TransformerBlockData[] => {
  const blocks: TransformerBlockData[] = [];
  let currentY = -4;

  const addBlock = (id: string, label: string, color: string, height = BLOCK_HEIGHT) => {
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

  // Inputs
  addBlock('inputs', type === 'Encoder' ? '输入 (Inputs)' : '输出 (偏移后)', '#475569'); // Slate 600
  addBlock('embedding', '嵌入层 (Embedding)', '#ec4899'); // Pink 500
  addBlock('pos-enc', '位置编码', '#a855f7', 0.4); // Purple 500

  currentY += GAP * 2; // Spacer

  // The Nx Stack (Represented as 1 large block group for simplicity)
  // Sub-layer 1
  if (type === 'Decoder') {
    addBlock('masked-attn', '掩码多头注意力', '#f97316'); // Orange 500
    addBlock('add-norm-1', '残差 & 归一化', '#eab308', 0.3); // Yellow 500
  }

  // Sub-layer 2
  const attnLabel = type === 'Encoder' ? '多头注意力' : '交叉注意力';
  addBlock('attention', attnLabel, '#f97316'); // Orange 500
  addBlock('add-norm-2', '残差 & 归一化', '#eab308', 0.3); // Yellow 500

  // Sub-layer 3
  addBlock('ffn', '前馈神经网络', '#3b82f6'); // Blue 500
  addBlock('add-norm-3', '残差 & 归一化', '#eab308', 0.3); // Yellow 500

  // Output layers (Decoder only)
  if (type === 'Decoder') {
    currentY += GAP * 2;
    addBlock('linear', '线性层 (Linear)', '#6366f1'); // Indigo 500
    addBlock('softmax', 'Softmax', '#10b981'); // Emerald 500
    addBlock('probs', '输出概率', '#475569');
  }

  return blocks;
};

const ENCODER_BLOCKS = createStack(-2, 'Encoder');
const DECODER_BLOCKS = createStack(2, 'Decoder');
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
        radius={0.1}
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
          emissiveIntensity={isSelected ? 0.5 : 0.2}
          roughness={0.2}
          metalness={0.6}
          transparent
          opacity={0.95}
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
             fontSize: '14px',
             textShadow: '0 2px 4px rgba(0,0,0,0.8)',
             userSelect: 'none'
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
    const particleCount = 20;
    const particles = useMemo(() => {
        return new Array(particleCount).fill(0).map(() => ({
            x: (Math.random() - 0.5) * 6,
            y: -5 + Math.random() * 10,
            z: (Math.random() - 0.5) * 2,
            speed: 0.02 + Math.random() * 0.05
        }))
    }, []);
    
    const meshRefs = useRef<THREE.Mesh[]>([]);

    useFrame(() => {
        meshRefs.current.forEach((mesh, i) => {
            if(!mesh) return;
            const p = particles[i];
            mesh.position.y += p.speed;
            if (mesh.position.y > 6) mesh.position.y = -5;
        });
    });

    return (
        <group>
            {particles.map((p, i) => (
                <mesh key={i} ref={(el) => { if (el) meshRefs.current[i] = el; }} position={[p.x, p.y, p.z]}>
                    <sphereGeometry args={[0.05, 8, 8]} />
                    <meshBasicMaterial color="#00ffff" transparent opacity={0.4} />
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
    <Canvas camera={{ position: [0, 2, 14], fov: 45 }}>
      <color attach="background" args={['#0f172a']} />
      <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} intensity={1} color="#60a5fa" />
      <pointLight position={[-10, 10, 10]} intensity={1} color="#c084fc" />
      <spotLight position={[0, 10, 0]} intensity={0.8} angle={0.5} penumbra={1} />
      
      <Environment preset="city" />

      <group position={[0, -1, 0]}>
        {/* Encoder Label */}
        <Html position={[-2.5, 6.5, 0]} center style={{ color: '#94a3b8', fontSize: '1.2rem', fontWeight: 'bold', whiteSpace: 'nowrap', userSelect: 'none' }}>
            编码器 (ENCODER)
        </Html>
        <Html position={[2.5, 7.5, 0]} center style={{ color: '#94a3b8', fontSize: '1.2rem', fontWeight: 'bold', whiteSpace: 'nowrap', userSelect: 'none' }}>
            解码器 (DECODER)
        </Html>

        <Float speed={1} rotationIntensity={0.1} floatIntensity={0.2}>
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

      <OrbitControls makeDefault minPolarAngle={0} maxPolarAngle={Math.PI / 1.5} />
      <gridHelper args={[20, 20, 0x1e293b, 0x1e293b]} position={[0, -6, 0]} />
    </Canvas>
  );
};