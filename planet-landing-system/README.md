# 惑星着陸システム

Infinite Space Shooter 3Dのサブシステムとして動作する惑星着陸・開発システムです。

## 概要

プレイヤーが惑星に着陸すると、都市開発と探索を組み合わせたゲームプレイが楽しめます。

- **地上モード**: 基地建設、資源管理、都市開発
- **地下モード**: 2.5D探索、採掘、戦闘

## セットアップ

```bash
# メインプロジェクトのルートから
cd planet-landing-system
npm install

# 開発サーバー起動
npm run dev

# ビルド
npm run build
```

## 開発ガイド

詳細な開発情報は[CONTEXT.md](./CONTEXT.md)を参照してください。

## ディレクトリ構成

```
planet-landing-system/
├── src/                 # ソースコード
│   ├── components/      # UIコンポーネント
│   ├── systems/         # ゲームシステム
│   ├── scenes/          # シーン管理
│   └── data/           # データ定義
├── assets/             # ゲームアセット
├── public/             # 静的ファイル
└── docs/               # ドキュメント
```

## メインゲームとの連携

```javascript
// 惑星に着陸
window.dispatchEvent(new CustomEvent('landOnPlanet', {
  detail: { planetId: 'planet_001' }
}));

// 宇宙に戻る
window.dispatchEvent(new CustomEvent('returnToSpace', {
  detail: { resources: {...} }
}));
```

## 開発状況

- [ ] Phase 1: 基本システム
  - [ ] 惑星表面シーン
  - [ ] 基本的な建物システム
  - [ ] 資源管理
- [ ] Phase 2: 探索要素
  - [ ] 地表探索
  - [ ] 採掘ポイント
- [ ] Phase 3: 地下探索
  - [ ] 2.5Dシーン
  - [ ] 戦闘システム
- [ ] Phase 4: 高度な機能
  - [ ] クエスト
  - [ ] NPC

## ライセンス

メインプロジェクトに準拠