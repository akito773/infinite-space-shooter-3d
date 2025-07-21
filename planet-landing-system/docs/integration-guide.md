# メインゲームとの統合ガイド

## 概要
このドキュメントは、惑星着陸システムをメインゲーム（Infinite Space Shooter 3D）に統合する方法を説明します。

## 統合方法

### 1. ファイルの配置
惑星着陸システムは独立したモジュールとして開発されていますが、最終的にはメインゲームに統合されます。

```
infinite-space-shooter-3d/
├── src/                    # メインゲーム
├── planet-landing-system/  # 惑星着陸システム（開発時）
└── dist/                   # ビルド後の統合ファイル
```

### 2. メインゲーム側の実装

#### LandingSystem.jsの拡張
```javascript
// src/systems/LandingSystem.js に追加

async loadPlanetSystem(planetData) {
    // 惑星システムモジュールを動的にロード
    const { PlanetLandingGame } = await import('../../planet-landing-system/src/PlanetLandingGame.js');
    
    // コンテナを作成
    const planetContainer = document.createElement('div');
    planetContainer.id = 'planet-landing-container';
    planetContainer.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        z-index: 10000;
    `;
    document.body.appendChild(planetContainer);
    
    // メインゲームを一時停止
    this.game.isPaused = true;
    this.game.renderer.domElement.style.display = 'none';
    
    // 惑星ゲームを初期化
    const planetGame = new PlanetLandingGame({
        container: planetContainer,
        planetData: {
            playerId: this.game.playerId,
            playerData: {
                credits: this.game.inventorySystem.credits,
                inventory: this.game.inventorySystem.items,
                unlockedTech: this.game.unlockedTech || []
            },
            planetData: planetData
        },
        onReturn: (data) => {
            // 惑星から戻る処理
            this.handleReturnFromPlanet(data);
            planetContainer.remove();
            this.game.renderer.domElement.style.display = 'block';
            this.game.isPaused = false;
        }
    });
    
    planetGame.start();
}

handleReturnFromPlanet(data) {
    // 獲得した資源を反映
    if (data.resources.credits) {
        this.game.inventorySystem.addCredits(data.resources.credits);
    }
    
    // アイテムを追加
    data.resources.items.forEach(item => {
        this.game.inventorySystem.addItem(item);
    });
    
    // 惑星の所有権を更新
    if (data.planetStatus.owned) {
        this.game.ownedPlanets.add(data.planetId);
    }
}
```

### 3. 着陸時の処理

```javascript
// Game.js または LandingSystem.js

landOnPlanet(planet) {
    // 着陸アニメーション
    this.showLandingAnimation(planet);
    
    // 惑星システムをロード
    setTimeout(() => {
        this.landingSystem.loadPlanetSystem({
            id: planet.id,
            name: planet.name,
            type: planet.type,
            position: planet.mesh.position,
            resources: planet.resources || {}
        });
    }, 2000); // アニメーション後
}
```

### 4. ビルド統合

#### メインのvite.config.jsを更新
```javascript
export default {
    build: {
        rollupOptions: {
            input: {
                main: resolve(__dirname, 'index.html'),
                planet: resolve(__dirname, 'planet-landing-system/index.html')
            }
        }
    }
}
```

### 5. データの永続化

```javascript
// 惑星の開発状況を保存
const planetSaveData = {
    planets: {
        'planet_emerald': {
            owned: true,
            developmentLevel: 3,
            buildings: [...],
            resources: {...}
        }
    }
};

localStorage.setItem('planetData', JSON.stringify(planetSaveData));
```

## イベント通信

### メインゲーム → 惑星システム
```javascript
window.dispatchEvent(new CustomEvent('landOnPlanet', {
    detail: {
        planetId: 'planet_001',
        playerData: {...}
    }
}));
```

### 惑星システム → メインゲーム
```javascript
window.dispatchEvent(new CustomEvent('returnToSpace', {
    detail: {
        resources: {...},
        planetStatus: {...}
    }
}));
```

## パフォーマンス最適化

1. **遅延ロード**: 惑星システムは着陸時のみロード
2. **メモリ管理**: 宇宙に戻る時はThree.jsオブジェクトを適切に破棄
3. **状態管理**: 必要最小限のデータのみを保持

## トラブルシューティング

### 問題: モジュールが見つからない
```javascript
// 相対パスの調整が必要な場合
const modulePath = import.meta.env.PROD 
    ? './planet-system/PlanetLandingGame.js'
    : '../../planet-landing-system/src/PlanetLandingGame.js';
```

### 問題: スタイルの競合
```css
/* 惑星システム専用のスタイルをスコープ化 */
#planet-landing-container * {
    /* リセットスタイル */
}
```

## 開発時のテスト

1. メインゲームで惑星に接近
2. Lキーで着陸メニューを開く
3. 着陸を選択
4. 惑星システムがロードされることを確認
5. 「宇宙に戻る」で正常に戻れることを確認