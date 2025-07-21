# Entity Builder System - 統合ガイド

## メインゲームとの統合方法

### 1. ファイル監視システム

#### 監視対象ディレクトリ
```
entity-builder-system/
├── exports/
│   ├── player-ships/     # プレイヤー機体
│   ├── enemy-ships/      # 敵機体
│   ├── bosses/          # ボス戦艦
│   └── weapons/         # カスタム武器
```

#### メインゲーム側の実装
```javascript
// src/systems/EntityLoader.js
import { watch } from 'chokidar';

export class EntityLoader {
    constructor() {
        this.watchedPaths = [
            '../entity-builder-system/exports/player-ships/',
            '../entity-builder-system/exports/enemy-ships/',
            '../entity-builder-system/exports/bosses/',
            '../entity-builder-system/exports/weapons/'
        ];
        this.setupFileWatcher();
    }
    
    setupFileWatcher() {
        this.watchedPaths.forEach(path => {
            watch(path).on('change', (filePath) => {
                this.reloadEntity(filePath);
            });
        });
    }
    
    async loadEntity(filePath) {
        const response = await fetch(filePath);
        const entityData = await response.json();
        return this.createEntityFromData(entityData);
    }
    
    createEntityFromData(data) {
        switch (data.type) {
            case 'player_ship':
                return this.createPlayerShip(data.data);
            case 'enemy_ship':
                return this.createEnemyShip(data.data);
            case 'boss_ship':
                return this.createBossShip(data.data);
            case 'weapon':
                return this.createWeapon(data.data);
        }
    }
}
```

### 2. 動的エンティティ生成

#### プレイヤー機体の動的生成
```javascript
// PlayerShip.js の拡張
export class PlayerShip {
    static async createFromData(entityData) {
        const ship = new PlayerShip();
        
        // 基本性能の適用
        ship.health = entityData.health;
        ship.maxHealth = entityData.maxHealth;
        ship.speed = entityData.speed;
        ship.boostSpeed = entityData.boostSpeed;
        
        // 3Dモデルの構築
        await ship.buildFromModel(entityData.model);
        
        // 武器マウントの設定
        ship.setupWeaponMounts(entityData.weaponMounts);
        
        return ship;
    }
    
    async buildFromModel(modelData) {
        // メインハル
        const hullGeometry = this.createGeometryFromType(modelData.hull.type);
        const hullMaterial = this.createMaterial(modelData.hull.material, modelData.hull.color);
        this.hullMesh = new THREE.Mesh(hullGeometry, hullMaterial);
        
        // パーツ追加
        for (const part of modelData.parts) {
            const partMesh = await this.createPart(part);
            this.group.add(partMesh);
        }
        
        // エフェクト設定
        this.setupEffects(modelData.effects);
    }
}
```

#### ボス戦艦の動的生成
```javascript
// BossShip.js の実装
export class BossShip {
    static async createFromData(bossData) {
        const boss = new BossShip();
        
        // 基本構造
        await boss.buildStructure(bossData.structure);
        
        // フェーズシステム
        boss.setupPhases(bossData.phases);
        
        // 武器システム
        boss.setupWeaponSystems(bossData.structure.weaponSystems);
        
        // 破壊可能部位
        boss.setupDestructibleParts(bossData.structure.destructibleParts);
        
        return boss;
    }
    
    setupPhases(phasesData) {
        this.phases = phasesData.map(phaseData => ({
            ...phaseData,
            active: false,
            specialAttackCooldowns: new Map()
        }));
        
        this.currentPhase = 0;
    }
    
    update(delta) {
        // フェーズチェック
        const healthPercent = this.health / this.maxHealth;
        const targetPhase = this.phases.findIndex(phase => 
            healthPercent <= phase.healthThreshold
        );
        
        if (targetPhase !== this.currentPhase) {
            this.switchPhase(targetPhase);
        }
        
        // 現在のフェーズの行動
        this.executePhaseLogic(delta);
    }
}
```

### 3. ホットリロード機能

#### 開発モードでのリアルタイム更新
```javascript
// Game.js での統合
export class Game {
    constructor() {
        // ... 既存の初期化
        
        if (process.env.NODE_ENV === 'development') {
            this.entityLoader = new EntityLoader();
            this.setupHotReload();
        }
    }
    
    setupHotReload() {
        // Entity Builder からの更新通知を受信
        window.addEventListener('entityUpdated', (event) => {
            const { type, id, data } = event.detail;
            this.reloadEntity(type, id, data);
        });
    }
    
    reloadEntity(type, id, data) {
        switch (type) {
            case 'player_ship':
                this.reloadPlayerShip(data);
                break;
            case 'enemy_ship':
                this.reloadEnemyShips(id, data);
                break;
            case 'boss_ship':
                this.reloadBoss(id, data);
                break;
        }
    }
}
```

### 4. バランス統合

#### DPS計算機能
```javascript
// src/systems/BalanceCalculator.js
export class BalanceCalculator {
    static calculateDPS(weaponData) {
        const { damage, fireRate, burstCount = 1 } = weaponData;
        const shotsPerSecond = 1000 / fireRate;
        return damage * burstCount * shotsPerSecond;
    }
    
    static calculateTTK(targetHealth, weaponDPS) {
        return targetHealth / weaponDPS;
    }
    
    static analyzeBossBalance(bossData) {
        const totalWeaponDPS = bossData.structure.weaponSystems
            .reduce((total, weapon) => total + this.calculateDPS(weapon.attackPattern), 0);
        
        return {
            totalDPS: totalWeaponDPS,
            playerTTK: this.calculateTTK(100, totalWeaponDPS), // プレイヤーHP100前提
            bossEndurance: bossData.health / 50, // プレイヤーDPS50前提
            balanceRating: this.calculateBalanceRating(bossData)
        };
    }
}
```

### 5. データフォーマット検証

#### バリデーション機能
```javascript
// src/systems/EntityValidator.js
export class EntityValidator {
    static validatePlayerShip(data) {
        const errors = [];
        
        if (!data.health || data.health <= 0) {
            errors.push('Health must be greater than 0');
        }
        
        if (!data.weaponMounts || data.weaponMounts.length === 0) {
            errors.push('At least one weapon mount is required');
        }
        
        // 3Dモデルの検証
        if (!data.model || !data.model.hull) {
            errors.push('Hull configuration is required');
        }
        
        return {
            valid: errors.length === 0,
            errors
        };
    }
    
    static validateBossShip(data) {
        const errors = [];
        
        if (!data.phases || data.phases.length === 0) {
            errors.push('At least one phase is required');
        }
        
        if (!data.structure.weaponSystems || data.structure.weaponSystems.length === 0) {
            errors.push('At least one weapon system is required');
        }
        
        // フェーズの整合性チェック
        const healthThresholds = data.phases.map(p => p.healthThreshold).sort();
        if (healthThresholds[healthThresholds.length - 1] !== 0) {
            errors.push('Final phase should have 0% health threshold');
        }
        
        return {
            valid: errors.length === 0,
            errors
        };
    }
}
```

### 6. 設定ファイルの場所

#### エンティティ設定の配置
```
src/
├── entities/
│   ├── player-ships/
│   │   ├── default-fighter.json
│   │   └── custom-ships/ # Entity Builder からの出力
│   ├── enemy-ships/
│   │   ├── basic-enemies.json
│   │   └── custom-enemies/
│   └── bosses/
│       ├── default-bosses.json
│       └── custom-bosses/
```

#### 自動ロード設定
```javascript
// vite.config.js での設定
export default defineConfig({
  plugins: [
    react(),
    // カスタムプラグイン：エンティティの自動インクルード
    {
      name: 'entity-loader',
      buildStart() {
        // entity-builder-system/exports/ の変更を監視
        this.addWatchFile('../entity-builder-system/exports/**/*.json');
      }
    }
  ]
})
```

## 使用手順

### 1. Entity Builder でエンティティ作成
1. Entity Builder アプリを起動
2. 機体・敵・ボスを設計
3. バランス調整・テスト
4. エクスポート実行

### 2. メインゲームでの使用
1. ゲーム起動時に自動ロード
2. 開発モードでのホットリロード
3. バランステストの実行

### 3. 本番環境での適用
1. 設定ファイルの最終検証
2. パフォーマンステスト
3. ゲームビルドに含める

この統合システムにより、Entity Builder で作成したエンティティがシームレスにゲームに反映されます。