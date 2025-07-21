import * as THREE from 'three';
import { LandingMenu } from './LandingMenu.js';

export class LandingSystem {
    constructor(scene) {
        this.scene = scene;
        this.isLanding = false;
        this.currentTarget = null;
        this.landingUI = null;
        this.landingMenu = null;
        
        this.createLandingUI();
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
        // 新しいLandingMenuシステムを使用
        if (!this.landingMenu && window.game) {
            this.landingMenu = new LandingMenu(window.game);
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