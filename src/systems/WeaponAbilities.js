// 特殊武器能力システム

import * as THREE from 'three';

export class WeaponAbilities {
    constructor(game) {
        this.game = game;
        this.activeAbilities = [];
        
        // アビリティクールダウン
        this.abilityCooldowns = new Map();
        
        // アビリティ定義
        this.defineAbilities();
    }
    
    defineAbilities() {
        this.abilities = {
            // イオンビーム - 貫通ビーム
            ionBeam: {
                id: 'ionBeam',
                name: 'イオンビーム',
                description: '強力な貫通ビームを発射',
                cooldown: 5000,
                energyCost: 50,
                execute: () => this.executeIonBeam()
            },
            
            // シールドプロジェクター - 防御バリア
            shieldBarrier: {
                id: 'shieldBarrier',
                name: 'シールドバリア',
                description: '一時的な防御シールドを展開',
                cooldown: 10000,
                energyCost: 30,
                execute: () => this.executeShieldBarrier()
            },
            
            // EMP爆発 - 範囲スタン
            empBlast: {
                id: 'empBlast',
                name: 'EMP爆発',
                description: '周囲の敵を無力化',
                cooldown: 8000,
                energyCost: 40,
                execute: () => this.executeEMPBlast()
            },
            
            // 量子魚雷 - 追尾＆貫通
            quantumTorpedo: {
                id: 'quantumTorpedo',
                name: '量子魚雷',
                description: '障害物を貫通する追尾魚雷',
                cooldown: 15000,
                energyCost: 80,
                execute: () => this.executeQuantumTorpedo()
            },
            
            // レーザーアレイ - 全方位攻撃
            laserArray: {
                id: 'laserArray',
                name: 'レーザーアレイ',
                description: '回転する多連装レーザー',
                cooldown: 12000,
                energyCost: 60,
                duration: 5000,
                execute: () => this.executeLaserArray()
            },
            
            // オーバードライブ - 全武器強化
            overdrive: {
                id: 'overdrive',
                name: 'オーバードライブ',
                description: '全武器を一時的に強化',
                cooldown: 20000,
                energyCost: 0, // エネルギー消費なし
                duration: 10000,
                execute: () => this.executeOverdrive()
            },
            
            // タイムディレーション - 時間減速
            timeDilation: {
                id: 'timeDilation',
                name: 'タイムディレーション',
                description: '周囲の時間を減速',
                cooldown: 30000,
                energyCost: 100,
                duration: 5000,
                execute: () => this.executeTimeDilation()
            }
        };
    }
    
    executeAbility(abilityId) {
        const ability = this.abilities[abilityId];
        if (!ability) return false;
        
        // クールダウンチェック
        if (this.isOnCooldown(abilityId)) {
            const remaining = this.getRemainingCooldown(abilityId);
            this.game.showMessage(`クールダウン中: ${Math.ceil(remaining / 1000)}秒`, 1000);
            return false;
        }
        
        // エネルギーチェック
        if (this.game.energySystem && ability.energyCost > 0) {
            if (!this.game.energySystem.canUseEnergy(ability.energyCost)) {
                this.game.showMessage('エネルギー不足！', 1000);
                return false;
            }
        }
        
        // アビリティ実行
        ability.execute();
        
        // クールダウン開始
        this.startCooldown(abilityId, ability.cooldown);
        
        // エネルギー消費（オーバードライブは例外）
        if (ability.energyCost > 0 && this.game.energySystem) {
            this.game.energySystem.useEnergy(ability.energyCost);
        }
        
        // サウンド再生
        if (this.game.soundManager) {
            this.game.soundManager.play('ability_activate');
        }
        
        return true;
    }
    
    executeIonBeam() {
        const player = this.game.player;
        if (!player) return;
        
        // ビーム方向
        const direction = new THREE.Vector3(0, 0, -1);
        direction.applyQuaternion(player.group.quaternion);
        
        // レイキャストで敵を検出
        const raycaster = new THREE.Raycaster();
        raycaster.set(player.group.position, direction);
        raycaster.far = 200;
        
        // ビームエフェクト
        const endPoint = player.group.position.clone().add(direction.multiplyScalar(200));
        if (this.game.weaponEffects) {
            this.game.weaponEffects.createIonBeamEffect(
                player.group.position,
                endPoint,
                0x00ffff,
                3
            );
        }
        
        // ダメージ処理
        this.game.enemies.forEach(enemy => {
            if (!enemy.isAlive) return;
            
            const intersects = raycaster.intersectObject(enemy.group, true);
            if (intersects.length > 0) {
                enemy.takeDamage(100);
                
                // ヒットマーカー
                if (this.game.hitMarkers) {
                    this.game.hitMarkers.addHitMarker(enemy.group.position, true);
                }
            }
        });
        
        // サウンド
        if (this.game.soundManager) {
            this.game.soundManager.play('ion_charge');
        }
        
        // ルナのボイス
        if (this.game.companionSystem) {
            this.game.companionSystem.playVoice('special_attack');
        }
    }
    
    executeShieldBarrier() {
        const player = this.game.player;
        if (!player) return;
        
        // シールドエフェクト
        if (this.game.weaponEffects) {
            const shield = this.game.weaponEffects.createShieldEffect(
                player.group,
                5,
                5 // 5秒間
            );
            
            // シールド機能を追加
            const originalTakeDamage = player.takeDamage.bind(player);
            player.takeDamage = (damage) => {
                // ダメージを50%軽減
                originalTakeDamage(damage * 0.5);
                
                // シールドヒットエフェクト
                if (shield && shield.material) {
                    shield.material.opacity = 0.8;
                    setTimeout(() => {
                        if (shield.material) {
                            shield.material.opacity = 0.3;
                        }
                    }, 100);
                }
            };
            
            // 5秒後にシールド解除
            setTimeout(() => {
                player.takeDamage = originalTakeDamage;
            }, 5000);
        }
        
        // サウンド
        if (this.game.soundManager) {
            this.game.soundManager.play('shield_activate');
        }
        
        this.game.showMessage('シールド展開！', 2000);
    }
    
    executeEMPBlast() {
        const player = this.game.player;
        if (!player) return;
        
        const blastRadius = 50;
        
        // EMP爆発エフェクト
        if (this.game.weaponEffects) {
            this.game.weaponEffects.createEMPBlastEffect(
                player.group.position,
                blastRadius
            );
        }
        
        // 範囲内の敵にスタン効果
        let stunnedCount = 0;
        this.game.enemies.forEach(enemy => {
            if (!enemy.isAlive) return;
            
            const distance = enemy.group.position.distanceTo(player.group.position);
            if (distance <= blastRadius) {
                // スタン効果（3秒）
                if (enemy.applyStun) {
                    enemy.applyStun(3000);
                } else {
                    // スタン機能がない場合は速度を0に
                    const originalSpeed = enemy.speed;
                    enemy.speed = 0;
                    setTimeout(() => {
                        enemy.speed = originalSpeed;
                    }, 3000);
                }
                stunnedCount++;
                
                // スタンエフェクト
                this.createStunEffect(enemy.group);
            }
        });
        
        // サウンド
        if (this.game.soundManager) {
            this.game.soundManager.play('emp_blast');
        }
        
        this.game.showMessage(`${stunnedCount}体の敵を無力化！`, 2000);
    }
    
    executeQuantumTorpedo() {
        const targets = [];
        
        // ターゲット選択（最大5体）
        const sortedEnemies = this.game.enemies
            .filter(e => e.isAlive)
            .sort((a, b) => {
                const distA = a.group.position.distanceTo(this.game.player.group.position);
                const distB = b.group.position.distanceTo(this.game.player.group.position);
                return distA - distB;
            })
            .slice(0, 5);
        
        sortedEnemies.forEach((enemy, index) => {
            setTimeout(() => {
                // 量子魚雷を発射
                const torpedo = this.createQuantumTorpedo(enemy);
                this.activeAbilities.push(torpedo);
            }, index * 200); // 200ms間隔で発射
        });
        
        // サウンド
        if (this.game.soundManager) {
            this.game.soundManager.play('quantum_launch');
        }
        
        this.game.showMessage('量子魚雷発射！', 2000);
    }
    
    createQuantumTorpedo(target) {
        const player = this.game.player;
        const startPos = player.group.position.clone();
        startPos.y += 2;
        
        // 魚雷メッシュ
        const geometry = new THREE.ConeGeometry(0.5, 2, 8);
        const material = new THREE.MeshBasicMaterial({
            color: 0xff00ff,
            emissive: 0xff00ff,
            emissiveIntensity: 1
        });
        
        const torpedo = new THREE.Mesh(geometry, material);
        torpedo.position.copy(startPos);
        this.game.scene.add(torpedo);
        
        // 量子エフェクト
        const quantumEffect = this.createQuantumEffect(torpedo);
        
        // 魚雷の挙動
        const torpedoData = {
            mesh: torpedo,
            target: target,
            speed: 80,
            damage: 200,
            lifeTime: 10,
            effect: quantumEffect,
            update: (delta) => {
                if (!target.isAlive || torpedoData.lifeTime <= 0) {
                    this.game.scene.remove(torpedo);
                    if (quantumEffect) {
                        this.game.scene.remove(quantumEffect);
                    }
                    return true; // 削除
                }
                
                // ターゲットへの方向
                const direction = target.group.position.clone()
                    .sub(torpedo.position)
                    .normalize();
                
                // 移動
                torpedo.position.add(
                    direction.multiplyScalar(torpedoData.speed * delta)
                );
                
                // 回転
                torpedo.lookAt(target.group.position);
                torpedo.rotateX(-Math.PI / 2);
                
                // 量子エフェクトの位置更新
                if (quantumEffect) {
                    quantumEffect.position.copy(torpedo.position);
                }
                
                // 衝突判定
                const distance = torpedo.position.distanceTo(target.group.position);
                if (distance < 3) {
                    target.takeDamage(torpedoData.damage);
                    
                    // 爆発エフェクト
                    this.createQuantumExplosion(torpedo.position);
                    
                    // クリーンアップ
                    this.game.scene.remove(torpedo);
                    if (quantumEffect) {
                        this.game.scene.remove(quantumEffect);
                    }
                    return true;
                }
                
                torpedoData.lifeTime -= delta;
                return false;
            }
        };
        
        return torpedoData;
    }
    
    createQuantumEffect(parent) {
        const group = new THREE.Group();
        
        // 量子リング
        for (let i = 0; i < 3; i++) {
            const ringGeometry = new THREE.TorusGeometry(1 + i * 0.3, 0.1, 8, 16);
            const ringMaterial = new THREE.MeshBasicMaterial({
                color: 0xff00ff,
                transparent: true,
                opacity: 0.5 - i * 0.1
            });
            
            const ring = new THREE.Mesh(ringGeometry, ringMaterial);
            ring.rotation.x = Math.random() * Math.PI;
            ring.rotation.y = Math.random() * Math.PI;
            
            // 回転アニメーション
            const rotateRing = () => {
                ring.rotation.x += 0.05;
                ring.rotation.y += 0.03;
                requestAnimationFrame(rotateRing);
            };
            rotateRing();
            
            group.add(ring);
        }
        
        parent.add(group);
        return group;
    }
    
    createQuantumExplosion(position) {
        if (!this.game.weaponEffects) return;
        
        // 量子爆発エフェクト
        const explosionGeometry = new THREE.SphereGeometry(0.1, 16, 16);
        const explosionMaterial = new THREE.MeshBasicMaterial({
            color: 0xff00ff,
            transparent: true,
            opacity: 1
        });
        
        const explosion = new THREE.Mesh(explosionGeometry, explosionMaterial);
        explosion.position.copy(position);
        this.game.scene.add(explosion);
        
        // 拡大アニメーション
        const animate = () => {
            explosion.scale.multiplyScalar(1.2);
            explosion.material.opacity -= 0.05;
            
            if (explosion.material.opacity > 0) {
                requestAnimationFrame(animate);
            } else {
                this.game.scene.remove(explosion);
                explosionGeometry.dispose();
                explosionMaterial.dispose();
            }
        };
        animate();
    }
    
    executeLaserArray() {
        const player = this.game.player;
        if (!player) return;
        
        const beamCount = 8;
        const beamLength = 100;
        const rotationSpeed = 2;
        const duration = 5000;
        
        // レーザーアレイグループ
        const arrayGroup = new THREE.Group();
        player.group.add(arrayGroup);
        
        // ビーム作成
        const beams = [];
        for (let i = 0; i < beamCount; i++) {
            const angle = (Math.PI * 2 / beamCount) * i;
            
            const beamGeometry = new THREE.CylinderGeometry(0.2, 0.2, beamLength, 8);
            const beamMaterial = new THREE.MeshBasicMaterial({
                color: 0xff0000,
                transparent: true,
                opacity: 0.8,
                emissive: 0xff0000,
                emissiveIntensity: 1
            });
            
            const beam = new THREE.Mesh(beamGeometry, beamMaterial);
            beam.position.set(
                Math.cos(angle) * 5,
                0,
                Math.sin(angle) * 5
            );
            beam.rotation.z = Math.PI / 2;
            beam.rotation.y = angle;
            
            arrayGroup.add(beam);
            beams.push(beam);
        }
        
        // レーザーアレイの動作
        const startTime = Date.now();
        const arrayAbility = {
            update: (delta) => {
                const elapsed = Date.now() - startTime;
                
                if (elapsed > duration) {
                    // 終了処理
                    player.group.remove(arrayGroup);
                    beams.forEach(beam => {
                        beam.geometry.dispose();
                        beam.material.dispose();
                    });
                    return true;
                }
                
                // 回転
                arrayGroup.rotation.y += rotationSpeed * delta;
                
                // ダメージ判定
                beams.forEach(beam => {
                    const beamWorldPos = new THREE.Vector3();
                    beam.getWorldPosition(beamWorldPos);
                    
                    const beamDirection = new THREE.Vector3(1, 0, 0);
                    beamDirection.applyQuaternion(beam.quaternion);
                    
                    // レイキャスト
                    const raycaster = new THREE.Raycaster();
                    raycaster.set(beamWorldPos, beamDirection);
                    raycaster.far = beamLength;
                    
                    this.game.enemies.forEach(enemy => {
                        if (!enemy.isAlive) return;
                        
                        const intersects = raycaster.intersectObject(enemy.group, true);
                        if (intersects.length > 0) {
                            enemy.takeDamage(5 * delta * 60); // DPS: 300
                        }
                    });
                });
                
                return false;
            }
        };
        
        this.activeAbilities.push(arrayAbility);
        
        // サウンド
        if (this.game.soundManager) {
            this.game.soundManager.play('laser_array');
        }
        
        this.game.showMessage('レーザーアレイ起動！', 2000);
    }
    
    executeOverdrive() {
        const duration = 10000;
        
        // すべての武器を強化
        if (this.game.weaponSystem) {
            const originalFireRates = {
                primary: this.game.weaponSystem.primaryWeapon.fireRate,
                secondary: this.game.weaponSystem.secondaryWeapon?.fireRate,
                special: this.game.weaponSystem.specialWeapon?.fireRate
            };
            
            // 連射速度2倍
            if (this.game.weaponSystem.primaryWeapon) {
                this.game.weaponSystem.primaryWeapon.fireRate *= 0.5;
            }
            if (this.game.weaponSystem.secondaryWeapon) {
                this.game.weaponSystem.secondaryWeapon.fireRate *= 0.5;
            }
            
            // ダメージ1.5倍
            const originalDamageMultiplier = this.game.player.damageMultiplier || 1;
            this.game.player.damageMultiplier = 1.5;
            
            // エネルギー無限
            if (this.game.energySystem) {
                this.game.energySystem.activateBoost(duration / 1000, 999);
            }
            
            // 効果終了時に元に戻す
            setTimeout(() => {
                if (this.game.weaponSystem.primaryWeapon) {
                    this.game.weaponSystem.primaryWeapon.fireRate = originalFireRates.primary;
                }
                if (this.game.weaponSystem.secondaryWeapon) {
                    this.game.weaponSystem.secondaryWeapon.fireRate = originalFireRates.secondary;
                }
                this.game.player.damageMultiplier = originalDamageMultiplier;
                
                this.game.showMessage('オーバードライブ終了', 2000);
            }, duration);
        }
        
        // ビジュアルエフェクト
        this.createOverdriveEffect(duration);
        
        // サウンド
        if (this.game.soundManager) {
            this.game.soundManager.play('overdrive_activate');
        }
        
        this.game.showMessage('オーバードライブ発動！', 3000);
    }
    
    createOverdriveEffect(duration) {
        const player = this.game.player;
        if (!player) return;
        
        // オーラエフェクト
        const auraGeometry = new THREE.SphereGeometry(6, 16, 16);
        const auraMaterial = new THREE.MeshBasicMaterial({
            color: 0xffaa00,
            transparent: true,
            opacity: 0.3,
            side: THREE.BackSide
        });
        
        const aura = new THREE.Mesh(auraGeometry, auraMaterial);
        player.group.add(aura);
        
        // パルスアニメーション
        const pulseAura = () => {
            const scale = 1 + Math.sin(Date.now() * 0.005) * 0.1;
            aura.scale.setScalar(scale);
            auraMaterial.opacity = 0.3 + Math.sin(Date.now() * 0.01) * 0.1;
        };
        
        const animateInterval = setInterval(pulseAura, 16);
        
        // 効果終了時にクリーンアップ
        setTimeout(() => {
            clearInterval(animateInterval);
            player.group.remove(aura);
            auraGeometry.dispose();
            auraMaterial.dispose();
        }, duration);
    }
    
    executeTimeDilation() {
        const duration = 5000;
        const slowFactor = 0.3; // 30%の速度
        
        // 時間減速エフェクト
        this.createTimeDilationEffect();
        
        // 敵の速度を減速
        const originalSpeeds = new Map();
        this.game.enemies.forEach(enemy => {
            originalSpeeds.set(enemy, {
                speed: enemy.speed,
                rotationSpeed: enemy.rotationSpeed || 0
            });
            
            enemy.speed *= slowFactor;
            if (enemy.rotationSpeed) {
                enemy.rotationSpeed *= slowFactor;
            }
        });
        
        // 敵の弾丸も減速
        if (this.game.projectileManager) {
            this.game.projectileManager.projectiles.forEach(projectile => {
                if (projectile.type === 'enemy') {
                    projectile.velocity.multiplyScalar(slowFactor);
                }
            });
        }
        
        // 効果終了時に速度を戻す
        setTimeout(() => {
            originalSpeeds.forEach((speeds, enemy) => {
                if (enemy.isAlive) {
                    enemy.speed = speeds.speed;
                    enemy.rotationSpeed = speeds.rotationSpeed;
                }
            });
            
            this.game.showMessage('時間減速終了', 2000);
        }, duration);
        
        // サウンド
        if (this.game.soundManager) {
            this.game.soundManager.play('time_dilation');
        }
        
        this.game.showMessage('時間減速発動！', 3000);
    }
    
    createTimeDilationEffect() {
        // 画面全体にエフェクト
        const overlay = document.createElement('div');
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: radial-gradient(circle, transparent 30%, rgba(0, 100, 255, 0.2) 100%);
            pointer-events: none;
            z-index: 9999;
            animation: time-pulse 2s infinite;
        `;
        
        const style = document.createElement('style');
        style.textContent = `
            @keyframes time-pulse {
                0% { opacity: 0.5; }
                50% { opacity: 0.8; }
                100% { opacity: 0.5; }
            }
        `;
        document.head.appendChild(style);
        document.body.appendChild(overlay);
        
        // 5秒後に削除
        setTimeout(() => {
            document.body.removeChild(overlay);
            document.head.removeChild(style);
        }, 5000);
    }
    
    createStunEffect(target) {
        // スタンマーク
        const canvas = document.createElement('canvas');
        canvas.width = 64;
        canvas.height = 64;
        const ctx = canvas.getContext('2d');
        
        ctx.strokeStyle = '#ffff00';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(32, 32, 20, 0, Math.PI * 2);
        ctx.stroke();
        
        // 星マーク
        ctx.fillStyle = '#ffff00';
        ctx.font = '24px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('★', 32, 32);
        
        const texture = new THREE.CanvasTexture(canvas);
        const spriteMaterial = new THREE.SpriteMaterial({
            map: texture,
            transparent: true
        });
        
        const sprite = new THREE.Sprite(spriteMaterial);
        sprite.scale.set(2, 2, 1);
        sprite.position.y = 3;
        target.add(sprite);
        
        // 回転アニメーション
        const rotateSprite = () => {
            sprite.rotation.z += 0.05;
        };
        const animateInterval = setInterval(rotateSprite, 16);
        
        // 3秒後に削除
        setTimeout(() => {
            clearInterval(animateInterval);
            target.remove(sprite);
            texture.dispose();
            spriteMaterial.dispose();
        }, 3000);
    }
    
    isOnCooldown(abilityId) {
        const cooldownEnd = this.abilityCooldowns.get(abilityId);
        return cooldownEnd && Date.now() < cooldownEnd;
    }
    
    getRemainingCooldown(abilityId) {
        const cooldownEnd = this.abilityCooldowns.get(abilityId);
        if (!cooldownEnd) return 0;
        
        const remaining = cooldownEnd - Date.now();
        return Math.max(0, remaining);
    }
    
    startCooldown(abilityId, duration) {
        this.abilityCooldowns.set(abilityId, Date.now() + duration);
    }
    
    update(delta) {
        // アクティブなアビリティを更新
        this.activeAbilities = this.activeAbilities.filter(ability => {
            const shouldRemove = ability.update(delta);
            return !shouldRemove;
        });
    }
    
    getAbilityStatus(abilityId) {
        const ability = this.abilities[abilityId];
        if (!ability) return null;
        
        return {
            name: ability.name,
            description: ability.description,
            isReady: !this.isOnCooldown(abilityId),
            remainingCooldown: this.getRemainingCooldown(abilityId),
            energyCost: ability.energyCost
        };
    }
}