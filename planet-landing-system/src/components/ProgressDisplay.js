// 進行状況表示UI - 目標とマイルストーンの表示

export class ProgressDisplay {
    constructor(game) {
        this.game = game;
        this.container = null;
        this.isVisible = true;
        
        this.createUI();
        this.setupEventListeners();
    }
    
    createUI() {
        // メインコンテナ
        this.container = document.createElement('div');
        this.container.id = 'progress-display';
        this.container.style.cssText = `
            position: absolute;
            top: 20px;
            left: 350px;
            width: 300px;
            background: linear-gradient(135deg, rgba(0, 0, 0, 0.9), rgba(20, 0, 40, 0.9));
            border: 2px solid #ff6b6b;
            border-radius: 15px;
            padding: 15px;
            pointer-events: auto;
            box-shadow: 0 10px 30px rgba(255, 107, 107, 0.2);
            transition: all 0.3s ease;
        `;
        
        // ヘッダー
        const header = document.createElement('div');
        header.style.cssText = `
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 15px;
            padding-bottom: 10px;
            border-bottom: 1px solid rgba(255, 107, 107, 0.3);
        `;
        
        const title = document.createElement('h3');
        title.style.cssText = `
            margin: 0;
            color: #ff6b6b;
            font-size: 16px;
        `;
        title.textContent = '🎯 進行状況';
        
        const toggleButton = document.createElement('button');
        toggleButton.style.cssText = `
            background: none;
            border: none;
            color: #ff6b6b;
            font-size: 16px;
            cursor: pointer;
            padding: 5px;
            border-radius: 3px;
            transition: all 0.2s ease;
        `;
        toggleButton.textContent = '─';
        toggleButton.onclick = () => this.toggle();
        toggleButton.onmouseover = () => {
            toggleButton.style.background = 'rgba(255, 107, 107, 0.2)';
        };
        toggleButton.onmouseout = () => {
            toggleButton.style.background = 'none';
        };
        
        header.appendChild(title);
        header.appendChild(toggleButton);
        
        // 惑星レベル表示
        this.levelDisplay = document.createElement('div');
        this.levelDisplay.style.cssText = `
            text-align: center;
            margin-bottom: 15px;
            padding: 10px;
            background: rgba(255, 107, 107, 0.1);
            border-radius: 8px;
        `;
        
        // 目標リスト
        this.objectivesList = document.createElement('div');
        this.objectivesList.style.cssText = `
            margin-bottom: 15px;
        `;
        
        // 次のマイルストーン
        this.milestoneDisplay = document.createElement('div');
        this.milestoneDisplay.style.cssText = `
            padding: 10px;
            background: rgba(255, 215, 0, 0.1);
            border: 1px solid rgba(255, 215, 0, 0.3);
            border-radius: 8px;
            margin-bottom: 10px;
        `;
        
        // 統計表示
        this.statsDisplay = document.createElement('div');
        this.statsDisplay.style.cssText = `
            font-size: 12px;
            color: #aaa;
            padding-top: 10px;
            border-top: 1px solid rgba(255, 107, 107, 0.3);
        `;
        
        this.container.appendChild(header);
        this.container.appendChild(this.levelDisplay);
        this.container.appendChild(this.objectivesList);
        this.container.appendChild(this.milestoneDisplay);
        this.container.appendChild(this.statsDisplay);
        
        // UIコンテナに追加
        const uiContainer = document.getElementById('planet-ui');
        if (uiContainer) {
            uiContainer.appendChild(this.container);
        }
    }
    
    update() {
        if (!this.game.systems.progress || !this.isVisible) return;
        
        const progress = this.game.systems.progress.getProgress();
        
        this.updateLevelDisplay(progress);
        this.updateObjectives(progress);
        this.updateMilestone(progress);
        this.updateStats(progress);
    }
    
    updateLevelDisplay(progress) {
        this.levelDisplay.innerHTML = `
            <div style="color: #ff6b6b; font-size: 18px; font-weight: bold; margin-bottom: 5px;">
                🌍 惑星レベル ${progress.level}
            </div>
            <div style="color: #fff; font-size: 14px;">
                開発時間: ${this.formatTime(progress.timeSpent)}
            </div>
        `;
    }
    
    updateObjectives(progress) {
        this.objectivesList.innerHTML = '';
        
        if (progress.objectives.length === 0) {
            const noObjectives = document.createElement('div');
            noObjectives.style.cssText = `
                text-align: center;
                color: #888;
                font-style: italic;
                padding: 20px;
            `;
            noObjectives.textContent = '新しい目標を生成中...';
            this.objectivesList.appendChild(noObjectives);
            return;
        }
        
        for (const objective of progress.objectives) {
            const objectiveElement = this.createObjectiveElement(objective);
            this.objectivesList.appendChild(objectiveElement);
        }
    }
    
    createObjectiveElement(objective) {
        const element = document.createElement('div');
        element.style.cssText = `
            margin-bottom: 12px;
            padding: 12px;
            background: rgba(255, 255, 255, 0.05);
            border-radius: 8px;
            border-left: 4px solid ${this.getPriorityColor(objective.priority)};
        `;
        
        const progressPercent = Math.floor((objective.progress / objective.target.count) * 100);
        const isCompleted = objective.progress >= objective.target.count;
        
        element.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                <div style="color: #fff; font-weight: bold; font-size: 14px;">
                    ${isCompleted ? '✅' : '🎯'} ${objective.title}
                </div>
                <div style="color: ${this.getPriorityColor(objective.priority)}; font-size: 12px;">
                    ${objective.priority}
                </div>
            </div>
            
            <div style="color: #ccc; font-size: 12px; margin-bottom: 8px;">
                ${objective.description}
            </div>
            
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                <div style="color: #aaa; font-size: 12px;">
                    進行: ${objective.progress}/${objective.target.count}
                </div>
                <div style="color: #aaa; font-size: 12px;">
                    ${progressPercent}%
                </div>
            </div>
            
            <div style="background: rgba(255, 255, 255, 0.1); height: 6px; border-radius: 3px; overflow: hidden;">
                <div style="background: ${isCompleted ? '#4CAF50' : this.getPriorityColor(objective.priority)}; height: 100%; width: ${progressPercent}%; transition: width 0.3s ease;"></div>
            </div>
            
            ${objective.reward && objective.reward.credits ? 
                `<div style="color: #ffd700; font-size: 11px; margin-top: 6px;">報酬: 💰 ${objective.reward.credits}</div>` : 
                ''
            }
        `;
        
        return element;
    }
    
    updateMilestone(progress) {
        const milestone = progress.nextMilestone;
        if (!milestone) {
            this.milestoneDisplay.innerHTML = `
                <div style="text-align: center; color: #ffd700; font-weight: bold;">
                    🏆 全マイルストーン達成！
                </div>
            `;
            return;
        }
        
        const requirements = milestone.requirements;
        const current = {
            buildings: progress.statistics ? Object.values(progress.statistics.buildingsBuilt).reduce((a, b) => a + b, 0) : 0,
            resources: progress.totalResourcesCollected || 0,
            power: this.game.systems.resource?.getProductionRates().energy || 0,
            research: this.game.systems.resource?.getResources().research || 0,
            population: this.game.systems.resource?.getPopulationInfo().population || 0
        };
        
        this.milestoneDisplay.innerHTML = `
            <div style="color: #ffd700; font-weight: bold; margin-bottom: 8px; text-align: center;">
                🏆 次のマイルストーン: ${milestone.name}
            </div>
            
            ${this.createMilestoneRequirement('🏗️ 建物', current.buildings, requirements.buildings)}
            ${requirements.resources ? this.createMilestoneRequirement('📦 資源収集', current.resources, requirements.resources) : ''}
            ${requirements.power ? this.createMilestoneRequirement('⚡ 電力生産', current.power, requirements.power) : ''}
            ${requirements.research ? this.createMilestoneRequirement('🔬 研究', current.research, requirements.research) : ''}
            ${requirements.population ? this.createMilestoneRequirement('👥 人口', current.population, requirements.population) : ''}
            
            <div style="color: #ffd700; font-size: 11px; margin-top: 8px; text-align: center;">
                報酬: 💰 ${milestone.rewards.credits}
            </div>
        `;
    }
    
    createMilestoneRequirement(label, current, required) {
        const progress = Math.min(current / required, 1);
        const isCompleted = current >= required;
        
        return `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
                <div style="color: #fff; font-size: 12px;">${label}</div>
                <div style="color: ${isCompleted ? '#4CAF50' : '#ffd700'}; font-size: 12px;">
                    ${current}/${required}
                </div>
            </div>
            <div style="background: rgba(255, 255, 255, 0.1); height: 4px; border-radius: 2px; overflow: hidden; margin-bottom: 8px;">
                <div style="background: ${isCompleted ? '#4CAF50' : '#ffd700'}; height: 100%; width: ${progress * 100}%; transition: width 0.3s ease;"></div>
            </div>
        `;
    }
    
    updateStats(progress) {
        const stats = progress.statistics;
        if (!stats) return;
        
        this.statsDisplay.innerHTML = `
            <div style="color: #ff6b6b; font-weight: bold; margin-bottom: 5px;">📊 統計</div>
            <div>🏗️ 建物: ${Object.values(stats.buildingsBuilt).reduce((a, b) => a + b, 0)}個</div>
            <div>📦 資源: ${Object.values(stats.resourcesCollected).reduce((a, b) => a + b, 0)}個</div>
            <div>🎯 完了目標: ${progress.completedObjectives}個</div>
            <div>⬆️ アップグレード: ${stats.upgradesPerformed}回</div>
        `;
    }
    
    getPriorityColor(priority) {
        const colors = {
            high: '#ff4444',
            medium: '#ffaa00',
            low: '#4CAF50'
        };
        return colors[priority] || '#888';
    }
    
    formatTime(seconds) {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = Math.floor(seconds % 60);
        
        if (hours > 0) {
            return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        } else {
            return `${minutes}:${secs.toString().padStart(2, '0')}`;
        }
    }
    
    toggle() {
        this.isVisible = !this.isVisible;
        this.container.style.display = this.isVisible ? 'block' : 'none';
    }
    
    show() {
        this.isVisible = true;
        this.container.style.display = 'block';
    }
    
    hide() {
        this.isVisible = false;
        this.container.style.display = 'none';
    }
    
    setupEventListeners() {
        // 自動更新
        setInterval(() => {
            this.update();
        }, 1000);
    }
    
    dispose() {
        if (this.container && this.container.parentNode) {
            this.container.parentNode.removeChild(this.container);
        }
    }
}