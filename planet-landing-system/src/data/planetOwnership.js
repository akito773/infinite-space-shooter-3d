// 惑星所有権データ定義

export const OWNERSHIP_LEVELS = {
    UNOWNED: {
        id: 'unowned',
        name: '未所有',
        description: '誰でも着陸・開発可能',
        color: 0x888888,
        icon: '🌍'
    },
    CLAIMED: {
        id: 'claimed',
        name: '仮所有',
        description: '最初の基地建設者が仮所有',
        color: 0xffff88,
        icon: '🏴'
    },
    OWNED: {
        id: 'owned',
        name: '正式所有',
        description: '投資により正式に所有',
        color: 0x88ff88,
        icon: '🏁'
    },
    MONOPOLY: {
        id: 'monopoly',
        name: '独占',
        description: '全施設を所有し完全支配',
        color: 0xff88ff,
        icon: '👑'
    }
};

// 惑星タイプ別の基本収益
export const PLANET_BASE_INCOME = {
    terrestrial: {
        name: '地球型',
        baseIncome: 1000,
        resources: ['credits'],
        description: 'バランスの良い収益'
    },
    resource: {
        name: '資源型',
        baseIncome: 800,
        resources: ['credits', 'iron', 'crystal'],
        description: '資源産出に特化'
    },
    gas: {
        name: 'ガス型',
        baseIncome: 600,
        resources: ['credits', 'energy'],
        description: 'エネルギー産出特化'
    },
    ice: {
        name: '氷型',
        baseIncome: 500,
        resources: ['credits', 'water', 'crystal'],
        description: '希少資源あり'
    },
    volcanic: {
        name: '火山型',
        baseIncome: 700,
        resources: ['credits', 'energy', 'rare_metal'],
        description: '高リスク高リターン'
    }
};

// 買収・奪取コスト計算
export const TAKEOVER_COSTS = {
    // 買収倍率
    buyoutMultiplier: 1.5,
    
    // 開発競争での必要施設数差
    developmentThreshold: 3,
    
    // 軍事制圧の必要時間（ミリ秒）
    militaryOccupationTime: 24 * 60 * 60 * 1000, // 24時間
    
    // 最低買収価格
    minimumBuyout: 10000
};

// AIプレイヤー設定（シングルプレイ用）
export const AI_PLAYERS = [
    {
        id: 'ai_merchant',
        name: '商人ギルド',
        personality: 'economic',
        color: 0xffaa00,
        traits: {
            aggressiveness: 0.3,
            developmentFocus: 0.8,
            buyoutTendency: 0.6
        },
        preferredPlanets: ['resource', 'terrestrial']
    },
    {
        id: 'ai_military',
        name: '宇宙海軍',
        personality: 'military',
        color: 0xff0000,
        traits: {
            aggressiveness: 0.8,
            developmentFocus: 0.4,
            buyoutTendency: 0.2
        },
        preferredPlanets: ['terrestrial', 'volcanic']
    },
    {
        id: 'ai_scientist',
        name: '研究連合',
        personality: 'research',
        color: 0x00ffff,
        traits: {
            aggressiveness: 0.2,
            developmentFocus: 0.9,
            buyoutTendency: 0.4
        },
        preferredPlanets: ['ice', 'gas']
    },
    {
        id: 'ai_pirate',
        name: '宇宙海賊',
        personality: 'chaotic',
        color: 0xff00ff,
        traits: {
            aggressiveness: 0.9,
            developmentFocus: 0.2,
            buyoutTendency: 0.7
        },
        preferredPlanets: ['volcanic', 'resource']
    }
];

// 決算タイミング設定
export const SETTLEMENT_CONFIG = {
    // 定期決算
    regular: {
        interval: 7 * 24 * 60 * 60 * 1000, // 週1回
        dayOfWeek: 0, // 日曜日
        hour: 21, // 21:00
        bonusMultiplier: 1.0
    },
    
    // ミニ決算
    mini: {
        interval: 12 * 60 * 60 * 1000, // 12時間ごと
        hours: [12, 21], // 12:00, 21:00
        bonusMultiplier: 0.3
    },
    
    // 特別決算（イベント時）
    special: {
        bonusMultiplier: 2.0,
        duration: 3 * 24 * 60 * 60 * 1000 // 3日間
    }
};

// 連鎖ボーナス設定
export const CHAIN_BONUS = {
    // 隣接惑星ボーナス
    adjacent: {
        requiredCount: 2,
        bonusMultiplier: 1.2,
        name: '惑星連鎖'
    },
    
    // 同一星系支配ボーナス
    system: {
        requiredPercentage: 0.5, // 50%以上
        bonusMultiplier: 1.5,
        name: '星系支配'
    },
    
    // 全タイプ制覇ボーナス
    diversity: {
        requiredTypes: 4,
        bonusMultiplier: 1.3,
        name: '多様性ボーナス'
    }
};