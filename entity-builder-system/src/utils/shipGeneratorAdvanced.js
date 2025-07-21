import { v4 as uuidv4 } from 'uuid';

// カラー定義
const COLORS = {
  mainBody: '#505050',      // メタリックグレー
  darkBody: '#303030',      // ダークグレー
  accent: '#00FFFF',        // ネオンブルー
  cockpit: '#001144',       // ダークブルー
  cockpitGlass: '#003366',  // コックピットガラス
  engine: '#00DDFF',        // シアンブルー
  engineCore: '#FFFFFF',    // エンジンコア
  weaponMount: '#303030',   // ダークグレー
  warning: '#FF6600',       // 警告色
  panel: '#404040',         // パネル色
};

// マテリアル定義
const MATERIALS = {
  metalBody: {
    color: COLORS.mainBody,
    metalness: 0.8,
    roughness: 0.3,
  },
  darkMetal: {
    color: COLORS.darkBody,
    metalness: 0.9,
    roughness: 0.4,
  },
  cockpitGlass: {
    color: COLORS.cockpitGlass,
    metalness: 0.1,
    roughness: 0.0,
    transparent: true,
    opacity: 0.7,
  },
  cockpitFrame: {
    color: COLORS.darkBody,
    metalness: 0.9,
    roughness: 0.3,
  },
  engine: {
    color: COLORS.engine,
    metalness: 0.5,
    roughness: 0.2,
    emissive: COLORS.engine,
    emissiveIntensity: 0.8,
  },
  engineCore: {
    color: COLORS.engineCore,
    metalness: 0.0,
    roughness: 0.0,
    emissive: COLORS.engineCore,
    emissiveIntensity: 1.0,
  },
  weapon: {
    color: COLORS.weaponMount,
    metalness: 0.95,
    roughness: 0.4,
  },
  accent: {
    color: COLORS.accent,
    metalness: 0.7,
    roughness: 0.2,
    emissive: COLORS.accent,
    emissiveIntensity: 0.3,
  },
};

// オブジェクト作成ヘルパー関数
function createObject(name, geometry, position = [0, 0, 0], rotation = [0, 0, 0], scale = [1, 1, 1], material = MATERIALS.metalBody, parent = null) {
  return {
    id: uuidv4(),
    name,
    geometry,
    position,
    rotation,
    scale,
    material: { ...material },
    parent,
    children: [],
  };
}

// 高品質プレイヤー戦闘機の生成
export function generateAdvancedPlayerShip() {
  const objects = [];
  
  // ルートオブジェクト
  const playerShip = createObject(
    'PlayerShip_Advanced',
    { type: 'group' },
    [0, 0, 0],
    [0, 0, 0],
    [1, 1, 1]
  );
  objects.push(playerShip);
  
  // === 機体本体 ===
  // メインボディ（流線型のため複数パーツで構成）
  const bodyCore = createObject(
    'Body_Core',
    { type: 'box', args: [2.5, 1.0, 3.5] },
    [0, 0, -0.5],
    [0, 0, 0],
    [1, 1, 1],
    MATERIALS.metalBody,
    playerShip.id
  );
  objects.push(bodyCore);
  
  // ボディ前部（先細り・複雑な形状）
  const bodyFrontMain = createObject(
    'Body_Front_Main',
    { type: 'cone', args: [1.0, 2.0, 6] },
    [0, 0, -2.5],
    [Math.PI / 2, 0, 0],
    [1.5, 1.2, 1],
    MATERIALS.metalBody,
    playerShip.id
  );
  objects.push(bodyFrontMain);
  
  // ノーズコーン（最先端）
  const noseCone = createObject(
    'Nose_Cone',
    { type: 'cone', args: [0.3, 1.0, 8] },
    [0, 0, -3.8],
    [Math.PI / 2, 0, 0],
    [1, 1, 1],
    MATERIALS.darkMetal,
    playerShip.id
  );
  objects.push(noseCone);
  
  // ボディ後部（エンジン接続部）
  const bodyRear = createObject(
    'Body_Rear',
    { type: 'box', args: [3.2, 1.2, 1.8] },
    [0, 0, 1.5],
    [0, 0, 0],
    [1, 1, 1],
    MATERIALS.metalBody,
    playerShip.id
  );
  objects.push(bodyRear);
  
  // === コックピット詳細 ===
  // コックピットフレーム
  const cockpitFrame = createObject(
    'Cockpit_Frame',
    { type: 'box', args: [1.2, 0.8, 2.0] },
    [0, 0.5, -1.2],
    [0, 0, 0],
    [1, 1, 1],
    MATERIALS.cockpitFrame,
    playerShip.id
  );
  objects.push(cockpitFrame);
  
  // コックピットキャノピー（ガラス部分）
  const cockpitCanopy = createObject(
    'Cockpit_Canopy',
    { type: 'sphere', args: [0.7, 8, 6] },
    [0, 0.8, -1.2],
    [0, 0, 0],
    [1.1, 0.7, 1.8],
    MATERIALS.cockpitGlass,
    playerShip.id
  );
  objects.push(cockpitCanopy);
  
  // === 主翼（詳細版）===
  // 左主翼
  const leftWingMain = createObject(
    'LeftWing_Main',
    { type: 'box', args: [1.8, 0.15, 2.8] },
    [-2.2, 0, 0],
    [0, 0, -0.15],
    [1, 1, 1],
    MATERIALS.metalBody,
    playerShip.id
  );
  objects.push(leftWingMain);
  
  // 左翼エクステンション
  const leftWingExt = createObject(
    'LeftWing_Extension',
    { type: 'box', args: [0.8, 0.1, 1.5] },
    [-3.2, 0, -0.5],
    [0, 0, -0.2],
    [1, 1, 1],
    MATERIALS.darkMetal,
    playerShip.id
  );
  objects.push(leftWingExt);
  
  // 左翼先端（ウィングレット）
  const leftWinglet = createObject(
    'LeftWinglet',
    { type: 'box', args: [0.15, 0.6, 0.8] },
    [-3.5, 0.2, -1.5],
    [0, 0, -0.3],
    [1, 1, 1],
    MATERIALS.accent,
    playerShip.id
  );
  objects.push(leftWinglet);
  
  // 右主翼（対称）
  const rightWingMain = createObject(
    'RightWing_Main',
    { type: 'box', args: [1.8, 0.15, 2.8] },
    [2.2, 0, 0],
    [0, 0, 0.15],
    [1, 1, 1],
    MATERIALS.metalBody,
    playerShip.id
  );
  objects.push(rightWingMain);
  
  // 右翼エクステンション
  const rightWingExt = createObject(
    'RightWing_Extension',
    { type: 'box', args: [0.8, 0.1, 1.5] },
    [3.2, 0, -0.5],
    [0, 0, 0.2],
    [1, 1, 1],
    MATERIALS.darkMetal,
    playerShip.id
  );
  objects.push(rightWingExt);
  
  // 右翼先端（ウィングレット）
  const rightWinglet = createObject(
    'RightWinglet',
    { type: 'box', args: [0.15, 0.6, 0.8] },
    [3.5, 0.2, -1.5],
    [0, 0, 0.3],
    [1, 1, 1],
    MATERIALS.accent,
    playerShip.id
  );
  objects.push(rightWinglet);
  
  // === エンジン部（詳細版）===
  // メインエンジン（中央）
  const engineMainOuter = createObject(
    'Engine_Main_Outer',
    { type: 'cylinder', args: [0.6, 0.8, 2.0, 12] },
    [0, -0.2, 2.8],
    [Math.PI / 2, 0, 0],
    [1, 1, 1],
    MATERIALS.darkMetal,
    playerShip.id
  );
  objects.push(engineMainOuter);
  
  const engineMainInner = createObject(
    'Engine_Main_Inner',
    { type: 'cylinder', args: [0.4, 0.5, 1.8, 12] },
    [0, -0.2, 2.9],
    [Math.PI / 2, 0, 0],
    [1, 1, 1],
    MATERIALS.engine,
    playerShip.id
  );
  objects.push(engineMainInner);
  
  const engineMainCore = createObject(
    'Engine_Main_Core',
    { type: 'cylinder', args: [0.2, 0.2, 1.5, 8] },
    [0, -0.2, 3.0],
    [Math.PI / 2, 0, 0],
    [1, 1, 1],
    MATERIALS.engineCore,
    playerShip.id
  );
  objects.push(engineMainCore);
  
  // 左サブエンジン
  const engineLeftOuter = createObject(
    'Engine_Left_Outer',
    { type: 'cylinder', args: [0.4, 0.5, 1.8, 10] },
    [-1.2, 0, 2.5],
    [Math.PI / 2, 0, 0],
    [1, 1, 1],
    MATERIALS.darkMetal,
    playerShip.id
  );
  objects.push(engineLeftOuter);
  
  const engineLeftInner = createObject(
    'Engine_Left_Inner',
    { type: 'cylinder', args: [0.25, 0.3, 1.6, 10] },
    [-1.2, 0, 2.6],
    [Math.PI / 2, 0, 0],
    [1, 1, 1],
    MATERIALS.engine,
    playerShip.id
  );
  objects.push(engineLeftInner);
  
  // 右サブエンジン
  const engineRightOuter = createObject(
    'Engine_Right_Outer',
    { type: 'cylinder', args: [0.4, 0.5, 1.8, 10] },
    [1.2, 0, 2.5],
    [Math.PI / 2, 0, 0],
    [1, 1, 1],
    MATERIALS.darkMetal,
    playerShip.id
  );
  objects.push(engineRightOuter);
  
  const engineRightInner = createObject(
    'Engine_Right_Inner',
    { type: 'cylinder', args: [0.25, 0.3, 1.6, 10] },
    [1.2, 0, 2.6],
    [Math.PI / 2, 0, 0],
    [1, 1, 1],
    MATERIALS.engine,
    playerShip.id
  );
  objects.push(engineRightInner);
  
  // === 武装システム ===
  const weapons = createObject(
    'Weapons_System',
    { type: 'group' },
    [0, 0, 0],
    [0, 0, 0],
    [1, 1, 1],
    MATERIALS.weapon,
    playerShip.id
  );
  objects.push(weapons);
  
  // 主砲マウント
  const mainGunMount = createObject(
    'MainGun_Mount',
    { type: 'box', args: [0.4, 0.3, 0.8] },
    [0, -0.6, -3.0],
    [0, 0, 0],
    [1, 1, 1],
    MATERIALS.weapon,
    weapons.id
  );
  objects.push(mainGunMount);
  
  // 主砲バレル（2連装）
  const mainGunBarrelLeft = createObject(
    'MainGun_Barrel_L',
    { type: 'cylinder', args: [0.08, 0.05, 1.2, 6] },
    [-0.15, -0.6, -3.5],
    [Math.PI / 2, 0, 0],
    [1, 1, 1],
    MATERIALS.weapon,
    weapons.id
  );
  objects.push(mainGunBarrelLeft);
  
  const mainGunBarrelRight = createObject(
    'MainGun_Barrel_R',
    { type: 'cylinder', args: [0.08, 0.05, 1.2, 6] },
    [0.15, -0.6, -3.5],
    [Math.PI / 2, 0, 0],
    [1, 1, 1],
    MATERIALS.weapon,
    weapons.id
  );
  objects.push(mainGunBarrelRight);
  
  // ミサイルポッド（詳細版）
  const leftMissilePod = createObject(
    'LeftMissile_Pod',
    { type: 'box', args: [0.3, 0.25, 1.0] },
    [-2.5, -0.2, -0.3],
    [0, 0, 0],
    [1, 1, 1],
    MATERIALS.weapon,
    weapons.id
  );
  objects.push(leftMissilePod);
  
  const rightMissilePod = createObject(
    'RightMissile_Pod',
    { type: 'box', args: [0.3, 0.25, 1.0] },
    [2.5, -0.2, -0.3],
    [0, 0, 0],
    [1, 1, 1],
    MATERIALS.weapon,
    weapons.id
  );
  objects.push(rightMissilePod);
  
  // === ディテール ===
  // エアインテーク（左）
  const leftIntake = createObject(
    'Left_Intake',
    { type: 'box', args: [0.3, 0.4, 0.8] },
    [-1.5, 0.3, -0.5],
    [0, 0, 0],
    [1, 1, 1],
    MATERIALS.darkMetal,
    playerShip.id
  );
  objects.push(leftIntake);
  
  // エアインテーク（右）
  const rightIntake = createObject(
    'Right_Intake',
    { type: 'box', args: [0.3, 0.4, 0.8] },
    [1.5, 0.3, -0.5],
    [0, 0, 0],
    [1, 1, 1],
    MATERIALS.darkMetal,
    playerShip.id
  );
  objects.push(rightIntake);
  
  // アンテナ
  const antenna = createObject(
    'Antenna',
    { type: 'cylinder', args: [0.02, 0.02, 0.8, 4] },
    [0, 0.8, 0.5],
    [0, 0, 0],
    [1, 1, 1],
    MATERIALS.darkMetal,
    playerShip.id
  );
  objects.push(antenna);
  
  // パネルライン（装飾）
  for (let i = 0; i < 3; i++) {
    const panel = createObject(
      `Panel_Line_${i}`,
      { type: 'box', args: [0.02, 0.02, 2.0] },
      [i * 0.8 - 0.8, 0.5, 0],
      [0, 0, 0],
      [1, 1, 1],
      MATERIALS.darkMetal,
      playerShip.id
    );
    objects.push(panel);
  }
  
  // 階層構造を設定
  objects.forEach(obj => {
    if (obj.parent) {
      const parent = objects.find(p => p.id === obj.parent);
      if (parent) {
        parent.children.push(obj.id);
      }
    }
  });
  
  return objects;
}

// 人型ロボットの生成
export function generateHumanoidRobot() {
  const objects = [];
  
  // ルートオブジェクト（全体高さ約10ユニット）
  const robot = createObject(
    'Humanoid_Robot',
    { type: 'group' },
    [0, 0, 0],
    [0, 0, 0],
    [1, 1, 1]
  );
  objects.push(robot);
  
  // === 胴体 ===
  const torso = createObject(
    'Torso',
    { type: 'group' },
    [0, 5, 0],
    [0, 0, 0],
    [1, 1, 1],
    MATERIALS.metalBody,
    robot.id
  );
  objects.push(torso);
  
  // 胸部メイン
  const chestMain = createObject(
    'Chest_Main',
    { type: 'box', args: [2.5, 2.5, 1.5] },
    [0, 0, 0],
    [0, 0, 0],
    [1, 1, 1],
    MATERIALS.metalBody,
    torso.id
  );
  objects.push(chestMain);
  
  // 胸部装甲
  const chestArmor = createObject(
    'Chest_Armor',
    { type: 'box', args: [2.8, 2.2, 0.3] },
    [0, 0, 0.9],
    [0, 0, 0],
    [1, 1, 1],
    MATERIALS.darkMetal,
    torso.id
  );
  objects.push(chestArmor);
  
  // コアユニット（発光部）
  const coreUnit = createObject(
    'Core_Unit',
    { type: 'sphere', args: [0.4, 8, 8] },
    [0, 0, 0.8],
    [0, 0, 0],
    [1, 1, 1],
    MATERIALS.engineCore,
    torso.id
  );
  objects.push(coreUnit);
  
  // 腹部
  const abdomen = createObject(
    'Abdomen',
    { type: 'box', args: [1.8, 1.5, 1.2] },
    [0, -1.5, 0],
    [0, 0, 0],
    [1, 1, 1],
    MATERIALS.darkMetal,
    torso.id
  );
  objects.push(abdomen);
  
  // === 頭部 ===
  const head = createObject(
    'Head',
    { type: 'group' },
    [0, 6.8, 0],
    [0, 0, 0],
    [1, 1, 1],
    MATERIALS.metalBody,
    robot.id
  );
  objects.push(head);
  
  // 頭部メイン
  const headMain = createObject(
    'Head_Main',
    { type: 'box', args: [0.8, 0.8, 0.8] },
    [0, 0, 0],
    [0, 0, 0],
    [1, 1, 1],
    MATERIALS.metalBody,
    head.id
  );
  objects.push(headMain);
  
  // バイザー（目）
  const visor = createObject(
    'Visor',
    { type: 'box', args: [0.7, 0.2, 0.1] },
    [0, 0.1, 0.45],
    [0, 0, 0],
    [1, 1, 1],
    MATERIALS.accent,
    head.id
  );
  objects.push(visor);
  
  // アンテナ（左右）
  const antennaLeft = createObject(
    'Antenna_Left',
    { type: 'cone', args: [0.1, 0.6, 4] },
    [-0.4, 0.6, 0],
    [0, 0, -0.2],
    [1, 1, 1],
    MATERIALS.darkMetal,
    head.id
  );
  objects.push(antennaLeft);
  
  const antennaRight = createObject(
    'Antenna_Right',
    { type: 'cone', args: [0.1, 0.6, 4] },
    [0.4, 0.6, 0],
    [0, 0, 0.2],
    [1, 1, 1],
    MATERIALS.darkMetal,
    head.id
  );
  objects.push(antennaRight);
  
  // === 肩 ===
  // 左肩
  const leftShoulder = createObject(
    'Left_Shoulder',
    { type: 'sphere', args: [0.8, 8, 6] },
    [-2.0, 5.5, 0],
    [0, 0, 0],
    [1.2, 1, 1],
    MATERIALS.metalBody,
    robot.id
  );
  objects.push(leftShoulder);
  
  // 左肩装甲
  const leftShoulderArmor = createObject(
    'Left_Shoulder_Armor',
    { type: 'box', args: [1.0, 1.0, 1.2] },
    [-2.5, 5.8, 0],
    [0, 0, -0.2],
    [1, 1, 1],
    MATERIALS.darkMetal,
    robot.id
  );
  objects.push(leftShoulderArmor);
  
  // 右肩
  const rightShoulder = createObject(
    'Right_Shoulder',
    { type: 'sphere', args: [0.8, 8, 6] },
    [2.0, 5.5, 0],
    [0, 0, 0],
    [1.2, 1, 1],
    MATERIALS.metalBody,
    robot.id
  );
  objects.push(rightShoulder);
  
  // 右肩装甲
  const rightShoulderArmor = createObject(
    'Right_Shoulder_Armor',
    { type: 'box', args: [1.0, 1.0, 1.2] },
    [2.5, 5.8, 0],
    [0, 0, 0.2],
    [1, 1, 1],
    MATERIALS.darkMetal,
    robot.id
  );
  objects.push(rightShoulderArmor);
  
  // === 腕 ===
  // 左上腕
  const leftUpperArm = createObject(
    'Left_Upper_Arm',
    { type: 'cylinder', args: [0.4, 0.3, 2.0, 8] },
    [-2.5, 4.0, 0],
    [0, 0, 0],
    [1, 1, 1],
    MATERIALS.metalBody,
    robot.id
  );
  objects.push(leftUpperArm);
  
  // 左肘関節
  const leftElbow = createObject(
    'Left_Elbow',
    { type: 'sphere', args: [0.4, 8, 6] },
    [-2.5, 2.8, 0],
    [0, 0, 0],
    [1, 1, 1],
    MATERIALS.darkMetal,
    robot.id
  );
  objects.push(leftElbow);
  
  // 左前腕
  const leftForearm = createObject(
    'Left_Forearm',
    { type: 'cylinder', args: [0.35, 0.25, 2.0, 8] },
    [-2.5, 1.5, 0],
    [0, 0, 0],
    [1, 1, 1],
    MATERIALS.metalBody,
    robot.id
  );
  objects.push(leftForearm);
  
  // 左手
  const leftHand = createObject(
    'Left_Hand',
    { type: 'box', args: [0.6, 0.8, 0.3] },
    [-2.5, 0.3, 0],
    [0, 0, 0],
    [1, 1, 1],
    MATERIALS.darkMetal,
    robot.id
  );
  objects.push(leftHand);
  
  // 右腕（対称）
  const rightUpperArm = createObject(
    'Right_Upper_Arm',
    { type: 'cylinder', args: [0.4, 0.3, 2.0, 8] },
    [2.5, 4.0, 0],
    [0, 0, 0],
    [1, 1, 1],
    MATERIALS.metalBody,
    robot.id
  );
  objects.push(rightUpperArm);
  
  const rightElbow = createObject(
    'Right_Elbow',
    { type: 'sphere', args: [0.4, 8, 6] },
    [2.5, 2.8, 0],
    [0, 0, 0],
    [1, 1, 1],
    MATERIALS.darkMetal,
    robot.id
  );
  objects.push(rightElbow);
  
  const rightForearm = createObject(
    'Right_Forearm',
    { type: 'cylinder', args: [0.35, 0.25, 2.0, 8] },
    [2.5, 1.5, 0],
    [0, 0, 0],
    [1, 1, 1],
    MATERIALS.metalBody,
    robot.id
  );
  objects.push(rightForearm);
  
  const rightHand = createObject(
    'Right_Hand',
    { type: 'box', args: [0.6, 0.8, 0.3] },
    [2.5, 0.3, 0],
    [0, 0, 0],
    [1, 1, 1],
    MATERIALS.darkMetal,
    robot.id
  );
  objects.push(rightHand);
  
  // === 腰部 ===
  const pelvis = createObject(
    'Pelvis',
    { type: 'box', args: [2.2, 1.0, 1.3] },
    [0, 3.0, 0],
    [0, 0, 0],
    [1, 1, 1],
    MATERIALS.darkMetal,
    robot.id
  );
  objects.push(pelvis);
  
  // === 脚部 ===
  // 左脚
  const leftHip = createObject(
    'Left_Hip',
    { type: 'sphere', args: [0.5, 8, 6] },
    [-0.8, 2.5, 0],
    [0, 0, 0],
    [1, 1, 1],
    MATERIALS.metalBody,
    robot.id
  );
  objects.push(leftHip);
  
  const leftThigh = createObject(
    'Left_Thigh',
    { type: 'cylinder', args: [0.5, 0.4, 2.5, 8] },
    [-0.8, 1.0, 0],
    [0, 0, 0],
    [1, 1, 1],
    MATERIALS.metalBody,
    robot.id
  );
  objects.push(leftThigh);
  
  const leftKnee = createObject(
    'Left_Knee',
    { type: 'sphere', args: [0.5, 8, 6] },
    [-0.8, -0.5, 0],
    [0, 0, 0],
    [1, 1, 1],
    MATERIALS.darkMetal,
    robot.id
  );
  objects.push(leftKnee);
  
  const leftShin = createObject(
    'Left_Shin',
    { type: 'cylinder', args: [0.4, 0.35, 2.5, 8] },
    [-0.8, -2.0, 0],
    [0, 0, 0],
    [1, 1, 1],
    MATERIALS.metalBody,
    robot.id
  );
  objects.push(leftShin);
  
  const leftFoot = createObject(
    'Left_Foot',
    { type: 'box', args: [0.8, 0.3, 1.5] },
    [-0.8, -3.5, 0.2],
    [0, 0, 0],
    [1, 1, 1],
    MATERIALS.darkMetal,
    robot.id
  );
  objects.push(leftFoot);
  
  // 右脚（対称）
  const rightHip = createObject(
    'Right_Hip',
    { type: 'sphere', args: [0.5, 8, 6] },
    [0.8, 2.5, 0],
    [0, 0, 0],
    [1, 1, 1],
    MATERIALS.metalBody,
    robot.id
  );
  objects.push(rightHip);
  
  const rightThigh = createObject(
    'Right_Thigh',
    { type: 'cylinder', args: [0.5, 0.4, 2.5, 8] },
    [0.8, 1.0, 0],
    [0, 0, 0],
    [1, 1, 1],
    MATERIALS.metalBody,
    robot.id
  );
  objects.push(rightThigh);
  
  const rightKnee = createObject(
    'Right_Knee',
    { type: 'sphere', args: [0.5, 8, 6] },
    [0.8, -0.5, 0],
    [0, 0, 0],
    [1, 1, 1],
    MATERIALS.darkMetal,
    robot.id
  );
  objects.push(rightKnee);
  
  const rightShin = createObject(
    'Right_Shin',
    { type: 'cylinder', args: [0.4, 0.35, 2.5, 8] },
    [0.8, -2.0, 0],
    [0, 0, 0],
    [1, 1, 1],
    MATERIALS.metalBody,
    robot.id
  );
  objects.push(rightShin);
  
  const rightFoot = createObject(
    'Right_Foot',
    { type: 'box', args: [0.8, 0.3, 1.5] },
    [0.8, -3.5, 0.2],
    [0, 0, 0],
    [1, 1, 1],
    MATERIALS.darkMetal,
    robot.id
  );
  objects.push(rightFoot);
  
  // === バックパック ===
  const backpack = createObject(
    'Backpack',
    { type: 'box', args: [1.5, 2.0, 0.8] },
    [0, 5.5, -1.0],
    [0, 0, 0],
    [1, 1, 1],
    MATERIALS.darkMetal,
    robot.id
  );
  objects.push(backpack);
  
  // スラスター（左）
  const leftThruster = createObject(
    'Left_Thruster',
    { type: 'cylinder', args: [0.3, 0.4, 1.0, 8] },
    [-0.8, 5.5, -1.3],
    [Math.PI / 2, 0, 0],
    [1, 1, 1],
    MATERIALS.engine,
    robot.id
  );
  objects.push(leftThruster);
  
  // スラスター（右）
  const rightThruster = createObject(
    'Right_Thruster',
    { type: 'cylinder', args: [0.3, 0.4, 1.0, 8] },
    [0.8, 5.5, -1.3],
    [Math.PI / 2, 0, 0],
    [1, 1, 1],
    MATERIALS.engine,
    robot.id
  );
  objects.push(rightThruster);
  
  // 階層構造を設定
  objects.forEach(obj => {
    if (obj.parent) {
      const parent = objects.find(p => p.id === obj.parent);
      if (parent) {
        parent.children.push(obj.id);
      }
    }
  });
  
  return objects;
}