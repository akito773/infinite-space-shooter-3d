import * as THREE from 'three';

export class HitMarkers {
    constructor(scene, camera) {
        this.scene = scene;
        this.camera = camera;
        this.markers = [];
        this.markerPool = [];
        this.maxMarkers = 20;
        
        // ヒットマーカーの設定
        this.markerDuration = 0.3;
        this.markerSize = 1.5;
        
        // 2D UI用のコンテナ
        this.uiContainer = document.createElement('div');
        this.uiContainer.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 100;
        `;
        document.body.appendChild(this.uiContainer);
        
        this.initializeMarkerPool();
    }
    
    initializeMarkerPool() {
        // 3Dヒットマーカー（ワールド空間）
        const geometry = new THREE.PlaneGeometry(this.markerSize, this.markerSize);
        
        for (let i = 0; i < this.maxMarkers; i++) {
            // ワールド空間のマーカー
            const material = new THREE.MeshBasicMaterial({
                transparent: true,
                opacity: 1,
                side: THREE.DoubleSide,
                depthTest: false,
                depthWrite: false
            });
            
            // ヒットマーカーのテクスチャを作成
            const canvas = this.createMarkerTexture();
            material.map = new THREE.CanvasTexture(canvas);
            
            const marker = new THREE.Mesh(geometry, material);
            marker.visible = false;
            marker.renderOrder = 999; // 常に最前面
            
            marker.userData = {
                lifetime: 0,
                active: false,
                type: 'normal'
            };
            
            this.scene.add(marker);
            this.markerPool.push(marker);
            
            // 2D UIマーカー（画面中央）
            const uiMarker = document.createElement('div');
            uiMarker.className = 'hit-marker';
            uiMarker.style.cssText = `
                position: absolute;
                width: 40px;
                height: 40px;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                pointer-events: none;
                display: none;
            `;
            uiMarker.innerHTML = this.createCrosshairSVG();
            this.uiContainer.appendChild(uiMarker);
        }
    }
    
    createMarkerTexture(type = 'normal') {
        const canvas = document.createElement('canvas');
        canvas.width = 128;
        canvas.height = 128;
        const ctx = canvas.getContext('2d');
        
        // クリア
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        const size = 40;
        
        // タイプに応じた色
        let color = '#ffffff';
        let strokeWidth = 3;
        
        switch (type) {
            case 'critical':
                color = '#ffff00';
                strokeWidth = 4;
                break;
            case 'kill':
                color = '#ff0000';
                strokeWidth = 5;
                break;
            case 'headshot':
                color = '#ff00ff';
                strokeWidth = 4;
                break;
        }
        
        // X形のヒットマーカー
        ctx.strokeStyle = color;
        ctx.lineWidth = strokeWidth;
        ctx.lineCap = 'round';
        
        // 影
        ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
        ctx.shadowBlur = 5;
        
        ctx.beginPath();
        ctx.moveTo(centerX - size, centerY - size);
        ctx.lineTo(centerX + size, centerY + size);
        ctx.moveTo(centerX + size, centerY - size);
        ctx.lineTo(centerX - size, centerY + size);
        ctx.stroke();
        
        // 中央の点
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(centerX, centerY, 3, 0, Math.PI * 2);
        ctx.fill();
        
        return canvas;
    }
    
    createCrosshairSVG() {
        return `
            <svg width="40" height="40" viewBox="0 0 40 40" style="filter: drop-shadow(0 0 2px rgba(0,0,0,0.8));">
                <g stroke="white" stroke-width="2" fill="none" opacity="0">
                    <line x1="5" y1="5" x2="15" y2="15" class="hit-line-1"/>
                    <line x1="35" y1="5" x2="25" y2="15" class="hit-line-2"/>
                    <line x1="5" y1="35" x2="15" y2="25" class="hit-line-3"/>
                    <line x1="35" y1="35" x2="25" y2="25" class="hit-line-4"/>
                    <circle cx="20" cy="20" r="3" fill="white"/>
                </g>
            </svg>
        `;
    }
    
    getMarker() {
        for (const marker of this.markerPool) {
            if (!marker.visible) {
                return marker;
            }
        }
        return null;
    }
    
    spawn(position, type = 'normal', showScreenMarker = true) {
        // ワールド空間のマーカー
        const marker = this.getMarker();
        if (!marker) return;
        
        // テクスチャを更新
        const canvas = this.createMarkerTexture(type);
        marker.material.map = new THREE.CanvasTexture(canvas);
        marker.material.map.needsUpdate = true;
        
        // 位置設定
        marker.position.copy(position);
        marker.lookAt(this.camera.position);
        marker.visible = true;
        
        const userData = marker.userData;
        userData.active = true;
        userData.lifetime = 0;
        userData.type = type;
        
        this.markers.push(marker);
        
        // 画面中央のマーカーアニメーション
        if (showScreenMarker) {
            this.showScreenMarker(type);
        }
    }
    
    showScreenMarker(type) {
        // 使用可能な2Dマーカーを探す
        const uiMarkers = this.uiContainer.querySelectorAll('.hit-marker');
        for (const uiMarker of uiMarkers) {
            if (uiMarker.style.display === 'none') {
                uiMarker.style.display = 'block';
                
                const svg = uiMarker.querySelector('svg g');
                
                // タイプに応じた色
                let color = 'white';
                switch (type) {
                    case 'critical': color = '#ffff00'; break;
                    case 'kill': color = '#ff0000'; break;
                    case 'headshot': color = '#ff00ff'; break;
                }
                
                svg.setAttribute('stroke', color);
                
                // アニメーション
                svg.style.transition = 'none';
                svg.setAttribute('opacity', '1');
                svg.style.transform = 'scale(1.5)';
                
                setTimeout(() => {
                    svg.style.transition = 'all 0.3s ease-out';
                    svg.style.transform = 'scale(1)';
                    svg.setAttribute('opacity', '0');
                }, 10);
                
                setTimeout(() => {
                    uiMarker.style.display = 'none';
                }, 300);
                
                break;
            }
        }
    }
    
    update(deltaTime) {
        this.markers = this.markers.filter((marker) => {
            const userData = marker.userData;
            
            if (!userData.active) return false;
            
            userData.lifetime += deltaTime;
            
            if (userData.lifetime >= this.markerDuration) {
                marker.visible = false;
                userData.active = false;
                return false;
            }
            
            // フェードアウト
            const lifeRatio = userData.lifetime / this.markerDuration;
            marker.material.opacity = 1 - lifeRatio;
            
            // スケールアニメーション
            const scale = 1 + lifeRatio * 0.5;
            marker.scale.set(scale, scale, scale);
            
            // カメラの方を向く
            marker.lookAt(this.camera.position);
            
            return true;
        });
    }
    
    // ヒット検出と表示を統合したメソッド
    registerHit(hitPosition, damage, targetHealth, targetMaxHealth) {
        let type = 'normal';
        
        // クリティカルヒット判定
        if (Math.random() < 0.1) {
            type = 'critical';
        }
        
        // キル判定
        if (targetHealth - damage <= 0) {
            type = 'kill';
        }
        
        this.spawn(hitPosition, type);
        
        return type;
    }
    
    dispose() {
        // 3Dマーカーのクリーンアップ
        this.markerPool.forEach((marker) => {
            this.scene.remove(marker);
            marker.material.map?.dispose();
            marker.material.dispose();
            marker.geometry.dispose();
        });
        this.markerPool = [];
        this.markers = [];
        
        // 2D UIのクリーンアップ
        if (this.uiContainer && this.uiContainer.parentNode) {
            this.uiContainer.parentNode.removeChild(this.uiContainer);
        }
    }
}