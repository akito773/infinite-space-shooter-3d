import * as THREE from 'three';
import { PlayerShip } from './entities/PlayerShip.js';
import { EnemyShip } from './entities/EnemyShip.js';
import { Planet } from './entities/Planet.js';
import { SpaceStation } from './entities/SpaceStation.js';
import { Item3D } from './entities/Item3D.js';
import { AsteroidField } from './entities/AsteroidField.js';
import { StarField } from './environment/StarField.js';
import { InputManager } from './systems/InputManager.js';
import { ProjectileManager } from './systems/ProjectileManager.js';
import { Minimap } from './systems/Minimap.js';
import { LandingSystem } from './systems/LandingSystem.js';
import { WarpSystem } from './systems/WarpSystem.js';
import { MissionSystem } from './systems/MissionSystem.js';
import { SoundManager } from './systems/SoundManager.js';
import { WaveManager } from './systems/WaveManager.js';
import { InventorySystem } from './systems/InventorySystem.js';
import { ShopSystem } from './systems/ShopSystem.js';
import { StorySystem } from './systems/StorySystem.js';
import { MiningSystem } from './systems/MiningSystem.js';
import { SkillSystem } from './systems/SkillSystem.js';
import { ZoneManager } from './systems/ZoneManager.js';
import { ExplorationEventSystem } from './systems/ExplorationEventSystem.js';
import { RaidBattleSystem } from './systems/RaidBattleSystem.js';
import { PlanetDiscoverySystem } from './systems/PlanetDiscoverySystem.js';
import { TutorialSystem } from './systems/TutorialSystem.js';
import { InventoryUI } from './systems/InventoryUI.js';
import { GameGuide } from './systems/GameGuide.js';
import { SaveSystem } from './systems/SaveSystem.js';
import { SkillTreeSystem } from './systems/SkillTreeSystem.js';
import { AdvancedMissionSystem } from './systems/AdvancedMissionSystem.js';
import { PerformanceOptimizer } from './systems/PerformanceOptimizer.js';
import { WarpGate } from './objects/WarpGate.js';
import { TargetingSystem } from './systems/TargetingSystem.js';
import { WeaponSystem } from './systems/WeaponSystem.js';
import { PredictiveAiming } from './systems/PredictiveAiming.js';
import { DamageNumbers } from './systems/DamageNumbers.js';
import { HitMarkers } from './systems/HitMarkers.js';
import { ZoomSystem } from './systems/ZoomSystem.js';
import { BossSpawnSystem } from './systems/BossSpawnSystem.js';
import { StoryProgressionSystem } from './systems/StoryProgressionSystem.js';
import { CompanionSystem } from './systems/CompanionSystem.js';
import { TavernScene } from './systems/TavernScene.js';
import { GalaxyMap } from './systems/GalaxyMap.js';
import { VoiceSystem } from './systems/VoiceSystem.js';
import { StoryDialogueSystem } from './systems/StoryDialogueSystem.js';
import { StoryEventTrigger } from './systems/StoryEventTrigger.js';
import { StoryObjectivesUI } from './systems/StoryObjectivesUI.js';
import { CompanionInteractions } from './systems/CompanionInteractions.js';
import { AchievementSystem } from './systems/AchievementSystem.js';
import { EarthEscapeSequence } from './systems/EarthEscapeSequence.js';

export class Game {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.player = null;
        this.enemies = [];
        this.planets = [];
        this.stations = []; // spaceStationsからstationsに変更
        this.items = [];
        this.asteroidFields = [];
        this.score = 0;
        this.combo = 0;
        this.comboTimer = 0;
        this.highScore = localStorage.getItem('highScore') || 0;
        this.clock = new THREE.Clock();
        
        // マネージャー
        this.inputManager = null;
        this.projectileManager = null;
        this.minimap = null;
        this.landingSystem = null;
        this.warpSystem = null;
        this.missionSystem = null;
        this.soundManager = null;
        this.waveManager = null;
        this.inventorySystem = null;
        this.shopSystem = null;
        this.storySystem = null;
        this.miningSystem = null;
        this.skillSystem = null;
        this.zoneManager = null;
        this.explorationEventSystem = null;
        this.raidBattleSystem = null;
        this.planetDiscoverySystem = null;
        this.tutorialSystem = null;
        this.gameGuide = null;
        this.saveSystem = null;
        this.skillTreeSystem = null;
        this.performanceOptimizer = null;
        this.targetingSystem = null;
        this.weaponSystem = null;
        this.isPaused = false;
        
        // システム共有のためのプロパティ
        this.Planet = Planet;
        this.SpaceStation = SpaceStation;
        this.AsteroidField = AsteroidField;
        this.lastCombatTime = 0;
        this.debugMode = false;
        
        // 統計情報
        this.statistics = {
            enemiesKilled: 0,
            creditsEarned: 0,
            totalShots: 0,
            totalHits: 0,
            planetsVisited: 0,
            itemsCollected: 0,
            startTime: Date.now()
        };
        
        // ゲーム状態管理
        this.isPaused = false;
        this.ownedPlanets = new Set();
    }

    init() {
        // シーン作成
        this.scene = new THREE.Scene();
        this.scene.fog = new THREE.Fog(0x000033, 100, 2000);

        // カメラ設定
        this.camera = new THREE.PerspectiveCamera(
            75,
            window.innerWidth / window.innerHeight,
            0.1,
            10000
        );
        this.camera.position.set(0, 10, 30);
        this.camera.lookAt(0, 0, 0);

        // レンダラー設定
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        document.getElementById('game-container').appendChild(this.renderer.domElement);

        // ライティング
        this.setupLighting();

        // 環境
        this.starField = new StarField(this.scene);

        // 入力管理
        this.inputManager = new InputManager(this.camera);

        // 弾丸管理
        this.projectileManager = new ProjectileManager(this.scene);

        // プレイヤー作成
        this.player = new PlayerShip(this.scene);
        this.player.group.position.set(0, 0, 0);
        
        // ゾーンマネージャー初期化
        this.zoneManager = new ZoneManager(this);
        
        // WarpGateクラスをグローバルに登録
        window.WarpGate = WarpGate;
        
        // ミニマップ初期化
        this.minimap = new Minimap();
        
        // 銀河マップ初期化
        this.galaxyMap = new GalaxyMap(this);
        
        // ストーリーダイアログシステム初期化
        this.storyDialogue = new StoryDialogueSystem(this);
        
        // ストーリーイベントトリガー初期化
        this.storyEventTrigger = new StoryEventTrigger(this);
        
        // ストーリー目標UI初期化
        this.storyObjectivesUI = new StoryObjectivesUI(this);
        
        // 着陸システム初期化
        this.landingSystem = new LandingSystem(this.scene);
        this.landingSystem.setGame(this);
        
        // ワープシステム初期化
        this.warpSystem = new WarpSystem(this.scene, this.player);
        
        // ミッションシステム初期化（拡張版）
        this.missionSystem = new AdvancedMissionSystem(this);
        
        // サウンドマネージャー初期化
        console.log('Game: SoundManager初期化前');
        this.soundManager = new SoundManager();
        console.log('Game: SoundManager初期化後', this.soundManager);
        
        // メインBGMを開始（ユーザー操作後に自動再生）
        document.addEventListener('click', () => {
            console.log('クリックイベント検出 - BGM開始を試みます');
            if (this.soundManager && !this.soundManager.currentBGM) {
                console.log('メインBGMを再生します');
                this.soundManager.playMainBGM();
            }
        }, { once: true });
        
        // インベントリシステム初期化（UIより先に初期化）
        this.inventorySystem = new InventorySystem();
        
        // ショップシステム初期化
        this.shopSystem = new ShopSystem(this, this.inventorySystem);
        
        // スキルシステム初期化
        this.skillSystem = new SkillSystem(this);
        
        // 採掘システム初期化
        this.miningSystem = new MiningSystem(this);
        
        // ストーリーシステム初期化
        this.storySystem = new StorySystem(this);
        
        // ウェーブマネージャー初期化
        this.waveManager = new WaveManager(this);
        
        // 探索イベントシステム初期化
        this.explorationEventSystem = new ExplorationEventSystem(this);
        
        // レイドバトルシステム初期化
        this.raidBattleSystem = new RaidBattleSystem(this);
        
        // 新惑星発見システム初期化
        this.planetDiscoverySystem = new PlanetDiscoverySystem(this);
        
        // チュートリアルシステム初期化
        this.tutorialSystem = new TutorialSystem(this);
        
        // UI初期化（インベントリシステムの後）
        this.initUI();
        
        // インベントリUI初期化
        this.inventoryUI = new InventoryUI(this);
        
        // ゲームガイド初期化
        this.gameGuide = new GameGuide(this);
        
        // セーブシステム初期化
        this.saveSystem = new SaveSystem(this);
        
        // スキルツリーシステム初期化
        this.skillTreeSystem = new SkillTreeSystem(this);
        
        // パフォーマンス最適化システム初期化
        this.performanceOptimizer = new PerformanceOptimizer(this);
        
        // ターゲティングシステム初期化
        this.targetingSystem = new TargetingSystem(this);
        
        // 武器システム初期化
        this.weaponSystem = new WeaponSystem(this);
        
        // 新しい戦闘システムの初期化
        this.predictiveAiming = new PredictiveAiming(this.scene, this.camera);
        this.damageNumbers = new DamageNumbers(this.scene, this.camera);
        this.hitMarkers = new HitMarkers(this.scene, this.camera);
        this.zoomSystem = new ZoomSystem(this.camera, this.player);
        
        // ボススポーンシステム初期化
        this.bossSpawnSystem = new BossSpawnSystem(this);
        
        // ストーリー進行システム初期化
        this.storySystem = new StoryProgressionSystem(this);
        
        // ボイスシステム初期化
        this.voiceSystem = new VoiceSystem(this);
        
        // 相棒システム初期化
        this.companionSystem = new CompanionSystem(this);
        
        // コンパニオンインタラクション初期化
        this.companionInteractions = new CompanionInteractions(this);
        
        // 実績システム初期化
        this.achievementSystem = new AchievementSystem(this);
        
        // 地球脱出シーケンス初期化
        this.earthEscapeSequence = new EarthEscapeSequence(this);
        
        // 惑星発見システム初期化（Planetクラスを渡す）
        this.Planet = Planet;
        this.planetDiscoverySystem = new PlanetDiscoverySystem(this);
        
        // 酒場シーン初期化
        this.tavernScene = new TavernScene(this);
        
        // ルナのボイスをプリロード
        this.voiceSystem.preloadCharacterVoices('luna').then(() => {
            console.log('Luna voices loaded successfully! CV: 日向ここあ');
            // ルナとの通信はストーリーイベントで有効化される
        });
        
        // sceneにgame参照を追加（アイテム用）
        this.scene.userData.game = this;
        
        // ゾーンマネージャーを初期化
        this.zoneManager.init();
        
        // 地球脱出シーケンスを開始（初回プレイ時）
        const hasSeenEscapeSequence = localStorage.getItem('hasSeenEscapeSequence');
        if (!hasSeenEscapeSequence) {
            this.earthEscapeSequence.start();
            localStorage.setItem('hasSeenEscapeSequence', 'true');
        } else {
            // 通常のウェーブシステムを開始（3秒後）
            setTimeout(() => {
                if (this.waveManager) {
                    this.waveManager.startNextWave();
                }
            }, 3000);
        }
        
        // 初回起動時のストーリー開始
        const hasSeenIntro = localStorage.getItem('hasSeenIntro');
        if (!hasSeenIntro) {
            setTimeout(() => {
                this.storyDialogue.startDialogue('intro_1', () => {
                    // イントロ完了後、信号受信イベント
                    setTimeout(() => {
                        this.storyDialogue.startDialogue('intro_signal');
                        // 初期目標を設定
                        this.storyObjectivesUI.setObjective('intro');
                    }, 5000);
                });
                localStorage.setItem('hasSeenIntro', 'true');
            }, 1000);
        } else {
            // 既にイントロを見ている場合、現在のフェーズに応じた目標を設定
            if (this.storySystem && this.storySystem.storyFlags.hasMetLuna) {
                if (this.storySystem.storyFlags.darkNebulaEncountered) {
                    this.storyObjectivesUI.setObjective('dark_nebula_encounter');
                } else if (this.storySystem.storyFlags.marsUnlocked) {
                    this.storyObjectivesUI.setObjective('mars_investigation');
                } else {
                    this.storyObjectivesUI.setObjective('luna_meeting');
                }
            } else {
                this.storyObjectivesUI.setObjective('intro');
            }
        }
        
        // Gameインスタンスをグローバルに登録（他のシステムから参照可能に）
        window.game = this;
        
        // EnemyShipクラスをグローバルに登録
        window.EnemyShip = EnemyShip;
    }

    setupLighting() {
        // 環境光
        const ambientLight = new THREE.AmbientLight(0x404040, 1.5);
        this.scene.add(ambientLight);

        // 方向光
        const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
        directionalLight.position.set(50, 100, 50);
        directionalLight.castShadow = true;
        directionalLight.shadow.camera.left = -100;
        directionalLight.shadow.camera.right = 100;
        directionalLight.shadow.camera.top = 100;
        directionalLight.shadow.camera.bottom = -100;
        this.scene.add(directionalLight);

        // ポイントライト（エンジン光）
        const engineLight = new THREE.PointLight(0x00ffff, 2, 50);
        engineLight.position.set(0, 0, 0);
        this.scene.add(engineLight);
    }

    createSpaceObjects() {
        // 惑星を配置
        const planet1 = new Planet(this.scene, new THREE.Vector3(200, 0, -300), {
            radius: 30,
            color: 0x0066ff,
            name: '地球',
            hasAtmosphere: true,
            hasRings: false
        });
        this.planets.push(planet1);
        
        const planet2 = new Planet(this.scene, new THREE.Vector3(-400, 50, 200), {
            radius: 40,
            color: 0xff6600,
            name: '火星',
            hasAtmosphere: false,
            hasRings: true,
            locked: true, // 初期状態ではロック
            unlockMessage: '火星への航路データが必要です'
        });
        this.planets.push(planet2);
        // 火星への参照を保持
        this.marsPlanet = planet2;
        
        const planet3 = new Planet(this.scene, new THREE.Vector3(300, -30, 400), {
            radius: 25,
            color: 0x00ff00,
            name: 'エメラルド',
            hasAtmosphere: true,
            hasRings: false
        });
        this.planets.push(planet3);
        
        // 宇宙ステーションを配置
        const station1 = new SpaceStation(this.scene, new THREE.Vector3(-200, 20, -200), {
            name: '交易ステーション'
        });
        this.stations.push(station1);
        
        const station2 = new SpaceStation(this.scene, new THREE.Vector3(100, -40, 300), {
            name: '研究ステーション'
        });
        this.stations.push(station2);
        
        // 小惑星帯を配置
        const asteroidField1 = new AsteroidField(this.scene, new THREE.Vector3(-300, 0, 100), {
            radius: 120,
            density: 0.7
        });
        this.asteroidFields.push(asteroidField1);
        
        const asteroidField2 = new AsteroidField(this.scene, new THREE.Vector3(400, 20, -200), {
            radius: 80,
            density: 0.5
        });
        this.asteroidFields.push(asteroidField2);
    }
    
    spawnEnemies() {
        // 敵の最大数を制限
        const maxEnemies = 8;
        const spawnCount = Math.min(3, maxEnemies - this.enemies.length);
        
        // ランダムな位置に敵を配置
        for (let i = 0; i < spawnCount; i++) {
            const angle = Math.random() * Math.PI * 2;
            const radius = 80 + Math.random() * 50;
            const x = Math.cos(angle) * radius;
            const z = Math.sin(angle) * radius;
            
            const enemy = new EnemyShip(this.scene);
            enemy.group.position.set(x, Math.random() * 20 - 10, z);
            enemy.target = this.player.group;
            
            // 敵のタイプをランダムに設定
            const enemyType = Math.random();
            if (enemyType < 0.6) {
                // 通常の敵（60%）
                enemy.speed = 30;
                enemy.health = 50;
                enemy.scoreValue = 100;
            } else if (enemyType < 0.9) {
                // 速い敵（30%）
                enemy.speed = 50;
                enemy.health = 30;
                enemy.scoreValue = 150;
                // 色を変更
                if (enemy.bodyMesh) {
                    enemy.bodyMesh.material.color = new THREE.Color(0xff8800);
                }
            } else {
                // 強い敵（10%）
                enemy.speed = 20;
                enemy.health = 100;
                enemy.scoreValue = 300;
                // 大きく、色を変更
                enemy.group.scale.setScalar(1.5);
                if (enemy.bodyMesh) {
                    enemy.bodyMesh.material.color = new THREE.Color(0xff0088);
                }
            }
            
            this.enemies.push(enemy);
        }
    }

    initUI() {
        // スコア表示などのUI初期化
        this.updateScore(0);
        document.getElementById('high-score').textContent = this.highScore;
        
        // クレジット表示の更新
        this.inventorySystem.onCreditsChange = () => {
            document.getElementById('credits').textContent = this.inventorySystem.credits.toLocaleString();
        };
        document.getElementById('credits').textContent = this.inventorySystem.credits.toLocaleString();
    }

    updateScore(points) {
        // コンボボーナスを適用
        const comboMultiplier = Math.max(1, this.combo * 0.5);
        const finalPoints = Math.floor(points * comboMultiplier);
        
        this.score += finalPoints;
        document.getElementById('score').textContent = this.score;
        
        // コンボを増加
        this.combo++;
        this.comboTimer = 3; // 3秒間コンボ継続
        this.updateComboDisplay();
        
        // ハイスコア更新
        if (this.score > this.highScore) {
            this.highScore = this.score;
            localStorage.setItem('highScore', this.highScore);
            document.getElementById('high-score').textContent = this.highScore;
        }
    }
    
    showMessage(message, duration = 3000) {
        // メッセージ表示機能
        const messageDiv = document.createElement('div');
        messageDiv.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 20px;
            border: 2px solid #00ffff;
            border-radius: 10px;
            font-size: 18px;
            z-index: 1000;
            text-align: center;
        `;
        messageDiv.textContent = message;
        document.body.appendChild(messageDiv);
        
        setTimeout(() => {
            messageDiv.remove();
        }, duration);
    }
    
    updateComboDisplay() {
        const comboElement = document.getElementById('combo');
        const comboValue = document.getElementById('combo-value');
        
        if (this.combo > 1) {
            comboElement.classList.add('active');
            comboValue.textContent = this.combo;
            
            // コンボが高いときの色変更
            if (this.combo >= 10) {
                comboElement.style.color = '#ff00ff';
            } else if (this.combo >= 5) {
                comboElement.style.color = '#ffaa00';
            } else {
                comboElement.style.color = '#ffff00';
            }
        } else {
            comboElement.classList.remove('active');
        }
    }

    updateHealth(health, maxHealth) {
        const percentage = (health / maxHealth) * 100;
        document.getElementById('health-fill').style.width = percentage + '%';
        
        // 体力に応じて色を変更
        const healthFill = document.getElementById('health-fill');
        if (percentage > 50) {
            healthFill.style.backgroundColor = '#00ff00';
        } else if (percentage > 25) {
            healthFill.style.backgroundColor = '#ffff00';
        } else {
            healthFill.style.backgroundColor = '#ff0000';
        }
    }
    
    showCollectMessage(message) {
        // 既存のメッセージを削除
        const existingMessage = document.querySelector('.collect-message');
        if (existingMessage) {
            existingMessage.remove();
        }
        
        // 新しいメッセージを表示
        const messageElement = document.createElement('div');
        messageElement.className = 'collect-message';
        messageElement.textContent = message;
        document.getElementById('ui-overlay').appendChild(messageElement);
        
        // アニメーション後に削除
        setTimeout(() => {
            messageElement.remove();
        }, 1500);
    }

    start() {
        this.animate();
    }

    animate() {
        requestAnimationFrame(() => this.animate());

        const delta = this.clock.getDelta();
        
        // ポーズ中は更新をスキップ
        if (this.isPaused) {
            this.renderer.render(this.scene, this.camera);
            return;
        }
        
        // コンボタイマーを更新
        if (this.comboTimer > 0) {
            this.comboTimer -= delta;
            if (this.comboTimer <= 0) {
                this.combo = 0;
                this.updateComboDisplay();
            }
        }

        // 入力更新
        this.inputManager.update();

        // プレイヤー更新
        if (this.player) {
            this.player.update(delta, this.inputManager);
            
            // カメラ追従
            const cameraOffset = new THREE.Vector3(0, 20, 40); // カメラをより高く、遠くに
            cameraOffset.applyQuaternion(this.player.group.quaternion);
            const targetPosition = this.player.group.position.clone().add(cameraOffset);
            
            // より滑らかな追従
            this.camera.position.lerp(targetPosition, 0.15);
            
            // カメラの注視点を少し前方に
            const lookAtOffset = new THREE.Vector3(0, 0, -10);
            lookAtOffset.applyQuaternion(this.player.group.quaternion);
            const lookAtTarget = this.player.group.position.clone().add(lookAtOffset);
            this.camera.lookAt(lookAtTarget);

            // 射撃処理
            if (this.inputManager.isShooting) {
                const projectile = this.weaponSystem.firePrimary();
                if (projectile) {
                    if (Array.isArray(projectile)) {
                        // 複数発射の場合
                        projectile.forEach(p => {
                            this.projectileManager.addProjectile(p, 'player');
                        });
                    } else {
                        this.projectileManager.addProjectile(projectile, 'player');
                    }
                    this.soundManager.play('shoot');
                    
                    // 統計情報更新
                    this.statistics.totalShots++;
                }
            }

            // HP更新
            this.updateHealth(this.player.health, this.player.maxHealth);
            
            // ブースト時間をミッションシステムに通知
            if (this.missionSystem && this.inputManager.keys.shift) {
                this.missionSystem.updateProgress('boost_time', { boosting: true, delta: delta });
            }
        }

        // 惑星の更新
        this.planets.forEach(planet => {
            planet.update(delta, this.camera);
            
            // 自動発見を無効化 - スキャンで発見するように変更
            // 惑星の近くにいることだけをチェック（UI表示用）
            if (this.player && planet.mesh.position.distanceTo(this.player.group.position) < 500) {
                planet.isNearby = true;
            } else {
                planet.isNearby = false;
            }
        });
        
        // ステーションの更新
        this.stations.forEach(station => {
            station.update(delta, this.camera);
            
            // ステーションの発見チェック
            if (this.player && station.group.position.distanceTo(this.player.group.position) < 150) {
                this.warpSystem.discoverLocation(station);
                // 銀河マップにも通知（ステーションは銀河マップには表示しない）
            }
        });
        
        // 着陸システムの更新
        if (this.landingSystem && this.player) {
            this.landingSystem.checkLandingProximity(this.player, this.planets, this.stations);
        }
        
        // 小惑星帯の更新
        this.asteroidFields.forEach(field => {
            field.update(delta, this.player.group.position, this.projectileManager.projectiles, this.camera);
            
            // 小惑星帯への接近警告
            if (field.checkProximity(this.player.group.position)) {
                // TODO: 警告UIを表示
            }
        });
        
        // 小惑星からのアイテムドロップ処理
        if (this.scene.userData.pendingDrops) {
            this.scene.userData.pendingDrops.forEach(position => {
                const item = new Item3D(this.scene, position);
                this.items.push(item);
            });
            this.scene.userData.pendingDrops = [];
        }
        
        // アイテムの更新
        this.items = this.items.filter(item => {
            if (item.collected) return false;
            
            item.update(delta);
            
            // プレイヤーとの接触判定
            if (item.checkProximity(this.player.group.position)) {
                const result = item.collect(this.player);
                if (result) {
                    if (result.type === 'score') {
                        this.updateScore(result.value);
                    }
                    // 収集メッセージを表示
                    this.showCollectMessage(result.message);
                    // サウンド再生
                    if (result.type === 'powerup') {
                        this.soundManager.play('powerup');
                    } else {
                        this.soundManager.play('collect');
                    }
                    // ルナに通知
                    if (this.companionSystem) {
                        this.companionSystem.onItemPickup(result.type);
                    }
                    // 統計情報更新
                    this.statistics.itemsCollected++;
                }
                // HP更新
                this.updateHealth(this.player.health, this.player.maxHealth);
                
                // ミッションシステムに通知
                if (this.missionSystem) {
                    this.missionSystem.updateProgress('collect_item', {});
                    
                    // クレジット獲得ミッションも更新
                    if (result.type === 'credits') {
                        this.missionSystem.updateProgress('earn_credits', { amount: result.value });
                    }
                }
                
                return false;
            }
            
            return true;
        });
        
        // 敵の更新
        this.enemies = this.enemies.filter(enemy => {
            if (!enemy.isAlive) {
                const scoreValue = enemy.scoreValue || 100;
                this.updateScore(scoreValue);
                this.soundManager.play('explosion');
                
                // クレジット獲得（スコアの50%に増加）
                const credits = Math.floor(scoreValue * 0.5);
                this.inventorySystem.addCredits(credits);
                
                // 統計情報更新
                this.statistics.enemiesKilled++;
                this.statistics.creditsEarned += credits;
                
                // ストーリー目標の更新
                if (this.storyObjectivesUI) {
                    this.storyObjectivesUI.onEnemyDefeated();
                }
                
                // 経験値獲得
                if (this.skillTreeSystem) {
                    const expReward = this.skillTreeSystem.getExperienceReward('enemy_kill', {
                        enemyType: enemy.enemyType || 'normal'
                    });
                    this.skillTreeSystem.gainExperience(expReward, '敵撃破');
                }
                
                // 獲得メッセージを表示
                this.showCollectMessage(`+${credits} Credits`);
                
                // ミッションシステムに通知
                if (this.missionSystem) {
                    this.missionSystem.updateProgress('destroy_enemy', {
                        enemyType: enemy.enemyType || 'normal'
                    });
                }
                
                // ウェーブマネージャーに通知
                this.waveManager.onEnemyKilled();
                
                // アイテムドロップ（50%の確率）
                if (Math.random() < 0.5) {
                    const item = new Item3D(this.scene, enemy.group.position.clone());
                    this.items.push(item);
                }
                
                enemy.destroy();
                return false;
            }
            
            enemy.update(delta, this.camera);
            
            // 敵の射撃
            const projectile = enemy.shoot();
            if (projectile) {
                this.projectileManager.addProjectile(projectile, 'enemy');
            }
            
            return true;
        });

        // ウェーブマネージャーが敵の生成を管理するため、ここでは何もしない

        // 弾丸更新と衝突判定
        this.projectileManager.update(delta);
        this.checkCollisions();

        // 星空回転
        this.starField.update(delta);
        
        // ミニマップ更新
        if (this.minimap && this.player) {
            // 初心者ミッションのターゲットを取得
            let missionTarget = null;
            if (this.missionSystem && this.missionSystem.activeMissions.length > 0) {
                const firstMission = this.missionSystem.activeMissions[0];
                if (firstMission.id === 'first_station' && this.stations.length > 0) {
                    missionTarget = { type: 'station', object: this.stations[0] };
                }
            }
            
            this.minimap.update(
                this.player,
                this.enemies,
                this.planets,
                this.stations,
                this.items,
                this.asteroidFields,
                missionTarget
            );
        }
        
        // 戦闘状態の検出
        let enemiesNearby = false;
        this.enemies.forEach(enemy => {
            if (enemy.isAlive) {
                const distance = enemy.group.position.distanceTo(this.player.group.position);
                if (distance < 150) {
                    enemiesNearby = true;
                }
            }
        });
        
        // 戦闘開始/終了の検出
        if (enemiesNearby && !this.inCombat) {
            this.inCombat = true;
            if (this.companionSystem && this.companionSystem.isActive) {
                this.companionSystem.onCombatStart();
            }
        } else if (!enemiesNearby && this.inCombat) {
            this.inCombat = false;
        }
        
        // 採掘システム更新
        if (this.miningSystem) {
            this.miningSystem.updateMining(delta);
        }
        
        // スキルシステム更新
        if (this.skillSystem) {
            this.skillSystem.update(delta);
        }
        
        // ゾーンマネージャー更新
        if (this.zoneManager) {
            this.zoneManager.update(delta);
        }
        
        // 探索イベントシステム更新
        if (this.explorationEventSystem) {
            this.explorationEventSystem.update(delta);
        }
        
        // レイドバトルシステム更新
        if (this.raidBattleSystem) {
            this.raidBattleSystem.update(delta);
        }
        
        // 新惑星発見システム更新
        if (this.planetDiscoverySystem) {
            this.planetDiscoverySystem.update?.(delta);
        }
        
        // チュートリアルシステム更新
        if (this.tutorialSystem) {
            this.tutorialSystem.update(delta);
        }
        
        // ターゲティングシステム更新
        if (this.targetingSystem) {
            this.targetingSystem.update(delta);
        }
        
        // 武器システム更新
        if (this.weaponSystem) {
            this.weaponSystem.update(delta);
        }
        
        // 新しい戦闘システムの更新
        if (this.predictiveAiming) {
            this.predictiveAiming.update(this.enemies, this.player, this.weaponSystem.currentWeapon);
        }
        
        if (this.damageNumbers) {
            this.damageNumbers.update(delta);
        }
        
        if (this.hitMarkers) {
            this.hitMarkers.update(delta);
        }
        
        if (this.zoomSystem) {
            this.zoomSystem.update(delta);
        }
        
        // ボススポーンシステム更新
        if (this.bossSpawnSystem) {
            this.bossSpawnSystem.update(delta);
        }
        
        // ストーリー進行システム更新
        if (this.storySystem) {
            this.storySystem.update(delta);
        }
        
        // 相棒システム更新
        if (this.companionSystem) {
            this.companionSystem.update(delta);
        }
        
        // ストーリーイベントトリガー更新
        if (this.storyEventTrigger) {
            this.storyEventTrigger.update(delta);
        }
        
        // コンパニオンインタラクション更新
        if (this.companionInteractions) {
            this.companionInteractions.update(delta);
        }
        
        // 実績システム更新
        if (this.achievementSystem) {
            this.achievementSystem.update(delta);
        }

        // レンダリング
        this.renderer.render(this.scene, this.camera);
    }

    checkCollisions() {
        // プレイヤー弾と敵の衝突
        this.projectileManager.projectiles.forEach(proj => {
            if (proj.type === 'player') {
                this.enemies.forEach(enemy => {
                    if (enemy.isAlive && proj.mesh.position.distanceTo(enemy.group.position) < 5) {
                        // ダメージ倍率適用
                        const damage = proj.damage * (this.player.damageMultiplier || 1);
                        
                        // ダメージ表示
                        if (this.damageNumbers) {
                            const result = this.damageNumbers.showDamage(
                                enemy.group.position.clone().add(new THREE.Vector3(0, 5, 0)),
                                damage,
                                0.15 // クリティカル率15%
                            );
                            enemy.takeDamage(result.damage);
                        } else {
                            enemy.takeDamage(damage);
                        }
                        
                        // ヒットマーカー表示
                        if (this.hitMarkers) {
                            const hitType = enemy.health <= 0 ? 'kill' : 
                                          (Math.random() < 0.15 ? 'critical' : 'normal');
                            this.hitMarkers.spawn(proj.mesh.position.clone(), hitType);
                        }
                        
                        proj.destroy();
                        
                        // 統計情報更新（命中）
                        this.statistics.totalHits++;
                    }
                });
                
                // ボスとの衝突判定
                if (this.bossSpawnSystem && this.bossSpawnSystem.currentBoss) {
                    const boss = this.bossSpawnSystem.currentBoss;
                    if (boss.isAlive) {
                        // ボスの当たり判定ボックス
                        const bossBox = boss.getBoundingBox();
                        const projSphere = new THREE.Sphere(proj.mesh.position, 1);
                        
                        if (bossBox.intersectsSphere(projSphere)) {
                            // 部位判定
                            const hitPart = boss.checkPartHit(proj.mesh.position);
                            const damage = proj.damage * (this.player.damageMultiplier || 1);
                            
                            // ダメージ表示
                            if (this.damageNumbers) {
                                const result = this.damageNumbers.showDamage(
                                    proj.mesh.position.clone().add(new THREE.Vector3(0, 5, 0)),
                                    damage,
                                    0.2 // ボスへのクリティカル率20%
                                );
                                boss.takeDamage(result.damage, hitPart);
                            } else {
                                boss.takeDamage(damage, hitPart);
                            }
                            
                            // ヒットマーカー表示
                            if (this.hitMarkers) {
                                const hitType = hitPart ? 'critical' : 'normal';
                                this.hitMarkers.spawn(proj.mesh.position.clone(), hitType);
                            }
                            
                            proj.destroy();
                            this.statistics.totalHits++;
                        }
                    }
                }
            }
            // 敵弾とプレイヤーの衝突（ボス弾含む）
            else if ((proj.type === 'enemy' || proj.type === 'boss') && this.player) {
                if (proj.mesh.position.distanceTo(this.player.group.position) < 3) {
                    this.player.takeDamage(proj.damage);
                    this.soundManager.play('damage');
                    proj.destroy();
                }
            }
        });
    }

    handleResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }
    
    // 火星解放処理
    onMarsUnlocked() {
        console.log('Mars unlocked!');
        
        // 火星のロックを解除
        if (this.marsPlanet) {
            this.marsPlanet.locked = false;
            this.marsPlanet.unlockMessage = null;
            
            // ビジュアルエフェクト
            this.marsPlanet.showUnlockEffect();
        }
        
        // UI通知
        this.showNotification('火星への航路が解放されました！', 'success');
        
        // ミッション追加（もしミッションシステムがあれば）
        if (this.missionSystem) {
            this.missionSystem.addMission({
                id: 'mars_investigation',
                name: '火星調査',
                description: '火星の古代遺跡を調査し、ヴォイドの秘密を解き明かせ',
                type: 'main',
                rewards: {
                    credits: 50000,
                    experience: 2000,
                    items: ['ancient_tech_fragment']
                }
            });
        }
    }
    
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: absolute;
            top: 100px;
            left: 50%;
            transform: translateX(-50%);
            background: ${type === 'success' ? 'rgba(0,255,0,0.2)' : 'rgba(0,255,255,0.2)'};
            border: 2px solid ${type === 'success' ? '#00ff00' : '#00ffff'};
            border-radius: 10px;
            padding: 20px 40px;
            color: white;
            font-size: 20px;
            font-weight: bold;
            text-shadow: 0 0 10px rgba(0,255,255,0.5);
            z-index: 1000;
            animation: notificationPulse 2s ease-in-out;
        `;
        notification.textContent = message;
        
        const style = document.createElement('style');
        style.textContent = `
            @keyframes notificationPulse {
                0% { opacity: 0; transform: translateX(-50%) translateY(-20px); }
                20% { opacity: 1; transform: translateX(-50%) translateY(0); }
                80% { opacity: 1; transform: translateX(-50%) translateY(0); }
                100% { opacity: 0; transform: translateX(-50%) translateY(-20px); }
            }
        `;
        document.head.appendChild(style);
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            document.body.removeChild(notification);
            document.head.removeChild(style);
        }, 2000);
    }
    
    // 相棒システム用のイベントハンドラー
    onEnemyDefeated(enemy) {
        if (this.companionSystem && this.companionSystem.isActive) {
            this.companionSystem.onCombatStart();
        }
    }
    
    onBossEncounter(boss) {
        if (this.companionSystem && this.companionSystem.isActive) {
            this.companionSystem.onBossEncounter();
        }
    }
    
    onBossDefeated(boss) {
        if (this.companionSystem && this.companionSystem.isActive) {
            this.companionSystem.onBossDefeat();
        }
    }
    
    onPlanetDiscovered(planet) {
        if (this.companionSystem && this.companionSystem.isActive) {
            this.companionSystem.onDiscovery();
        }
    }
    
    // 酒場イベントトリガー（初回遭遇時）
    triggerTavernMeeting() {
        if (this.tavernScene && this.companionSystem) {
            const dialogueData = this.companionSystem.triggerTavernMeeting();
            this.tavernScene.show(dialogueData);
        }
    }
}