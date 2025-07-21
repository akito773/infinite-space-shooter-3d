// 武器システム

import * as THREE from 'three';
import { WeaponTypes, WeaponRarity } from '../weapons/WeaponTypes.js';

export class WeaponSystem {
    constructor(game) {
        this.game = game;
        this.player = game.player;
        
        // 装備中の武器
        this.primaryWeapon = WeaponTypes.PULSE_LASER;
        this.secondaryWeapon = null;
        this.specialWeapon = null;
        
        // 弾薬管理
        this.ammo = {
            secondary: 0,
            special: 0
        };
        
        // クールダウン管理
        this.cooldowns = {
            primary: 0,
            secondary: 0,
            special: 0
        };
        
        // チャージ管理
        this.chargeTime = 0;
        this.isCharging = false;
        
        // ビーム武器用
        this.activeBeams = [];
        
        this.createWeaponEffects();
        this.setupControls();
    }
    
    createWeaponEffects() {
        // マズルフラッシュエフェクト
        const flashGeometry = new THREE.SphereGeometry(0.5, 8, 8);
        const flashMaterial = new THREE.MeshBasicMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0
        });
        this.muzzleFlash = new THREE.Mesh(flashGeometry, flashMaterial);
        this.player.group.add(this.muzzleFlash);
        
        // チャージエフェクト
        this.chargeEffect = this.createChargeEffect();
        this.player.group.add(this.chargeEffect);
    }
    
    createChargeEffect() {
        const group = new THREE.Group();
        
        // チャージパーティクル
        const particleCount = 20;
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        const colors = new Float32Array(particleCount * 3);
        
        for (let i = 0; i < particleCount; i++) {
            positions[i * 3] = (Math.random() - 0.5) * 10;
            positions[i * 3 + 1] = (Math.random() - 0.5) * 10;
            positions[i * 3 + 2] = (Math.random() - 0.5) * 10;
            
            colors[i * 3] = 0;
            colors[i * 3 + 1] = 1;
            colors[i * 3 + 2] = 1;
        }
        
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        
        const material = new THREE.PointsMaterial({
            size: 0.3,
            vertexColors: true,
            transparent: true,
            opacity: 0
        });
        
        const particles = new THREE.Points(geometry, material);
        group.add(particles);
        group.visible = false;
        
        return group;
    }
    
    setupControls() {
        // 武器切り替え
        document.addEventListener('keydown', (e) => {
            const key = e.key.toLowerCase();
            if (key >= '1' && key <= '9') {
                this.switchWeapon(parseInt(key));
            }
        });
        
        // セカンダリ武器（中ボタン）
        document.addEventListener('mousedown', (e) => {
            if (e.button === 1) { // 中ボタン
                e.preventDefault();
                this.fireSecondaryWeapon();
            }
        });
    }
    
    update(delta) {
        // クールダウン更新
        for (let key in this.cooldowns) {
            if (this.cooldowns[key] > 0) {
                this.cooldowns[key] -= delta * 1000;
            }
        }
        
        // チャージ武器の更新
        if (this.isCharging) {
            this.updateCharge(delta);
        }
        
        // ビーム武器の更新
        this.updateBeams(delta);
        
        // マズルフラッシュのフェード
        if (this.muzzleFlash.material.opacity > 0) {
            this.muzzleFlash.material.opacity -= delta * 5;
        }
    }
    
    firePrimary() {
        if (this.cooldowns.primary > 0) return null;
        
        const weapon = this.primaryWeapon;
        this.cooldowns.primary = weapon.fireRate;
        
        // マズルフラッシュ
        this.showMuzzleFlash(weapon.color);
        
        // 武器タイプによる発射処理
        switch (weapon.type) {
            case 'primary':
                return this.createProjectile(weapon);
            case 'special':
                if (weapon.id === 'laser_array') {
                    this.fireLaserArray(weapon);
                    return null;
                }
                break;
        }
        
        return null;
    }
    
    fireSecondaryWeapon() {
        if (!this.secondaryWeapon || this.cooldowns.secondary > 0) return;
        
        const weapon = this.secondaryWeapon;
        
        // 弾薬チェック
        if (weapon.ammo && this.ammo.secondary <= 0) {
            this.game.showMessage('弾薬不足！', 1000);
            return;
        }
        
        this.cooldowns.secondary = weapon.fireRate;
        
        if (weapon.id === 'homing_missile') {
            this.fireHomingMissile(weapon);
        } else if (weapon.id === 'emp_blast') {
            this.fireEMPBlast(weapon);
        }
        
        // 弾薬消費
        if (weapon.ammo) {
            this.ammo.secondary--;
            this.updateAmmoUI();
        }
    }
    
    fireHomingMissile(weapon) {
        const targets = this.game.targetingSystem?.getMultiLockTargets() || [];
        
        if (targets.length === 0) {
            // ロックオンターゲットがない場合は通常発射
            const projectile = this.createProjectile(weapon);
            if (projectile) {
                projectile.isHoming = true;
                projectile.homingStrength = weapon.homingStrength;
                projectile.fuel = weapon.fuel;
                this.game.projectileManager.addProjectile(projectile, 'player');
            }
        } else {
            // マルチロックターゲットに発射
            targets.forEach((target, index) => {
                setTimeout(() => {
                    const projectile = this.createProjectile(weapon);
                    if (projectile) {
                        projectile.isHoming = true;
                        projectile.homingTarget = target.object;
                        projectile.homingStrength = weapon.homingStrength;
                        projectile.fuel = weapon.fuel;
                        
                        // 発射角度を少しずらす
                        const angle = (index - 1) * 0.2;
                        projectile.mesh.position.x += angle;
                        
                        this.game.projectileManager.addProjectile(projectile, 'player');
                    }
                }, index * 100); // 100ms間隔で発射
            });
        }
        
        this.game.soundManager?.play(weapon.sound);
    }
    
    fireEMPBlast(weapon) {
        // EMPブラストエフェクト
        const blastGeometry = new THREE.SphereGeometry(weapon.range, 32, 32);
        const blastMaterial = new THREE.MeshBasicMaterial({
            color: weapon.color,
            transparent: true,
            opacity: 0.5,
            side: THREE.BackSide
        });
        const blast = new THREE.Mesh(blastGeometry, blastMaterial);
        blast.position.copy(this.player.group.position);
        this.game.scene.add(blast);
        
        // 拡大アニメーション
        const startTime = Date.now();
        const animate = () => {
            const elapsed = (Date.now() - startTime) / 1000;
            const scale = 1 + elapsed * 2;
            blast.scale.setScalar(scale);
            blast.material.opacity = 0.5 - elapsed;
            
            if (elapsed < 1) {
                requestAnimationFrame(animate);
            } else {
                this.game.scene.remove(blast);
            }
        };
        animate();
        
        // 範囲内の敵にスタン効果
        this.game.enemies.forEach(enemy => {
            const distance = enemy.group.position.distanceTo(this.player.group.position);
            if (distance <= weapon.range && enemy.isAlive) {
                enemy.applyStun?.(weapon.stunDuration);
            }
        });
        
        this.game.soundManager?.play(weapon.sound);
    }
    
    fireLaserArray(weapon) {
        // 既存のビームを削除
        this.activeBeams.forEach(beam => {
            this.player.group.remove(beam);
        });
        this.activeBeams = [];
        
        // 新しいビームを作成
        for (let i = 0; i < weapon.beamCount; i++) {
            const angle = (Math.PI * 2 / weapon.beamCount) * i;
            const beam = this.createLaserBeam(weapon.color, weapon.range);
            beam.rotation.y = angle;
            this.player.group.add(beam);
            this.activeBeams.push(beam);
        }
    }
    
    createLaserBeam(color, length) {
        const geometry = new THREE.BoxGeometry(0.1, 0.1, length);
        const material = new THREE.MeshBasicMaterial({
            color: color,
            transparent: true,
            opacity: 0.8
        });
        const beam = new THREE.Mesh(geometry, material);
        beam.position.z = -length / 2;
        return beam;
    }
    
    updateBeams(delta) {
        if (this.activeBeams.length > 0) {
            // ビームを回転
            this.activeBeams.forEach(beam => {
                beam.parent.rotation.z += delta * 2;
            });
            
            // エネルギー消費
            if (this.primaryWeapon.energyDrain) {
                // TODO: エネルギーシステムの実装
            }
        }
    }
    
    createProjectile(weapon) {
        const projectile = {
            mesh: null,
            velocity: new THREE.Vector3(),
            damage: weapon.damage,
            weapon: weapon,
            lifeTime: 3,
            isDestroyed: false,
            destroy: function() {
                if (this.isDestroyed) return;
                this.isDestroyed = true;
                if (this.mesh && this.mesh.parent) {
                    this.mesh.parent.remove(this.mesh);
                }
                if (this.mesh) {
                    this.mesh.geometry?.dispose();
                    this.mesh.material?.dispose();
                }
            }
        };
        
        // プロジェクタイルメッシュ作成
        const geometry = new THREE.SphereGeometry(weapon.size, 8, 8);
        const material = new THREE.MeshBasicMaterial({
            color: weapon.color
        });
        
        projectile.mesh = new THREE.Mesh(geometry, material);
        projectile.mesh.position.copy(this.player.group.position);
        
        // 発射方向設定
        const forward = new THREE.Vector3(0, 0, -1);
        forward.applyQuaternion(this.player.group.quaternion);
        
        // 拡散処理
        if (weapon.spread) {
            const spreadX = (Math.random() - 0.5) * weapon.spread * Math.PI / 180;
            const spreadY = (Math.random() - 0.5) * weapon.spread * Math.PI / 180;
            forward.applyAxisAngle(new THREE.Vector3(1, 0, 0), spreadX);
            forward.applyAxisAngle(new THREE.Vector3(0, 1, 0), spreadY);
        }
        
        projectile.velocity = forward.multiplyScalar(weapon.speed);
        
        // スキャッターショットの場合
        if (weapon.projectileCount && weapon.projectileCount > 1) {
            const projectiles = [];
            for (let i = 0; i < weapon.projectileCount; i++) {
                const clone = this.cloneProjectile(projectile);
                const angle = (i - weapon.projectileCount / 2) * weapon.spreadAngle / weapon.projectileCount;
                const rotation = new THREE.Quaternion();
                rotation.setFromAxisAngle(new THREE.Vector3(0, 1, 0), angle * Math.PI / 180);
                clone.velocity.applyQuaternion(rotation);
                projectiles.push(clone);
            }
            return projectiles;
        }
        
        return projectile;
    }
    
    cloneProjectile(original) {
        const clone = {
            mesh: original.mesh.clone(),
            velocity: original.velocity.clone(),
            damage: original.damage,
            weapon: original.weapon,
            lifeTime: original.lifeTime,
            isDestroyed: false,
            destroy: original.destroy
        };
        return clone;
    }
    
    updateCharge(delta) {
        this.chargeTime += delta;
        
        // チャージエフェクト更新
        const chargePercent = Math.min(this.chargeTime / 2, 1); // 2秒でフルチャージ
        this.chargeEffect.visible = true;
        this.chargeEffect.children[0].material.opacity = chargePercent * 0.5;
        this.chargeEffect.rotation.y += delta * 5 * chargePercent;
        
        // パーティクルを中心に集約
        const positions = this.chargeEffect.children[0].geometry.attributes.position.array;
        for (let i = 0; i < positions.length; i += 3) {
            positions[i] *= 0.98;
            positions[i + 1] *= 0.98;
            positions[i + 2] *= 0.98;
        }
        this.chargeEffect.children[0].geometry.attributes.position.needsUpdate = true;
    }
    
    showMuzzleFlash(color) {
        this.muzzleFlash.material.color = new THREE.Color(color);
        this.muzzleFlash.material.opacity = 1;
        this.muzzleFlash.position.z = -2;
    }
    
    switchWeapon(slot) {
        // 武器切り替え処理
        // TODO: インベントリシステムと連携
    }
    
    equipWeapon(weaponId, slot = 'primary') {
        const weapon = Object.values(WeaponTypes).find(w => w.id === weaponId);
        if (!weapon) return false;
        
        switch (slot) {
            case 'primary':
                this.primaryWeapon = weapon;
                break;
            case 'secondary':
                this.secondaryWeapon = weapon;
                if (weapon.ammo) {
                    this.ammo.secondary = weapon.ammo;
                }
                break;
            case 'special':
                this.specialWeapon = weapon;
                if (weapon.ammo) {
                    this.ammo.special = weapon.ammo;
                }
                break;
        }
        
        this.updateWeaponUI();
        return true;
    }
    
    updateAmmoUI() {
        // TODO: UI更新
    }
    
    updateWeaponUI() {
        // TODO: UI更新
    }
    
    addAmmo(type, amount) {
        this.ammo[type] = Math.min(this.ammo[type] + amount, 999);
        this.updateAmmoUI();
    }
}