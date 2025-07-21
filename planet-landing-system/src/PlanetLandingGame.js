// 惑星着陸ゲーム - メインクラス

import * as THREE from 'three';
import { SurfaceScene } from './scenes/SurfaceScene.js';
import { UndergroundScene } from './scenes/UndergroundScene.js';
import { BuildingSystem } from './systems/BuildingSystem.js';
import { ResourceSystem } from './systems/ResourceSystem.js';
import { SoundSystem } from './systems/SoundSystem.js';
import { ExplorationSystem } from './systems/ExplorationSystem.js';
import { GameProgressSystem } from './systems/GameProgressSystem.js';
import { SaveLoadSystem } from './systems/SaveLoadSystem.js';
import { ResourceNodeSystem } from './systems/ResourceNodeSystem.js';
import { ResearchSystem } from './systems/ResearchSystem.js';
import { TutorialSystem } from './systems/TutorialSystem.js';
import { CombatSystem } from './systems/CombatSystem.js';
import { UpgradeSystem } from './systems/UpgradeSystem.js';
import { TransportSystem } from './systems/TransportSystem.js';
import { EventSystem } from './systems/EventSystem.js';
import { PlanetOwnershipSystem } from './systems/PlanetOwnershipSystem.js';
import { AdvisorSystem } from './systems/AdvisorSystem.js';
import { BuildingMenu } from './components/BuildingMenu.js';
import { ResourceDisplay } from './components/ResourceDisplay.js';
import { BuildingInfoPanel } from './components/BuildingInfoPanel.js';
import { DebugPanel } from './components/DebugPanel.js';
import { ExplorationUI } from './components/ExplorationUI.js';
import { ProgressDisplay } from './components/ProgressDisplay.js';
import { SaveLoadUI } from './components/SaveLoadUI.js';
import { ResearchUI } from './components/ResearchUI.js';
import { TransportUI } from './components/TransportUI.js';
import { EventUI } from './components/EventUI.js';
import { SettlementUI } from './components/SettlementUI.js';
import { AdvisorUI } from './components/AdvisorUI.js';

export class PlanetLandingGame {
    constructor(config) {
        this.container = config.container;
        this.planetData = config.planetData;
        this.onReturn = config.onReturn;
        
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        
        this.systems = {};
        this.components = {};
        this.currentScene = 'surface'; // 'surface' or 'underground'
        this.undergroundLocked = false; // 地下エリアのロック状態（デフォルトは解放）
        
        // カメラコントロール用
        this.mouseX = 0;
        this.mouseY = 0;
        this.isMouseDown = false;
        this.lastMouseX = 0;
        this.lastMouseY = 0;
        
        this.init();
    }
    
    init() {
        // Three.js基本設定
        this.setupRenderer();
        this.setupScenes();
        this.setupSystems();
        
        // UIの初期化
        this.createUI();
        
        // イベントリスナー
        this.setupEventListeners();
        
        console.log('惑星着陸システム初期化完了');
    }
    
    setupRenderer() {
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.container.appendChild(this.renderer.domElement);
    }
    
    setupScenes() {
        // カメラ設定
        this.camera = new THREE.PerspectiveCamera(
            60,
            window.innerWidth / window.innerHeight,
            0.1,
            1000
        );
        
        // シーン作成
        this.surfaceScene = new SurfaceScene(this);
        this.undergroundScene = new UndergroundScene(this);
        
        // 初期カメラ位置
        this.camera.position.set(50, 30, 50);
        this.camera.lookAt(0, 0, 0);
    }
    
    setupSystems() {
        // サウンドシステム
        this.systems.sound = new SoundSystem();
        
        // リソースシステム
        this.systems.resource = new ResourceSystem(this);
        
        // プレイヤーデータから初期資源を設定
        if (this.planetData?.playerData) {
            this.systems.resource.resources.credits = this.planetData.playerData.credits || 10000;
        }
        
        // 建物システム
        this.systems.building = new BuildingSystem(this);
        
        // 資源ノードシステム
        this.systems.resourceNode = new ResourceNodeSystem(this);
        
        // 探索システム
        this.systems.exploration = new ExplorationSystem(this);
        
        // 進行システム
        this.systems.progress = new GameProgressSystem(this);
        
        // 研究システム
        this.systems.research = new ResearchSystem(this);
        
        // チュートリアルシステム
        this.systems.tutorial = new TutorialSystem(this);
        
        // 戦闘システム
        this.systems.combat = new CombatSystem(this);
        
        // アップグレードシステム
        this.systems.upgrade = new UpgradeSystem(this);
        
        // 輸送システム
        this.systems.transport = new TransportSystem(this);
        
        // イベントシステム
        this.systems.event = new EventSystem(this);
        
        // 惑星所有権システム
        this.systems.planetOwnership = new PlanetOwnershipSystem(this);
        
        // アドバイザーシステム
        this.systems.advisor = new AdvisorSystem(this);
        
        // セーブ/ロードシステム
        this.systems.saveLoad = new SaveLoadSystem(this);
        
        // 初期リソース表示を更新
        this.systems.resource.notifyResourcesChanged();
    }
    
    createUI() {
        // 基本UI
        const uiContainer = document.createElement('div');
        uiContainer.id = 'planet-ui';
        uiContainer.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
        `;
        
        // 戻るボタン
        const returnButton = document.createElement('button');
        returnButton.style.cssText = `
            position: absolute;
            bottom: 20px;
            right: 20px;
            padding: 10px 20px;
            background: linear-gradient(135deg, #ff4444, #cc0000);
            color: white;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            font-size: 16px;
            font-weight: bold;
            pointer-events: auto;
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
            transition: all 0.3s ease;
        `;
        returnButton.textContent = '🚀 宇宙に戻る';
        returnButton.onmouseover = () => {
            returnButton.style.transform = 'scale(1.05)';
            returnButton.style.boxShadow = '0 6px 20px rgba(0, 0, 0, 0.4)';
        };
        returnButton.onmouseout = () => {
            returnButton.style.transform = 'scale(1)';
            returnButton.style.boxShadow = '0 4px 15px rgba(0, 0, 0, 0.3)';
        };
        returnButton.onclick = () => this.returnToSpace();
        
        // メニューボタン
        const menuButton = document.createElement('button');
        menuButton.style.cssText = `
            position: absolute;
            top: 20px;
            right: 20px;
            padding: 10px 20px;
            background: linear-gradient(135deg, #4a90e2, #357abd);
            color: white;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            font-size: 16px;
            font-weight: bold;
            pointer-events: auto;
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
            transition: all 0.3s ease;
        `;
        menuButton.textContent = '📋 メニュー';
        menuButton.onmouseover = () => {
            menuButton.style.transform = 'scale(1.05)';
            menuButton.style.boxShadow = '0 6px 20px rgba(0, 0, 0, 0.4)';
        };
        menuButton.onmouseout = () => {
            menuButton.style.transform = 'scale(1)';
            menuButton.style.boxShadow = '0 4px 15px rgba(0, 0, 0, 0.3)';
        };
        menuButton.onclick = () => {
            if (this.components.saveLoadUI) {
                this.components.saveLoadUI.toggle();
            }
        };
        
        // コントロール説明
        const controls = document.createElement('div');
        controls.style.cssText = `
            position: absolute;
            bottom: 20px;
            left: 20px;
            background: rgba(0, 0, 0, 0.8);
            padding: 15px;
            border: 1px solid #0ff;
            border-radius: 5px;
            font-size: 12px;
            color: #fff;
            pointer-events: auto;
        `;
        controls.innerHTML = `
            <strong style="color: #0ff;">操作方法</strong><br>
            🖱️ 右ドラッグ: カメラ回転<br>
            🖱️ ホイール: ズーム<br>
            ⌨️ WASD: カメラ移動<br>
            ⌨️ Tab: 探索モード<br>
            ⌨️ U: 地下エリア<br>
            ⌨️ Y: 輸送ターミナル<br>
            ⌨️ T: 敵襲撃(テスト)<br>
            ⌨️ Shift+E: イベント(テスト)<br>
            ⌨️ ESC: メニュー<br>
            ⌨️ F5: クイックセーブ<br>
            ⌨️ F9: クイックロード<br>
            ⌨️ F12: デバッグパネル
        `;
        
        uiContainer.appendChild(returnButton);
        uiContainer.appendChild(menuButton);
        uiContainer.appendChild(controls);
        this.container.appendChild(uiContainer);
        
        // UIコンポーネントを作成（UIコンテナ作成後）
        this.components.buildingMenu = new BuildingMenu(this);
        this.components.resourceDisplay = new ResourceDisplay(this);
        this.components.buildingInfoPanel = new BuildingInfoPanel(this);
        this.components.explorationUI = new ExplorationUI(this);
        this.components.debugPanel = new DebugPanel(this);
        this.components.progressDisplay = new ProgressDisplay(this);
        this.components.saveLoadUI = new SaveLoadUI(this);
        this.components.researchUI = new ResearchUI(this);
        this.components.transportUI = new TransportUI(this);
        this.components.eventUI = new EventUI(this);
        this.components.settlementUI = new SettlementUI(this);
        this.components.advisorUI = new AdvisorUI(this);
    }
    
    setupEventListeners() {
        // ウィンドウリサイズ
        window.addEventListener('resize', () => this.onResize());
        
        // マウスイベント
        this.renderer.domElement.addEventListener('mousedown', (e) => this.onMouseDown(e));
        this.renderer.domElement.addEventListener('mousemove', (e) => this.onMouseMove(e));
        this.renderer.domElement.addEventListener('mouseup', (e) => this.onMouseUp(e));
        this.renderer.domElement.addEventListener('wheel', (e) => this.onMouseWheel(e));
        
        // キーボードイベント
        document.addEventListener('keydown', (e) => this.onKeyDown(e));
        document.addEventListener('keyup', (e) => this.onKeyUp(e));
        
        // コンテキストメニューを無効化
        this.renderer.domElement.addEventListener('contextmenu', (e) => e.preventDefault());
    }
    
    start() {
        this.lastTime = Date.now();
        
        // 自動セーブ読み込みは無効化（タイトル画面から手動選択）
        // const saveInfo = this.systems.saveLoad?.getSaveInfo();
        // if (saveInfo && saveInfo[9]) { // スロット9は自動セーブ
        //     console.log('自動セーブを検出、ロードします...');
        //     this.systems.saveLoad.load(9);
        // }
        
        this.animate();
    }
    
    animate() {
        requestAnimationFrame(() => this.animate());
        
        const now = Date.now();
        const deltaTime = (now - this.lastTime) / 1000; // 秒単位
        this.lastTime = now;
        
        // システムの更新
        if (this.systems.resource) {
            this.systems.resource.update(deltaTime);
        }
        if (this.systems.building) {
            this.systems.building.update(deltaTime);
        }
        if (this.systems.resourceNode) {
            this.systems.resourceNode.update(deltaTime);
        }
        if (this.systems.exploration) {
            this.systems.exploration.update(deltaTime);
        }
        if (this.systems.progress) {
            this.systems.progress.update(deltaTime);
        }
        if (this.systems.research) {
            this.systems.research.update(deltaTime);
        }
        if (this.systems.tutorial) {
            this.systems.tutorial.update();
        }
        if (this.systems.combat) {
            this.systems.combat.update(deltaTime);
        }
        if (this.systems.upgrade) {
            this.systems.upgrade.update(deltaTime);
        }
        if (this.systems.transport) {
            this.systems.transport.update(deltaTime);
        }
        if (this.systems.event) {
            this.systems.event.update(deltaTime);
        }
        if (this.systems.planetOwnership) {
            this.systems.planetOwnership.update(deltaTime);
        }
        if (this.systems.advisor) {
            this.systems.advisor.update(deltaTime);
        }
        
        // シーンの更新
        if (this.currentScene === 'surface' && this.surfaceScene) {
            this.surfaceScene.update(deltaTime);
        } else if (this.currentScene === 'underground' && this.undergroundScene) {
            this.undergroundScene.update(deltaTime);
        }
        
        // UIの更新
        if (this.components.researchUI) {
            this.components.researchUI.update();
        }
        
        // レンダリング
        try {
            if (this.currentScene === 'surface') {
                this.renderer.render(this.surfaceScene, this.camera);
            } else if (this.currentScene === 'underground') {
                // デバッグ：地下シーンのレンダリング状況を確認
                if (!this.debugLogged) {
                    console.log('Underground scene:', this.undergroundScene);
                    console.log('Underground scene children:', this.undergroundScene.children.length);
                    console.log('Camera position:', this.camera.position);
                    this.debugLogged = true;
                }
                this.renderer.render(this.undergroundScene, this.camera);
            }
        } catch (error) {
            if (!this.renderErrorLogged) {
                console.error('Render error:', error);
                this.renderErrorLogged = true;
            }
        }
    }
    
    loadPlanet(planetData) {
        // 新しい惑星データを読み込む
        this.planetData = planetData;
        
        // 資源を更新
        if (planetData?.playerData && this.systems.resource) {
            this.systems.resource.resources.credits = planetData.playerData.credits || 10000;
            this.systems.resource.notifyResourcesChanged();
        }
        
        // シーンをリセットして再構築
        console.log('新しい惑星を読み込み:', planetData);
    }
    
    returnToSpace() {
        // 収集した資源データをまとめる
        const resources = this.systems.resource?.getResources() || {};
        const returnData = {
            resources: {
                credits: Math.floor(resources.credits - (this.planetData?.playerData?.credits || 10000)),
                items: [],
                experience: 100
            },
            planetStatus: {
                owned: true,
                developmentLevel: this.systems.building?.buildings.size || 0
            }
        };
        
        // 獲得したアイテムを追加
        if (resources.iron > 0) returnData.resources.items.push(`iron_ore:${Math.floor(resources.iron)}`);
        if (resources.energy > 0) returnData.resources.items.push(`energy_cell:${Math.floor(resources.energy)}`);
        if (resources.crystal > 0) returnData.resources.items.push(`crystal:${Math.floor(resources.crystal)}`);
        
        // コールバックを実行
        if (this.onReturn) {
            this.onReturn(returnData);
        }
    }
    
    // カメラコントロール
    onMouseDown(event) {
        if (event.button === 2) { // 右クリック
            this.isMouseDown = true;
            this.lastMouseX = event.clientX;
            this.lastMouseY = event.clientY;
        }
    }
    
    onMouseMove(event) {
        if (this.isMouseDown) {
            const deltaX = event.clientX - this.lastMouseX;
            const deltaY = event.clientY - this.lastMouseY;
            
            // カメラを回転
            if (this.surfaceScene) {
                this.surfaceScene.rotateCamera(deltaX * 0.01);
                // Y軸の回転は制限する
                const currentHeight = this.surfaceScene.cameraHeight;
                const newHeight = currentHeight + deltaY * 0.1;
                this.surfaceScene.cameraHeight = Math.max(10, Math.min(80, newHeight));
                this.surfaceScene.updateCameraPosition();
            }
            
            this.lastMouseX = event.clientX;
            this.lastMouseY = event.clientY;
        }
    }
    
    onMouseUp(event) {
        if (event.button === 2) { // 右クリック
            this.isMouseDown = false;
        }
    }
    
    onMouseWheel(event) {
        event.preventDefault();
        
        // ズーム
        if (this.surfaceScene) {
            this.surfaceScene.zoomCamera(event.deltaY * 0.1);
        }
    }
    
    onKeyDown(event) {
        // 共通のキー処理（Tab、U、Escape、Tなど）を先に処理
        
        // 探索モード切り替え
        if (event.key === 'Tab') {
            event.preventDefault();
            console.log('Tab key pressed');
            if (this.systems.exploration) {
                this.systems.exploration.toggleExplorationMode();
                this.components.explorationUI?.updateButtonState();
            } else {
                console.error('exploration system not found');
            }
            return;
        }
        
        // 地下エリア切り替え
        if (event.key === 'u' || event.key === 'U') {
            console.log('U key pressed');
            // Shiftキーを押しながらUで強制的に地下エリアを解放（デバッグ用）
            if (event.shiftKey) {
                console.log('Force unlocking underground area');
                this.undergroundLocked = false;
                if (this.systems.tutorial) {
                    this.systems.tutorial.unlockFeature('underground');
                }
            }
            this.toggleUnderground();
            return;
        }
        
        // セーブ/ロードメニュー
        if (event.key === 'Escape') {
            if (this.components.saveLoadUI) {
                this.components.saveLoadUI.toggle();
            }
            return;
        }
        
        // デバッグ用：手動攻撃トリガー
        if (event.key === 'T') {
            if (this.systems.combat) {
                this.systems.combat.triggerAttack();
            }
            return;
        }
        
        // デバッグ用：ランダムイベント発生
        if (event.key === 'E' && event.shiftKey) {
            if (this.systems.event) {
                const events = ['METEOR_SHOWER', 'RESOURCE_DISCOVERY', 'SOLAR_FLARE', 'ALIEN_ENCOUNTER', 'ANCIENT_RUINS', 'EQUIPMENT_MALFUNCTION'];
                const randomEvent = events[Math.floor(Math.random() * events.length)];
                this.systems.event.forceEvent(randomEvent);
            }
            return;
        }
        
        // デバッグ用：決算実行
        if (event.key === 'M' && event.shiftKey) {
            if (this.systems.planetOwnership) {
                this.systems.planetOwnership.performSettlement(true);
            }
            return;
        }
        
        // 地下エリアでのキー入力処理
        if (this.currentScene === 'underground') {
            this.undergroundScene.onKeyDown(event);
            return;
        }
        
        // 探索モードでない場合のみカメラ移動
        if (!this.systems.exploration?.isExploring) {
            const speed = 2;
            
            switch(event.key.toLowerCase()) {
                case 'w':
                    if (this.surfaceScene) this.surfaceScene.panCamera(0, -speed);
                    break;
                case 's':
                    if (this.surfaceScene) this.surfaceScene.panCamera(0, speed);
                    break;
                case 'a':
                    if (this.surfaceScene) this.surfaceScene.panCamera(-speed, 0);
                    break;
                case 'd':
                    if (this.surfaceScene) this.surfaceScene.panCamera(speed, 0);
                    break;
            }
        }
    }
    
    onKeyUp(event) {
        // 地下エリアでのキー入力処理
        if (this.currentScene === 'underground') {
            this.undergroundScene.onKeyUp(event);
        }
    }
    
    onResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }
    
    // 地下エリア切り替え
    toggleUnderground() {
        console.log('toggleUnderground called, undergroundLocked:', this.undergroundLocked);
        
        // チュートリアルロックチェック
        if (this.undergroundLocked) {
            this.showMessage('地下エリアはまだロックされています。探索モードで資源ノードを3個収集してください。', 'error');
            return;
        }
        
        console.log('Current scene:', this.currentScene);
        
        if (this.currentScene === 'surface') {
            this.enterUnderground();
        } else {
            this.exitUnderground();
        }
    }
    
    enterUnderground() {
        console.log('enterUnderground called');
        this.currentScene = 'underground';
        
        // デバッグフラグをリセット
        this.debugLogged = false;
        this.renderErrorLogged = false;
        
        // 探索モードを終了
        if (this.systems.exploration?.isExploring) {
            this.systems.exploration.exitExplorationMode();
            this.components.explorationUI?.updateButtonState();
        }
        
        // 地下シーンを有効化
        if (this.undergroundScene) {
            this.undergroundScene.enterUnderground();
            
            // カメラを地下用に調整
            this.undergroundScene.setupCamera();
            
            // レンダリングサイズを更新
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        } else {
            console.error('undergroundScene is not initialized');
        }
        
        // 音
        if (this.systems.sound) {
            this.systems.sound.play('success');
        }
        
        // メッセージ
        this.showMessage('地下エリアに移動しました', 'info');
        
        // チュートリアル通知
        if (this.systems.tutorial) {
            this.systems.tutorial.onUndergroundEntered();
        }
        
        console.log('地下エリアに移動');
    }
    
    exitUnderground() {
        this.currentScene = 'surface';
        
        // 地下シーンを無効化
        this.undergroundScene.exitUnderground();
        
        // 地上カメラに戻す
        if (this.surfaceScene) {
            this.surfaceScene.updateCameraPosition();
        }
        
        // 音
        if (this.systems.sound) {
            this.systems.sound.play('success');
        }
        
        // メッセージ
        this.showMessage('地上に戻りました', 'info');
        
        console.log('地上に戻りました');
    }
    
    showMessage(text, type) {
        if (this.components.buildingMenu) {
            this.components.buildingMenu.showMessage(text, type);
        }
    }
    
    // セーブ/ロード
    save() {
        const saveData = {
            resources: this.systems.resource?.serialize(),
            buildings: this.systems.building?.serialize(),
            progress: this.systems.progress?.serialize(),
            research: this.systems.research?.serialize(),
            planetId: this.planetData?.planetData?.id
        };
        return saveData;
    }
    
    load(saveData) {
        if (saveData.resources && this.systems.resource) {
            this.systems.resource.deserialize(saveData.resources);
        }
        if (saveData.buildings && this.systems.building) {
            this.systems.building.deserialize(saveData.buildings);
        }
        if (saveData.progress && this.systems.progress) {
            this.systems.progress.deserialize(saveData.progress);
        }
        if (saveData.research && this.systems.research) {
            this.systems.research.deserialize(saveData.research);
        }
    }
}