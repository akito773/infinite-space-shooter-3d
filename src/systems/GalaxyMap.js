// 広域銀河マップシステム

export class GalaxyMap {
    constructor(game) {
        this.game = game;
        this.isOpen = false;
        this.mapContainer = null;
        this.mapCanvas = null;
        this.ctx = null;
        
        // 発見済みの場所
        this.discoveredLocations = new Set();
        
        // ズームレベル
        this.zoomLevel = 1;
        this.minZoom = 0.1;
        this.maxZoom = 2;
        
        // カメラ位置（マップの中心座標）
        this.cameraX = 0;
        this.cameraY = 0;
        
        // ドラッグ操作用
        this.isDragging = false;
        this.dragStartX = 0;
        this.dragStartY = 0;
        this.dragCameraX = 0;
        this.dragCameraY = 0;
        
        this.createUI();
        this.setupEventListeners();
    }
    
    createUI() {
        // メインコンテナ
        this.mapContainer = document.createElement('div');
        this.mapContainer.id = 'galaxy-map';
        this.mapContainer.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: linear-gradient(to bottom, #000428, #004e92);
            display: none;
            z-index: 3000;
        `;
        
        // ヘッダー
        const header = document.createElement('div');
        header.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 60px;
            background: rgba(0, 0, 0, 0.7);
            border-bottom: 2px solid #00ffff;
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 0 20px;
        `;
        
        const title = document.createElement('h2');
        title.textContent = '🌌 銀河マップ - Galaxy Map';
        title.style.cssText = `
            color: #00ffff;
            margin: 0;
            font-size: 24px;
            text-shadow: 0 0 10px rgba(0, 255, 255, 0.5);
        `;
        
        const closeButton = document.createElement('button');
        closeButton.textContent = '✕ 閉じる';
        closeButton.style.cssText = `
            background: #ff3366;
            border: none;
            color: white;
            padding: 10px 20px;
            border-radius: 5px;
            cursor: pointer;
            font-size: 16px;
            transition: all 0.3s;
        `;
        closeButton.onmouseover = () => {
            closeButton.style.background = '#ff5588';
            closeButton.style.transform = 'scale(1.05)';
        };
        closeButton.onmouseout = () => {
            closeButton.style.background = '#ff3366';
            closeButton.style.transform = 'scale(1)';
        };
        closeButton.onclick = () => this.close();
        
        header.appendChild(title);
        header.appendChild(closeButton);
        
        // キャンバス
        this.mapCanvas = document.createElement('canvas');
        this.mapCanvas.style.cssText = `
            position: absolute;
            top: 60px;
            left: 0;
            cursor: grab;
        `;
        this.ctx = this.mapCanvas.getContext('2d');
        
        // コントロールパネル
        const controls = document.createElement('div');
        controls.style.cssText = `
            position: absolute;
            bottom: 20px;
            left: 20px;
            background: rgba(0, 0, 0, 0.8);
            border: 2px solid #00ffff;
            border-radius: 10px;
            padding: 15px;
            color: white;
        `;
        
        controls.innerHTML = `
            <div style="margin-bottom: 10px;">
                <button id="zoom-in" style="background: #00aaff; border: none; color: white; padding: 5px 15px; margin-right: 5px; cursor: pointer; border-radius: 3px;">ズームイン +</button>
                <button id="zoom-out" style="background: #00aaff; border: none; color: white; padding: 5px 15px; cursor: pointer; border-radius: 3px;">ズームアウト -</button>
            </div>
            <div style="font-size: 12px; color: #aaa;">
                ドラッグで移動 | マウスホイールでズーム
            </div>
        `;
        
        // 凡例
        const legend = document.createElement('div');
        legend.style.cssText = `
            position: absolute;
            top: 80px;
            right: 20px;
            background: rgba(0, 0, 0, 0.8);
            border: 2px solid #00ffff;
            border-radius: 10px;
            padding: 15px;
            color: white;
            min-width: 200px;
        `;
        
        legend.innerHTML = `
            <h3 style="margin: 0 0 10px 0; color: #00ffff; font-size: 16px;">凡例</h3>
            <div style="display: flex; align-items: center; margin: 5px 0;">
                <div style="width: 20px; height: 20px; background: #4169E1; border-radius: 50%; margin-right: 10px;"></div>
                <span>惑星</span>
            </div>
            <div style="display: flex; align-items: center; margin: 5px 0;">
                <div style="width: 20px; height: 20px; background: #00ffff; margin-right: 10px;"></div>
                <span>宇宙ステーション</span>
            </div>
            <div style="display: flex; align-items: center; margin: 5px 0;">
                <div style="width: 20px; height: 20px; background: #ffaa00; clip-path: polygon(50% 0%, 0% 100%, 100% 100%); margin-right: 10px;"></div>
                <span>現在位置</span>
            </div>
            <div style="display: flex; align-items: center; margin: 5px 0;">
                <div style="width: 20px; height: 20px; background: #ff0000; border-radius: 50%; margin-right: 10px;"></div>
                <span>危険エリア</span>
            </div>
            <div style="display: flex; align-items: center; margin: 5px 0;">
                <div style="width: 20px; height: 20px; background: #666; border-radius: 50%; margin-right: 10px;"></div>
                <span>未発見</span>
            </div>
        `;
        
        // 組み立て
        this.mapContainer.appendChild(header);
        this.mapContainer.appendChild(this.mapCanvas);
        this.mapContainer.appendChild(controls);
        this.mapContainer.appendChild(legend);
        
        document.body.appendChild(this.mapContainer);
        
        // スタイル追加
        if (!document.querySelector('#galaxy-map-styles')) {
            const style = document.createElement('style');
            style.id = 'galaxy-map-styles';
            style.textContent = `
                @keyframes mapFadeIn {
                    from { opacity: 0; transform: scale(0.9); }
                    to { opacity: 1; transform: scale(1); }
                }
                
                @keyframes mapFadeOut {
                    from { opacity: 1; transform: scale(1); }
                    to { opacity: 0; transform: scale(0.9); }
                }
                
                #galaxy-map.opening {
                    animation: mapFadeIn 0.3s ease-out;
                }
                
                #galaxy-map.closing {
                    animation: mapFadeOut 0.3s ease-in;
                }
                
                #galaxy-map button:hover {
                    filter: brightness(1.2);
                }
            `;
            document.head.appendChild(style);
        }
    }
    
    setupEventListeners() {
        // ズームボタン
        this.mapContainer.querySelector('#zoom-in').onclick = () => {
            this.zoomLevel = Math.min(this.zoomLevel * 1.2, this.maxZoom);
            this.draw();
        };
        
        this.mapContainer.querySelector('#zoom-out').onclick = () => {
            this.zoomLevel = Math.max(this.zoomLevel * 0.8, this.minZoom);
            this.draw();
        };
        
        // マウスホイールでズーム
        this.mapCanvas.addEventListener('wheel', (e) => {
            e.preventDefault();
            const delta = e.deltaY > 0 ? 0.9 : 1.1;
            this.zoomLevel = Math.max(this.minZoom, Math.min(this.maxZoom, this.zoomLevel * delta));
            this.draw();
        });
        
        // ドラッグ操作
        this.mapCanvas.addEventListener('mousedown', (e) => {
            this.isDragging = true;
            this.dragStartX = e.clientX;
            this.dragStartY = e.clientY;
            this.dragCameraX = this.cameraX;
            this.dragCameraY = this.cameraY;
            this.mapCanvas.style.cursor = 'grabbing';
        });
        
        window.addEventListener('mousemove', (e) => {
            if (!this.isDragging) return;
            
            const dx = e.clientX - this.dragStartX;
            const dy = e.clientY - this.dragStartY;
            
            this.cameraX = this.dragCameraX - dx / this.zoomLevel;
            this.cameraY = this.dragCameraY - dy / this.zoomLevel;
            
            this.draw();
        });
        
        window.addEventListener('mouseup', () => {
            this.isDragging = false;
            this.mapCanvas.style.cursor = 'grab';
        });
        
        // Mキーでマップ開閉
        window.addEventListener('keydown', (e) => {
            if (e.key.toLowerCase() === 'm' && !this.game.isPaused) {
                if (this.isOpen) {
                    this.close();
                } else {
                    this.open();
                }
            }
        });
    }
    
    open() {
        this.isOpen = true;
        this.mapContainer.style.display = 'block';
        this.mapContainer.classList.add('opening');
        
        // キャンバスサイズ設定
        this.mapCanvas.width = window.innerWidth;
        this.mapCanvas.height = window.innerHeight - 60;
        
        // 現在位置を中心に
        if (this.game.player) {
            this.cameraX = this.game.player.group.position.x;
            this.cameraY = this.game.player.group.position.z;
        }
        
        // ゲームを一時停止
        if (this.game) {
            this.game.isPaused = true;
        }
        
        this.draw();
        
        setTimeout(() => {
            this.mapContainer.classList.remove('opening');
        }, 300);
    }
    
    close() {
        this.mapContainer.classList.add('closing');
        
        setTimeout(() => {
            this.isOpen = false;
            this.mapContainer.style.display = 'none';
            this.mapContainer.classList.remove('closing');
            
            // ゲーム再開
            if (this.game) {
                this.game.isPaused = false;
            }
        }, 300);
    }
    
    draw() {
        const ctx = this.ctx;
        const width = this.mapCanvas.width;
        const height = this.mapCanvas.height;
        
        // クリア
        ctx.clearRect(0, 0, width, height);
        
        // 背景の星
        this.drawStarfield();
        
        // グリッド
        this.drawGrid();
        
        // ゾーン情報を取得
        const zones = this.game.zoneManager?.zones || {};
        
        // 各ゾーンを描画
        Object.values(zones).forEach(zone => {
            if (zone.discovered || this.game.debugMode) {
                this.drawZone(zone);
            }
        });
        
        // 現在のプレイヤー位置
        if (this.game.player) {
            this.drawPlayerPosition();
        }
        
        // 発見済みのアイテムやポイント
        this.drawDiscoveredPoints();
    }
    
    drawStarfield() {
        const ctx = this.ctx;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
        
        // ランダムな星を描画
        for (let i = 0; i < 200; i++) {
            const x = (Math.random() * 10000 - 5000) * this.zoomLevel + this.mapCanvas.width / 2 - this.cameraX * this.zoomLevel;
            const y = (Math.random() * 10000 - 5000) * this.zoomLevel + this.mapCanvas.height / 2 - this.cameraY * this.zoomLevel;
            const size = Math.random() * 2;
            
            ctx.beginPath();
            ctx.arc(x, y, size, 0, Math.PI * 2);
            ctx.fill();
        }
    }
    
    drawGrid() {
        const ctx = this.ctx;
        const gridSize = 500 * this.zoomLevel;
        const centerX = this.mapCanvas.width / 2;
        const centerY = this.mapCanvas.height / 2;
        
        ctx.strokeStyle = 'rgba(100, 100, 100, 0.2)';
        ctx.lineWidth = 1;
        
        // 垂直線
        for (let x = -10; x <= 10; x++) {
            const screenX = centerX + (x * 500 - this.cameraX) * this.zoomLevel;
            ctx.beginPath();
            ctx.moveTo(screenX, 0);
            ctx.lineTo(screenX, this.mapCanvas.height);
            ctx.stroke();
        }
        
        // 水平線
        for (let y = -10; y <= 10; y++) {
            const screenY = centerY + (y * 500 - this.cameraY) * this.zoomLevel;
            ctx.beginPath();
            ctx.moveTo(0, screenY);
            ctx.lineTo(this.mapCanvas.width, screenY);
            ctx.stroke();
        }
    }
    
    drawZone(zone) {
        const ctx = this.ctx;
        const centerX = this.mapCanvas.width / 2;
        const centerY = this.mapCanvas.height / 2;
        
        // ゾーンの位置計算（太陽系の配置）
        const angle = (zone.position - 1) * 0.8; // ラジアン
        const distance = zone.solarDistance * 500; // AU to pixels
        
        const zoneX = Math.cos(angle) * distance;
        const zoneY = Math.sin(angle) * distance;
        
        const screenX = centerX + (zoneX - this.cameraX) * this.zoomLevel;
        const screenY = centerY + (zoneY - this.cameraY) * this.zoomLevel;
        
        // メイン惑星
        const planetRadius = zone.planetData.radius * this.zoomLevel * 0.5;
        
        ctx.beginPath();
        ctx.arc(screenX, screenY, Math.max(planetRadius, 10), 0, Math.PI * 2);
        
        if (zone.discovered) {
            ctx.fillStyle = zone.unlocked ? '#4169E1' : '#666666';
        } else {
            ctx.fillStyle = '#333333';
        }
        ctx.fill();
        
        // ロックアイコン
        if (!zone.unlocked && zone.discovered) {
            ctx.fillStyle = '#ff0000';
            ctx.font = '16px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('🔒', screenX, screenY + 5);
        }
        
        // 惑星名
        ctx.fillStyle = zone.discovered ? '#ffffff' : '#666666';
        ctx.font = `${12 + this.zoomLevel * 2}px Arial`;
        ctx.textAlign = 'center';
        ctx.fillText(zone.discovered ? zone.japaneseName : '???', screenX, screenY + planetRadius + 20);
        
        // 衛星
        if (zone.discovered && zone.satellites) {
            zone.satellites.forEach((satellite, index) => {
                if (satellite.discovered) {
                    const satAngle = (index / zone.satellites.length) * Math.PI * 2;
                    const satDistance = satellite.distance * this.zoomLevel * 0.3;
                    const satX = screenX + Math.cos(satAngle) * satDistance;
                    const satY = screenY + Math.sin(satAngle) * satDistance;
                    
                    ctx.beginPath();
                    ctx.arc(satX, satY, 5 * this.zoomLevel, 0, Math.PI * 2);
                    ctx.fillStyle = '#808080';
                    ctx.fill();
                    
                    ctx.font = '10px Arial';
                    ctx.fillText(satellite.name, satX, satY + 15);
                }
            });
        }
    }
    
    drawPlayerPosition() {
        const ctx = this.ctx;
        const centerX = this.mapCanvas.width / 2;
        const centerY = this.mapCanvas.height / 2;
        
        const playerX = this.game.player.group.position.x;
        const playerZ = this.game.player.group.position.z;
        
        const screenX = centerX + (playerX - this.cameraX) * this.zoomLevel;
        const screenY = centerY + (playerZ - this.cameraY) * this.zoomLevel;
        
        // プレイヤーマーカー（三角形）
        ctx.fillStyle = '#ffaa00';
        ctx.beginPath();
        ctx.moveTo(screenX, screenY - 10);
        ctx.lineTo(screenX - 8, screenY + 8);
        ctx.lineTo(screenX + 8, screenY + 8);
        ctx.closePath();
        ctx.fill();
        
        // パルスエフェクト
        const time = Date.now() * 0.001;
        const pulseSize = 20 + Math.sin(time * 3) * 10;
        
        ctx.strokeStyle = 'rgba(255, 170, 0, 0.5)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(screenX, screenY, pulseSize, 0, Math.PI * 2);
        ctx.stroke();
    }
    
    drawDiscoveredPoints() {
        // 将来の拡張用：発見したポイントやイベントを表示
    }
    
    addDiscoveredLocation(name, position) {
        this.discoveredLocations.add({
            name: name,
            position: position,
            discoveredAt: Date.now()
        });
    }
}