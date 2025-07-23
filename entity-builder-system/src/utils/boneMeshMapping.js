import { v4 as uuidv4 } from 'uuid';

// 人間用ボーンマッピング
export const HUMAN_BONE_MAPPING = {
  // 頭部
  'Head': { bone: 'Head', weight: 1.0 },
  'Eye_Left': { bone: 'Head', weight: 1.0 },
  'Eye_Right': { bone: 'Head', weight: 1.0 },
  'Pupil_Left': { bone: 'Head', weight: 1.0 },
  'Pupil_Right': { bone: 'Head', weight: 1.0 },
  'Nose': { bone: 'Head', weight: 1.0 },
  'Mouth': { bone: 'Head', weight: 1.0 },
  'Hair_Top': { bone: 'Head', weight: 1.0 },
  'Hair_Back': { bone: 'Head', weight: 0.8 },
  'Hair_Ponytail': { bone: 'Head', weight: 0.6 },
  'Hair_Bob': { bone: 'Head', weight: 1.0 },
  
  // 首
  'Neck': { bone: 'Neck', weight: 1.0 },
  
  // 胴体
  'Torso': { bone: 'Spine', weight: 1.0 },
  'Hip': { bone: 'Root', weight: 1.0 },
  
  // 左腕
  'UpperArm_Left': { bone: 'UpperArm_L', weight: 1.0 },
  'LowerArm_Left': { bone: 'LowerArm_L', weight: 1.0 },
  'Hand_Left': { bone: 'Hand_L', weight: 1.0 },
  
  // 右腕
  'UpperArm_Right': { bone: 'UpperArm_R', weight: 1.0 },
  'LowerArm_Right': { bone: 'LowerArm_R', weight: 1.0 },
  'Hand_Right': { bone: 'Hand_R', weight: 1.0 },
  
  // 左脚
  'Thigh_Left': { bone: 'Thigh_L', weight: 1.0 },
  'Shin_Left': { bone: 'Shin_L', weight: 1.0 },
  'Foot_Left': { bone: 'Foot_L', weight: 1.0 },
  
  // 右脚
  'Thigh_Right': { bone: 'Thigh_R', weight: 1.0 },
  'Shin_Right': { bone: 'Shin_R', weight: 1.0 },
  'Foot_Right': { bone: 'Foot_R', weight: 1.0 },
};

// ロボットパーツとボーンのマッピング定義
export const ROBOT_BONE_MAPPING = {
  // 頭部
  'Head_Main': { bone: 'Head', weight: 1.0 },
  'Visor': { bone: 'Head', weight: 1.0 },
  'Antenna_Left': { bone: 'Head', weight: 1.0 },
  'Antenna_Right': { bone: 'Head', weight: 1.0 },
  
  // 胴体
  'Chest_Main': { bone: 'Spine3', weight: 1.0 },
  'Chest_Armor': { bone: 'Spine3', weight: 1.0 },
  'Core_Unit': { bone: 'Spine3', weight: 1.0 },
  'Abdomen': { bone: 'Spine1', weight: 1.0 },
  'Torso': { bone: 'Spine2', weight: 1.0 },
  
  // 腰
  'Pelvis': { bone: 'Root', weight: 1.0 },
  
  // 左腕
  'Left_Shoulder': { bone: 'L_Clavicle', weight: 0.7, secondaryBone: 'L_Shoulder', secondaryWeight: 0.3 },
  'Left_Shoulder_Armor': { bone: 'L_Clavicle', weight: 0.8, secondaryBone: 'L_Shoulder', secondaryWeight: 0.2 },
  'Left_Upper_Arm': { bone: 'L_Shoulder', weight: 0.8, secondaryBone: 'L_Elbow', secondaryWeight: 0.2 },
  'Left_Elbow': { bone: 'L_Elbow', weight: 1.0 },
  'Left_Forearm': { bone: 'L_Elbow', weight: 0.8, secondaryBone: 'L_Wrist', secondaryWeight: 0.2 },
  'Left_Hand': { bone: 'L_Hand', weight: 1.0 },
  
  // 右腕
  'Right_Shoulder': { bone: 'R_Clavicle', weight: 0.7, secondaryBone: 'R_Shoulder', secondaryWeight: 0.3 },
  'Right_Shoulder_Armor': { bone: 'R_Clavicle', weight: 0.8, secondaryBone: 'R_Shoulder', secondaryWeight: 0.2 },
  'Right_Upper_Arm': { bone: 'R_Shoulder', weight: 0.8, secondaryBone: 'R_Elbow', secondaryWeight: 0.2 },
  'Right_Elbow': { bone: 'R_Elbow', weight: 1.0 },
  'Right_Forearm': { bone: 'R_Elbow', weight: 0.8, secondaryBone: 'R_Wrist', secondaryWeight: 0.2 },
  'Right_Hand': { bone: 'R_Hand', weight: 1.0 },
  
  // 左脚
  'Left_Hip': { bone: 'L_Hip', weight: 1.0 },
  'Left_Thigh': { bone: 'L_Thigh', weight: 0.8, secondaryBone: 'L_Knee', secondaryWeight: 0.2 },
  'Left_Knee': { bone: 'L_Knee', weight: 1.0 },
  'Left_Shin': { bone: 'L_Knee', weight: 0.8, secondaryBone: 'L_Ankle', secondaryWeight: 0.2 },
  'Left_Foot': { bone: 'L_Foot', weight: 1.0 },
  
  // 右脚
  'Right_Hip': { bone: 'R_Hip', weight: 1.0 },
  'Right_Thigh': { bone: 'R_Thigh', weight: 0.8, secondaryBone: 'R_Knee', secondaryWeight: 0.2 },
  'Right_Knee': { bone: 'R_Knee', weight: 1.0 },
  'Right_Shin': { bone: 'R_Knee', weight: 0.8, secondaryBone: 'R_Ankle', secondaryWeight: 0.2 },
  'Right_Foot': { bone: 'R_Foot', weight: 1.0 },
  
  // バックパック
  'Backpack': { bone: 'Spine3', weight: 0.7, secondaryBone: 'Spine2', secondaryWeight: 0.3 },
  'Left_Thruster': { bone: 'Spine3', weight: 0.8, secondaryBone: 'Spine2', secondaryWeight: 0.2 },
  'Right_Thruster': { bone: 'Spine3', weight: 0.8, secondaryBone: 'Spine2', secondaryWeight: 0.2 },
};

// バインディング情報を作成
export function createBindingInfo(meshId, boneId, weight = 1.0) {
  return {
    id: uuidv4(),
    meshId,
    boneId,
    weight,
  };
}

// 自動バインディング生成
export function generateAutoBindings(objects, bones) {
  const bindings = [];
  const boneMap = new Map(bones.map(b => [b.name, b]));
  
  // ロボットか人間かを判定
  const isHuman = objects.some(obj => obj.name === 'Head' || obj.name === 'Torso');
  const mappingTable = isHuman ? HUMAN_BONE_MAPPING : ROBOT_BONE_MAPPING;
  
  objects.forEach(obj => {
    const mapping = mappingTable[obj.name];
    if (mapping) {
      // プライマリボーン
      const primaryBone = boneMap.get(mapping.bone);
      if (primaryBone) {
        bindings.push(createBindingInfo(obj.id, primaryBone.id, mapping.weight));
      }
      
      // セカンダリボーン（ある場合）
      if (mapping.secondaryBone) {
        const secondaryBone = boneMap.get(mapping.secondaryBone);
        if (secondaryBone) {
          bindings.push(createBindingInfo(obj.id, secondaryBone.id, mapping.secondaryWeight));
        }
      }
    }
  });
  
  // 人間の場合、髪型パーツも頭ボーンにバインド
  if (isHuman) {
    const headBone = boneMap.get('Head');
    if (headBone) {
      objects.forEach(obj => {
        if (obj.name.startsWith('Hair_')) {
          bindings.push(createBindingInfo(obj.id, headBone.id, 1.0));
        }
      });
    }
  }
  
  return bindings;
}

// メッシュの親子関係を考慮した自動バインディング
export function generateHierarchicalBindings(objects, bones) {
  const bindings = [];
  const boneMap = new Map(bones.map(b => [b.name, b]));
  const objectMap = new Map(objects.map(o => [o.id, o]));
  
  // オブジェクトの階層を辿ってボーンを探す
  const findBestBone = (obj) => {
    // 直接マッピングがある場合
    const mapping = ROBOT_BONE_MAPPING[obj.name];
    if (mapping) {
      return boneMap.get(mapping.bone);
    }
    
    // 親オブジェクトのボーンを継承
    if (obj.parent) {
      const parentObj = objectMap.get(obj.parent);
      if (parentObj) {
        return findBestBone(parentObj);
      }
    }
    
    return null;
  };
  
  objects.forEach(obj => {
    const bone = findBestBone(obj);
    if (bone) {
      bindings.push(createBindingInfo(obj.id, bone.id, 1.0));
    }
  });
  
  return bindings;
}

// バインディング情報の検証
export function validateBindings(bindings, objects, bones) {
  const objectIds = new Set(objects.map(o => o.id));
  const boneIds = new Set(bones.map(b => b.id));
  const errors = [];
  
  bindings.forEach(binding => {
    if (!objectIds.has(binding.meshId)) {
      errors.push(`Invalid mesh ID: ${binding.meshId}`);
    }
    if (!boneIds.has(binding.boneId)) {
      errors.push(`Invalid bone ID: ${binding.boneId}`);
    }
    if (binding.weight < 0 || binding.weight > 1) {
      errors.push(`Invalid weight for binding ${binding.id}: ${binding.weight}`);
    }
  });
  
  return { valid: errors.length === 0, errors };
}

// ウェイトの正規化（メッシュごとの合計を1.0にする）
export function normalizeWeights(bindings) {
  const meshWeights = new Map();
  
  // メッシュごとのウェイト合計を計算
  bindings.forEach(binding => {
    if (!meshWeights.has(binding.meshId)) {
      meshWeights.set(binding.meshId, []);
    }
    meshWeights.get(binding.meshId).push(binding);
  });
  
  // 各メッシュのウェイトを正規化
  meshWeights.forEach((meshBindings) => {
    const totalWeight = meshBindings.reduce((sum, b) => sum + b.weight, 0);
    if (totalWeight > 0) {
      meshBindings.forEach(binding => {
        binding.weight = binding.weight / totalWeight;
      });
    }
  });
  
  return bindings;
}