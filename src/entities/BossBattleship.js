import * as THREE from 'three';

export class BossBattleship {
    constructor(scene, position = new THREE.Vector3(0, 0, -200)) {
        this.scene = scene;
        this.position = position;
        this.isAlive = true;
        
        // 基本ステータス
        this.maxHealth = 5000;
        this.health = this.maxHealth;
        this.phase = 1;
        this.size = { x: 30, y: 15, z: 50 }; // 巨大サイズ
        
        // グループ作成
        this.group = new THREE.Group();
        this.group.position.copy(this.position);
        
        // 破壊可能部位
        this.destructibleParts = new Map();
        
        // 武器システム
        this.weapons = [];
        this.weaponCooldowns = new Map();
        
        // フェーズ設定
        this.phaseThresholds = [0.75, 0.5, 0.25]; // HP 75%, 50%, 25%でフェーズ変更
        
        // モデル作成
        this.createModel();
        
        // 武器システム初期化
        this.initWeapons();
        
        // シーンに追加
        this.scene.add(this.group);
        
        // アニメーション用
        this.time = 0;
        this.invulnerable = false;
        this.invulnerabilityTimer = 0;
    }
    
    createModel() {
        // メインハル（船体） - 巨大な箱で表現
        const hullGeometry = new THREE.BoxGeometry(this.size.x, this.size.y, this.size.z);
        const hullMaterial = new THREE.MeshPhongMaterial({ 
            color: 0x333333,
            shininess: 80,
            specular: 0x222222
        });
        this.hullMesh = new THREE.Mesh(hullGeometry, hullMaterial);
        this.group.add(this.hullMesh);
        
        // ブリッジ（艦橋）
        const bridgeGeometry = new THREE.BoxGeometry(10, 8, 15);
        const bridgeMaterial = new THREE.MeshPhongMaterial({ 
            color: 0x222222,
            emissive: 0x0044ff,
            emissiveIntensity: 0.2
        });
        this.bridgeMesh = new THREE.Mesh(bridgeGeometry, bridgeMaterial);
        this.bridgeMesh.position.set(0, this.size.y/2 + 4, -this.size.z/4);
        this.group.add(this.bridgeMesh);
        
        // 破壊可能部位を作成
        this.createDestructibleParts();
        
        // エンジン部分
        this.createEngines();
        
        // 装飾ライト
        this.createLights();
    }
    
    createDestructibleParts() {
        // 左主砲
        const leftGunGeometry = new THREE.CylinderGeometry(2, 3, 15);
        const gunMaterial = new THREE.MeshPhongMaterial({ 
            color: 0x444444,
            emissive: 0xff0000,
            emissiveIntensity: 0.1
        });
        
        const leftGun = new THREE.Mesh(leftGunGeometry, gunMaterial.clone());
        leftGun.position.set(-this.size.x/3, this.size.y/2, -this.size.z/4);
        leftGun.rotation.x = Math.PI / 2;
        this.group.add(leftGun);
        
        this.destructibleParts.set('leftGun', {
            mesh: leftGun,
            health: 800,
            maxHealth: 800,
            destroyed: false,
            onDestroy: () => this.disableWeapon('leftMainGun')
        });
        
        // 右主砲
        const rightGun = new THREE.Mesh(leftGunGeometry.clone(), gunMaterial.clone());
        rightGun.position.set(this.size.x/3, this.size.y/2, -this.size.z/4);
        rightGun.rotation.x = Math.PI / 2;
        this.group.add(rightGun);
        
        this.destructibleParts.set('rightGun', {
            mesh: rightGun,
            health: 800,
            maxHealth: 800,
            destroyed: false,
            onDestroy: () => this.disableWeapon('rightMainGun')
        });
        
        // シールド発生装置
        const shieldGenGeometry = new THREE.SphereGeometry(4, 16, 16);
        const shieldGenMaterial = new THREE.MeshPhongMaterial({ 
            color: 0x0088ff,
            emissive: 0x0088ff,
            emissiveIntensity: 0.5,
            transparent: true,
            opacity: 0.8
        });
        
        const shieldGen = new THREE.Mesh(shieldGenGeometry, shieldGenMaterial);
        shieldGen.position.set(0, this.size.y/2 + 2, this.size.z/4);
        this.group.add(shieldGen);
        
        this.destructibleParts.set('shieldGenerator', {
            mesh: shieldGen,
            health: 1000,
            maxHealth: 1000,
            destroyed: false,
            onDestroy: () => this.disableShield()
        });
    }
    
    createEngines() {
        const engineGeometry = new THREE.ConeGeometry(3, 8, 8);
        const engineMaterial = new THREE.MeshPhongMaterial({ 
            color: 0x0066ff,
            emissive: 0x00ffff,
            emissiveIntensity: 0.8
        });
        
        // 左エンジン
        const leftEngine = new THREE.Mesh(engineGeometry, engineMaterial);
        leftEngine.position.set(-this.size.x/4, 0, this.size.z/2 + 4);
        leftEngine.rotation.x = -Math.PI / 2;
        this.group.add(leftEngine);
        
        // 右エンジン
        const rightEngine = new THREE.Mesh(engineGeometry, engineMaterial.clone());
        rightEngine.position.set(this.size.x/4, 0, this.size.z/2 + 4);
        rightEngine.rotation.x = -Math.PI / 2;
        this.group.add(rightEngine);
        
        // エンジン光
        const engineLight1 = new THREE.PointLight(0x00ffff, 2, 30);
        engineLight1.position.copy(leftEngine.position);
        this.group.add(engineLight1);
        
        const engineLight2 = new THREE.PointLight(0x00ffff, 2, 30);
        engineLight2.position.copy(rightEngine.position);
        this.group.add(engineLight2);
    }
    
    createLights() {
        // 警告ライト
        const warningLight = new THREE.PointLight(0xff0000, 1, 20);
        warningLight.position.set(0, this.size.y, 0);
        this.group.add(warningLight);
        this.warningLight = warningLight;
    }
    
    initWeapons() {
        // 左主砲
        this.weapons.push({
            id: 'leftMainGun',
            position: new THREE.Vector3(-this.size.x/3, this.size.y/2, -this.size.z/4),
            damage: 150,
            fireRate: 3000,
            lastFired: 0,
            enabled: true,
            projectileSpeed: 80,
            projectileColor: 0xff0000,
            projectileSize: 1.5
        });
        
        // 右主砲
        this.weapons.push({
            id: 'rightMainGun',
            position: new THREE.Vector3(this.size.x/3, this.size.y/2, -this.size.z/4),
            damage: 150,
            fireRate: 3000,
            lastFired: 0,
            enabled: true,
            projectileSpeed: 80,
            projectileColor: 0xff0000,
            projectileSize: 1.5
        });
        
        // 副砲群（フェーズ2で追加）
        this.secondaryGuns = [];
        for (let i = 0; i < 4; i++) {
            const angle = (i / 4) * Math.PI * 2;
            this.secondaryGuns.push({
                id: `secondaryGun${i}`,
                position: new THREE.Vector3(
                    Math.cos(angle) * this.size.x/2,
                    0,
                    Math.sin(angle) * this.size.z/3
                ),
                damage: 40,
                fireRate: 800,
                lastFired: 0,
                enabled: false, // フェーズ2で有効化
                projectileSpeed: 120,
                projectileColor: 0xffff00,
                projectileSize: 0.5
            });
        }
        
        // ミサイルランチャー（フェーズ2で追加）
        this.missileLauncher = {
            id: 'missileLauncher',
            position: new THREE.Vector3(0, -this.size.y/2, 0),
            damage: 200,
            fireRate: 5000,
            lastFired: 0,
            enabled: false, // フェーズ2で有効化
            burstCount: 4,
            isHoming: true
        };
    }
    
    update(delta, playerPosition) {
        if (!this.isAlive) return;
        
        this.time += delta;
        
        // 無敵時間の更新
        if (this.invulnerable) {
            this.invulnerabilityTimer -= delta;
            if (this.invulnerabilityTimer <= 0) {
                this.invulnerable = false;
            }
        }
        
        // フェーズチェック
        this.checkPhase();
        
        // 警告ライトの点滅
        if (this.warningLight) {
            this.warningLight.intensity = 1 + Math.sin(this.time * 5) * 0.5;
        }
        
        // 破壊可能部位のアニメーション
        this.updateDestructibleParts(delta);
        
        // AI行動
        this.updateAI(delta, playerPosition);
        
        // 武器発射
        this.updateWeapons(delta, playerPosition);
    }
    
    checkPhase() {
        const healthPercent = this.health / this.maxHealth;
        
        if (this.phase === 1 && healthPercent <= this.phaseThresholds[0]) {
            this.enterPhase2();
        } else if (this.phase === 2 && healthPercent <= this.phaseThresholds[1]) {
            this.enterPhase3();
        } else if (this.phase === 3 && healthPercent <= this.phaseThresholds[2]) {
            this.enterFinalPhase();
        }
    }
    
    enterPhase2() {
        this.phase = 2;
        console.log('Boss entering Phase 2!');
        
        // 副砲を有効化
        this.secondaryGuns.forEach(gun => {
            gun.enabled = true;
            this.weapons.push(gun);
        });
        
        // ミサイルランチャーを有効化
        this.missileLauncher.enabled = true;
        
        // 一時的に無敵
        this.invulnerable = true;
        this.invulnerabilityTimer = 2;
        
        // フェーズ変更エフェクト
        this.phaseChangeEffect();
    }
    
    enterPhase3() {
        this.phase = 3;
        console.log('Boss entering Phase 3!');
        
        // 攻撃速度上昇
        this.weapons.forEach(weapon => {
            weapon.fireRate *= 0.7; // 30%高速化
        });
        
        // 移動開始
        this.startMovement = true;
        
        this.invulnerable = true;
        this.invulnerabilityTimer = 2;
        
        this.phaseChangeEffect();
    }
    
    enterFinalPhase() {
        this.phase = 4;
        console.log('Boss entering FINAL Phase!');
        
        // 必殺技モード
        this.berserkMode = true;
        
        // 全武器の攻撃速度最大
        this.weapons.forEach(weapon => {
            weapon.fireRate = 500;
        });
        
        this.invulnerable = true;
        this.invulnerabilityTimer = 3;
        
        this.phaseChangeEffect();
    }
    
    phaseChangeEffect() {
        // フェーズ変更時のビジュアルエフェクト
        const flash = new THREE.PointLight(0xffffff, 10, 100);
        flash.position.copy(this.group.position);
        this.scene.add(flash);
        
        // フラッシュを徐々に消す
        const fadeOut = setInterval(() => {
            flash.intensity *= 0.9;
            if (flash.intensity < 0.1) {
                this.scene.remove(flash);
                clearInterval(fadeOut);
            }
        }, 50);
    }
    
    updateDestructibleParts(delta) {
        this.destructibleParts.forEach((part, key) => {
            if (!part.destroyed && part.mesh) {
                // ダメージを受けた部位は赤く点滅
                if (part.health < part.maxHealth) {
                    const damageRatio = 1 - (part.health / part.maxHealth);
                    part.mesh.material.emissive = new THREE.Color(1, 0, 0);
                    part.mesh.material.emissiveIntensity = damageRatio * Math.sin(this.time * 10) * 0.5;
                }
            }
        });
    }
    
    updateAI(delta, playerPosition) {
        if (!playerPosition) return;
        
        // プレイヤーの方を向く（ゆっくり）
        const targetDirection = playerPosition.clone().sub(this.group.position).normalize();
        const currentDirection = new THREE.Vector3(0, 0, -1).applyQuaternion(this.group.quaternion);
        
        const newDirection = currentDirection.lerp(targetDirection, 0.01);
        this.group.lookAt(this.group.position.clone().add(newDirection));
        
        // フェーズ3以降は移動
        if (this.phase >= 3 && this.startMovement) {
            const moveSpeed = 5 * delta;
            const movement = targetDirection.multiplyScalar(moveSpeed);
            this.group.position.add(movement);
        }
    }
    
    updateWeapons(delta, playerPosition) {
        if (!playerPosition || this.invulnerable) return;
        
        const currentTime = Date.now();
        const projectiles = [];
        
        this.weapons.forEach(weapon => {
            if (!weapon.enabled) return;
            
            if (currentTime - weapon.lastFired > weapon.fireRate) {
                const worldPos = weapon.position.clone();
                worldPos.applyMatrix4(this.group.matrixWorld);
                
                const direction = playerPosition.clone().sub(worldPos).normalize();
                
                // 弾丸データ
                const projectileData = {
                    position: worldPos,
                    direction: direction,
                    speed: weapon.projectileSpeed || 80,
                    damage: weapon.damage,
                    color: weapon.projectileColor || 0xff0000,
                    size: weapon.projectileSize || 1.0,
                    owner: 'boss'
                };
                
                projectiles.push(projectileData);
                weapon.lastFired = currentTime;
            }
        });
        
        // ミサイル発射（フェーズ2以降）
        if (this.phase >= 2 && this.missileLauncher.enabled) {
            if (currentTime - this.missileLauncher.lastFired > this.missileLauncher.fireRate) {
                for (let i = 0; i < this.missileLauncher.burstCount; i++) {
                    setTimeout(() => {
                        this.fireMissile(playerPosition);
                    }, i * 200);
                }
                this.missileLauncher.lastFired = currentTime;
            }
        }
        
        return projectiles;
    }
    
    fireMissile(targetPosition) {
        // ミサイル発射ロジック（Game.jsで処理）
        const worldPos = this.missileLauncher.position.clone();
        worldPos.applyMatrix4(this.group.matrixWorld);
        
        // ミサイルは少し上向きに発射
        const direction = new THREE.Vector3(
            (Math.random() - 0.5) * 0.5,
            1,
            -1
        ).normalize();
        
        const missileData = {
            position: worldPos,
            direction: direction,
            speed: 60,
            damage: this.missileLauncher.damage,
            color: 0xff00ff,
            size: 0.8,
            owner: 'boss',
            isHoming: true,
            target: targetPosition
        };
        
        return missileData;
    }
    
    takeDamage(damage, hitPart = null) {
        if (this.invulnerable || !this.isAlive) return;
        
        // 特定部位へのダメージ
        if (hitPart && this.destructibleParts.has(hitPart)) {
            const part = this.destructibleParts.get(hitPart);
            if (!part.destroyed) {
                part.health -= damage;
                if (part.health <= 0) {
                    this.destroyPart(hitPart);
                }
                return;
            }
        }
        
        // 本体へのダメージ
        this.health -= damage;
        
        // ダメージエフェクト
        this.hullMesh.material.emissive = new THREE.Color(1, 0.5, 0);
        this.hullMesh.material.emissiveIntensity = 0.5;
        setTimeout(() => {
            this.hullMesh.material.emissiveIntensity = 0;
        }, 100);
        
        if (this.health <= 0) {
            this.health = 0; // HPを確実に0にする
            this.destroy();
        }
    }
    
    destroyPart(partId) {
        const part = this.destructibleParts.get(partId);
        if (!part || part.destroyed) return;
        
        part.destroyed = true;
        
        // 破壊エフェクト
        const explosion = new THREE.PointLight(0xff6600, 5, 50);
        explosion.position.copy(part.mesh.position);
        this.group.add(explosion);
        
        // パーツを消す
        setTimeout(() => {
            this.group.remove(part.mesh);
            part.mesh.geometry.dispose();
            part.mesh.material.dispose();
        }, 100);
        
        // 爆発光を消す
        setTimeout(() => {
            this.group.remove(explosion);
        }, 500);
        
        // 破壊時のコールバック実行
        if (part.onDestroy) {
            part.onDestroy();
        }
        
        console.log(`Boss part destroyed: ${partId}`);
    }
    
    disableWeapon(weaponId) {
        const weapon = this.weapons.find(w => w.id === weaponId);
        if (weapon) {
            weapon.enabled = false;
            console.log(`Weapon disabled: ${weaponId}`);
        }
    }
    
    disableShield() {
        // シールド無効化の処理
        console.log('Boss shield destroyed!');
        // 防御力低下などの処理を追加可能
    }
    
    destroy() {
        this.isAlive = false;
        
        // 大爆発エフェクト
        for (let i = 0; i < 10; i++) {
            setTimeout(() => {
                const explosion = new THREE.PointLight(0xffaa00, 10, 100);
                explosion.position.copy(this.group.position);
                explosion.position.add(new THREE.Vector3(
                    (Math.random() - 0.5) * this.size.x,
                    (Math.random() - 0.5) * this.size.y,
                    (Math.random() - 0.5) * this.size.z
                ));
                this.scene.add(explosion);
                
                setTimeout(() => {
                    this.scene.remove(explosion);
                }, 1000);
            }, i * 100);
        }
        
        // ボス削除
        setTimeout(() => {
            this.scene.remove(this.group);
            this.cleanup();
        }, 2000);
        
        console.log('Boss destroyed! Victory!');
    }
    
    cleanup() {
        // メモリクリーンアップ
        this.group.traverse((child) => {
            if (child.geometry) child.geometry.dispose();
            if (child.material) {
                if (Array.isArray(child.material)) {
                    child.material.forEach(m => m.dispose());
                } else {
                    child.material.dispose();
                }
            }
        });
        
        this.destructibleParts.clear();
        this.weapons = [];
    }
    
    // 当たり判定用
    getBoundingBox() {
        const box = new THREE.Box3();
        box.setFromObject(this.group);
        return box;
    }
    
    // 部位ごとの当たり判定
    checkPartHit(position) {
        for (const [partId, part] of this.destructibleParts) {
            if (!part.destroyed && part.mesh) {
                const partBox = new THREE.Box3().setFromObject(part.mesh);
                if (partBox.containsPoint(position)) {
                    return partId;
                }
            }
        }
        return null;
    }
}