// イベントシステム - ランダムイベントの管理と実行

import { RANDOM_EVENTS } from '../data/events.js';

export class EventSystem {
    constructor(game) {
        this.game = game;
        
        // イベント管理
        this.activeEvent = null;
        this.eventHistory = [];
        this.lastEventTime = {};
        this.temporaryEffects = [];
        
        // イベント設定
        this.eventCheckInterval = 30000; // 30秒ごとにチェック
        this.minTimeBetweenEvents = 60000; // イベント間の最小間隔
        this.lastEventCheckTime = Date.now();
        this.lastAnyEventTime = 0;
        
        // イベント発生率調整
        this.difficultyMultiplier = 1.0;
        
        // 開始時は少し待つ
        this.startDelay = 60000; // 1分後から開始
        this.gameStartTime = Date.now();
    }
    
    update(deltaTime) {
        const now = Date.now();
        
        // ゲーム開始直後はイベントを発生させない
        if (now - this.gameStartTime < this.startDelay) {
            return;
        }
        
        // 一時的効果の更新
        this.updateTemporaryEffects();
        
        // イベントチェック
        if (now - this.lastEventCheckTime >= this.eventCheckInterval) {
            this.lastEventCheckTime = now;
            this.checkForRandomEvent();
        }
    }
    
    checkForRandomEvent() {
        // 既にアクティブなイベントがある場合はスキップ
        if (this.activeEvent) return;
        
        const now = Date.now();
        
        // 最後のイベントから十分時間が経過していない場合はスキップ
        if (now - this.lastAnyEventTime < this.minTimeBetweenEvents) {
            return;
        }
        
        // 各イベントの発生チェック
        for (const [eventId, eventData] of Object.entries(RANDOM_EVENTS)) {
            // 最小間隔チェック
            const lastTime = this.lastEventTime[eventId] || 0;
            if (now - lastTime < eventData.minInterval) {
                continue;
            }
            
            // 発生確率チェック
            const probability = eventData.frequency * this.difficultyMultiplier;
            if (Math.random() < probability) {
                // 条件チェック（特定のイベントは条件が必要）
                if (this.checkEventConditions(eventData)) {
                    this.triggerEvent(eventData);
                    break;
                }
            }
        }
    }
    
    checkEventConditions(eventData) {
        // 特定イベントの前提条件をチェック
        switch (eventData.id) {
            case 'ancient_ruins':
                // 地下探索が解放されている必要がある
                return !this.game.undergroundLocked;
                
            case 'alien_encounter':
                // ある程度ゲームが進行している
                return this.game.systems.progress?.getCurrentStage() >= 2;
                
            default:
                return true;
        }
    }
    
    triggerEvent(eventData) {
        console.log(`イベント発生: ${eventData.name}`);
        
        this.activeEvent = {
            data: eventData,
            startTime: Date.now()
        };
        
        this.lastEventTime[eventData.id] = Date.now();
        this.lastAnyEventTime = Date.now();
        
        // UIに通知
        if (this.game.components.eventUI) {
            this.game.components.eventUI.showEvent(eventData);
        }
        
        // 効果音
        if (this.game.systems.sound) {
            this.game.systems.sound.playSound('event_alert');
        }
        
        // メッセージ表示
        this.game.showMessage(`⚡ ${eventData.name}`, 'warning');
    }
    
    handleChoice(choiceIndex) {
        if (!this.activeEvent) return;
        
        const eventData = this.activeEvent.data;
        const choice = eventData.choices[choiceIndex];
        
        // 要件チェック
        if (!this.checkChoiceRequirements(choice.requirements)) {
            this.game.showMessage('条件を満たしていません', 'error');
            return;
        }
        
        // 結果を決定
        const outcome = this.selectOutcome(choice.outcomes);
        
        // 効果を適用
        this.applyOutcome(outcome);
        
        // イベント履歴に記録
        this.eventHistory.push({
            eventId: eventData.id,
            choice: choiceIndex,
            outcome: outcome,
            timestamp: Date.now()
        });
        
        // イベント終了
        this.activeEvent = null;
        
        // UIを閉じる
        if (this.game.components.eventUI) {
            this.game.components.eventUI.hide();
        }
    }
    
    checkChoiceRequirements(requirements) {
        if (!requirements) return true;
        
        const resources = this.game.systems.resource?.getResources() || {};
        const buildings = this.game.systems.building?.buildings || new Map();
        
        // 資源要件
        for (const [resource, amount] of Object.entries(requirements)) {
            if (resource === 'hasDefense') {
                // 防衛施設があるか
                let hasDefense = false;
                for (const building of buildings.values()) {
                    if (building.type === 'defense_turret' && !building.isConstructing) {
                        hasDefense = true;
                        break;
                    }
                }
                if (!hasDefense) return false;
            } else if (resource === 'hasEnergyPlant') {
                // 発電所があるか
                let hasPlant = false;
                for (const building of buildings.values()) {
                    if (building.type === 'power_plant' && !building.isConstructing) {
                        hasPlant = true;
                        break;
                    }
                }
                if (!hasPlant) return false;
            } else if (resource === 'hasCommTower') {
                // 通信塔があるか
                let hasTower = false;
                for (const building of buildings.values()) {
                    if (building.type === 'comm_tower' && !building.isConstructing) {
                        hasTower = true;
                        break;
                    }
                }
                if (!hasTower) return false;
            } else if (resources[resource] !== undefined) {
                // 通常の資源チェック
                if (resources[resource] < amount) return false;
            }
        }
        
        return true;
    }
    
    selectOutcome(outcomes) {
        const random = Math.random();
        let cumulativeProbability = 0;
        
        for (const outcome of outcomes) {
            cumulativeProbability += outcome.probability;
            if (random < cumulativeProbability) {
                return outcome;
            }
        }
        
        // フォールバック
        return outcomes[outcomes.length - 1];
    }
    
    applyOutcome(outcome) {
        const effects = outcome.effects;
        
        // メッセージ表示
        this.game.showMessage(outcome.message, outcome.type);
        
        // 資源効果
        if (effects.resources) {
            for (const [resource, amount] of Object.entries(effects.resources)) {
                if (amount > 0) {
                    this.game.systems.resource.addResource(resource, amount);
                } else {
                    this.game.systems.resource.consumeResource(resource, -amount);
                }
            }
        }
        
        // クレジット効果
        if (effects.credits) {
            if (effects.credits > 0) {
                this.game.systems.resource.addResource('credits', effects.credits);
            } else {
                this.game.systems.resource.consumeResource('credits', -effects.credits);
            }
        }
        
        // 研究ポイント効果
        if (effects.research) {
            if (effects.research > 0) {
                this.game.systems.resource.addResource('research', effects.research);
            } else {
                this.game.systems.resource.consumeResource('research', -effects.research);
            }
        }
        
        // 建物ダメージ
        if (effects.buildingDamage) {
            this.damageRandomBuildings(effects.buildingDamage);
        }
        
        // 一時的効果
        if (effects.duration) {
            this.temporaryEffects.push({
                effects: effects,
                endTime: Date.now() + effects.duration
            });
            
            // エネルギーボーナス
            if (effects.energyBonus) {
                this.applyEnergyBonus(effects.energyBonus);
            }
            
            // 生産停止
            if (effects.productionStop) {
                this.stopProduction();
            }
            
            // 生産ペナルティ
            if (effects.productionPenalty) {
                this.applyProductionPenalty(effects.productionPenalty);
            }
            
            // 建物無効化
            if (effects.buildingDisabled) {
                this.disableBuilding(effects.buildingDisabled);
            }
        }
        
        // 新技術解放
        if (effects.newTechnology) {
            if (this.game.systems.research) {
                // 技術を解放（実装予定）
                console.log(`新技術解放: ${effects.newTechnology}`);
            }
        }
        
        // 新資源ノード
        if (effects.newResourceNode) {
            this.createNewResourceNode();
        }
        
        // 戦闘トリガー
        if (effects.combat) {
            if (this.game.systems.combat) {
                this.game.systems.combat.triggerAttack();
            }
        }
    }
    
    damageRandomBuildings(count) {
        const buildings = Array.from(this.game.systems.building.buildings.values())
            .filter(b => !b.isConstructing);
        
        for (let i = 0; i < count && i < buildings.length; i++) {
            const randomIndex = Math.floor(Math.random() * buildings.length);
            const building = buildings[randomIndex];
            
            // ダメージ表現（ビジュアル効果）
            if (building.mesh) {
                const originalColor = building.mesh.material.color.getHex();
                building.mesh.material.color.setHex(0xff0000);
                
                setTimeout(() => {
                    building.mesh.material.color.setHex(originalColor);
                }, 1000);
            }
            
            console.log(`${building.name}が損傷を受けました`);
        }
    }
    
    applyEnergyBonus(multiplier) {
        // エネルギー生産にボーナスを適用
        console.log(`エネルギー生産 ${multiplier}倍`);
        // 実際の実装はResourceSystemで行う
    }
    
    stopProduction() {
        // 全生産を一時停止
        console.log('全生産停止');
        // 実際の実装はResourceSystemで行う
    }
    
    applyProductionPenalty(penalty) {
        // 生産効率にペナルティを適用
        console.log(`生産効率 ${penalty * 100}%`);
        // 実際の実装はResourceSystemで行う
    }
    
    disableBuilding(buildingType) {
        // 特定タイプの建物を一時無効化
        const buildings = this.game.systems.building.buildings;
        for (const building of buildings.values()) {
            if (building.type === buildingType) {
                building.temporaryDisabled = true;
                // ビジュアル効果
                if (building.mesh) {
                    building.mesh.material.opacity = 0.5;
                    building.mesh.material.transparent = true;
                }
            }
        }
    }
    
    createNewResourceNode() {
        // 新しい資源ノードを生成
        if (this.game.systems.resourceNode) {
            const x = (Math.random() - 0.5) * 80;
            const z = (Math.random() - 0.5) * 80;
            
            this.game.systems.resourceNode.addResourceNode({
                position: { x, z },
                type: Math.random() > 0.5 ? 'iron' : 'crystal',
                richness: 0.8 + Math.random() * 0.4
            });
            
            console.log('新しい資源ノードが出現');
        }
    }
    
    updateTemporaryEffects() {
        const now = Date.now();
        
        // 終了した効果を削除
        this.temporaryEffects = this.temporaryEffects.filter(effect => {
            if (now >= effect.endTime) {
                this.removeTemporaryEffect(effect);
                return false;
            }
            return true;
        });
    }
    
    removeTemporaryEffect(effect) {
        // 一時効果を解除
        const effects = effect.effects;
        
        if (effects.productionStop || effects.productionPenalty) {
            console.log('生産再開');
        }
        
        if (effects.buildingDisabled) {
            // 建物を再有効化
            const buildings = this.game.systems.building.buildings;
            for (const building of buildings.values()) {
                if (building.type === effects.buildingDisabled && building.temporaryDisabled) {
                    building.temporaryDisabled = false;
                    if (building.mesh) {
                        building.mesh.material.opacity = 1;
                        building.mesh.material.transparent = false;
                    }
                }
            }
        }
    }
    
    // 難易度調整
    setDifficulty(level) {
        // 0.5 (簡単) ~ 2.0 (難しい)
        this.difficultyMultiplier = level;
    }
    
    // デバッグ用：イベントを強制発生
    forceEvent(eventId) {
        const eventData = RANDOM_EVENTS[eventId];
        if (eventData) {
            this.triggerEvent(eventData);
        }
    }
}