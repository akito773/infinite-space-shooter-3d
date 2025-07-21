import React, { useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useFrame } from '@react-three/fiber';
import { TransformControls } from '@react-three/drei';
import * as THREE from 'three';
import { selectObject, updateObject } from '../store';

function SceneObject({ object }) {
  const meshRef = useRef();
  const groupRef = useRef();
  const transformRef = useRef();
  const dispatch = useDispatch();
  const objects = useSelector(state => state.scene.objects);
  const selectedObjectId = useSelector(state => state.scene.selectedObjectId);
  const transformMode = useSelector(state => state.scene.transformMode);
  const isSelected = selectedObjectId === object.id;
  
  const [hovered, setHovered] = useState(false);

  const getGeometry = () => {
    const args = object.geometry.args || [1, 1, 1];
    
    switch (object.geometry.type) {
      case 'box':
        return new THREE.BoxGeometry(...args);
      case 'sphere':
        return new THREE.SphereGeometry(...args);
      case 'cylinder':
        return new THREE.CylinderGeometry(...args);
      case 'cone':
        return new THREE.ConeGeometry(...args);
      case 'torus':
        return new THREE.TorusGeometry(...args);
      default:
        return new THREE.BoxGeometry(1, 1, 1);
    }
  };

  const handleClick = (e) => {
    e.stopPropagation();
    dispatch(selectObject(object.id));
  };

  const handleTransformChange = () => {
    const targetRef = object.geometry.type === 'group' ? groupRef : meshRef;
    if (transformRef.current && targetRef.current) {
      const position = targetRef.current.position.toArray();
      const rotation = targetRef.current.rotation.toArray().slice(0, 3);
      const scale = targetRef.current.scale.toArray();
      
      dispatch(updateObject({
        id: object.id,
        updates: {
          position,
          rotation,
          scale,
        }
      }));
    }
  };

  // 子オブジェクトを取得
  const children = object.children ? 
    objects.filter(obj => object.children.includes(obj.id)) : [];

  // グループタイプの場合
  if (object.geometry.type === 'group') {
    return (
      <>
        <group
          ref={groupRef}
          position={object.position}
          rotation={object.rotation}
          scale={object.scale}
          onClick={handleClick}
        >
          {children.map(child => (
            <SceneObject key={child.id} object={child} />
          ))}
        </group>
        
        {isSelected && (
          <TransformControls
            ref={transformRef}
            object={groupRef.current}
            mode={transformMode}
            onChange={handleTransformChange}
          />
        )}
      </>
    );
  }

  // 通常のメッシュ
  return (
    <>
      <mesh
        ref={meshRef}
        position={object.position}
        rotation={object.rotation}
        scale={object.scale}
        onClick={handleClick}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
        castShadow
        receiveShadow
      >
        <primitive object={getGeometry()} />
        <meshStandardMaterial
          color={object.material.color}
          metalness={object.material.metalness || 0.5}
          roughness={object.material.roughness || 0.5}
          transparent={object.material.transparent || false}
          opacity={object.material.opacity || 1}
          emissive={object.material.emissive || (isSelected ? '#0066cc' : (hovered ? '#444444' : '#000000'))}
          emissiveIntensity={object.material.emissiveIntensity || (isSelected ? 0.3 : (hovered ? 0.1 : 0))}
        />
      </mesh>
      
      {isSelected && (
        <TransformControls
          ref={transformRef}
          object={meshRef.current}
          mode={transformMode}
          onChange={handleTransformChange}
        />
      )}
    </>
  );
}

export default SceneObject;