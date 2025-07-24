// ダークネビュラ（ルナの父）- 特殊ボスキャラクター

import * as THREE from 'three';

export class DarkNebulaBoss {
    constructor(scene, position = new THREE.Vector3(0, 0, -100)) {
        this.scene = scene;
        this.position = position;
        this.group = new THREE.Group();
        this.group.position.copy(position);
        
        // ボスのステータス
        this.health = 8000;
        this.maxHealth = 8000;
        this.phase = 1;
        this.isAlive = true;
        this.invulnerable = false;
        
        // 特殊能力
        this.isRevealed = false; // 正体が明かされたか
        this.humanityLevel = 0; // 人間性の残り（0-100）
        
        // 移動パラメータ
        this.moveSpeed = 15;
        this.rotationSpeed = 0.02;
        this.dodgeSpeed = 30;
        this.targetPosition = null;
        
        // 攻撃パラメータ
        this.weapons = [];
        this.lastAttackTime = Date.now();
        
        this.createModel();
        this.setupWeapons();
        
        this.scene.add(this.group);
    }
    
    createModel() {
        // メイン船体（黒と紫のカラーリング）
        const hullGeometry = new THREE.BoxGeometry(20, 8, 30);
        const hullMaterial = new THREE.MeshStandardMaterial({
            color: 0x2a0845,
            emissive: 0x6600cc,
            emissiveIntensity: 0.3,
            metalness: 0.8,
            roughness: 0.3
        });
        this.hullMesh = new THREE.Mesh(hullGeometry, hullMaterial);
        
        // 仮面モチーフの装飾
        const maskGeometry = new THREE.ConeGeometry(15, 20, 4);
        const maskMaterial = new THREE.MeshPhongMaterial({
            color: 0x000000,
            emissive: 0xff0066
        });
        const mask = new THREE.Mesh(maskGeometry, maskMaterial);
        mask.position.z = -15;
        mask.rotation.z = Math.PI / 4;
        
        // ウィング（翼のような形状）
        const wingGeometry = new THREE.BoxGeometry(50, 2, 15);
        const wingMaterial = new THREE.MeshPhongMaterial({
            color: 0x1a0033,
            emissive: 0x9900ff,
            emissiveIntensity: 0.2
        });
        
        const leftWing = new THREE.Mesh(wingGeometry, wingMaterial);
        leftWing.position.x = -20;
        leftWing.rotation.z = -0.3;
        
        const rightWing = new THREE.Mesh(wingGeometry, wingMaterial);
        rightWing.position.x = 20;
        rightWing.rotation.z = 0.3;
        
        // エンジン
        const engineGeometry = new THREE.CylinderGeometry(3, 4, 10);
        const engineMaterial = new THREE.MeshPhongMaterial({
            color: 0x6600ff,
            emissive: 0xff00ff,
            emissiveIntensity: 0.8
        });
        
        for (let i = 0; i < 4; i++) {
            const engine = new THREE.Mesh(engineGeometry, engineMaterial);
            engine.position.z = 15;
            engine.position.x = (i - 1.5) * 8;
            engine.rotation.x = Math.PI / 2;
            
            // エンジンの光
            const light = new THREE.PointLight(0xff00ff, 2, 30);
            light.position.copy(engine.position);
            light.position.z += 5;
            
            this.group.add(engine);
            this.group.add(light);
        }
        
        // パーティクルエフェクト（虚無のオーラ）
        this.createVoidAura();
        
        // グループに追加
        this.group.add(this.hullMesh);
        this.group.add(mask);
        this.group.add(leftWing);
        this.group.add(rightWing);
        
        // 初期サイズ調整
        this.group.scale.set(1.5, 1.5, 1.5);
    }
    
    createVoidAura() {
        const particleCount = 100;
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        
        for (let i = 0; i < particleCount; i++) {
            positions[i * 3] = (Math.random() - 0.5) * 40;
            positions[i * 3 + 1] = (Math.random() - 0.5) * 40;
            positions[i * 3 + 2] = (Math.random() - 0.5) * 40;
        }
        
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        
        const material = new THREE.PointsMaterial({
            color: 0x9900ff,
            size: 2,
            transparent: true,
            opacity: 0.6,
            blending: THREE.AdditiveBlending
        });
        
        this.voidAura = new THREE.Points(geometry, material);
        this.group.add(this.voidAura);
    }
    
    setupWeapons() {
        // 虚無ビーム砲
        this.weapons.push({
            type: 'void_beam',
            cooldown: 2000,
            lastFired: 0,
            damage: 30,
            color: 0x9900ff
        });
        
        // シャドウミサイル
        this.weapons.push({
            type: 'shadow_missile',
            cooldown: 3000,
            lastFired: 0,
            damage: 40,
            count: 4
        });
        
        // ダークパルス（全方位攻撃）
        this.weapons.push({
            type: 'dark_pulse',
            cooldown: 5000,
            lastFired: 0,
            damage: 20,
            radius: 100
        });
        
        // 人間性が残っている時の特殊攻撃
        this.weapons.push({
            type: 'conflicted_shot',
            cooldown: 4000,
            lastFired: 0,
            damage: 10,
            warning: true // 警告付きの弱い攻撃
        });
    }
    
    update(deltaTime, playerPosition) {
        if (!this.isAlive) return;
        
        // 虚無のオーラアニメーション
        if (this.voidAura) {
            this.voidAura.rotation.y += 0.01;
            this.voidAura.rotation.x += 0.005;
        }
        
        // フェーズによる行動パターン
        if (this.phase === 1) {
            // 通常の攻撃パターン
            this.normalBehavior(deltaTime, playerPosition);
        } else if (this.phase === 2) {
            // 正体判明後、葛藤しながら戦う
            this.conflictedBehavior(deltaTime, playerPosition);
        } else if (this.phase === 3) {
            // 最終フェーズ、虚無に完全に支配
            this.voidControlledBehavior(deltaTime, playerPosition);
        }
        
        // HPによるフェーズ移行
        const healthPercent = this.health / this.maxHealth;
        if (healthPercent < 0.6 && this.phase === 1 && this.isRevealed) {
            this.enterPhase2();
        } else if (healthPercent < 0.3 && this.phase === 2) {
            this.enterPhase3();
        }
    }
    
    normalBehavior(deltaTime, playerPosition) {
        // プレイヤーとの距離を保つ
        const distance = this.group.position.distanceTo(playerPosition);
        
        if (distance < 80) {
            // 離れる
            const direction = this.group.position.clone().sub(playerPosition).normalize();
            this.group.position.add(direction.multiplyScalar(this.moveSpeed * deltaTime));
        } else if (distance > 120) {
            // 近づく
            const direction = playerPosition.clone().sub(this.group.position).normalize();
            this.group.position.add(direction.multiplyScalar(this.moveSpeed * deltaTime));
        }
        
        // 横移動
        const time = Date.now() * 0.001;
        this.group.position.x += Math.sin(time) * this.dodgeSpeed * deltaTime;
        
        // プレイヤーの方を向く
        this.group.lookAt(playerPosition);
    }
    
    conflictedBehavior(deltaTime, playerPosition) {
        // 葛藤による不規則な動き
        const time = Date.now() * 0.001;
        this.group.position.x += Math.sin(time * 2) * this.dodgeSpeed * deltaTime * 1.5;
        this.group.position.y += Math.cos(time * 3) * 10 * deltaTime;
        
        // 時々動きが止まる（内なる戦い）
        if (Math.random() < 0.02) {
            this.invulnerable = true;
            this.showConflictEffect();
            
            setTimeout(() => {
                this.invulnerable = false;
            }, 1000);
        }
    }
    
    voidControlledBehavior(deltaTime, playerPosition) {
        // 虚無に完全支配、激しい攻撃
        const time = Date.now() * 0.001;
        
        // 高速で円を描く動き
        const radius = 100;
        this.group.position.x = Math.cos(time * 2) * radius;
        this.group.position.z = Math.sin(time * 2) * radius - 100;
        
        // 常にプレイヤーを狙う
        this.group.lookAt(playerPosition);
    }
    
    updateWeapons(deltaTime, playerPosition) {
        const now = Date.now();
        const projectiles = [];
        
        this.weapons.forEach(weapon => {
            if (now - weapon.lastFired > weapon.cooldown) {
                if (weapon.type === 'void_beam') {
                    projectiles.push(this.fireVoidBeam(playerPosition));
                    weapon.lastFired = now;
                } else if (weapon.type === 'shadow_missile' && this.phase >= 2) {
                    const missiles = this.fireShadowMissiles(playerPosition);
                    projectiles.push(...missiles);
                    weapon.lastFired = now;
                } else if (weapon.type === 'dark_pulse' && this.phase === 3) {
                    projectiles.push(this.fireDarkPulse());
                    weapon.lastFired = now;
                } else if (weapon.type === 'conflicted_shot' && this.phase === 2 && this.humanityLevel > 20) {
                    projectiles.push(this.fireConflictedShot(playerPosition));
                    weapon.lastFired = now;
                }
            }
        });
        
        return projectiles.filter(p => p !== null);
    }
    
    fireVoidBeam(targetPosition) {
        const direction = targetPosition.clone().sub(this.group.position).normalize();
        
        return {
            position: this.group.position.clone(),
            velocity: direction.multiplyScalar(50),
            damage: 30,
            color: 0x9900ff,
            type: 'void_beam',
            size: 3
        };
    }
    
    fireShadowMissiles(targetPosition) {
        const missiles = [];
        
        for (let i = 0; i < 4; i++) {
            const angle = (i / 4) * Math.PI * 2;
            const offset = new THREE.Vector3(
                Math.cos(angle) * 20,
                Math.sin(angle) * 20,
                0
            );
            
            const position = this.group.position.clone().add(offset);
            const direction = targetPosition.clone().sub(position).normalize();
            
            missiles.push({
                position: position,
                velocity: direction.multiplyScalar(30),
                damage: 40,
                color: 0x660099,
                type: 'shadow_missile',
                size: 2,
                homing: true
            });
        }
        
        return missiles;
    }
    
    fireDarkPulse() {
        // 全方位にパルスを発射
        return {
            position: this.group.position.clone(),
            type: 'dark_pulse',
            damage: 20,
            radius: 100,
            expanding: true,
            color: 0x9900ff
        };
    }
    
    fireConflictedShot(targetPosition) {
        // 人間性が残っている時の弱い攻撃（わざと外す）
        const direction = targetPosition.clone().sub(this.group.position).normalize();
        
        // わざと照準をずらす
        direction.x += (Math.random() - 0.5) * 0.5;
        direction.y += (Math.random() - 0.5) * 0.5;
        
        return {
            position: this.group.position.clone(),
            velocity: direction.multiplyScalar(20),
            damage: 10,
            color: 0xffff00,
            type: 'warning_shot',
            size: 2,
            message: '逃げろ...' // ルナへの警告
        };
    }
    
    takeDamage(damage) {
        if (this.invulnerable || !this.isAlive) return;
        
        this.health -= damage;
        
        // ダメージエフェクト
        this.showDamageEffect();
        
        // ルナの呼びかけで人間性が回復
        if (this.isRevealed && Math.random() < 0.1) {
            this.humanityLevel = Math.min(100, this.humanityLevel + 5);
        }
        
        if (this.health <= 0) {
            this.health = 0;
            this.defeat();
        }
    }
    
    showDamageEffect() {
        this.hullMesh.material.emissive = new THREE.Color(1, 0, 0);
        // emissiveIntensityはMeshStandardMaterialでのみサポート
        if ('emissiveIntensity' in this.hullMesh.material) {
            this.hullMesh.material.emissiveIntensity = 1;
        }
        
        setTimeout(() => {
            if ('emissiveIntensity' in this.hullMesh.material) {
                this.hullMesh.material.emissiveIntensity = 0.3;
            }
        }, 100);
    }
    
    showConflictEffect() {
        // 葛藤エフェクト（黄色い光）
        const conflictLight = new THREE.PointLight(0xffff00, 10, 50);
        conflictLight.position.copy(this.group.position);
        this.scene.add(conflictLight);
        
        setTimeout(() => {
            this.scene.remove(conflictLight);
        }, 500);
    }
    
    enterPhase2() {
        this.phase = 2;
        this.humanityLevel = 50; // 人間性が戻り始める
        console.log('ダークネビュラ: フェーズ2 - 葛藤');
    }
    
    enterPhase3() {
        this.phase = 3;
        this.humanityLevel = 0; // 完全に虚無に支配
        this.invulnerable = false;
        
        // 見た目を変更（より禍々しく）
        this.hullMesh.material.color = new THREE.Color(0x000000);
        this.hullMesh.material.emissive = new THREE.Color(0xff0000);
        if ('emissiveIntensity' in this.hullMesh.material) {
            this.hullMesh.material.emissiveIntensity = 0.5;
        }
        
        console.log('ダークネビュラ: フェーズ3 - 完全支配');
    }
    
    defeat() {
        this.isAlive = false;
        
        // 最後の人間性の光
        if (this.humanityLevel > 0) {
            this.showFinalHumanity();
        }
        
        // 撃破エフェクト
        this.defeatAnimation();
    }
    
    showFinalHumanity() {
        // 最後に人間性を取り戻す演出
        const light = new THREE.PointLight(0xffffff, 20, 100);
        light.position.copy(this.group.position);
        this.scene.add(light);
        
        // 「ルナ...すまない...」というメッセージを表示する処理をここに
    }
    
    defeatAnimation() {
        // 段階的な爆発
        for (let i = 0; i < 15; i++) {
            setTimeout(() => {
                const explosion = new THREE.PointLight(0x9900ff, 10, 80);
                explosion.position.copy(this.group.position);
                explosion.position.add(new THREE.Vector3(
                    (Math.random() - 0.5) * 30,
                    (Math.random() - 0.5) * 30,
                    (Math.random() - 0.5) * 30
                ));
                this.scene.add(explosion);
                
                setTimeout(() => {
                    this.scene.remove(explosion);
                }, 1000);
            }, i * 150);
        }
        
        // 本体を削除
        setTimeout(() => {
            this.scene.remove(this.group);
            this.cleanup();
        }, 3000);
    }
    
    cleanup() {
        this.group.traverse(child => {
            if (child.geometry) child.geometry.dispose();
            if (child.material) {
                if (Array.isArray(child.material)) {
                    child.material.forEach(m => m.dispose());
                } else {
                    child.material.dispose();
                }
            }
        });
    }
    
    // 正体を明かす
    revealIdentity() {
        this.isRevealed = true;
        this.humanityLevel = 30;
        
        // 仮面が少し割れる演出など
        console.log('ダークネビュラの正体が明かされた！');
    }
    
    getStatus() {
        return {
            name: this.isRevealed ? 'ヴィクター・スカイウォーカー' : 'ダークネビュラ',
            health: this.health,
            maxHealth: this.maxHealth,
            phase: this.phase,
            humanityLevel: this.humanityLevel,
            subtitle: this.getSubtitle()
        };
    }
    
    getSubtitle() {
        if (!this.isRevealed) return '謎の番人';
        if (this.phase === 2) return '葛藤する魂';
        if (this.phase === 3) return '虚無の化身';
        return '失われた者';
    }
}