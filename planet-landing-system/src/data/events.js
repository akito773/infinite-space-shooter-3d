// ランダムイベントデータ

export const RANDOM_EVENTS = {
    // 隕石群
    METEOR_SHOWER: {
        id: 'meteor_shower',
        name: '隕石群接近',
        icon: '☄️',
        description: '大規模な隕石群が接近しています！',
        frequency: 0.15, // 発生確率
        minInterval: 60000, // 最小発生間隔（ミリ秒）
        choices: [
            {
                text: '防衛システムで迎撃',
                requirements: { hasDefense: true },
                outcomes: [
                    {
                        probability: 0.8,
                        effects: { credits: -100 },
                        message: '隕石群を撃退しました！',
                        type: 'success'
                    },
                    {
                        probability: 0.2,
                        effects: { buildingDamage: 1 },
                        message: '一部の隕石が着弾しました',
                        type: 'warning'
                    }
                ]
            },
            {
                text: 'シールドを展開',
                requirements: { energy: 500 },
                outcomes: [
                    {
                        probability: 1.0,
                        effects: { energy: -500 },
                        message: 'エネルギーシールドで防御成功',
                        type: 'success'
                    }
                ]
            },
            {
                text: '避難して耐える',
                requirements: {},
                outcomes: [
                    {
                        probability: 0.6,
                        effects: { buildingDamage: 2 },
                        message: '軽微な被害で済みました',
                        type: 'warning'
                    },
                    {
                        probability: 0.4,
                        effects: { buildingDamage: 3, resources: { iron: -50 } },
                        message: '施設に大きな被害が出ました',
                        type: 'error'
                    }
                ]
            }
        ]
    },
    
    // 資源発見
    RESOURCE_DISCOVERY: {
        id: 'resource_discovery',
        name: '新資源脈発見',
        icon: '💎',
        description: '探査チームが新しい資源脈を発見しました！',
        frequency: 0.2,
        minInterval: 45000,
        choices: [
            {
                text: '即座に採掘開始',
                requirements: { credits: 500 },
                outcomes: [
                    {
                        probability: 0.7,
                        effects: { credits: -500, resources: { iron: 200, crystal: 50 } },
                        message: '豊富な資源を獲得しました！',
                        type: 'success'
                    },
                    {
                        probability: 0.3,
                        effects: { credits: -500, resources: { iron: 100 } },
                        message: '予想より少ない資源でした',
                        type: 'info'
                    }
                ]
            },
            {
                text: '詳細調査を実施',
                requirements: { research: 10 },
                outcomes: [
                    {
                        probability: 0.8,
                        effects: { research: -10, newResourceNode: true },
                        message: '恒久的な採掘地点を確立！',
                        type: 'success'
                    },
                    {
                        probability: 0.2,
                        effects: { research: -10, resources: { crystal: 20 } },
                        message: '希少なクリスタルを発見',
                        type: 'success'
                    }
                ]
            },
            {
                text: '後で調査する',
                requirements: {},
                outcomes: [
                    {
                        probability: 1.0,
                        effects: {},
                        message: '位置を記録しました',
                        type: 'info'
                    }
                ]
            }
        ]
    },
    
    // 太陽フレア
    SOLAR_FLARE: {
        id: 'solar_flare',
        name: '太陽フレア',
        icon: '☀️',
        description: '強力な太陽フレアが発生しています',
        frequency: 0.1,
        minInterval: 90000,
        choices: [
            {
                text: 'エネルギー収集装置を調整',
                requirements: { hasEnergyPlant: true },
                outcomes: [
                    {
                        probability: 0.6,
                        effects: { energyBonus: 2.0, duration: 30000 },
                        message: 'エネルギー生産が2倍に！',
                        type: 'success'
                    },
                    {
                        probability: 0.4,
                        effects: { buildingDisabled: 'power_plant', duration: 20000 },
                        message: '過負荷により一時停止',
                        type: 'warning'
                    }
                ]
            },
            {
                text: '全システムをシャットダウン',
                requirements: {},
                outcomes: [
                    {
                        probability: 0.9,
                        effects: { productionStop: true, duration: 15000 },
                        message: '機器を保護しました',
                        type: 'info'
                    },
                    {
                        probability: 0.1,
                        effects: {},
                        message: '問題なく通過しました',
                        type: 'success'
                    }
                ]
            }
        ]
    },
    
    // 異星生物遭遇
    ALIEN_ENCOUNTER: {
        id: 'alien_encounter',
        name: '異星生物遭遇',
        icon: '👽',
        description: '未知の生命体を検知しました',
        frequency: 0.08,
        minInterval: 120000,
        choices: [
            {
                text: 'コミュニケーションを試みる',
                requirements: { hasCommTower: true },
                outcomes: [
                    {
                        probability: 0.5,
                        effects: { research: 50, reputation: 10 },
                        message: '友好的な交流に成功！',
                        type: 'success'
                    },
                    {
                        probability: 0.3,
                        effects: { resources: { crystal: 30 } },
                        message: '贈り物を受け取りました',
                        type: 'success'
                    },
                    {
                        probability: 0.2,
                        effects: {},
                        message: '生物は立ち去りました',
                        type: 'info'
                    }
                ]
            },
            {
                text: '警戒態勢を取る',
                requirements: {},
                outcomes: [
                    {
                        probability: 0.7,
                        effects: {},
                        message: '生物は去っていきました',
                        type: 'info'
                    },
                    {
                        probability: 0.3,
                        effects: { combat: true },
                        message: '敵対的行動を取られました！',
                        type: 'error'
                    }
                ]
            },
            {
                text: '観察を続ける',
                requirements: {},
                outcomes: [
                    {
                        probability: 0.8,
                        effects: { research: 20 },
                        message: '貴重な観察データを取得',
                        type: 'success'
                    },
                    {
                        probability: 0.2,
                        effects: { stealthBonus: true },
                        message: '生物の隠密技術を学習',
                        type: 'success'
                    }
                ]
            }
        ]
    },
    
    // 古代遺跡発見
    ANCIENT_RUINS: {
        id: 'ancient_ruins',
        name: '古代遺跡発見',
        icon: '🏛️',
        description: '地下探査中に古代文明の遺跡を発見！',
        frequency: 0.05,
        minInterval: 180000,
        choices: [
            {
                text: '慎重に発掘する',
                requirements: { research: 30 },
                outcomes: [
                    {
                        probability: 0.4,
                        effects: { research: -30, newTechnology: 'ancient_tech' },
                        message: '古代技術を解明！',
                        type: 'success'
                    },
                    {
                        probability: 0.4,
                        effects: { research: -30, resources: { crystal: 100 } },
                        message: '古代のエネルギー結晶を発見',
                        type: 'success'
                    },
                    {
                        probability: 0.2,
                        effects: { research: -30, trap: true },
                        message: '防衛システムが作動！',
                        type: 'error'
                    }
                ]
            },
            {
                text: '強引に突破',
                requirements: { credits: 1000 },
                outcomes: [
                    {
                        probability: 0.5,
                        effects: { credits: -1000, resources: { iron: 300, crystal: 150 } },
                        message: '大量の資源を獲得！',
                        type: 'success'
                    },
                    {
                        probability: 0.5,
                        effects: { credits: -1000, buildingDamage: 2 },
                        message: '遺跡が崩壊、被害発生',
                        type: 'error'
                    }
                ]
            },
            {
                text: '位置を記録して撤退',
                requirements: {},
                outcomes: [
                    {
                        probability: 1.0,
                        effects: { futureBonus: true },
                        message: '後で探索可能になりました',
                        type: 'info'
                    }
                ]
            }
        ]
    },
    
    // 機器故障
    EQUIPMENT_MALFUNCTION: {
        id: 'equipment_malfunction',
        name: '機器故障',
        icon: '⚠️',
        description: '重要システムに異常が発生！',
        frequency: 0.12,
        minInterval: 50000,
        choices: [
            {
                text: '緊急修理を実施',
                requirements: { credits: 300 },
                outcomes: [
                    {
                        probability: 0.8,
                        effects: { credits: -300 },
                        message: '修理完了',
                        type: 'success'
                    },
                    {
                        probability: 0.2,
                        effects: { credits: -300, productionPenalty: 0.8, duration: 30000 },
                        message: '部分的な修理に留まる',
                        type: 'warning'
                    }
                ]
            },
            {
                text: '応急処置で対応',
                requirements: {},
                outcomes: [
                    {
                        probability: 0.5,
                        effects: { productionPenalty: 0.5, duration: 60000 },
                        message: '生産効率が半減',
                        type: 'warning'
                    },
                    {
                        probability: 0.5,
                        effects: { randomBuildingDisabled: true, duration: 45000 },
                        message: '一部施設が停止',
                        type: 'error'
                    }
                ]
            }
        ]
    }
};