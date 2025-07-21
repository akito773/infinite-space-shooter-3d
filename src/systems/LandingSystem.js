import * as THREE from 'three';
import { LandingMenu } from './LandingMenu.js';

export class LandingSystem {
    constructor(scene) {
        this.scene = scene;
        this.game = null; // メインゲーム参照
        this.isLanding = false;
        this.currentTarget = null;
        this.landingUI = null;
        this.landingMenu = null;
        this.planetLandingGame = null;
        
        this.createLandingUI();
    }
    
    setGame(game) {
        this.game = game;
    }
    
    createLandingUI() {
        // 着陸UIの作成（DOM要素として）
        this.landingUI = document.createElement('div');
        this.landingUI.className = 'landing-ui';
        this.landingUI.innerHTML = `
            <div class="landing-prompt">
                <div class="landing-target-name"></div>
                <div class="landing-distance"></div>
                <button class="landing-button">着陸 (E)</button>
                <div class="landing-info"></div>
            </div>
        `;
        
        // スタイルを追加
        const style = document.createElement('style');
        style.textContent = `
            .landing-ui {
                position: absolute;
                bottom: 200px;
                left: 50%;
                transform: translateX(-50%);
                display: none;
                pointer-events: all;
            }
            .landing-prompt {
                background: rgba(0, 0, 0, 0.8);
                border: 2px solid #00ffff;
                border-radius: 10px;
                padding: 20px;
                text-align: center;
                color: white;
                min-width: 300px;
            }
            .landing-target-name {
                font-size: 24px;
                color: #00ffff;
                margin-bottom: 10px;
            }
            .landing-distance {
                font-size: 16px;
                color: #aaaaaa;
                margin-bottom: 15px;
            }
            .landing-button {
                background: #00ffff;
                color: black;
                border: none;
                border-radius: 5px;
                padding: 10px 30px;
                font-size: 18px;
                cursor: pointer;
                transition: all 0.3s;
            }
            .landing-button:hover {
                background: #00dddd;
                transform: scale(1.05);
            }
            .landing-info {
                margin-top: 15px;
                font-size: 14px;
                color: #cccccc;
            }
        `;
        
        document.head.appendChild(style);
        document.getElementById('ui-overlay').appendChild(this.landingUI);
        
        // ボタンイベント
        const button = this.landingUI.querySelector('.landing-button');
        button.addEventListener('click', () => this.performLanding());
        
        // キーボードイベント
        document.addEventListener('keydown', (e) => {
            if (e.key.toLowerCase() === 'e' && this.currentTarget) {
                this.performLanding();
            }
        });
    }
    
    checkLandingProximity(player, planets, stations) {
        if (this.isLanding) return;
        
        const playerPos = player.group.position;
        let nearestTarget = null;
        let nearestDistance = Infinity;
        
        // 惑星のチェック
        planets.forEach(planet => {
            const distance = playerPos.distanceTo(planet.mesh.position);
            const threshold = planet.radius + 50;
            
            if (distance < threshold && distance < nearestDistance) {
                nearestDistance = distance;
                nearestTarget = {
                    type: 'planet',
                    object: planet,
                    distance: distance - planet.radius,
                    name: planet.name,
                    info: '資源採取・補給が可能'
                };
            }
        });
        
        // ステーションのチェック
        stations.forEach(station => {
            const distance = playerPos.distanceTo(station.group.position);
            const threshold = station.size + 30;
            
            if (distance < threshold && distance < nearestDistance) {
                nearestDistance = distance;
                nearestTarget = {
                    type: 'station',
                    object: station,
                    distance: distance - station.size,
                    name: station.name,
                    info: 'アップグレード・取引が可能'
                };
            }
        });
        
        this.updateLandingUI(nearestTarget);
    }
    
    updateLandingUI(target) {
        if (target && target.distance < 30) {
            this.currentTarget = target;
            this.landingUI.style.display = 'block';
            
            // UI更新
            this.landingUI.querySelector('.landing-target-name').textContent = target.name;
            this.landingUI.querySelector('.landing-distance').textContent = 
                `距離: ${Math.floor(target.distance)}m`;
            this.landingUI.querySelector('.landing-info').textContent = target.info;
            
            // タッチデバイスの場合はボタンテキストを変更
            if ('ontouchstart' in window) {
                this.landingUI.querySelector('.landing-button').textContent = '着陸';
            }
        } else {
            this.currentTarget = null;
            this.landingUI.style.display = 'none';
        }
    }
    
    performLanding() {
        if (!this.currentTarget || this.isLanding) return;
        
        this.isLanding = true;
        this.landingUI.style.display = 'none';
        
        // 惑星着陸をミッションシステムに通知
        if (this.currentTarget.type === 'planet' && window.game && window.game.missionSystem) {
            window.game.missionSystem.updateProgress('land_planet', { 
                planetName: this.currentTarget.name 
            });
        }
        
        // 着陸アニメーション
        this.showLandingAnimation(() => {
            // 着陸完了後の処理
            this.showLandingMenu();
        });
    }
    
    showLandingAnimation(callback) {
        // 着陸エフェクト
        const overlay = document.createElement('div');
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: black;
            opacity: 0;
            z-index: 2000;
            transition: opacity 1s;
        `;
        document.body.appendChild(overlay);
        
        // フェードイン
        setTimeout(() => {
            overlay.style.opacity = '1';
        }, 10);
        
        // 着陸テキスト
        const landingText = document.createElement('div');
        landingText.textContent = `${this.currentTarget.name}に着陸中...`;
        landingText.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            color: white;
            font-size: 36px;
            z-index: 2001;
        `;
        document.body.appendChild(landingText);
        
        // 2秒後にメニュー表示
        setTimeout(() => {
            document.body.removeChild(overlay);
            document.body.removeChild(landingText);
            callback();
        }, 2000);
    }
    
    showLandingMenu() {
        // 地球や補給基地など、特定の場所は従来のメニューを使用
        const exemptPlanets = ['地球', 'Earth', '補給基地', 'Supply Station'];
        const isExemptPlanet = exemptPlanets.includes(this.currentTarget.name);
        
        if (this.currentTarget.type === 'planet' && !isExemptPlanet) {
            // 一般的な惑星は惑星着陸システムを起動
            this.loadPlanetLandingSystem();
        } else {
            // 地球、ステーション、補給基地は従来のメニュー
            this.showStationMenu();
        }
    }
    
    async loadPlanetLandingSystem() {
        try {
            // 惑星システムモジュールを動的にロード
            const { PlanetLandingGame } = await import('../../planet-landing-system/src/PlanetLandingGame.js');
            
            // コンテナを作成
            const planetContainer = document.createElement('div');
            planetContainer.id = 'planet-landing-container';
            planetContainer.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                z-index: 10000;
                background: #000;
            `;
            document.body.appendChild(planetContainer);
            
            // メインゲームを一時停止
            if (this.game) {
                this.game.isPaused = true;
                if (this.game.renderer) {
                    this.game.renderer.domElement.style.display = 'none';
                }
            }
            
            // 惑星データを準備
            const planetData = {
                playerId: this.game?.playerId || 'player1',
                playerData: {
                    credits: this.game?.inventorySystem?.credits || 10000,
                    inventory: this.game?.inventorySystem?.items || [],
                    unlockedTech: this.game?.unlockedTech || []
                },
                planetData: {
                    id: this.currentTarget.object.id || `planet_${Date.now()}`,
                    name: this.currentTarget.name,
                    type: 'terrestrial',
                    position: this.currentTarget.object.mesh.position,
                    resources: this.currentTarget.object.resources || {}
                }
            };
            
            // 惑星ゲームを初期化
            this.planetLandingGame = new PlanetLandingGame({
                container: planetContainer,
                planetData: planetData,
                onReturn: (data) => {
                    this.handleReturnFromPlanet(data);
                    planetContainer.remove();
                    
                    // メインゲーム復帰
                    if (this.game && this.game.renderer) {
                        this.game.renderer.domElement.style.display = 'block';
                        this.game.isPaused = false;
                    }
                    
                    // 着陸状態をリセット
                    this.isLanding = false;
                    this.currentTarget = null;
                    this.planetLandingGame = null;
                }
            });
            
            // 惑星ゲームを開始
            this.planetLandingGame.start();
            
        } catch (error) {
            console.error('Failed to load planet landing system:', error);
            // フォールバック：通常のメニューを表示
            this.showStationMenu();
        }
    }
    
    showStationMenu() {
        // 新しいLandingMenuシステムを使用
        if (!this.landingMenu && this.game) {
            this.landingMenu = new LandingMenu(this.game);
        }
        
        if (this.landingMenu) {
            // 着陸場所の情報を渡してメニューを開く
            const locationData = {
                name: this.currentTarget.name,
                type: this.currentTarget.type === 'planet' ? 'planet' : 'spaceStation',
                object: this.currentTarget.object
            };
            
            this.landingMenu.open(locationData);
            
            // 着陸状態をリセット（メニューが閉じられた時のため）
            setTimeout(() => {
                this.isLanding = false;
                this.currentTarget = null;
            }, 500);
        } else {
            // フォールバック：古いメニューシステムを使用
            this.showOldLandingMenu();
        }
    }
    
    handleReturnFromPlanet(data) {
        console.log('Returned from planet with data:', data);
        
        // 獲得した資源を反映
        if (data.resources && this.game?.inventorySystem) {
            if (data.resources.credits) {
                this.game.inventorySystem.addCredits(data.resources.credits);
                console.log(`Gained ${data.resources.credits} credits`);
            }
            
            // アイテムを追加
            if (data.resources.items) {
                data.resources.items.forEach(item => {
                    this.game.inventorySystem.addItem(item);
                    console.log(`Gained item: ${item}`);
                });
            }
            
            // 経験値を追加
            if (data.resources.experience) {
                if (this.game.skillSystem && typeof this.game.skillSystem.addExperience === 'function') {
                    this.game.skillSystem.addExperience(data.resources.experience);
                    console.log(`Gained ${data.resources.experience} experience`);
                } else if (this.game.skillTreeSystem && typeof this.game.skillTreeSystem.addExperience === 'function') {
                    this.game.skillTreeSystem.addExperience(data.resources.experience);
                    console.log(`Gained ${data.resources.experience} experience`);
                } else {
                    console.log(`Experience gained: ${data.resources.experience} (no skill system available)`);
                }
            }
        }
        
        // 惑星の所有権を更新
        if (data.planetStatus && data.planetStatus.owned) {
            if (!this.game.ownedPlanets) {
                this.game.ownedPlanets = new Set();
            }
            this.game.ownedPlanets.add(data.planetId);
            console.log(`Planet ${data.planetId} is now owned`);
        }
        
        // ルナに報告
        if (this.game.companionSystem && this.game.companionSystem.isActive) {
            this.game.companionSystem.onDiscovery();
        }
    }
    
    showOldLandingMenu() {
        const menu = document.createElement('div');
        menu.className = 'landing-menu';
        menu.innerHTML = `
            <div class="menu-content">
                <h2>${this.currentTarget.name}</h2>
                <div class="menu-options">
                    ${this.getMenuOptions()}
                </div>
                <button class="leave-button">離陸</button>
            </div>
        `;
        
        // メニュースタイル
        const menuStyle = document.createElement('style');
        menuStyle.textContent = `
            .landing-menu {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.9);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 3000;
            }
            .menu-content {
                background: rgba(0, 20, 40, 0.9);
                border: 2px solid #00ffff;
                border-radius: 20px;
                padding: 40px;
                min-width: 400px;
                text-align: center;
            }
            .menu-content h2 {
                color: #00ffff;
                margin-bottom: 30px;
            }
            .menu-options {
                display: flex;
                flex-direction: column;
                gap: 15px;
                margin-bottom: 30px;
            }
            .menu-option {
                background: rgba(0, 100, 200, 0.3);
                border: 1px solid #00ffff;
                border-radius: 10px;
                padding: 15px;
                color: white;
                cursor: pointer;
                transition: all 0.3s;
            }
            .menu-option:hover {
                background: rgba(0, 150, 255, 0.5);
                transform: scale(1.05);
            }
            .leave-button {
                background: #ff6600;
                color: white;
                border: none;
                border-radius: 10px;
                padding: 15px 40px;
                font-size: 20px;
                cursor: pointer;
                transition: all 0.3s;
            }
            .leave-button:hover {
                background: #ff4400;
            }
        `;
        
        document.head.appendChild(menuStyle);
        document.body.appendChild(menu);
        
        // イベントハンドラー
        menu.querySelector('.leave-button').addEventListener('click', () => {
            this.leaveLanding(menu, menuStyle);
        });
        
        // メニューオプションのイベント
        menu.querySelectorAll('.menu-option').forEach(option => {
            option.addEventListener('click', () => {
                this.handleMenuOption(option.dataset.action);
            });
        });
    }
    
    getMenuOptions() {
        if (this.currentTarget.type === 'planet') {
            return `
                <div class="menu-option" data-action="collect">
                    <h3>資源採取</h3>
                    <p>惑星の資源を採取します</p>
                </div>
                <div class="menu-option" data-action="repair">
                    <h3>船体修理</h3>
                    <p>HPを完全回復 (無料)</p>
                </div>
                <div class="menu-option" data-action="explore">
                    <h3>探索</h3>
                    <p>惑星を探索してアイテムを見つける</p>
                </div>
            `;
        } else {
            return `
                <div class="menu-option" data-action="upgrade">
                    <h3>アップグレード</h3>
                    <p>武器や装備を強化</p>
                </div>
                <div class="menu-option" data-action="trade">
                    <h3>取引</h3>
                    <p>アイテムの売買</p>
                </div>
                <div class="menu-option" data-action="mission">
                    <h3>ミッション</h3>
                    <p>新しいミッションを受注</p>
                </div>
            `;
        }
    }
    
    handleMenuOption(action) {
        switch(action) {
            case 'repair':
                // HP回復
                if (window.game && window.game.player) {
                    window.game.player.health = window.game.player.maxHealth;
                    window.game.updateHealth(window.game.player.health, window.game.player.maxHealth);
                    this.showNotification('船体を修理しました！');
                }
                break;
                
            case 'collect':
                // 資源採取
                this.showNotification('資源を採取しました！ +1000スコア');
                if (window.game) {
                    window.game.updateScore(1000);
                }
                break;
                
            default:
                this.showNotification('この機能は準備中です');
        }
    }
    
    showNotification(message) {
        const notification = document.createElement('div');
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(0, 255, 0, 0.8);
            color: white;
            padding: 20px 40px;
            border-radius: 10px;
            font-size: 24px;
            z-index: 3001;
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 2000);
    }
    
    leaveLanding(menu, menuStyle) {
        document.body.removeChild(menu);
        document.head.removeChild(menuStyle);
        
        this.isLanding = false;
        this.currentTarget = null;
    }
}