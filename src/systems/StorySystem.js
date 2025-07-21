export class StorySystem {
    constructor(game) {
        this.game = game;
        this.currentChapter = 0;
        this.currentProgress = 0;
        this.storyFlags = {};
        
        this.loadStoryData();
        this.loadProgress();
    }
    
    loadStoryData() {
        this.chapters = {
            0: {
                title: '序章：目覚め',
                missions: [
                    {
                        id: 'awakening',
                        title: '記憶の欠片',
                        description: '医療施設で目覚めたあなた。失われた記憶を取り戻すため、最初の一歩を踏み出す。',
                        objectives: [
                            { type: 'dialogue', target: 'tutorial_emilia', description: 'Dr.エミリアと話す' },
                            { type: 'training', target: 'basic_flight', description: '基本操縦訓練を完了する' },
                            { type: 'destroy', target: 'training_drone', count: 5, description: '訓練ドローンを5機撃破' }
                        ],
                        rewards: {
                            credits: 1000,
                            exp: 100,
                            items: ['repair_kit']
                        }
                    },
                    {
                        id: 'first_sortie',
                        title: '初陣',
                        description: 'ステーション周辺に現れた海賊を撃退せよ。',
                        objectives: [
                            { type: 'destroy', target: 'pirate', count: 10, description: '海賊機を10機撃破' },
                            { type: 'protect', target: 'transport', description: '輸送船を護衛する' }
                        ],
                        rewards: {
                            credits: 2000,
                            exp: 200,
                            items: ['laser_mk2']
                        }
                    }
                ]
            },
            1: {
                title: '第1章：覚醒',
                missions: [
                    {
                        id: 'void_encounter',
                        title: 'ヴォイドとの遭遇',
                        description: '偵察任務中、謎の敵「ヴォイド」と初めて遭遇する。',
                        objectives: [
                            { type: 'scout', target: 'anomaly_point', description: '異常地点を調査する' },
                            { type: 'survive', duration: 120, description: 'ヴォイドの攻撃を2分間生き延びる' },
                            { type: 'escape', target: 'safe_zone', description: '安全地帯まで撤退する' }
                        ],
                        rewards: {
                            credits: 3000,
                            exp: 300,
                            story: 'void_data_1'
                        }
                    },
                    {
                        id: 'colony_defense',
                        title: 'コロニー防衛戦',
                        description: 'アクア・コロニーがヴォイドの大規模攻撃を受けている！',
                        objectives: [
                            { type: 'destroy', target: 'void_fighter', count: 20, description: 'ヴォイド戦闘機を20機撃破' },
                            { type: 'destroy', target: 'void_cruiser', count: 1, description: 'ヴォイド巡洋艦を撃破' },
                            { type: 'protect', target: 'colony', minHealth: 50, description: 'コロニーの耐久度を50%以上維持' }
                        ],
                        rewards: {
                            credits: 5000,
                            exp: 500,
                            items: ['plasma_cannon'],
                            reputation: { colony: 100 }
                        }
                    },
                    {
                        id: 'ancient_ruins',
                        title: '古代遺跡の発見',
                        description: 'Dr.エミリアの解析により、古代文明の遺跡の座標が判明した。',
                        objectives: [
                            { type: 'explore', target: 'ruins_entrance', description: '遺跡の入り口を発見する' },
                            { type: 'collect', target: 'ancient_artifact', count: 3, description: '古代のアーティファクトを3つ収集' },
                            { type: 'boss', target: 'guardian', description: '遺跡の守護者を倒す' }
                        ],
                        rewards: {
                            credits: 7000,
                            exp: 700,
                            story: 'ancient_tech_unlock',
                            unlock: 'skill_timeslow'
                        }
                    }
                ]
            }
        };
    }
    
    loadProgress() {
        const saved = localStorage.getItem('storyProgress');
        if (saved) {
            const data = JSON.parse(saved);
            this.currentChapter = data.chapter || 0;
            this.currentProgress = data.progress || 0;
            this.storyFlags = data.flags || {};
        }
    }
    
    saveProgress() {
        const data = {
            chapter: this.currentChapter,
            progress: this.currentProgress,
            flags: this.storyFlags
        };
        localStorage.setItem('storyProgress', JSON.stringify(data));
    }
    
    getCurrentMission() {
        const chapter = this.chapters[this.currentChapter];
        if (!chapter || this.currentProgress >= chapter.missions.length) {
            return null;
        }
        return chapter.missions[this.currentProgress];
    }
    
    startMission(missionId) {
        const mission = this.getCurrentMission();
        if (!mission || mission.id !== missionId) {
            console.error('Invalid mission:', missionId);
            return;
        }
        
        // ミッション開始時の処理
        this.game.missionSystem.startMission(mission);
        
        // ストーリーイベントの発火
        this.triggerStoryEvent('mission_start', mission);
    }
    
    completeMission(missionId) {
        const mission = this.getCurrentMission();
        if (!mission || mission.id !== missionId) {
            return;
        }
        
        // 報酬の付与
        if (mission.rewards) {
            if (mission.rewards.credits) {
                this.game.inventorySystem.addCredits(mission.rewards.credits);
            }
            if (mission.rewards.exp) {
                // 経験値システムは後で実装
                console.log(`経験値獲得: ${mission.rewards.exp}`);
            }
            if (mission.rewards.items) {
                mission.rewards.items.forEach(itemId => {
                    this.game.inventorySystem.addItem(itemId);
                });
            }
            if (mission.rewards.story) {
                this.setStoryFlag(mission.rewards.story, true);
            }
            if (mission.rewards.unlock) {
                this.unlockFeature(mission.rewards.unlock);
            }
        }
        
        // 進行状況を更新
        this.currentProgress++;
        
        // 章の終了チェック
        if (this.currentProgress >= this.chapters[this.currentChapter].missions.length) {
            this.completeChapter();
        }
        
        this.saveProgress();
        this.triggerStoryEvent('mission_complete', mission);
    }
    
    completeChapter() {
        const chapter = this.chapters[this.currentChapter];
        this.triggerStoryEvent('chapter_complete', chapter);
        
        // 次の章へ
        this.currentChapter++;
        this.currentProgress = 0;
        
        // 次の章が存在しない場合
        if (!this.chapters[this.currentChapter]) {
            this.triggerStoryEvent('story_complete');
        }
    }
    
    setStoryFlag(flag, value) {
        this.storyFlags[flag] = value;
        this.saveProgress();
    }
    
    getStoryFlag(flag) {
        return this.storyFlags[flag] || false;
    }
    
    unlockFeature(feature) {
        switch(feature) {
            case 'skill_timeslow':
                // スキルシステムに通知
                if (this.game.skillSystem) {
                    this.game.skillSystem.unlockSkill('timeslow');
                }
                break;
            default:
                console.log('Feature unlocked:', feature);
        }
    }
    
    triggerStoryEvent(eventType, data) {
        // ストーリーイベントに応じた演出
        switch(eventType) {
            case 'mission_start':
                this.showMissionBriefing(data);
                break;
            case 'mission_complete':
                this.showMissionComplete(data);
                break;
            case 'chapter_complete':
                this.showChapterComplete(data);
                break;
            case 'story_complete':
                this.showStoryComplete();
                break;
        }
    }
    
    showMissionBriefing(mission) {
        // ミッションブリーフィング画面を表示
        const briefing = document.createElement('div');
        briefing.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(0, 10, 30, 0.95);
            border: 2px solid rgba(0, 200, 255, 0.8);
            border-radius: 20px;
            padding: 30px;
            max-width: 600px;
            z-index: 3000;
            color: white;
        `;
        
        briefing.innerHTML = `
            <h2 style="color: #00ffff; margin-bottom: 20px;">ミッションブリーフィング</h2>
            <h3 style="color: #ffaa00; margin-bottom: 15px;">${mission.title}</h3>
            <p style="margin-bottom: 20px;">${mission.description}</p>
            <h4 style="color: #00ff00; margin-bottom: 10px;">目標:</h4>
            <ul style="list-style: none; padding: 0;">
                ${mission.objectives.map(obj => `
                    <li style="margin-bottom: 5px;">▸ ${obj.description}</li>
                `).join('')}
            </ul>
            <button id="start-mission" style="
                margin-top: 20px;
                padding: 10px 30px;
                background: linear-gradient(45deg, rgba(0, 100, 200, 0.8), rgba(0, 200, 255, 0.8));
                border: 2px solid white;
                color: white;
                font-size: 18px;
                cursor: pointer;
                border-radius: 25px;
            ">ミッション開始</button>
        `;
        
        document.body.appendChild(briefing);
        
        document.getElementById('start-mission').addEventListener('click', () => {
            briefing.remove();
            // ミッション開始処理
        });
    }
    
    showMissionComplete(mission) {
        const complete = document.createElement('div');
        complete.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(0, 30, 0, 0.95);
            border: 2px solid rgba(0, 255, 0, 0.8);
            border-radius: 20px;
            padding: 30px;
            max-width: 500px;
            z-index: 3000;
            color: white;
            text-align: center;
        `;
        
        complete.innerHTML = `
            <h2 style="color: #00ff00; margin-bottom: 20px;">ミッション完了！</h2>
            <h3 style="color: white; margin-bottom: 20px;">${mission.title}</h3>
            <div style="margin-top: 20px;">
                <h4 style="color: #ffaa00;">報酬:</h4>
                ${mission.rewards.credits ? `<p>💰 ${mission.rewards.credits} クレジット</p>` : ''}
                ${mission.rewards.exp ? `<p>⭐ ${mission.rewards.exp} EXP</p>` : ''}
            </div>
        `;
        
        document.body.appendChild(complete);
        
        setTimeout(() => {
            complete.style.opacity = '0';
            complete.style.transition = 'opacity 1s';
            setTimeout(() => complete.remove(), 1000);
        }, 3000);
    }
    
    showChapterComplete(chapter) {
        // 章完了の演出
        console.log('Chapter complete:', chapter.title);
    }
    
    showStoryComplete() {
        // ストーリー完了の演出
        console.log('Story complete!');
    }
}