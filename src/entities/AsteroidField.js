import * as THREE from 'three';
import { Asteroid } from './Asteroid.js';

export class AsteroidField {
    constructor(scene, center, config = {}) {
        this.scene = scene;
        this.center = center;
        
        // フィールド設定
        this.radius = config.radius || 150;
        this.density = config.density || 0.5;
        this.asteroidCount = Math.floor(20 * this.density);
        
        this.asteroids = [];
        this.createField();
    }

    createField() {
        // 小惑星ベルトの境界を視覚化
        this.createBoundary();
        
        // 小惑星を生成
        for (let i = 0; i < this.asteroidCount; i++) {
            // ランダムな位置（ドーナツ状に配置）
            const angle = Math.random() * Math.PI * 2;
            const distance = this.radius * 0.5 + Math.random() * this.radius * 0.5;
            const height = (Math.random() - 0.5) * 40;
            
            const position = new THREE.Vector3(
                this.center.x + Math.cos(angle) * distance,
                this.center.y + height,
                this.center.z + Math.sin(angle) * distance
            );
            
            // サイズをランダムに決定
            const sizeRoll = Math.random();
            let size;
            if (sizeRoll < 0.6) {
                size = 'small';
            } else if (sizeRoll < 0.9) {
                size = 'medium';
            } else {
                size = 'large';
            }
            
            const asteroid = new Asteroid(this.scene, position, size);
            this.asteroids.push(asteroid);
        }
        
        // 採掘可能な小惑星を追加（10%の確率）
        const mineableCount = Math.floor(this.asteroidCount * 0.1);
        for (let i = 0; i < mineableCount; i++) {
            this.createMineableAsteroid();
        }
        
        // 警告標識を追加
        this.createWarningSign();
    }

    createBoundary() {
        // 外側のリング（警告エリア）
        const outerRingGeometry = new THREE.TorusGeometry(
            this.radius,
            2,
            8,
            64
        );
        const outerRingMaterial = new THREE.MeshBasicMaterial({
            color: 0xff6600,
            transparent: true,
            opacity: 0.3,
            side: THREE.DoubleSide
        });
        
        this.outerRing = new THREE.Mesh(outerRingGeometry, outerRingMaterial);
        this.outerRing.position.copy(this.center);
        this.outerRing.rotation.x = Math.PI / 2;
        this.scene.add(this.outerRing);
        
        // 内側のリング
        const innerRingGeometry = new THREE.TorusGeometry(
            this.radius * 0.5,
            1,
            8,
            64
        );
        const innerRingMaterial = new THREE.MeshBasicMaterial({
            color: 0xff6600,
            transparent: true,
            opacity: 0.2
        });
        
        this.innerRing = new THREE.Mesh(innerRingGeometry, innerRingMaterial);
        this.innerRing.position.copy(this.center);
        this.innerRing.rotation.x = Math.PI / 2;
        this.scene.add(this.innerRing);
    }

    createWarningSign() {
        // 警告表示用のスプライト
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 128;
        const ctx = canvas.getContext('2d');
        
        // 背景
        ctx.fillStyle = 'rgba(255, 102, 0, 0.8)';
        ctx.fillRect(0, 0, 256, 128);
        
        // 警告テキスト
        ctx.fillStyle = 'white';
        ctx.font = 'bold 24px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('⚠ 小惑星帯 ⚠', 128, 50);
        ctx.font = '16px Arial';
        ctx.fillText('ASTEROID FIELD', 128, 80);
        ctx.fillText('注意して通過してください', 128, 100);
        
        const texture = new THREE.CanvasTexture(canvas);
        const spriteMaterial = new THREE.SpriteMaterial({
            map: texture,
            transparent: true
        });
        
        this.warningSign = new THREE.Sprite(spriteMaterial);
        this.warningSign.position.set(
            this.center.x,
            this.center.y + this.radius * 0.8,
            this.center.z
        );
        this.warningSign.scale.set(80, 40, 1);
        this.scene.add(this.warningSign);
    }

    update(delta, playerPosition, projectiles, camera) {
        // 小惑星の更新
        this.asteroids = this.asteroids.filter(asteroid => {
            if (asteroid.isDestroyed) {
                return false;
            }
            
            asteroid.update(delta);
            
            // プレイヤーとの衝突判定
            if (playerPosition && asteroid.checkCollision(playerPosition, 3)) {
                // プレイヤーにダメージを与える（Game.jsで処理）
                // TODO: Handle player collision in Game.js
                asteroid.destroy();
                return false;
            }
            
            return true;
        });
        
        // 弾丸との衝突判定
        if (projectiles) {
            projectiles.forEach(projectile => {
                this.asteroids.forEach(asteroid => {
                    if (!asteroid.isDestroyed && 
                        asteroid.checkCollision(projectile.mesh.position, 1)) {
                        asteroid.takeDamage(projectile.damage);
                        projectile.destroy();
                        
                        // 小惑星破壊をミッションシステムに通知
                        if (asteroid.isDestroyed && window.game && window.game.missionSystem) {
                            window.game.missionSystem.updateProgress('destroy_asteroid', {});
                        }
                        
                        // アイテムドロップチェック
                        const drops = asteroid.getDrops();
                        if (drops.shouldDrop) {
                            // Game.jsでアイテム生成を処理
                            this.scene.userData.pendingDrops = this.scene.userData.pendingDrops || [];
                            this.scene.userData.pendingDrops.push(drops.position);
                        }
                    }
                });
            });
        }
        
        // 警告サインをカメラに向ける
        if (this.warningSign && camera) {
            this.warningSign.lookAt(camera.position);
        }
        
        // 境界リングの点滅
        const time = Date.now() * 0.001;
        if (this.outerRing) {
            this.outerRing.material.opacity = 0.3 + Math.sin(time * 2) * 0.1;
        }
    }

    checkProximity(position, warningDistance = 50) {
        const distance = position.distanceTo(this.center);
        return distance < this.radius + warningDistance;
    }
    
    createMineableAsteroid() {
        // 採掘可能な小惑星を作成
        if (!window.game || !window.game.miningSystem) return;
        
        const angle = Math.random() * Math.PI * 2;
        const distance = this.radius * 0.5 + Math.random() * this.radius * 0.5;
        const height = (Math.random() - 0.5) * 40;
        
        const position = new THREE.Vector3(
            this.center.x + Math.cos(angle) * distance,
            this.center.y + height,
            this.center.z + Math.sin(angle) * distance
        );
        
        const asteroid = window.game.miningSystem.createMineableAsteroid(position);
        this.asteroids.push(asteroid);
    }
}