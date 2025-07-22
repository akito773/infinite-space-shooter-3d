import React, { useRef, useEffect } from 'react';
import { useSelector } from 'react-redux';
import * as THREE from 'three';
import { Line } from '@react-three/drei';

function BindingLine({ startPos, endPos, weight }) {
  const opacity = weight * 0.8;
  const lineWidth = Math.max(1, weight * 3);
  
  return (
    <Line
      points={[startPos, endPos]}
      color="#ff00ff"
      lineWidth={lineWidth}
      transparent
      opacity={opacity}
      dashed={false}
    />
  );
}

function BindingVisualizer() {
  const objects = useSelector(state => state.scene.objects);
  const bones = useSelector(state => state.scene.bones);
  const bindings = useSelector(state => state.scene.bindings);
  const showBones = useSelector(state => state.scene.showBones);
  const editMode = useSelector(state => state.scene.editMode);
  
  if (!showBones || editMode !== 'bone' || bindings.length === 0) {
    return null;
  }
  
  const objectMap = new Map(objects.map(o => [o.id, o]));
  const boneMap = new Map(bones.map(b => [b.id, b]));
  
  // オブジェクトのワールド位置を計算
  const getObjectWorldPosition = (obj) => {
    const pos = new THREE.Vector3(...obj.position);
    let current = obj;
    
    // 親の変換を適用
    while (current.parent) {
      const parent = objectMap.get(current.parent);
      if (parent) {
        pos.add(new THREE.Vector3(...parent.position));
        current = parent;
      } else {
        break;
      }
    }
    
    return pos;
  };
  
  // ボーンのワールド位置を計算
  const getBoneWorldPosition = (bone) => {
    const pos = new THREE.Vector3(...bone.position);
    let current = bone;
    
    // 親の変換を適用
    while (current.parent) {
      const parent = boneMap.get(current.parent);
      if (parent) {
        pos.add(new THREE.Vector3(...parent.position));
        current = parent;
      } else {
        break;
      }
    }
    
    return pos;
  };
  
  return (
    <>
      {bindings.map(binding => {
        const obj = objectMap.get(binding.meshId);
        const bone = boneMap.get(binding.boneId);
        
        if (!obj || !bone) return null;
        
        const objPos = getObjectWorldPosition(obj);
        const bonePos = getBoneWorldPosition(bone);
        
        return (
          <BindingLine
            key={binding.id}
            startPos={objPos}
            endPos={bonePos}
            weight={binding.weight}
          />
        );
      })}
    </>
  );
}

export default BindingVisualizer;