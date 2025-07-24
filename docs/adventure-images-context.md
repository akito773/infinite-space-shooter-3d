# アドベンチャーパート画像コンテキスト仕様書

## 概要
ビジュアルノベル風のアドベンチャーパートで使用する画像の仕様とコンテキストをまとめたドキュメントです。

## 画像カテゴリと仕様

### 1. 背景画像 (Backgrounds)
画像サイズ: 1920x1080 (16:9)
ファイル形式: JPG/PNG

#### 必要な背景画像リスト：

**bg_hangar.jpg** - 格納庫
- コンテキスト: 宇宙ステーションの格納庫内部
- 雰囲気: 金属的、工業的、薄暗い照明
- 要素: 戦闘機、整備機器、作業員のシルエット

**bg_tavern.jpg** - 酒場「スターダスト」
- コンテキスト: 宇宙ステーション内の酒場
- 雰囲気: 薄暗く、ネオンライト、レトロフューチャー
- 要素: カウンター、ボトル棚、宇宙が見える窓

**bg_commander_office.jpg** - 総統執務室
- コンテキスト: 軍事施設の司令官室
- 雰囲気: 権威的、整然とした、未来的
- 要素: 大きなデスク、ホログラムディスプレイ、地球連邦の紋章

**bg_space_station_corridor.jpg** - ステーション通路
- コンテキスト: 宇宙ステーション内の廊下
- 雰囲気: 清潔、未来的、少し無機質
- 要素: 金属の壁、照明パネル、案内表示

**bg_luna_room.jpg** - ルナの部屋
- コンテキスト: ルナの個人居住区
- 雰囲気: 温かみのある、個性的、少し散らかっている
- 要素: ベッド、個人的な物品、窓から見える宇宙

### 2. キャラクター立ち絵 (Character Sprites)
画像サイズ: 800x1200 (透過PNG)
ファイル形式: PNG (透過背景)

#### ルナ (Luna)
**luna_normal.png** - 通常
- 表情: 優しい笑顔
- ポーズ: リラックスした立ち姿
- 服装: パイロットスーツ

**luna_happy.png** - 喜び
- 表情: 明るい笑顔
- ポーズ: 少し前傾
- 服装: パイロットスーツ

**luna_sad.png** - 悲しみ
- 表情: 憂いのある表情
- ポーズ: 少しうつむき加減
- 服装: パイロットスーツ

**luna_angry.png** - 怒り
- 表情: 眉をひそめた表情
- ポーズ: 腕組み
- 服装: パイロットスーツ

**luna_embarrassed.png** - 照れ
- 表情: 頬を赤らめた表情
- ポーズ: 少し身を引く
- 服装: パイロットスーツ

**luna_casual.png** - 私服
- 表情: リラックスした笑顔
- ポーズ: カジュアルな立ち姿
- 服装: 私服（酒場シーン用）

#### 総統 (Commander)
**commander_normal.png** - 通常
- 表情: 威厳のある真剣な表情
- ポーズ: 直立、手を後ろで組む
- 服装: 軍服

**commander_serious.png** - 深刻
- 表情: 眉間にしわを寄せた表情
- ポーズ: 腕組み
- 服装: 軍服

#### バーテンダー (Bartender)
**bartender_normal.png** - 通常
- 表情: 穏やかな笑み
- ポーズ: カウンターに手をつく
- 服装: バーテンダー服

### 3. イベントCG (Event CGs)
画像サイズ: 1920x1080
ファイル形式: JPG

**cg_luna_first_meet.jpg** - ルナとの出会い
- シーン: 酒場でルナと初めて出会うシーン
- 構図: ルナがカウンターに座っている
- 雰囲気: 温かく、少し神秘的

**cg_commander_briefing.jpg** - 総統からの任務説明
- シーン: 総統が地球脱出作戦を説明
- 構図: ホログラム地図を背景に総統
- 雰囲気: 緊迫感、重要性

**cg_escape_earth.jpg** - 地球脱出
- シーン: 地球から脱出する戦闘機
- 構図: 地球を背景に飛び立つ戦闘機
- 雰囲気: ドラマチック、希望と不安

### 4. UI要素 (UI Elements)
**dialogue_box.png** - 会話ボックス
- サイズ: 1920x300
- デザイン: 半透明、未来的
- 配置: 画面下部

**name_plate.png** - 名前表示プレート
- サイズ: 300x60
- デザイン: 半透明、シンプル
- 配置: 会話ボックス左上

**choice_button.png** - 選択肢ボタン
- サイズ: 600x80
- デザイン: 半透明、ホバー効果用
- 配置: 画面中央

## 実装時の画像配置

```
assets/
├── adventure/
│   ├── backgrounds/
│   │   ├── bg_hangar.jpg
│   │   ├── bg_tavern.jpg
│   │   ├── bg_commander_office.jpg
│   │   ├── bg_space_station_corridor.jpg
│   │   └── bg_luna_room.jpg
│   ├── characters/
│   │   ├── luna/
│   │   │   ├── luna_normal.png
│   │   │   ├── luna_happy.png
│   │   │   ├── luna_sad.png
│   │   │   ├── luna_angry.png
│   │   │   ├── luna_embarrassed.png
│   │   │   └── luna_casual.png
│   │   ├── commander/
│   │   │   ├── commander_normal.png
│   │   │   └── commander_serious.png
│   │   └── bartender/
│   │       └── bartender_normal.png
│   ├── cg/
│   │   ├── cg_luna_first_meet.jpg
│   │   ├── cg_commander_briefing.jpg
│   │   └── cg_escape_earth.jpg
│   └── ui/
│       ├── dialogue_box.png
│       ├── name_plate.png
│       └── choice_button.png
```

## 画像の使用シーン

### 1. ゲーム開始時
- 背景: bg_commander_office.jpg
- キャラクター: commander_serious.png
- シーン: 総統から地球脱出の指令を受ける

### 2. 酒場シーン
- 背景: bg_tavern.jpg
- キャラクター: bartender_normal.png, luna_casual.png
- シーン: 酒場での会話、ルナとの出会い

### 3. ルナ加入イベント
- CG: cg_luna_first_meet.jpg
- その後: luna_normal.png を使用した通常会話

### 4. 格納庫シーン
- 背景: bg_hangar.jpg
- キャラクター: luna_normal.png
- シーン: 出撃前の会話

## プレースホルダー画像

実際の画像が用意されるまで、以下のプレースホルダーを使用：
- 背景: 単色グラデーション
- キャラクター: シルエット
- CG: テキストラベル付き黒画面

## 注意事項

1. すべての画像は後から差し替え可能な構造で実装
2. 画像読み込みエラー時のフォールバック処理を実装
3. 画像のプリロード機能を実装して、シーン切り替えをスムーズに
4. レスポンシブ対応（アスペクト比の維持）