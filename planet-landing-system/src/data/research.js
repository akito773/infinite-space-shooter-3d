// 研究ツリーデータ定義

export const RESEARCH_CATEGORIES = {
    PRODUCTION: 'production',
    CONSTRUCTION: 'construction',
    EXPLORATION: 'exploration',
    DEFENSE: 'defense',
    ADVANCED: 'advanced'
};

export const RESEARCH_TREE = {
    // 生産技術
    mining_efficiency_1: {
        id: 'mining_efficiency_1',
        name: '採掘効率 I',
        description: '採掘施設の生産量を20%増加',
        category: RESEARCH_CATEGORIES.PRODUCTION,
        cost: { research: 50 },
        time: 30, // 秒
        prerequisites: [],
        effects: {
            productionBonus: { mine: 1.2 }
        }
    },
    mining_efficiency_2: {
        id: 'mining_efficiency_2',
        name: '採掘効率 II',
        description: '採掘施設の生産量を40%増加',
        category: RESEARCH_CATEGORIES.PRODUCTION,
        cost: { research: 150 },
        time: 60,
        prerequisites: ['mining_efficiency_1'],
        effects: {
            productionBonus: { mine: 1.4 }
        }
    },
    energy_optimization: {
        id: 'energy_optimization',
        name: 'エネルギー最適化',
        description: '全建物のエネルギー消費を20%削減',
        category: RESEARCH_CATEGORIES.PRODUCTION,
        cost: { research: 100 },
        time: 45,
        prerequisites: [],
        effects: {
            energyConsumptionReduction: 0.8
        }
    },
    crystal_processing: {
        id: 'crystal_processing',
        name: 'クリスタル処理技術',
        description: 'クリスタル抽出機を解放',
        category: RESEARCH_CATEGORIES.PRODUCTION,
        cost: { research: 200 },
        time: 90,
        prerequisites: ['mining_efficiency_1'],
        effects: {
            unlockBuilding: 'crystal_extractor'
        }
    },
    
    // 建設技術
    fast_construction_1: {
        id: 'fast_construction_1',
        name: '高速建設 I',
        description: '建設時間を20%短縮',
        category: RESEARCH_CATEGORIES.CONSTRUCTION,
        cost: { research: 60 },
        time: 30,
        prerequisites: [],
        effects: {
            constructionSpeedBonus: 1.2
        }
    },
    fast_construction_2: {
        id: 'fast_construction_2',
        name: '高速建設 II',
        description: '建設時間を40%短縮',
        category: RESEARCH_CATEGORIES.CONSTRUCTION,
        cost: { research: 180 },
        time: 60,
        prerequisites: ['fast_construction_1'],
        effects: {
            constructionSpeedBonus: 1.4
        }
    },
    advanced_materials: {
        id: 'advanced_materials',
        name: '高度建材',
        description: '建物の最大レベルを+1',
        category: RESEARCH_CATEGORIES.CONSTRUCTION,
        cost: { research: 300 },
        time: 120,
        prerequisites: ['fast_construction_2'],
        effects: {
            maxBuildingLevelBonus: 1
        }
    },
    
    // 探索技術
    underground_mapping: {
        id: 'underground_mapping',
        name: '地下マッピング',
        description: '地下でのリソース発見率を50%増加',
        category: RESEARCH_CATEGORIES.EXPLORATION,
        cost: { research: 80 },
        time: 40,
        prerequisites: [],
        effects: {
            undergroundResourceBonus: 1.5
        }
    },
    hazard_protection: {
        id: 'hazard_protection',
        name: 'ハザード保護',
        description: '地下でのダメージを30%軽減',
        category: RESEARCH_CATEGORIES.EXPLORATION,
        cost: { research: 120 },
        time: 50,
        prerequisites: ['underground_mapping'],
        effects: {
            hazardDamageReduction: 0.7
        }
    },
    exploration_gear: {
        id: 'exploration_gear',
        name: '探索装備',
        description: '移動速度を25%増加',
        category: RESEARCH_CATEGORIES.EXPLORATION,
        cost: { research: 100 },
        time: 45,
        prerequisites: [],
        effects: {
            moveSpeedBonus: 1.25
        }
    },
    
    // 防衛技術
    turret_damage_1: {
        id: 'turret_damage_1',
        name: 'タレット強化 I',
        description: '防衛タレットのダメージを30%増加',
        category: RESEARCH_CATEGORIES.DEFENSE,
        cost: { research: 100 },
        time: 50,
        prerequisites: [],
        effects: {
            turretDamageBonus: 1.3
        }
    },
    shield_technology: {
        id: 'shield_technology',
        name: 'シールド技術',
        description: '建物に自動修復シールドを追加',
        category: RESEARCH_CATEGORIES.DEFENSE,
        cost: { research: 250 },
        time: 100,
        prerequisites: ['turret_damage_1'],
        effects: {
            buildingShields: true
        }
    },
    
    // 高度技術
    ai_automation: {
        id: 'ai_automation',
        name: 'AI自動化',
        description: '資源の自動売買システムを解放',
        category: RESEARCH_CATEGORIES.ADVANCED,
        cost: { research: 500 },
        time: 180,
        prerequisites: ['energy_optimization', 'fast_construction_2'],
        effects: {
            enableAutoTrade: true
        }
    },
    quantum_storage: {
        id: 'quantum_storage',
        name: '量子ストレージ',
        description: '資源の保管上限を2倍に',
        category: RESEARCH_CATEGORIES.ADVANCED,
        cost: { research: 400 },
        time: 150,
        prerequisites: ['advanced_materials'],
        effects: {
            storageMultiplier: 2
        }
    },
    planetary_network: {
        id: 'planetary_network',
        name: '惑星ネットワーク',
        description: '全生産施設の効率を30%向上',
        category: RESEARCH_CATEGORIES.ADVANCED,
        cost: { research: 800 },
        time: 240,
        prerequisites: ['ai_automation', 'quantum_storage'],
        effects: {
            globalProductionBonus: 1.3
        }
    }
};

// 研究カテゴリ情報
export const CATEGORY_INFO = {
    [RESEARCH_CATEGORIES.PRODUCTION]: {
        name: '生産技術',
        icon: '⚙️',
        color: 0x4488ff,
        description: '資源生産と効率を向上させる技術'
    },
    [RESEARCH_CATEGORIES.CONSTRUCTION]: {
        name: '建設技術',
        icon: '🏗️',
        color: 0xff8844,
        description: '建設速度と建物性能を向上させる技術'
    },
    [RESEARCH_CATEGORIES.EXPLORATION]: {
        name: '探索技術',
        icon: '🔍',
        color: 0x44ff88,
        description: '探索能力と地下活動を強化する技術'
    },
    [RESEARCH_CATEGORIES.DEFENSE]: {
        name: '防衛技術',
        icon: '🛡️',
        color: 0xff4444,
        description: '防衛力と耐久性を向上させる技術'
    },
    [RESEARCH_CATEGORIES.ADVANCED]: {
        name: '高度技術',
        icon: '🔬',
        color: 0xff44ff,
        description: '最先端技術による革新的な機能'
    }
};