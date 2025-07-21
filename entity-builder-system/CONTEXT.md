# Entity Builder System - 開発コンテキスト

## メインゲームとの関連性

### 現在のエンティティシステム

#### プレイヤー機体 (PlayerShip.js)
```javascript
// 現在の機体仕様
{
    health: 100,
    maxHealth: 100,
    speed: 50,
    boostSpeed: 100,
    boostDuration: 2000,
    energy: 100,
    maxEnergy: 100,
    damageMultiplier: 1.0
}
```

#### 敵機体 (EnemyShip.js)
```javascript
// 敵機の基本仕様
{
    health: 30,
    speed: 20,
    attackCooldown: 2000,
    shootingRange: 100,
    projectileSpeed: 80,
    projectileColor: 0xff4444,
    score: 100
}
```

### 武器システム (WeaponTypes.js)

#### 既存武器タイプ
1. **プライマリ武器**
   - Pulse Laser (damage: 20, rate: 100ms)
   - Rapid Fire (damage: 10, rate: 50ms, burst: 3)
   - Plasma Cannon (damage: 50, rate: 300ms, aoe: 10)
   - Scatter Shot (damage: 15, count: 5, spread: 30°)
   - Laser Array (damage: 8, continuous: true)

2. **セカンダリ武器**
   - Homing Missile (damage: 40, ammo: 20)
   - EMP Blast (stun: 3s, range: 50)
   - Ion Beam (damage: 100, charge: 2s)
   - Quantum Torpedo (damage: 200, ammo: 5)
   - Shield Projector (strength: 100, duration: 5s)

### 戦闘システム統合

#### 最新実装機能
- **予測照準システム** - 敵の動きを予測
- **ダメージ数値表示** - リアルタイムダメージ表示
- **ヒットマーカー** - 命中時の視覚フィードバック
- **ズーム機能** - 3段階ズーム

## Entity Builderが対応すべき要素

### 1. 機体設計パラメータ

#### 基本性能
```javascript
{
    // 耐久性
    health: Number,          // HP
    maxHealth: Number,       // 最大HP
    shield: Number,          // シールド容量
    armor: Number,           // 装甲値

    // 機動性
    speed: Number,           // 基本速度
    boostSpeed: Number,      // ブースト速度
    boostDuration: Number,   // ブースト持続時間
    turnRate: Number,        // 旋回速度
    
    // エネルギー
    energy: Number,          // エネルギー容量
    maxEnergy: Number,       // 最大エネルギー
    energyRecharge: Number,  // エネルギー回復速度
    
    // 戦闘
    damageMultiplier: Number, // ダメージ倍率
    criticalChance: Number,   // クリティカル率
    
    // サイズ・形状
    size: {x: Number, y: Number, z: Number},
    hitboxRadius: Number,
    mass: Number
}
```

#### 3Dモデル構成
```javascript
{
    // メインボディ
    hull: {
        type: 'fighter' | 'heavy' | 'light' | 'bomber',
        scale: Number,
        material: 'metal' | 'composite' | 'crystal',
        color: Number, // hex color
        texture: String // texture path
    },
    
    // パーツ構成
    parts: [{
        type: 'wing' | 'engine' | 'cockpit' | 'weapon_mount',
        position: {x: Number, y: Number, z: Number},
        rotation: {x: Number, y: Number, z: Number},
        scale: {x: Number, y: Number, z: Number},
        model: String, // 3D model path
        material: Object
    }],
    
    // エフェクト
    effects: {
        engineTrail: {color: Number, intensity: Number},
        shield: {color: Number, opacity: Number},
        damage: {sparks: Boolean, smoke: Boolean}
    }
}
```

### 2. 武器システム設計

#### マウントポイント
```javascript
{
    weaponMounts: [{
        id: String,
        type: 'primary' | 'secondary' | 'special',
        position: {x: Number, y: Number, z: Number},
        rotation: {x: Number, y: Number, z: Number},
        restrictions: {
            maxSize: Number,
            allowedTypes: String[],
            energyCost: Number
        }
    }]
}
```

#### カスタム武器定義
```javascript
{
    // 基本情報
    id: String,
    name: String,
    description: String,
    type: 'primary' | 'secondary' | 'special',
    rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary',
    
    // 性能
    damage: Number,
    fireRate: Number, // ms
    range: Number,
    speed: Number, // projectile speed
    accuracy: Number, // 0-1
    
    // 弾薬
    ammoType: 'energy' | 'physical' | 'special',
    ammoCapacity: Number,
    reloadTime: Number,
    
    // 特殊効果
    effects: {
        aoe: Number,      // 爆発範囲
        penetration: Number, // 貫通力
        homing: Boolean,  // ホーミング
        stun: Number,     // スタン時間
        dot: {damage: Number, duration: Number} // 継続ダメージ
    },
    
    // ビジュアル
    projectile: {
        model: String,
        texture: String,
        color: Number,
        size: Number,
        trail: {enabled: Boolean, color: Number, length: Number}
    },
    
    // サウンド
    sounds: {
        fire: String,
        hit: String,
        reload: String
    }
}
```

### 3. ボス戦艦設計

#### 巨大戦艦構造
```javascript
{
    // 基本情報
    name: String,
    type: 'battleship' | 'carrier' | 'dreadnought' | 'fortress',
    size: 'large' | 'massive' | 'titan',
    
    // 基本性能
    health: Number,
    phases: Number, // 戦闘フェーズ数
    
    // 3D構造
    structure: {
        mainHull: {
            model: String,
            scale: {x: Number, y: Number, z: Number},
            materials: Object[],
            hitboxes: Object[] // 複数の当たり判定
        },
        
        // 破壊可能部位
        destructibleParts: [{
            id: String,
            name: String, // "左主砲", "シールド発生装置" など
            position: {x: Number, y: Number, z: Number},
            health: Number,
            model: String,
            
            // 破壊時の影響
            onDestroy: {
                disableWeapons: String[],
                reduceDamage: Number,
                unlockWeakpoint: String,
                triggerPhase: Number
            }
        }],
        
        // 武器システム
        weaponSystems: [{
            id: String,
            name: String,
            type: 'main_gun' | 'secondary_gun' | 'missile_launcher' | 'laser_array',
            position: {x: Number, y: Number, z: Number},
            rotation: {x: Number, y: Number, z: Number},
            
            // 攻撃パターン
            attackPattern: {
                damage: Number,
                fireRate: Number,
                burstCount: Number,
                spread: Number,
                targetingType: 'direct' | 'predictive' | 'area',
                cooldown: Number
            }
        }]
    },
    
    // フェーズ別行動
    phases: [{
        id: Number,
        healthThreshold: Number, // この%以下で発動
        name: String,
        description: String,
        
        // 有効な武器システム
        activeWeapons: String[],
        
        // 特殊攻撃
        specialAttacks: [{
            name: String,
            cooldown: Number,
            damage: Number,
            range: Number,
            description: String,
            animation: String
        }],
        
        // AI行動
        behavior: {
            aggressiveness: Number, // 0-1
            movementPattern: 'stationary' | 'orbit' | 'advance' | 'retreat',
            targetPriority: 'closest' | 'weakest' | 'player',
            specialConditions: Object[]
        }
    }]
}
```

### 4. AI行動パターン

#### 敵AI設定
```javascript
{
    // 基本AI
    aiType: 'aggressive' | 'defensive' | 'support' | 'kamikaze' | 'elite',
    
    // 行動パラメータ
    behavior: {
        attackRange: Number,
        fleeRange: Number,
        accuracy: Number, // 0-1
        reactionTime: Number, // ms
        
        // 移動パターン
        movement: {
            type: 'direct' | 'orbit' | 'zigzag' | 'formation',
            speed: Number,
            agility: Number
        },
        
        // 攻撃パターン
        attack: {
            burstFire: Boolean,
            leadTarget: Boolean,
            useSpecialWeapons: Boolean,
            retreatOnLowHealth: Number // health %
        },
        
        // 編隊行動
        formation: {
            enabled: Boolean,
            role: 'leader' | 'follower' | 'support',
            spacing: Number,
            coordination: Number // 0-1
        }
    }
}
```

## データフォーマット標準

### エクスポート形式
```json
{
    "version": "1.0",
    "type": "player_ship" | "enemy_ship" | "boss_ship" | "weapon",
    "created": "2025-07-21T10:00:00Z",
    "author": "EntityBuilder",
    "data": {
        // 上記の設計データ
    },
    "preview": {
        "thumbnail": "data:image/png;base64,...",
        "stats": {
            "overallRating": Number,
            "balanceScore": Number,
            "complexity": Number
        }
    }
}
```

### インポート要件
- メインゲームは `/entity-builder-system/exports/` フォルダを監視
- ホットリロード対応（ゲーム中に即座反映）
- バリデーション機能（不正なデータの検出）

## 統合ポイント

### 1. ファイル配置
```
/src/entities/ → Entity Builder で作成したエンティティをここに配置
/src/weapons/ → カスタム武器定義
/src/bosses/ → ボス戦艦定義
```

### 2. ゲーム内呼び出し
```javascript
// 動的エンティティロード
const playerShip = await loadEntity('player_ships/custom_fighter.json');
const bossShip = await loadEntity('bosses/titan_battleship.json');
```

### 3. バランス統合
- DPS計算機能
- 生存性分析
- 難易度カーブ調整
- 報酬バランス

## 開発優先順位

### 高優先度
1. **基本UI構築** - React + Three.js
2. **プレイヤー機体エディター** 
3. **3Dプレビュー機能**
4. **エクスポート/インポート**

### 中優先度
1. **敵機エディター**
2. **武器システム設計**
3. **バランス計算機能**

### 低優先度
1. **ボス戦艦エディター**
2. **攻撃パターン設計**
3. **高度なAI設定**

別AIへの引き継ぎ時は、このコンテキストを参照して効率的な開発を進めてください。