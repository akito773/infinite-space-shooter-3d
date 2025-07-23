import React, { useRef, useEffect, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { TransformControls } from '@react-three/drei';
import { selectObject, updateObject, toggleMultiSelect } from '../store';

function AnimatedObject({ object }) {
  const meshRef = useRef();
  const groupRef = useRef();
  const transformRef = useRef();
  const dispatch = useDispatch();
  
  const objects = useSelector(state => state.scene.objects);
  const bones = useSelector(state => state.scene.bones);
  const bindings = useSelector(state => state.scene.bindings);
  const selectedObjectId = useSelector(state => state.scene.selectedObjectId);
  const selectedObjectIds = useSelector(state => state.scene.selectedObjectIds);
  const transformMode = useSelector(state => state.scene.transformMode);
  const isSelected = selectedObjectId === object.id;
  const isMultiSelected = selectedObjectIds.includes(object.id);
  const isPlaying = useSelector(state => state.scene.isPlaying);
  
  const [hovered, setHovered] = React.useState(false);
  
  // このオブジェクトのバインディングを取得
  const objectBindings = useMemo(() => {
    return bindings.filter(b => b.meshId === object.id);
  }, [bindings, object.id]);
  
  // 初期トランスフォームを保存
  const initialTransform = useRef(null);
  
  // 初期化時に位置を保存
  useEffect(() => {
    if (!initialTransform.current) {
      initialTransform.current = {
        position: [...object.position],
        rotation: [...object.rotation],
        scale: [...object.scale],
      };
    }
  }, [object.id]); // object.idが変わったら再初期化
  
  // ボーンのワールドトランスフォームを計算
  const getBoneWorldMatrix = (boneId) => {
    const bone = bones.find(b => b.id === boneId);
    if (!bone) return new THREE.Matrix4();
    
    const matrix = new THREE.Matrix4();
    const position = new THREE.Vector3(...bone.position);
    const rotation = new THREE.Euler(...bone.rotation);
    const scale = new THREE.Vector3(1, 1, 1);
    
    matrix.compose(position, new THREE.Quaternion().setFromEuler(rotation), scale);
    
    // 親ボーンの変換を適用
    let currentBone = bone;
    while (currentBone.parent) {
      const parent = bones.find(b => b.id === currentBone.parent);
      if (!parent) break;
      
      const parentMatrix = new THREE.Matrix4();
      const parentPos = new THREE.Vector3(...parent.position);
      const parentRot = new THREE.Euler(...parent.rotation);
      parentMatrix.compose(parentPos, new THREE.Quaternion().setFromEuler(parentRot), new THREE.Vector3(1, 1, 1));
      
      matrix.premultiply(parentMatrix);
      currentBone = parent;
    }
    
    return matrix;
  };
  
  // 人間モデルかどうかを判定
  const isHumanModel = useMemo(() => {
    // Headという名前のオブジェクトがあれば人間モデル
    return objects.some(obj => obj.name === 'Head' || obj.name === 'Torso');
  }, [objects]);
  
  // アニメーション更新
  useFrame(() => {
    if (!isPlaying || objectBindings.length === 0 || !meshRef.current) return;
    
    // 複数のボーンからの影響を計算
    let finalPosition = new THREE.Vector3();
    let finalQuaternion = new THREE.Quaternion();
    let totalWeight = 0;
    
    objectBindings.forEach((binding, index) => {
      const bone = bones.find(b => b.id === binding.boneId);
      if (!bone) return;
      
      const boneMatrix = getBoneWorldMatrix(binding.boneId);
      const bonePosition = new THREE.Vector3();
      const boneQuaternion = new THREE.Quaternion();
      const boneScale = new THREE.Vector3();
      
      boneMatrix.decompose(bonePosition, boneQuaternion, boneScale);
      
      // 人間モデルの場合は特別な処理
      if (isHumanModel) {
        // メッシュがボーン位置に正確に追従
        finalPosition.copy(bonePosition);
      } else {
        // ロボットモデルの場合（従来の処理）
        const meshInitialPos = new THREE.Vector3(...initialTransform.current.position);
        const rotatedOffset = meshInitialPos.clone();
        rotatedOffset.applyQuaternion(boneQuaternion);
        finalPosition.add(rotatedOffset.multiplyScalar(binding.weight));
      }
      
      if (index === 0) {
        finalQuaternion.copy(boneQuaternion);
      } else {
        finalQuaternion.slerp(boneQuaternion, binding.weight / (totalWeight + binding.weight));
      }
      
      totalWeight += binding.weight;
    });
    
    // 最終的な変換を適用
    if (totalWeight > 0) {
      if (isHumanModel) {
        // 人間モデルはウェイトで平均化しない
        meshRef.current.position.copy(finalPosition);
      } else {
        meshRef.current.position.copy(finalPosition.divideScalar(totalWeight));
      }
      meshRef.current.quaternion.copy(finalQuaternion);
    }
  });
  
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
    if (e.ctrlKey || e.metaKey) {
      dispatch(toggleMultiSelect(object.id));
    } else {
      dispatch(selectObject(object.id));
    }
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
            <AnimatedObject key={child.id} object={child} />
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
        position={objectBindings.length === 0 || !isPlaying ? object.position : [0, 0, 0]}
        rotation={objectBindings.length === 0 || !isPlaying ? object.rotation : [0, 0, 0]}
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
          emissive={object.material.emissive || (isSelected ? '#0066cc' : (isMultiSelected ? '#cc6600' : (hovered ? '#444444' : '#000000')))}
          emissiveIntensity={object.material.emissiveIntensity || (isSelected ? 0.3 : (isMultiSelected ? 0.2 : (hovered ? 0.1 : 0)))}
        />
      </mesh>
      
      {isSelected && !isPlaying && (
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

export default AnimatedObject;