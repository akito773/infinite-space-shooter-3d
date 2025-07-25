# Entity Builder System - 機体・敵・ボス作成アプリ

## プロジェクト概要

3D宇宙シューティングゲーム用の機体・敵・ボス作成・編集アプリケーション。

## 目的

- **プレイヤー機体**の作成・カスタマイズ
- **敵機**の設計・バランス調整
- **ボス戦艦**の複雑な設計・攻撃パターン設定
- **武器システム**の設計・調整
- ゲームバランスの可視化・調整

## 機能要件

### 1. 機体作成機能

#### プレイヤー機体
- **基本性能設定**
  - HP、シールド容量
  - 移動速度、回転速度
  - ブースト速度・持続時間
  - エネルギー容量・回復速度

- **3Dモデル設計**
  - 基本形状（戦闘機、重装甲、軽量型など）
  - パーツの組み合わせ（翼、エンジン、コックピット）
  - カラーリング・テクスチャ設定
  - サイズ・スケール調整

- **武器システム**
  - 武器マウント位置設定
  - 武器タイプの制限（プライマリ・セカンダリ）
  - 発射角度・射程設定
  - 弾薬容量・リロード時間

#### 敵機設計
- **AI行動パターン**
  - 攻撃頻度・精度設定
  - 回避行動パターン
  - 編隊行動・連携攻撃
  - 特殊攻撃条件

- **出現条件**
  - 出現タイミング・頻度
  - 出現位置・範囲
  - ウェーブ構成での役割
  - レアリティ・出現確率

### 2. ボス戦艦設計

#### 巨大戦艦システム
- **多層構造設計**
  - メインハル（船体）
  - 武器タレット（主砲・副砲）
  - シールド発生装置
  - エンジン・推進システム

- **弱点システム**
  - 破壊可能部位の設定
  - 部位破壊による機能変化
  - 段階的破壊シーケンス

- **フェーズ戦闘**
  - HPに応じた行動パターン変化
  - 新武器システム解放
  - 特殊攻撃・必殺技

#### 攻撃パターン設計
- **武器システム配置**
  - 主砲（高ダメージ・低速）
  - 副砲（中ダメージ・中速）
  - 対空砲（低ダメージ・高速）
  - ミサイルランチャー

- **攻撃シーケンス**
  - タイムライン形式での攻撃設定
  - 条件分岐攻撃（プレイヤー位置・HP）
  - コンボ攻撃・連携攻撃

### 3. バランス調整機能

#### 性能可視化
- **ダメージ計算シミュレーター**
  - DPS（秒間ダメージ）計算
  - TTK（撃破時間）計算
  - 生存性分析

- **戦闘シミュレーション**
  - AI vs AI戦闘テスト
  - 勝率・生存時間統計
  - バランス指標の自動算出

#### プリセット管理
- **テンプレートシステム**
  - 定型機体パターン
  - 難易度別敵機セット
  - ボス戦闘パターン集

## 技術仕様

### フロントエンド
- **フレームワーク**: React + TypeScript
- **3D描画**: Three.js + React-Three-Fiber
- **UI**: Material-UI または Ant Design
- **状態管理**: Redux Toolkit

### データ管理
- **設計データ**: JSON形式でエクスポート/インポート
- **プリセット**: 事前定義されたテンプレート集
- **バージョン管理**: 設計履歴の保存・復元

### 統合機能
- **ゲーム連携**: メインゲームへの即座反映
- **ホットリロード**: リアルタイム設定変更
- **デバッグモード**: 統計情報の表示

## フォルダ構造

```
entity-builder-system/
├── src/
│   ├── components/          # UI コンポーネント
│   │   ├── EntityEditor/    # エンティティエディター
│   │   ├── ModelViewer/     # 3D プレビュー
│   │   ├── PropertyPanel/   # プロパティ設定パネル
│   │   └── WeaponSystem/    # 武器システム設定
│   ├── systems/            # ロジック・システム
│   │   ├── EntityManager/   # エンティティ管理
│   │   ├── BalanceCalculator/ # バランス計算
│   │   └── ExportSystem/    # データエクスポート
│   ├── templates/          # エンティティテンプレート
│   └── presets/           # プリセットデータ
├── docs/                  # 設計ドキュメント
├── assets/               # 3Dモデル・テクスチャ
└── dist/                # ビルド出力
```

## 開発フェーズ

### Phase 1: 基本機能
1. UI基盤構築
2. 3Dビューアー実装
3. 基本的な機体エディター

### Phase 2: 高度機能
1. ボス戦艦エディター
2. 攻撃パターン設定
3. バランス計算機能

### Phase 3: 統合・最適化
1. メインゲーム連携
2. プリセット管理
3. パフォーマンス最適化

## 別AIへの引き継ぎ要項

1. **メインゲームとの連携**を重視
2. **直感的なUI/UX**を提供
3. **リアルタイムプレビュー**機能
4. **バランス調整支援**ツール
5. **エクスポート/インポート**機能

このアプリによって、ゲームデザイナーが効率的にエンティティを作成・調整できるようになります。