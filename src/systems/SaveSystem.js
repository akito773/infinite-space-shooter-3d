// セーブ・ロードシステム

export class SaveSystem {
    constructor(game) {
        this.game = game;
        this.saveSlots = 3; // セーブスロット数
        this.autoSaveInterval = 30000; // 30秒間隔の自動セーブ
        this.autoSaveTimer = null;
        this.currentSaveSlot = 0;
        
        this.init();
    }
    
    init() {
        // 自動セーブを開始
        this.startAutoSave();
        
        // キーボードショートカット
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.key === 's') {
                e.preventDefault();
                this.quickSave();
            }
            if (e.ctrlKey && e.key === 'l') {
                e.preventDefault();
                this.showLoadMenu();
            }
        });
        
        // ページ離脱時の自動セーブ
        window.addEventListener('beforeunload', () => {
            this.quickSave();
        });
    }
    
    // ゲームデータを収集
    collectGameData() {
        const gameData = {
            version: "1.0.0",
            timestamp: Date.now(),
            
            // プレイヤー情報
            player: {
                position: {
                    x: this.game.player?.group.position.x || 0,
                    y: this.game.player?.group.position.y || 0,
                    z: this.game.player?.group.position.z || 0
                },
                rotation: {
                    x: this.game.player?.group.rotation.x || 0,
                    y: this.game.player?.group.rotation.y || 0,
                    z: this.game.player?.group.rotation.z || 0
                },
                health: this.game.player?.health || 100,
                maxHealth: this.game.player?.maxHealth || 100,
                damage: this.game.player?.damage || 10,
                level: this.game.player?.level || 1,
                experience: this.game.player?.experience || 0
            },
            
            // ゲーム進行
            progress: {
                score: this.game.score || 0,
                highScore: this.game.highScore || 0,
                currentZone: this.game.zoneManager?.currentZone || 'earth',
                playTime: this.getPlayTime(),
                totalEnemiesKilled: this.getTotalEnemiesKilled(),
                totalCreditsEarned: this.getTotalCreditsEarned()
            },
            
            // インベントリ・装備
            inventory: {
                credits: this.game.inventorySystem?.credits || 0,
                items: this.game.inventorySystem?.items || [],
                equippedWeapon: this.game.inventorySystem?.equippedWeapon || null,
                equippedShield: this.game.inventorySystem?.equippedShield || null,
                equippedEngine: this.game.inventorySystem?.equippedEngine || null,
                equippedSpecial: this.game.inventorySystem?.equippedSpecial || null
            },
            
            // ミッション進行
            missions: {
                activeMissions: this.game.missionSystem?.activeMissions || [],
                completedMissions: this.game.missionSystem?.completedMissions || [],
                availableMissions: this.game.missionSystem?.availableMissions || []
            },
            
            // 探索・発見
            exploration: {
                discoveredZones: this.game.zoneManager?.loadedZones ? 
                    Array.from(this.game.zoneManager.loadedZones) : ['earth'],
                discoveredPlanets: this.getDiscoveredPlanets(),
                discoveredStations: this.getDiscoveredStations(),
                scannedLocations: this.getScannedLocations()
            },
            
            // スキル・アップグレード
            skills: {
                pilotingLevel: this.game.skillSystem?.pilotingLevel || 1,
                combatLevel: this.game.skillSystem?.combatLevel || 1,
                explorationLevel: this.game.skillSystem?.explorationLevel || 1,
                engineeringLevel: this.game.skillSystem?.engineeringLevel || 1,
                skillPoints: this.game.skillSystem?.skillPoints || 0,
                unlockedSkills: this.game.skillSystem?.unlockedSkills || []
            },
            
            // 設定
            settings: {
                difficulty: this.game.difficulty || 'normal',
                soundEnabled: this.game.soundManager?.enabled || true,
                musicVolume: this.game.soundManager?.musicVolume || 0.5,
                sfxVolume: this.game.soundManager?.sfxVolume || 0.7,
                graphics: {
                    quality: this.game.graphicsQuality || 'medium',
                    shadows: this.game.shadowsEnabled || true,
                    particles: this.game.particlesEnabled || true
                }
            },
            
            // 統計情報
            statistics: {
                totalPlayTime: this.getTotalPlayTime(),
                totalFlightDistance: this.getTotalFlightDistance(),
                totalShots: this.getTotalShots(),
                accuracy: this.getAccuracy(),
                planetsVisited: this.getPlanetsVisited(),
                achievementsUnlocked: this.getAchievements()
            }
        };
        
        return gameData;
    }
    
    // セーブ実行
    async saveGame(slotNumber = null, showMessage = true) {
        try {
            const slot = slotNumber !== null ? slotNumber : this.currentSaveSlot;
            const gameData = this.collectGameData();
            
            // メタデータ追加
            gameData.saveSlot = slot;
            gameData.saveName = this.generateSaveName(gameData);
            
            // LocalStorageに保存
            const saveKey = `spaceshooter_save_${slot}`;
            localStorage.setItem(saveKey, JSON.stringify(gameData));
            
            // 最新セーブスロットを記録
            localStorage.setItem('spaceshooter_latest_save', slot.toString());
            
            console.log(`Game saved to slot ${slot}`);
            
            if (showMessage) {
                this.game.showMessage(`ゲームがスロット${slot + 1}に保存されました`, 2000);
            }
            
            return true;
        } catch (error) {
            console.error('Save failed:', error);
            if (showMessage) {
                this.game.showMessage('セーブに失敗しました', 3000);
            }
            return false;
        }
    }
    
    // ロード実行
    async loadGame(slotNumber, showMessage = true) {
        try {
            const saveKey = `spaceshooter_save_${slotNumber}`;
            const savedData = localStorage.getItem(saveKey);
            
            if (!savedData) {
                if (showMessage) {
                    this.game.showMessage(`スロット${slotNumber + 1}にセーブデータがありません`, 3000);
                }
                return false;
            }
            
            const gameData = JSON.parse(savedData);
            
            // バージョンチェック
            if (!this.isCompatibleVersion(gameData.version)) {
                if (showMessage) {
                    this.game.showMessage('非対応のセーブデータです', 3000);
                }
                return false;
            }
            
            // ゲームデータを復元
            await this.restoreGameData(gameData);
            
            this.currentSaveSlot = slotNumber;
            
            console.log(`Game loaded from slot ${slotNumber}`);
            
            if (showMessage) {
                this.game.showMessage(`スロット${slotNumber + 1}からロードしました`, 2000);
            }
            
            return true;
        } catch (error) {
            console.error('Load failed:', error);
            if (showMessage) {
                this.game.showMessage('ロードに失敗しました', 3000);
            }
            return false;
        }
    }
    
    // ゲームデータ復元
    async restoreGameData(gameData) {
        // プレイヤー状態復元
        if (this.game.player && gameData.player) {
            this.game.player.group.position.set(
                gameData.player.position.x,
                gameData.player.position.y,
                gameData.player.position.z
            );
            this.game.player.group.rotation.set(
                gameData.player.rotation.x,
                gameData.player.rotation.y,
                gameData.player.rotation.z
            );
            this.game.player.health = gameData.player.health;
            this.game.player.maxHealth = gameData.player.maxHealth;
            this.game.player.damage = gameData.player.damage;
            this.game.player.level = gameData.player.level || 1;
            this.game.player.experience = gameData.player.experience || 0;
        }
        
        // 進行状況復元
        if (gameData.progress) {
            this.game.score = gameData.progress.score;
            this.game.highScore = gameData.progress.highScore;
            this.game.updateScore(0); // UI更新
        }
        
        // インベントリ復元
        if (this.game.inventorySystem && gameData.inventory) {
            this.game.inventorySystem.credits = gameData.inventory.credits;
            this.game.inventorySystem.items = gameData.inventory.items;
            this.game.inventorySystem.equippedWeapon = gameData.inventory.equippedWeapon;
            this.game.inventorySystem.equippedShield = gameData.inventory.equippedShield;
            this.game.inventorySystem.equippedEngine = gameData.inventory.equippedEngine;
            this.game.inventorySystem.equippedSpecial = gameData.inventory.equippedSpecial;
            
            // UI更新
            if (this.game.inventorySystem.onCreditsChange) {
                this.game.inventorySystem.onCreditsChange();
            }
        }
        
        // ミッション復元
        if (this.game.missionSystem && gameData.missions) {
            this.game.missionSystem.activeMissions = gameData.missions.activeMissions;
            this.game.missionSystem.completedMissions = gameData.missions.completedMissions;
            this.game.missionSystem.availableMissions = gameData.missions.availableMissions;
        }
        
        // ゾーン復元
        if (this.game.zoneManager && gameData.exploration) {
            // 発見済みゾーンを復元
            this.game.zoneManager.loadedZones = new Set(gameData.exploration.discoveredZones);
            
            // 現在のゾーンに移動
            if (gameData.progress.currentZone !== this.game.zoneManager.currentZone) {
                await this.game.zoneManager.loadZone(gameData.progress.currentZone);
            }
        }
        
        // スキル復元
        if (this.game.skillSystem && gameData.skills) {
            this.game.skillSystem.pilotingLevel = gameData.skills.pilotingLevel;
            this.game.skillSystem.combatLevel = gameData.skills.combatLevel;
            this.game.skillSystem.explorationLevel = gameData.skills.explorationLevel;
            this.game.skillSystem.engineeringLevel = gameData.skills.engineeringLevel;
            this.game.skillSystem.skillPoints = gameData.skills.skillPoints;
            this.game.skillSystem.unlockedSkills = gameData.skills.unlockedSkills;
        }
        
        // 設定復元
        if (gameData.settings) {
            this.game.difficulty = gameData.settings.difficulty;
            if (this.game.soundManager) {
                this.game.soundManager.enabled = gameData.settings.soundEnabled;
                this.game.soundManager.musicVolume = gameData.settings.musicVolume;
                this.game.soundManager.sfxVolume = gameData.settings.sfxVolume;
            }
        }
    }
    
    // クイックセーブ
    quickSave() {
        return this.saveGame(this.currentSaveSlot, true);
    }
    
    // クイックロード
    quickLoad() {
        return this.loadGame(this.currentSaveSlot, true);
    }
    
    // 自動セーブ開始
    startAutoSave() {
        if (this.autoSaveTimer) {
            clearInterval(this.autoSaveTimer);
        }
        
        this.autoSaveTimer = setInterval(() => {
            this.saveGame(0, false); // スロット0に無音でセーブ
        }, this.autoSaveInterval);
    }
    
    // 自動セーブ停止
    stopAutoSave() {
        if (this.autoSaveTimer) {
            clearInterval(this.autoSaveTimer);
            this.autoSaveTimer = null;
        }
    }
    
    // セーブスロット情報取得
    getSaveSlotInfo(slotNumber) {
        const saveKey = `spaceshooter_save_${slotNumber}`;
        const savedData = localStorage.getItem(saveKey);
        
        if (!savedData) {
            return null;
        }
        
        try {
            const gameData = JSON.parse(savedData);
            return {
                slot: slotNumber,
                saveName: gameData.saveName,
                timestamp: gameData.timestamp,
                level: gameData.player?.level || 1,
                zone: gameData.progress?.currentZone || 'earth',
                playTime: gameData.progress?.playTime || 0,
                credits: gameData.inventory?.credits || 0
            };
        } catch (error) {
            console.error(`Error reading save slot ${slotNumber}:`, error);
            return null;
        }
    }
    
    // セーブ名生成
    generateSaveName(gameData) {
        const date = new Date(gameData.timestamp);
        const zoneName = this.getZoneJapaneseName(gameData.progress.currentZone);
        const level = gameData.player.level || 1;
        
        return `Lv.${level} ${zoneName} - ${date.toLocaleDateString('ja-JP')} ${date.toLocaleTimeString('ja-JP', {hour: '2-digit', minute: '2-digit'})}`;
    }
    
    // ゾーンの日本語名取得
    getZoneJapaneseName(zoneId) {
        const zoneNames = {
            earth: '地球エリア',
            mars: '火星エリア',
            jupiter: '木星エリア',
            saturn: '土星エリア'
        };
        return zoneNames[zoneId] || '不明なエリア';
    }
    
    // バージョン互換性チェック
    isCompatibleVersion(saveVersion) {
        // 簡単なバージョンチェック
        const currentVersion = "1.0.0";
        return saveVersion === currentVersion;
    }
    
    // ヘルパーメソッド（統計情報用）
    getPlayTime() {
        return this.game.clock?.getElapsedTime() || 0;
    }
    
    getTotalEnemiesKilled() {
        return this.game.statistics?.enemiesKilled || 0;
    }
    
    getTotalCreditsEarned() {
        return this.game.statistics?.creditsEarned || 0;
    }
    
    getDiscoveredPlanets() {
        return this.game.planets?.map(p => p.name) || [];
    }
    
    getDiscoveredStations() {
        return this.game.stations?.map(s => s.name) || [];
    }
    
    getScannedLocations() {
        return this.game.explorationEventSystem?.scannedLocations || [];
    }
    
    getTotalPlayTime() {
        return parseInt(localStorage.getItem('spaceshooter_total_playtime') || '0');
    }
    
    getTotalFlightDistance() {
        return parseFloat(localStorage.getItem('spaceshooter_total_distance') || '0');
    }
    
    getTotalShots() {
        return parseInt(localStorage.getItem('spaceshooter_total_shots') || '0');
    }
    
    getAccuracy() {
        const shots = this.getTotalShots();
        const hits = parseInt(localStorage.getItem('spaceshooter_total_hits') || '0');
        return shots > 0 ? (hits / shots * 100) : 0;
    }
    
    getPlanetsVisited() {
        return parseInt(localStorage.getItem('spaceshooter_planets_visited') || '0');
    }
    
    getAchievements() {
        return JSON.parse(localStorage.getItem('spaceshooter_achievements') || '[]');
    }
    
    // セーブメニュー表示
    showSaveMenu() {
        this.createSaveLoadUI('save');
    }
    
    // ロードメニュー表示
    showLoadMenu() {
        this.createSaveLoadUI('load');
    }
    
    // セーブ・ロードUI作成
    createSaveLoadUI(mode) {
        // 既存のUIを削除
        const existingUI = document.getElementById('save-load-ui');
        if (existingUI) {
            existingUI.remove();
        }
        
        const ui = document.createElement('div');
        ui.id = 'save-load-ui';
        ui.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.8);
            z-index: 15000;
            display: flex;
            align-items: center;
            justify-content: center;
            font-family: 'Orbitron', monospace;
        `;
        
        const container = document.createElement('div');
        container.style.cssText = `
            background: linear-gradient(135deg, rgba(0, 20, 40, 0.95), rgba(0, 40, 80, 0.95));
            border: 2px solid #00ffff;
            border-radius: 10px;
            padding: 30px;
            max-width: 600px;
            width: 90%;
            max-height: 80vh;
            overflow-y: auto;
        `;
        
        const title = mode === 'save' ? 'ゲームセーブ' : 'ゲームロード';
        container.innerHTML = `
            <h2 style="color: #00ffff; margin-bottom: 20px; text-align: center;">${title}</h2>
            <div id="save-slots"></div>
            <div style="text-align: center; margin-top: 20px;">
                <button id="cancel-save-load" style="
                    padding: 10px 20px;
                    background: #ff4444;
                    border: none;
                    color: white;
                    cursor: pointer;
                    border-radius: 5px;
                ">キャンセル</button>
            </div>
        `;
        
        const slotsContainer = container.querySelector('#save-slots');
        
        // セーブスロットを作成
        for (let i = 0; i < this.saveSlots; i++) {
            const slotInfo = this.getSaveSlotInfo(i);
            const slotDiv = document.createElement('div');
            slotDiv.style.cssText = `
                background: rgba(0, 100, 200, 0.2);
                border: 1px solid rgba(0, 255, 255, 0.3);
                border-radius: 5px;
                padding: 15px;
                margin-bottom: 10px;
                cursor: pointer;
                transition: all 0.3s;
            `;
            
            slotDiv.onmouseover = () => {
                slotDiv.style.background = 'rgba(0, 150, 255, 0.3)';
                slotDiv.style.borderColor = '#00ffff';
            };
            
            slotDiv.onmouseout = () => {
                slotDiv.style.background = 'rgba(0, 100, 200, 0.2)';
                slotDiv.style.borderColor = 'rgba(0, 255, 255, 0.3)';
            };
            
            if (slotInfo) {
                slotDiv.innerHTML = `
                    <div style="color: #00ffff; font-weight: bold;">スロット ${i + 1}</div>
                    <div style="color: #ffffff; margin: 5px 0;">${slotInfo.saveName}</div>
                    <div style="color: #aaaaaa; font-size: 0.9em;">
                        クレジット: ${slotInfo.credits.toLocaleString()} | 
                        プレイ時間: ${Math.floor(slotInfo.playTime / 60)}分
                    </div>
                `;
            } else {
                slotDiv.innerHTML = `
                    <div style="color: #00ffff; font-weight: bold;">スロット ${i + 1}</div>
                    <div style="color: #888888;">空きスロット</div>
                `;
            }
            
            slotDiv.onclick = () => {
                if (mode === 'save') {
                    this.saveGame(i);
                } else {
                    this.loadGame(i);
                }
                ui.remove();
            };
            
            slotsContainer.appendChild(slotDiv);
        }
        
        // キャンセルボタン
        container.querySelector('#cancel-save-load').onclick = () => {
            ui.remove();
        };
        
        ui.appendChild(container);
        document.body.appendChild(ui);
        
        // ESCキーで閉じる
        const escHandler = (e) => {
            if (e.key === 'Escape') {
                ui.remove();
                document.removeEventListener('keydown', escHandler);
            }
        };
        document.addEventListener('keydown', escHandler);
    }
}