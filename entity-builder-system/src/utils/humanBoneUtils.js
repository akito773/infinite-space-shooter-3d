// 人間のボーンシステム用のユーティリティ関数

// 人間メッシュのワールド座標に対応するボーンのワールド座標を計算
export function getHumanBoneWorldPosition(boneName, bones) {
  const bone = bones.find(b => b.name === boneName);
  if (!bone) return null;
  
  // ボーンのワールド座標を計算（親ボーンの位置を累積）
  let worldPos = [...bone.position];
  let currentBone = bone;
  
  while (currentBone.parent) {
    const parent = bones.find(b => b.id === currentBone.parent);
    if (!parent) break;
    
    // 親の位置を加算
    worldPos[0] += parent.position[0];
    worldPos[1] += parent.position[1];
    worldPos[2] += parent.position[2];
    
    currentBone = parent;
  }
  
  return worldPos;
}

// 人間メッシュとボーンの初期オフセットを計算
export function calculateHumanMeshBoneOffset(meshName, meshPosition, bones) {
  // メッシュ名から対応するボーン名を取得
  const boneMapping = {
    'Head': 'Head',
    'Neck': 'Neck',
    'Torso': 'Spine',
    'Hip': 'Root',
    'UpperArm_Left': 'UpperArm_L',
    'LowerArm_Left': 'LowerArm_L',
    'Hand_Left': 'Hand_L',
    'UpperArm_Right': 'UpperArm_R',
    'LowerArm_Right': 'LowerArm_R',
    'Hand_Right': 'Hand_R',
    'Thigh_Left': 'Thigh_L',
    'Shin_Left': 'Shin_L',
    'Foot_Left': 'Foot_L',
    'Thigh_Right': 'Thigh_R',
    'Shin_Right': 'Shin_R',
    'Foot_Right': 'Foot_R',
  };
  
  const boneName = boneMapping[meshName];
  if (!boneName) return null;
  
  const boneWorldPos = getHumanBoneWorldPosition(boneName, bones);
  if (!boneWorldPos) return null;
  
  // メッシュの初期位置からボーンのワールド位置を引いてオフセットを計算
  return [
    meshPosition[0] - boneWorldPos[0],
    meshPosition[1] - boneWorldPos[1],
    meshPosition[2] - boneWorldPos[2]
  ];
}