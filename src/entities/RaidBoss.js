import * as THREE from 'three';

export class RaidBoss {
    constructor(scene, position = new THREE.Vector3(0, 0, -500)) {
        this.scene = scene;
        this.position = position;
        this.isAlive = true;
        
        // レイドボスステータス（中ボスの5倍規模）
        this.maxHealth = 25000;  // 5倍のHP
        this.health = this.maxHealth;
        this.phase = 1;
        this.size = { x: 150, y: 75, z: 250 }; // 5倍のサイズ
        
        // グループ作成
        this.group = new THREE.Group();
        this.group.position.copy(this.position);
        
        // 破壊可能部位（より多く）
        this.destructibleParts = new Map();
        
        // 武器システム（大量）
        this.weapons = [];
        this.weaponCooldowns = new Map();
        
        // フェーズ設定（5段階）
        this.phaseThresholds = [0.8, 0.6, 0.4, 0.2, 0.1];
        
        // モデル作成
        this.createModel();
        
        // 武器システム初期化
        this.initWeapons();
        
        // シールドシステム
        this.shieldActive = true;
        this.shieldHealth = 5000;
        this.maxShieldHealth = 5000;
        
        // シーンに追加
        this.scene.add(this.group);
        
        // アニメーション用
        this.time = 0;
        this.invulnerable = false;
        this.invulnerabilityTimer = 0;
    }
    
    createModel() {
        // メインハル（超巨大戦艦）
        const hullGeometry = new THREE.BoxGeometry(this.size.x, this.size.y, this.size.z);
        const hullMaterial = new THREE.MeshPhongMaterial({ 
            color: 0x1a1a1a,
            shininess: 100,
            specular: 0x444444
        });
        this.hullMesh = new THREE.Mesh(hullGeometry, hullMaterial);
        this.group.add(this.hullMesh);
        
        // 多層構造の艦橋
        for (let i = 0; i < 3; i++) {
            const bridgeGeometry = new THREE.BoxGeometry(30 - i*5, 20 - i*3, 40 - i*5);
            const bridgeMaterial = new THREE.MeshPhongMaterial({ 
                color: 0x222222,
                emissive: 0x0088ff,
                emissiveIntensity: 0.2 + i*0.1
            });
            const bridge = new THREE.Mesh(bridgeGeometry, bridgeMaterial);
            bridge.position.set(0, this.size.y/2 + 10 + i*15, -this.size.z/4 + i*10);
            this.group.add(bridge);
        }
        
        // 破壊可能部位を作成
        this.createDestructibleParts();
        
        // 巨大エンジン群
        this.createEngines();
        
        // 装飾ライトとシールド
        this.createLightsAndShield();
    }
    
    createDestructibleParts() {
        // 前方主砲群（4門）
        const mainGunPositions = [
            {x: -this.size.x/3, z: -this.size.z/3},
            {x: this.size.x/3, z: -this.size.z/3},
            {x: -this.size.x/4, z: -this.size.z/4},
            {x: this.size.x/4, z: -this.size.z/4}
        ];
        
        mainGunPositions.forEach((pos, index) => {
            const gunGeometry = new THREE.CylinderGeometry(4, 5, 30);
            const gunMaterial = new THREE.MeshPhongMaterial({ 
                color: 0x444444,
                emissive: 0xff0000,
                emissiveIntensity: 0.1
            });
            
            const gun = new THREE.Mesh(gunGeometry, gunMaterial);
            gun.position.set(pos.x, this.size.y/2 + 5, pos.z);
            gun.rotation.x = Math.PI / 2;
            this.group.add(gun);
            
            this.destructibleParts.set(`mainGun${index}`, {
                mesh: gun,
                health: 1500,
                maxHealth: 1500,
                destroyed: false,
                onDestroy: () => this.disableWeapon(`mainGun${index}`)
            });
        });
        
        // 側面砲塔（各側6門）
        for (let side = 0; side < 2; side++) {
            for (let i = 0; i < 6; i++) {
                const sideGunGeometry = new THREE.BoxGeometry(8, 6, 15);
                const sideGunMaterial = new THREE.MeshPhongMaterial({ 
                    color: 0x555555,
                    emissive: 0xffaa00,
                    emissiveIntensity: 0.1
                });
                
                const sideGun = new THREE.Mesh(sideGunGeometry, sideGunMaterial);
                const xPos = side === 0 ? -this.size.x/2 - 5 : this.size.x/2 + 5;
                const zPos = -this.size.z/2 + (i + 1) * (this.size.z / 7);
                sideGun.position.set(xPos, 0, zPos);
                this.group.add(sideGun);
                
                this.destructibleParts.set(`sideGun${side}_${i}`, {
                    mesh: sideGun,
                    health: 800,
                    maxHealth: 800,
                    destroyed: false,
                    onDestroy: () => this.disableWeapon(`sideGun${side}_${i}`)
                });
            }
        }
        
        // シールド発生装置（4基）
        const shieldGenPositions = [
            {x: -this.size.x/3, z: this.size.z/4},
            {x: this.size.x/3, z: this.size.z/4},
            {x: 0, z: 0},
            {x: 0, z: -this.size.z/2}
        ];
        
        shieldGenPositions.forEach((pos, index) => {
            const shieldGenGeometry = new THREE.SphereGeometry(6, 16, 16);
            const shieldGenMaterial = new THREE.MeshPhongMaterial({ 
                color: 0x0088ff,
                emissive: 0x0088ff,
                emissiveIntensity: 0.5,
                transparent: true,
                opacity: 0.8
            });
            
            const shieldGen = new THREE.Mesh(shieldGenGeometry, shieldGenMaterial);
            shieldGen.position.set(pos.x, this.size.y/2 + 2, pos.z);
            this.group.add(shieldGen);
            
            this.destructibleParts.set(`shieldGen${index}`, {
                mesh: shieldGen,
                health: 2000,
                maxHealth: 2000,
                destroyed: false,
                onDestroy: () => this.damageShield(1250) // 各発生装置破壊でシールド1/4ダメージ
            });
        });
        
        // リアクターコア（最重要部位）
        const coreGeometry = new THREE.OctahedronGeometry(10, 2);
        const coreMaterial = new THREE.MeshPhongMaterial({ 
            color: 0xff00ff,
            emissive: 0xff00ff,
            emissiveIntensity: 0.8,
            transparent: true,
            opacity: 0.9
        });
        
        const core = new THREE.Mesh(coreGeometry, coreMaterial);
        core.position.set(0, 0, 0);
        this.group.add(core);
        
        this.destructibleParts.set('reactorCore', {
            mesh: core,
            health: 5000,
            maxHealth: 5000,
            destroyed: false,
            locked: true,
            unlockCondition: 'all_shield_generators_destroyed',
            onDestroy: () => this.triggerCriticalDamage()
        });
        
        this.reactorCore = core;
    }
    
    createEngines() {
        // メインエンジン群（6基）
        const enginePositions = [
            {x: -this.size.x/3, y: -this.size.y/4},
            {x: 0, y: -this.size.y/4},
            {x: this.size.x/3, y: -this.size.y/4},
            {x: -this.size.x/3, y: this.size.y/4},
            {x: 0, y: this.size.y/4},
            {x: this.size.x/3, y: this.size.y/4}
        ];
        
        this.engines = [];
        
        enginePositions.forEach((pos, index) => {
            const engineGroup = new THREE.Group();
            
            // エンジン本体
            const engineGeometry = new THREE.ConeGeometry(8, 20, 12);
            const engineMaterial = new THREE.MeshPhongMaterial({ 
                color: 0x0066ff,
                emissive: 0x00ffff,
                emissiveIntensity: 0.8
            });
            
            const engine = new THREE.Mesh(engineGeometry, engineMaterial);
            engine.rotation.x = -Math.PI / 2;
            engineGroup.add(engine);
            
            // エンジンリング
            const ringGeometry = new THREE.TorusGeometry(10, 2, 8, 16);
            const ringMaterial = new THREE.MeshPhongMaterial({
                color: 0x004488,
                emissive: 0x0088ff,
                emissiveIntensity: 0.6
            });
            
            const ring = new THREE.Mesh(ringGeometry, ringMaterial);
            ring.rotation.x = Math.PI / 2;
            ring.position.z = 5;
            engineGroup.add(ring);
            
            engineGroup.position.set(pos.x, pos.y, this.size.z/2 + 10);
            this.group.add(engineGroup);
            
            // エンジン光
            const engineLight = new THREE.PointLight(0x00ffff, 3, 50);
            engineLight.position.copy(engineGroup.position);
            this.group.add(engineLight);
            
            this.engines.push({
                group: engineGroup,
                light: engineLight,
                index: index
            });
        });
    }
    
    createLightsAndShield() {
        // 警告ライト群
        const warningLights = [];
        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2;
            const light = new THREE.PointLight(0xff0000, 1, 30);
            light.position.set(
                Math.cos(angle) * this.size.x/2,
                this.size.y,
                Math.sin(angle) * this.size.z/2
            );
            this.group.add(light);
            warningLights.push(light);
        }
        this.warningLights = warningLights;
        
        // シールドエフェクト
        const shieldGeometry = new THREE.SphereGeometry(
            Math.max(this.size.x, this.size.y, this.size.z) * 0.8,
            32,
            16
        );
        const shieldMaterial = new THREE.MeshPhongMaterial({
            color: 0x00ffff,
            emissive: 0x0088ff,
            emissiveIntensity: 0.3,
            transparent: true,
            opacity: 0.2,
            side: THREE.DoubleSide
        });
        
        this.shieldMesh = new THREE.Mesh(shieldGeometry, shieldMaterial);
        this.shieldMesh.visible = this.shieldActive;
        this.group.add(this.shieldMesh);
    }
    
    initWeapons() {
        // 主砲群
        for (let i = 0; i < 4; i++) {
            this.weapons.push({
                id: `mainGun${i}`,
                position: this.destructibleParts.get(`mainGun${i}`).mesh.position,
                damage: 300,
                fireRate: 4000,
                lastFired: 0,
                enabled: true,
                projectileSpeed: 100,
                projectileColor: 0xff0000,
                projectileSize: 2.5,
                burstCount: 3,
                spread: 5
            });
        }
        
        // 側面砲群
        for (let side = 0; side < 2; side++) {
            for (let i = 0; i < 6; i++) {
                this.weapons.push({
                    id: `sideGun${side}_${i}`,
                    position: this.destructibleParts.get(`sideGun${side}_${i}`).mesh.position,
                    damage: 80,
                    fireRate: 1200,
                    lastFired: 0,
                    enabled: false, // フェーズ2で有効化
                    projectileSpeed: 150,
                    projectileColor: 0xffaa00,
                    projectileSize: 1.0,
                    targetingType: 'predictive'
                });
            }
        }
        
        // ミサイルサイロ（8基）
        this.missileSilos = [];
        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2;
            this.missileSilos.push({
                id: `missileSilo${i}`,
                position: new THREE.Vector3(
                    Math.cos(angle) * this.size.x/3,
                    -this.size.y/2,
                    Math.sin(angle) * this.size.z/3
                ),
                damage: 400,
                fireRate: 8000,
                lastFired: 0,
                enabled: false, // フェーズ3で有効化
                burstCount: 8,
                isHoming: true,
                missilesPerBurst: 3
            });
        }
        
        // メガレーザー（最終兵器）
        this.megaLaser = {
            id: 'megaLaser',
            position: new THREE.Vector3(0, 0, -this.size.z/2),
            damage: 1000,
            fireRate: 15000,
            lastFired: 0,
            enabled: false, // フェーズ5で有効化
            chargeTime: 3000,
            beamDuration: 2000,
            isCharging: false,
            chargeStartTime: 0
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
        if (this.warningLights) {
            this.warningLights.forEach((light, index) => {
                light.intensity = 1 + Math.sin(this.time * 5 + index) * 0.5;
            });
        }
        
        // エンジンアニメーション
        this.engines.forEach((engine, index) => {
            engine.group.rotation.z = this.time * 2 + index * Math.PI / 3;
            engine.light.intensity = 3 + Math.sin(this.time * 10 + index) * 1;
        });
        
        // リアクターコアの回転
        if (this.reactorCore && !this.destructibleParts.get('reactorCore').destroyed) {
            this.reactorCore.rotation.x += delta * 0.5;
            this.reactorCore.rotation.y += delta * 0.7;
            this.reactorCore.rotation.z += delta * 0.3;
        }
        
        // シールドエフェクト
        if (this.shieldMesh && this.shieldActive) {
            this.shieldMesh.material.opacity = 0.2 + Math.sin(this.time * 3) * 0.1;
            this.shieldMesh.rotation.y += delta * 0.1;
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
            this.enterPhase4();
        } else if (this.phase === 4 && healthPercent <= this.phaseThresholds[3]) {
            this.enterPhase5();
        } else if (this.phase === 5 && healthPercent <= this.phaseThresholds[4]) {
            this.enterFinalPhase();
        }
    }
    
    enterPhase2() {
        this.phase = 2;
        console.log('RAID BOSS: Phase 2 - Side Cannons Online!');
        
        // 側面砲を有効化
        this.weapons.forEach(weapon => {
            if (weapon.id.includes('sideGun')) {
                weapon.enabled = true;
            }
        });
        
        this.phaseChangeEffect();
    }
    
    enterPhase3() {
        this.phase = 3;
        console.log('RAID BOSS: Phase 3 - Missile Systems Activated!');
        
        // ミサイルサイロを有効化
        this.missileSilos.forEach(silo => {
            silo.enabled = true;
        });
        
        // 攻撃頻度上昇
        this.weapons.forEach(weapon => {
            weapon.fireRate *= 0.8;
        });
        
        this.phaseChangeEffect();
    }
    
    enterPhase4() {
        this.phase = 4;
        console.log('RAID BOSS: Phase 4 - Overdrive Mode!');
        
        // 全武器の攻撃速度上昇
        this.weapons.forEach(weapon => {
            weapon.fireRate *= 0.6;
        });
        
        // 移動開始
        this.startMovement = true;
        
        this.phaseChangeEffect();
    }
    
    enterPhase5() {
        this.phase = 5;
        console.log('RAID BOSS: Phase 5 - MEGA LASER CHARGING!');
        
        // メガレーザー有効化
        this.megaLaser.enabled = true;
        
        // バーサークモード
        this.berserkMode = true;
        
        this.phaseChangeEffect();
    }
    
    enterFinalPhase() {
        this.phase = 6;
        console.log('RAID BOSS: FINAL PHASE - CRITICAL SYSTEMS FAILURE!');
        
        // 自爆シーケンス開始
        this.selfDestructTimer = 30000; // 30秒のタイマー
        
        // 全武器最大出力
        this.weapons.forEach(weapon => {
            weapon.fireRate = 300;
            weapon.damage *= 2;
        });
        
        this.phaseChangeEffect();
    }
    
    phaseChangeEffect() {
        // 超巨大フラッシュ
        const flash = new THREE.PointLight(0xffffff, 50, 500);
        flash.position.copy(this.group.position);
        this.scene.add(flash);
        
        // シェイクエフェクト
        if (window.game) {
            this.cameraShake(3, 5);
        }
        
        // フラッシュを徐々に消す
        const fadeOut = setInterval(() => {
            flash.intensity *= 0.85;
            if (flash.intensity < 0.1) {
                this.scene.remove(flash);
                clearInterval(fadeOut);
            }
        }, 50);
        
        // 一時的に無敵
        this.invulnerable = true;
        this.invulnerabilityTimer = 3;
    }
    
    cameraShake(duration, intensity) {
        const camera = window.game.camera;
        if (!camera) return;
        
        const startTime = Date.now();
        const originalPosition = camera.position.clone();
        
        const shake = () => {
            const elapsed = (Date.now() - startTime) / 1000;
            if (elapsed < duration) {
                const shakeIntensity = (1 - elapsed / duration) * intensity;
                camera.position.x = originalPosition.x + (Math.random() - 0.5) * shakeIntensity;
                camera.position.y = originalPosition.y + (Math.random() - 0.5) * shakeIntensity;
                camera.position.z = originalPosition.z + (Math.random() - 0.5) * shakeIntensity;
                requestAnimationFrame(shake);
            } else {
                camera.position.copy(originalPosition);
            }
        };
        
        shake();
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
        
        // 自爆タイマー
        if (this.selfDestructTimer !== undefined) {
            this.selfDestructTimer -= delta * 1000;
            if (this.selfDestructTimer <= 0) {
                this.selfDestruct();
            }
        }
    }
    
    updateAI(delta, playerPosition) {
        if (!playerPosition) return;
        
        // フェーズ4以降は移動
        if (this.phase >= 4 && this.startMovement) {
            // ゆっくりとプレイヤーに接近
            const targetDirection = playerPosition.clone().sub(this.group.position).normalize();
            const moveSpeed = 10 * delta;
            const movement = targetDirection.multiplyScalar(moveSpeed);
            this.group.position.add(movement);
            
            // ゆっくり回転
            const currentDirection = new THREE.Vector3(0, 0, -1).applyQuaternion(this.group.quaternion);
            const newDirection = currentDirection.lerp(targetDirection, 0.005);
            this.group.lookAt(this.group.position.clone().add(newDirection));
        }
    }
    
    updateWeapons(delta, playerPosition) {
        if (!playerPosition || this.invulnerable) return;
        
        const currentTime = Date.now();
        const projectiles = [];
        
        // 通常武器の更新
        this.weapons.forEach(weapon => {
            if (!weapon.enabled) return;
            
            if (currentTime - weapon.lastFired > weapon.fireRate) {
                const worldPos = weapon.position.clone();
                worldPos.applyMatrix4(this.group.matrixWorld);
                
                const direction = playerPosition.clone().sub(worldPos).normalize();
                
                if (weapon.burstCount) {
                    // バースト射撃
                    for (let i = 0; i < weapon.burstCount; i++) {
                        setTimeout(() => {
                            const spreadAngle = weapon.spread || 0;
                            const spreadX = (Math.random() - 0.5) * spreadAngle * Math.PI / 180;
                            const spreadY = (Math.random() - 0.5) * spreadAngle * Math.PI / 180;
                            
                            const spreadDir = direction.clone();
                            spreadDir.applyAxisAngle(new THREE.Vector3(1, 0, 0), spreadX);
                            spreadDir.applyAxisAngle(new THREE.Vector3(0, 1, 0), spreadY);
                            
                            const projectileData = {
                                position: worldPos.clone(),
                                direction: spreadDir,
                                speed: weapon.projectileSpeed,
                                damage: weapon.damage,
                                color: weapon.projectileColor,
                                size: weapon.projectileSize,
                                owner: 'boss'
                            };
                            
                            if (window.game && window.game.bossSpawnSystem) {
                                window.game.bossSpawnSystem.createBossProjectile(projectileData);
                            }
                        }, i * 100);
                    }
                } else {
                    const projectileData = {
                        position: worldPos,
                        direction: direction,
                        speed: weapon.projectileSpeed,
                        damage: weapon.damage,
                        color: weapon.projectileColor,
                        size: weapon.projectileSize,
                        owner: 'boss'
                    };
                    projectiles.push(projectileData);
                }
                
                weapon.lastFired = currentTime;
            }
        });
        
        // ミサイル発射
        if (this.phase >= 3) {
            this.missileSilos.forEach(silo => {
                if (!silo.enabled) return;
                
                if (currentTime - silo.lastFired > silo.fireRate) {
                    for (let burst = 0; burst < silo.missilesPerBurst; burst++) {
                        setTimeout(() => {
                            for (let i = 0; i < silo.burstCount; i++) {
                                setTimeout(() => {
                                    const worldPos = silo.position.clone();
                                    worldPos.applyMatrix4(this.group.matrixWorld);
                                    
                                    const missileData = {
                                        position: worldPos,
                                        direction: new THREE.Vector3(
                                            (Math.random() - 0.5) * 0.5,
                                            1,
                                            -0.5
                                        ).normalize(),
                                        speed: 80,
                                        damage: silo.damage,
                                        color: 0xff00ff,
                                        size: 1.2,
                                        owner: 'boss',
                                        isHoming: true,
                                        target: playerPosition
                                    };
                                    
                                    if (window.game && window.game.bossSpawnSystem) {
                                        window.game.bossSpawnSystem.createBossProjectile(missileData);
                                    }
                                }, i * 50);
                            }
                        }, burst * 500);
                    }
                    silo.lastFired = currentTime;
                }
            });
        }
        
        // メガレーザー
        if (this.phase >= 5 && this.megaLaser.enabled) {
            if (!this.megaLaser.isCharging && currentTime - this.megaLaser.lastFired > this.megaLaser.fireRate) {
                this.startMegaLaserCharge();
            }
            
            if (this.megaLaser.isCharging) {
                const chargeTime = currentTime - this.megaLaser.chargeStartTime;
                if (chargeTime >= this.megaLaser.chargeTime) {
                    this.fireMegaLaser(playerPosition);
                }
            }
        }
        
        return projectiles;
    }
    
    startMegaLaserCharge() {
        this.megaLaser.isCharging = true;
        this.megaLaser.chargeStartTime = Date.now();
        
        // チャージエフェクト
        const chargeLight = new THREE.PointLight(0xff00ff, 0, 100);
        chargeLight.position.copy(this.megaLaser.position);
        chargeLight.position.applyMatrix4(this.group.matrixWorld);
        this.scene.add(chargeLight);
        
        // チャージアニメーション
        const chargeAnimation = setInterval(() => {
            chargeLight.intensity += 0.5;
            if (chargeLight.intensity >= 10) {
                clearInterval(chargeAnimation);
                setTimeout(() => {
                    this.scene.remove(chargeLight);
                }, 100);
            }
        }, 100);
        
        console.log('MEGA LASER CHARGING!!!');
    }
    
    fireMegaLaser(targetPosition) {
        this.megaLaser.isCharging = false;
        this.megaLaser.lastFired = Date.now();
        
        // メガレーザービーム（特殊処理が必要）
        console.log('MEGA LASER FIRED!!!');
        
        // TODO: 巨大ビームエフェクトの実装
        // 一時的に通常の巨大弾として実装
        const worldPos = this.megaLaser.position.clone();
        worldPos.applyMatrix4(this.group.matrixWorld);
        
        const laserData = {
            position: worldPos,
            direction: targetPosition.clone().sub(worldPos).normalize(),
            speed: 200,
            damage: this.megaLaser.damage,
            color: 0xff00ff,
            size: 10,
            owner: 'boss'
        };
        
        if (window.game && window.game.bossSpawnSystem) {
            window.game.bossSpawnSystem.createBossProjectile(laserData);
        }
    }
    
    takeDamage(damage, hitPart = null) {
        if (this.invulnerable || !this.isAlive) return;
        
        // シールドがある場合
        if (this.shieldActive && this.shieldHealth > 0) {
            this.shieldHealth -= damage;
            
            // シールドヒットエフェクト
            this.shieldMesh.material.emissive = new THREE.Color(1, 1, 1);
            this.shieldMesh.material.emissiveIntensity = 0.8;
            setTimeout(() => {
                this.shieldMesh.material.emissiveIntensity = 0.3;
            }, 100);
            
            if (this.shieldHealth <= 0) {
                this.shieldHealth = 0;
                this.disableShield();
            }
            return;
        }
        
        // 特定部位へのダメージ
        if (hitPart && this.destructibleParts.has(hitPart)) {
            const part = this.destructibleParts.get(hitPart);
            if (!part.destroyed && !part.locked) {
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
            this.destroy();
        }
    }
    
    damageShield(damage) {
        this.shieldHealth = Math.max(0, this.shieldHealth - damage);
        
        if (this.shieldHealth <= 0) {
            this.disableShield();
        }
    }
    
    disableShield() {
        this.shieldActive = false;
        this.shieldMesh.visible = false;
        console.log('RAID BOSS: Shield destroyed!');
        
        // リアクターコアのロック解除チェック
        const allShieldGensDestroyed = ['shieldGen0', 'shieldGen1', 'shieldGen2', 'shieldGen3']
            .every(id => this.destructibleParts.get(id).destroyed);
        
        if (allShieldGensDestroyed) {
            this.destructibleParts.get('reactorCore').locked = false;
            console.log('RAID BOSS: Reactor core exposed!');
        }
    }
    
    destroyPart(partId) {
        const part = this.destructibleParts.get(partId);
        if (!part || part.destroyed) return;
        
        part.destroyed = true;
        
        // 超巨大爆発エフェクト
        for (let i = 0; i < 5; i++) {
            setTimeout(() => {
                const explosion = new THREE.PointLight(0xff6600, 10, 100);
                explosion.position.copy(part.mesh.position);
                explosion.position.add(new THREE.Vector3(
                    (Math.random() - 0.5) * 20,
                    (Math.random() - 0.5) * 20,
                    (Math.random() - 0.5) * 20
                ));
                this.group.add(explosion);
                
                setTimeout(() => {
                    this.group.remove(explosion);
                }, 500);
            }, i * 100);
        }
        
        // パーツを消す
        setTimeout(() => {
            this.group.remove(part.mesh);
            part.mesh.geometry.dispose();
            part.mesh.material.dispose();
        }, 500);
        
        // 破壊時のコールバック実行
        if (part.onDestroy) {
            part.onDestroy();
        }
        
        // カメラシェイク
        this.cameraShake(1, 3);
        
        console.log(`RAID BOSS part destroyed: ${partId}`);
    }
    
    disableWeapon(weaponId) {
        const weapon = this.weapons.find(w => w.id === weaponId);
        if (weapon) {
            weapon.enabled = false;
            console.log(`RAID BOSS weapon disabled: ${weaponId}`);
        }
    }
    
    triggerCriticalDamage() {
        console.log('RAID BOSS: REACTOR CORE CRITICAL!');
        
        // 大ダメージ
        this.health = Math.floor(this.health * 0.5);
        
        // 全システム暴走
        this.enterFinalPhase();
    }
    
    selfDestruct() {
        console.log('RAID BOSS: SELF DESTRUCT!');
        
        // 強制破壊
        this.health = 0;
        this.destroy();
    }
    
    destroy() {
        this.isAlive = false;
        
        // 超巨大爆発シーケンス
        for (let i = 0; i < 30; i++) {
            setTimeout(() => {
                const explosion = new THREE.PointLight(0xffaa00, 20, 200);
                explosion.position.copy(this.group.position);
                explosion.position.add(new THREE.Vector3(
                    (Math.random() - 0.5) * this.size.x,
                    (Math.random() - 0.5) * this.size.y,
                    (Math.random() - 0.5) * this.size.z
                ));
                this.scene.add(explosion);
                
                setTimeout(() => {
                    this.scene.remove(explosion);
                }, 2000);
            }, i * 100);
        }
        
        // 最終爆発
        setTimeout(() => {
            const finalExplosion = new THREE.PointLight(0xffffff, 100, 1000);
            finalExplosion.position.copy(this.group.position);
            this.scene.add(finalExplosion);
            
            // カメラ大シェイク
            this.cameraShake(5, 10);
            
            setTimeout(() => {
                this.scene.remove(finalExplosion);
            }, 3000);
        }, 3000);
        
        // ボス削除
        setTimeout(() => {
            this.scene.remove(this.group);
            this.cleanup();
        }, 5000);
        
        console.log('RAID BOSS DESTROYED! EPIC VICTORY!');
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
        this.engines = [];
        this.warningLights = [];
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
            if (!part.destroyed && part.mesh && !part.locked) {
                const partBox = new THREE.Box3().setFromObject(part.mesh);
                if (partBox.containsPoint(position)) {
                    return partId;
                }
            }
        }
        return null;
    }
    
    // UI用のボス情報
    getBossInfo() {
        const shieldPercent = this.shieldActive ? this.shieldHealth / this.maxShieldHealth : 0;
        const healthPercent = this.health / this.maxHealth;
        
        return {
            name: 'タイタン級超巨大戦艦',
            health: this.health,
            maxHealth: this.maxHealth,
            healthPercent: healthPercent,
            shieldHealth: this.shieldHealth,
            maxShieldHealth: this.maxShieldHealth,
            shieldPercent: shieldPercent,
            phase: this.phase,
            destructibleParts: Array.from(this.destructibleParts.entries())
                .filter(([id, part]) => !part.locked)
                .map(([id, part]) => ({
                    id: id,
                    health: part.health,
                    maxHealth: part.maxHealth,
                    destroyed: part.destroyed
                }))
        };
    }
}