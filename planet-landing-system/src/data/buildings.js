// 建物データ定義

export const BUILDING_TYPES = {
    // 採掘施設
    MINE: {
        id: 'mine',
        name: '採掘施設',
        icon: '⛏️',
        maxLevel: 5,
        baseStats: {
            cost: { credits: 800, energy: 50 },
            buildTime: 20, // 秒
            production: {
                iron: 5 // 毎分（基本値、資源ノード近くでボーナス）
            },
            energyConsumption: 3,
            resourceNodeBonus: 2.0 // 資源ノード近くでの生産倍率
        },
        upgrades: {
            2: {
                cost: { credits: 1600, energy: 120 },
                buildTime: 40,
                production: { iron: 12 },
                energyConsumption: 5,
                resourceNodeBonus: 2.2
            },
            3: {
                cost: { credits: 3200, energy: 250 },
                buildTime: 80,
                production: { iron: 22 },
                energyConsumption: 8,
                resourceNodeBonus: 2.5
            },
            4: {
                cost: { credits: 6400, energy: 500 },
                buildTime: 160,
                production: { iron: 35 },
                energyConsumption: 12,
                resourceNodeBonus: 2.8
            },
            5: {
                cost: { credits: 12800, energy: 1000 },
                buildTime: 320,
                production: { iron: 50 },
                energyConsumption: 18,
                resourceNodeBonus: 3.0
            }
        }
    },
    
    // 発電所
    POWER_PLANT: {
        id: 'power_plant',
        name: '発電所',
        icon: '⚡',
        maxLevel: 5,
        baseStats: {
            cost: { credits: 1200, energy: 0 },
            buildTime: 30,
            production: {
                energy: 15 // 毎分（エネルギーを生産）
            },
            maintenance: { credits: 10 } // 毎分の維持費
        },
        upgrades: {
            2: {
                cost: { credits: 2400, energy: 0 },
                buildTime: 60,
                production: { energy: 35 },
                maintenance: { credits: 18 }
            },
            3: {
                cost: { credits: 4800, energy: 0 },
                buildTime: 120,
                production: { energy: 60 },
                maintenance: { credits: 30 }
            },
            4: {
                cost: { credits: 9600, energy: 0 },
                buildTime: 240,
                production: { energy: 90 },
                maintenance: { credits: 45 }
            },
            5: {
                cost: { credits: 19200, energy: 0 },
                buildTime: 480,
                production: { energy: 130 },
                maintenance: { credits: 65 }
            }
        }
    },
    
    // 居住区
    RESIDENCE: {
        id: 'residence',
        name: '居住区',
        icon: '🏠',
        maxLevel: 5,
        baseStats: {
            cost: { credits: 1500, energy: 100 },
            buildTime: 40,
            effects: {
                population: 10,
                workforce: 5,
                creditsBonus: 1.1 // 全体のクレジット生産に10%ボーナス
            },
            energyConsumption: 5
        },
        upgrades: {
            2: {
                cost: { credits: 3000, energy: 200 },
                buildTime: 80,
                effects: { population: 25, workforce: 12, creditsBonus: 1.2 },
                energyConsumption: 9
            },
            3: {
                cost: { credits: 6000, energy: 400 },
                buildTime: 160,
                effects: { population: 50, workforce: 25, creditsBonus: 1.3 },
                energyConsumption: 15
            },
            4: {
                cost: { credits: 12000, energy: 800 },
                buildTime: 320,
                effects: { population: 100, workforce: 50, creditsBonus: 1.4 },
                energyConsumption: 25
            },
            5: {
                cost: { credits: 24000, energy: 1600 },
                buildTime: 640,
                effects: { population: 200, workforce: 100, creditsBonus: 1.5 },
                energyConsumption: 40
            }
        }
    },
    
    // 研究所
    RESEARCH_LAB: {
        id: 'research_lab',
        name: '研究所',
        icon: '🔬',
        maxLevel: 3,
        baseStats: {
            cost: { credits: 5000, energy: 500 },
            buildTime: 180,
            production: {
                research: 5 // 毎分
            },
            energyConsumption: 20,
            workforceRequired: 10
        },
        upgrades: {
            2: {
                cost: { credits: 15000, energy: 1500 },
                buildTime: 360,
                production: { research: 12 },
                energyConsumption: 35,
                workforceRequired: 20
            },
            3: {
                cost: { credits: 45000, energy: 4500 },
                buildTime: 720,
                production: { research: 25 },
                energyConsumption: 60,
                workforceRequired: 40
            }
        }
    },
    
    // 防衛タレット
    DEFENSE_TURRET: {
        id: 'defense_turret',
        name: '防衛タレット',
        icon: '🔫',
        maxLevel: 3,
        baseStats: {
            cost: { credits: 2500, energy: 200 },
            buildTime: 60,
            combat: {
                damage: 20,
                range: 50,
                fireRate: 1 // 毎秒
            },
            energyConsumption: 10
        },
        upgrades: {
            2: {
                cost: { credits: 5000, energy: 400 },
                buildTime: 120,
                combat: { damage: 40, range: 70, fireRate: 1.5 },
                energyConsumption: 18
            },
            3: {
                cost: { credits: 10000, energy: 800 },
                buildTime: 240,
                combat: { damage: 80, range: 100, fireRate: 2 },
                energyConsumption: 30
            }
        }
    },
    
    // クリスタル抽出機
    CRYSTAL_EXTRACTOR: {
        id: 'crystal_extractor',
        name: 'クリスタル抽出機',
        icon: '💎',
        maxLevel: 3,
        baseStats: {
            cost: { credits: 3000, energy: 300, iron: 100 },
            buildTime: 90,
            production: {
                crystal: 3 // 毎分
            },
            energyConsumption: 15,
            requiresResourceNode: true // クリスタルノード近くに建設必要
        },
        upgrades: {
            2: {
                cost: { credits: 6000, energy: 600, iron: 200 },
                buildTime: 180,
                production: { crystal: 7 },
                energyConsumption: 25
            },
            3: {
                cost: { credits: 12000, energy: 1200, iron: 400 },
                buildTime: 360,
                production: { crystal: 12 },
                energyConsumption: 40
            }
        }
    },
    
    // 通信タワー
    COMM_TOWER: {
        id: 'comm_tower',
        name: '通信タワー',
        icon: '📡',
        maxLevel: 2,
        baseStats: {
            cost: { credits: 2000, energy: 150 },
            buildTime: 50,
            effects: {
                scanRange: 100, // 資源ノード検出範囲
                buildSpeedBonus: 1.2 // 周囲の建物の建設速度20%アップ
            },
            energyConsumption: 8
        },
        upgrades: {
            2: {
                cost: { credits: 5000, energy: 300 },
                buildTime: 100,
                effects: { scanRange: 200, buildSpeedBonus: 1.4 },
                energyConsumption: 15
            }
        }
    },
    
    // 輸送ターミナル
    TRANSPORT_TERMINAL: {
        id: 'transport_terminal',
        name: '輸送ターミナル',
        icon: '🚀',
        maxLevel: 3,
        baseStats: {
            cost: { credits: 5000, iron: 300, energy: 250 },
            buildTime: 180,
            effects: {
                shipCapacity: 1, // 同時着陸可能数
                storageCapacity: 500, // 一時保管容量
                transferSpeed: 10 // 毎秒の積み下ろし速度
            },
            energyConsumption: 20
        },
        upgrades: {
            2: {
                cost: { credits: 15000, iron: 800, energy: 500 },
                buildTime: 360,
                effects: {
                    shipCapacity: 2,
                    storageCapacity: 1500,
                    transferSpeed: 25
                },
                energyConsumption: 40
            },
            3: {
                cost: { credits: 50000, iron: 2000, energy: 1000, crystal: 100 },
                buildTime: 720,
                effects: {
                    shipCapacity: 3,
                    storageCapacity: 5000,
                    transferSpeed: 50
                },
                energyConsumption: 80
            }
        }
    }
};

// 建物配置ルール
export const PLACEMENT_RULES = {
    maxBuildings: 30,
    gridSize: 10,
    restrictions: {
        mine: {
            requiresResourceNode: true,
            resourceNodeRange: 15,
            maxPerPlanet: 8
        },
        power_plant: {
            minimumDistance: 20, // 他の発電所から最低20ユニット離す
            maxPerPlanet: 5
        },
        research_lab: {
            maxPerPlanet: 2
        },
        crystal_extractor: {
            requiresResourceNode: true,
            resourceNodeType: 'crystal',
            resourceNodeRange: 10,
            maxPerPlanet: 4
        },
        comm_tower: {
            minimumDistance: 50, // 他の通信タワーから離す
            maxPerPlanet: 3
        },
        transport_terminal: {
            minimumDistance: 30, // 他のターミナルから離す
            maxPerPlanet: 2,
            requiresOpenSpace: true // 上空に障害物がない
        }
    }
};

// 建物の外観データ（Three.js用）
export const BUILDING_VISUALS = {
    mine: {
        geometry: 'box',
        size: { x: 4, y: 3, z: 4 },
        color: 0x666666,
        emissive: 0x111111
    },
    power_plant: {
        geometry: 'cylinder',
        size: { radius: 3, height: 8 },
        color: 0x4488ff,
        emissive: 0x0044ff
    },
    residence: {
        geometry: 'box',
        size: { x: 6, y: 8, z: 6 },
        color: 0x886644,
        emissive: 0x442211
    },
    research_lab: {
        geometry: 'sphere',
        size: { radius: 4 },
        color: 0x44ff88,
        emissive: 0x22ff44
    },
    defense_turret: {
        geometry: 'cone',
        size: { radius: 2, height: 5 },
        color: 0xff4444,
        emissive: 0xff0000
    },
    crystal_extractor: {
        geometry: 'octahedron',
        size: { radius: 3 },
        color: 0x9966ff,
        emissive: 0x6633ff
    },
    comm_tower: {
        geometry: 'cylinder',
        size: { radius: 1.5, height: 12 },
        color: 0x33ff99,
        emissive: 0x00ff66
    },
    transport_terminal: {
        geometry: 'box',
        size: { width: 8, height: 3, depth: 8 },
        color: 0x4444ff,
        emissive: 0x2222ff,
        hasLandingPad: true // 着陸パッドの表示
    }
};