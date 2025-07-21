// 資源システム - 資源の生成と管理

import { BUILDING_TYPES } from '../data/buildings.js';

export class ResourceSystem {
    constructor(game) {
        this.game = game;
        
        // 資源の現在値
        this.resources = {
            credits: 10000,
            iron: 0,
            energy: 100,
            crystal: 0,
            research: 0
        };
        
        // 資源の上限
        this.resourceCaps = {
            credits: 999999,
            iron: 10000,
            energy: 5000,
            crystal: 2000,
            research: 1000
        };
        
        // 生産レート（毎分）
        this.productionRates = {
            credits: 0,
            iron: 0,
            energy: 0,
            crystal: 0,
            research: 0
        };
        
        // 消費レート（毎分）
        this.consumptionRates = {
            energy: 0
        };
        
        // 人口と労働力
        this.population = 0;
        this.workforce = 0;
        this.workforceUsed = 0;
        
        // 更新間隔（ミリ秒）
        this.updateInterval = 1000; // 1秒ごと
        this.lastUpdateTime = Date.now();
        
        // UIコールバック
        this.onResourcesChanged = null;
    }
    
    // 資源を取得
    getResources() {
        return { ...this.resources };
    }
    
    // 生産レートを取得
    getProductionRates() {
        return { ...this.productionRates };
    }
    
    // 消費レートを取得
    getConsumptionRates() {
        return { ...this.consumptionRates };
    }
    
    // 純生産レート（生産 - 消費）を取得
    getNetProductionRates() {
        const netRates = { ...this.productionRates };
        
        // エネルギーは消費も考慮
        if (netRates.energy !== undefined && this.consumptionRates.energy !== undefined) {
            netRates.energy -= this.consumptionRates.energy;
        }
        
        return netRates;
    }
    
    // 人口情報を取得
    getPopulationInfo() {
        return {
            population: this.population,
            workforce: this.workforce,
            workforceUsed: this.workforceUsed,
            workforceAvailable: this.workforce - this.workforceUsed
        };
    }
    
    // 資源を追加
    addResource(type, amount) {
        if (this.resources[type] !== undefined) {
            this.resources[type] = Math.min(
                this.resources[type] + amount,
                this.resourceCaps[type]
            );
            this.notifyResourcesChanged();
            
            // 進行システムに通知
            if (this.game.systems.progress) {
                this.game.systems.progress.onResourceCollected(type, amount);
            }
            
            return true;
        }
        return false;
    }
    
    // 資源を消費
    consumeResource(type, amount) {
        if (this.resources[type] !== undefined && this.resources[type] >= amount) {
            this.resources[type] -= amount;
            this.notifyResourcesChanged();
            return true;
        }
        return false;
    }
    
    // 複数の資源を消費
    consumeResources(cost) {
        // まず全ての資源が足りるかチェック
        for (const [type, amount] of Object.entries(cost)) {
            if (this.resources[type] === undefined || this.resources[type] < amount) {
                return false;
            }
        }
        
        // 資源を消費
        for (const [type, amount] of Object.entries(cost)) {
            this.resources[type] -= amount;
        }
        
        this.notifyResourcesChanged();
        return true;
    }
    
    // 資源が足りるかチェック
    hasResources(cost) {
        for (const [type, amount] of Object.entries(cost)) {
            if (this.resources[type] === undefined || this.resources[type] < amount) {
                return false;
            }
        }
        return true;
    }
    
    // 生産レートを再計算
    recalculateProductionRates() {
        // レートをリセット
        this.productionRates = {
            credits: 0,
            iron: 0,
            energy: 0,
            crystal: 0,
            research: 0
        };
        
        this.consumptionRates = {
            energy: 0
        };
        
        this.population = 0;
        this.workforce = 0;
        this.workforceUsed = 0;
        
        // 建物システムが存在しない場合は終了
        if (!this.game.systems.building) return;
        
        // 各建物の効果を計算
        for (const building of this.game.systems.building.buildings.values()) {
            if (building.isConstructing) continue;
            
            // building.typeはid（例: 'mine'）なので、対応するデータを探す
            let buildingData = null;
            for (const data of Object.values(BUILDING_TYPES)) {
                if (data.id === building.type) {
                    buildingData = data;
                    break;
                }
            }
            
            if (!buildingData) continue;
            
            const stats = building.level === 1 
                ? buildingData.baseStats 
                : buildingData.upgrades[building.level];
            
            // 生産
            if (stats.production) {
                for (const [resource, rate] of Object.entries(stats.production)) {
                    if (this.productionRates[resource] !== undefined) {
                        let finalRate = rate;
                        
                        // 資源ノードボーナスを適用（採掘施設とクリスタル抽出機）
                        if (building.nearbyResourceNode && stats.resourceNodeBonus) {
                            finalRate *= stats.resourceNodeBonus;
                        }
                        
                        // 居住区のクレジットボーナスを適用
                        if (resource === 'credits' && stats.effects?.creditsBonus) {
                            // 後で全体に適用
                        }
                        
                        this.productionRates[resource] += finalRate;
                    }
                }
            }
            
            // エネルギー消費
            if (stats.energyConsumption) {
                this.consumptionRates.energy += stats.energyConsumption;
            }
            
            // 維持費（発電所）
            if (stats.maintenance) {
                // 維持費は後で別途処理
            }
            
            // 人口効果
            if (stats.effects) {
                if (stats.effects.population) {
                    this.population += stats.effects.population;
                }
                if (stats.effects.workforce) {
                    this.workforce += stats.effects.workforce;
                }
            }
            
            // 労働力消費
            if (stats.workforceRequired) {
                this.workforceUsed += stats.workforceRequired;
            }
        }
        
        // 居住区のクレジットボーナスを全体に適用
        let creditMultiplier = 1.0;
        for (const building of this.game.systems.building.buildings.values()) {
            if (building.isConstructing) continue;
            
            // building.typeはid（例: 'residence'）なので、対応するデータを探す
            let buildingData = null;
            for (const data of Object.values(BUILDING_TYPES)) {
                if (data.id === building.type) {
                    buildingData = data;
                    break;
                }
            }
            
            if (!buildingData) continue;
            
            const stats = building.level === 1 
                ? buildingData.baseStats 
                : buildingData.upgrades[building.level];
            
            if (stats.effects?.creditsBonus) {
                creditMultiplier *= stats.effects.creditsBonus;
            }
        }
        
        // クレジット生産にボーナスを適用
        this.productionRates.credits *= creditMultiplier;
        
        // エネルギー不足の場合、生産を停止
        if (this.productionRates.energy < this.consumptionRates.energy) {
            const energyRatio = this.productionRates.energy / this.consumptionRates.energy;
            
            // エネルギー以外の生産を比例して減少
            for (const resource in this.productionRates) {
                if (resource !== 'energy') {
                    this.productionRates[resource] *= energyRatio;
                }
            }
        }
        
        // 労働力不足の場合、研究生産を減少
        if (this.workforceUsed > this.workforce) {
            const workforceRatio = this.workforce / this.workforceUsed;
            this.productionRates.research *= workforceRatio;
        }
    }
    
    // 更新処理
    update(deltaTime) {
        const now = Date.now();
        const timeSinceLastUpdate = now - this.lastUpdateTime;
        
        if (timeSinceLastUpdate >= this.updateInterval) {
            // 生産レートを再計算
            this.recalculateProductionRates();
            
            // 経過時間（分）
            const minutesElapsed = timeSinceLastUpdate / 60000;
            
            // 資源を生産
            for (const [resource, rate] of Object.entries(this.productionRates)) {
                if (rate > 0) {
                    this.resources[resource] = Math.min(
                        this.resources[resource] + rate * minutesElapsed,
                        this.resourceCaps[resource]
                    );
                }
            }
            
            // エネルギーを消費
            const netEnergyRate = this.productionRates.energy - this.consumptionRates.energy;
            if (netEnergyRate < 0) {
                this.resources.energy = Math.max(
                    this.resources.energy + netEnergyRate * minutesElapsed,
                    0
                );
            }
            
            // 発電所の維持費を処理
            for (const building of this.game.systems.building.buildings.values()) {
                if (building.isConstructing) continue;
                
                let buildingData = null;
                for (const data of Object.values(BUILDING_TYPES)) {
                    if (data.id === building.type) {
                        buildingData = data;
                        break;
                    }
                }
                
                if (!buildingData) continue;
                
                const stats = building.level === 1 
                    ? buildingData.baseStats 
                    : buildingData.upgrades[building.level];
                
                if (stats.maintenance?.credits) {
                    const maintenanceCost = stats.maintenance.credits * minutesElapsed;
                    this.resources.credits = Math.max(
                        this.resources.credits - maintenanceCost,
                        0
                    );
                }
            }
            
            this.lastUpdateTime = now;
            this.notifyResourcesChanged();
        }
    }
    
    // UI更新通知
    notifyResourcesChanged() {
        if (this.onResourcesChanged) {
            this.onResourcesChanged({
                resources: this.getResources(),
                productionRates: this.getProductionRates(),
                consumptionRates: this.getConsumptionRates(),
                netRates: this.getNetProductionRates(),
                population: this.getPopulationInfo()
            });
        }
    }
    
    // 資源上限を増やす
    increaseResourceCap(type, amount) {
        if (this.resourceCaps[type] !== undefined) {
            this.resourceCaps[type] += amount;
            return true;
        }
        return false;
    }
    
    // チートコマンド（開発用）
    cheatAddResources(amount = 1000) {
        for (const resource in this.resources) {
            this.resources[resource] = Math.min(
                this.resources[resource] + amount,
                this.resourceCaps[resource]
            );
        }
        this.notifyResourcesChanged();
        console.log('資源を追加しました（チート）');
    }
    
    // セーブ/ロード用
    serialize() {
        return {
            resources: { ...this.resources },
            resourceCaps: { ...this.resourceCaps },
            lastUpdateTime: this.lastUpdateTime
        };
    }
    
    deserialize(data) {
        if (data.resources) {
            this.resources = { ...data.resources };
        }
        if (data.resourceCaps) {
            this.resourceCaps = { ...data.resourceCaps };
        }
        if (data.lastUpdateTime) {
            this.lastUpdateTime = data.lastUpdateTime;
        }
        
        // 生産レートを再計算
        this.recalculateProductionRates();
        this.notifyResourcesChanged();
    }
}