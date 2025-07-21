// ターゲティングシステム（ロックオン機能）

import * as THREE from 'three';

export class TargetingSystem {
    constructor(game) {
        this.game = game;
        this.lockedTarget = null;
        this.targetingRange = 150;
        this.lockOnTime = 0;
        this.lockOnDuration = 0.5; // 0.5秒でロック完了
        this.maxLockTargets = 3; // 同時ロック可能数
        this.lockedTargets = [];
        this.autoAimAssist = 0.3; // 自動照準補正の強さ
        
        this.createTargetingUI();
        this.setupControls();
    }
    
    createTargetingUI() {
        // ロックオンレティクル
        this.reticleContainer = document.createElement('div');
        this.reticleContainer.id = 'targeting-reticles';
        this.reticleContainer.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 50;
        `;
        document.body.appendChild(this.reticleContainer);
        
        // スタイル追加
        const style = document.createElement('style');
        style.textContent = `
            .lock-on-reticle {
                position: absolute;
                width: 60px;
                height: 60px;
                border: 2px solid #ff0000;
                border-radius: 50%;
                transform: translate(-50%, -50%);
                animation: pulse 1s infinite;
                pointer-events: none;
            }
            
            .lock-on-reticle.locking {
                border-color: #ffaa00;
                animation: rotate 0.5s linear infinite;
            }
            
            .lock-on-reticle.locked {
                border-color: #00ff00;
                box-shadow: 0 0 20px #00ff00;
            }
            
            .lock-on-reticle::before,
            .lock-on-reticle::after {
                content: '';
                position: absolute;
                background: currentColor;
            }
            
            .lock-on-reticle::before {
                width: 100%;
                height: 2px;
                top: 50%;
                left: 0;
                transform: translateY(-50%);
            }
            
            .lock-on-reticle::after {
                width: 2px;
                height: 100%;
                top: 0;
                left: 50%;
                transform: translateX(-50%);
            }
            
            @keyframes pulse {
                0%, 100% { transform: translate(-50%, -50%) scale(1); }
                50% { transform: translate(-50%, -50%) scale(1.1); }
            }
            
            @keyframes rotate {
                from { transform: translate(-50%, -50%) rotate(0deg); }
                to { transform: translate(-50%, -50%) rotate(360deg); }
            }
            
            .target-info {
                position: absolute;
                background: rgba(0, 0, 0, 0.8);
                color: #00ff00;
                padding: 5px 10px;
                border-radius: 5px;
                font-size: 12px;
                white-space: nowrap;
                transform: translate(-50%, 20px);
            }
        `;
        document.head.appendChild(style);
    }
    
    setupControls() {
        // Qキーでターゲット切り替え
        // Rキーでロックオン
        document.addEventListener('keydown', (e) => {
            if (e.key.toLowerCase() === 'q') {
                this.cycleTarget();
            } else if (e.key.toLowerCase() === 'r') {
                this.toggleLockOn();
            }
        });
        
        // 右クリックでもロックオン
        document.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            this.toggleLockOn();
        });
    }
    
    update(delta) {
        // ロックオン可能なターゲットを探す
        const availableTargets = this.findAvailableTargets();
        
        // ロックオン処理
        if (this.lockedTarget) {
            if (!this.isValidTarget(this.lockedTarget)) {
                this.clearLockOn();
            } else {
                this.updateLockOn(delta);
            }
        }
        
        // マルチロック処理
        this.updateMultiLock(availableTargets);
        
        // UI更新
        this.updateTargetingUI();
        
        // 自動照準補正
        if (this.game.inputManager.isShooting && this.lockedTarget) {
            this.applyAutoAim();
        }
    }
    
    findAvailableTargets() {
        const targets = [];
        const playerPos = this.game.player.group.position;
        
        // 敵機をチェック
        this.game.enemies.forEach(enemy => {
            if (enemy.isAlive) {
                const distance = enemy.group.position.distanceTo(playerPos);
                if (distance <= this.targetingRange) {
                    targets.push({
                        object: enemy,
                        distance: distance,
                        type: 'enemy',
                        priority: this.calculatePriority(enemy, distance)
                    });
                }
            }
        });
        
        // レイドボスもターゲットに含める
        if (this.game.raidBattleSystem?.currentBoss?.isAlive) {
            const boss = this.game.raidBattleSystem.currentBoss;
            const distance = boss.mesh.position.distanceTo(playerPos);
            if (distance <= this.targetingRange * 2) { // ボスは長距離ロック可能
                targets.push({
                    object: boss,
                    distance: distance,
                    type: 'boss',
                    priority: 100 // ボスは最優先
                });
            }
        }
        
        // 優先度でソート
        targets.sort((a, b) => b.priority - a.priority);
        
        return targets;
    }
    
    calculatePriority(enemy, distance) {
        let priority = 50;
        
        // 距離による優先度
        priority -= distance / 10;
        
        // 正面の敵を優先
        const toEnemy = enemy.group.position.clone().sub(this.game.player.group.position).normalize();
        const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(this.game.player.group.quaternion);
        const angle = forward.dot(toEnemy);
        if (angle > 0.7) priority += 20; // 正面70度以内
        
        // 体力が少ない敵を優先
        const healthPercent = enemy.health / enemy.maxHealth;
        if (healthPercent < 0.3) priority += 15;
        
        // エリートタイプは優先度高
        if (enemy.enemyType === 'elite') priority += 10;
        
        return priority;
    }
    
    cycleTarget() {
        const targets = this.findAvailableTargets();
        if (targets.length === 0) return;
        
        if (!this.lockedTarget) {
            // 最初のターゲットをロック
            this.setTarget(targets[0]);
        } else {
            // 次のターゲットに切り替え
            const currentIndex = targets.findIndex(t => t.object === this.lockedTarget.object);
            const nextIndex = (currentIndex + 1) % targets.length;
            this.setTarget(targets[nextIndex]);
        }
    }
    
    toggleLockOn() {
        if (this.lockedTarget) {
            this.clearLockOn();
        } else {
            const targets = this.findAvailableTargets();
            if (targets.length > 0) {
                this.setTarget(targets[0]);
            }
        }
    }
    
    setTarget(targetInfo) {
        this.lockedTarget = targetInfo;
        this.lockOnTime = 0;
        this.game.soundManager?.play('lock_on_start');
    }
    
    clearLockOn() {
        this.lockedTarget = null;
        this.lockOnTime = 0;
        this.lockedTargets = [];
    }
    
    updateLockOn(delta) {
        if (this.lockOnTime < this.lockOnDuration) {
            this.lockOnTime += delta;
            if (this.lockOnTime >= this.lockOnDuration) {
                this.game.soundManager?.play('lock_on_complete');
            }
        }
    }
    
    updateMultiLock(targets) {
        // ホーミングミサイル用のマルチロック
        if (this.game.player.hasHomingMissiles && this.lockedTarget) {
            this.lockedTargets = targets.slice(0, this.maxLockTargets);
        }
    }
    
    isValidTarget(targetInfo) {
        if (!targetInfo || !targetInfo.object) return false;
        
        if (targetInfo.type === 'enemy') {
            return targetInfo.object.isAlive;
        } else if (targetInfo.type === 'boss') {
            return targetInfo.object.isAlive;
        }
        
        return false;
    }
    
    applyAutoAim() {
        if (!this.lockedTarget || this.lockOnTime < this.lockOnDuration) return;
        
        const target = this.lockedTarget.object;
        const targetPos = target.group ? target.group.position : target.mesh.position;
        
        // ターゲットへの方向を計算
        const direction = targetPos.clone().sub(this.game.player.group.position).normalize();
        
        // 現在の向きとの差を計算
        const currentForward = new THREE.Vector3(0, 0, -1).applyQuaternion(this.game.player.group.quaternion);
        
        // 補間して滑らかに照準
        const newDirection = currentForward.lerp(direction, this.autoAimAssist);
        
        // プレイヤーの向きを調整
        const quaternion = new THREE.Quaternion();
        const up = new THREE.Vector3(0, 1, 0);
        const matrix = new THREE.Matrix4();
        matrix.lookAt(this.game.player.group.position, 
                     this.game.player.group.position.clone().add(newDirection), 
                     up);
        quaternion.setFromRotationMatrix(matrix);
        
        this.game.player.group.quaternion.slerp(quaternion, 0.1);
    }
    
    updateTargetingUI() {
        // 既存のレティクルをクリア
        this.reticleContainer.innerHTML = '';
        
        // ロックオン中のターゲット表示
        if (this.lockedTarget) {
            this.createReticle(this.lockedTarget);
        }
        
        // マルチロックターゲット表示
        this.lockedTargets.forEach((target, index) => {
            if (target !== this.lockedTarget) {
                this.createReticle(target, true, index);
            }
        });
    }
    
    createReticle(targetInfo, isSecondary = false, index = 0) {
        const target = targetInfo.object;
        const targetPos = target.group ? target.group.position : target.mesh.position;
        
        // ワールド座標をスクリーン座標に変換
        const screenPos = this.worldToScreen(targetPos);
        if (!screenPos) return;
        
        const reticle = document.createElement('div');
        reticle.className = 'lock-on-reticle';
        
        if (isSecondary) {
            reticle.style.width = '40px';
            reticle.style.height = '40px';
            reticle.style.borderStyle = 'dashed';
        }
        
        if (this.lockOnTime < this.lockOnDuration) {
            reticle.classList.add('locking');
        } else {
            reticle.classList.add('locked');
        }
        
        reticle.style.left = screenPos.x + 'px';
        reticle.style.top = screenPos.y + 'px';
        
        // ターゲット情報表示
        if (!isSecondary && this.lockOnTime >= this.lockOnDuration) {
            const info = document.createElement('div');
            info.className = 'target-info';
            info.textContent = `距離: ${Math.floor(targetInfo.distance)}m`;
            if (targetInfo.type === 'enemy') {
                info.textContent += ` | HP: ${target.health}/${target.maxHealth}`;
            }
            reticle.appendChild(info);
        }
        
        this.reticleContainer.appendChild(reticle);
    }
    
    worldToScreen(position) {
        const pos = position.clone();
        pos.project(this.game.camera);
        
        // カメラの後ろにある場合は表示しない
        if (pos.z > 1) return null;
        
        const widthHalf = window.innerWidth / 2;
        const heightHalf = window.innerHeight / 2;
        
        return {
            x: (pos.x * widthHalf) + widthHalf,
            y: -(pos.y * heightHalf) + heightHalf
        };
    }
    
    // ロックオン中のターゲット取得
    getLockedTarget() {
        if (this.lockedTarget && this.lockOnTime >= this.lockOnDuration) {
            return this.lockedTarget;
        }
        return null;
    }
    
    // マルチロックターゲット取得
    getMultiLockTargets() {
        if (this.lockOnTime >= this.lockOnDuration) {
            return this.lockedTargets;
        }
        return [];
    }
}