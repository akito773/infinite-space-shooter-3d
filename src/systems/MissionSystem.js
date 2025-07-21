import * as THREE from 'three';

export class MissionSystem {
    constructor() {
        this.activeMissions = [];
        this.completedMissions = [];
        this.missionUI = null;
        this.missionListUI = null;
        this.isFirstPlay = !localStorage.getItem('hasCompletedTutorial');
        
        // 初心者向けミッションを追加
        this.tutorialMissions = [
            {
                id: 'first_station',
                type: 'tutorial',
                title: '最初の一歩',
                description: '宇宙ステーションに接近する（Fキーでドッキング）',
                icon: '🏛️',
                objectives: [
                    { type: 'approach_station', target: 1, current: 0 }
                ],
                rewards: {
                    score: 500,
                    items: []
                },
                hint: '黄色いマーカーの方向へ向かいましょう'
            },
            {
                id: 'first_scan',
                type: 'tutorial',
                title: '宇宙探索入門',
                description: 'Sキーでスキャンを実行する',
                icon: '🔍',
                objectives: [
                    { type: 'perform_scan', target: 1, current: 0 }
                ],
                rewards: {
                    score: 300,
                    items: []
                },
                hint: 'Sキーを押してDeep Spaceスキャンを実行'
            },
            {
                id: 'first_combat',
                type: 'tutorial',
                title: '戦闘訓練',
                description: '敵機を3体撃破する',
                icon: '⚔️',
                objectives: [
                    { type: 'destroy_enemy', target: 3, current: 0 }
                ],
                rewards: {
                    score: 500,
                    items: []
                },
                hint: 'Spaceキーまたは左クリックで射撃'
            }
        ];
        
        this.missionTemplates = [
            {
                id: 'destroy_enemies_1',
                type: 'combat',
                title: '敵機撃破訓練',
                description: '敵機を5体撃破する',
                icon: '⚔️',
                objectives: [
                    { type: 'destroy_enemy', target: 5, current: 0 }
                ],
                rewards: {
                    score: 1000,
                    items: []
                }
            },
            {
                id: 'collect_resources_1',
                type: 'collection',
                title: '資源収集',
                description: 'アイテムを10個収集する',
                icon: '💎',
                objectives: [
                    { type: 'collect_item', target: 10, current: 0 }
                ],
                rewards: {
                    score: 1500,
                    items: []
                }
            },
            {
                id: 'explore_planet_1',
                type: 'exploration',
                title: '惑星探査',
                description: '3つの異なる惑星に着陸する',
                icon: '🌍',
                objectives: [
                    { type: 'land_planet', target: 3, current: 0, visited: [] }
                ],
                rewards: {
                    score: 2000,
                    items: []
                }
            },
            {
                id: 'speed_run_1',
                type: 'challenge',
                title: 'スピードチャレンジ',
                description: '30秒間ブーストで移動し続ける',
                icon: '🚀',
                objectives: [
                    { type: 'boost_time', target: 30, current: 0 }
                ],
                rewards: {
                    score: 1200,
                    items: []
                }
            },
            {
                id: 'asteroid_destroyer_1',
                type: 'combat',
                title: '小惑星破壊者',
                description: '小惑星を20個破壊する',
                icon: '☄️',
                objectives: [
                    { type: 'destroy_asteroid', target: 20, current: 0 }
                ],
                rewards: {
                    score: 1800,
                    items: []
                }
            }
        ];
        
        this.createMissionUI();
        this.initializeMissions();
    }
    
    createMissionUI() {
        // ミッション通知UI
        this.missionUI = document.createElement('div');
        this.missionUI.id = 'mission-notifications';
        this.missionUI.style.cssText = `
            position: fixed;
            top: 100px;
            right: 20px;
            width: 300px;
            z-index: 100;
        `;
        document.body.appendChild(this.missionUI);
        
        // ミッションリストボタン
        const missionButton = document.createElement('button');
        missionButton.id = 'mission-button';
        missionButton.innerHTML = '📋 ミッション (N)';
        missionButton.className = 'mission-button';
        
        // ミッションリストUI
        this.missionListUI = document.createElement('div');
        this.missionListUI.className = 'mission-list';
        this.missionListUI.innerHTML = `
            <div class="mission-list-content">
                <h2>ミッション一覧</h2>
                <div class="mission-tabs">
                    <button class="mission-tab active" data-tab="active">進行中</button>
                    <button class="mission-tab" data-tab="available">受注可能</button>
                    <button class="mission-tab" data-tab="completed">完了済み</button>
                </div>
                <div class="mission-items"></div>
                <button class="mission-close">閉じる (ESC)</button>
            </div>
        `;
        
        // スタイル
        const style = document.createElement('style');
        style.textContent = `
            .mission-button {
                position: absolute;
                top: 20px;
                right: 420px;
                background: rgba(0, 200, 100, 0.8);
                color: white;
                border: 2px solid #00ff88;
                border-radius: 10px;
                padding: 10px 20px;
                font-size: 16px;
                cursor: pointer;
                transition: all 0.3s;
                z-index: 100;
            }
            .mission-button:hover {
                background: rgba(0, 255, 100, 0.9);
                transform: scale(1.05);
            }
            
            .mission-notification {
                background: rgba(0, 20, 40, 0.9);
                border: 2px solid #00ff88;
                border-radius: 10px;
                padding: 15px;
                margin-bottom: 10px;
                animation: slideIn 0.3s ease-out;
            }
            
            .mission-notification h3 {
                color: #00ff88;
                margin: 0 0 10px 0;
                font-size: 16px;
            }
            
            .mission-objective {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin: 5px 0;
                color: white;
                font-size: 14px;
            }
            
            .mission-progress {
                background: rgba(255, 255, 255, 0.2);
                border-radius: 10px;
                height: 10px;
                width: 100px;
                overflow: hidden;
            }
            
            .mission-progress-fill {
                background: #00ff88;
                height: 100%;
                transition: width 0.3s;
            }
            
            .mission-list {
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: rgba(0, 20, 40, 0.95);
                border: 2px solid #00ff88;
                border-radius: 20px;
                padding: 30px;
                min-width: 600px;
                max-height: 80vh;
                overflow-y: auto;
                z-index: 4000;
                display: none;
            }
            
            .mission-list h2 {
                color: #00ff88;
                text-align: center;
                margin-bottom: 20px;
            }
            
            .mission-tabs {
                display: flex;
                justify-content: center;
                gap: 10px;
                margin-bottom: 20px;
            }
            
            .mission-tab {
                background: rgba(0, 100, 50, 0.5);
                color: white;
                border: 1px solid #00ff88;
                border-radius: 5px;
                padding: 10px 20px;
                cursor: pointer;
                transition: all 0.3s;
            }
            
            .mission-tab.active {
                background: rgba(0, 255, 100, 0.3);
            }
            
            .mission-item {
                background: rgba(0, 100, 50, 0.3);
                border: 1px solid #00ff88;
                border-radius: 10px;
                padding: 20px;
                margin-bottom: 15px;
                cursor: pointer;
                transition: all 0.3s;
            }
            
            .mission-item:hover {
                background: rgba(0, 150, 75, 0.5);
                transform: translateX(10px);
            }
            
            .mission-item-header {
                display: flex;
                align-items: center;
                gap: 15px;
                margin-bottom: 10px;
            }
            
            .mission-icon {
                font-size: 30px;
            }
            
            .mission-title {
                color: white;
                font-size: 18px;
                font-weight: bold;
            }
            
            .mission-description {
                color: #cccccc;
                font-size: 14px;
                margin-bottom: 10px;
            }
            
            .mission-rewards {
                color: #ffcc00;
                font-size: 14px;
            }
            
            .mission-accept {
                background: #00ff88;
                color: black;
                border: none;
                border-radius: 5px;
                padding: 8px 16px;
                margin-top: 10px;
                cursor: pointer;
                font-weight: bold;
            }
            
            .mission-accept:hover {
                background: #00dd77;
            }
            
            .mission-close {
                background: #ff6600;
                color: white;
                border: none;
                border-radius: 10px;
                padding: 10px 30px;
                font-size: 18px;
                cursor: pointer;
                display: block;
                margin: 20px auto 0;
            }
            
            .mission-close:hover {
                background: #ff4400;
            }
            
            .mission-complete-effect {
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: rgba(0, 255, 100, 0.9);
                color: black;
                padding: 30px 50px;
                border-radius: 20px;
                font-size: 28px;
                font-weight: bold;
                z-index: 6000;
                animation: completeEffect 2s ease-out;
            }
            
            @keyframes slideIn {
                from {
                    transform: translateX(100%);
                    opacity: 0;
                }
                to {
                    transform: translateX(0);
                    opacity: 1;
                }
            }
            
            @keyframes completeEffect {
                0% {
                    transform: translate(-50%, -50%) scale(0);
                    opacity: 0;
                }
                50% {
                    transform: translate(-50%, -50%) scale(1.2);
                    opacity: 1;
                }
                100% {
                    transform: translate(-50%, -50%) scale(1);
                    opacity: 0;
                }
            }
            
            @media (max-width: 768px) {
                .mission-button {
                    right: 20px;
                    top: 140px;
                }
                
                .mission-list {
                    min-width: 90%;
                    padding: 20px;
                }
                
                #mission-notifications {
                    width: 250px;
                    top: 200px;
                }
            }
        `;
        
        document.head.appendChild(style);
        document.getElementById('ui-overlay').appendChild(missionButton);
        document.body.appendChild(this.missionListUI);
        
        // イベントハンドラー
        missionButton.addEventListener('click', () => this.toggleMissionList());
        this.missionListUI.querySelector('.mission-close').addEventListener('click', () => this.closeMissionList());
        
        // タブ切り替え
        this.missionListUI.querySelectorAll('.mission-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                this.switchTab(e.target.dataset.tab);
            });
        });
        
        // キーボードショートカット
        document.addEventListener('keydown', (e) => {
            if (e.key.toLowerCase() === 'n') {
                this.toggleMissionList();
            } else if (e.key === 'Escape' && this.missionListUI.style.display === 'block') {
                this.closeMissionList();
            }
        });
        
        // タッチデバイス対応
        if ('ontouchstart' in window) {
            missionButton.textContent = '📋 ミッション';
        }
    }
    
    initializeMissions() {
        if (this.isFirstPlay) {
            // 初回プレイ時は初心者ミッションから開始
            this.acceptMission(this.tutorialMissions[0]);
            this.showMissionNotification('チュートリアルミッションを開始します！');
        } else {
            // 通常ミッションを2つアクティブにする
            this.acceptMission(this.missionTemplates[0]);
            this.acceptMission(this.missionTemplates[1]);
        }
        this.updateMissionDisplay();
    }
    
    startFirstMission() {
        // TutorialSystemから呼ばれる
        if (this.activeMissions.length === 0 && this.isFirstPlay) {
            this.acceptMission(this.tutorialMissions[0]);
            this.updateMissionDisplay();
        }
    }
    
    acceptMission(template) {
        // ディープコピーして新しいミッションインスタンスを作成
        const mission = JSON.parse(JSON.stringify(template));
        mission.startTime = Date.now();
        mission.active = true;
        
        this.activeMissions.push(mission);
        this.showMissionNotification(`新しいミッション: ${mission.title}`);
        this.updateMissionDisplay();
    }
    
    updateProgress(type, data) {
        let updated = false;
        
        this.activeMissions.forEach(mission => {
            mission.objectives.forEach(objective => {
                if (objective.type === type) {
                    switch (type) {
                        case 'destroy_enemy':
                            objective.current++;
                            updated = true;
                            break;
                            
                        case 'collect_item':
                            objective.current++;
                            updated = true;
                            break;
                            
                        case 'destroy_asteroid':
                            objective.current++;
                            updated = true;
                            break;
                            
                        case 'land_planet':
                            if (data && data.planetName && !objective.visited.includes(data.planetName)) {
                                objective.visited.push(data.planetName);
                                objective.current = objective.visited.length;
                                updated = true;
                            }
                            break;
                            
                        case 'boost_time':
                            if (data && data.boosting) {
                                objective.current += data.delta;
                                updated = true;
                            }
                            break;
                    }
                    
                    // ミッション完了チェック
                    if (objective.current >= objective.target) {
                        objective.current = objective.target;
                        this.checkMissionComplete(mission);
                    }
                }
            });
        });
        
        if (updated) {
            this.updateMissionDisplay();
        }
    }
    
    checkMissionComplete(mission) {
        const allComplete = mission.objectives.every(obj => obj.current >= obj.target);
        
        if (allComplete && mission.active) {
            mission.active = false;
            this.completeMission(mission);
        }
    }
    
    completeMission(mission) {
        // アクティブミッションから削除
        const index = this.activeMissions.indexOf(mission);
        if (index > -1) {
            this.activeMissions.splice(index, 1);
        }
        
        // 完了リストに追加
        mission.completedTime = Date.now();
        this.completedMissions.push(mission);
        
        // 報酬を付与
        if (window.game && mission.rewards.score) {
            window.game.updateScore(mission.rewards.score);
        }
        
        // 完了エフェクト
        this.showMissionCompleteEffect(mission);
        
        // チュートリアルミッションの場合の処理
        if (mission.type === 'tutorial') {
            const tutorialIndex = this.tutorialMissions.findIndex(m => m.id === mission.id);
            if (tutorialIndex < this.tutorialMissions.length - 1) {
                // 次のチュートリアルミッション
                setTimeout(() => this.acceptMission(this.tutorialMissions[tutorialIndex + 1]), 2000);
            } else {
                // チュートリアル完了
                localStorage.setItem('hasCompletedTutorial', 'true');
                this.isFirstPlay = false;
                this.showMissionNotification('チュートリアル完了！通常ミッションが解放されました！');
                // 通常ミッションを開始
                setTimeout(() => {
                    this.acceptMission(this.missionTemplates[0]);
                    this.acceptMission(this.missionTemplates[1]);
                }, 3000);
            }
        } else {
            // 通常ミッションの場合は新しいミッションを追加（ランダム）
            const availableMissions = this.missionTemplates.filter(template => 
                !this.activeMissions.some(m => m.id === template.id) &&
                !this.completedMissions.some(m => m.id === template.id)
            );
            
            if (availableMissions.length > 0) {
                const randomMission = availableMissions[Math.floor(Math.random() * availableMissions.length)];
                setTimeout(() => this.acceptMission(randomMission), 2000);
            }
        }
        
        this.updateMissionDisplay();
    }
    
    showMissionNotification(message) {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            bottom: 100px;
            right: 20px;
            background: rgba(0, 255, 100, 0.9);
            color: black;
            padding: 15px 25px;
            border-radius: 10px;
            font-size: 16px;
            font-weight: bold;
            z-index: 1000;
            animation: slideIn 0.3s ease-out;
        `;
        notification.textContent = '🎯 ' + message;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'slideIn 0.3s ease-out reverse';
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, 3000);
    }
    
    showMissionCompleteEffect(mission) {
        const effect = document.createElement('div');
        effect.className = 'mission-complete-effect';
        effect.innerHTML = `
            <div>🎉 ミッション完了！</div>
            <div style="font-size: 20px; margin-top: 10px;">${mission.title}</div>
            <div style="font-size: 18px; margin-top: 10px;">報酬: ${mission.rewards.score} スコア</div>
        `;
        
        document.body.appendChild(effect);
        
        setTimeout(() => {
            document.body.removeChild(effect);
        }, 2000);
    }
    
    updateMissionDisplay() {
        // アクティブミッションの表示を更新
        this.missionUI.innerHTML = '';
        
        this.activeMissions.slice(0, 3).forEach(mission => {
            const missionEl = document.createElement('div');
            missionEl.className = 'mission-notification';
            
            let objectivesHtml = '';
            mission.objectives.forEach(obj => {
                const progress = Math.min((obj.current / obj.target) * 100, 100);
                objectivesHtml += `
                    <div class="mission-objective">
                        <span>${this.getObjectiveText(obj)}</span>
                        <div class="mission-progress">
                            <div class="mission-progress-fill" style="width: ${progress}%"></div>
                        </div>
                    </div>
                `;
            });
            
            missionEl.innerHTML = `
                <h3>${mission.icon} ${mission.title}</h3>
                ${objectivesHtml}
            `;
            
            this.missionUI.appendChild(missionEl);
        });
    }
    
    getObjectiveText(objective) {
        switch (objective.type) {
            case 'destroy_enemy':
                return `敵機撃破: ${objective.current}/${objective.target}`;
            case 'collect_item':
                return `アイテム収集: ${objective.current}/${objective.target}`;
            case 'destroy_asteroid':
                return `小惑星破壊: ${objective.current}/${objective.target}`;
            case 'land_planet':
                return `惑星着陸: ${objective.current}/${objective.target}`;
            case 'boost_time':
                return `ブースト時間: ${Math.floor(objective.current)}/${objective.target}秒`;
            default:
                return `進行中: ${objective.current}/${objective.target}`;
        }
    }
    
    toggleMissionList() {
        if (this.missionListUI.style.display === 'block') {
            this.closeMissionList();
        } else {
            this.openMissionList();
        }
    }
    
    openMissionList() {
        this.missionListUI.style.display = 'block';
        this.switchTab('active');
        
        if (window.game) {
            window.game.isPaused = true;
        }
    }
    
    closeMissionList() {
        this.missionListUI.style.display = 'none';
        
        if (window.game) {
            window.game.isPaused = false;
        }
    }
    
    switchTab(tabName) {
        // タブのアクティブ状態を更新
        this.missionListUI.querySelectorAll('.mission-tab').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.tab === tabName);
        });
        
        // コンテンツを更新
        const itemsContainer = this.missionListUI.querySelector('.mission-items');
        itemsContainer.innerHTML = '';
        
        switch (tabName) {
            case 'active':
                this.renderActiveMissions(itemsContainer);
                break;
            case 'available':
                this.renderAvailableMissions(itemsContainer);
                break;
            case 'completed':
                this.renderCompletedMissions(itemsContainer);
                break;
        }
    }
    
    renderActiveMissions(container) {
        if (this.activeMissions.length === 0) {
            container.innerHTML = '<p style="color: #aaa; text-align: center;">進行中のミッションはありません</p>';
            return;
        }
        
        this.activeMissions.forEach(mission => {
            const missionEl = this.createMissionElement(mission, true);
            container.appendChild(missionEl);
        });
    }
    
    renderAvailableMissions(container) {
        const available = this.missionTemplates.filter(template => 
            !this.activeMissions.some(m => m.id === template.id) &&
            !this.completedMissions.some(m => m.id === template.id)
        );
        
        if (available.length === 0) {
            container.innerHTML = '<p style="color: #aaa; text-align: center;">受注可能なミッションはありません</p>';
            return;
        }
        
        available.forEach(mission => {
            const missionEl = this.createMissionElement(mission, false);
            const acceptBtn = document.createElement('button');
            acceptBtn.className = 'mission-accept';
            acceptBtn.textContent = 'ミッションを受注';
            acceptBtn.addEventListener('click', () => {
                this.acceptMission(mission);
                this.switchTab('active');
            });
            missionEl.appendChild(acceptBtn);
            container.appendChild(missionEl);
        });
    }
    
    renderCompletedMissions(container) {
        if (this.completedMissions.length === 0) {
            container.innerHTML = '<p style="color: #aaa; text-align: center;">完了したミッションはありません</p>';
            return;
        }
        
        this.completedMissions.forEach(mission => {
            const missionEl = this.createMissionElement(mission, false);
            missionEl.style.opacity = '0.7';
            container.appendChild(missionEl);
        });
    }
    
    createMissionElement(mission, showProgress) {
        const missionEl = document.createElement('div');
        missionEl.className = 'mission-item';
        
        let progressHtml = '';
        if (showProgress && mission.objectives) {
            progressHtml = '<div style="margin-top: 10px;">';
            mission.objectives.forEach(obj => {
                const progress = Math.min((obj.current / obj.target) * 100, 100);
                progressHtml += `
                    <div style="margin: 5px 0;">
                        <div style="color: #ccc; font-size: 12px;">${this.getObjectiveText(obj)}</div>
                        <div class="mission-progress" style="margin-top: 3px;">
                            <div class="mission-progress-fill" style="width: ${progress}%"></div>
                        </div>
                    </div>
                `;
            });
            progressHtml += '</div>';
        }
        
        missionEl.innerHTML = `
            <div class="mission-item-header">
                <div class="mission-icon">${mission.icon}</div>
                <div>
                    <div class="mission-title">${mission.title}</div>
                    <div class="mission-description">${mission.description}</div>
                </div>
            </div>
            <div class="mission-rewards">報酬: ${mission.rewards.score} スコア</div>
            ${progressHtml}
        `;
        
        return missionEl;
    }
}