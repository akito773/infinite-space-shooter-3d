// 拡張ミッションシステム

export class AdvancedMissionSystem {
    constructor(game) {
        this.game = game;
        this.activeMissions = [];
        this.completedMissions = [];
        this.availableMissions = [];
        this.dailyMissions = [];
        this.missionChains = [];
        
        // ミッション難易度
        this.difficultyLevels = {
            easy: { multiplier: 1.0, color: '#00ff00', name: '簡単' },
            normal: { multiplier: 1.5, color: '#ffaa00', name: '普通' },
            hard: { multiplier: 2.0, color: '#ff6600', name: '困難' },
            extreme: { multiplier: 3.0, color: '#ff0000', name: '極限' }
        };
        
        // ミッション種類
        this.missionTypes = {
            combat: { icon: '⚔️', name: '戦闘系' },
            exploration: { icon: '🌌', name: '探索系' },
            collection: { icon: '💎', name: '収集系' },
            trading: { icon: '💰', name: '交易系' },
            escort: { icon: '🛡️', name: '護衛系' },
            survival: { icon: '💀', name: '生存系' },
            race: { icon: '🏁', name: 'レース系' },
            story: { icon: '📖', name: 'ストーリー' }
        };
        
        this.initMissionTemplates();
        this.initMissionChains();
        this.generateDailyMissions();
        this.createMissionUI();
    }
    
    initMissionTemplates() {
        this.missionTemplates = {
            // 戦闘系ミッション
            combat: [
                {
                    id: 'enemy_elimination',
                    template: true,
                    type: 'combat',
                    title: '敵機殲滅',
                    description: '指定数の敵機を撃破する',
                    objectives: [
                        { type: 'destroy_enemy', target: 'VARIABLE', current: 0 }
                    ],
                    variants: [
                        { difficulty: 'easy', target: 5, reward_credits: 1000, reward_exp: 100 },
                        { difficulty: 'normal', target: 10, reward_credits: 2500, reward_exp: 250 },
                        { difficulty: 'hard', target: 20, reward_credits: 5000, reward_exp: 500 },
                        { difficulty: 'extreme', target: 50, reward_credits: 12000, reward_exp: 1200 }
                    ]
                },
                {
                    id: 'elite_hunter',
                    template: true,
                    type: 'combat',
                    title: 'エリート狩り',
                    description: '強化型敵機を撃破する',
                    objectives: [
                        { type: 'destroy_elite_enemy', target: 'VARIABLE', current: 0 }
                    ],
                    variants: [
                        { difficulty: 'normal', target: 2, reward_credits: 3000, reward_exp: 400 },
                        { difficulty: 'hard', target: 5, reward_credits: 7500, reward_exp: 800 },
                        { difficulty: 'extreme', target: 10, reward_credits: 18000, reward_exp: 1800 }
                    ]
                },
                {
                    id: 'perfect_accuracy',
                    template: true,
                    type: 'combat',
                    title: '完璧な精度',
                    description: '指定の命中率を維持して敵を撃破',
                    objectives: [
                        { type: 'destroy_enemy_accuracy', target: 'VARIABLE', accuracy_required: 0.8, current: 0 }
                    ],
                    variants: [
                        { difficulty: 'normal', target: 5, reward_credits: 2000, reward_exp: 300 },
                        { difficulty: 'hard', target: 10, reward_credits: 5000, reward_exp: 600 }
                    ]
                }
            ],
            
            // 探索系ミッション
            exploration: [
                {
                    id: 'deep_space_scan',
                    template: true,
                    type: 'exploration',
                    title: 'Deep Space探査',
                    description: 'スキャンを実行して新しい発見をする',
                    objectives: [
                        { type: 'perform_scan', target: 'VARIABLE', current: 0 }
                    ],
                    variants: [
                        { difficulty: 'easy', target: 3, reward_credits: 800, reward_exp: 150 },
                        { difficulty: 'normal', target: 8, reward_credits: 2000, reward_exp: 350 },
                        { difficulty: 'hard', target: 15, reward_credits: 4000, reward_exp: 650 }
                    ]
                },
                {
                    id: 'planet_discovery',
                    template: true,
                    type: 'exploration',
                    title: '惑星発見',
                    description: '新しい惑星を発見する',
                    objectives: [
                        { type: 'discover_planet', target: 'VARIABLE', current: 0 }
                    ],
                    variants: [
                        { difficulty: 'normal', target: 1, reward_credits: 5000, reward_exp: 800 },
                        { difficulty: 'hard', target: 2, reward_credits: 12000, reward_exp: 1600 }
                    ]
                },
                {
                    id: 'zone_exploration',
                    template: true,
                    type: 'exploration',
                    title: 'エリア探索',
                    description: '指定エリアを完全に探索する',
                    objectives: [
                        { type: 'explore_zone', target: 'VARIABLE', current: 0 }
                    ],
                    variants: [
                        { difficulty: 'normal', target: 1, reward_credits: 3000, reward_exp: 500 },
                        { difficulty: 'hard', target: 2, reward_credits: 7000, reward_exp: 1000 }
                    ]
                }
            ],
            
            // 収集系ミッション
            collection: [
                {
                    id: 'resource_gathering',
                    template: true,
                    type: 'collection',
                    title: '資源収集',
                    description: 'アイテムを収集する',
                    objectives: [
                        { type: 'collect_item', target: 'VARIABLE', current: 0 }
                    ],
                    variants: [
                        { difficulty: 'easy', target: 5, reward_credits: 600, reward_exp: 80 },
                        { difficulty: 'normal', target: 15, reward_credits: 1800, reward_exp: 240 },
                        { difficulty: 'hard', target: 30, reward_credits: 4000, reward_exp: 500 }
                    ]
                },
                {
                    id: 'credit_accumulation',
                    template: true,
                    type: 'collection',
                    title: 'クレジット蓄積',
                    description: '指定額のクレジットを獲得する',
                    objectives: [
                        { type: 'earn_credits', target: 'VARIABLE', current: 0 }
                    ],
                    variants: [
                        { difficulty: 'easy', target: 5000, reward_credits: 1500, reward_exp: 150 },
                        { difficulty: 'normal', target: 15000, reward_credits: 4000, reward_exp: 400 },
                        { difficulty: 'hard', target: 50000, reward_credits: 12000, reward_exp: 1000 }
                    ]
                }
            ],
            
            // 生存系ミッション
            survival: [
                {
                    id: 'wave_survival',
                    template: true,
                    type: 'survival',
                    title: 'ウェーブ生存',
                    description: '連続ウェーブを生き延びる',
                    objectives: [
                        { type: 'survive_waves', target: 'VARIABLE', current: 0 }
                    ],
                    variants: [
                        { difficulty: 'normal', target: 5, reward_credits: 3000, reward_exp: 400 },
                        { difficulty: 'hard', target: 10, reward_credits: 7000, reward_exp: 800 },
                        { difficulty: 'extreme', target: 20, reward_credits: 16000, reward_exp: 1600 }
                    ]
                },
                {
                    id: 'damage_limitation',
                    template: true,
                    type: 'survival',
                    title: '被ダメージ制限',
                    description: '一定ダメージ以下でミッション完了',
                    objectives: [
                        { type: 'limit_damage_taken', target: 'VARIABLE', damage_limit: 'VARIABLE', current: 0 }
                    ],
                    variants: [
                        { difficulty: 'normal', target: 10, damage_limit: 50, reward_credits: 2500, reward_exp: 350 },
                        { difficulty: 'hard', target: 20, damage_limit: 30, reward_credits: 6000, reward_exp: 700 }
                    ]
                }
            ]
        };
    }
    
    initMissionChains() {
        this.missionChains = [
            {
                id: 'rookie_pilot',
                name: '新人パイロット',
                description: '基本的なパイロット技能を習得する',
                stages: [
                    {
                        title: '初回戦闘',
                        description: '敵機3体を撃破する',
                        objectives: [{ type: 'destroy_enemy', target: 3, current: 0 }],
                        rewards: { credits: 1000, exp: 200 }
                    },
                    {
                        title: '探索開始',
                        description: 'スキャンを5回実行する',
                        objectives: [{ type: 'perform_scan', target: 5, current: 0 }],
                        rewards: { credits: 1500, exp: 250 }
                    },
                    {
                        title: '熟練パイロット',
                        description: '敵機15体を撃破する',
                        objectives: [{ type: 'destroy_enemy', target: 15, current: 0 }],
                        rewards: { credits: 5000, exp: 800, special: 'pilot_license' }
                    }
                ],
                currentStage: 0,
                completed: false
            },
            {
                id: 'explorer_path',
                name: '宇宙探検家',
                description: '未知の宇宙を探索する',
                stages: [
                    {
                        title: '初回発見',
                        description: '新しい惑星を1つ発見する',
                        objectives: [{ type: 'discover_planet', target: 1, current: 0 }],
                        rewards: { credits: 3000, exp: 500 }
                    },
                    {
                        title: '本格探索',
                        description: '3つの異なるエリアを探索する',
                        objectives: [{ type: 'explore_zone', target: 3, current: 0 }],
                        rewards: { credits: 8000, exp: 1200 }
                    },
                    {
                        title: 'マスター探検家',
                        description: '全エリアを探索し、5つの惑星を発見する',
                        objectives: [
                            { type: 'discover_planet', target: 5, current: 0 },
                            { type: 'explore_zone', target: 5, current: 0 }
                        ],
                        rewards: { credits: 20000, exp: 3000, special: 'explorer_badge' }
                    }
                ],
                currentStage: 0,
                completed: false
            }
        ];
    }
    
    generateDailyMissions() {
        const today = new Date().toDateString();
        const lastGenerated = localStorage.getItem('last_daily_generation');
        
        if (lastGenerated === today) {
            // 今日の分は既に生成済み
            this.dailyMissions = JSON.parse(localStorage.getItem('daily_missions') || '[]');
            return;
        }
        
        // 新しいデイリーミッションを生成
        this.dailyMissions = [];
        
        // 3つのデイリーミッションを生成
        for (let i = 0; i < 3; i++) {
            const mission = this.generateRandomMission('daily');
            mission.isDaily = true;
            mission.expiresAt = new Date().getTime() + (24 * 60 * 60 * 1000); // 24時間後
            this.dailyMissions.push(mission);
        }
        
        localStorage.setItem('daily_missions', JSON.stringify(this.dailyMissions));
        localStorage.setItem('last_daily_generation', today);
    }
    
    generateRandomMission(category = 'normal') {
        const categories = Object.keys(this.missionTemplates);
        const selectedCategory = categories[Math.floor(Math.random() * categories.length)];
        const templates = this.missionTemplates[selectedCategory];
        const template = templates[Math.floor(Math.random() * templates.length)];
        const variant = template.variants[Math.floor(Math.random() * template.variants.length)];
        
        const mission = {
            id: `${template.id}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            type: template.type,
            category: category,
            title: `${template.title} (${this.difficultyLevels[variant.difficulty].name})`,
            description: template.description,
            difficulty: variant.difficulty,
            icon: this.missionTypes[template.type].icon,
            objectives: template.objectives.map(obj => ({
                ...obj,
                target: variant.target || obj.target,
                damage_limit: variant.damage_limit || obj.damage_limit
            })),
            rewards: {
                credits: variant.reward_credits,
                experience: variant.reward_exp,
                items: variant.reward_items || []
            },
            timeLimit: variant.time_limit || null,
            status: 'available',
            progress: 0
        };
        
        return mission;
    }
    
    startMission(missionId) {
        let mission = null;
        let sourceArray = null;
        
        // ミッションを探す
        if (this.availableMissions.find(m => m.id === missionId)) {
            mission = this.availableMissions.find(m => m.id === missionId);
            sourceArray = this.availableMissions;
        } else if (this.dailyMissions.find(m => m.id === missionId)) {
            mission = this.dailyMissions.find(m => m.id === missionId);
            sourceArray = this.dailyMissions;
        }
        
        if (!mission) return false;
        
        // アクティブミッションに移動
        mission.status = 'active';
        mission.startTime = Date.now();
        this.activeMissions.push(mission);
        
        // 元の配列から削除
        const index = sourceArray.indexOf(mission);
        sourceArray.splice(index, 1);
        
        this.game.showMessage(`ミッション開始: ${mission.title}`, 3000);
        this.updateUI();
        
        return true;
    }
    
    updateProgress(actionType, data = {}) {
        this.activeMissions.forEach(mission => {
            mission.objectives.forEach(objective => {
                if (objective.type === actionType) {
                    objective.current = Math.min(objective.current + 1, objective.target);
                    
                    // 特殊な処理
                    if (actionType === 'land_planet' && data.planetName) {
                        if (!objective.visited) objective.visited = [];
                        if (!objective.visited.includes(data.planetName)) {
                            objective.visited.push(data.planetName);
                        }
                    }
                    
                    if (actionType === 'earn_credits' && data.amount) {
                        objective.current = Math.min(objective.current + data.amount, objective.target);
                    }
                    
                    // ミッション完了チェック
                    this.checkMissionCompletion(mission);
                }
            });
        });
        
        // ミッションチェーンの進行もチェック
        this.updateMissionChains(actionType, data);
    }
    
    checkMissionCompletion(mission) {
        const allCompleted = mission.objectives.every(obj => obj.current >= obj.target);
        
        if (allCompleted && mission.status === 'active') {
            this.completeMission(mission);
        }
    }
    
    completeMission(mission) {
        mission.status = 'completed';
        mission.completedAt = Date.now();
        
        // 報酬を付与
        if (mission.rewards.credits) {
            this.game.inventorySystem.addCredits(mission.rewards.credits);
            this.game.showMessage(`+${mission.rewards.credits} Credits 獲得！`, 2000);
        }
        
        if (mission.rewards.experience && this.game.skillTreeSystem) {
            this.game.skillTreeSystem.gainExperience(mission.rewards.experience, 'ミッション完了');
        }
        
        // アクティブから完了済みに移動
        const index = this.activeMissions.indexOf(mission);
        this.activeMissions.splice(index, 1);
        this.completedMissions.push(mission);
        
        this.game.showMessage(`ミッション完了: ${mission.title}`, 3000);
        this.updateUI();
        
        // 新しいミッションを生成
        this.generateNewMissions();
    }
    
    updateMissionChains(actionType, data = {}) {
        this.missionChains.forEach(chain => {
            if (chain.completed) return;
            
            const currentStage = chain.stages[chain.currentStage];
            if (!currentStage) return;
            
            currentStage.objectives.forEach(objective => {
                if (objective.type === actionType) {
                    objective.current = Math.min(objective.current + 1, objective.target);
                }
            });
            
            // ステージ完了チェック
            const stageCompleted = currentStage.objectives.every(obj => obj.current >= obj.target);
            if (stageCompleted) {
                this.completeChainStage(chain);
            }
        });
    }
    
    completeChainStage(chain) {
        const stage = chain.stages[chain.currentStage];
        
        // 報酬付与
        if (stage.rewards.credits) {
            this.game.inventorySystem.addCredits(stage.rewards.credits);
        }
        if (stage.rewards.exp && this.game.skillTreeSystem) {
            this.game.skillTreeSystem.gainExperience(stage.rewards.exp, 'チェーンミッション');
        }
        
        chain.currentStage++;
        
        if (chain.currentStage >= chain.stages.length) {
            chain.completed = true;
            this.game.showMessage(`ミッションチェーン完了: ${chain.name}`, 4000);
        } else {
            this.game.showMessage(`チェーン進行: ${chain.name} - ${chain.stages[chain.currentStage].title}`, 3000);
        }
        
        this.updateUI();
    }
    
    generateNewMissions() {
        // 利用可能ミッション数が少ない場合、新しいミッションを生成
        while (this.availableMissions.length < 5) {
            const mission = this.generateRandomMission();
            this.availableMissions.push(mission);
        }
    }
    
    createMissionUI() {
        // ミッション管理UI（Tabキーで表示）
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Tab') {
                e.preventDefault();
                this.toggleMissionUI();
            }
        });
    }
    
    toggleMissionUI() {
        if (this.missionUI) {
            this.missionUI.remove();
            this.missionUI = null;
            return;
        }
        
        this.showMissionUI();
    }
    
    showMissionUI() {
        this.missionUI = document.createElement('div');
        this.missionUI.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.9);
            z-index: 13000;
            font-family: 'Orbitron', monospace;
            overflow-y: auto;
        `;
        
        this.missionUI.innerHTML = `
            <div style="padding: 20px; max-width: 1200px; margin: 0 auto;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px;">
                    <h2 style="color: #00ffff; margin: 0;">ミッション管理</h2>
                    <button id="close-mission-ui" style="
                        background: #ff4444;
                        border: none;
                        color: white;
                        width: 40px;
                        height: 40px;
                        border-radius: 5px;
                        cursor: pointer;
                        font-size: 20px;
                    ">✕</button>
                </div>
                
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 30px;">
                    <div>
                        <h3 style="color: #ffaa00; margin-bottom: 20px;">アクティブミッション</h3>
                        <div id="active-missions"></div>
                        
                        <h3 style="color: #ffaa00; margin: 30px 0 20px 0;">デイリーミッション</h3>
                        <div id="daily-missions"></div>
                    </div>
                    
                    <div>
                        <h3 style="color: #ffaa00; margin-bottom: 20px;">利用可能ミッション</h3>
                        <div id="available-missions"></div>
                        
                        <h3 style="color: #ffaa00; margin: 30px 0 20px 0;">ミッションチェーン</h3>
                        <div id="mission-chains"></div>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(this.missionUI);
        
        // ミッション表示
        this.renderMissions();
        
        // 閉じるボタン
        document.getElementById('close-mission-ui').onclick = () => {
            this.missionUI.remove();
            this.missionUI = null;
        };
        
        // ESCキーで閉じる
        const escHandler = (e) => {
            if (e.key === 'Escape') {
                this.missionUI.remove();
                this.missionUI = null;
                document.removeEventListener('keydown', escHandler);
            }
        };
        document.addEventListener('keydown', escHandler);
    }
    
    renderMissions() {
        // アクティブミッション
        const activeContainer = document.getElementById('active-missions');
        activeContainer.innerHTML = this.activeMissions.map(mission => this.createMissionCard(mission, 'active')).join('');
        
        // デイリーミッション
        const dailyContainer = document.getElementById('daily-missions');
        dailyContainer.innerHTML = this.dailyMissions.map(mission => this.createMissionCard(mission, 'daily')).join('');
        
        // 利用可能ミッション
        const availableContainer = document.getElementById('available-missions');
        availableContainer.innerHTML = this.availableMissions.map(mission => this.createMissionCard(mission, 'available')).join('');
        
        // ミッションチェーン
        const chainsContainer = document.getElementById('mission-chains');
        chainsContainer.innerHTML = this.missionChains.map(chain => this.createChainCard(chain)).join('');
    }
    
    createMissionCard(mission, type) {
        const difficulty = this.difficultyLevels[mission.difficulty];
        const progress = mission.objectives.map(obj => `${obj.current}/${obj.target}`).join(', ');
        const progressPercent = mission.objectives.length > 0 ? 
            (mission.objectives.reduce((sum, obj) => sum + (obj.current / obj.target), 0) / mission.objectives.length * 100) : 0;
        
        return `
            <div style="
                background: rgba(0, 50, 100, 0.3);
                border: 1px solid ${difficulty?.color || '#666666'};
                border-radius: 8px;
                padding: 15px;
                margin-bottom: 15px;
            ">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                    <h4 style="color: #00ffff; margin: 0;">
                        ${mission.icon} ${mission.title}
                    </h4>
                    <span style="color: ${difficulty?.color || '#888888'}; font-size: 0.9em;">
                        ${difficulty?.name || '未設定'}
                    </span>
                </div>
                <p style="color: #cccccc; margin: 10px 0;">${mission.description}</p>
                <div style="color: #aaffaa; margin: 10px 0;">進行: ${progress}</div>
                <div style="background: #333; height: 8px; border-radius: 4px; margin: 10px 0;">
                    <div style="
                        background: linear-gradient(to right, #00aa00, #00ff00);
                        height: 100%;
                        width: ${progressPercent}%;
                        border-radius: 4px;
                        transition: width 0.3s;
                    "></div>
                </div>
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <div style="color: #ffaa00; font-size: 0.9em;">
                        報酬: ${mission.rewards.credits}C, ${mission.rewards.experience}EXP
                    </div>
                    ${type === 'available' || type === 'daily' ? 
                        `<button onclick="game.missionSystem.startMission('${mission.id}')" style="
                            background: #00aa00;
                            border: none;
                            color: white;
                            padding: 5px 15px;
                            border-radius: 3px;
                            cursor: pointer;
                        ">開始</button>` : ''
                    }
                </div>
            </div>
        `;
    }
    
    createChainCard(chain) {
        const currentStage = chain.stages[chain.currentStage];
        const progress = chain.currentStage / chain.stages.length * 100;
        
        return `
            <div style="
                background: rgba(100, 50, 0, 0.3);
                border: 1px solid #ff8800;
                border-radius: 8px;
                padding: 15px;
                margin-bottom: 15px;
            ">
                <h4 style="color: #ffaa00; margin: 0 0 10px 0;">${chain.name}</h4>
                <p style="color: #cccccc; margin: 10px 0;">${chain.description}</p>
                <div style="color: #aaffaa; margin: 10px 0;">
                    ステージ: ${chain.currentStage + 1}/${chain.stages.length}
                </div>
                <div style="background: #333; height: 8px; border-radius: 4px; margin: 10px 0;">
                    <div style="
                        background: linear-gradient(to right, #ff8800, #ffaa00);
                        height: 100%;
                        width: ${progress}%;
                        border-radius: 4px;
                    "></div>
                </div>
                ${currentStage && !chain.completed ? `
                    <div style="background: rgba(0, 0, 0, 0.3); padding: 10px; border-radius: 5px; margin-top: 10px;">
                        <div style="color: #ffffff; font-weight: bold;">${currentStage.title}</div>
                        <div style="color: #cccccc; margin: 5px 0;">${currentStage.description}</div>
                        <div style="color: #aaffaa;">
                            進行: ${currentStage.objectives.map(obj => `${obj.current}/${obj.target}`).join(', ')}
                        </div>
                    </div>
                ` : chain.completed ? '<div style="color: #00ff00; text-align: center; margin-top: 10px;">完了</div>' : ''}
            </div>
        `;
    }
    
    updateUI() {
        if (this.missionUI) {
            this.renderMissions();
        }
    }
    
    // セーブ・ロード対応
    getSaveData() {
        return {
            activeMissions: this.activeMissions,
            completedMissions: this.completedMissions,
            availableMissions: this.availableMissions,
            missionChains: this.missionChains
        };
    }
    
    loadSaveData(data) {
        this.activeMissions = data.activeMissions || [];
        this.completedMissions = data.completedMissions || [];
        this.availableMissions = data.availableMissions || [];
        this.missionChains = data.missionChains || this.missionChains;
        
        // 不足分の利用可能ミッションを生成
        this.generateNewMissions();
    }
}