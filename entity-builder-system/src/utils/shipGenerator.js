import { v4 as uuidv4 } from 'uuid';

// カラー定義
const COLORS = {
  mainBody: '#505050',      // メタリックグレー
  accent: '#00FFFF',        // ネオンブルー
  cockpit: '#001144',       // ダークブルー
  engine: '#00DDFF',        // シアンブルー
  weaponMount: '#303030',   // ダークグレー
};

// マテリアル定義
const MATERIALS = {
  metalBody: {
    color: COLORS.mainBody,
    metalness: 0.8,
    roughness: 0.3,
  },
  cockpit: {
    color: COLORS.cockpit,
    metalness: 0.2,
    roughness: 0.1,
    transparent: true,
    opacity: 0.8,
  },
  engine: {
    color: COLORS.engine,
    metalness: 0.5,
    roughness: 0.2,
    emissive: COLORS.engine,
    emissiveIntensity: 0.5,
  },
  weapon: {
    color: COLORS.weaponMount,
    metalness: 0.9,
    roughness: 0.4,
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

// プレイヤー戦闘機の生成
export function generatePlayerShip() {
  const objects = [];
  
  // ルートオブジェクト（全体サイズ: 6×2×8）
  const playerShip = createObject(
    'PlayerShip',
    { type: 'group' },
    [0, 0, 0],
    [0, 0, 0],
    [1, 1, 1]
  );
  objects.push(playerShip);
  
  // 機体本体（4×1.5×6）- 流線型にするため複数のパーツで構成
  // メインボディ（中央部）
  const bodyMain = createObject(
    'Body_Main',
    { type: 'box', args: [3, 1.2, 4] },
    [0, 0, -1],
    [0, 0, 0],
    [1, 1, 1],
    MATERIALS.metalBody,
    playerShip.id
  );
  objects.push(bodyMain);
  
  // ボディ前部（先細り）
  const bodyFront = createObject(
    'Body_Front',
    { type: 'cone', args: [1.2, 2.5, 4] },
    [0, 0, -3.5],
    [Math.PI / 2, 0, 0],
    [1.5, 1, 1],
    MATERIALS.metalBody,
    playerShip.id
  );
  objects.push(bodyFront);
  
  // ボディ後部
  const bodyRear = createObject(
    'Body_Rear',
    { type: 'box', args: [3.5, 1.3, 2] },
    [0, 0, 2],
    [0, 0, 0],
    [1, 1, 1],
    MATERIALS.metalBody,
    playerShip.id
  );
  objects.push(bodyRear);
  
  // コックピット
  const cockpit = createObject(
    'Cockpit',
    { type: 'sphere', args: [0.8, 8, 8] },
    [0, 0.7, -1.5],
    [0, 0, 0],
    [1.2, 0.6, 1.8],
    MATERIALS.cockpit,
    playerShip.id
  );
  objects.push(cockpit);
  
  // 左翼
  const leftWing = createObject(
    'LeftWing',
    { type: 'box', args: [2, 0.2, 3] },
    [-2.5, 0, 0],
    [0, 0, -0.2],
    [1, 1, 1.5],
    MATERIALS.metalBody,
    playerShip.id
  );
  objects.push(leftWing);
  
  // 左翼先端
  const leftWingTip = createObject(
    'LeftWing_Tip',
    { type: 'cone', args: [0.3, 1, 3] },
    [-3, 0, -2],
    [Math.PI / 2, 0, -0.3],
    [1, 1, 1],
    { ...MATERIALS.metalBody, color: COLORS.accent },
    playerShip.id
  );
  objects.push(leftWingTip);
  
  // 右翼
  const rightWing = createObject(
    'RightWing',
    { type: 'box', args: [2, 0.2, 3] },
    [2.5, 0, 0],
    [0, 0, 0.2],
    [1, 1, 1.5],
    MATERIALS.metalBody,
    playerShip.id
  );
  objects.push(rightWing);
  
  // 右翼先端
  const rightWingTip = createObject(
    'RightWing_Tip',
    { type: 'cone', args: [0.3, 1, 3] },
    [3, 0, -2],
    [Math.PI / 2, 0, 0.3],
    [1, 1, 1],
    { ...MATERIALS.metalBody, color: COLORS.accent },
    playerShip.id
  );
  objects.push(rightWingTip);
  
  // エンジン1（左）
  const engine1 = createObject(
    'Engine1',
    { type: 'cylinder', args: [0.5, 0.7, 2, 8] },
    [-1, 0, 3],
    [Math.PI / 2, 0, 0],
    [1, 1, 1],
    MATERIALS.engine,
    playerShip.id
  );
  objects.push(engine1);
  
  // エンジン2（右）
  const engine2 = createObject(
    'Engine2',
    { type: 'cylinder', args: [0.5, 0.7, 2, 8] },
    [1, 0, 3],
    [Math.PI / 2, 0, 0],
    [1, 1, 1],
    MATERIALS.engine,
    playerShip.id
  );
  objects.push(engine2);
  
  // エンジン3（中央）
  const engine3 = createObject(
    'Engine3',
    { type: 'cylinder', args: [0.4, 0.6, 1.8, 8] },
    [0, -0.3, 3],
    [Math.PI / 2, 0, 0],
    [1, 1, 1],
    MATERIALS.engine,
    playerShip.id
  );
  objects.push(engine3);
  
  // 武器マウント（グループ）
  const weapons = createObject(
    'Weapons',
    { type: 'group' },
    [0, 0, 0],
    [0, 0, 0],
    [1, 1, 1],
    MATERIALS.weapon,
    playerShip.id
  );
  objects.push(weapons);
  
  // 主砲
  const mainGun = createObject(
    'MainGun',
    { type: 'cylinder', args: [0.15, 0.1, 1.5, 6] },
    [0, -0.6, -3.5],
    [Math.PI / 2, 0, 0],
    [1, 1, 1],
    MATERIALS.weapon,
    weapons.id
  );
  objects.push(mainGun);
  
  // 左ミサイルポッド
  const leftMissile = createObject(
    'LeftMissilePod',
    { type: 'box', args: [0.3, 0.3, 0.8] },
    [-2.2, -0.2, -0.5],
    [0, 0, 0],
    [1, 1, 1],
    MATERIALS.weapon,
    weapons.id
  );
  objects.push(leftMissile);
  
  // 右ミサイルポッド
  const rightMissile = createObject(
    'RightMissilePod',
    { type: 'box', args: [0.3, 0.3, 0.8] },
    [2.2, -0.2, -0.5],
    [0, 0, 0],
    [1, 1, 1],
    MATERIALS.weapon,
    weapons.id
  );
  objects.push(rightMissile);
  
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

// 戦闘機のバウンディングボックスを確認
export function validateShipSize(objects) {
  // すべてのオブジェクトの実際のサイズを計算
  let minX = Infinity, maxX = -Infinity;
  let minY = Infinity, maxY = -Infinity;
  let minZ = Infinity, maxZ = -Infinity;
  
  objects.forEach(obj => {
    if (obj.geometry.type !== 'group') {
      const pos = obj.position;
      const scale = obj.scale;
      
      // 簡易的なバウンディングボックス計算
      minX = Math.min(minX, pos[0] - scale[0]);
      maxX = Math.max(maxX, pos[0] + scale[0]);
      minY = Math.min(minY, pos[1] - scale[1]);
      maxY = Math.max(maxY, pos[1] + scale[1]);
      minZ = Math.min(minZ, pos[2] - scale[2]);
      maxZ = Math.max(maxZ, pos[2] + scale[2]);
    }
  });
  
  const width = maxX - minX;
  const height = maxY - minY;
  const depth = maxZ - minZ;
  
  return {
    size: { width, height, depth },
    valid: width <= 6 && height <= 2 && depth <= 8,
    message: `Size: ${width.toFixed(2)} × ${height.toFixed(2)} × ${depth.toFixed(2)} (Target: 6×2×8)`
  };
}