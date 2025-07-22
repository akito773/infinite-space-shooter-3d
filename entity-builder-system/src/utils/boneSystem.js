import * as THREE from 'three';
import { v4 as uuidv4 } from 'uuid';

// ボーンの色定義
export const BONE_COLORS = {
  default: 0x00ff00,
  selected: 0xffff00,
  root: 0xff0000,
  ik: 0x00ffff,
};

// ボーンデータ構造
export function createBoneData(name, position = [0, 0, 0], rotation = [0, 0, 0], length = 1, parent = null) {
  return {
    id: uuidv4(),
    name,
    position,
    rotation,
    length,
    parent,
    children: [],
    bindToMesh: [],  // バインドされているメッシュのID
  };
}

// Three.jsボーンを作成
export function createThreeBone(boneData) {
  const bone = new THREE.Bone();
  bone.name = boneData.name;
  bone.position.set(...boneData.position);
  bone.rotation.set(...boneData.rotation);
  bone.userData = {
    id: boneData.id,
    length: boneData.length,
  };
  return bone;
}

// スケルトンヘルパーを作成
export function createSkeletonHelper(skeleton) {
  const helper = new THREE.SkeletonHelper(skeleton.bones[0]);
  helper.material.linewidth = 3;
  return helper;
}

// ロボット用プリセットボーン構造
export function generateRobotSkeleton() {
  const bones = [];
  
  // ルートボーン（腰）
  const root = createBoneData('Root', [0, 3, 0], [0, 0, 0], 0.5);
  bones.push(root);
  
  // === 脊椎 ===
  const spine1 = createBoneData('Spine1', [0, 0.5, 0], [0, 0, 0], 1.0, root.id);
  const spine2 = createBoneData('Spine2', [0, 1.0, 0], [0, 0, 0], 1.0, spine1.id);
  const spine3 = createBoneData('Spine3', [0, 1.0, 0], [0, 0, 0], 0.8, spine2.id);
  bones.push(spine1, spine2, spine3);
  
  // === 頭部 ===
  const neck = createBoneData('Neck', [0, 0.8, 0], [0, 0, 0], 0.3, spine3.id);
  const head = createBoneData('Head', [0, 0.3, 0], [0, 0, 0], 0.5, neck.id);
  bones.push(neck, head);
  
  // === 左腕 ===
  const leftClavicle = createBoneData('L_Clavicle', [-0.5, 0.5, 0], [0, 0, -0.2], 0.5, spine3.id);
  const leftShoulder = createBoneData('L_Shoulder', [-0.5, 0, 0], [0, 0, 0], 1.5, leftClavicle.id);
  const leftElbow = createBoneData('L_Elbow', [0, -1.5, 0], [0, 0, 0], 1.5, leftShoulder.id);
  const leftWrist = createBoneData('L_Wrist', [0, -1.5, 0], [0, 0, 0], 0.3, leftElbow.id);
  const leftHand = createBoneData('L_Hand', [0, -0.3, 0], [0, 0, 0], 0.5, leftWrist.id);
  bones.push(leftClavicle, leftShoulder, leftElbow, leftWrist, leftHand);
  
  // === 右腕 ===
  const rightClavicle = createBoneData('R_Clavicle', [0.5, 0.5, 0], [0, 0, 0.2], 0.5, spine3.id);
  const rightShoulder = createBoneData('R_Shoulder', [0.5, 0, 0], [0, 0, 0], 1.5, rightClavicle.id);
  const rightElbow = createBoneData('R_Elbow', [0, -1.5, 0], [0, 0, 0], 1.5, rightShoulder.id);
  const rightWrist = createBoneData('R_Wrist', [0, -1.5, 0], [0, 0, 0], 0.3, rightElbow.id);
  const rightHand = createBoneData('R_Hand', [0, -0.3, 0], [0, 0, 0], 0.5, rightWrist.id);
  bones.push(rightClavicle, rightShoulder, rightElbow, rightWrist, rightHand);
  
  // === 左脚 ===
  const leftHip = createBoneData('L_Hip', [-0.4, -0.5, 0], [0, 0, 0], 0.5, root.id);
  const leftThigh = createBoneData('L_Thigh', [0, -0.5, 0], [0, 0, 0], 2.0, leftHip.id);
  const leftKnee = createBoneData('L_Knee', [0, -2.0, 0], [0, 0, 0], 2.0, leftThigh.id);
  const leftAnkle = createBoneData('L_Ankle', [0, -2.0, 0], [0, 0, 0], 0.3, leftKnee.id);
  const leftFoot = createBoneData('L_Foot', [0, -0.3, 0.5], [-0.5, 0, 0], 0.5, leftAnkle.id);
  bones.push(leftHip, leftThigh, leftKnee, leftAnkle, leftFoot);
  
  // === 右脚 ===
  const rightHip = createBoneData('R_Hip', [0.4, -0.5, 0], [0, 0, 0], 0.5, root.id);
  const rightThigh = createBoneData('R_Thigh', [0, -0.5, 0], [0, 0, 0], 2.0, rightHip.id);
  const rightKnee = createBoneData('R_Knee', [0, -2.0, 0], [0, 0, 0], 2.0, rightThigh.id);
  const rightAnkle = createBoneData('R_Ankle', [0, -2.0, 0], [0, 0, 0], 0.3, rightKnee.id);
  const rightFoot = createBoneData('R_Foot', [0, -0.3, 0.5], [-0.5, 0, 0], 0.5, rightAnkle.id);
  bones.push(rightHip, rightThigh, rightKnee, rightAnkle, rightFoot);
  
  // 階層構造を設定
  bones.forEach(bone => {
    if (bone.parent) {
      const parentBone = bones.find(b => b.id === bone.parent);
      if (parentBone) {
        parentBone.children.push(bone.id);
      }
    }
  });
  
  return bones;
}

// ボーン階層をThree.jsオブジェクトに変換
export function createThreeSkeletonFromData(bonesData) {
  const boneMap = new Map();
  const bones = [];
  
  // 第1パス: すべてのボーンを作成
  bonesData.forEach(boneData => {
    const bone = createThreeBone(boneData);
    boneMap.set(boneData.id, bone);
    bones.push(bone);
  });
  
  // 第2パス: 階層を構築
  bonesData.forEach(boneData => {
    if (boneData.parent) {
      const bone = boneMap.get(boneData.id);
      const parentBone = boneMap.get(boneData.parent);
      if (bone && parentBone) {
        parentBone.add(bone);
      }
    }
  });
  
  // スケルトンを作成
  const skeleton = new THREE.Skeleton(bones);
  
  return { skeleton, boneMap, rootBone: bones[0] };
}

// メッシュにスケルトンをバインド
export function bindSkeletonToMesh(mesh, skeleton, boneMap, bonesData) {
  // スキンドメッシュに変換
  const skinnedMesh = new THREE.SkinnedMesh(
    mesh.geometry.clone(),
    mesh.material
  );
  
  skinnedMesh.name = mesh.name;
  skinnedMesh.position.copy(mesh.position);
  skinnedMesh.rotation.copy(mesh.rotation);
  skinnedMesh.scale.copy(mesh.scale);
  
  // ボーンをバインド
  skinnedMesh.bind(skeleton);
  
  // ウェイトを計算（簡易版 - 最も近いボーンに100%ウェイト）
  const position = mesh.geometry.attributes.position;
  const skinIndices = [];
  const skinWeights = [];
  
  for (let i = 0; i < position.count; i++) {
    const vertex = new THREE.Vector3(
      position.getX(i),
      position.getY(i),
      position.getZ(i)
    );
    
    // メッシュのワールド座標に変換
    vertex.applyMatrix4(mesh.matrixWorld);
    
    // 最も近いボーンを見つける
    let minDistance = Infinity;
    let closestBoneIndex = 0;
    
    skeleton.bones.forEach((bone, index) => {
      const boneWorldPos = new THREE.Vector3();
      bone.getWorldPosition(boneWorldPos);
      const distance = vertex.distanceTo(boneWorldPos);
      
      if (distance < minDistance) {
        minDistance = distance;
        closestBoneIndex = index;
      }
    });
    
    // スキンインデックスとウェイトを設定
    skinIndices.push(closestBoneIndex, 0, 0, 0);
    skinWeights.push(1, 0, 0, 0);
  }
  
  // ジオメトリにスキニング属性を追加
  skinnedMesh.geometry.setAttribute(
    'skinIndex',
    new THREE.Uint16BufferAttribute(skinIndices, 4)
  );
  skinnedMesh.geometry.setAttribute(
    'skinWeight',
    new THREE.Float32BufferAttribute(skinWeights, 4)
  );
  
  return skinnedMesh;
}

// ボーンギズモを作成
export function createBoneGizmo(bone, length = 1, color = BONE_COLORS.default) {
  const geometry = new THREE.ConeGeometry(0.1, length, 4);
  geometry.translate(0, length / 2, 0);
  geometry.rotateX(Math.PI);
  
  const material = new THREE.MeshBasicMaterial({
    color: color,
    wireframe: true,
    transparent: true,
    opacity: 0.8,
  });
  
  const gizmo = new THREE.Mesh(geometry, material);
  gizmo.name = `${bone.name}_gizmo`;
  
  // 球体ジョイント
  const jointGeometry = new THREE.SphereGeometry(0.08, 8, 6);
  const jointMaterial = new THREE.MeshBasicMaterial({
    color: color,
    transparent: true,
    opacity: 0.9,
  });
  const joint = new THREE.Mesh(jointGeometry, jointMaterial);
  gizmo.add(joint);
  
  return gizmo;
}

// IKチェーンの設定
export function setupIKChain(endBone, chainLength = 2) {
  const chain = [];
  let currentBone = endBone;
  
  for (let i = 0; i < chainLength && currentBone; i++) {
    chain.unshift(currentBone);
    currentBone = currentBone.parent;
  }
  
  return {
    chain,
    target: new THREE.Vector3(),
    pole: new THREE.Vector3(),
  };
}

// 簡易IKソルバー (CCD - Cyclic Coordinate Descent)
export function solveIK(ikChain, iterations = 10) {
  const { chain, target } = ikChain;
  if (chain.length < 2) return;
  
  const endEffector = chain[chain.length - 1];
  
  for (let iteration = 0; iteration < iterations; iteration++) {
    // 逆順でボーンを処理
    for (let i = chain.length - 2; i >= 0; i--) {
      const bone = chain[i];
      
      // ボーンの世界位置を取得
      const boneWorldPos = new THREE.Vector3();
      bone.getWorldPosition(boneWorldPos);
      
      // エンドエフェクタの世界位置を取得
      const effectorWorldPos = new THREE.Vector3();
      endEffector.getWorldPosition(effectorWorldPos);
      
      // ベクトルを計算
      const toEffector = effectorWorldPos.clone().sub(boneWorldPos).normalize();
      const toTarget = target.clone().sub(boneWorldPos).normalize();
      
      // 回転角度を計算
      const angle = toEffector.angleTo(toTarget);
      if (angle > 0.001) {
        const axis = toEffector.clone().cross(toTarget).normalize();
        
        // ローカル軸に変換
        const localAxis = axis.clone();
        bone.worldToLocal(localAxis);
        
        // 回転を適用
        bone.rotateOnAxis(localAxis, angle);
      }
    }
    
    // 収束チェック
    const effectorPos = new THREE.Vector3();
    endEffector.getWorldPosition(effectorPos);
    if (effectorPos.distanceTo(target) < 0.01) {
      break;
    }
  }
}