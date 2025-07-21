// チュートリアル＆段階的解放システム

export class TutorialSystem {
    constructor(game) {
        this.game = game;
        
        // チュートリアルフェーズ
        this.phases = {
            BASIC_BUILDING: {
                id: 'basic_building',
                name: '基本建設',
                order: 1,
                completed: false,
                unlocks: ['power_plant', 'mine'],
                objectives: [
                    { text: '発電所を建設する', completed: false, check: () => this.hasBuilding('power_plant') },
                    { text: '採掘施設を建設する', completed: false, check: () => this.hasBuilding('mine') }
                ]
            },
            RESOURCE_MANAGEMENT: {
                id: 'resource_management',
                name: '資源管理',
                order: 2,
                completed: false,
                unlocks: ['residence'],
                objectives: [
                    { text: '鉄を50個集める', completed: false, check: () => this.hasResource('iron', 50) },
                    { text: 'エネルギー収支をプラスにする（生産＞消費）', completed: false, check: () => this.getNetEnergyRate() > 0 }
                ]
            },
            EXPLORATION: {
                id: 'exploration',
                name: '探索',
                order: 3,
                completed: false,
                unlocks: ['exploration_mode', 'underground_access'],
                objectives: [
                    { text: '探索モードに入る（Tabキー）', completed: false, check: () => this.hasEnteredExploration },
                    { text: '資源ノードを3個収集する', completed: false, check: () => this.getCollectedNodes() >= 3 }
                ]
            },
            UNDERGROUND: {
                id: 'underground',
                name: '地下探索',
                order: 4,
                completed: false,
                unlocks: [],
                objectives: [
                    { text: '地下エリアに入る（Uキー）', completed: false, check: () => this.hasEnteredUnderground },
                    { text: '地下で貴重な資源を見つける', completed: false, check: () => this.hasUndergroundResource() }
                ]
            },
            RESEARCH: {
                id: 'research',
                name: '研究',
                order: 5,
                completed: false,
                unlocks: ['research_lab', 'research_tree'],
                objectives: [
                    { text: '研究所を建設する', completed: false, check: () => this.hasBuilding('research_lab') },
                    { text: '最初の研究を完了する', completed: false, check: () => this.hasCompletedResearch() }
                ]
            },
            ADVANCED: {
                id: 'advanced',
                name: '高度な開発',
                order: 6,
                completed: false,
                unlocks: ['all_buildings', 'all_features'],
                objectives: [
                    { text: '建物を5つ以上建設する', completed: false, check: () => this.getBuildingCount() >= 5 },
                    { text: '惑星レベル2に到達する', completed: false, check: () => this.getPlanetLevel() >= 2 }
                ]
            }
        };
        
        // 現在のフェーズ
        this.currentPhase = 'BASIC_BUILDING';
        
        // UI要素
        this.tutorialPanel = null;
        this.hintPanel = null;
        
        // フラグ
        this.hasEnteredExploration = false;
        this.hasEnteredUnderground = false;
        this.isShowingHint = false;
        
        // ヒントキュー
        this.hintQueue = [];
        
        this.init();
    }
    
    init() {
        this.createUI();
        this.applyInitialLocks();
        this.showWelcomeMessage();
    }
    
    createUI() {
        // チュートリアルパネル
        this.tutorialPanel = document.createElement('div');
        this.tutorialPanel.className = 'tutorial-panel';
        this.tutorialPanel.style.cssText = `
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: linear-gradient(135deg, rgba(33, 33, 66, 0.95), rgba(44, 44, 88, 0.95));
            border: 2px solid #6366f1;
            border-radius: 10px;
            padding: 20px;
            min-width: 400px;
            max-width: 600px;
            color: white;
            font-family: Arial, sans-serif;
            z-index: 100;
            box-shadow: 0 8px 32px rgba(99, 102, 241, 0.3);
            transition: all 0.3s ease;
        `;
        
        // ヒントパネル（画面右下）
        this.hintPanel = document.createElement('div');
        this.hintPanel.className = 'hint-panel';
        this.hintPanel.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: rgba(0, 0, 0, 0.8);
            border: 2px solid #4ade80;
            border-radius: 10px;
            padding: 15px;
            max-width: 300px;
            color: white;
            display: none;
            z-index: 101;
            animation: slideIn 0.3s ease;
        `;
        
        // アニメーションスタイル追加
        const style = document.createElement('style');
        style.textContent = `
            @keyframes slideIn {
                from { transform: translateX(100%); }
                to { transform: translateX(0); }
            }
            
            .objective-item {
                margin: 8px 0;
                padding: 8px 12px;
                background: rgba(255, 255, 255, 0.1);
                border-radius: 5px;
                display: flex;
                align-items: center;
                gap: 10px;
                transition: all 0.3s;
            }
            
            .objective-item.completed {
                background: rgba(74, 222, 128, 0.2);
                text-decoration: line-through;
                opacity: 0.7;
            }
            
            .objective-item:not(.completed):hover {
                background: rgba(99, 102, 241, 0.3);
                transform: translateX(5px);
            }
            
            .locked-feature {
                opacity: 0.3;
                pointer-events: none;
                filter: grayscale(1);
            }
            
            .unlock-notification {
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: linear-gradient(135deg, #10b981, #34d399);
                color: white;
                padding: 20px 40px;
                border-radius: 10px;
                font-size: 20px;
                font-weight: bold;
                z-index: 10000;
                animation: unlockPulse 0.5s ease;
            }
            
            @keyframes unlockPulse {
                0% { transform: translate(-50%, -50%) scale(0); }
                50% { transform: translate(-50%, -50%) scale(1.1); }
                100% { transform: translate(-50%, -50%) scale(1); }
            }
        `;
        document.head.appendChild(style);
        
        document.body.appendChild(this.tutorialPanel);
        document.body.appendChild(this.hintPanel);
        
        this.updateTutorialDisplay();
    }
    
    applyInitialLocks() {
        // 初期状態でロックする機能
        const initialLocks = [
            'residence', 'research_lab', 'defense_turret', 
            'crystal_extractor', 'comm_tower'
        ];
        
        // 建物メニューのロック
        if (this.game.components.buildingMenu) {
            initialLocks.forEach(buildingId => {
                this.lockBuilding(buildingId);
            });
        }
        
        // 探索モードをロック
        this.lockFeature('exploration');
        
        // 地下エリアをロック
        this.lockFeature('underground');
        
        // 研究UIをロック
        this.lockFeature('research');
    }
    
    lockBuilding(buildingId) {
        // 建物をロック（視覚的に無効化）
        const button = document.querySelector(`[data-building="${buildingId}"]`);
        if (button) {
            button.classList.add('locked-feature');
            button.title = '🔒 まだ解放されていません';
        }
    }
    
    unlockBuilding(buildingId) {
        const button = document.querySelector(`[data-building="${buildingId}"]`);
        if (button) {
            button.classList.remove('locked-feature');
            button.title = '';
        }
    }
    
    lockFeature(feature) {
        switch(feature) {
            case 'exploration':
                if (this.game.components.explorationUI?.toggleBtn) {
                    this.game.components.explorationUI.toggleBtn.classList.add('locked-feature');
                    this.game.components.explorationUI.toggleBtn.title = '🔒 チュートリアルを進めて解放';
                }
                break;
            case 'underground':
                // 地下アクセスをブロック
                this.game.undergroundLocked = true;
                break;
            case 'research':
                if (this.game.components.researchUI?.researchButton) {
                    this.game.components.researchUI.researchButton.classList.add('locked-feature');
                    this.game.components.researchUI.researchButton.title = '🔒 チュートリアルを進めて解放';
                }
                break;
        }
    }
    
    unlockFeature(feature) {
        switch(feature) {
            case 'exploration':
                if (this.game.components.explorationUI?.toggleBtn) {
                    this.game.components.explorationUI.toggleBtn.classList.remove('locked-feature');
                    this.game.components.explorationUI.toggleBtn.title = '';
                    this.showHint('探索モードが解放されました！Tabキーで切り替えできます。');
                }
                break;
            case 'underground':
                this.game.undergroundLocked = false;
                this.showHint('🌋 地下エリアが解放されました！<br><br>Uキーで地下に入れます。<br>危険なハザードがあるので注意してください！', 10000);
                break;
            case 'research':
                if (this.game.components.researchUI?.researchButton) {
                    this.game.components.researchUI.researchButton.classList.remove('locked-feature');
                    this.game.components.researchUI.researchButton.title = '';
                    this.showHint('研究システムが解放されました！新技術を開発できます。');
                }
                break;
        }
    }
    
    updateTutorialDisplay() {
        const phase = this.phases[this.currentPhase];
        if (!phase) return;
        
        const completedObjectives = phase.objectives.filter(obj => obj.completed).length;
        const totalObjectives = phase.objectives.length;
        const progress = (completedObjectives / totalObjectives) * 100;
        
        this.tutorialPanel.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                <h3 style="margin: 0; color: #a5b4fc;">📚 チュートリアル - ${phase.name}</h3>
                <button onclick="window.planetGame.systems.tutorial.minimizeTutorial()" style="
                    background: none;
                    border: none;
                    color: #94a3b8;
                    font-size: 20px;
                    cursor: pointer;
                ">－</button>
            </div>
            
            <div style="margin-bottom: 15px;">
                <div style="background: #1e293b; border-radius: 5px; height: 8px; overflow: hidden;">
                    <div style="
                        width: ${progress}%;
                        height: 100%;
                        background: linear-gradient(90deg, #6366f1, #8b5cf6);
                        transition: width 0.3s;
                    "></div>
                </div>
            </div>
            
            <div class="objectives">
                ${phase.objectives.map((obj, index) => {
                    return `
                        <div class="objective-item ${obj.completed ? 'completed' : ''}">
                            <span style="font-size: 18px;">${obj.completed ? '✅' : '⭕'}</span>
                            <span>${obj.text}</span>
                        </div>
                    `;
                }).join('')}
            </div>
            
            <div style="margin-top: 15px; text-align: center; color: #94a3b8; font-size: 14px;">
                フェーズ ${phase.order}/6
            </div>
        `;
    }
    
    showWelcomeMessage() {
        this.showHint(
            '🌟 惑星開発へようこそ！<br><br>' +
            '最初は発電所を建てましょう。<br>' + 
            '発電所は他の建物が使うエネルギーを生産します。<br>' +
            '建設ボタンをクリックして配置してください。',
            12000
        );
    }
    
    showHint(message, duration = 5000) {
        this.hintQueue.push({ message, duration });
        if (!this.isShowingHint) {
            this.processHintQueue();
        }
    }
    
    processHintQueue() {
        if (this.hintQueue.length === 0) {
            this.isShowingHint = false;
            return;
        }
        
        this.isShowingHint = true;
        const hint = this.hintQueue.shift();
        
        this.hintPanel.innerHTML = `
            <div style="display: flex; align-items: start; gap: 10px;">
                <span style="font-size: 24px;">💡</span>
                <div>${hint.message}</div>
            </div>
        `;
        this.hintPanel.style.display = 'block';
        
        setTimeout(() => {
            this.hintPanel.style.display = 'none';
            setTimeout(() => this.processHintQueue(), 500);
        }, hint.duration);
    }
    
    minimizeTutorial() {
        if (this.tutorialPanel.style.height === '40px') {
            this.tutorialPanel.style.height = 'auto';
            this.updateTutorialDisplay();
        } else {
            this.tutorialPanel.style.height = '40px';
            this.tutorialPanel.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <span>📚 チュートリアル（クリックで開く）</span>
                    <button onclick="window.planetGame.systems.tutorial.minimizeTutorial()" style="
                        background: none;
                        border: none;
                        color: #94a3b8;
                        font-size: 20px;
                        cursor: pointer;
                    ">＋</button>
                </div>
            `;
        }
    }
    
    update() {
        // 現在のフェーズの進行状況をチェック
        const phase = this.phases[this.currentPhase];
        if (!phase || phase.completed) return;
        
        // 各目標の完了状態を更新（一度完了したら完了のまま）
        phase.objectives.forEach(obj => {
            if (!obj.completed && obj.check()) {
                obj.completed = true;
                console.log(`目標達成: ${obj.text}`);
                
                // 特定の目標達成時にヒントを表示
                if (obj.text.includes('エネルギー収支')) {
                    this.showHint('✨ よくできました！エネルギーが安定しました。次は居住区を建てて人口を増やしましょう。');
                }
                if (obj.text.includes('資源ノードを3個収集')) {
                    this.showHint('🎉 探索をマスターしました！地下エリア（Uキー）で希少な資源を見つけましょう。', 8000);
                }
            }
        });
        
        // 特定の条件でヒントを表示
        if (this.currentPhase === 'RESOURCE_MANAGEMENT' && !phase.objectives[1].completed) {
            const netEnergy = this.getNetEnergyRate();
            if (netEnergy < 0) {
                if (!this.lastEnergyHintTime || Date.now() - this.lastEnergyHintTime > 30000) {
                    this.showHint('⚡ ヒント: エネルギーが不足しています。発電所を追加で建設しましょう！', 8000);
                    this.lastEnergyHintTime = Date.now();
                }
            }
        }
        
        // 全ての目標が完了したかチェック
        const allCompleted = phase.objectives.every(obj => obj.completed);
        
        if (allCompleted && !phase.completed) {
            this.completePhase();
        }
        
        // UI更新
        this.updateTutorialDisplay();
    }
    
    completePhase() {
        const phase = this.phases[this.currentPhase];
        phase.completed = true;
        
        // 解放する機能
        phase.unlocks.forEach(unlock => {
            if (unlock === 'exploration_mode') {
                this.unlockFeature('exploration');
            } else if (unlock === 'underground_access') {
                this.unlockFeature('underground');
            } else if (unlock === 'research_tree') {
                this.unlockFeature('research');
            } else if (unlock.includes('all_')) {
                // 全機能解放
                this.unlockAllFeatures();
            } else {
                this.unlockBuilding(unlock);
            }
        });
        
        // 完了通知
        this.showUnlockNotification(`${phase.name} 完了！`);
        
        // 次のフェーズへ
        const phaseKeys = Object.keys(this.phases);
        const currentIndex = phaseKeys.indexOf(this.currentPhase);
        if (currentIndex < phaseKeys.length - 1) {
            this.currentPhase = phaseKeys[currentIndex + 1];
            this.showHint(`新しいフェーズ「${this.phases[this.currentPhase].name}」が始まりました！`);
        } else {
            // 全チュートリアル完了
            this.completeTutorial();
        }
    }
    
    showUnlockNotification(text) {
        const notification = document.createElement('div');
        notification.className = 'unlock-notification';
        notification.textContent = '🎉 ' + text;
        document.body.appendChild(notification);
        
        // サウンド
        if (this.game.systems.sound) {
            this.game.systems.sound.play('buildingComplete');
        }
        
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }
    
    unlockAllFeatures() {
        // 全建物解放
        const allBuildings = ['mine', 'power_plant', 'residence', 'research_lab', 
                            'defense_turret', 'crystal_extractor', 'comm_tower'];
        allBuildings.forEach(id => this.unlockBuilding(id));
        
        // 全機能解放
        this.unlockFeature('exploration');
        this.unlockFeature('underground');
        this.unlockFeature('research');
    }
    
    completeTutorial() {
        this.tutorialPanel.innerHTML = `
            <div style="text-align: center; padding: 20px;">
                <h2 style="color: #4ade80; margin-bottom: 10px;">🎊 チュートリアル完了！</h2>
                <p>全ての基本機能をマスターしました。</p>
                <p style="color: #94a3b8; margin-top: 10px;">これからは自由に惑星を開発してください！</p>
                <button onclick="this.parentElement.parentElement.style.display='none'" style="
                    margin-top: 20px;
                    padding: 10px 30px;
                    background: linear-gradient(45deg, #10b981, #34d399);
                    color: white;
                    border: none;
                    border-radius: 5px;
                    font-size: 16px;
                    cursor: pointer;
                ">閉じる</button>
            </div>
        `;
        
        this.showHint('おめでとうございます！全機能が解放されました。', 8000);
    }
    
    // ヘルパーメソッド
    hasBuilding(type) {
        if (!this.game.systems.building) return false;
        return Array.from(this.game.systems.building.buildings.values())
            .some(b => b.type === type);
    }
    
    hasResource(type, amount) {
        if (!this.game.systems.resource) return false;
        return this.game.systems.resource.getResources()[type] >= amount;
    }
    
    getProductionRate(type) {
        if (!this.game.systems.resource) return 0;
        return this.game.systems.resource.getProductionRates()[type] || 0;
    }
    
    getNetEnergyRate() {
        if (!this.game.systems.resource) return 0;
        const rates = this.game.systems.resource.getProductionRates();
        return rates.energy || 0;  // getProductionRatesは既に純生産量（生産-消費）を返す
    }
    
    getBuildingCount() {
        if (!this.game.systems.building) return 0;
        return this.game.systems.building.buildings.size;
    }
    
    getCollectedNodes() {
        if (!this.game.systems.progress) return 0;
        return this.game.systems.progress.statistics.resourceNodesCollected || 0;
    }
    
    hasUndergroundResource() {
        if (!this.game.systems.resource) return false;
        return this.game.systems.resource.getResources().crystal > 0;
    }
    
    hasCompletedResearch() {
        if (!this.game.systems.research) return false;
        return this.game.systems.research.completedResearch.size > 0;
    }
    
    getPlanetLevel() {
        if (!this.game.systems.progress) return 1;
        return this.game.systems.progress.planetLevel;
    }
    
    // イベントハンドラ
    onExplorationEntered() {
        this.hasEnteredExploration = true;
    }
    
    onUndergroundEntered() {
        this.hasEnteredUnderground = true;
    }
    
    // セーブ/ロード
    serialize() {
        return {
            currentPhase: this.currentPhase,
            phases: this.phases,
            hasEnteredExploration: this.hasEnteredExploration,
            hasEnteredUnderground: this.hasEnteredUnderground
        };
    }
    
    deserialize(data) {
        if (data.currentPhase) this.currentPhase = data.currentPhase;
        if (data.phases) this.phases = data.phases;
        if (data.hasEnteredExploration) this.hasEnteredExploration = data.hasEnteredExploration;
        if (data.hasEnteredUnderground) this.hasEnteredUnderground = data.hasEnteredUnderground;
        
        // 解放状態を復元
        Object.values(this.phases).forEach(phase => {
            if (phase.completed) {
                phase.unlocks.forEach(unlock => {
                    if (unlock === 'exploration_mode') {
                        this.unlockFeature('exploration');
                    } else if (unlock === 'underground_access') {
                        this.unlockFeature('underground');
                    } else if (unlock === 'research_tree') {
                        this.unlockFeature('research');
                    } else if (!unlock.includes('all_')) {
                        this.unlockBuilding(unlock);
                    }
                });
            }
        });
        
        this.updateTutorialDisplay();
    }
}