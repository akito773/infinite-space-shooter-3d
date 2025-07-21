// アドバイザーキャラクター設定

export const ADVISOR_CHARACTER = {
    name: 'ナビ助',
    nickname: 'ナビ',
    avatar: '🤖',
    personality: 'friendly_robot',
    catchphrase: 'ナビ！',
    description: '惑星開拓のベテランAI。少し関西弁でフレンドリー'
};

export const ADVICE_CONDITIONS = {
    // 初心者向けアドバイス
    FIRST_BUILDING: {
        id: 'first_building',
        priority: 10,
        condition: (gameState) => gameState.buildingCount === 0,
        advice: {
            title: 'まずは建物を作るナビ！',
            content: '何もないとこやと収入も0やから、まずは採掘施設か発電所を建ててみるナビ〜\n採掘施設は鉄を、発電所はエネルギーを作ってくれるで！',
            action: 'building_menu',
            urgency: 'high'
        }
    },
    
    // エネルギー不足
    ENERGY_SHORTAGE: {
        id: 'energy_shortage',
        priority: 9,
        condition: (gameState) => gameState.energyBalance < 0,
        advice: {
            title: 'エネルギーが足りへんナビ！',
            content: 'エネルギーが赤字やと建物が止まってまう！\n発電所を建てるか、エネルギー消費の多い建物を一時停止するナビ〜',
            action: 'energy_management',
            urgency: 'high'
        }
    },
    
    // 資源の偏り
    RESOURCE_IMBALANCE: {
        id: 'resource_imbalance',
        priority: 7,
        condition: (gameState) => {
            const { iron, energy, crystal } = gameState.resources;
            return (iron > 1000 && energy < 100) || (energy > 1000 && iron < 100);
        },
        advice: {
            title: '資源のバランスが偏ってるナビ',
            content: 'ひとつの資源ばっかり溜まっても効率悪いで〜\n輸送ターミナル(Y)使って余った資源を売ったり、足りん資源用の施設建てるナビ！',
            action: 'transport_terminal',
            urgency: 'medium'
        }
    },
    
    // 地下探索推奨
    UNDERGROUND_RECOMMENDATION: {
        id: 'underground_rec',
        priority: 6,
        condition: (gameState) => gameState.buildingCount >= 3 && !gameState.hasVisitedUnderground,
        advice: {
            title: '地下探索もやってみるナビ〜',
            content: '建物もある程度建ったし、地下探索(U)で貴重な資源を掘ってみーひん？\nクリスタルとか地上じゃ手に入らん素材があるナビよ！',
            action: 'underground_exploration',
            urgency: 'low'
        }
    },
    
    // 防衛不足
    DEFENSE_WARNING: {
        id: 'defense_warning',
        priority: 8,
        condition: (gameState) => gameState.buildingCount >= 5 && gameState.defenseCount === 0,
        advice: {
            title: '防衛も大事ナビ〜',
            content: '施設が増えたら防衛タレットも建てんとあかん！\nランダムイベントで隕石が来たり、海賊が襲ってくるかもしれへんで〜',
            action: 'build_defense',
            urgency: 'medium'
        }
    },
    
    // 研究推奨
    RESEARCH_RECOMMENDATION: {
        id: 'research_rec',
        priority: 5,
        condition: (gameState) => gameState.credits > 10000 && gameState.researchLabs === 0,
        advice: {
            title: '研究も始めるナビ？',
            content: 'クレジットもそこそこ貯まったし、研究所建てて新技術を開発してみーひん？\n新しい建物とか効率アップの技術が覚えられるナビよ〜',
            action: 'build_research',
            urgency: 'low'
        }
    },
    
    // 輸送ターミナル推奨
    TRANSPORT_TERMINAL_REC: {
        id: 'transport_rec',
        priority: 6,
        condition: (gameState) => gameState.buildingCount >= 4 && gameState.transportTerminals === 0,
        advice: {
            title: '輸送ターミナル建てるナビ！',
            content: '資源も貯まってきたし、輸送ターミナル建てて他の星に売りに行こう！\n定期的にクレジットが入るから、安定収入になるナビ〜',
            action: 'build_transport',
            urgency: 'medium'
        }
    },
    
    // 決算前通知
    SETTLEMENT_COMING: {
        id: 'settlement_coming',
        priority: 7,
        condition: (gameState) => gameState.timeUntilSettlement < 30 * 60 * 1000, // 30分前
        advice: {
            title: 'もうすぐ決算ナビ〜',
            content: '30分後に決算があるで！\n今のうちに建物建てて開発レベル上げとき〜\n決算の収益は開発レベルで決まるからな〜',
            action: 'prepare_settlement',
            urgency: 'medium'
        }
    },
    
    // イベント対策
    EVENT_PREPARATION: {
        id: 'event_prep',
        priority: 6,
        condition: (gameState) => gameState.credits > 5000 && gameState.eventCount > 2,
        advice: {
            title: 'イベント対策しとくナビ',
            content: 'ランダムイベントが結構起きてるから、対策しとこ〜\n防衛施設あると隕石対応できるし、通信塔あると異星人と交流できるナビ！',
            action: 'event_preparation',
            urgency: 'low'
        }
    },
    
    // 惑星買収推奨
    PLANET_BUYOUT_REC: {
        id: 'buyout_rec',
        priority: 4,
        condition: (gameState) => gameState.credits > 50000 && gameState.ownedPlanets === 1,
        advice: {
            title: '他の惑星も狙うナビ？',
            content: 'クレジットいっぱい貯まったなぁ〜\nAIが持ってる惑星を買収して帝国広げてみーひん？\n複数惑星持つと連鎖ボーナスで収益アップするナビ〜',
            action: 'planet_buyout',
            urgency: 'low'
        }
    }
};

export const ADVISOR_RESPONSES = {
    // プレイヤーの行動に対する反応
    building_constructed: [
        'おお〜、ええ建物建ったナビ！',
        'その調子やで〜、どんどん開発していこ〜',
        'ナイス！効率よう考えてるなぁ〜'
    ],
    
    resource_gained: [
        'リソースゲットナビ〜！',
        'ええ感じに資源集まってるで〜',
        'その調子で貯めていこ〜ナビ！'
    ],
    
    event_success: [
        'イベント成功ナビ〜！さすがや〜',
        'ええ判断やったなぁ〜、流石やで！',
        'これがプロの判断力やナビ〜'
    ],
    
    settlement_good: [
        '決算好調ナビ〜！この調子や〜',
        '順位上がったやん！ええ感じやナビ〜',
        'みんな羨ましがってるで〜、すごいナビ！'
    ],
    
    transport_success: [
        '輸送成功ナビ〜！いい商売や〜',
        'ちゃんと売り上げ立ってるなぁ〜、商才あるで〜',
        'これで宇宙商人の仲間入りナビ〜'
    ]
};

export const ADVISOR_TIPS = [
    '建物は資源ノードの近くに建てると効率ええナビ〜',
    '地下探索はリスクもあるけど、レア資源の宝庫やで〜',
    'エネルギー切れると全部止まるから、発電所は重要ナビ！',
    '決算は12時間ごとやから、計画的に開発するんやで〜',
    'AIも賢いから油断したらあかんナビ〜、競争や競争！',
    '輸送ターミナル複数建てると、でかい輸送船も呼べるナビ〜',
    'ランダムイベントは選択肢で結果変わるから、慎重にな〜',
    '研究ポイント貯めると、すごい技術覚えられるナビよ〜'
];