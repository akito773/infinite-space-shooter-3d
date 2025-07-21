// ゲーム進行システム - 目標とループの管理

export class GameProgressSystem {
    constructor(game) {
        this.game = game;
        
        // 進行状況
        this.planetLevel = 1;
        this.totalResourcesCollected = 0;
        this.buildingsCount = 0;
        this.timeSpent = 0;
        this.startTime = Date.now();
        
        // 目標
        this.currentObjectives = [];
        this.completedObjectives = [];
        
        // マイルストーン
        this.milestones = [
            {
                level: 1,
                name: "開拓者",
                requirements: { buildings: 3, resources: 500 },
                rewards: { credits: 2000, unlocks: ["power_plant"] }
            },
            {
                level: 2,
                name: "建設者",
                requirements: { buildings: 8, resources: 2000, power: 50 },
                rewards: { credits: 5000, unlocks: ["research_lab"] }
            },
            {
                level: 3,
                name: "開発者",
                requirements: { buildings: 15, resources: 10000, research: 100 },
                rewards: { credits: 10000, unlocks: ["defense_turret"] }
            },
            {
                level: 4,
                name: "惑星管理者",
                requirements: { buildings: 25, resources: 50000, population: 200 },
                rewards: { credits: 25000, unlocks: ["advanced_structures"] }
            }
        ];
        
        // 統計
        this.statistics = {
            resourcesCollected: {
                iron: 0,
                energy: 0,
                crystal: 0,
                research: 0,
                credits: 0
            },
            buildingsBuilt: {
                mine: 0,
                power_plant: 0,
                residence: 0,
                research_lab: 0,
                defense_turret: 0
            },
            timeInExploration: 0,
            timeInConstruction: 0,
            resourceNodesCollected: 0,
            upgradesPerformed: 0
        };
        
        this.init();
    }
    
    init() {
        this.generateInitialObjectives();
        this.startProgressTracking();
    }
    
    generateInitialObjectives() {
        this.currentObjectives = [
            {
                id: 'first_building',
                title: '最初の建物',
                description: '発電所を建設してエネルギーを確保しよう',
                type: 'build',
                target: { type: 'power_plant', count: 1 },
                progress: 0,
                reward: { credits: 500 },
                priority: 'high'
            },
            {
                id: 'explore_surface',
                title: '惑星探索',
                description: '探索モードで資源ノードを5個収集しよう',
                type: 'collect',
                target: { type: 'resource_nodes', count: 5 },
                progress: 0,
                reward: { credits: 1000 },
                priority: 'medium'
            },
            {
                id: 'basic_economy',
                title: '基本経済',
                description: '鉄を100個生産しよう',
                type: 'produce',
                target: { type: 'iron', count: 100 },
                progress: 0,
                reward: { credits: 1500 },
                priority: 'medium'
            }
        ];
    }
    
    startProgressTracking() {
        // 定期的に進行状況をチェック
        setInterval(() => {
            this.updateProgress();
            this.checkObjectives();
            this.checkMilestones();
        }, 1000);
    }
    
    update(deltaTime) {
        // 空のupdateメソッド - 必要に応じて実装
    }
    
    updateProgress() {
        // 時間の更新
        this.timeSpent = (Date.now() - this.startTime) / 1000;
        
        // 統計の更新
        if (this.game.systems.building) {
            this.buildingsCount = this.game.systems.building.buildings.size;
            
            // 建物タイプ別カウント
            for (const building of this.game.systems.building.buildings.values()) {
                if (this.statistics.buildingsBuilt[building.type] !== undefined) {
                    // 現在の建物数を再計算
                    this.statistics.buildingsBuilt[building.type] = 0;
                }
            }
            
            for (const building of this.game.systems.building.buildings.values()) {
                if (this.statistics.buildingsBuilt[building.type] !== undefined) {
                    this.statistics.buildingsBuilt[building.type]++;
                }
            }
        }
        
        // 資源統計の更新
        if (this.game.systems.resource) {
            const resources = this.game.systems.resource.getResources();
            this.totalResourcesCollected = resources.iron + resources.energy + resources.crystal + resources.research;
        }
    }
    
    checkObjectives() {
        for (const objective of this.currentObjectives) {
            if (objective.completed) continue;
            
            let newProgress = 0;
            
            switch (objective.type) {
                case 'build':
                    if (this.statistics.buildingsBuilt[objective.target.type]) {
                        newProgress = this.statistics.buildingsBuilt[objective.target.type];
                    }
                    break;
                    
                case 'collect':
                    if (objective.target.type === 'resource_nodes') {
                        newProgress = this.statistics.resourceNodesCollected;
                    }
                    break;
                    
                case 'produce':
                    if (this.game.systems.resource) {
                        const resources = this.game.systems.resource.getResources();
                        newProgress = Math.floor(resources[objective.target.type] || 0);
                    }
                    break;
            }
            
            objective.progress = Math.min(newProgress, objective.target.count);
            
            // 目標達成チェック
            if (objective.progress >= objective.target.count && !objective.completed) {
                this.completeObjective(objective);
            }
        }
    }
    
    checkMilestones() {
        const currentMilestone = this.milestones[this.planetLevel - 1];
        if (!currentMilestone) return;
        
        const reqs = currentMilestone.requirements;
        let allMet = true;
        
        // 建物数チェック
        if (reqs.buildings && this.buildingsCount < reqs.buildings) {
            allMet = false;
        }
        
        // 資源チェック
        if (reqs.resources && this.totalResourcesCollected < reqs.resources) {
            allMet = false;
        }
        
        // 電力チェック
        if (reqs.power && this.game.systems.resource) {
            const rates = this.game.systems.resource.getProductionRates();
            if (rates.energy < reqs.power) {
                allMet = false;
            }
        }
        
        // 研究チェック
        if (reqs.research && this.game.systems.resource) {
            const resources = this.game.systems.resource.getResources();
            if (resources.research < reqs.research) {
                allMet = false;
            }
        }
        
        // 人口チェック
        if (reqs.population && this.game.systems.resource) {
            const population = this.game.systems.resource.getPopulationInfo();
            if (population.population < reqs.population) {
                allMet = false;
            }
        }
        
        if (allMet) {
            this.achieveMilestone(currentMilestone);
        }
    }
    
    completeObjective(objective) {
        objective.completed = true;
        objective.completedAt = Date.now();
        
        // 報酬を付与
        if (objective.reward) {
            if (objective.reward.credits && this.game.systems.resource) {
                this.game.systems.resource.addResource('credits', objective.reward.credits);
            }
        }
        
        // 完了リストに移動
        this.completedObjectives.push(objective);
        this.currentObjectives = this.currentObjectives.filter(obj => obj.id !== objective.id);
        
        // 新しい目標を生成
        this.generateNewObjective();
        
        // UI通知
        this.showObjectiveComplete(objective);
        
        // 音
        if (this.game.systems.sound) {
            this.game.systems.sound.play('success');
        }
        
        console.log(`目標達成: ${objective.title}`);
    }
    
    achieveMilestone(milestone) {
        this.planetLevel++;
        
        // 報酬を付与
        if (milestone.rewards.credits && this.game.systems.resource) {
            this.game.systems.resource.addResource('credits', milestone.rewards.credits);
        }
        
        // UI通知
        this.showMilestoneAchieved(milestone);
        
        // 音
        if (this.game.systems.sound) {
            this.game.systems.sound.play('buildingComplete');
        }
        
        console.log(`マイルストーン達成: ${milestone.name}`);
    }
    
    generateNewObjective() {
        // 進行度に応じて新しい目標を生成
        const objectivePool = [
            {
                id: 'upgrade_building',
                title: '建物強化',
                description: '建物を1回アップグレードしよう',
                type: 'upgrade',
                target: { count: 1 },
                reward: { credits: 1000 }
            },
            {
                id: 'energy_production',
                title: 'エネルギー生産',
                description: 'エネルギー生産量を20/分にしよう',
                type: 'production_rate',
                target: { type: 'energy', rate: 20 },
                reward: { credits: 2000 }
            },
            {
                id: 'underground_exploration',
                title: '地下探索',
                description: '地下エリアで貴重な資源を発見しよう',
                type: 'explore_underground',
                target: { count: 3 },
                reward: { credits: 3000 }
            }
        ];
        
        // まだ完了していない目標をランダムに選択
        const availableObjectives = objectivePool.filter(obj => 
            !this.completedObjectives.some(completed => completed.id === obj.id) &&
            !this.currentObjectives.some(current => current.id === obj.id)
        );
        
        if (availableObjectives.length > 0) {
            const newObjective = availableObjectives[Math.floor(Math.random() * availableObjectives.length)];
            newObjective.progress = 0;
            newObjective.priority = 'medium';
            this.currentObjectives.push(newObjective);
        }
    }
    
    // イベント処理
    onResourceCollected(resourceType, amount) {
        if (this.statistics.resourcesCollected[resourceType] !== undefined) {
            this.statistics.resourcesCollected[resourceType] += amount;
        }
        this.totalResourcesCollected += amount;
        
        // 探索での収集の場合
        if (this.game.systems.exploration?.isExploring) {
            this.statistics.resourceNodesCollected++;
        }
    }
    
    onBuildingBuilt(buildingType) {
        if (this.statistics.buildingsBuilt[buildingType] !== undefined) {
            this.statistics.buildingsBuilt[buildingType]++;
        }
    }
    
    onBuildingUpgraded(buildingType) {
        this.statistics.upgradesPerformed++;
    }
    
    // UI表示
    showObjectiveComplete(objective) {
        this.showNotification(`🎯 目標達成: ${objective.title}`, 'success');
    }
    
    showMilestoneAchieved(milestone) {
        this.showNotification(`🏆 マイルストーン: ${milestone.name}`, 'milestone');
    }
    
    showNotification(text, type = 'info') {
        if (this.game.components.buildingMenu) {
            this.game.components.buildingMenu.showMessage(text, type);
        }
    }
    
    // 進行状況の取得
    getProgress() {
        return {
            level: this.planetLevel,
            timeSpent: this.timeSpent,
            objectives: this.currentObjectives,
            completedObjectives: this.completedObjectives.length,
            totalResourcesCollected: this.totalResourcesCollected,
            statistics: this.statistics,
            nextMilestone: this.milestones[this.planetLevel - 1]
        };
    }
    
    // セーブ/ロード用
    serialize() {
        return {
            planetLevel: this.planetLevel,
            totalResourcesCollected: this.totalResourcesCollected,
            buildingsCount: this.buildingsCount,
            timeSpent: this.timeSpent,
            startTime: this.startTime,
            currentObjectives: this.currentObjectives,
            completedObjectives: this.completedObjectives,
            statistics: this.statistics
        };
    }
    
    deserialize(data) {
        Object.assign(this, data);
        this.startProgressTracking();
    }
}