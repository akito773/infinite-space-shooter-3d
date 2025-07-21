// 研究システム - 技術ツリーと研究の管理

import { RESEARCH_TREE, RESEARCH_CATEGORIES, CATEGORY_INFO } from '../data/research.js';

export class ResearchSystem {
    constructor(game) {
        this.game = game;
        
        // 研究状態
        this.completedResearch = new Set();
        this.currentResearch = null;
        this.researchProgress = 0;
        this.researchQueue = [];
        
        // 研究効果
        this.activeEffects = {};
        
        // UI参照
        this.researchUI = null;
        
        this.init();
    }
    
    init() {
        // 初期研究を設定（必要に応じて）
        console.log('研究システム初期化完了');
    }
    
    // 研究可能かチェック
    canResearch(researchId) {
        const research = RESEARCH_TREE[researchId];
        if (!research) return false;
        
        // すでに研究済み
        if (this.completedResearch.has(researchId)) return false;
        
        // 現在研究中
        if (this.currentResearch?.id === researchId) return false;
        
        // キューに入っている
        if (this.researchQueue.some(r => r.id === researchId)) return false;
        
        // 前提条件をチェック
        for (const prereq of research.prerequisites) {
            if (!this.completedResearch.has(prereq)) return false;
        }
        
        // リソースをチェック
        if (!this.game.systems.resource) return false;
        const resources = this.game.systems.resource.getResources();
        
        for (const [resource, amount] of Object.entries(research.cost)) {
            if (resources[resource] < amount) return false;
        }
        
        return true;
    }
    
    // 研究を開始
    startResearch(researchId, queued = false) {
        if (!this.canResearch(researchId)) return false;
        
        const research = RESEARCH_TREE[researchId];
        
        // リソースを消費
        for (const [resource, amount] of Object.entries(research.cost)) {
            this.game.systems.resource.addResource(resource, -amount);
        }
        
        if (queued || this.currentResearch) {
            // キューに追加
            this.researchQueue.push({
                id: researchId,
                ...research
            });
            
            this.showMessage(`${research.name}を研究キューに追加しました`, 'info');
        } else {
            // すぐに研究開始
            this.currentResearch = {
                id: researchId,
                ...research,
                startTime: Date.now()
            };
            this.researchProgress = 0;
            
            this.showMessage(`${research.name}の研究を開始しました`, 'info');
            
            // サウンド
            if (this.game.systems.sound) {
                this.game.systems.sound.play('click');
            }
        }
        
        // UI更新
        if (this.researchUI) {
            this.researchUI.updateDisplay();
        }
        
        return true;
    }
    
    // 研究の更新
    update(deltaTime) {
        if (!this.currentResearch) {
            // キューから次の研究を取得
            if (this.researchQueue.length > 0) {
                const nextResearch = this.researchQueue.shift();
                this.currentResearch = {
                    ...nextResearch,
                    startTime: Date.now()
                };
                this.researchProgress = 0;
                
                this.showMessage(`${nextResearch.name}の研究を開始しました`, 'info');
            }
            return;
        }
        
        // 研究進行
        const elapsed = (Date.now() - this.currentResearch.startTime) / 1000;
        this.researchProgress = Math.min(elapsed / this.currentResearch.time, 1);
        
        // 研究完了
        if (this.researchProgress >= 1) {
            this.completeResearch();
        }
    }
    
    // 研究完了
    completeResearch() {
        if (!this.currentResearch) return;
        
        const research = this.currentResearch;
        
        // 完了リストに追加
        this.completedResearch.add(research.id);
        
        // 効果を適用
        this.applyResearchEffects(research);
        
        // 通知
        this.showMessage(`研究完了: ${research.name}`, 'success');
        
        // サウンド
        if (this.game.systems.sound) {
            this.game.systems.sound.play('buildingComplete');
        }
        
        // 実績チェック
        if (this.game.systems.progress) {
            this.game.systems.progress.onResearchCompleted(research.id);
        }
        
        console.log(`研究完了: ${research.name}`);
        
        // 現在の研究をクリア
        this.currentResearch = null;
        this.researchProgress = 0;
        
        // UI更新
        if (this.researchUI) {
            this.researchUI.updateDisplay();
        }
    }
    
    // 研究効果を適用
    applyResearchEffects(research) {
        const effects = research.effects;
        
        // 生産ボーナス
        if (effects.productionBonus) {
            for (const [buildingType, multiplier] of Object.entries(effects.productionBonus)) {
                this.activeEffects[`production_${buildingType}`] = multiplier;
            }
        }
        
        // 建設速度ボーナス
        if (effects.constructionSpeedBonus) {
            this.activeEffects.constructionSpeed = effects.constructionSpeedBonus;
        }
        
        // エネルギー消費削減
        if (effects.energyConsumptionReduction) {
            this.activeEffects.energyConsumption = effects.energyConsumptionReduction;
        }
        
        // 建物アンロック
        if (effects.unlockBuilding) {
            if (this.game.systems.building) {
                this.game.systems.building.unlockBuilding(effects.unlockBuilding);
            }
        }
        
        // 最大建物レベルボーナス
        if (effects.maxBuildingLevelBonus) {
            this.activeEffects.maxBuildingLevel = (this.activeEffects.maxBuildingLevel || 0) + effects.maxBuildingLevelBonus;
        }
        
        // 地下リソースボーナス
        if (effects.undergroundResourceBonus) {
            this.activeEffects.undergroundResource = effects.undergroundResourceBonus;
        }
        
        // ハザードダメージ軽減
        if (effects.hazardDamageReduction) {
            this.activeEffects.hazardDamage = effects.hazardDamageReduction;
        }
        
        // 移動速度ボーナス
        if (effects.moveSpeedBonus) {
            this.activeEffects.moveSpeed = effects.moveSpeedBonus;
            
            // 探索システムに適用
            if (this.game.systems.exploration) {
                this.game.systems.exploration.updateMoveSpeed(effects.moveSpeedBonus);
            }
        }
        
        // タレットダメージボーナス
        if (effects.turretDamageBonus) {
            this.activeEffects.turretDamage = effects.turretDamageBonus;
        }
        
        // その他の効果
        if (effects.buildingShields) {
            this.activeEffects.buildingShields = true;
        }
        
        if (effects.enableAutoTrade) {
            this.activeEffects.autoTrade = true;
        }
        
        if (effects.storageMultiplier) {
            this.activeEffects.storage = effects.storageMultiplier;
            
            // 資源システムに適用
            if (this.game.systems.resource) {
                this.game.systems.resource.updateStorageCapacity();
            }
        }
        
        if (effects.globalProductionBonus) {
            this.activeEffects.globalProduction = effects.globalProductionBonus;
        }
    }
    
    // 効果を取得
    getEffect(effectType) {
        return this.activeEffects[effectType] || null;
    }
    
    // 研究済みかチェック
    isResearched(researchId) {
        return this.completedResearch.has(researchId);
    }
    
    // 研究進行状況を取得
    getCurrentResearchInfo() {
        if (!this.currentResearch) return null;
        
        return {
            research: this.currentResearch,
            progress: this.researchProgress,
            remainingTime: Math.ceil(this.currentResearch.time * (1 - this.researchProgress))
        };
    }
    
    // 研究キューを取得
    getResearchQueue() {
        return [...this.researchQueue];
    }
    
    // 利用可能な研究を取得
    getAvailableResearch() {
        const available = [];
        
        for (const [id, research] of Object.entries(RESEARCH_TREE)) {
            if (this.canResearch(id)) {
                available.push({ id, ...research });
            }
        }
        
        return available;
    }
    
    // カテゴリ別の研究を取得
    getResearchByCategory(category) {
        const researches = [];
        
        for (const [id, research] of Object.entries(RESEARCH_TREE)) {
            if (research.category === category) {
                researches.push({
                    id,
                    ...research,
                    completed: this.completedResearch.has(id),
                    available: this.canResearch(id),
                    inProgress: this.currentResearch?.id === id,
                    inQueue: this.researchQueue.some(r => r.id === id)
                });
            }
        }
        
        return researches;
    }
    
    // 研究統計を取得
    getStatistics() {
        const totalResearch = Object.keys(RESEARCH_TREE).length;
        const completedCount = this.completedResearch.size;
        
        const categoryStats = {};
        for (const category of Object.values(RESEARCH_CATEGORIES)) {
            const categoryResearch = this.getResearchByCategory(category);
            categoryStats[category] = {
                total: categoryResearch.length,
                completed: categoryResearch.filter(r => r.completed).length
            };
        }
        
        return {
            total: totalResearch,
            completed: completedCount,
            percentage: Math.floor((completedCount / totalResearch) * 100),
            categories: categoryStats
        };
    }
    
    // UI表示
    showMessage(text, type = 'info') {
        if (this.game.components.buildingMenu) {
            this.game.components.buildingMenu.showMessage(text, type);
        }
    }
    
    // セーブ/ロード用
    serialize() {
        return {
            completedResearch: Array.from(this.completedResearch),
            currentResearch: this.currentResearch,
            researchProgress: this.researchProgress,
            researchQueue: this.researchQueue,
            activeEffects: this.activeEffects
        };
    }
    
    deserialize(data) {
        this.completedResearch = new Set(data.completedResearch || []);
        this.currentResearch = data.currentResearch || null;
        this.researchProgress = data.researchProgress || 0;
        this.researchQueue = data.researchQueue || [];
        this.activeEffects = data.activeEffects || {};
        
        // 現在の研究の開始時間を調整
        if (this.currentResearch) {
            const elapsedTime = this.researchProgress * this.currentResearch.time * 1000;
            this.currentResearch.startTime = Date.now() - elapsedTime;
        }
    }
}