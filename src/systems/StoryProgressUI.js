// ストーリー進行状況表示UI

export class StoryProgressUI {
    constructor(game) {
        this.game = game;
        this.progressionSystem = game.storyProgressionSystem;
        this.isVisible = false;
        
        this.createUI();
    }
    
    createUI() {
        // メインコンテナ
        this.container = document.createElement('div');
        this.container.id = 'story-progress-ui';
        this.container.style.cssText = `
            position: fixed;
            top: 60px;
            right: 10px;
            width: 300px;
            background: linear-gradient(to bottom, rgba(0, 20, 40, 0.9), rgba(0, 10, 20, 0.8));
            border: 2px solid rgba(0, 255, 255, 0.5);
            border-radius: 10px;
            padding: 15px;
            color: white;
            font-family: 'Orbitron', monospace;
            display: none;
            z-index: 100;
            box-shadow: 0 0 20px rgba(0, 255, 255, 0.3);
        `;
        
        // タイトル
        const title = document.createElement('div');
        title.style.cssText = `
            font-size: 18px;
            font-weight: bold;
            margin-bottom: 10px;
            text-align: center;
            color: #00ffff;
            text-shadow: 0 0 10px rgba(0, 255, 255, 0.5);
        `;
        title.textContent = 'ストーリー進行状況';
        
        // チャプター表示
        this.chapterDisplay = document.createElement('div');
        this.chapterDisplay.style.cssText = `
            font-size: 16px;
            margin-bottom: 10px;
            padding: 10px;
            background: rgba(0, 50, 100, 0.5);
            border-radius: 5px;
            text-align: center;
        `;
        
        // 進行度バー
        this.progressBarContainer = document.createElement('div');
        this.progressBarContainer.style.cssText = `
            width: 100%;
            height: 20px;
            background: rgba(0, 0, 0, 0.5);
            border-radius: 10px;
            overflow: hidden;
            margin-bottom: 15px;
            border: 1px solid rgba(0, 255, 255, 0.3);
        `;
        
        this.progressBar = document.createElement('div');
        this.progressBar.style.cssText = `
            height: 100%;
            background: linear-gradient(to right, #00ffff, #0088ff);
            width: 0%;
            transition: width 0.5s ease;
            box-shadow: 0 0 10px rgba(0, 255, 255, 0.8);
        `;
        
        this.progressText = document.createElement('div');
        this.progressText.style.cssText = `
            position: absolute;
            width: 100%;
            text-align: center;
            line-height: 20px;
            font-size: 12px;
            font-weight: bold;
        `;
        
        // 現在のミッション
        this.missionDisplay = document.createElement('div');
        this.missionDisplay.style.cssText = `
            margin-bottom: 10px;
        `;
        
        const missionLabel = document.createElement('div');
        missionLabel.style.cssText = `
            font-size: 14px;
            color: #88ccff;
            margin-bottom: 5px;
        `;
        missionLabel.textContent = '現在のミッション:';
        
        this.missionName = document.createElement('div');
        this.missionName.style.cssText = `
            font-size: 14px;
            padding: 5px;
            background: rgba(0, 100, 200, 0.3);
            border-radius: 5px;
            border-left: 3px solid #00ffff;
        `;
        
        // 統計情報
        this.statsDisplay = document.createElement('div');
        this.statsDisplay.style.cssText = `
            margin-top: 15px;
            padding-top: 15px;
            border-top: 1px solid rgba(0, 255, 255, 0.3);
            font-size: 12px;
        `;
        
        // 次の目標
        this.nextObjective = document.createElement('div');
        this.nextObjective.style.cssText = `
            margin-top: 10px;
            padding: 10px;
            background: rgba(255, 200, 0, 0.1);
            border: 1px solid rgba(255, 200, 0, 0.3);
            border-radius: 5px;
            font-size: 12px;
        `;
        
        const objectiveLabel = document.createElement('div');
        objectiveLabel.style.cssText = `
            color: #ffcc00;
            margin-bottom: 5px;
            font-weight: bold;
        `;
        objectiveLabel.textContent = '次の目標:';
        
        this.objectiveText = document.createElement('div');
        this.objectiveText.style.cssText = `
            color: #ffffff;
        `;
        
        // トグルボタン
        this.toggleButton = document.createElement('button');
        this.toggleButton.style.cssText = `
            position: fixed;
            top: 60px;
            right: 320px;
            width: 40px;
            height: 40px;
            background: rgba(0, 100, 200, 0.8);
            border: 2px solid #00ffff;
            border-radius: 5px;
            color: white;
            font-size: 20px;
            cursor: pointer;
            z-index: 101;
            transition: all 0.3s;
        `;
        this.toggleButton.innerHTML = '📊';
        this.toggleButton.onclick = () => this.toggle();
        
        // 組み立て
        this.progressBarContainer.appendChild(this.progressBar);
        this.progressBarContainer.appendChild(this.progressText);
        
        this.missionDisplay.appendChild(missionLabel);
        this.missionDisplay.appendChild(this.missionName);
        
        this.nextObjective.appendChild(objectiveLabel);
        this.nextObjective.appendChild(this.objectiveText);
        
        this.container.appendChild(title);
        this.container.appendChild(this.chapterDisplay);
        this.container.appendChild(this.progressBarContainer);
        this.container.appendChild(this.missionDisplay);
        this.container.appendChild(this.nextObjective);
        this.container.appendChild(this.statsDisplay);
        
        document.body.appendChild(this.container);
        document.body.appendChild(this.toggleButton);
        
        // 初期更新
        this.update();
    }
    
    update() {
        if (!this.progressionSystem) return;
        
        const progress = this.progressionSystem.progress;
        const currentChapter = this.progressionSystem.getCurrentChapter();
        const progressPercentage = this.progressionSystem.getProgressPercentage();
        
        // チャプター更新
        this.chapterDisplay.textContent = currentChapter;
        
        // 進行度バー更新
        this.progressBar.style.width = progressPercentage + '%';
        this.progressText.textContent = progressPercentage + '%';
        
        // 現在のミッション更新
        if (this.progressionSystem.currentMission) {
            this.missionName.textContent = this.progressionSystem.currentMission.name;
        } else {
            this.missionName.textContent = 'なし';
        }
        
        // 次の目標更新
        this.updateNextObjective();
        
        // 統計更新
        this.updateStats();
    }
    
    updateNextObjective() {
        const progress = this.progressionSystem.progress;
        let objective = '';
        
        if (!progress.flags.earthEscapeCompleted) {
            objective = '地球から脱出する';
        } else if (!progress.flags.tutorialCompleted) {
            objective = '基礎戦闘訓練を完了する';
        } else if (!progress.flags.marsReached) {
            objective = '火星へ向かう';
        } else if (!progress.flags.marsColonySaved) {
            objective = '火星コロニーを救援する';
        } else if (!progress.flags.firstBossDefeated) {
            objective = 'ヴォイド・ハーベスターを撃破する';
        } else if (!progress.flags.jupiterStationUnlocked) {
            objective = '木星ステーションへアクセスする';
        } else if (!progress.flags.saturnRingsReached) {
            objective = '土星リングへ向かう';
        } else if (!progress.flags.voidGateDiscovered) {
            objective = 'ヴォイドゲートを発見する';
        } else if (!progress.flags.finalBattleReady) {
            objective = '最終決戦の準備を整える';
        } else {
            objective = 'ヴォイドを撃退する';
        }
        
        this.objectiveText.textContent = objective;
    }
    
    updateStats() {
        const progress = this.progressionSystem.progress;
        const hours = Math.floor(progress.totalPlayTime / 3600);
        const minutes = Math.floor((progress.totalPlayTime % 3600) / 60);
        
        this.statsDisplay.innerHTML = `
            <div style="margin-bottom: 5px;">
                <span style="color: #88ccff;">完了ミッション:</span> 
                <span style="color: #00ff00;">${progress.totalMissionsCompleted}</span>
            </div>
            <div style="margin-bottom: 5px;">
                <span style="color: #88ccff;">メイン:</span> ${progress.mainMissionsCompleted} / 
                <span style="color: #88ccff;">サブ:</span> ${progress.sideMissionsCompleted}
            </div>
            <div style="margin-bottom: 5px;">
                <span style="color: #88ccff;">発見した秘密:</span> ${progress.secretsFound}
            </div>
            <div>
                <span style="color: #88ccff;">プレイ時間:</span> ${hours}時間${minutes}分
            </div>
        `;
    }
    
    show() {
        this.isVisible = true;
        this.container.style.display = 'block';
        this.toggleButton.style.right = '320px';
        this.update();
    }
    
    hide() {
        this.isVisible = false;
        this.container.style.display = 'none';
        this.toggleButton.style.right = '10px';
    }
    
    toggle() {
        if (this.isVisible) {
            this.hide();
        } else {
            this.show();
        }
    }
    
    // ミッション完了時のアニメーション
    onMissionComplete() {
        // フラッシュエフェクト
        this.container.style.animation = 'progressFlash 0.5s';
        setTimeout(() => {
            this.container.style.animation = '';
        }, 500);
        
        // 更新
        this.update();
    }
    
    // チャプター変更時のアニメーション
    onChapterChange() {
        this.chapterDisplay.style.animation = 'chapterChange 1s';
        setTimeout(() => {
            this.chapterDisplay.style.animation = '';
        }, 1000);
        
        this.update();
    }
}