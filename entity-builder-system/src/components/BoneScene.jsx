import React, { useRef, useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { TransformControls } from '@react-three/drei';
import { selectBone, updateBone } from '../store';
import { createBoneGizmo, BONE_COLORS } from '../utils/boneSystem';

function BoneObject({ boneData, allBones, onBoneRef }) {
  const gizmoRef = useRef();
  const groupRef = useRef();
  const dispatch = useDispatch();
  const selectedBoneId = useSelector(state => state.scene.selectedBoneId);
  const isSelected = selectedBoneId === boneData.id;
  
  useEffect(() => {
    if (isSelected && groupRef.current && onBoneRef) {
      onBoneRef(groupRef.current, boneData);
    }
  }, [isSelected, boneData, onBoneRef]);
  
  useEffect(() => {
    if (gizmoRef.current) {
      // ギズモの色を更新
      const color = isSelected ? BONE_COLORS.selected : 
                   !boneData.parent ? BONE_COLORS.root : 
                   BONE_COLORS.default;
      
      gizmoRef.current.material.color.setHex(color);
      if (gizmoRef.current.children[0]) {
        gizmoRef.current.children[0].material.color.setHex(color);
      }
    }
  }, [isSelected, boneData.parent]);
  
  const handleClick = (e) => {
    e.stopPropagation();
    dispatch(selectBone(boneData.id));
  };
  
  // 子ボーンを取得
  const children = boneData.children ? 
    allBones.filter(b => boneData.children.includes(b.id)) : [];
  
  return (
    <group
      ref={groupRef}
      position={boneData.position}
      rotation={boneData.rotation}
      onClick={handleClick}
    >
      <primitive 
        ref={gizmoRef}
        object={createBoneGizmo(
          { name: boneData.name }, 
          boneData.length,
          isSelected ? BONE_COLORS.selected : 
          !boneData.parent ? BONE_COLORS.root : 
          BONE_COLORS.default
        )} 
      />
      
      {children.map(child => (
        <BoneObject 
          key={child.id} 
          boneData={child} 
          allBones={allBones} 
          onBoneRef={onBoneRef}
        />
      ))}
    </group>
  );
}

function BoneScene() {
  const bones = useSelector(state => state.scene.bones);
  const showBones = useSelector(state => state.scene.showBones);
  const selectedBoneId = useSelector(state => state.scene.selectedBoneId);
  const transformMode = useSelector(state => state.scene.transformMode);
  const dispatch = useDispatch();
  
  const [selectedRef, setSelectedRef] = useState(null);
  const [selectedBoneData, setSelectedBoneData] = useState(null);
  
  // ルートボーンのみを取得（親を持たないボーン）
  const rootBones = bones.filter(bone => !bone.parent);
  
  const handleBoneRef = (ref, boneData) => {
    setSelectedRef(ref);
    setSelectedBoneData(boneData);
  };
  
  const handleTransformChange = () => {
    if (selectedRef && selectedBoneData) {
      const position = selectedRef.position.toArray();
      const rotation = selectedRef.rotation.toArray().slice(0, 3);
      
      dispatch(updateBone({
        id: selectedBoneData.id,
        updates: { position, rotation }
      }));
    }
  };
  
  if (!showBones || bones.length === 0) return null;
  
  return (
    <>
      {rootBones.map(bone => (
        <BoneObject 
          key={bone.id} 
          boneData={bone} 
          allBones={bones}
          onBoneRef={handleBoneRef}
        />
      ))}
      
      {selectedRef && selectedBoneData && (
        <TransformControls
          object={selectedRef}
          mode={transformMode === 'scale' ? 'translate' : transformMode}
          onChange={handleTransformChange}
        />
      )}
    </>
  );
}

export default BoneScene;