// ストーリーイベントトリガーシステム
// 各ゾーンや特定の条件でストーリーイベントを発動

import * as THREE from 'three';

export class StoryEventTrigger {
    constructor(game) {
        this.game = game;
        this.activeEvents = new Map();
        this.completedEvents = new Set();
        
        // イベント定義
        this.events = {
            // 地球イベント
            earth_first_landing: {
                zone: 'earth',
                condition: () => this.game.landingSystem?.hasLanded && !this.completedEvents.has('earth_first_landing'),
                priority: 1,
                action: () => {
                    this.game.storyDialogue.startDialogue('luna_first_meet', () => {
                        this.game.storySystem.storyFlags.hasMetLuna = true;
                        this.game.companionSystem.activate();
                    });
                }
            },
            
            // 火星イベント
            mars_ancient_site: {
                zone: 'mars',
                condition: () => this.isInZone('mars') && !this.completedEvents.has('mars_ancient_site'),
                priority: 1,
                delay: 3000,
                action: () => {
                    this.game.storyDialogue.startDialogue('dark_nebula_intro', () => {
                        this.game.storySystem.storyFlags.darkNebulaEncountered = true;
                        // ダークネビュラボスを出現させる
                        this.spawnDarkNebula();
                    });
                }
            },
            
            mars_seal_activation: {
                zone: 'mars',
                condition: () => this.game.storySystem?.storyFlags.darkNebulaEncountered && 
                                this.game.landingSystem?.hasLanded && 
                                !this.completedEvents.has('mars_seal_activation'),
                priority: 2,
                action: () => {
                    this.showSealActivation('mars', () => {
                        this.game.storySystem.storyFlags.ancientSealCount++;
                        this.unlockNextPlanet();
                    });
                }
            },
            
            // 木星イベント
            jupiter_storm_entry: {
                zone: 'jupiter',
                condition: () => this.isInZone('jupiter') && !this.completedEvents.has('jupiter_storm_entry'),
                priority: 1,
                action: () => {
                    this.game.storyDialogue.startDialogue('jupiter_storm', () => {
                        // 嵐のエフェクトを追加
                        this.createStormEffect();
                    });
                }
            },
            
            // 土星イベント
            saturn_revelation: {
                zone: 'saturn',
                condition: () => this.isInZone('saturn') && 
                                this.game.storySystem?.storyFlags.ancientSealCount >= 2 &&
                                !this.completedEvents.has('saturn_revelation'),
                priority: 1,
                action: () => {
                    this.game.storyDialogue.startDialogue('father_reveal', () => {
                        this.game.storySystem.storyFlags.darkNebulaIdentityRevealed = true;
                        // ダークネビュラの正体を明かす
                        if (this.game.currentBoss?.revealIdentity) {
                            this.game.currentBoss.revealIdentity();
                        }
                    });
                }
            },
            
            // 戦闘中イベント
            luna_trust_25: {
                zone: 'any',
                condition: () => this.game.companionSystem?.relationshipLevel >= 25 && 
                                !this.completedEvents.has('luna_trust_25'),
                priority: 3,
                action: () => {
                    this.game.voiceSystem?.playTrustLevelVoice(25);
                    this.showTrustMessage('ルナとの絆が深まった！');
                }
            },
            
            luna_trust_50: {
                zone: 'any',
                condition: () => this.game.companionSystem?.relationshipLevel >= 50 && 
                                !this.completedEvents.has('luna_trust_50'),
                priority: 3,
                action: () => {
                    this.game.voiceSystem?.playTrustLevelVoice(50);
                    this.showTrustMessage('ルナとの信頼関係が確立された！');
                }
            },
            
            luna_trust_75: {
                zone: 'any',
                condition: () => this.game.companionSystem?.relationshipLevel >= 75 && 
                                !this.completedEvents.has('luna_trust_75'),
                priority: 3,
                action: () => {
                    this.game.voiceSystem?.playTrustLevelVoice(75);
                    this.showTrustMessage('ルナとの絆が特別なものになった！');
                }
            },
            
            luna_trust_100: {
                zone: 'any',
                condition: () => this.game.companionSystem?.relationshipLevel >= 100 && 
                                !this.completedEvents.has('luna_trust_100'),
                priority: 3,
                action: () => {
                    this.game.voiceSystem?.playTrustLevelVoice(100);
                    this.showTrustMessage('ルナとの絆が最高潮に達した！');
                    // 特別な報酬やエンディング分岐フラグ
                    this.game.storySystem.storyFlags.maxTrustAchieved = true;
                }
            },
            
            // ボス戦イベント
            dark_nebula_phase2: {
                zone: 'any',
                condition: () => this.game.currentBoss?.constructor.name === 'DarkNebulaBoss' &&
                                this.game.currentBoss?.phase === 2 &&
                                !this.completedEvents.has('dark_nebula_phase2'),
                priority: 2,
                action: () => {
                    this.game.storyDialogue.startDialogue('father_conflict', () => {
                        // ルナの特別な援護
                        this.activateLunaSupport();
                    });
                }
            },
            
            // 特殊イベント
            all_seals_activated: {
                zone: 'any',
                condition: () => this.game.storySystem?.storyFlags.ancientSealCount >= 4 &&
                                !this.completedEvents.has('all_seals_activated'),
                priority: 1,
                action: () => {
                    this.game.storyDialogue.startDialogue('final_preparation', () => {
                        // 最終決戦の準備
                        this.prepareFinalBattle();
                    });
                }
            }
        };
        
        // イベントチェック間隔
        this.checkInterval = 1000; // 1秒ごと
        this.lastCheck = 0;
        
        // イベントキュー
        this.eventQueue = [];
        this.processingEvent = false;
    }
    
    update(deltaTime) {
        this.lastCheck += deltaTime;
        
        if (this.lastCheck >= this.checkInterval / 1000) {
            this.lastCheck = 0;
            this.checkEvents();
        }
        
        // イベントキューの処理
        if (!this.processingEvent && this.eventQueue.length > 0) {
            this.processNextEvent();
        }
    }
    
    checkEvents() {
        const currentZone = this.game.zoneManager?.currentZone || 'earth';
        const eligibleEvents = [];
        
        // 条件を満たすイベントを収集
        Object.entries(this.events).forEach(([eventId, event]) => {
            if (this.completedEvents.has(eventId)) return;
            
            if ((event.zone === 'any' || event.zone === currentZone) && event.condition()) {
                eligibleEvents.push({ id: eventId, ...event });
            }
        });
        
        // 優先度でソート
        eligibleEvents.sort((a, b) => a.priority - b.priority);
        
        // 最優先イベントをキューに追加
        if (eligibleEvents.length > 0 && !this.eventQueue.some(e => e.id === eligibleEvents[0].id)) {
            this.eventQueue.push(eligibleEvents[0]);
        }
    }
    
    processNextEvent() {
        if (this.eventQueue.length === 0) return;
        
        const event = this.eventQueue.shift();
        this.processingEvent = true;
        
        // 遅延がある場合
        if (event.delay) {
            setTimeout(() => {
                this.executeEvent(event);
            }, event.delay);
        } else {
            this.executeEvent(event);
        }
    }
    
    executeEvent(event) {
        console.log(`ストーリーイベント発動: ${event.id}`);
        
        // イベントを完了済みにマーク
        this.completedEvents.add(event.id);
        
        // イベントアクションを実行
        event.action();
        
        // 処理完了
        setTimeout(() => {
            this.processingEvent = false;
        }, 500);
    }
    
    // ヘルパーメソッド
    isInZone(zoneId) {
        return this.game.zoneManager?.currentZone === zoneId;
    }
    
    spawnDarkNebula() {
        if (!this.game.bossSpawnSystem) return;
        
        // ダークネビュラを特殊ボスとして出現
        import('../entities/DarkNebulaBoss.js').then(module => {
            const DarkNebulaBoss = module.DarkNebulaBoss;
            const boss = new DarkNebulaBoss(this.game.scene, new THREE.Vector3(0, 0, -150));
            
            this.game.currentBoss = boss;
            this.game.bossSpawnSystem.currentBoss = boss;
            this.game.bossSpawnSystem.showBossUI();
        });
    }
    
    showSealActivation(planet, onComplete) {
        // 封印装置起動演出
        const sealUI = document.createElement('div');
        sealUI.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: radial-gradient(circle, rgba(0,255,255,0.3), rgba(0,0,0,0.9));
            border: 3px solid #00ffff;
            border-radius: 50%;
            width: 300px;
            height: 300px;
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 3000;
            animation: sealPulse 2s ease-in-out;
        `;
        
        sealUI.innerHTML = `
            <div style="text-align: center; color: #00ffff;">
                <h2 style="margin: 0; font-size: 24px;">古代の封印</h2>
                <p style="margin: 10px 0; font-size: 18px;">${planet}の封印が起動</p>
                <div style="font-size: 48px; margin: 20px 0;">⬢</div>
                <p style="font-size: 16px;">${this.game.storySystem.storyFlags.ancientSealCount + 1}/4</p>
            </div>
        `;
        
        document.body.appendChild(sealUI);
        
        // アニメーション用CSS
        const style = document.createElement('style');
        style.textContent = `
            @keyframes sealPulse {
                0% { transform: translate(-50%, -50%) scale(0); opacity: 0; }
                50% { transform: translate(-50%, -50%) scale(1.2); opacity: 1; }
                100% { transform: translate(-50%, -50%) scale(1); opacity: 0.8; }
            }
        `;
        document.head.appendChild(style);
        
        setTimeout(() => {
            document.body.removeChild(sealUI);
            document.head.removeChild(style);
            if (onComplete) onComplete();
        }, 3000);
    }
    
    unlockNextPlanet() {
        const sealCount = this.game.storySystem.storyFlags.ancientSealCount;
        
        if (sealCount === 1 && !this.game.storySystem.storyFlags.jupiterUnlocked) {
            this.game.storySystem.storyFlags.jupiterUnlocked = true;
            this.showPlanetUnlock('木星');
        } else if (sealCount === 2 && !this.game.storySystem.storyFlags.saturnUnlocked) {
            this.game.storySystem.storyFlags.saturnUnlocked = true;
            this.showPlanetUnlock('土星');
        }
    }
    
    showPlanetUnlock(planetName) {
        this.game.ui?.showNotification(`新たな目的地「${planetName}」が解放されました！`, 'success', 5000);
    }
    
    createStormEffect() {
        // 木星の嵐エフェクト（パーティクルシステム）
        // 実装は省略
    }
    
    showTrustMessage(message) {
        const trustUI = document.createElement('div');
        trustUI.style.cssText = `
            position: fixed;
            top: 30%;
            left: 50%;
            transform: translateX(-50%);
            background: linear-gradient(135deg, rgba(255,0,150,0.9), rgba(255,100,200,0.9));
            border: 2px solid #ff99cc;
            border-radius: 20px;
            padding: 20px 40px;
            color: white;
            font-size: 24px;
            font-weight: bold;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.5);
            z-index: 2500;
            animation: trustPop 0.5s ease-out;
        `;
        trustUI.textContent = message;
        
        document.body.appendChild(trustUI);
        
        setTimeout(() => {
            trustUI.style.animation = 'trustFade 0.5s ease-in';
            setTimeout(() => {
                document.body.removeChild(trustUI);
            }, 500);
        }, 3000);
    }
    
    activateLunaSupport() {
        // ルナの特別な援護攻撃
        if (this.game.companionSystem) {
            this.game.companionSystem.activateSpecialSupport();
        }
    }
    
    prepareFinalBattle() {
        // 最終決戦の準備
        this.game.ui?.showNotification('最終決戦の準備が整いました。冥王星へ向かいましょう。', 'epic', 10000);
    }
    
    // イベントを手動でトリガー
    forceEvent(eventId) {
        if (this.events[eventId] && !this.completedEvents.has(eventId)) {
            this.eventQueue.push({ id: eventId, ...this.events[eventId] });
        }
    }
    
    // セーブ/ロード
    serialize() {
        return {
            completedEvents: Array.from(this.completedEvents)
        };
    }
    
    deserialize(data) {
        if (data.completedEvents) {
            this.completedEvents = new Set(data.completedEvents);
        }
    }
    
    // 目標完了時の処理
    onObjectivesComplete(objectiveId) {
        console.log(`ストーリー目標完了: ${objectiveId}`);
        
        // 次のフェーズへの遷移
        switch (objectiveId) {
            case 'intro':
                // イントロ完了、ルナとの出会いイベントへ
                this.forceEvent('earth_first_landing');
                break;
            case 'luna_meeting':
                // ルナとの出会い完了、火星調査へ
                if (this.game.storyObjectivesUI) {
                    this.game.storyObjectivesUI.setObjective('mars_investigation');
                }
                break;
            case 'mars_investigation':
                // 火星調査完了、次のイベントへ
                this.forceEvent('all_seals_activated');
                break;
            case 'dark_nebula_encounter':
                // ダークネビュラ撃破、最終準備へ
                if (this.game.storyObjectivesUI) {
                    this.game.storyObjectivesUI.setObjective('final_preparation');
                }
                break;
        }
    }
}