// 戦闘システム - 敵の襲撃と防衛

import * as THREE from 'three';

export class CombatSystem {
    constructor(game) {
        this.game = game;
        
        // 戦闘状態
        this.isUnderAttack = false;
        this.attackWave = 0;
        this.enemies = [];
        this.projectiles = [];
        
        // タイマー
        this.lastAttackTime = 0;
        this.attackInterval = 300000; // 5分間隔
        this.waveTimer = 0;
        
        // 防衛設備
        this.defenseTurrets = [];
        
        // 敵の設定
        this.enemyTypes = {
            SCOUT: {
                name: 'スカウト',
                health: 50,
                speed: 8,
                damage: 10,
                size: 1.5,
                color: 0xff4444,
                reward: { credits: 100, experience: 25 }
            },
            FIGHTER: {
                name: 'ファイター',
                health: 100,
                speed: 6,
                damage: 20,
                size: 2,
                color: 0xff6666,
                reward: { credits: 200, experience: 50 }
            },
            BOMBER: {
                name: 'ボマー',
                health: 200,
                speed: 4,
                damage: 50,
                size: 3,
                color: 0xff8888,
                reward: { credits: 500, experience: 100 }
            }
        };
        
        // 戦闘UI
        this.combatUI = null;
        
        this.init();
    }
    
    init() {
        this.createCombatUI();
        this.updateDefenseTurrets();
        
        // 最初の攻撃タイマーを設定（開始から5分後）
        this.lastAttackTime = Date.now();
        
        console.log('戦闘システム初期化完了');
    }
    
    createCombatUI() {
        this.combatUI = document.createElement('div');
        this.combatUI.id = 'combat-ui';
        this.combatUI.style.cssText = `
            position: fixed;
            top: 80px;
            right: 20px;
            background: rgba(0, 0, 0, 0.8);
            border: 2px solid #ff4444;
            border-radius: 10px;
            padding: 15px;
            color: white;
            display: none;
            z-index: 200;
            min-width: 200px;
        `;
        
        document.body.appendChild(this.combatUI);
    }
    
    updateDefenseTurrets() {
        // 建設済みの防衛タレットを取得
        this.defenseTurrets = [];
        
        if (this.game.systems.building) {
            this.game.systems.building.buildings.forEach((building, id) => {
                if (building.type === 'defense_turret') {
                    // アップグレードされた値を使用（デフォルト値を設定）
                    const damage = building.damage || 25;
                    const range = building.range || 15;
                    const fireRate = building.fireRate || 1000;
                    
                    this.defenseTurrets.push({
                        id: id,
                        position: building.position.clone(),
                        mesh: building.mesh,
                        range: range,
                        damage: damage,
                        fireRate: fireRate, // ミリ秒
                        lastShot: 0,
                        target: null
                    });
                }
            });
        }
    }
    
    update(deltaTime) {
        // 攻撃チェック
        this.checkForAttacks();
        
        // 戦闘中の処理
        if (this.isUnderAttack) {
            this.updateCombat(deltaTime);
        }
        
        // プロジェクタイルの更新
        this.updateProjectiles(deltaTime);
        
        // 防衛設備の更新
        this.updateDefenses(deltaTime);
    }
    
    checkForAttacks() {
        const now = Date.now();
        
        // チュートリアル中は攻撃なし
        if (this.game.systems.tutorial?.currentPhase !== 'ADVANCED') {
            return;
        }
        
        // 攻撃間隔チェック
        if (now - this.lastAttackTime > this.attackInterval && !this.isUnderAttack) {
            this.startAttack();
        }
    }
    
    startAttack() {
        this.isUnderAttack = true;
        this.attackWave++;
        this.waveTimer = 0;
        this.lastAttackTime = Date.now();
        
        // 警告表示
        this.showCombatMessage('🚨 敵の襲撃を検知！防衛体制に入ります！', 'warning');
        
        // 攻撃の難易度は波数に応じて増加
        this.spawnEnemyWave();
        
        // 戦闘UI表示
        this.showCombatUI();
        
        // サウンド
        if (this.game.systems.sound) {
            this.game.systems.sound.play('error');
        }
        
        console.log(`第${this.attackWave}波の攻撃開始`);
    }
    
    spawnEnemyWave() {
        const waveSize = Math.min(3 + this.attackWave, 8);
        const spawnRadius = 50;
        
        for (let i = 0; i < waveSize; i++) {
            setTimeout(() => {
                this.spawnEnemy();
            }, i * 2000); // 2秒間隔で敵を生成
        }
    }
    
    spawnEnemy() {
        // 波数に応じて敵タイプを決定
        let enemyType;
        if (this.attackWave <= 2) {
            enemyType = 'SCOUT';
        } else if (this.attackWave <= 4) {
            enemyType = Math.random() < 0.7 ? 'SCOUT' : 'FIGHTER';
        } else {
            const rand = Math.random();
            if (rand < 0.4) enemyType = 'SCOUT';
            else if (rand < 0.8) enemyType = 'FIGHTER';
            else enemyType = 'BOMBER';
        }
        
        const enemyData = this.enemyTypes[enemyType];
        
        // ランダムな位置から出現（惑星の外周）
        const angle = Math.random() * Math.PI * 2;
        const spawnRadius = 60;
        const spawnX = Math.cos(angle) * spawnRadius;
        const spawnZ = Math.sin(angle) * spawnRadius;
        
        // 敵メッシュ作成
        const geometry = new THREE.ConeGeometry(enemyData.size, enemyData.size * 2, 6);
        const material = new THREE.MeshStandardMaterial({
            color: enemyData.color,
            metalness: 0.8,
            roughness: 0.3
        });
        const enemyMesh = new THREE.Mesh(geometry, material);
        enemyMesh.position.set(spawnX, 10, spawnZ);
        enemyMesh.castShadow = true;
        
        // エフェクト追加
        const glowMaterial = new THREE.MeshBasicMaterial({
            color: enemyData.color,
            transparent: true,
            opacity: 0.3
        });
        const glowGeometry = new THREE.SphereGeometry(enemyData.size * 1.5, 8, 8);
        const glow = new THREE.Mesh(glowGeometry, glowMaterial);
        enemyMesh.add(glow);
        
        // 敵オブジェクト
        const enemy = {
            id: 'enemy_' + Date.now() + '_' + Math.random(),
            type: enemyType,
            data: enemyData,
            mesh: enemyMesh,
            health: enemyData.health,
            maxHealth: enemyData.health,
            speed: enemyData.speed,
            damage: enemyData.damage,
            position: enemyMesh.position,
            velocity: new THREE.Vector3(),
            target: null,
            lastAttack: 0,
            attackCooldown: 3000
        };
        
        // ターゲット設定（最も近い建物を狙う）
        this.setEnemyTarget(enemy);
        
        this.enemies.push(enemy);
        this.game.surfaceScene.add(enemyMesh);
        
        console.log(`敵生成: ${enemyData.name}`);
    }
    
    setEnemyTarget(enemy) {
        let closestTarget = null;
        let closestDistance = Infinity;
        
        // 建物をターゲットとして検索
        if (this.game.systems.building) {
            this.game.systems.building.buildings.forEach((building) => {
                const distance = enemy.position.distanceTo(building.position);
                if (distance < closestDistance) {
                    closestDistance = distance;
                    closestTarget = building.position.clone();
                }
            });
        }
        
        // ターゲットが見つからない場合は惑星中心を狙う
        if (!closestTarget) {
            closestTarget = new THREE.Vector3(0, 0, 0);
        }
        
        enemy.target = closestTarget;
    }
    
    updateCombat(deltaTime) {
        this.waveTimer += deltaTime;
        
        // 敵の移動と攻撃
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const enemy = this.enemies[i];
            this.updateEnemy(enemy, deltaTime);
            
            // 敵が死亡した場合
            if (enemy.health <= 0) {
                this.destroyEnemy(i);
            }
        }
        
        // 戦闘終了チェック
        if (this.enemies.length === 0 && this.waveTimer > 10) {
            this.endAttack();
        }
        
        // 戦闘UI更新
        this.updateCombatUI();
    }
    
    updateEnemy(enemy, deltaTime) {
        if (!enemy.target) return;
        
        // ターゲットに向かって移動
        const direction = enemy.target.clone().sub(enemy.position).normalize();
        enemy.velocity.copy(direction).multiplyScalar(enemy.speed * deltaTime);
        enemy.position.add(enemy.velocity);
        
        // 敵の向きを調整
        enemy.mesh.lookAt(enemy.target);
        
        // 回転アニメーション
        enemy.mesh.rotation.z += deltaTime * 2;
        
        // 建物への攻撃チェック
        const distanceToTarget = enemy.position.distanceTo(enemy.target);
        if (distanceToTarget < 3 && Date.now() - enemy.lastAttack > enemy.attackCooldown) {
            this.enemyAttackBuilding(enemy);
        }
    }
    
    enemyAttackBuilding(enemy) {
        enemy.lastAttack = Date.now();
        
        // 最も近い建物を探して攻撃
        let targetBuilding = null;
        let minDistance = Infinity;
        
        if (this.game.systems.building) {
            this.game.systems.building.buildings.forEach((building, id) => {
                const distance = enemy.position.distanceTo(building.position);
                if (distance < 5 && distance < minDistance) {
                    minDistance = distance;
                    targetBuilding = { id, building };
                }
            });
        }
        
        if (targetBuilding) {
            // 建物にダメージを与える
            this.damageBuilding(targetBuilding.id, enemy.damage);
            
            // エフェクト
            this.createExplosionEffect(targetBuilding.building.position);
            
            // サウンド
            if (this.game.systems.sound) {
                this.game.systems.sound.play('error');
            }
            
            console.log(`敵が建物を攻撃: ${enemy.damage}ダメージ`);
        }
    }
    
    damageBuilding(buildingId, damage) {
        if (!this.game.systems.building) return;
        
        const building = this.game.systems.building.buildings.get(buildingId);
        if (!building) return;
        
        // 建物の耐久度システム（簡易版）
        if (!building.health) {
            building.health = 100;
            building.maxHealth = 100;
        }
        
        building.health -= damage;
        
        // 建物が破壊された場合
        if (building.health <= 0) {
            this.destroyBuilding(buildingId);
        } else {
            // ダメージエフェクト
            this.showBuildingDamage(building);
        }
    }
    
    destroyBuilding(buildingId) {
        if (this.game.systems.building) {
            this.game.systems.building.removeBuilding(buildingId);
            this.showCombatMessage('建物が破壊されました！', 'error');
            
            // 防衛タレットリストを更新
            this.updateDefenseTurrets();
        }
    }
    
    showBuildingDamage(building) {
        // 建物を一時的に赤くする
        const originalColor = building.mesh.material.color.clone();
        building.mesh.material.color.setHex(0xff4444);
        
        setTimeout(() => {
            building.mesh.material.color.copy(originalColor);
        }, 200);
    }
    
    updateDefenses(deltaTime) {
        for (const turret of this.defenseTurrets) {
            this.updateTurret(turret, deltaTime);
        }
    }
    
    updateTurret(turret, deltaTime) {
        const now = Date.now();
        
        // ターゲット検索
        if (!turret.target || turret.target.health <= 0) {
            turret.target = this.findClosestEnemy(turret.position, turret.range);
        }
        
        // 射撃
        if (turret.target && now - turret.lastShot > turret.fireRate) {
            this.turretShoot(turret);
            turret.lastShot = now;
        }
        
        // タレットの向きを調整
        if (turret.target && turret.mesh) {
            turret.mesh.lookAt(turret.target.position);
        }
    }
    
    findClosestEnemy(position, range) {
        let closestEnemy = null;
        let closestDistance = range;
        
        for (const enemy of this.enemies) {
            const distance = position.distanceTo(enemy.position);
            if (distance < closestDistance) {
                closestDistance = distance;
                closestEnemy = enemy;
            }
        }
        
        return closestEnemy;
    }
    
    turretShoot(turret) {
        if (!turret.target) return;
        
        // プロジェクタイル作成
        const projectile = this.createProjectile(
            turret.position.clone(),
            turret.target.position.clone(),
            turret.damage
        );
        
        this.projectiles.push(projectile);
        this.game.surfaceScene.add(projectile.mesh);
        
        // 射撃エフェクト
        this.createMuzzleFlash(turret.position);
        
        // サウンド
        if (this.game.systems.sound) {
            this.game.systems.sound.play('buttonClick');
        }
    }
    
    createProjectile(start, target, damage) {
        const geometry = new THREE.SphereGeometry(0.2, 8, 8);
        const material = new THREE.MeshBasicMaterial({
            color: 0x00ffff,
            transparent: true,
            opacity: 0.8
        });
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.copy(start);
        
        const direction = target.clone().sub(start).normalize();
        const speed = 30;
        
        return {
            mesh: mesh,
            velocity: direction.multiplyScalar(speed),
            damage: damage,
            life: 3.0,
            maxLife: 3.0
        };
    }
    
    updateProjectiles(deltaTime) {
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            const projectile = this.projectiles[i];
            
            // 移動
            projectile.mesh.position.add(
                projectile.velocity.clone().multiplyScalar(deltaTime)
            );
            
            // 寿命減少
            projectile.life -= deltaTime;
            
            // 敵との衝突判定
            let hit = false;
            for (const enemy of this.enemies) {
                const distance = projectile.mesh.position.distanceTo(enemy.position);
                if (distance < 2) {
                    this.damageEnemy(enemy, projectile.damage);
                    hit = true;
                    break;
                }
            }
            
            // プロジェクタイル削除
            if (hit || projectile.life <= 0) {
                this.game.surfaceScene.remove(projectile.mesh);
                this.projectiles.splice(i, 1);
                
                if (hit) {
                    this.createHitEffect(projectile.mesh.position);
                }
            }
        }
    }
    
    damageEnemy(enemy, damage) {
        enemy.health -= damage;
        
        // ダメージエフェクト
        const originalColor = enemy.mesh.material.color.clone();
        enemy.mesh.material.color.setHex(0xffffff);
        
        setTimeout(() => {
            if (enemy.mesh.material) {
                enemy.mesh.material.color.copy(originalColor);
            }
        }, 100);
        
        console.log(`敵にダメージ: ${damage} (残り体力: ${enemy.health})`);
    }
    
    destroyEnemy(index) {
        const enemy = this.enemies[index];
        
        // 報酬獲得
        if (this.game.systems.resource) {
            const reward = enemy.data.reward;
            this.game.systems.resource.addResource('credits', reward.credits);
        }
        
        // 爆発エフェクト
        this.createExplosionEffect(enemy.position);
        
        // メッシュ削除
        this.game.surfaceScene.remove(enemy.mesh);
        
        // 配列から削除
        this.enemies.splice(index, 1);
        
        // サウンド
        if (this.game.systems.sound) {
            this.game.systems.sound.play('success');
        }
        
        console.log(`敵を撃破: ${enemy.data.name}`);
    }
    
    endAttack() {
        this.isUnderAttack = false;
        
        // 戦闘終了メッセージ
        this.showCombatMessage('✅ 襲撃を撃退しました！次の攻撃まで防衛を強化しましょう。', 'success');
        
        // 戦闘UI非表示
        this.hideCombatUI();
        
        // サウンド
        if (this.game.systems.sound) {
            this.game.systems.sound.play('buildingComplete');
        }
        
        console.log(`第${this.attackWave}波撃退完了`);
    }
    
    createExplosionEffect(position) {
        // 簡易爆発エフェクト
        const particleCount = 15;
        const particles = [];
        
        for (let i = 0; i < particleCount; i++) {
            const geometry = new THREE.SphereGeometry(0.2, 4, 4);
            const material = new THREE.MeshBasicMaterial({
                color: Math.random() > 0.5 ? 0xff6600 : 0xffaa00,
                transparent: true,
                opacity: 1
            });
            const particle = new THREE.Mesh(geometry, material);
            particle.position.copy(position);
            
            // ランダムな方向
            particle.userData.velocity = new THREE.Vector3(
                (Math.random() - 0.5) * 20,
                Math.random() * 15 + 5,
                (Math.random() - 0.5) * 20
            );
            
            this.game.surfaceScene.add(particle);
            particles.push(particle);
        }
        
        // パーティクルアニメーション
        const animateExplosion = () => {
            let allDone = true;
            
            for (const particle of particles) {
                particle.position.add(particle.userData.velocity.clone().multiplyScalar(0.02));
                particle.userData.velocity.y -= 0.5; // 重力
                particle.material.opacity -= 0.03;
                
                if (particle.material.opacity > 0) {
                    allDone = false;
                } else {
                    this.game.surfaceScene.remove(particle);
                }
            }
            
            if (!allDone) {
                requestAnimationFrame(animateExplosion);
            }
        };
        
        animateExplosion();
    }
    
    createMuzzleFlash(position) {
        const geometry = new THREE.SphereGeometry(0.5, 8, 8);
        const material = new THREE.MeshBasicMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 1
        });
        const flash = new THREE.Mesh(geometry, material);
        flash.position.copy(position);
        
        this.game.surfaceScene.add(flash);
        
        // フェードアウト
        let opacity = 1;
        const fadeOut = () => {
            opacity -= 0.1;
            if (opacity > 0) {
                flash.material.opacity = opacity;
                requestAnimationFrame(fadeOut);
            } else {
                this.game.surfaceScene.remove(flash);
            }
        };
        fadeOut();
    }
    
    createHitEffect(position) {
        // 着弾エフェクト
        this.createMuzzleFlash(position);
    }
    
    showCombatUI() {
        this.combatUI.style.display = 'block';
    }
    
    hideCombatUI() {
        this.combatUI.style.display = 'none';
    }
    
    updateCombatUI() {
        if (!this.isUnderAttack) return;
        
        const enemyCount = this.enemies.length;
        const turretCount = this.defenseTurrets.length;
        
        this.combatUI.innerHTML = `
            <h4 style="color: #ff4444; margin: 0 0 10px 0;">⚔️ 戦闘中</h4>
            <div style="margin-bottom: 5px;">波: ${this.attackWave}</div>
            <div style="margin-bottom: 5px;">敵: ${enemyCount}</div>
            <div style="margin-bottom: 5px;">防衛: ${turretCount}</div>
            <div style="font-size: 12px; color: #aaa; margin-top: 10px;">
                防衛タレットを建設して<br>
                惑星を守りましょう！
            </div>
        `;
    }
    
    showCombatMessage(text, type = 'info') {
        const message = document.createElement('div');
        message.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: ${type === 'error' ? 'rgba(255, 0, 0, 0.9)' : 
                        type === 'warning' ? 'rgba(255, 165, 0, 0.9)' : 
                        type === 'success' ? 'rgba(0, 255, 0, 0.9)' : 'rgba(0, 255, 255, 0.9)'};
            color: white;
            padding: 20px 30px;
            border-radius: 10px;
            font-size: 18px;
            font-weight: bold;
            max-width: 400px;
            text-align: center;
            z-index: 10000;
            animation: combatMessageFade 4s ease;
        `;
        message.textContent = text;
        
        // アニメーション
        const style = document.createElement('style');
        style.textContent = `
            @keyframes combatMessageFade {
                0% { opacity: 0; transform: translate(-50%, -50%) scale(0.8); }
                15% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
                85% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
                100% { opacity: 0; transform: translate(-50%, -50%) scale(0.8); }
            }
        `;
        document.head.appendChild(style);
        
        document.body.appendChild(message);
        
        setTimeout(() => {
            message.remove();
            style.remove();
        }, 4000);
    }
    
    // 手動攻撃開始（デバッグ用）
    triggerAttack() {
        if (!this.isUnderAttack) {
            this.startAttack();
        }
    }
    
    // クリーンアップ
    dispose() {
        // 敵を全て削除
        for (const enemy of this.enemies) {
            if (enemy.mesh && enemy.mesh.parent) {
                enemy.mesh.parent.remove(enemy.mesh);
            }
        }
        this.enemies = [];
        
        // プロジェクタイルを全て削除
        for (const projectile of this.projectiles) {
            if (projectile.mesh && projectile.mesh.parent) {
                projectile.mesh.parent.remove(projectile.mesh);
            }
        }
        this.projectiles = [];
        
        // UI削除
        if (this.combatUI && this.combatUI.parentNode) {
            this.combatUI.parentNode.removeChild(this.combatUI);
        }
    }
}