# Infinite Space Shooter 3D - 実装コンテキスト

## プロジェクト概要
太陽系を舞台にした3Dシューティングゲーム。プレイヤーは戦闘パイロット兼開拓者として、2.5D平面探索と3D球体レイド戦を楽しめる。

## 実装済みシステム

### 1. 基本ゲームシステム ✅
- **ファイル**: `src/Game.js`, `src/entities/PlayerShip.js`
- **機能**: 3Dシューティング、カメラ追従、敵AI、弾丸システム
- **特徴**: 2.5D平面ベースの探索（Y軸-30~+30に制限）

### 2. ゾーン管理システム ✅
- **ファイル**: `src/systems/ZoneManager.js`
- **機能**: 太陽系を惑星エリアごとに分割管理
- **ゾーン**: 地球、火星、木星（拡張可能）
- **特徴**: 各ゾーンは独立した空間、実際の太陽系データ使用

### 3. ワープゲートシステム ✅
- **ファイル**: `src/objects/WarpGate.js`
- **機能**: 惑星エリア間の移動
- **操作**: Fキー長押しでアクティベーション
- **演出**: 回転リング、ポータルエフェクト、パーティクル

### 4. メモリ管理システム ✅
- **ファイル**: `src/systems/AssetManager.js`, `src/systems/ZoneManagerMemory.js`
- **機能**: 効率的なロード/アンロード、アセット管理
- **特徴**: 最大3ゾーン同時ロード、自動ガベージコレクション
- **最適化**: 参照カウンタ、プリロード、パフォーマンス監視

### 5. レイドバトルシステム ✅
- **ファイル**: `src/systems/RaidBattleSystem.js`
- **機能**: 球体空間での特殊戦闘（通常は2.5D、レイド時のみ3D）
- **特徴**: ジャミング、位置情報共有、ピンシステム
- **PvP**: チーム戦、キャプチャーポイント対応

### 6. 探索イベントシステム ✅
- **ファイル**: `src/systems/ExplorationEventSystem.js`, `src/objects/DebrisField.js`
- **機能**: ランダムイベント、デブリ除去、宇宙クジラ遭遇
- **歴史的発見**: ボイジャー、パイオニア探査機の発見イベント
- **教育要素**: 実際の宇宙探査機データ使用

### 7. 新惑星発見システム ✅
- **ファイル**: `src/systems/PlanetDiscoverySystem.js`
- **機能**: スキャンによる隠し惑星発見、ランダム惑星生成
- **特徴**: 3秒スキャン、クールダウン制御、美しい発見エフェクト
- **操作**: Sキーまたは画面ボタンでスキャン実行

### 8. その他の主要システム ✅
- **インベントリ・ショップ**: `src/systems/InventorySystem.js`, `src/systems/ShopSystem.js`
- **ストーリー管理**: `src/systems/StorySystem.js`
- **採掘システム**: `src/systems/MiningSystem.js`
- **スキルシステム**: `src/systems/SkillSystem.js`
- **サウンド管理**: `src/systems/SoundManager.js`

## 並行開発中のシステム

### 惑星着陸システム 🔨
- **場所**: `planet-landing-system/`フォルダ
- **状況**: 別AIで並行開発中
- **機能**: 基地建設、リソース管理、地下探索
- **統合**: メインゲームでは「実装予定」表示

## 次の実装予定

### 1. 新惑星発見システム ✅
- **優先度**: Medium  
- **概要**: 探索による新惑星の動的発見
- **実装済み機能**:
  - スキャンシステム（Sキーまたはボタン）で隠し惑星発見
  - 発見確率と条件管理（スキャンベース、近接ベース）
  - 新惑星の自動生成（ランダムプラネット）
  - 発見時の特別演出（画面エフェクト、サウンド）
  - 3つの事前定義惑星（月面基地、フォボス採掘跡、謎の宇宙船）
  - 発見記録とセーブ/ロード機能

### 2. マルチプレイヤー対応 🎯
- **優先度**: Low
- **概要**: オンライン協力・対戦機能
- **機能**:
  - インスタンス制（各エリア20-50人）
  - 協力レイドバトル
  - PvP戦闘モード
  - チャット・通信機能

## アーキテクチャ設計

### ファイル構造
```
src/
├── Game.js                 # メインゲームループ
├── entities/              # ゲームオブジェクト
│   ├── PlayerShip.js
│   ├── Planet.js
│   └── SpaceStation.js
├── systems/               # ゲームシステム
│   ├── ZoneManager.js     # ゾーン管理
│   ├── AssetManager.js    # メモリ管理
│   ├── RaidBattleSystem.js
│   └── ExplorationEventSystem.js
├── objects/               # 3Dオブジェクト
│   ├── WarpGate.js
│   └── DebrisField.js
└── environment/           # 環境・背景
```

### 設計パターン
- **モジュラー設計**: 各システムは独立して動作
- **イベントドリブン**: システム間はイベントで通信
- **アセット管理**: 参照カウンタによるメモリ効率化
- **非同期処理**: ゾーンロード、プリロードは非同期

## 技術仕様

### 宇宙空間設計
- **基本**: 2.5D平面ベース（Y軸制限）
- **範囲**: X,Z軸 -50,000～+50,000ユニット
- **レイド**: 球体空間（半径1,500～3,000ユニット）

### ゾーン管理
- **最大同時ロード**: 3ゾーン
- **プリロード**: 隣接ゾーンをバックグラウンドロード
- **アンロード**: 非接続ゾーンを優先的にアンロード

### パフォーマンス
- **メモリ監視**: 5秒ごとの自動監視
- **ガベージコレクション**: 30秒未使用でGC
- **LODシステム**: 距離に応じた描画品質調整

## データ構造

### ゾーン定義
```javascript
zone: {
  id: 'earth',
  name: '地球エリア',
  radius: 5000,
  solarDistance: 1.0,
  planetData: {
    radius: 50,
    color: 0x4169E1,
    atmosphere: true
  },
  satellites: [...],
  features: ['spaceStation', 'asteroidField']
}
```

### ワープゲート接続
```javascript
connections: Map {
  'earth' => Set(['mars']),
  'mars' => Set(['earth', 'jupiter'])
}
```

## UI/UX設計

### 通常時（2.5D）
- ミニマップ: XZ平面の俯瞰図
- HUD: 体力、シールド、スコア
- レーダー: 周辺オブジェクト表示

### レイド時（3D球体）
- 3Dレーダー: 球体空間の位置表示
- ジャミングUI: 信号強度、妨害状況
- チーム状態: 味方の位置・状況

### ゾーン移動
- ローディング: スピナー+プログレスバー
- ワープゲートUI: アクティベーション進行度
- ゾーン情報: 惑星データ、距離情報

## 拡張計画

### 短期（実装中）
1. ~~新惑星発見システム~~ ✅ 完了
2. 教育コンテンツ強化
3. サウンド・演出改善

### 中期
1. マルチプレイヤー実装
2. 惑星着陸システム統合
3. ストーリーモード拡充

### 長期
1. 他の恒星系への拡張
2. モバイル対応
3. VR対応検討

## 開発ガイドライン

### コーディング規約
- ES6モジュール使用
- クラスベース設計
- async/await での非同期処理
- Three.jsオブジェクトの適切な破棄

### デバッグ
- `game.debugMode = true` でデバッグ機能有効
- コンソールでパフォーマンス統計表示
- メモリ使用量の監視

### テスト
- ブラウザでの動作確認
- メモリリーク確認
- パフォーマンステスト

## 既知の課題と対応

### 課題
1. 大量のオブジェクト表示時のパフォーマンス
2. ゾーン移動時の一瞬のフリーズ
3. メモリ使用量の最適化

### 対応
1. LODシステムとオブジェクトプーリング
2. プリロードとスムーズな移行
3. アセットマネージャーによる効率化

## 連絡・引き継ぎ事項

### 重要な変更
- 従来の`spaceStations`配列は`stations`に変更
- ゾーンごとのオブジェクト管理に移行
- 2.5D平面ベースの設計採用

### 注意点
- ワープゲート作成時は`window.WarpGate`が必要
- アセット破棄時は必ず`assetManager.disposeMesh()`を使用
- 新システム追加時は`Game.js`での初期化を忘れずに

---

**最終更新**: 2025年7月
**最新実装**: 新惑星発見システム ✅ 完了
**次回実装**: マルチプレイヤー対応（低優先度）
**担当**: Claude Code AI