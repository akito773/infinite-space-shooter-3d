import * as THREE from 'three';

export class ZoomSystem {
    constructor(camera, player) {
        this.camera = camera;
        this.player = player;
        
        // ズーム設定
        this.normalFOV = 75;
        this.zoomLevel1FOV = 50;
        this.zoomLevel2FOV = 25;
        this.currentFOV = this.normalFOV;
        this.targetFOV = this.normalFOV;
        
        // ズーム状態
        this.zoomLevel = 0; // 0: 通常, 1: ズームレベル1, 2: ズームレベル2
        this.isZooming = false;
        this.zoomSpeed = 0.1;
        
        // プレイヤー速度への影響
        this.normalSpeed = 50;
        this.zoomSpeedMultiplier = 0.5;
        
        // UI要素
        this.createZoomUI();
        
        // スコープオーバーレイ
        this.scopeOverlay = null;
        this.createScopeOverlay();
    }
    
    createZoomUI() {
        // ズームインジケーター
        this.zoomIndicator = document.createElement('div');
        this.zoomIndicator.style.cssText = `
            position: absolute;
            bottom: 100px;
            right: 20px;
            background: rgba(0, 0, 0, 0.7);
            border: 1px solid #0ff;
            border-radius: 5px;
            padding: 10px;
            color: white;
            font-family: Arial, sans-serif;
            font-size: 14px;
            display: none;
            z-index: 100;
        `;
        this.updateZoomUI();
        document.body.appendChild(this.zoomIndicator);
        
        // 照準線
        this.crosshair = document.createElement('div');
        this.crosshair.style.cssText = `
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 2px;
            height: 2px;
            background: none;
            pointer-events: none;
            z-index: 101;
        `;
        this.crosshair.innerHTML = `
            <svg width="60" height="60" style="position: absolute; top: -30px; left: -30px;">
                <g stroke="rgba(0, 255, 255, 0.8)" stroke-width="1" fill="none">
                    <!-- 水平線 -->
                    <line x1="0" y1="30" x2="20" y2="30"/>
                    <line x1="40" y1="30" x2="60" y2="30"/>
                    <!-- 垂直線 -->
                    <line x1="30" y1="0" x2="30" y2="20"/>
                    <line x1="30" y1="40" x2="30" y2="60"/>
                    <!-- 中央の点 -->
                    <circle cx="30" cy="30" r="1" fill="rgba(0, 255, 255, 0.8)"/>
                </g>
            </svg>
        `;
        document.body.appendChild(this.crosshair);
    }
    
    createScopeOverlay() {
        // スコープオーバーレイ（ズームレベル2用）
        this.scopeOverlay = document.createElement('div');
        this.scopeOverlay.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            display: none;
            z-index: 99;
            background: radial-gradient(circle at center, 
                transparent 30%, 
                rgba(0, 0, 0, 0.3) 35%,
                rgba(0, 0, 0, 0.8) 45%,
                rgba(0, 0, 0, 0.95) 60%,
                black 70%
            );
        `;
        
        // スコープのレティクル
        const reticle = document.createElement('div');
        reticle.style.cssText = `
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 400px;
            height: 400px;
        `;
        reticle.innerHTML = `
            <svg width="400" height="400" style="opacity: 0.5;">
                <g stroke="rgba(0, 255, 255, 0.6)" stroke-width="1" fill="none">
                    <!-- 外側の円 -->
                    <circle cx="200" cy="200" r="180" stroke-width="2"/>
                    <!-- 内側の円 -->
                    <circle cx="200" cy="200" r="100"/>
                    <circle cx="200" cy="200" r="50"/>
                    
                    <!-- 十字線 -->
                    <line x1="0" y1="200" x2="400" y2="200" stroke-width="0.5"/>
                    <line x1="200" y1="0" x2="200" y2="400" stroke-width="0.5"/>
                    
                    <!-- 距離マーカー -->
                    <line x1="200" y1="120" x2="200" y2="130"/>
                    <line x1="200" y1="270" x2="200" y2="280"/>
                    <line x1="120" y1="200" x2="130" y2="200"/>
                    <line x1="270" y1="200" x2="280" y2="200"/>
                    
                    <!-- 風向きインジケーター（装飾） -->
                    <path d="M 190 50 L 200 30 L 210 50" stroke-width="2"/>
                </g>
                <!-- 距離目盛り -->
                <text x="210" y="125" fill="rgba(0, 255, 255, 0.6)" font-size="10">100m</text>
                <text x="210" y="275" fill="rgba(0, 255, 255, 0.6)" font-size="10">-100m</text>
            </svg>
        `;
        
        this.scopeOverlay.appendChild(reticle);
        document.body.appendChild(this.scopeOverlay);
    }
    
    updateZoomUI() {
        const zoomText = [
            'ズーム: OFF',
            'ズーム: 1.5x',
            'ズーム: 3.0x'
        ];
        
        const speedText = this.isZooming ? 
            `移動速度: ${Math.round(this.normalSpeed * this.zoomSpeedMultiplier)}%` : 
            `移動速度: 100%`;
        
        this.zoomIndicator.innerHTML = `
            <div>${zoomText[this.zoomLevel]}</div>
            <div style="font-size: 12px; color: #0ff;">${speedText}</div>
            <div style="font-size: 10px; color: #888; margin-top: 5px;">Shift: ズーム切替</div>
        `;
    }
    
    toggleZoom() {
        // ズームレベルを循環
        this.zoomLevel = (this.zoomLevel + 1) % 3;
        
        // ターゲットFOVを設定
        switch (this.zoomLevel) {
            case 0:
                this.targetFOV = this.normalFOV;
                this.isZooming = false;
                break;
            case 1:
                this.targetFOV = this.zoomLevel1FOV;
                this.isZooming = true;
                break;
            case 2:
                this.targetFOV = this.zoomLevel2FOV;
                this.isZooming = true;
                break;
        }
        
        // UI更新
        this.updateZoomUI();
        this.zoomIndicator.style.display = this.isZooming ? 'block' : 'none';
        
        // スコープオーバーレイ
        this.scopeOverlay.style.display = this.zoomLevel === 2 ? 'block' : 'none';
        
        // クロスヘアの表示
        this.crosshair.style.display = this.isZooming ? 'block' : 'none';
        
        // プレイヤーの速度を調整
        if (this.player) {
            this.player.speed = this.isZooming ? 
                this.normalSpeed * this.zoomSpeedMultiplier : 
                this.normalSpeed;
        }
    }
    
    update(deltaTime) {
        // スムーズなFOV遷移
        if (Math.abs(this.currentFOV - this.targetFOV) > 0.1) {
            this.currentFOV += (this.targetFOV - this.currentFOV) * this.zoomSpeed;
            this.camera.fov = this.currentFOV;
            this.camera.updateProjectionMatrix();
        }
        
        // ズーム中の追加エフェクト
        if (this.isZooming && this.zoomLevel === 2) {
            // スコープの揺れ（呼吸エフェクト）
            const time = Date.now() * 0.001;
            const breathX = Math.sin(time * 2) * 0.5;
            const breathY = Math.cos(time * 1.5) * 0.5;
            
            if (this.scopeOverlay.firstChild) {
                this.scopeOverlay.firstChild.style.transform = 
                    `translate(calc(-50% + ${breathX}px), calc(-50% + ${breathY}px))`;
            }
        }
    }
    
    // ズーム中の感度調整
    getMouseSensitivityMultiplier() {
        switch (this.zoomLevel) {
            case 0: return 1.0;
            case 1: return 0.6;
            case 2: return 0.3;
            default: return 1.0;
        }
    }
    
    // ズーム状態を取得
    getZoomInfo() {
        return {
            level: this.zoomLevel,
            isZooming: this.isZooming,
            fov: this.currentFOV,
            sensitivityMultiplier: this.getMouseSensitivityMultiplier()
        };
    }
    
    dispose() {
        // UI要素のクリーンアップ
        if (this.zoomIndicator && this.zoomIndicator.parentNode) {
            this.zoomIndicator.parentNode.removeChild(this.zoomIndicator);
        }
        if (this.crosshair && this.crosshair.parentNode) {
            this.crosshair.parentNode.removeChild(this.crosshair);
        }
        if (this.scopeOverlay && this.scopeOverlay.parentNode) {
            this.scopeOverlay.parentNode.removeChild(this.scopeOverlay);
        }
        
        // カメラをリセット
        this.camera.fov = this.normalFOV;
        this.camera.updateProjectionMatrix();
        
        // プレイヤー速度をリセット
        if (this.player) {
            this.player.speed = this.normalSpeed;
        }
    }
}