# 惑星着陸システム - 開発コンテキスト

## 概要
このドキュメントは、Infinite Space Shooter 3Dの惑星着陸システムを別AIで並行開発するためのコンテキスト情報です。

## プロジェクト情報
- **メインゲーム**: Infinite Space Shooter 3D（3D宇宙シューティング）
- **サブシステム**: 惑星着陸システム（ハイブリッド型：都市開発＋探索）
- **開発言語**: JavaScript (ES6+)
- **フレームワーク**: Three.js, Vite
- **アーキテクチャ**: モジュール型、イベント駆動

## システム概要

### コンセプト
メインゲーム（宇宙空間での戦闘）から惑星に着陸すると、別モードに切り替わる。
- **地上**: 都市開発（俯瞰視点またはTPSビュー）
- **地下**: 2.5D探索アクション（横スクロール）

### 主要機能
1. **基地建設**: 施設を配置して資源を自動生成
2. **惑星探索**: 3D/2.5Dで惑星を探索
3. **資源採掘**: 手動/自動で資源を収集
4. **アップグレード**: 施設や装備の強化

## メインゲームとの連携

### データ連携
```javascript
// メインゲームから受け取るデータ
{
  playerId: "player123",
  playerData: {
    credits: 15000,
    inventory: { /* アイテムリスト */ },
    unlockedTech: ["basic_mining", "shield_tech"]
  },
  planetData: {
    id: "planet_emerald",
    name: "エメラルド",
    type: "terrestrial",
    position: { x: 300, y: -30, z: 400 }
  }
}

// メインゲームに返すデータ
{
  resources: {
    credits: 2000,      // 獲得クレジット
    items: ["iron_ore", "energy_crystal"],
    experience: 500
  },
  planetStatus: {
    owned: true,
    developmentLevel: 3
  }
}
```

### イベント通信
```javascript
// メインゲーム → 惑星システム
window.dispatchEvent(new CustomEvent('landOnPlanet', { 
  detail: { planetId: 'planet_001' } 
}));

// 惑星システム → メインゲーム
window.dispatchEvent(new CustomEvent('returnToSpace', { 
  detail: { resources: {...} } 
}));
```

## ファイル構造

```
planet-landing-system/
├── src/
│   ├── main.js              # エントリーポイント
│   ├── PlanetLandingGame.js # メインクラス
│   ├── components/          # UIコンポーネント
│   │   ├── BuildingMenu.js
│   │   ├── ResourceDisplay.js
│   │   └── ExplorationUI.js
│   ├── systems/             # ゲームシステム
│   │   ├── BuildingSystem.js
│   │   ├── ResourceSystem.js
│   │   ├── ExplorationSystem.js
│   │   └── CombatSystem.js
│   ├── scenes/              # シーン管理
│   │   ├── SurfaceScene.js  # 地上シーン
│   │   ├── UndergroundScene.js # 地下シーン
│   │   └── TransitionScene.js
│   └── data/               # データ定義
│       ├── buildings.js
│       ├── resources.js
│       └── enemies.js
├── assets/                 # アセット
│   ├── models/            # 3Dモデル
│   ├── textures/          # テクスチャ
│   └── sounds/            # 効果音
├── public/                # 静的ファイル
└── docs/                  # ドキュメント
```

## 技術仕様

### Three.js統合
```javascript
// 地上シーン（3D）
class SurfaceScene extends THREE.Scene {
  constructor() {
    super();
    this.camera = new THREE.PerspectiveCamera(60, ...);
    this.setupLighting();
    this.createTerrain();
  }
}

// 地下シーン（2.5D）
class UndergroundScene {
  constructor() {
    this.camera = new THREE.OrthographicCamera(...);
    this.layers = [];
  }
}
```

### 状態管理
```javascript
// グローバル状態
const planetState = {
  resources: {
    iron: 0,
    energy: 0,
    crystal: 0
  },
  buildings: [],
  exploredAreas: new Set(),
  playerPosition: { x: 0, y: 0, z: 0 }
};
```

### ビルドシステム統合
```javascript
// vite.config.js に追加
export default {
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        planet: resolve(__dirname, 'planet-landing.html')
      }
    }
  }
}
```

## 開発ガイドライン

### コーディング規約
- ES6+のモダンな構文を使用
- クラスベースのオブジェクト指向設計
- async/awaitを優先使用
- JSDocコメントでドキュメント化

### 命名規則
- クラス名: PascalCase（例: BuildingSystem）
- メソッド名: camelCase（例: createBuilding）
- 定数: UPPER_SNAKE_CASE（例: MAX_BUILDINGS）
- ファイル名: PascalCase.js

### モジュール設計原則
1. **疎結合**: メインゲームとは最小限の接点
2. **高凝集**: 関連機能はまとめる
3. **単一責任**: 1クラス1責任

## 実装優先順位

### Phase 1（MVP）
1. 基本的な惑星表面シーン
2. 1種類の建物（採掘施設）
3. 資源の自動生成
4. メインゲームとのデータ連携

### Phase 2
1. 建物の種類追加（居住区、発電所）
2. アップグレードシステム
3. 簡単な地表探索

### Phase 3
1. 地下探索モード
2. 敵キャラクター
3. 採掘ミニゲーム

### Phase 4
1. クエストシステム
2. NPCとの取引
3. 惑星間データ共有

## API仕様

### 初期化
```javascript
const planetGame = new PlanetLandingGame({
  container: document.getElementById('planet-container'),
  planetData: { /* メインゲームから受け取ったデータ */ },
  onReturn: (data) => {
    // メインゲームに戻る時のコールバック
  }
});
```

### 主要メソッド
```javascript
// ゲーム開始
planetGame.start();

// 建物を建設
planetGame.buildingSystem.construct('mine', { x: 10, y: 0 });

// 資源を取得
const resources = planetGame.resourceSystem.getResources();

// セーブ
const saveData = planetGame.save();

// ロード
planetGame.load(saveData);
```

## パフォーマンス考慮事項

1. **メモリ管理**: 不要なThree.jsオブジェクトは適切に破棄
2. **描画最適化**: LODシステムの実装
3. **データ圧縮**: セーブデータの圧縮
4. **非同期処理**: 重い処理はWeb Workerで実行

## セキュリティ考慮事項

1. **データ検証**: サーバー側で資源量を検証
2. **チート対策**: クライアント側の値は信用しない
3. **通信暗号化**: 重要データは暗号化

## テスト戦略

1. **単体テスト**: 各システムの機能テスト
2. **統合テスト**: メインゲームとの連携テスト
3. **パフォーマンステスト**: FPS、メモリ使用量の監視

## 参考資料

- メインゲームのドキュメント: `../docs/game-design-document.md`
- Three.js公式ドキュメント: https://threejs.org/docs/
- 惑星システムアイデア: `./docs/planet-landing-system-ideas.md`

---

このコンテキストを基に、別のAIセッションで惑星着陸システムの開発を進めてください。
質問や不明点がある場合は、メインゲームの開発者と連携を取ってください。