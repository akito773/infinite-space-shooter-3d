import * as THREE from 'three';

export class WarpSystem {
    constructor(scene, player) {
        this.scene = scene;
        this.player = player;
        this.isWarping = false;
        this.warpDestination = null;
        this.warpUI = null;
        this.discoveredLocations = [];
        this.warpEffect = null;
        
        this.createWarpUI();
        this.setupKeyboardControls();
        
        // 初期位置を登録
        this.addDiscoveredLocation({
            name: '初期地点',
            position: new THREE.Vector3(0, 0, 0),
            type: 'spawn',
            icon: '🏠'
        });
    }
    
    createWarpUI() {
        // ワープメニューボタン
        const warpButton = document.createElement('button');
        warpButton.id = 'warp-button';
        warpButton.innerHTML = '🚀 ワープ (M)';
        warpButton.className = 'warp-button';
        
        // スタイル
        const style = document.createElement('style');
        style.textContent = `
            .warp-button {
                position: absolute;
                top: 20px;
                right: 240px;
                background: rgba(0, 100, 200, 0.8);
                color: white;
                border: 2px solid #00ffff;
                border-radius: 10px;
                padding: 10px 20px;
                font-size: 16px;
                cursor: pointer;
                transition: all 0.3s;
                z-index: 100;
            }
            .warp-button:hover {
                background: rgba(0, 150, 255, 0.9);
                transform: scale(1.05);
            }
            
            .warp-menu {
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: rgba(0, 20, 40, 0.95);
                border: 2px solid #00ffff;
                border-radius: 20px;
                padding: 30px;
                min-width: 500px;
                max-height: 80vh;
                overflow-y: auto;
                z-index: 4000;
                display: none;
            }
            
            .warp-menu h2 {
                color: #00ffff;
                text-align: center;
                margin-bottom: 20px;
            }
            
            .warp-locations {
                display: flex;
                flex-direction: column;
                gap: 10px;
                margin-bottom: 20px;
            }
            
            .warp-location {
                background: rgba(0, 100, 200, 0.3);
                border: 1px solid #00ffff;
                border-radius: 10px;
                padding: 15px;
                cursor: pointer;
                transition: all 0.3s;
                display: flex;
                align-items: center;
                gap: 15px;
            }
            
            .warp-location:hover {
                background: rgba(0, 150, 255, 0.5);
                transform: translateX(10px);
            }
            
            .warp-location-icon {
                font-size: 30px;
            }
            
            .warp-location-info {
                flex: 1;
            }
            
            .warp-location-name {
                color: white;
                font-size: 18px;
                font-weight: bold;
            }
            
            .warp-location-type {
                color: #aaaaaa;
                font-size: 14px;
            }
            
            .warp-location-distance {
                color: #00ffff;
                font-size: 16px;
                text-align: right;
            }
            
            .warp-close {
                background: #ff6600;
                color: white;
                border: none;
                border-radius: 10px;
                padding: 10px 30px;
                font-size: 18px;
                cursor: pointer;
                display: block;
                margin: 0 auto;
            }
            
            .warp-close:hover {
                background: #ff4400;
            }
            
            .warp-effect {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                pointer-events: none;
                z-index: 5000;
            }
            
            .warp-energy-cost {
                color: #ffaa00;
                font-size: 14px;
                margin-top: 5px;
            }
            
            @media (max-width: 768px) {
                .warp-button {
                    right: 20px;
                    top: 80px;
                    padding: 8px 16px;
                    font-size: 14px;
                }
                
                .warp-menu {
                    min-width: 90%;
                    padding: 20px;
                }
            }
        `;
        
        document.head.appendChild(style);
        document.getElementById('ui-overlay').appendChild(warpButton);
        
        // ワープメニュー
        this.warpUI = document.createElement('div');
        this.warpUI.className = 'warp-menu';
        this.warpUI.innerHTML = `
            <h2>ワープドライブ - 目的地選択</h2>
            <div class="warp-locations"></div>
            <button class="warp-close">閉じる (ESC)</button>
        `;
        
        document.body.appendChild(this.warpUI);
        
        // イベントハンドラー
        warpButton.addEventListener('click', () => this.openWarpMenu());
        this.warpUI.querySelector('.warp-close').addEventListener('click', () => this.closeWarpMenu());
        
        // タッチデバイス対応
        if ('ontouchstart' in window) {
            warpButton.textContent = '🚀 ワープ';
        }
    }
    
    setupKeyboardControls() {
        document.addEventListener('keydown', (e) => {
            // Mキーは銀河マップで使用するため、ここでは処理しない
            if (e.key === 'Escape' && this.warpUI.style.display === 'block') {
                this.closeWarpMenu();
            }
        });
    }
    
    toggleWarpMenu() {
        if (this.warpUI.style.display === 'block') {
            this.closeWarpMenu();
        } else {
            this.openWarpMenu();
        }
    }
    
    openWarpMenu() {
        if (this.isWarping) return;
        
        this.updateLocationsList();
        this.warpUI.style.display = 'block';
        
        // ゲームを一時停止（オプション）
        if (window.game) {
            window.game.isPaused = true;
        }
    }
    
    closeWarpMenu() {
        this.warpUI.style.display = 'none';
        
        // ゲーム再開
        if (window.game) {
            window.game.isPaused = false;
        }
    }
    
    addDiscoveredLocation(location) {
        // 重複チェック
        const exists = this.discoveredLocations.some(loc => 
            loc.position.distanceTo(location.position) < 10
        );
        
        if (!exists) {
            this.discoveredLocations.push({
                ...location,
                id: Date.now()
            });
        }
    }
    
    updateLocationsList() {
        const container = this.warpUI.querySelector('.warp-locations');
        container.innerHTML = '';
        
        const playerPos = this.player.group.position;
        
        // 距離でソート
        const sortedLocations = this.discoveredLocations
            .map(loc => ({
                ...loc,
                distance: playerPos.distanceTo(loc.position)
            }))
            .sort((a, b) => a.distance - b.distance);
        
        sortedLocations.forEach(location => {
            const locationEl = document.createElement('div');
            locationEl.className = 'warp-location';
            
            const typeLabel = this.getTypeLabel(location.type);
            const energyCost = this.calculateEnergyCost(location.distance);
            
            locationEl.innerHTML = `
                <div class="warp-location-icon">${location.icon || '📍'}</div>
                <div class="warp-location-info">
                    <div class="warp-location-name">${location.name}</div>
                    <div class="warp-location-type">${typeLabel}</div>
                    <div class="warp-energy-cost">エネルギー消費: ${energyCost}</div>
                </div>
                <div class="warp-location-distance">${Math.floor(location.distance)}m</div>
            `;
            
            locationEl.addEventListener('click', () => {
                this.initiateWarp(location);
            });
            
            container.appendChild(locationEl);
        });
    }
    
    getTypeLabel(type) {
        const labels = {
            'spawn': '初期地点',
            'planet': '惑星',
            'station': '宇宙ステーション',
            'asteroid': '小惑星帯',
            'custom': 'カスタムマーカー'
        };
        return labels[type] || '不明';
    }
    
    calculateEnergyCost(distance) {
        // 距離に応じたエネルギーコスト
        return Math.max(10, Math.floor(distance / 50));
    }
    
    initiateWarp(location) {
        if (this.isWarping) return;
        
        this.isWarping = true;
        this.warpDestination = location.position;
        this.closeWarpMenu();
        
        // ワープエフェクト開始
        this.startWarpEffect(() => {
            // ワープ実行
            this.performWarp();
        });
    }
    
    startWarpEffect(callback) {
        // ワープエフェクト用キャンバス
        const canvas = document.createElement('canvas');
        canvas.className = 'warp-effect';
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        document.body.appendChild(canvas);
        
        const ctx = canvas.getContext('2d');
        
        // ワープアニメーション
        let progress = 0;
        const animate = () => {
            progress += 0.02;
            
            // キャンバスをクリア
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            // 中心から放射状のライン
            const centerX = canvas.width / 2;
            const centerY = canvas.height / 2;
            
            for (let i = 0; i < 50; i++) {
                const angle = (Math.PI * 2 / 50) * i;
                const length = progress * Math.max(canvas.width, canvas.height);
                
                ctx.beginPath();
                ctx.moveTo(centerX, centerY);
                ctx.lineTo(
                    centerX + Math.cos(angle) * length,
                    centerY + Math.sin(angle) * length
                );
                
                const gradient = ctx.createLinearGradient(
                    centerX, centerY,
                    centerX + Math.cos(angle) * length,
                    centerY + Math.sin(angle) * length
                );
                gradient.addColorStop(0, 'rgba(0, 255, 255, 0)');
                gradient.addColorStop(0.5, `rgba(0, 255, 255, ${progress})`);
                gradient.addColorStop(1, 'rgba(255, 255, 255, 1)');
                
                ctx.strokeStyle = gradient;
                ctx.lineWidth = 2 + progress * 3;
                ctx.stroke();
            }
            
            // ホワイトアウト
            if (progress > 0.8) {
                ctx.fillStyle = `rgba(255, 255, 255, ${(progress - 0.8) * 5})`;
                ctx.fillRect(0, 0, canvas.width, canvas.height);
            }
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                // アニメーション完了
                setTimeout(() => {
                    callback();
                    this.endWarpEffect(canvas);
                }, 500);
            }
        };
        
        animate();
        
        // ワープ音（仮想）
        this.playWarpSound();
    }
    
    endWarpEffect(canvas) {
        // フェードアウト
        let opacity = 1;
        const fadeOut = () => {
            opacity -= 0.05;
            canvas.style.opacity = opacity;
            
            if (opacity > 0) {
                requestAnimationFrame(fadeOut);
            } else {
                document.body.removeChild(canvas);
                this.isWarping = false;
            }
        };
        
        fadeOut();
    }
    
    performWarp() {
        // プレイヤーを目的地に移動
        this.player.group.position.copy(this.warpDestination);
        
        // カメラも追従
        if (window.game && window.game.camera) {
            const cameraOffset = new THREE.Vector3(0, 15, 30);
            window.game.camera.position.copy(
                this.player.group.position.clone().add(cameraOffset)
            );
            window.game.camera.lookAt(this.player.group.position);
        }
        
        // ワープ完了通知
        this.showWarpNotification('ワープ完了！');
    }
    
    showWarpNotification(message) {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(0, 255, 255, 0.9);
            color: black;
            padding: 20px 40px;
            border-radius: 10px;
            font-size: 24px;
            font-weight: bold;
            z-index: 6000;
        `;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 2000);
    }
    
    playWarpSound() {
        // 音声エフェクト（実装は省略）
        console.log('Warp sound effect');
    }
    
    // 新しい場所を発見した時に呼ぶ
    discoverLocation(object) {
        let location = null;
        
        if (object.name && object.mesh) {
            // 惑星
            location = {
                name: object.name,
                position: object.mesh.position.clone(),
                type: 'planet',
                icon: '🌍'
            };
        } else if (object.name && object.group) {
            // ステーション
            location = {
                name: object.name,
                position: object.group.position.clone(),
                type: 'station',
                icon: '🛸'
            };
        }
        
        if (location) {
            this.addDiscoveredLocation(location);
            this.showDiscoveryNotification(`新しい場所を発見: ${location.name}`);
        }
    }
    
    showDiscoveryNotification(message) {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            bottom: 100px;
            right: 20px;
            background: rgba(0, 255, 0, 0.9);
            color: white;
            padding: 15px 25px;
            border-radius: 10px;
            font-size: 16px;
            z-index: 1000;
            animation: slideIn 0.3s ease-out;
        `;
        notification.textContent = '🔍 ' + message;
        
        // アニメーション用のスタイル
        const animStyle = document.createElement('style');
        animStyle.textContent = `
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
        `;
        document.head.appendChild(animStyle);
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'slideIn 0.3s ease-out reverse';
            setTimeout(() => {
                document.body.removeChild(notification);
                document.head.removeChild(animStyle);
            }, 300);
        }, 3000);
    }
}