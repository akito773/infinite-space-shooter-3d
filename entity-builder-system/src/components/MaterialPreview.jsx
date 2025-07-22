import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Environment } from '@react-three/drei';
import * as THREE from 'three';

function PreviewSphere({ material }) {
  const meshRef = useRef();
  
  useFrame((state, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 0.5;
    }
  });
  
  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[1, 32, 32]} />
      <meshStandardMaterial
        color={material.color || '#ffffff'}
        metalness={material.metalness || 0.5}
        roughness={material.roughness || 0.5}
        emissive={material.emissive || '#000000'}
        emissiveIntensity={material.emissiveIntensity || 0}
        transparent={material.transparent || false}
        opacity={material.opacity || 1}
      />
    </mesh>
  );
}

function MaterialPreview({ material }) {
  return (
    <div style={{ 
      width: '100%', 
      height: '120px', 
      backgroundColor: '#1a1a1a',
      borderRadius: '4px',
      overflow: 'hidden',
      marginBottom: '10px'
    }}>
      <Canvas
        camera={{ position: [0, 0, 3], fov: 45 }}
        gl={{ antialias: true, alpha: true }}
      >
        <Environment preset="studio" />
        <ambientLight intensity={0.5} />
        <directionalLight position={[5, 5, 5]} intensity={1} />
        <PreviewSphere material={material} />
        <OrbitControls 
          enablePan={false} 
          enableZoom={false}
          minPolarAngle={Math.PI / 3}
          maxPolarAngle={Math.PI / 1.5}
        />
      </Canvas>
    </div>
  );
}

export default MaterialPreview;