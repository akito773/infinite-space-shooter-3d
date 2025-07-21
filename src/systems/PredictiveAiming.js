import * as THREE from 'three';

export class PredictiveAiming {
    constructor(scene, camera) {
        this.scene = scene;
        this.camera = camera;
        this.enabled = true;
        this.leadIndicators = new Map();
        this.indicatorPool = [];
        this.maxIndicators = 10;
        
        // 予測照準の設定
        this.predictionTime = 1.0; // 何秒先を予測するか
        this.indicatorColor = 0x00ff00;
        this.indicatorSize = 0.5;
        
        // インジケーターのプールを初期化
        this.initializeIndicatorPool();
    }
    
    initializeIndicatorPool() {
        const geometry = new THREE.RingGeometry(0.5, 0.6, 8);
        const material = new THREE.MeshBasicMaterial({
            color: this.indicatorColor,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.8
        });
        
        for (let i = 0; i < this.maxIndicators; i++) {
            const indicator = new THREE.Mesh(geometry, material);
            indicator.visible = false;
            this.scene.add(indicator);
            this.indicatorPool.push(indicator);
        }
    }
    
    getIndicator() {
        for (const indicator of this.indicatorPool) {
            if (!indicator.visible) {
                return indicator;
            }
        }
        return null;
    }
    
    releaseIndicator(indicator) {
        if (indicator) {
            indicator.visible = false;
            indicator.scale.set(1, 1, 1);
        }
    }
    
    calculateLeadPosition(targetPosition, targetVelocity, projectileSpeed, shooterPosition) {
        // ターゲットまでの距離
        const distance = shooterPosition.distanceTo(targetPosition);
        
        // 弾丸の到達時間を計算（簡易版）
        let timeToHit = distance / projectileSpeed;
        
        // より正確な計算のために反復計算
        for (let i = 0; i < 3; i++) {
            const predictedPos = targetPosition.clone().add(
                targetVelocity.clone().multiplyScalar(timeToHit)
            );
            const newDistance = shooterPosition.distanceTo(predictedPos);
            timeToHit = newDistance / projectileSpeed;
        }
        
        // 予測位置を計算
        const leadPosition = targetPosition.clone().add(
            targetVelocity.clone().multiplyScalar(timeToHit)
        );
        
        return {
            position: leadPosition,
            timeToHit: timeToHit
        };
    }
    
    update(enemies, player, currentWeapon) {
        if (!this.enabled || !currentWeapon) return;
        
        // 古いインジケーターをクリア
        this.leadIndicators.forEach((indicator) => {
            this.releaseIndicator(indicator);
        });
        this.leadIndicators.clear();
        
        // プレイヤーの位置
        const playerPos = player.group.position;
        
        // 現在の武器の弾速
        const projectileSpeed = currentWeapon.speed || 100;
        
        // 各敵に対して予測照準を計算
        enemies.forEach((enemy) => {
            if (!enemy.isAlive || !enemy.group) return;
            
            const enemyPos = enemy.group.position;
            const distance = playerPos.distanceTo(enemyPos);
            
            // 一定距離内の敵のみ表示
            if (distance > 200) return;
            
            // 敵の速度ベクトル（簡易的に前フレームとの差分から計算）
            if (!enemy.lastPosition) {
                enemy.lastPosition = enemyPos.clone();
                return;
            }
            
            const velocity = enemyPos.clone().sub(enemy.lastPosition);
            enemy.lastPosition = enemyPos.clone();
            
            // 速度がある場合のみ予測照準を表示
            if (velocity.length() > 0.1) {
                const lead = this.calculateLeadPosition(
                    enemyPos,
                    velocity.multiplyScalar(60), // フレームレートを考慮
                    projectileSpeed,
                    playerPos
                );
                
                // インジケーターを表示
                const indicator = this.getIndicator();
                if (indicator) {
                    indicator.position.copy(lead.position);
                    indicator.lookAt(this.camera.position);
                    
                    // 距離に応じてサイズを調整
                    const scale = Math.max(0.5, Math.min(2, distance / 50));
                    indicator.scale.set(scale, scale, scale);
                    
                    // 到達時間に応じて色を変更
                    const hue = Math.max(0, Math.min(120, 120 - lead.timeToHit * 60)) / 360;
                    indicator.material.color.setHSL(hue, 1, 0.5);
                    
                    indicator.visible = true;
                    this.leadIndicators.set(enemy, indicator);
                }
            }
        });
    }
    
    toggle() {
        this.enabled = !this.enabled;
        if (!this.enabled) {
            this.leadIndicators.forEach((indicator) => {
                this.releaseIndicator(indicator);
            });
            this.leadIndicators.clear();
        }
        return this.enabled;
    }
    
    dispose() {
        this.indicatorPool.forEach((indicator) => {
            this.scene.remove(indicator);
            indicator.geometry.dispose();
            indicator.material.dispose();
        });
        this.indicatorPool = [];
        this.leadIndicators.clear();
    }
}