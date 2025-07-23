// 実績システム
// ゲーム内の様々な達成項目を管理

export class AchievementSystem {
    constructor(game) {
        this.game = game;
        this.achievements = {};
        this.unlockedAchievements = new Set();
        this.notifications = [];
        this.notificationQueue = [];
        
        this.initializeAchievements();
        this.loadProgress();
        this.createUI();
    }
    
    initializeAchievements() {
        // 実績定義
        this.achievements = {
            // 戦闘系
            first_kill: {
                id: 'first_kill',
                name: '初陣',
                description: '初めて敵を撃破する',
                icon: '⚔️',
                points: 10,
                condition: () => this.game.statistics.enemiesKilled >= 1
            },
            enemy_hunter_1: {
                id: 'enemy_hunter_1',
                name: 'エネミーハンター',
                description: '敵を100体撃破する',
                icon: '🎯',
                points: 20,
                condition: () => this.game.statistics.enemiesKilled >= 100,
                progress: () => Math.min(this.game.statistics.enemiesKilled / 100, 1)
            },
            enemy_hunter_2: {
                id: 'enemy_hunter_2',
                name: 'エースパイロット',
                description: '敵を1000体撃破する',
                icon: '✈️',
                points: 50,
                condition: () => this.game.statistics.enemiesKilled >= 1000,
                progress: () => Math.min(this.game.statistics.enemiesKilled / 1000, 1)
            },
            
            // スコア系
            high_scorer_1: {
                id: 'high_scorer_1',
                name: 'ハイスコアラー',
                description: 'スコア10000点を達成',
                icon: '🏆',
                points: 15,
                condition: () => this.game.score >= 10000
            },
            combo_master: {
                id: 'combo_master',
                name: 'コンボマスター',
                description: '20コンボを達成',
                icon: '🔥',
                points: 25,
                condition: () => this.game.combo >= 20
            },
            
            // 探索系
            explorer_1: {
                id: 'explorer_1',
                name: '宇宙探検家',
                description: '3つの惑星を発見する',
                icon: '🔭',
                points: 20,
                condition: () => {
                    const zones = this.game.zoneManager?.zones;
                    if (!zones) return false;
                    const discovered = Object.values(zones).filter(z => z.discovered).length;
                    return discovered >= 3;
                },
                progress: () => {
                    const zones = this.game.zoneManager?.zones;
                    if (!zones) return 0;
                    const discovered = Object.values(zones).filter(z => z.discovered).length;
                    return Math.min(discovered / 3, 1);
                }
            },
            mars_visitor: {
                id: 'mars_visitor',
                name: '火星訪問者',
                description: '火星に着陸する',
                icon: '🔴',
                points: 30,
                condition: () => this.game.storySystem?.storyFlags.marsUnlocked && 
                                 this.game.zoneManager?.currentZone === 'mars'
            },
            
            // ストーリー系
            luna_friend: {
                id: 'luna_friend',
                name: 'ルナの友達',
                description: 'ルナとの信頼度を50に上げる',
                icon: '💝',
                points: 25,
                condition: () => this.game.companionSystem?.relationshipLevel >= 50,
                progress: () => Math.min((this.game.companionSystem?.relationshipLevel || 0) / 50, 1)
            },
            luna_bestfriend: {
                id: 'luna_bestfriend',
                name: '親友の絆',
                description: 'ルナとの信頼度を100にする',
                icon: '💖',
                points: 50,
                condition: () => this.game.companionSystem?.relationshipLevel >= 100,
                progress: () => Math.min((this.game.companionSystem?.relationshipLevel || 0) / 100, 1)
            },
            story_complete: {
                id: 'story_complete',
                name: '運命の選択',
                description: 'メインストーリーをクリアする',
                icon: '🌟',
                points: 100,
                hidden: true,
                condition: () => this.game.storySystem?.storyFlags.storyComplete
            },
            
            // ボス系
            boss_slayer_1: {
                id: 'boss_slayer_1',
                name: 'ボススレイヤー',
                description: '初めてボスを撃破する',
                icon: '👹',
                points: 30,
                condition: () => this.game.bossSpawnSystem?.bossesDefeated >= 1
            },
            raid_conqueror: {
                id: 'raid_conqueror',
                name: 'レイド征服者',
                description: 'レイドボスを撃破する',
                icon: '🐉',
                points: 50,
                condition: () => this.game.bossSpawnSystem?.raidBossDefeated
            },
            
            // 収集系
            credit_collector_1: {
                id: 'credit_collector_1',
                name: 'お金持ち',
                description: '10000クレジットを獲得',
                icon: '💰',
                points: 20,
                condition: () => this.game.statistics.creditsEarned >= 10000,
                progress: () => Math.min(this.game.statistics.creditsEarned / 10000, 1)
            },
            item_collector: {
                id: 'item_collector',
                name: 'アイテムコレクター',
                description: '50個のアイテムを収集',
                icon: '📦',
                points: 15,
                condition: () => (this.game.statistics.itemsCollected || 0) >= 50,
                progress: () => Math.min((this.game.statistics.itemsCollected || 0) / 50, 1)
            },
            
            // 特殊系
            no_damage_wave: {
                id: 'no_damage_wave',
                name: '無傷の戦士',
                description: '1ウェーブをノーダメージでクリア',
                icon: '🛡️',
                points: 40,
                condition: () => this.checkNoDamageWave()
            },
            speed_demon: {
                id: 'speed_demon',
                name: 'スピードデーモン',
                description: '最高速度で30秒間飛行',
                icon: '💨',
                points: 25,
                condition: () => this.checkSpeedDemon()
            },
            pacifist: {
                id: 'pacifist',
                name: '平和主義者',
                description: '敵を倒さずに5分間生存',
                icon: '☮️',
                points: 35,
                hidden: true,
                condition: () => this.checkPacifist()
            },
            
            // イースターエッグ
            secret_finder: {
                id: 'secret_finder',
                name: '秘密の発見者',
                description: '隠された何かを見つける',
                icon: '🔍',
                points: 50,
                hidden: true,
                condition: () => this.game.secretFound
            }
        };
    }
    
    createUI() {
        // 実績通知用のコンテナ
        this.notificationContainer = document.createElement('div');
        this.notificationContainer.id = 'achievement-notifications';
        this.notificationContainer.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 2000;
            pointer-events: none;
        `;
        document.body.appendChild(this.notificationContainer);
        
        // 実績一覧UI
        this.createAchievementList();
    }
    
    createAchievementList() {
        // 実績一覧ボタン
        const achievementButton = document.createElement('button');
        achievementButton.id = 'achievement-button';
        achievementButton.style.cssText = `
            position: fixed;
            top: 20px;
            right: 200px;
            background: rgba(0, 0, 0, 0.8);
            border: 2px solid #ffd700;
            color: #ffd700;
            padding: 10px 20px;
            border-radius: 10px;
            cursor: pointer;
            font-size: 16px;
            z-index: 100;
            transition: all 0.3s ease;
        `;
        achievementButton.innerHTML = '🏆 実績';
        achievementButton.onclick = () => this.toggleAchievementList();
        
        // 実績ポイント表示
        this.pointsDisplay = document.createElement('span');
        this.pointsDisplay.style.cssText = `
            margin-left: 10px;
            font-size: 14px;
            color: #fff;
        `;
        achievementButton.appendChild(this.pointsDisplay);
        this.updatePointsDisplay();
        
        document.getElementById('ui-overlay').appendChild(achievementButton);
        
        // 実績一覧パネル
        this.achievementPanel = document.createElement('div');
        this.achievementPanel.id = 'achievement-panel';
        this.achievementPanel.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 600px;
            max-height: 80vh;
            background: rgba(0, 0, 0, 0.95);
            border: 3px solid #ffd700;
            border-radius: 15px;
            padding: 30px;
            display: none;
            z-index: 3000;
            overflow-y: auto;
        `;
        
        // タイトル
        const title = document.createElement('h2');
        title.style.cssText = `
            color: #ffd700;
            text-align: center;
            margin: 0 0 20px 0;
            font-size: 28px;
        `;
        title.textContent = '実績';
        
        // 実績リストコンテナ
        this.achievementListContainer = document.createElement('div');
        this.achievementListContainer.style.cssText = `
            display: grid;
            gap: 10px;
        `;
        
        // 閉じるボタン
        const closeBtn = document.createElement('button');
        closeBtn.style.cssText = `
            position: absolute;
            top: 10px;
            right: 10px;
            background: transparent;
            border: none;
            color: #ffd700;
            font-size: 24px;
            cursor: pointer;
        `;
        closeBtn.textContent = '✕';
        closeBtn.onclick = () => this.toggleAchievementList();
        
        this.achievementPanel.appendChild(title);
        this.achievementPanel.appendChild(this.achievementListContainer);
        this.achievementPanel.appendChild(closeBtn);
        
        document.body.appendChild(this.achievementPanel);
    }
    
    showNotification(achievement) {
        const notification = document.createElement('div');
        notification.style.cssText = `
            background: linear-gradient(135deg, rgba(255, 215, 0, 0.9), rgba(255, 165, 0, 0.9));
            border: 2px solid #fff;
            border-radius: 10px;
            padding: 20px;
            margin-bottom: 10px;
            color: #000;
            font-weight: bold;
            box-shadow: 0 0 20px rgba(255, 215, 0, 0.5);
            animation: achievementSlideIn 0.5s ease-out;
            pointer-events: auto;
        `;
        
        notification.innerHTML = `
            <div style="display: flex; align-items: center;">
                <div style="font-size: 40px; margin-right: 15px;">${achievement.icon}</div>
                <div>
                    <div style="font-size: 18px; margin-bottom: 5px;">実績達成！</div>
                    <div style="font-size: 20px;">${achievement.name}</div>
                    <div style="font-size: 14px; opacity: 0.8;">${achievement.description}</div>
                    <div style="font-size: 16px; margin-top: 5px;">+${achievement.points} ポイント</div>
                </div>
            </div>
        `;
        
        this.notificationContainer.appendChild(notification);
        
        // 効果音
        if (this.game.soundManager) {
            this.game.soundManager.play('achievement');
        }
        
        // 5秒後に削除
        setTimeout(() => {
            notification.style.animation = 'achievementSlideOut 0.5s ease-in';
            setTimeout(() => {
                this.notificationContainer.removeChild(notification);
            }, 500);
        }, 5000);
    }
    
    check() {
        Object.entries(this.achievements).forEach(([id, achievement]) => {
            if (!this.unlockedAchievements.has(id)) {
                if (achievement.condition()) {
                    this.unlock(id);
                }
            }
        });
    }
    
    unlock(achievementId) {
        const achievement = this.achievements[achievementId];
        if (!achievement || this.unlockedAchievements.has(achievementId)) return;
        
        this.unlockedAchievements.add(achievementId);
        this.showNotification(achievement);
        this.saveProgress();
        this.updatePointsDisplay();
        
        // 統計に記録
        console.log(`Achievement unlocked: ${achievement.name}`);
    }
    
    getTotalPoints() {
        let total = 0;
        this.unlockedAchievements.forEach(id => {
            if (this.achievements[id]) {
                total += this.achievements[id].points;
            }
        });
        return total;
    }
    
    updatePointsDisplay() {
        if (this.pointsDisplay) {
            this.pointsDisplay.textContent = `(${this.getTotalPoints()}pts)`;
        }
    }
    
    toggleAchievementList() {
        if (this.achievementPanel.style.display === 'block') {
            this.achievementPanel.style.display = 'none';
            this.game.isPaused = false;
        } else {
            this.updateAchievementList();
            this.achievementPanel.style.display = 'block';
            this.game.isPaused = true;
        }
    }
    
    updateAchievementList() {
        this.achievementListContainer.innerHTML = '';
        
        // カテゴリー別に整理
        const categories = {
            combat: { name: '戦闘', achievements: [] },
            exploration: { name: '探索', achievements: [] },
            story: { name: 'ストーリー', achievements: [] },
            collection: { name: '収集', achievements: [] },
            special: { name: '特殊', achievements: [] }
        };
        
        // 実績を分類
        Object.entries(this.achievements).forEach(([id, achievement]) => {
            // 隠し実績は未解除なら表示しない
            if (achievement.hidden && !this.unlockedAchievements.has(id)) {
                return;
            }
            
            let category = 'special';
            if (id.includes('kill') || id.includes('enemy') || id.includes('boss')) category = 'combat';
            else if (id.includes('explorer') || id.includes('visitor')) category = 'exploration';
            else if (id.includes('luna') || id.includes('story')) category = 'story';
            else if (id.includes('collector') || id.includes('credit')) category = 'collection';
            
            categories[category].achievements.push({ id, ...achievement });
        });
        
        // カテゴリーごとに表示
        Object.values(categories).forEach(category => {
            if (category.achievements.length === 0) return;
            
            const categoryDiv = document.createElement('div');
            categoryDiv.style.cssText = 'margin-bottom: 20px;';
            
            const categoryTitle = document.createElement('h3');
            categoryTitle.style.cssText = 'color: #ffd700; margin-bottom: 10px;';
            categoryTitle.textContent = category.name;
            categoryDiv.appendChild(categoryTitle);
            
            category.achievements.forEach(achievement => {
                const achievementItem = this.createAchievementItem(achievement);
                categoryDiv.appendChild(achievementItem);
            });
            
            this.achievementListContainer.appendChild(categoryDiv);
        });
    }
    
    createAchievementItem(achievement) {
        const unlocked = this.unlockedAchievements.has(achievement.id);
        
        const item = document.createElement('div');
        item.style.cssText = `
            background: ${unlocked ? 'rgba(255, 215, 0, 0.1)' : 'rgba(100, 100, 100, 0.1)'};
            border: 2px solid ${unlocked ? '#ffd700' : '#666'};
            border-radius: 10px;
            padding: 15px;
            display: flex;
            align-items: center;
            transition: all 0.3s ease;
            ${!unlocked ? 'opacity: 0.6;' : ''}
        `;
        
        // アイコン
        const icon = document.createElement('div');
        icon.style.cssText = 'font-size: 40px; margin-right: 15px;';
        icon.textContent = unlocked ? achievement.icon : '🔒';
        
        // 情報
        const info = document.createElement('div');
        info.style.cssText = 'flex: 1;';
        
        const name = document.createElement('div');
        name.style.cssText = `
            font-size: 18px;
            font-weight: bold;
            color: ${unlocked ? '#ffd700' : '#aaa'};
            margin-bottom: 5px;
        `;
        name.textContent = achievement.name;
        
        const desc = document.createElement('div');
        desc.style.cssText = 'font-size: 14px; color: #ccc;';
        desc.textContent = achievement.description;
        
        // 進捗バー（もしあれば）
        if (achievement.progress && !unlocked) {
            const progressBar = document.createElement('div');
            progressBar.style.cssText = `
                margin-top: 8px;
                height: 6px;
                background: rgba(255, 255, 255, 0.1);
                border-radius: 3px;
                overflow: hidden;
            `;
            
            const progressFill = document.createElement('div');
            progressFill.style.cssText = `
                height: 100%;
                width: ${achievement.progress() * 100}%;
                background: #ffd700;
                transition: width 0.3s ease;
            `;
            
            progressBar.appendChild(progressFill);
            desc.appendChild(progressBar);
        }
        
        info.appendChild(name);
        info.appendChild(desc);
        
        // ポイント
        const points = document.createElement('div');
        points.style.cssText = `
            font-size: 20px;
            font-weight: bold;
            color: ${unlocked ? '#ffd700' : '#666'};
        `;
        points.textContent = `${achievement.points}pts`;
        
        item.appendChild(icon);
        item.appendChild(info);
        item.appendChild(points);
        
        return item;
    }
    
    // 特殊条件のチェック
    checkNoDamageWave() {
        // 実装は省略（ウェーブマネージャーと連携）
        return false;
    }
    
    checkSpeedDemon() {
        // 実装は省略（プレイヤーの速度記録と連携）
        return false;
    }
    
    checkPacifist() {
        // 実装は省略（時間経過と撃破数をチェック）
        return false;
    }
    
    saveProgress() {
        const data = {
            unlocked: Array.from(this.unlockedAchievements)
        };
        localStorage.setItem('achievements', JSON.stringify(data));
    }
    
    loadProgress() {
        const saved = localStorage.getItem('achievements');
        if (saved) {
            const data = JSON.parse(saved);
            this.unlockedAchievements = new Set(data.unlocked);
        }
    }
    
    update(deltaTime) {
        // 定期的に実績条件をチェック
        if (Math.random() < 0.01) { // 低頻度でチェック
            this.check();
        }
    }
}

// CSSアニメーション
const style = document.createElement('style');
style.textContent = `
    @keyframes achievementSlideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes achievementSlideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);