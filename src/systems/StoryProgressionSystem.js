// ストーリー進行管理システム

export class StoryProgressionSystem {
    constructor(game) {
        this.game = game;
        
        // ストーリー進行状態
        this.progress = {
            chapter: 0,  // 0: プロローグ, 1-4: 各章
            phase: 0,    // 章内のフェーズ
            mainMissionIndex: 0,  // 現在のメインミッション
            
            // ストーリーフラグ
            flags: {
                // 第1章
                gameStarted: false,
                earthEscapeStarted: false,
                earthEscapeCompleted: false,
                tutorialCompleted: false,
                firstStationVisited: false,
                
                // 第2章
                marsReached: false,
                marsColonySaved: false,
                firstBossDefeated: false,
                jupiterStationUnlocked: false,
                voidWeaknessDiscovered: false,
                
                // 第3章
                saturnRingsReached: false,
                raidBossDefeated: false,
                allianceFormed: false,
                starfighterUpgraded: false,
                
                // 第4章
                voidGateDiscovered: false,
                lunaSecretRevealed: false,
                finalBattleReady: false,
                
                // エンディング
                normalEndingAchieved: false,
                goodEndingAchieved: false,
                trueEndingAchieved: false
            },
            
            // アンロック状態
            unlockedAreas: ["earth_orbit"],
            unlockedWeapons: ["pulse_laser"],
            unlockedStations: [],
            unlockedFeatures: ["basic_controls"],
            
            // キャラクター関連
            companionTrustLevel: 0,
            metCharacters: [],
            characterRelationships: {},
            
            // 統計
            totalMissionsCompleted: 0,
            mainMissionsCompleted: 0,
            sideMissionsCompleted: 0,
            secretsFound: 0,
            totalPlayTime: 0
        };
        
        // ストーリーイベント定義
        this.storyEvents = this.defineStoryEvents();
        
        // ミッション定義
        this.missions = this.defineMissions();
        
        // セーブデータの読み込み
        this.loadProgress();
    }
    
    defineStoryEvents() {
        return {
            // ゲーム開始
            gameStart: {
                id: "game_start",
                trigger: () => !this.progress.flags.gameStarted,
                action: () => {
                    this.progress.flags.gameStarted = true;
                    this.progress.chapter = 0;
                    this.progress.phase = 1;
                    
                    // オープニングイベント開始
                    setTimeout(() => {
                        if (this.game.earthEscapeSequence) {
                            this.game.earthEscapeSequence.start();
                        }
                    }, 1000);
                }
            },
            
            // 地球脱出完了
            earthEscapeComplete: {
                id: "earth_escape_complete",
                trigger: () => this.progress.flags.earthEscapeCompleted && !this.progress.flags.tutorialCompleted,
                action: () => {
                    this.progress.chapter = 1;
                    this.progress.phase = 1;
                    
                    // チュートリアル開始
                    this.startTutorial();
                    
                    // 最初のミッション設定
                    this.setCurrentMission("tutorial_combat");
                }
            },
            
            // 火星到達
            marsArrival: {
                id: "mars_arrival",
                trigger: () => {
                    const mars = this.game.planets.find(p => p.name === "Mars");
                    return mars && mars.discovered && !this.progress.flags.marsReached;
                },
                action: () => {
                    this.progress.flags.marsReached = true;
                    this.progress.chapter = 2;
                    this.progress.phase = 1;
                    
                    // 火星イベント
                    this.triggerMarsEvent();
                }
            },
            
            // ボス撃破
            firstBossDefeat: {
                id: "first_boss_defeat",
                trigger: () => this.progress.flags.firstBossDefeated && !this.progress.flags.jupiterStationUnlocked,
                action: () => {
                    this.progress.flags.jupiterStationUnlocked = true;
                    this.unlockArea("jupiter");
                    this.unlockWeapon("plasma_cannon");
                    
                    // 報酬とメッセージ
                    this.game.showNotification("木星ステーションへのアクセスが解放されました！");
                }
            }
        };
    }
    
    defineMissions() {
        return {
            // チュートリアルミッション
            tutorial_combat: {
                id: "tutorial_combat",
                type: "main",
                chapter: 1,
                name: "基礎戦闘訓練",
                description: "ヴォイド・スカウトを3体撃破する",
                objectives: [
                    { type: "defeat_enemies", target: "void_scout", count: 3, current: 0 }
                ],
                rewards: {
                    exp: 100,
                    credits: 1000,
                    items: ["energy_cell"]
                },
                onComplete: () => {
                    this.progress.flags.tutorialCompleted = true;
                    this.unlockWeapon("rapid_fire");
                    this.unlockFeature("weapon_switching");
                }
            },
            
            // 火星救援ミッション
            mars_rescue: {
                id: "mars_rescue",
                type: "main",
                chapter: 2,
                name: "火星コロニー救援",
                description: "生存者を守りながらヴォイドの攻撃を撃退する",
                objectives: [
                    { type: "defend", target: "mars_colony", duration: 180, current: 0 },
                    { type: "defeat_enemies", target: "void", count: 20, current: 0 }
                ],
                rewards: {
                    exp: 500,
                    credits: 5000,
                    items: ["shield_upgrade", "missile_launcher"]
                },
                onComplete: () => {
                    this.progress.flags.marsColonySaved = true;
                    this.unlockCharacter("captain_ray");
                }
            },
            
            // サイドミッション例
            asteroid_mining: {
                id: "asteroid_mining",
                type: "side",
                name: "小惑星採掘護衛",
                description: "採掘船を海賊から守る",
                objectives: [
                    { type: "protect", target: "mining_ship", duration: 120 },
                    { type: "defeat_enemies", target: "pirate", count: 10, current: 0 }
                ],
                rewards: {
                    credits: 3000,
                    items: ["rare_mineral"]
                }
            }
        };
    }
    
    // ストーリー進行チェック
    update(delta) {
        // プレイ時間を更新
        this.progress.totalPlayTime += delta;
        
        // ストーリーイベントのトリガーチェック
        Object.values(this.storyEvents).forEach(event => {
            if (event.trigger()) {
                console.log(`Triggering story event: ${event.id}`);
                event.action();
                this.saveProgress();
            }
        });
        
        // 現在のミッションの進行状況を確認
        if (this.currentMission) {
            this.updateMissionProgress();
        }
    }
    
    // チュートリアル開始
    startTutorial() {
        if (this.game.tutorialSystem) {
            this.game.tutorialSystem.startTutorial('controls');
        }
        
        // ルナのガイダンス
        if (this.game.companionSystem) {
            setTimeout(() => {
                this.game.companionSystem.showMessage(
                    "基本操作を確認しましょう。WASDで移動、マウスで照準、左クリックで射撃です。",
                    5000,
                    'tutorial'
                );
            }, 2000);
        }
    }
    
    // 火星イベント
    triggerMarsEvent() {
        if (this.game.adventureUI) {
            const scene = {
                background: 'bg_mars_surface',
                characters: []
            };
            
            const dialogues = [
                {
                    text: '火星の軌道に到着した。赤い惑星の表面には、かつて繁栄していたコロニーの残骸が見える。'
                },
                {
                    character: 'luna',
                    name: 'ルナ',
                    text: 'パイロット、火星コロニーから微弱な救難信号を検知しました！',
                    sprite: 'luna_surprised'
                },
                {
                    character: 'luna',
                    name: 'ルナ',
                    text: 'まだ生存者がいるかもしれません。急ぎましょう！',
                    sprite: 'luna_urgent'
                }
            ];
            
            this.game.adventureUI.show(scene);
            this.game.adventureUI.showDialogue(dialogues, () => {
                this.game.adventureUI.hide();
                this.setCurrentMission("mars_rescue");
            });
        }
    }
    
    // ミッション管理
    setCurrentMission(missionId) {
        const mission = this.missions[missionId];
        if (!mission) {
            console.error(`Mission not found: ${missionId}`);
            return;
        }
        
        this.currentMission = { ...mission };
        
        // ミッションUIに表示
        if (this.game.missionSystem) {
            this.game.missionSystem.addMission({
                id: mission.id,
                name: mission.name,
                description: mission.description,
                type: mission.type,
                objectives: mission.objectives.map(obj => ({ ...obj }))
            });
        }
        
        // ミッション開始メッセージ
        this.game.showNotification(`新しいミッション: ${mission.name}`);
    }
    
    // ミッション進行更新
    updateMissionProgress() {
        if (!this.currentMission) return;
        
        let allCompleted = true;
        
        this.currentMission.objectives.forEach(objective => {
            if (objective.current < (objective.count || objective.duration)) {
                allCompleted = false;
            }
        });
        
        if (allCompleted) {
            this.completeMission(this.currentMission.id);
        }
    }
    
    // ミッション完了
    completeMission(missionId) {
        const mission = this.missions[missionId];
        if (!mission) return;
        
        // 報酬付与
        if (mission.rewards) {
            if (mission.rewards.exp && this.game.player) {
                this.game.player.addExperience(mission.rewards.exp);
            }
            if (mission.rewards.credits) {
                this.game.addCredits(mission.rewards.credits);
            }
            if (mission.rewards.items) {
                mission.rewards.items.forEach(item => {
                    this.game.addItem(item);
                });
            }
        }
        
        // 完了処理
        if (mission.onComplete) {
            mission.onComplete();
        }
        
        // 統計更新
        this.progress.totalMissionsCompleted++;
        if (mission.type === 'main') {
            this.progress.mainMissionsCompleted++;
            this.progress.mainMissionIndex++;
        } else {
            this.progress.sideMissionsCompleted++;
        }
        
        // UI更新
        this.game.showNotification(`ミッション完了: ${mission.name}`);
        
        // 次のミッションチェック
        this.checkNextMission();
        
        this.currentMission = null;
        this.saveProgress();
    }
    
    // 次のミッション確認
    checkNextMission() {
        // チャプターとフェーズに基づいて次のミッションを決定
        const chapter = this.progress.chapter;
        const phase = this.progress.phase;
        
        // ストーリー進行に応じた次のミッション
        if (chapter === 1 && phase === 1 && this.progress.flags.tutorialCompleted) {
            this.progress.phase = 2;
            // 次のミッションを設定
        }
    }
    
    // エリア解放
    unlockArea(areaId) {
        if (!this.progress.unlockedAreas.includes(areaId)) {
            this.progress.unlockedAreas.push(areaId);
            console.log(`Area unlocked: ${areaId}`);
            
            // ワープシステムに通知
            if (this.game.warpSystem) {
                this.game.warpSystem.unlockDestination(areaId);
            }
        }
    }
    
    // 武器解放
    unlockWeapon(weaponId) {
        if (!this.progress.unlockedWeapons.includes(weaponId)) {
            this.progress.unlockedWeapons.push(weaponId);
            console.log(`Weapon unlocked: ${weaponId}`);
            
            // 武器インベントリに通知
            if (this.game.weaponInventory) {
                this.game.weaponInventory.unlockWeapon(weaponId);
            }
        }
    }
    
    // 機能解放
    unlockFeature(featureId) {
        if (!this.progress.unlockedFeatures.includes(featureId)) {
            this.progress.unlockedFeatures.push(featureId);
            console.log(`Feature unlocked: ${featureId}`);
        }
    }
    
    // キャラクター解放
    unlockCharacter(characterId) {
        if (!this.progress.metCharacters.includes(characterId)) {
            this.progress.metCharacters.push(characterId);
            this.progress.characterRelationships[characterId] = 0;
            console.log(`Character unlocked: ${characterId}`);
        }
    }
    
    // 関係値更新
    updateRelationship(characterId, change) {
        if (this.progress.characterRelationships[characterId] !== undefined) {
            this.progress.characterRelationships[characterId] += change;
            console.log(`${characterId} relationship: ${this.progress.characterRelationships[characterId]}`);
        }
    }
    
    // チャプター取得
    getCurrentChapter() {
        const chapters = ["プロローグ", "第1章", "第2章", "第3章", "第4章", "エピローグ"];
        return chapters[this.progress.chapter] || "不明";
    }
    
    // 進行度パーセンテージ
    getProgressPercentage() {
        const totalMainMissions = Object.values(this.missions).filter(m => m.type === 'main').length;
        return Math.floor((this.progress.mainMissionsCompleted / totalMainMissions) * 100);
    }
    
    // セーブ
    saveProgress() {
        const saveData = {
            version: "1.0",
            timestamp: Date.now(),
            progress: this.progress
        };
        
        localStorage.setItem('storyProgress', JSON.stringify(saveData));
        console.log('Story progress saved');
    }
    
    // ロード
    loadProgress() {
        const savedData = localStorage.getItem('storyProgress');
        if (savedData) {
            try {
                const data = JSON.parse(savedData);
                if (data.version === "1.0") {
                    this.progress = data.progress;
                    console.log('Story progress loaded');
                }
            } catch (e) {
                console.error('Failed to load story progress:', e);
            }
        }
    }
    
    // リセット
    resetProgress() {
        this.progress = {
            chapter: 0,
            phase: 0,
            mainMissionIndex: 0,
            flags: {},
            unlockedAreas: ["earth_orbit"],
            unlockedWeapons: ["pulse_laser"],
            unlockedStations: [],
            unlockedFeatures: ["basic_controls"],
            companionTrustLevel: 0,
            metCharacters: [],
            characterRelationships: {},
            totalMissionsCompleted: 0,
            mainMissionsCompleted: 0,
            sideMissionsCompleted: 0,
            secretsFound: 0,
            totalPlayTime: 0
        };
        
        localStorage.removeItem('storyProgress');
        console.log('Story progress reset');
    }
}