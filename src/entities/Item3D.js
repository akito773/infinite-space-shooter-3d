import * as THREE from 'three';

export class Item3D {
    constructor(scene, position, type) {
        this.scene = scene;
        this.position = position;
        this.type = type || this.getRandomType();
        this.collected = false;
        
        // アイテムの有効期限（30秒）
        this.lifeTime = 30000; // ミリ秒
        this.spawnTime = Date.now();
        this.isExpiring = false;
        
        this.createMesh();
        this.createEffects();
        this.setValue();
    }

    getRandomType() {
        const types = ['health', 'energy', 'score', 'powerup', 'ammo_secondary', 'ammo_special', 'weapon_upgrade'];
        const weights = [25, 20, 30, 10, 5, 5, 5]; // 出現確率
        
        const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
        let random = Math.random() * totalWeight;
        
        for (let i = 0; i < types.length; i++) {
            random -= weights[i];
            if (random <= 0) {
                return types[i];
            }
        }
        
        return types[0];
    }

    createMesh() {
        this.group = new THREE.Group();
        
        // アイテムの形状とマテリアル
        let geometry, material, color;
        
        switch (this.type) {
            case 'health':
                // 赤い十字（回復アイテム）
                color = 0xff0000;
                geometry = new THREE.BoxGeometry(1, 3, 1);
                const crossH = new THREE.Mesh(geometry, new THREE.MeshPhongMaterial({ 
                    color: color,
                    emissive: color,
                    emissiveIntensity: 0.5
                }));
                
                const crossV = new THREE.Mesh(
                    new THREE.BoxGeometry(3, 1, 1),
                    new THREE.MeshPhongMaterial({ 
                        color: color,
                        emissive: color,
                        emissiveIntensity: 0.5
                    })
                );
                
                this.group.add(crossH);
                this.group.add(crossV);
                break;
                
            case 'energy':
                // 青い結晶（エネルギー）
                color = 0x00ffff;
                geometry = new THREE.OctahedronGeometry(2);
                material = new THREE.MeshPhongMaterial({
                    color: color,
                    emissive: color,
                    emissiveIntensity: 0.5,
                    transparent: true,
                    opacity: 0.8
                });
                const crystal = new THREE.Mesh(geometry, material);
                crystal.scale.y = 1.5;
                this.group.add(crystal);
                break;
                
            case 'score':
                // 黄色い星（スコア）
                color = 0xffff00;
                geometry = new THREE.ConeGeometry(1.5, 2, 5);
                material = new THREE.MeshPhongMaterial({
                    color: color,
                    emissive: color,
                    emissiveIntensity: 0.5
                });
                
                // 2つの円錐で星型を作る
                const star1 = new THREE.Mesh(geometry, material);
                const star2 = new THREE.Mesh(geometry, material);
                star2.rotation.z = Math.PI;
                
                this.group.add(star1);
                this.group.add(star2);
                break;
                
            case 'powerup':
                // 緑の球体（パワーアップ）
                color = 0x00ff00;
                geometry = new THREE.SphereGeometry(1.5, 16, 16);
                material = new THREE.MeshPhongMaterial({
                    color: color,
                    emissive: color,
                    emissiveIntensity: 0.5
                });
                const sphere = new THREE.Mesh(geometry, material);
                this.group.add(sphere);
                
                // 周囲のリング
                const ringGeometry = new THREE.TorusGeometry(2, 0.3, 8, 16);
                const ring = new THREE.Mesh(ringGeometry, material);
                ring.rotation.x = Math.PI / 2;
                this.group.add(ring);
                break;
                
            case 'ammo_secondary':
                // オレンジのカプセル（セカンダリ弾薬）
                color = 0xff8800;
                geometry = new THREE.CapsuleGeometry(1, 2, 4, 8);
                material = new THREE.MeshPhongMaterial({
                    color: color,
                    emissive: color,
                    emissiveIntensity: 0.3
                });
                const ammo1 = new THREE.Mesh(geometry, material);
                ammo1.rotation.z = Math.PI / 2;
                this.group.add(ammo1);
                break;
                
            case 'ammo_special':
                // 紫のカプセル（スペシャル弾薬）
                color = 0xff00ff;
                geometry = new THREE.CapsuleGeometry(1.2, 2.5, 4, 8);
                material = new THREE.MeshPhongMaterial({
                    color: color,
                    emissive: color,
                    emissiveIntensity: 0.4
                });
                const ammo2 = new THREE.Mesh(geometry, material);
                ammo2.rotation.z = Math.PI / 2;
                this.group.add(ammo2);
                break;
                
            case 'weapon_upgrade':
                // 虹色の宝石（武器強化）
                color = 0xffffff;
                geometry = new THREE.IcosahedronGeometry(1.5, 0);
                material = new THREE.MeshPhongMaterial({
                    color: color,
                    emissive: color,
                    emissiveIntensity: 0.5
                });
                const gem = new THREE.Mesh(geometry, material);
                this.group.add(gem);
                
                // 虹色エフェクト用のアニメーション
                gem.userData.isRainbow = true;
                break;
        }
        
        this.group.position.copy(this.position);
        this.scene.add(this.group);
        
        // 光源
        this.light = new THREE.PointLight(color, 1, 20);
        this.group.add(this.light);
    }

    createEffects() {
        // パーティクルエフェクト（簡易版）
        const particleGeometry = new THREE.SphereGeometry(0.1, 4, 4);
        const particleMaterial = new THREE.MeshBasicMaterial({
            color: this.getColorForType(),
            transparent: true,
            opacity: 0.6
        });
        
        this.particles = [];
        for (let i = 0; i < 8; i++) {
            const particle = new THREE.Mesh(particleGeometry, particleMaterial.clone());
            const angle = (Math.PI * 2 / 8) * i;
            particle.userData = { angle: angle, radius: 3 };
            this.group.add(particle);
            this.particles.push(particle);
        }
    }
    
    createCollectParticles() {
        // 収集時の爆発パーティクル
        const particleCount = 20;
        const color = this.getColorForType();
        
        for (let i = 0; i < particleCount; i++) {
            const geometry = new THREE.SphereGeometry(0.2, 4, 4);
            const material = new THREE.MeshBasicMaterial({
                color: color,
                transparent: true,
                opacity: 1
            });
            const particle = new THREE.Mesh(geometry, material);
            
            // ランダムな方向へ飛ばす
            const velocity = new THREE.Vector3(
                (Math.random() - 0.5) * 20,
                Math.random() * 10,
                (Math.random() - 0.5) * 20
            );
            
            particle.position.copy(this.group.position);
            this.scene.add(particle);
            
            // アニメーション
            const animateParticle = () => {
                particle.position.add(velocity.clone().multiplyScalar(0.02));
                velocity.y -= 0.3; // 重力
                particle.material.opacity -= 0.02;
                particle.scale.multiplyScalar(0.95);
                
                if (particle.material.opacity > 0) {
                    requestAnimationFrame(animateParticle);
                } else {
                    this.scene.remove(particle);
                }
            };
            animateParticle();
        }
    }

    getColorForType() {
        switch (this.type) {
            case 'health': return 0xff0000;
            case 'energy': return 0x00ffff;
            case 'score': return 0xffff00;
            case 'powerup': return 0x00ff00;
            case 'ammo_secondary': return 0xff8800;
            case 'ammo_special': return 0xff00ff;
            case 'weapon_upgrade': return 0xffffff;
            default: return 0xffffff;
        }
    }

    setValue() {
        switch (this.type) {
            case 'health':
                this.value = 25;
                this.message = '+25 HP';
                break;
            case 'energy':
                this.value = 50;
                this.message = '+50 Energy';
                break;
            case 'score':
                this.value = 500;
                this.message = '+500 Score';
                break;
            case 'powerup':
                this.value = 1;
                this.message = 'Power Up!';
                break;
            case 'ammo_secondary':
                this.value = 5;
                this.message = '+5 ミサイル';
                break;
            case 'ammo_special':
                this.value = 3;
                this.message = '+3 特殊弾薬';
                break;
            case 'weapon_upgrade':
                this.value = 1;
                this.message = '武器強化！';
                break;
        }
    }

    update(delta) {
        if (this.collected) return;
        
        // 経過時間をチェック
        const elapsed = Date.now() - this.spawnTime;
        
        // 有効期限チェック（30秒）
        if (elapsed > this.lifeTime) {
            // 期限切れ - 削除
            this.collected = true;
            this.destroy();
            return;
        }
        
        // 期限切れ間近の警告（最後の5秒）
        if (elapsed > this.lifeTime - 5000 && !this.isExpiring) {
            this.isExpiring = true;
            // 点滅開始
        }
        
        // 点滅エフェクト（期限切れ間近）
        if (this.isExpiring) {
            const blinkSpeed = 10; // 速い点滅
            const opacity = (Math.sin(Date.now() * 0.01 * blinkSpeed) + 1) * 0.5;
            this.group.children.forEach(child => {
                if (child.material && child.material.opacity !== undefined) {
                    child.material.transparent = true;
                    child.material.opacity = opacity;
                }
            });
        }
        
        // 回転アニメーション
        this.group.rotation.y += delta * 2;
        
        // 上下の浮遊
        this.group.position.y = this.position.y + Math.sin(Date.now() * 0.002) * 2;
        
        // パーティクルの回転
        this.particles.forEach(particle => {
            particle.userData.angle += delta * 3;
            particle.position.x = Math.cos(particle.userData.angle) * particle.userData.radius;
            particle.position.z = Math.sin(particle.userData.angle) * particle.userData.radius;
        });
        
        // 光の明滅
        this.light.intensity = 1 + Math.sin(Date.now() * 0.005) * 0.5;
        
        // 虹色アイテムの色変更
        if (this.type === 'weapon_upgrade') {
            this.group.children.forEach(child => {
                if (child.userData.isRainbow && child.material) {
                    const hue = (Date.now() * 0.001) % 1;
                    child.material.color.setHSL(hue, 1, 0.5);
                    child.material.emissive.setHSL(hue, 1, 0.3);
                }
            });
        }
    }

    collect(player) {
        if (this.collected) return;
        
        this.collected = true;
        
        // 収集エフェクト
        const collectDuration = 500;
        const startTime = Date.now();
        
        // パーティクル爆発エフェクト
        this.createCollectParticles();
        
        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = elapsed / collectDuration;
            
            if (progress < 1) {
                // スケールと回転のアニメーション
                const scale = 1 - progress * 0.8;
                this.group.scale.setScalar(scale);
                this.group.rotation.y += 0.5;
                this.group.position.y += progress * 5; // 上に浮かび上がる
                
                // 光の強度を増加
                this.light.intensity = (1 - progress) * 5;
                
                // パーティクルを外側に拡散
                this.particles.forEach(particle => {
                    particle.userData.radius += 0.2;
                    particle.material.opacity = 1 - progress;
                });
                
                requestAnimationFrame(animate);
            } else {
                this.destroy();
            }
        };
        animate();
        
        // 効果を適用
        switch (this.type) {
            case 'health':
                player.health = Math.min(player.health + this.value, player.maxHealth);
                break;
            case 'energy':
                // エネルギー回復（実装予定）
                break;
            case 'score':
                return { type: 'score', value: this.value };
            case 'powerup':
                // パワーアップ効果（10秒間）
                player.fireRate = 50; // 連射速度2倍
                player.isPoweredUp = true;
                player.powerUpEndTime = Date.now() + 10000;
                break;
            case 'ammo_secondary':
                // セカンダリ弾薬補充
                if (this.scene.userData.game?.weaponSystem) {
                    this.scene.userData.game.weaponSystem.addAmmo('secondary', this.value);
                }
                break;
            case 'ammo_special':
                // スペシャル弾薬補充
                if (this.scene.userData.game?.weaponSystem) {
                    this.scene.userData.game.weaponSystem.addAmmo('special', this.value);
                }
                break;
            case 'weapon_upgrade':
                // 武器強化
                if (this.scene.userData.game?.player) {
                    // 一時的なダメージブースト
                    player.damageMultiplier = (player.damageMultiplier || 1) + 0.1;
                    this.scene.userData.game.showMessage('武器ダメージ +10%', 2000);
                }
                break;
        }
        
        return { type: this.type, value: this.value, message: this.message };
    }

    checkProximity(playerPosition, threshold = 15) {
        // 取得範囲を5から15に拡大（3倍）
        const distance = this.group.position.distanceTo(playerPosition);
        return distance < threshold;
    }

    destroy() {
        this.scene.remove(this.group);
    }
}