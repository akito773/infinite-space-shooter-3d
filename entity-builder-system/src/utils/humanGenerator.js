import * as THREE from 'three';
import { v4 as uuidv4 } from 'uuid';

// 人体プロポーション定数（より正確な人体構造）
const HUMAN_PROPORTIONS = {
  // 全体
  totalHeight: 8.0,     // 全身の高さ
  
  // 頭部
  headHeight: 1.0,      // 頭の高さ
  headWidth: 0.7,       // 頭の幅
  neckLength: 0.2,      // 首の長さ
  neckRadius: 0.15,     // 首の太さ
  
  // 胴体
  shoulderHeight: 6.8,  // 地面から肩までの高さ
  shoulderWidth: 1.6,   // 肩幅（左右の肩関節の距離）
  chestWidth: 1.4,      // 胸幅
  chestDepth: 0.8,      // 胸の奥行き
  torsoLength: 2.2,     // 胴体の長さ（肩から腰まで）
  hipWidth: 1.2,        // 腰幅
  hipHeight: 4.2,       // 地面から腰までの高さ
  
  // 腕
  upperArmLength: 1.4,  // 上腕の長さ
  upperArmRadius: 0.12, // 上腕の太さ
  elbowHeight: 5.4,     // 地面から肘までの高さ
  lowerArmLength: 1.2,  // 前腕の長さ
  lowerArmRadius: 0.10, // 前腕の太さ
  handLength: 0.2,      // 手の長さ
  handWidth: 0.15,      // 手の幅
  
  // 脚
  thighLength: 2.0,     // 太ももの長さ
  thighRadius: 0.18,    // 太ももの太さ
  kneeHeight: 2.2,      // 地面から膝までの高さ
  shinLength: 1.8,      // すねの長さ
  shinRadius: 0.14,     // すねの太さ
  footHeight: 0.15,     // 足の高さ
  footLength: 0.35,     // 足の長さ
  footWidth: 0.15,      // 足の幅
};

// 体型バリエーション
export const BODY_TYPES = {
  standard: { scale: 1.0, shoulderMod: 1.0, hipMod: 1.0 },
  athletic: { scale: 1.1, shoulderMod: 1.2, hipMod: 0.9 },
  slim: { scale: 0.9, shoulderMod: 0.85, hipMod: 0.85 },
  strong: { scale: 1.2, shoulderMod: 1.3, hipMod: 1.1 },
};

// 髪型タイプ
export const HAIR_TYPES = {
  short: 'short',
  long: 'long',
  ponytail: 'ponytail',
  spiky: 'spiky',
  bob: 'bob',
  none: 'none',
};

// カラーパレット
const SKIN_COLORS = ['#fdbcb4', '#f5deb3', '#d2b48c', '#bc987e', '#8d5524', '#5d4e37'];
const HAIR_COLORS = ['#000000', '#4a2c17', '#8b4513', '#d2691e', '#ffd700', '#dc143c', '#4169e1', '#32cd32'];
const EYE_COLORS = ['#4169e1', '#32cd32', '#8b4513', '#708090', '#8a2be2'];

// 人間生成関数
export function generateHuman(options = {}) {
  const {
    bodyType = 'standard',
    hairType = 'short',
    skinColor = SKIN_COLORS[1],
    hairColor = HAIR_COLORS[1],
    eyeColor = EYE_COLORS[0],
    clothing = 'casual',
    gender = 'neutral'
  } = options;
  
  const bodyConfig = BODY_TYPES[bodyType] || BODY_TYPES.standard;
  const parts = [];
  
  // ヘッド（頭）
  const headId = uuidv4();
  const headY = HUMAN_PROPORTIONS.totalHeight - HUMAN_PROPORTIONS.headHeight * 0.5;
  parts.push({
    id: headId,
    name: 'Head',
    type: 'object',
    geometry: {
      type: 'sphere',
      args: [HUMAN_PROPORTIONS.headHeight * 0.5, 16, 16],
    },
    position: [0, headY, 0],
    rotation: [0, 0, 0],
    scale: [HUMAN_PROPORTIONS.headWidth / HUMAN_PROPORTIONS.headHeight, 1.0, 0.85],
    material: {
      color: skinColor,
      metalness: 0,
      roughness: 0.8,
    },
    parent: null,
    children: []
  });
  
  // 顔のパーツ（頭部に対する相対位置）
  const faceZ = HUMAN_PROPORTIONS.headHeight * 0.4; // 顔は頭の前面
  
  // 目（左）
  const leftEyeId = uuidv4();
  parts.push({
    id: leftEyeId,
    name: 'Eye_Left',
    type: 'object',
    geometry: {
      type: 'sphere',
      args: [0.08, 8, 8],
    },
    position: [-0.15, headY + 0.05, faceZ],
    rotation: [0, 0, 0],
    scale: [0.8, 1, 0.6],
    material: {
      color: '#ffffff',
      metalness: 0.1,
      roughness: 0.2,
    },
    parent: null,
    children: []
  });
  
  // 瞳（左）
  const leftPupilId = uuidv4();
  parts.push({
    id: leftPupilId,
    name: 'Pupil_Left',
    type: 'object',
    geometry: {
      type: 'sphere',
      args: [0.04, 8, 8],
    },
    position: [-0.15, headY + 0.05, faceZ + 0.06],
    rotation: [0, 0, 0],
    scale: [1, 1, 0.5],
    material: {
      color: eyeColor,
      metalness: 0.3,
      roughness: 0.1,
    },
    parent: null,
    children: []
  });
  
  // 目（右）
  const rightEyeId = uuidv4();
  parts.push({
    id: rightEyeId,
    name: 'Eye_Right',
    type: 'object',
    geometry: {
      type: 'sphere',
      args: [0.08, 8, 8],
    },
    position: [0.15, headY + 0.05, faceZ],
    rotation: [0, 0, 0],
    scale: [0.8, 1, 0.6],
    material: {
      color: '#ffffff',
      metalness: 0.1,
      roughness: 0.2,
    },
    parent: null,
    children: []
  });
  
  // 瞳（右）
  const rightPupilId = uuidv4();
  parts.push({
    id: rightPupilId,
    name: 'Pupil_Right',
    type: 'object',
    geometry: {
      type: 'sphere',
      args: [0.04, 8, 8],
    },
    position: [0.15, headY + 0.05, faceZ + 0.06],
    rotation: [0, 0, 0],
    scale: [1, 1, 0.5],
    material: {
      color: eyeColor,
      metalness: 0.3,
      roughness: 0.1,
    },
    parent: null,
    children: []
  });
  
  // 鼻
  const noseId = uuidv4();
  parts.push({
    id: noseId,
    name: 'Nose',
    type: 'object',
    geometry: {
      type: 'cone',
      args: [0.06, 0.15, 4],
    },
    position: [0, headY - 0.05, faceZ + 0.05],
    rotation: [-Math.PI / 2, 0, 0],
    scale: [1, 0.7, 1],
    material: {
      color: skinColor,
      metalness: 0,
      roughness: 0.8,
    },
    parent: null,
    children: []
  });
  
  // 口
  const mouthId = uuidv4();
  parts.push({
    id: mouthId,
    name: 'Mouth',
    type: 'object',
    geometry: {
      type: 'box',
      args: [0.2, 0.05, 0.1],
    },
    position: [0, headY - 0.2, faceZ],
    rotation: [0, 0, 0],
    scale: [1, 1, 1],
    material: {
      color: '#dc143c',
      metalness: 0.1,
      roughness: 0.7,
    },
    parent: null,
    children: []
  });
  
  // 首
  const neckId = uuidv4();
  const neckY = headY - HUMAN_PROPORTIONS.headHeight * 0.5 - HUMAN_PROPORTIONS.neckLength * 0.5;
  parts.push({
    id: neckId,
    name: 'Neck',
    type: 'object',
    geometry: {
      type: 'cylinder',
      args: [HUMAN_PROPORTIONS.neckRadius, HUMAN_PROPORTIONS.neckRadius, HUMAN_PROPORTIONS.neckLength, 8],
    },
    position: [0, neckY, 0],
    rotation: [0, 0, 0],
    scale: [1, 1, 1],
    material: {
      color: skinColor,
      metalness: 0,
      roughness: 0.8,
    },
    parent: null,
    children: []
  });
  
  // 胴体（胸部）
  const torsoId = uuidv4();
  const torsoY = HUMAN_PROPORTIONS.shoulderHeight - HUMAN_PROPORTIONS.torsoLength * 0.5;
  parts.push({
    id: torsoId,
    name: 'Torso',
    type: 'object',
    geometry: {
      type: 'box',
      args: [
        HUMAN_PROPORTIONS.chestWidth * bodyConfig.shoulderMod,
        HUMAN_PROPORTIONS.torsoLength,
        HUMAN_PROPORTIONS.chestDepth
      ],
    },
    position: [0, torsoY, 0],
    rotation: [0, 0, 0],
    scale: [1, 1, 1],
    material: {
      color: clothing === 'casual' ? '#4169e1' : '#333333',
      metalness: 0,
      roughness: 0.9,
    },
    parent: null,
    children: []
  });
  
  // 腰
  const hipId = uuidv4();
  const hipY = HUMAN_PROPORTIONS.hipHeight;
  parts.push({
    id: hipId,
    name: 'Hip',
    type: 'object',
    geometry: {
      type: 'box',
      args: [
        HUMAN_PROPORTIONS.hipWidth * bodyConfig.hipMod,
        0.4,
        HUMAN_PROPORTIONS.chestDepth * 0.8
      ],
    },
    position: [0, hipY, 0],
    rotation: [0, 0, 0],
    scale: [1, 1, 1],
    material: {
      color: clothing === 'casual' ? '#000080' : '#1a1a1a',
      metalness: 0,
      roughness: 0.9,
    },
    parent: null,
    children: []
  });
  
  // 左腕（上腕）
  const leftShoulderX = -HUMAN_PROPORTIONS.shoulderWidth * bodyConfig.shoulderMod * 0.5;
  const shoulderY = HUMAN_PROPORTIONS.shoulderHeight;
  const leftUpperArmId = uuidv4();
  parts.push({
    id: leftUpperArmId,
    name: 'UpperArm_Left',
    type: 'object',
    geometry: {
      type: 'cylinder',
      args: [
        HUMAN_PROPORTIONS.upperArmRadius,
        HUMAN_PROPORTIONS.upperArmRadius * 0.9,
        HUMAN_PROPORTIONS.upperArmLength,
        8
      ],
    },
    position: [
      leftShoulderX,
      shoulderY - HUMAN_PROPORTIONS.upperArmLength * 0.5,
      0
    ],
    rotation: [0, 0, 0], // 垂直に下向き
    scale: [1, 1, 1],
    material: {
      color: clothing === 'casual' ? '#4169e1' : skinColor,
      metalness: 0,
      roughness: 0.8,
    },
    parent: null,
    children: []
  });
  
  // 左腕（前腕）
  const leftElbowY = shoulderY - HUMAN_PROPORTIONS.upperArmLength;
  const leftLowerArmId = uuidv4();
  parts.push({
    id: leftLowerArmId,
    name: 'LowerArm_Left',
    type: 'object',
    geometry: {
      type: 'cylinder',
      args: [
        HUMAN_PROPORTIONS.lowerArmRadius,
        HUMAN_PROPORTIONS.lowerArmRadius * 0.8,
        HUMAN_PROPORTIONS.lowerArmLength,
        8
      ],
    },
    position: [
      leftShoulderX,
      leftElbowY - HUMAN_PROPORTIONS.lowerArmLength * 0.5,
      0
    ],
    rotation: [0, 0, 0], // 垂直に下向き
    scale: [1, 1, 1],
    material: {
      color: skinColor,
      metalness: 0,
      roughness: 0.8,
    },
    parent: null,
    children: []
  });
  
  // 左手
  const leftHandY = leftElbowY - HUMAN_PROPORTIONS.lowerArmLength;
  const leftHandId = uuidv4();
  parts.push({
    id: leftHandId,
    name: 'Hand_Left',
    type: 'object',
    geometry: {
      type: 'sphere',
      args: [HUMAN_PROPORTIONS.handLength * 0.5, 8, 8],
    },
    position: [
      leftShoulderX,
      leftHandY - HUMAN_PROPORTIONS.handLength * 0.5,
      0
    ],
    rotation: [0, 0, 0],
    scale: [HUMAN_PROPORTIONS.handWidth / HUMAN_PROPORTIONS.handLength, 1, 0.6],
    material: {
      color: skinColor,
      metalness: 0,
      roughness: 0.8,
    },
    parent: null,
    children: []
  });
  
  // 右腕（上腕）
  const rightShoulderX = HUMAN_PROPORTIONS.shoulderWidth * bodyConfig.shoulderMod * 0.5;
  const rightUpperArmId = uuidv4();
  parts.push({
    id: rightUpperArmId,
    name: 'UpperArm_Right',
    type: 'object',
    geometry: {
      type: 'cylinder',
      args: [
        HUMAN_PROPORTIONS.upperArmRadius,
        HUMAN_PROPORTIONS.upperArmRadius * 0.9,
        HUMAN_PROPORTIONS.upperArmLength,
        8
      ],
    },
    position: [
      rightShoulderX,
      shoulderY - HUMAN_PROPORTIONS.upperArmLength * 0.5,
      0
    ],
    rotation: [0, 0, 0], // 垂直に下向き
    scale: [1, 1, 1],
    material: {
      color: clothing === 'casual' ? '#4169e1' : skinColor,
      metalness: 0,
      roughness: 0.8,
    },
    parent: null,
    children: []
  });
  
  // 右腕（前腕）
  const rightElbowY = shoulderY - HUMAN_PROPORTIONS.upperArmLength;
  const rightLowerArmId = uuidv4();
  parts.push({
    id: rightLowerArmId,
    name: 'LowerArm_Right',
    type: 'object',
    geometry: {
      type: 'cylinder',
      args: [
        HUMAN_PROPORTIONS.lowerArmRadius,
        HUMAN_PROPORTIONS.lowerArmRadius * 0.8,
        HUMAN_PROPORTIONS.lowerArmLength,
        8
      ],
    },
    position: [
      rightShoulderX,
      rightElbowY - HUMAN_PROPORTIONS.lowerArmLength * 0.5,
      0
    ],
    rotation: [0, 0, 0], // 垂直に下向き
    scale: [1, 1, 1],
    material: {
      color: skinColor,
      metalness: 0,
      roughness: 0.8,
    },
    parent: null,
    children: []
  });
  
  // 右手
  const rightHandY = rightElbowY - HUMAN_PROPORTIONS.lowerArmLength;
  const rightHandId = uuidv4();
  parts.push({
    id: rightHandId,
    name: 'Hand_Right',
    type: 'object',
    geometry: {
      type: 'sphere',
      args: [HUMAN_PROPORTIONS.handLength * 0.5, 8, 8],
    },
    position: [
      rightShoulderX,
      rightHandY - HUMAN_PROPORTIONS.handLength * 0.5,
      0
    ],
    rotation: [0, 0, 0],
    scale: [HUMAN_PROPORTIONS.handWidth / HUMAN_PROPORTIONS.handLength, 1, 0.6],
    material: {
      color: skinColor,
      metalness: 0,
      roughness: 0.8,
    },
    parent: null,
    children: []
  });
  
  // 左脚（太もも）
  const leftThighId = uuidv4();
  parts.push({
    id: leftThighId,
    name: 'Thigh_Left',
    type: 'object',
    geometry: {
      type: 'cylinder',
      args: [0.15, 0.12, 2, 8],
    },
    position: [-HUMAN_PROPORTIONS.hipWidth * bodyConfig.hipMod * 0.3, HUMAN_PROPORTIONS.height - 5.5, 0],
    rotation: [0, 0, 0],
    scale: [1, 1, 1],
    material: {
      color: clothing === 'casual' ? '#000080' : '#1a1a1a',
      metalness: 0,
      roughness: 0.9,
    },
    parent: null,
    children: []
  });
  
  // 左脚（すね）
  const leftShinId = uuidv4();
  parts.push({
    id: leftShinId,
    name: 'Shin_Left',
    type: 'object',
    geometry: {
      type: 'cylinder',
      args: [0.12, 0.10, 1.8, 8],
    },
    position: [-HUMAN_PROPORTIONS.hipWidth * bodyConfig.hipMod * 0.3, HUMAN_PROPORTIONS.height - 7.4, 0],
    rotation: [0, 0, 0],
    scale: [1, 1, 1],
    material: {
      color: skinColor,
      metalness: 0,
      roughness: 0.8,
    },
    parent: null,
    children: []
  });
  
  // 左足
  const leftFootId = uuidv4();
  parts.push({
    id: leftFootId,
    name: 'Foot_Left',
    type: 'object',
    geometry: {
      type: 'box',
      args: [0.25, 0.1, 0.4],
    },
    position: [-HUMAN_PROPORTIONS.hipWidth * bodyConfig.hipMod * 0.3, 0.05, 0.1],
    rotation: [0, 0, 0],
    scale: [1, 1, 1],
    material: {
      color: '#333333',
      metalness: 0,
      roughness: 0.9,
    },
    parent: null,
    children: []
  });
  
  // 右脚（太もも）
  const rightThighId = uuidv4();
  parts.push({
    id: rightThighId,
    name: 'Thigh_Right',
    type: 'object',
    geometry: {
      type: 'cylinder',
      args: [0.15, 0.12, 2, 8],
    },
    position: [HUMAN_PROPORTIONS.hipWidth * bodyConfig.hipMod * 0.3, HUMAN_PROPORTIONS.height - 5.5, 0],
    rotation: [0, 0, 0],
    scale: [1, 1, 1],
    material: {
      color: clothing === 'casual' ? '#000080' : '#1a1a1a',
      metalness: 0,
      roughness: 0.9,
    },
    parent: null,
    children: []
  });
  
  // 右脚（すね）
  const rightShinId = uuidv4();
  parts.push({
    id: rightShinId,
    name: 'Shin_Right',
    type: 'object',
    geometry: {
      type: 'cylinder',
      args: [0.12, 0.10, 1.8, 8],
    },
    position: [HUMAN_PROPORTIONS.hipWidth * bodyConfig.hipMod * 0.3, HUMAN_PROPORTIONS.height - 7.4, 0],
    rotation: [0, 0, 0],
    scale: [1, 1, 1],
    material: {
      color: skinColor,
      metalness: 0,
      roughness: 0.8,
    },
    parent: null,
    children: []
  });
  
  // 右足
  const rightFootId = uuidv4();
  parts.push({
    id: rightFootId,
    name: 'Foot_Right',
    type: 'object',
    geometry: {
      type: 'box',
      args: [0.25, 0.1, 0.4],
    },
    position: [HUMAN_PROPORTIONS.hipWidth * bodyConfig.hipMod * 0.3, 0.05, 0.1],
    rotation: [0, 0, 0],
    scale: [1, 1, 1],
    material: {
      color: '#333333',
      metalness: 0,
      roughness: 0.9,
    },
    parent: null,
    children: []
  });
  
  // 髪型を追加
  if (hairType !== 'none') {
    const hairParts = generateHair(hairType, hairColor, headId);
    parts.push(...hairParts);
  }
  
  return parts;
}

// 髪型生成関数
function generateHair(type, color, parentId) {
  const hairParts = [];
  
  switch (type) {
    case 'short':
      // ショートヘア
      hairParts.push({
        id: uuidv4(),
        name: 'Hair_Top',
        type: 'object',
        geometry: {
          type: 'sphere',
          args: [0.55, 16, 16],
        },
        position: [0, HUMAN_PROPORTIONS.height - 0.4, 0],
        rotation: [0, 0, 0],
        scale: [1, 0.8, 1],
        material: {
          color: color,
          metalness: 0.1,
          roughness: 0.9,
        },
        parent: null,
        children: []
      });
      break;
      
    case 'long':
      // ロングヘア
      hairParts.push({
        id: uuidv4(),
        name: 'Hair_Top',
        type: 'object',
        geometry: {
          type: 'sphere',
          args: [0.55, 16, 16],
        },
        position: [0, HUMAN_PROPORTIONS.height - 0.4, 0],
        rotation: [0, 0, 0],
        scale: [1, 0.8, 1],
        material: {
          color: color,
          metalness: 0.1,
          roughness: 0.9,
        },
        parent: null,
        children: []
      });
      
      // 後ろ髪
      hairParts.push({
        id: uuidv4(),
        name: 'Hair_Back',
        type: 'object',
        geometry: {
          type: 'cylinder',
          args: [0.4, 0.2, 1.5, 8],
        },
        position: [0, HUMAN_PROPORTIONS.height - 1.5, -0.2],
        rotation: [0, 0, 0],
        scale: [1, 1, 0.5],
        material: {
          color: color,
          metalness: 0.1,
          roughness: 0.9,
        },
        parent: null,
        children: []
      });
      break;
      
    case 'ponytail':
      // ポニーテール
      hairParts.push({
        id: uuidv4(),
        name: 'Hair_Top',
        type: 'object',
        geometry: {
          type: 'sphere',
          args: [0.5, 16, 16],
        },
        position: [0, HUMAN_PROPORTIONS.height - 0.4, 0],
        rotation: [0, 0, 0],
        scale: [1, 0.7, 1],
        material: {
          color: color,
          metalness: 0.1,
          roughness: 0.9,
        },
        parent: null,
        children: []
      });
      
      // ポニーテール部分
      hairParts.push({
        id: uuidv4(),
        name: 'Hair_Ponytail',
        type: 'object',
        geometry: {
          type: 'cylinder',
          args: [0.15, 0.05, 1.2, 6],
        },
        position: [0, HUMAN_PROPORTIONS.height - 0.8, -0.4],
        rotation: [Math.PI / 6, 0, 0],
        scale: [1, 1, 1],
        material: {
          color: color,
          metalness: 0.1,
          roughness: 0.9,
        },
        parent: null,
        children: []
      });
      break;
      
    case 'spiky':
      // スパイキーヘア
      for (let i = 0; i < 5; i++) {
        const angle = (i / 5) * Math.PI * 2;
        hairParts.push({
          id: uuidv4(),
          name: `Hair_Spike_${i}`,
          type: 'object',
          geometry: {
            type: 'cone',
            args: [0.1, 0.4, 4],
          },
          position: [
            Math.cos(angle) * 0.3,
            HUMAN_PROPORTIONS.height - 0.2,
            Math.sin(angle) * 0.3
          ],
          rotation: [-Math.PI / 6, angle, 0],
          scale: [1, 1, 1],
          material: {
            color: color,
            metalness: 0.1,
            roughness: 0.9,
          },
          parent: null,
          children: []
        });
      }
      break;
      
    case 'bob':
      // ボブヘア
      hairParts.push({
        id: uuidv4(),
        name: 'Hair_Bob',
        type: 'object',
        geometry: {
          type: 'sphere',
          args: [0.6, 16, 16],
        },
        position: [0, HUMAN_PROPORTIONS.height - 0.5, 0],
        rotation: [0, 0, 0],
        scale: [1, 1.2, 1],
        material: {
          color: color,
          metalness: 0.1,
          roughness: 0.9,
        },
        parent: null,
        children: []
      });
      break;
  }
  
  return hairParts;
}

// 人間用ボーンスケルトン生成
export function generateHumanSkeleton() {
  const bones = [];
  
  // ルートボーン（腰）
  const rootId = uuidv4();
  bones.push({
    id: rootId,
    name: 'Root',
    position: [0, HUMAN_PROPORTIONS.height - 4.25, 0],
    rotation: [0, 0, 0],
    length: 0.5,
    parent: null,
    children: []
  });
  
  // 脊椎
  const spineId = uuidv4();
  bones.push({
    id: spineId,
    name: 'Spine',
    position: [0, 0.5, 0],
    rotation: [0, 0, 0],
    length: 2.0,
    parent: rootId,
    children: []
  });
  bones.find(b => b.id === rootId).children.push(spineId);
  
  // 首
  const neckId = uuidv4();
  bones.push({
    id: neckId,
    name: 'Neck',
    position: [0, 2.0, 0],
    rotation: [0, 0, 0],
    length: 0.3,
    parent: spineId,
    children: []
  });
  bones.find(b => b.id === spineId).children.push(neckId);
  
  // 頭
  const headId = uuidv4();
  bones.push({
    id: headId,
    name: 'Head',
    position: [0, 0.3, 0],
    rotation: [0, 0, 0],
    length: 0.5,
    parent: neckId,
    children: []
  });
  bones.find(b => b.id === neckId).children.push(headId);
  
  // 左肩
  const leftShoulerId = uuidv4();
  bones.push({
    id: leftShoulerId,
    name: 'Shoulder_L',
    position: [-0.5, 1.8, 0],
    rotation: [0, 0, Math.PI / 2],
    length: 0.5,
    parent: spineId,
    children: []
  });
  bones.find(b => b.id === spineId).children.push(leftShoulerId);
  
  // 左上腕
  const leftUpperArmId = uuidv4();
  bones.push({
    id: leftUpperArmId,
    name: 'UpperArm_L',
    position: [-0.5, 0, 0],
    rotation: [0, 0, 0],
    length: 1.5,
    parent: leftShoulerId,
    children: []
  });
  bones.find(b => b.id === leftShoulerId).children.push(leftUpperArmId);
  
  // 左前腕
  const leftLowerArmId = uuidv4();
  bones.push({
    id: leftLowerArmId,
    name: 'LowerArm_L',
    position: [-1.5, 0, 0],
    rotation: [0, 0, 0],
    length: 1.3,
    parent: leftUpperArmId,
    children: []
  });
  bones.find(b => b.id === leftUpperArmId).children.push(leftLowerArmId);
  
  // 左手
  const leftHandId = uuidv4();
  bones.push({
    id: leftHandId,
    name: 'Hand_L',
    position: [-1.3, 0, 0],
    rotation: [0, 0, 0],
    length: 0.2,
    parent: leftLowerArmId,
    children: []
  });
  bones.find(b => b.id === leftLowerArmId).children.push(leftHandId);
  
  // 右肩
  const rightShoulerId = uuidv4();
  bones.push({
    id: rightShoulerId,
    name: 'Shoulder_R',
    position: [0.5, 1.8, 0],
    rotation: [0, 0, -Math.PI / 2],
    length: 0.5,
    parent: spineId,
    children: []
  });
  bones.find(b => b.id === spineId).children.push(rightShoulerId);
  
  // 右上腕
  const rightUpperArmId = uuidv4();
  bones.push({
    id: rightUpperArmId,
    name: 'UpperArm_R',
    position: [0.5, 0, 0],
    rotation: [0, 0, 0],
    length: 1.5,
    parent: rightShoulerId,
    children: []
  });
  bones.find(b => b.id === rightShoulerId).children.push(rightUpperArmId);
  
  // 右前腕
  const rightLowerArmId = uuidv4();
  bones.push({
    id: rightLowerArmId,
    name: 'LowerArm_R',
    position: [1.5, 0, 0],
    rotation: [0, 0, 0],
    length: 1.3,
    parent: rightUpperArmId,
    children: []
  });
  bones.find(b => b.id === rightUpperArmId).children.push(rightLowerArmId);
  
  // 右手
  const rightHandId = uuidv4();
  bones.push({
    id: rightHandId,
    name: 'Hand_R',
    position: [1.3, 0, 0],
    rotation: [0, 0, 0],
    length: 0.2,
    parent: rightLowerArmId,
    children: []
  });
  bones.find(b => b.id === rightLowerArmId).children.push(rightHandId);
  
  // 左太もも
  const leftThighId = uuidv4();
  bones.push({
    id: leftThighId,
    name: 'Thigh_L',
    position: [-0.3, -0.2, 0],
    rotation: [0, 0, 0],
    length: 2.0,
    parent: rootId,
    children: []
  });
  bones.find(b => b.id === rootId).children.push(leftThighId);
  
  // 左すね
  const leftShinId = uuidv4();
  bones.push({
    id: leftShinId,
    name: 'Shin_L',
    position: [0, -2.0, 0],
    rotation: [0, 0, 0],
    length: 1.8,
    parent: leftThighId,
    children: []
  });
  bones.find(b => b.id === leftThighId).children.push(leftShinId);
  
  // 左足
  const leftFootId = uuidv4();
  bones.push({
    id: leftFootId,
    name: 'Foot_L',
    position: [0, -1.8, 0.1],
    rotation: [-Math.PI / 2, 0, 0],
    length: 0.3,
    parent: leftShinId,
    children: []
  });
  bones.find(b => b.id === leftShinId).children.push(leftFootId);
  
  // 右太もも
  const rightThighId = uuidv4();
  bones.push({
    id: rightThighId,
    name: 'Thigh_R',
    position: [0.3, -0.2, 0],
    rotation: [0, 0, 0],
    length: 2.0,
    parent: rootId,
    children: []
  });
  bones.find(b => b.id === rootId).children.push(rightThighId);
  
  // 右すね
  const rightShinId = uuidv4();
  bones.push({
    id: rightShinId,
    name: 'Shin_R',
    position: [0, -2.0, 0],
    rotation: [0, 0, 0],
    length: 1.8,
    parent: rightThighId,
    children: []
  });
  bones.find(b => b.id === rightThighId).children.push(rightShinId);
  
  // 右足
  const rightFootId = uuidv4();
  bones.push({
    id: rightFootId,
    name: 'Foot_R',
    position: [0, -1.8, 0.1],
    rotation: [-Math.PI / 2, 0, 0],
    length: 0.3,
    parent: rightShinId,
    children: []
  });
  bones.find(b => b.id === rightShinId).children.push(rightFootId);
  
  return bones;
}