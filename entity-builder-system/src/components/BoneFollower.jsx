import React, { useRef, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// メッシュをボーンに追従させるコンポーネント
function BoneFollower() {
  const objects = useSelector(state => state.scene.objects);
  const bones = useSelector(state => state.scene.bones);
  const bindings = useSelector(state => state.scene.bindings);
  const isPlaying = useSelector(state => state.scene.isPlaying);
  
  // オブジェクトとボーンのマップ
  const objectMap = useRef(new Map());
  const boneMap = useRef(new Map());
  const originalTransforms = useRef(new Map());
  
  // 初期位置を保存
  useEffect(() => {
    objects.forEach(obj => {
      if (!originalTransforms.current.has(obj.id)) {
        originalTransforms.current.set(obj.id, {
          position: [...obj.position],
          rotation: [...obj.rotation],
          scale: [...obj.scale],
        });
      }
    });
  }, [objects]);
  
  // マップを更新
  useEffect(() => {
    objectMap.current = new Map(objects.map(o => [o.id, o]));
    boneMap.current = new Map(bones.map(b => [b.id, b]));
  }, [objects, bones]);
  
  // ボーンの世界変換を計算
  const getBoneWorldTransform = (boneId) => {
    const bone = boneMap.current.get(boneId);
    if (!bone) return null;
    
    const position = new THREE.Vector3(...bone.position);
    const rotation = new THREE.Euler(...bone.rotation);
    const quaternion = new THREE.Quaternion().setFromEuler(rotation);
    
    // 親ボーンの変換を適用
    let currentBone = bone;
    const parentPositions = [];
    const parentRotations = [];
    
    while (currentBone.parent) {
      const parent = boneMap.current.get(currentBone.parent);
      if (!parent) break;
      
      parentPositions.push(new THREE.Vector3(...parent.position));
      parentRotations.push(new THREE.Euler(...parent.rotation));
      currentBone = parent;
    }
    
    // 親から子へ変換を適用
    for (let i = parentPositions.length - 1; i >= 0; i--) {
      const parentQuat = new THREE.Quaternion().setFromEuler(parentRotations[i]);
      position.applyQuaternion(parentQuat);
      position.add(parentPositions[i]);
      quaternion.premultiply(parentQuat);
    }
    
    return { position, quaternion };
  };
  
  // フレームごとの更新
  useFrame(() => {
    if (!isPlaying || bindings.length === 0) return;
    
    // バインディングごとにメッシュを更新
    const meshTransforms = new Map();
    
    bindings.forEach(binding => {
      const obj = objectMap.current.get(binding.meshId);
      const bone = boneMap.current.get(binding.boneId);
      
      if (!obj || !bone) return;
      
      const boneTransform = getBoneWorldTransform(binding.boneId);
      if (!boneTransform) return;
      
      // 既存の変換または新規作成
      if (!meshTransforms.has(binding.meshId)) {
        meshTransforms.set(binding.meshId, {
          position: new THREE.Vector3(),
          quaternion: new THREE.Quaternion(),
          totalWeight: 0,
        });
      }
      
      const transform = meshTransforms.get(binding.meshId);
      
      // ウェイトに基づいて変換を加算
      const weightedPos = boneTransform.position.clone().multiplyScalar(binding.weight);
      transform.position.add(weightedPos);
      
      // クォータニオンの補間（簡易版）
      if (transform.totalWeight === 0) {
        transform.quaternion.copy(boneTransform.quaternion);
      } else {
        transform.quaternion.slerp(boneTransform.quaternion, binding.weight / (transform.totalWeight + binding.weight));
      }
      
      transform.totalWeight += binding.weight;
    });
    
    // 計算された変換を適用
    meshTransforms.forEach((transform, meshId) => {
      const obj = objectMap.current.get(meshId);
      if (!obj || transform.totalWeight === 0) return;
      
      // 元の位置からのオフセットを保持
      const original = originalTransforms.current.get(meshId);
      if (!original) return;
      
      // 正規化
      transform.position.divideScalar(transform.totalWeight);
      
      // 新しい位置と回転を設定
      const euler = new THREE.Euler().setFromQuaternion(transform.quaternion);
      
      // Redux storeを直接更新せず、Three.jsオブジェクトを直接操作
      // （パフォーマンスのため）
      const meshObject = objects.find(o => o.id === meshId);
      if (meshObject) {
        meshObject.position = transform.position.toArray();
        meshObject.rotation = euler.toArray();
      }
    });
  });
  
  return null;
}

export default BoneFollower;