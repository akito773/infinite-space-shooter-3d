export class Minimap {
    constructor() {
        this.canvas = document.getElementById('minimap-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.minimapElement = document.querySelector('.minimap');
        
        // ズームレベル（0: 小, 1: 中, 2: 大）
        this.zoomLevel = 1;
        this.zoomSizes = [150, 200, 250];
        this.zoomScales = [0.3, 0.2, 0.15];
        
        // キャンバスサイズ設定
        this.setZoom(this.zoomLevel);
        
        // レーダースイープ角度
        this.sweepAngle = 0;
        
        // UI要素を作成
        this.createControls();
        
        // イベントリスナー
        this.setupEventListeners();
    }

    update(player, enemies, planets, stations, items, asteroidFields, missionTarget = null) {
        // キャンバスクリア
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // レーダースイープ効果
        this.drawRadarSweep();
        
        // 中心の十字線
        this.drawCrosshair();
        
        // プレイヤー位置を中心とする
        const playerPos = player.group.position;
        
        // 小惑星帯を描画（最初に描画して背景に）
        if (asteroidFields) {
            asteroidFields.forEach(field => {
                this.drawAsteroidField(field, playerPos);
            });
        }
        
        // 惑星を描画
        planets.forEach(planet => {
            this.drawObject(
                planet.mesh.position,
                playerPos,
                planet.radius * 0.5,
                '#0088ff',
                'circle',
                planet.name
            );
        });
        
        // ステーションを描画
        stations.forEach(station => {
            const isTarget = missionTarget && missionTarget.type === 'station' && missionTarget.object === station;
            this.drawObject(
                station.group.position,
                playerPos,
                8,
                isTarget ? '#ffff00' : '#00ffff',
                'square',
                station.name,
                isTarget
            );
        });
        
        // 敵を描画
        enemies.forEach(enemy => {
            if (enemy.isAlive) {
                this.drawObject(
                    enemy.group.position,
                    playerPos,
                    4,
                    '#ff0000',
                    'triangle'
                );
            }
        });
        
        // アイテムを描画
        items.forEach(item => {
            if (!item.collected) {
                this.drawObject(
                    item.group.position,
                    playerPos,
                    3,
                    '#ffff00',
                    'diamond'
                );
            }
        });
        
        // プレイヤーを中心に描画
        this.drawPlayer();
        
        // 距離リング
        this.drawDistanceRings();
    }
    
    drawAsteroidField(field, playerPos) {
        // 小惑星帯の中心位置
        const relX = field.center.x - playerPos.x;
        const relZ = field.center.z - playerPos.z;
        
        const distance = Math.sqrt(relX * relX + relZ * relZ);
        if (distance > this.maxRange + field.radius) return;
        
        const mapX = this.centerX + relX * this.scale;
        const mapY = this.centerY + relZ * this.scale;
        
        // 小惑星帯のエリアを描画
        this.ctx.save();
        this.ctx.globalAlpha = 0.3;
        this.ctx.strokeStyle = '#ff6600';
        this.ctx.fillStyle = 'rgba(255, 102, 0, 0.1)';
        
        // 外側の円
        this.ctx.beginPath();
        this.ctx.arc(mapX, mapY, field.radius * this.scale, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.stroke();
        
        // 内側の円（ドーナツ状）
        this.ctx.globalCompositeOperation = 'destination-out';
        this.ctx.beginPath();
        this.ctx.arc(mapX, mapY, field.radius * this.scale * 0.5, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.restore();
        
        // 危険マーク
        if (distance < field.radius + 100) {
            this.ctx.fillStyle = '#ff6600';
            this.ctx.font = 'bold 12px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('⚠', mapX, mapY);
        }
    }

    drawRadarSweep() {
        // レーダースイープライン
        this.sweepAngle += 0.02;
        
        const gradient = this.ctx.createRadialGradient(
            this.centerX, this.centerY, 0,
            this.centerX, this.centerY, 100
        );
        gradient.addColorStop(0, 'rgba(0, 255, 255, 0.3)');
        gradient.addColorStop(1, 'rgba(0, 255, 255, 0)');
        
        this.ctx.save();
        this.ctx.translate(this.centerX, this.centerY);
        this.ctx.rotate(this.sweepAngle);
        
        this.ctx.beginPath();
        this.ctx.moveTo(0, 0);
        this.ctx.arc(0, 0, 100, -0.2, 0.2);
        this.ctx.closePath();
        
        this.ctx.fillStyle = gradient;
        this.ctx.fill();
        
        this.ctx.restore();
    }

    drawCrosshair() {
        this.ctx.strokeStyle = 'rgba(0, 255, 255, 0.3)';
        this.ctx.lineWidth = 1;
        
        // 横線
        this.ctx.beginPath();
        this.ctx.moveTo(0, this.centerY);
        this.ctx.lineTo(this.canvas.width, this.centerY);
        this.ctx.stroke();
        
        // 縦線
        this.ctx.beginPath();
        this.ctx.moveTo(this.centerX, 0);
        this.ctx.lineTo(this.centerX, this.canvas.height);
        this.ctx.stroke();
    }

    drawDistanceRings() {
        this.ctx.strokeStyle = 'rgba(0, 255, 255, 0.2)';
        this.ctx.lineWidth = 1;
        
        // 距離リング（100, 200, 300単位）
        for (let i = 1; i <= 3; i++) {
            this.ctx.beginPath();
            this.ctx.arc(this.centerX, this.centerY, i * 30, 0, Math.PI * 2);
            this.ctx.stroke();
        }
    }

    drawObject(objectPos, playerPos, size, color, shape, label, highlight = false) {
        // 相対位置を計算
        const relX = objectPos.x - playerPos.x;
        const relZ = objectPos.z - playerPos.z;
        
        // 距離チェック
        const distance = Math.sqrt(relX * relX + relZ * relZ);
        if (distance > this.maxRange) return;
        
        // ミニマップ上の位置
        const mapX = this.centerX + relX * this.scale;
        const mapY = this.centerY + relZ * this.scale;
        
        // 範囲外チェック
        const distFromCenter = Math.sqrt(
            Math.pow(mapX - this.centerX, 2) + 
            Math.pow(mapY - this.centerY, 2)
        );
        if (distFromCenter > 95) return;
        
        // ハイライト表示
        if (highlight) {
            // 黄色い脈動する円を描画
            const pulseSize = size + Math.sin(Date.now() * 0.005) * 3;
            this.ctx.strokeStyle = '#ffff00';
            this.ctx.lineWidth = 3;
            this.ctx.beginPath();
            this.ctx.arc(mapX, mapY, pulseSize + 5, 0, Math.PI * 2);
            this.ctx.stroke();
        }
        
        // オブジェクトを描画
        this.ctx.fillStyle = color;
        this.ctx.strokeStyle = color;
        this.ctx.lineWidth = 2;
        
        switch (shape) {
            case 'circle':
                this.ctx.beginPath();
                this.ctx.arc(mapX, mapY, size, 0, Math.PI * 2);
                this.ctx.fill();
                break;
                
            case 'square':
                this.ctx.fillRect(mapX - size/2, mapY - size/2, size, size);
                break;
                
            case 'triangle':
                this.ctx.beginPath();
                this.ctx.moveTo(mapX, mapY - size);
                this.ctx.lineTo(mapX - size, mapY + size);
                this.ctx.lineTo(mapX + size, mapY + size);
                this.ctx.closePath();
                this.ctx.fill();
                break;
                
            case 'diamond':
                this.ctx.beginPath();
                this.ctx.moveTo(mapX, mapY - size);
                this.ctx.lineTo(mapX + size, mapY);
                this.ctx.lineTo(mapX, mapY + size);
                this.ctx.lineTo(mapX - size, mapY);
                this.ctx.closePath();
                this.ctx.fill();
                break;
        }
        
        // ラベル表示（惑星とステーションのみ）
        if (label) {
            this.ctx.font = '10px Arial';
            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(label, mapX, mapY + size + 12);
        }
    }

    drawPlayer() {
        // プレイヤーは常に中心
        this.ctx.fillStyle = '#00ff00';
        this.ctx.beginPath();
        this.ctx.moveTo(this.centerX, this.centerY - 6);
        this.ctx.lineTo(this.centerX - 4, this.centerY + 4);
        this.ctx.lineTo(this.centerX, this.centerY + 2);
        this.ctx.lineTo(this.centerX + 4, this.centerY + 4);
        this.ctx.closePath();
        this.ctx.fill();
        
        // プレイヤーの向き
        this.ctx.strokeStyle = '#00ff00';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.moveTo(this.centerX, this.centerY);
        this.ctx.lineTo(this.centerX, this.centerY - 10);
        this.ctx.stroke();
    }
    
    createControls() {
        // ズームボタンコンテナ
        const controls = document.createElement('div');
        controls.style.cssText = `
            position: absolute;
            top: -30px;
            right: 0;
            display: flex;
            gap: 5px;
        `;
        
        // ズームボタン
        const zoomIn = document.createElement('button');
        zoomIn.textContent = '+';
        zoomIn.style.cssText = `
            width: 25px;
            height: 25px;
            background: rgba(0, 100, 200, 0.8);
            border: 1px solid #00ffff;
            color: white;
            cursor: pointer;
            border-radius: 3px;
            font-size: 16px;
            padding: 0;
        `;
        
        const zoomOut = document.createElement('button');
        zoomOut.textContent = '-';
        zoomOut.style.cssText = zoomIn.style.cssText;
        
        zoomIn.onclick = () => this.zoomIn();
        zoomOut.onclick = () => this.zoomOut();
        
        controls.appendChild(zoomOut);
        controls.appendChild(zoomIn);
        this.minimapElement.appendChild(controls);
    }
    
    setupEventListeners() {
        // マウスホイールでズーム
        this.minimapElement.addEventListener('wheel', (e) => {
            e.preventDefault();
            if (e.deltaY < 0) {
                this.zoomIn();
            } else {
                this.zoomOut();
            }
        });
        
        // +/-キーでズーム
        document.addEventListener('keydown', (e) => {
            if (e.key === '+' || e.key === '=') {
                this.zoomIn();
            } else if (e.key === '-' || e.key === '_') {
                this.zoomOut();
            }
        });
    }
    
    setZoom(level) {
        this.zoomLevel = Math.max(0, Math.min(2, level));
        const size = this.zoomSizes[this.zoomLevel];
        
        // サイズ更新
        this.canvas.width = size;
        this.canvas.height = size;
        this.minimapElement.style.width = size + 'px';
        this.minimapElement.style.height = size + 'px';
        
        // 中心座標更新
        this.centerX = size / 2;
        this.centerY = size / 2;
        
        // スケール更新
        this.scale = this.zoomScales[this.zoomLevel];
        this.maxRange = 500 / this.scale;
    }
    
    zoomIn() {
        this.setZoom(this.zoomLevel + 1);
    }
    
    zoomOut() {
        this.setZoom(this.zoomLevel - 1);
    }
}