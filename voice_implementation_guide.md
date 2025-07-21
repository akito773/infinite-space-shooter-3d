# ボイス実装ガイド

## ボイスファイルの配置場所

音声ファイルは以下のフォルダ構造で配置してください：

```
public/assets/voices/
├── luna/                      # ルナの音声ファイル
│   ├── luna_greeting_01.mp3   # 挨拶1「よー！元気にしてた？」
│   ├── luna_greeting_02.mp3   # 挨拶2「おつかれさま！今日はどんな冒険してるの？」
│   ├── luna_greeting_03.mp3   # 挨拶3「あら、タイミングいいじゃない！」
│   ├── luna_greeting_04.mp3   # 挨拶4「お疲れ様！何か面白い情報ない？」
│   ├── luna_combat_01.mp3     # 戦闘1「その調子その調子！」
│   ├── luna_combat_02.mp3     # 戦闘2「うわー、派手にやってるわね〜」
│   ├── luna_combat_03.mp3     # 戦闘3「気をつけて！敵が多いよ！」
│   ├── luna_combat_04.mp3     # 戦闘4「ナイスファイト！私も見習わなきゃ」
│   ├── luna_combat_05.mp3     # 戦闘5「すごいじゃない！流石ね！」
│   ├── luna_discovery_01.mp3  # 発見1「おお！何か見つけた？」
│   ├── luna_discovery_02.mp3  # 発見2「面白そうな場所ね〜」
│   ├── luna_discovery_03.mp3  # 発見3「これは珍しいものを発見したわね！」
│   ├── luna_discovery_04.mp3  # 発見4「情報料もらっちゃおうかな〜♪」
│   ├── luna_boss_01.mp3       # ボス1「うっわー！デカいのが出てきた！」
│   ├── luna_boss_02.mp3       # ボス2「負けちゃダメよ！応援してるから！」
│   ├── luna_boss_03.mp3       # ボス3「こんなのと戦うなんて...無茶しないでよ〜」
│   ├── luna_boss_04.mp3       # ボス4「頑張って！私も祈ってるから！」
│   ├── luna_boss_defeat.mp3   # ボス撃破「すっごーい！よくやったわ！これで宇宙がちょっと平和になったわね〜♪」
│   ├── luna_casual_01.mp3     # 雑談1「そういえば、新しい酒場ができたって聞いたわ」
│   ├── luna_casual_02.mp3     # 雑談2「最近宇宙が騒がしいと思わない？」
│   ├── luna_casual_03.mp3     # 雑談3「今度一緒に飲みに行きましょうよ〜」
│   ├── luna_casual_04.mp3     # 雑談4「あなたの機体、カッコいいわね！」
│   ├── luna_casual_05.mp3     # 雑談5「ギルドでも噂になってるのよ、あなたのこと」
│   ├── luna_trust_25.mp3      # 信頼度25「ありがと！あなたと話してると楽しいわ〜」
│   ├── luna_trust_50.mp3      # 信頼度50「もうすっかり友達ね！今度ギルドに遊びに来てよ♪」
│   ├── luna_trust_75.mp3      # 信頼度75「あなたって本当に頼りになるのね。私の一番の友達よ！」
│   ├── luna_trust_100.mp3     # 信頼度100「最高のパートナーね！これからもずっとよろしく！」
│   ├── luna_tavern_meet_01.mp3 # 酒場1「あら、見ない顔ね。新人さん？私、ルナよ。情報なら何でも知ってるわ〜」
│   ├── luna_tavern_meet_02.mp3 # 酒場2「ここは「流れ星」酒場。宇宙で一番美味しいお酒が飲めるのよ♪」
│   └── luna_tavern_meet_03.mp3 # 酒場3「あなた、面白そうね！今度一緒に飲みましょう。通信コード交換しない？」
│
├── boss/
│   ├── battleship/            # 中ボスの音声
│   │   ├── boss_battleship_start_01.mp3
│   │   ├── boss_battleship_start_02.mp3
│   │   ├── boss_battleship_damage_01.mp3
│   │   ├── boss_battleship_damage_02.mp3
│   │   ├── boss_battleship_defeat_01.mp3
│   │   └── boss_battleship_defeat_02.mp3
│   │
│   └── raid/                  # レイドボスの音声
│       ├── boss_raid_start_01.mp3
│       ├── boss_raid_start_02.mp3
│       ├── boss_raid_phase_01.mp3
│       ├── boss_raid_phase_02.mp3
│       ├── boss_raid_phase_03.mp3
│       └── boss_raid_defeat_01.mp3
│
└── system/                    # システム音声
    ├── tutorial_move.mp3
    ├── tutorial_combat.mp3
    ├── warning_damage.mp3
    ├── warning_energy_low.mp3
    └── warning_enemy_detected.mp3
```

## VoiceSystemの使い方

### 1. Gameクラスで初期化
```javascript
// Game.js
import { VoiceSystem } from './systems/VoiceSystem.js';

class Game {
    constructor() {
        // ...
        this.voiceSystem = new VoiceSystem(this);
        
        // ルナのボイスをプリロード
        this.voiceSystem.preloadCharacterVoices('luna');
    }
}
```

### 2. CompanionSystemでの使用例
```javascript
// 挨拶ボイス再生
this.showMessage("よー！元気にしてた？", 5000, 'greetings', 0);

// ランダムな戦闘ボイス再生
this.game.voiceSystem.playLunaVoice('combat');

// 信頼度ボイス再生
this.game.voiceSystem.playTrustLevelVoice(50);
```

### 3. ボリューム設定
```javascript
// 音量調整（0.0～1.0）
this.game.voiceSystem.setVolume(0.8);

// ボイスのオン/オフ
this.game.voiceSystem.setEnabled(false);
```

## 音声ファイルの仕様

### 推奨フォーマット
- **形式**: MP3 または OGG
- **サンプリングレート**: 48kHz
- **ビットレート**: 128kbps以上
- **チャンネル**: モノラル（ステレオも可）

### 音声処理の推奨事項
1. **ノーマライズ**: -3dB程度のヘッドルームを確保
2. **ノイズ除去**: 背景ノイズを除去
3. **コンプレッション**: 音量を均一化
4. **無音部分**: 開始と終了に0.1秒程度の無音

## 収録時の演技指示

### ルナ（Luna Skywalker）
- **声質**: 明るく元気な20代前半の女性
- **トーン**: フレンドリーでちょっとお姉さんぶりたがる
- **感情**: 
  - 挨拶：親しみやすく、テンション高め
  - 戦闘：応援する感じ、心配と興奮が混じる
  - 発見：好奇心旺盛、わくわく感
  - ボス戦：驚きと心配、でも応援
  - 雑談：リラックス、親密な感じ

### ボス（中ボス・レイドボス）
- **声質**: 低く威圧的
- **トーン**: 尊大、プライドが高い
- **エフェクト**: 軽いリバーブやディストーション推奨

## テスト方法

ブラウザのコンソールで以下のコマンドを実行してテスト：

```javascript
// ボイステスト
game.voiceSystem.testVoice('luna', 'greeting_1');

// ランダム再生テスト
game.voiceSystem.playLunaVoice('combat');

// 音量テスト
game.voiceSystem.setVolume(0.5);
```

## トラブルシューティング

### 音声が再生されない場合
1. ブラウザの自動再生ポリシーを確認
2. ファイルパスが正しいか確認
3. 音声ファイルの形式が対応しているか確認
4. コンソールにエラーが出ていないか確認

### 音声が途切れる場合
1. ファイルサイズを確認（推奨: 1MB以下）
2. プリロードが完了しているか確認
3. ネットワーク速度を確認

## 今後の拡張予定

1. **Web Audio API統合**
   - ピッチ変更
   - 3D音響効果
   - リアルタイムエフェクト

2. **追加キャラクター**
   - 商人ギルドのトレーダー
   - 傭兵団のリーダー
   - 謎の科学者

3. **言語対応**
   - 英語版ボイス
   - 中国語版ボイス