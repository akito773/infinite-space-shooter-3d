// ストーリーミッション目標UI
// 現在のストーリー目標を画面に表示

export class StoryObjectivesUI {
    constructor(game) {
        this.game = game;
        this.container = null;
        this.objectives = [];
        this.currentMainObjective = null;
        
        this.createUI();
        this.setupObjectives();
    }
    
    createUI() {
        // メインコンテナ
        this.container = document.createElement('div');
        this.container.id = 'story-objectives';
        this.container.style.cssText = `
            position: fixed;
            top: 60px;
            right: 20px;
            width: 300px;
            background: rgba(0, 10, 20, 0.8);
            border: 2px solid #00aaff;
            border-radius: 10px;
            padding: 15px;
            color: white;
            font-family: Arial, sans-serif;
            z-index: 100;
            transition: all 0.3s ease;
        `;
        
        // タイトル
        const title = document.createElement('h3');
        title.style.cssText = `
            margin: 0 0 10px 0;
            color: #00aaff;
            font-size: 16px;
            text-transform: uppercase;
            letter-spacing: 1px;
        `;
        title.textContent = 'MISSION OBJECTIVES';
        
        // メイン目標
        this.mainObjectiveElement = document.createElement('div');
        this.mainObjectiveElement.style.cssText = `
            background: rgba(0, 50, 100, 0.3);
            border-left: 3px solid #00ffff;
            padding: 10px;
            margin: 10px 0;
            font-size: 14px;
            line-height: 1.4;
        `;
        
        // サブ目標リスト
        this.subObjectivesList = document.createElement('ul');
        this.subObjectivesList.style.cssText = `
            list-style: none;
            padding: 0;
            margin: 10px 0;
        `;
        
        // 進捗バー
        this.progressBar = document.createElement('div');
        this.progressBar.style.cssText = `
            width: 100%;
            height: 4px;
            background: rgba(0, 50, 100, 0.5);
            border-radius: 2px;
            margin-top: 10px;
            overflow: hidden;
        `;
        
        this.progressFill = document.createElement('div');
        this.progressFill.style.cssText = `
            height: 100%;
            background: linear-gradient(90deg, #00aaff, #00ffff);
            width: 0%;
            transition: width 0.5s ease;
        `;
        this.progressBar.appendChild(this.progressFill);
        
        // ヒント表示エリア
        this.hintElement = document.createElement('div');
        this.hintElement.style.cssText = `
            margin-top: 10px;
            padding: 8px;
            background: rgba(255, 200, 0, 0.1);
            border: 1px solid rgba(255, 200, 0, 0.3);
            border-radius: 5px;
            font-size: 12px;
            color: #ffcc00;
            display: none;
        `;
        
        // 組み立て
        this.container.appendChild(title);
        this.container.appendChild(this.mainObjectiveElement);
        this.container.appendChild(this.subObjectivesList);
        this.container.appendChild(this.progressBar);
        this.container.appendChild(this.hintElement);
        
        document.body.appendChild(this.container);
        
        // 最小化ボタン
        const minimizeBtn = document.createElement('button');
        minimizeBtn.style.cssText = `
            position: absolute;
            top: 5px;
            right: 5px;
            background: transparent;
            border: none;
            color: #666;
            cursor: pointer;
            font-size: 16px;
            padding: 5px;
        `;
        minimizeBtn.textContent = '—';
        minimizeBtn.onclick = () => this.toggleMinimize();
        this.container.appendChild(minimizeBtn);
        
        // 初期状態では非表示
        this.hide();
    }
    
    setupObjectives() {
        // ストーリーフェーズに応じた目標定義
        this.objectiveDefinitions = {
            intro: {
                main: '地球を防衛せよ',
                sub: [
                    { id: 'defeat_enemies', text: '敵機を撃破', count: 0, target: 10 },
                    { id: 'survive', text: '生き残る', timer: true }
                ],
                hint: 'Spaceキーで射撃、Shiftでブースト'
            },
            
            luna_meeting: {
                main: 'ルナと出会う',
                sub: [
                    { id: 'land_earth', text: '地球に着陸', completed: false },
                    { id: 'visit_tavern', text: '酒場を訪れる', completed: false }
                ],
                hint: '惑星に近づいてLキーで着陸'
            },
            
            mars_investigation: {
                main: '火星の古代遺跡を調査',
                sub: [
                    { id: 'reach_mars', text: '火星に到達', completed: false },
                    { id: 'find_ruins', text: '古代遺跡を発見', completed: false },
                    { id: 'activate_seal', text: '封印装置を起動', completed: false }
                ],
                hint: 'Mキーで銀河マップを開いてワープ'
            },
            
            dark_nebula_encounter: {
                main: 'ダークネビュラを撃退',
                sub: [
                    { id: 'survive_phase1', text: 'フェーズ1を生き延びる', completed: false },
                    { id: 'trigger_revelation', text: '正体を暴く', completed: false },
                    { id: 'defeat_boss', text: 'ダークネビュラを撃破', completed: false }
                ],
                hint: 'ボスの攻撃パターンを見極めよう'
            },
            
            final_preparation: {
                main: '最終決戦の準備',
                sub: [
                    { id: 'collect_seals', text: '古代の封印を集める', count: 0, target: 4 },
                    { id: 'max_trust', text: 'ルナとの絆を最大に', progress: 0, target: 100 },
                    { id: 'upgrade_ship', text: '機体を強化', completed: false }
                ],
                hint: '各惑星で封印を起動しよう'
            }
        };
    }
    
    setObjective(objectiveId) {
        const objective = this.objectiveDefinitions[objectiveId];
        if (!objective) return;
        
        this.currentMainObjective = objectiveId;
        this.show();
        
        // メイン目標を設定
        this.mainObjectiveElement.innerHTML = `
            <div style="color: #00ffff; font-weight: bold; margin-bottom: 5px;">
                メインミッション
            </div>
            <div>${objective.main}</div>
        `;
        
        // サブ目標をクリア
        this.subObjectivesList.innerHTML = '';
        this.objectives = [];
        
        // サブ目標を追加
        objective.sub.forEach(sub => {
            const li = document.createElement('li');
            li.style.cssText = `
                padding: 5px 0;
                display: flex;
                align-items: center;
                font-size: 13px;
            `;
            
            const checkbox = document.createElement('div');
            checkbox.style.cssText = `
                width: 12px;
                height: 12px;
                border: 2px solid #00aaff;
                margin-right: 10px;
                transition: all 0.3s ease;
            `;
            
            const text = document.createElement('span');
            text.style.cssText = `
                flex: 1;
                color: #aaa;
            `;
            
            if (sub.count !== undefined) {
                text.textContent = `${sub.text} (${sub.count}/${sub.target})`;
            } else if (sub.progress !== undefined) {
                text.textContent = `${sub.text} (${sub.progress}%)`;
            } else {
                text.textContent = sub.text;
            }
            
            li.appendChild(checkbox);
            li.appendChild(text);
            this.subObjectivesList.appendChild(li);
            
            this.objectives.push({
                id: sub.id,
                element: li,
                checkbox: checkbox,
                text: text,
                data: sub
            });
        });
        
        // ヒントを設定
        if (objective.hint) {
            this.showHint(objective.hint);
        }
        
        // 進捗をリセット
        this.updateProgress(0);
    }
    
    updateObjective(objectiveId, value) {
        const obj = this.objectives.find(o => o.id === objectiveId);
        if (!obj) return;
        
        if (obj.data.count !== undefined) {
            // カウント型
            obj.data.count = Math.min(value, obj.data.target);
            obj.text.textContent = `${obj.data.text} (${obj.data.count}/${obj.data.target})`;
            
            if (obj.data.count >= obj.data.target) {
                this.completeObjective(objectiveId);
            }
        } else if (obj.data.progress !== undefined) {
            // 進捗型
            obj.data.progress = Math.min(value, obj.data.target);
            obj.text.textContent = `${obj.data.text} (${obj.data.progress}%)`;
            
            if (obj.data.progress >= obj.data.target) {
                this.completeObjective(objectiveId);
            }
        } else {
            // 完了型
            if (value === true) {
                this.completeObjective(objectiveId);
            }
        }
        
        this.updateOverallProgress();
    }
    
    completeObjective(objectiveId) {
        const obj = this.objectives.find(o => o.id === objectiveId);
        if (!obj || obj.data.completed) return;
        
        obj.data.completed = true;
        obj.checkbox.style.background = '#00ff00';
        obj.checkbox.innerHTML = '✓';
        obj.text.style.color = '#00ff00';
        obj.text.style.textDecoration = 'line-through';
        
        // 完了エフェクト
        obj.element.style.animation = 'objectiveComplete 0.5s ease';
        
        // 効果音
        if (this.game.soundManager) {
            this.game.soundManager.play('objective_complete');
        }
        
        this.updateOverallProgress();
    }
    
    updateOverallProgress() {
        const total = this.objectives.length;
        const completed = this.objectives.filter(o => o.data.completed).length;
        const progress = total > 0 ? (completed / total) * 100 : 0;
        
        this.updateProgress(progress);
        
        // 全目標完了時
        if (progress === 100) {
            this.onAllObjectivesComplete();
        }
    }
    
    updateProgress(percent) {
        this.progressFill.style.width = `${percent}%`;
    }
    
    showHint(hint) {
        this.hintElement.textContent = `💡 ヒント: ${hint}`;
        this.hintElement.style.display = 'block';
    }
    
    hideHint() {
        this.hintElement.style.display = 'none';
    }
    
    onAllObjectivesComplete() {
        // 完了通知
        setTimeout(() => {
            this.container.style.border = '2px solid #00ff00';
            this.container.style.boxShadow = '0 0 20px rgba(0, 255, 0, 0.5)';
            
            // 次の目標へ自動遷移
            setTimeout(() => {
                this.container.style.border = '2px solid #00aaff';
                this.container.style.boxShadow = 'none';
                
                // ストーリーイベントトリガーに通知
                if (this.game.storyEventTrigger) {
                    this.game.storyEventTrigger.onObjectivesComplete(this.currentMainObjective);
                }
            }, 2000);
        }, 500);
    }
    
    show() {
        this.container.style.display = 'block';
    }
    
    hide() {
        this.container.style.display = 'none';
    }
    
    toggleMinimize() {
        if (this.container.style.height === '40px') {
            this.container.style.height = 'auto';
            this.mainObjectiveElement.style.display = 'block';
            this.subObjectivesList.style.display = 'block';
            this.progressBar.style.display = 'block';
            this.hintElement.style.display = this.hintElement.textContent ? 'block' : 'none';
        } else {
            this.container.style.height = '40px';
            this.mainObjectiveElement.style.display = 'none';
            this.subObjectivesList.style.display = 'none';
            this.progressBar.style.display = 'none';
            this.hintElement.style.display = 'none';
        }
    }
    
    // 特定のストーリーフェーズでの目標更新
    onEnemyDefeated() {
        if (this.currentMainObjective === 'intro') {
            const obj = this.objectives.find(o => o.id === 'defeat_enemies');
            if (obj) {
                this.updateObjective('defeat_enemies', obj.data.count + 1);
            }
        }
    }
    
    onPlanetLanded(planetName) {
        if (this.currentMainObjective === 'luna_meeting' && planetName === '地球') {
            this.updateObjective('land_earth', true);
        } else if (this.currentMainObjective === 'mars_investigation' && planetName === '火星') {
            this.updateObjective('reach_mars', true);
        }
    }
    
    onTrustLevelChanged(level) {
        if (this.currentMainObjective === 'final_preparation') {
            this.updateObjective('max_trust', level);
        }
    }
    
    onSealActivated(sealCount) {
        if (this.currentMainObjective === 'final_preparation') {
            this.updateObjective('collect_seals', sealCount);
        }
    }
}

// CSSアニメーション
const style = document.createElement('style');
style.textContent = `
    @keyframes objectiveComplete {
        0% { transform: scale(1); }
        50% { transform: scale(1.1); background: rgba(0, 255, 0, 0.1); }
        100% { transform: scale(1); }
    }
`;
document.head.appendChild(style);