# ゲームシステム詳細資料 - シナリオ連携用

## 🎮 実装済みシステムの詳細

### 1. ゾーン管理システム
```javascript
// 現在利用可能なエリア
zones: {
    earth: {
        name: '地球エリア',
        description: '人類の故郷。青く美しい水の惑星。',
        features: ['spaceStation', 'asteroidField'],
        satellites: ['月']
    },
    mars: {
        name: '火星エリア', 
        description: '赤い惑星。人類の次なるフロンティア。',
        features: ['miningColony', 'ancientRuins'],
        satellites: ['フォボス', 'ダイモス']
    },
    jupiter: {
        name: '木星エリア',
        description: 'ガスの巨人。強力な磁場と多数の衛星を持つ。',
        features: ['gasStation', 'radiationBelt', 'greatRedSpot'],
        satellites: ['イオ', 'エウロパ', 'ガニメデ', 'カリスト']
    }
}
```

**シナリオ活用例**:
- エリア間移動時の演出・会話
- 各エリアの特色を活かしたイベント
- 衛星発見時の感動シーン

### 2. 新惑星発見システム
```javascript
// 発見可能な隠し惑星
discoverablePlanets: {
    'earth_moon_base': {
        name: '月面基地跡',
        lore: '人類初の月面基地の廃墟。貴重な技術資料が眠っている。'
    },
    'mars_asteroid': {
        name: 'フォボス採掘跡', 
        lore: '火星の衛星フォボスでの採掘作業跡。レアメタルが残されている。'
    },
    'jupiter_derelict': {
        name: '謎の宇宙船',
        lore: '正体不明の巨大宇宙船。高度な技術が使われている。'
    }
}
```

**シナリオ活用例**:
- スキャンで発見 → 重要な手がかり・記録を入手
- 各発見が物語の鍵となる展開
- ヒロインとの思い出の場所として活用

### 3. レイドバトルシステム
```javascript
// 3D球体空間での特殊戦闘
raidBattle: {
    space: '球体空間（半径1500-3000ユニット）',
    features: [
        'ジャミング効果', 
        '位置情報共有遅延',
        'ピンシステム',
        'チーム戦対応'
    ]
}
```

**シナリオ活用例**:
- クライマックスでの重要な戦闘
- ヒロインとの連携戦闘
- 絶体絶命のピンチからの逆転

### 4. 探索イベントシステム
```javascript
// ランダム遭遇イベント
explorationEvents: [
    {
        type: 'historical_discovery',
        name: 'ボイジャー探査機発見',
        description: '1977年に打ち上げられた人類の探査機を発見'
    },
    {
        type: 'space_whale',
        name: '宇宙クジラ遭遇',
        description: '巨大な宇宙生物との神秘的な出会い'
    },
    {
        type: 'debris_field',
        name: 'デブリ除去',
        description: '宇宙ゴミの除去作業、報酬あり'
    }
]
```

**シナリオ活用例**:
- サブエピソードでのキャラクター交流
- 世界観の深掘り・感動シーン
- ヒロインとの価値観共有

### 5. 惑星着陸システム（開発中）
```javascript
// 惑星地表での活動
planetLanding: {
    activities: [
        '基地建設',
        'リソース採取', 
        '地下探索',
        '住民との交流'
    ],
    progression: 'ターン制 or リアルタイム進行'
}
```

**シナリオ活用例**:
- ヒロインとのプライベートな時間
- 重要な会話・告白シーン
- 過去の記憶を辿る場所として

## 🎯 ストーリー連携ポイント

### A. 自然な進行トリガー
```
プレイヤー行動 → システム反応 → ストーリー進行
例：新惑星発見 → 古代遺跡発見 → ヒロインの記憶覚醒
```

### B. 感情的な山場での活用
```
重要なシーン → 特殊システム発動 → 印象深い体験
例：告白シーン → 美しい宇宙背景 → レイドバトルでの連携
```

### C. プレイヤー選択の反映
```
選択肢 → システムパラメータ変化 → 後の展開分岐
例：戦闘重視 → レイド頻度増加 → 戦闘系ヒロインとの関係深化
```

## 📱 UI・演出制約

### 利用可能な表現手法
- **テキスト表示**: メッセージウィンドウ
- **選択肢**: 2-4個程度の分岐
- **背景**: 各エリアの3D空間
- **エフェクト**: パーティクル、ライティング
- **サウンド**: BGM、SE、将来的にボイス

### 制約事項
- **画像**: 現在は3Dモデルのみ、2Dイラストは将来実装
- **アニメーション**: 限定的、主に3Dオブジェクトの動き
- **UI**: シンプルなボタン・パネル形式

## 🔄 他システムとの連携仕様

### データ共有
```javascript
// ゲーム間で共有される状態
gameState: {
    discoveredPlanets: [], // 発見済み惑星
    completedMissions: [], // 達成済みミッション  
    relationshipLevels: {}, // キャラクター好感度
    playerChoices: [], // 重要な選択の履歴
    unlockedZones: [] // 解放済みエリア
}
```

### イベントフラグ例
```javascript
// ストーリー進行管理用
storyFlags: {
    'met_heroine': false,
    'discovered_mars_secret': false,
    'jupiter_final_battle': false,
    'ending_route': null // 'heroine_a', 'heroine_b', etc.
}
```

## 🎨 推奨演出パターン

### 1. 重要な発見シーン
```
1. プレイヤーがスキャン実行
2. 発見エフェクト（金色のフラッシュ）
3. 新惑星出現アニメーション
4. ヒロインとの会話・反応
5. ストーリー進行フラグ設定
```

### 2. 感動的な再会シーン
```
1. 特定エリアに到達
2. 通信信号受信演出
3. ワープエフェクトで移動
4. レイドバトル後にヒロイン登場
5. 感動的なBGMと共に会話
```

### 3. エンディング分岐
```
1. プレイヤーの行動履歴を集計
2. 最終エリアでの選択肢提示
3. 選択に応じたエンディングルート
4. ヒロインとの最終シーン
5. エピローグで未来描写
```

---

このシステム情報を参考に、既存機能を最大限活用できるシナリオ設計をお願いします。新機能の追加は最小限に抑え、現在の実装で魅力的な物語を作成することを重視してください。