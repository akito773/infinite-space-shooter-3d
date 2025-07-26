import * as THREE from 'three';

export class ProjectileManager {
    constructor(scene) {
        this.scene = scene;
        this.projectiles = [];
    }

    addProjectile(projectile, type) {
        if (!projectile) return;
        
        // 複数のプロジェクタイルを処理（スキャッターショットなど）
        if (Array.isArray(projectile)) {
            projectile.forEach(p => this.addProjectile(p, type));
            return;
        }
        
        projectile.type = type;
        // シーンにメッシュを追加
        if (projectile.mesh) {
            this.scene.add(projectile.mesh);
        }
        this.projectiles.push(projectile);
        
        // 武器エフェクトを追加
        this.addWeaponEffect(projectile);
    }
    
    addWeaponEffect(projectile) {
        if (!projectile.weapon || !window.game || !window.game.weaponEffects) return;
        
        const weapon = projectile.weapon;
        const position = projectile.mesh.position.clone();
        const direction = projectile.velocity.clone().normalize();
        
        // 武器タイプに応じたエフェクト
        switch (weapon.id) {
            case 'pulse_laser':
                window.game.weaponEffects.createPulseLaserEffect(position, direction, weapon.color);
                break;
            case 'rapid_fire':
                window.game.weaponEffects.createRapidFireEffect(position, direction, weapon.color);
                break;
            case 'plasma_cannon':
                const plasmaEffect = window.game.weaponEffects.createPlasmaCannonEffect(position, direction, weapon.color);
                // プラズマエフェクトをプロジェクタイルにアタッチ
                if (plasmaEffect) {
                    projectile.attachedEffect = plasmaEffect;
                }
                break;
            case 'homing_missile':
                const missileEffect = window.game.weaponEffects.createHomingMissileEffect(position, weapon.color);
                if (missileEffect) {
                    projectile.mesh.add(missileEffect.mesh);
                    projectile.missileEffect = missileEffect;
                }
                break;
        }
    }

    update(delta) {
        // 弾丸更新と削除
        this.projectiles = this.projectiles.filter(projectile => {
            // ホーミング処理
            if (projectile.isHoming && projectile.fuel > 0) {
                this.updateHoming(projectile, delta);
                projectile.fuel -= delta;
            }
            
            // 位置更新
            projectile.mesh.position.add(
                projectile.velocity.clone().multiplyScalar(delta)
            );
            
            // ライフタイム更新
            projectile.lifeTime -= delta;
            if (projectile.lifeTime <= 0) {
                this.removeProjectile(projectile);
            }
            
            // updateメソッドがある場合は呼び出す
            if (projectile.update) {
                projectile.update(delta);
            }
            
            if (projectile.isDestroyed) {
                return false;
            }
            
            // アタッチされたエフェクトの位置を更新
            if (projectile.attachedEffect) {
                projectile.attachedEffect.position.copy(projectile.mesh.position);
            }
            
            return true;
        });
    }
    
    removeProjectile(projectile) {
        // ミサイルエフェクトの停止
        if (projectile.missileEffect) {
            projectile.missileEffect.stopSmoke();
        }
        
        // アタッチされたエフェクトの削除
        if (projectile.attachedEffect && window.game && window.game.weaponEffects) {
            const effectIndex = window.game.weaponEffects.activeEffects.findIndex(
                e => e.mesh === projectile.attachedEffect
            );
            if (effectIndex !== -1) {
                window.game.weaponEffects.activeEffects[effectIndex].dispose();
                window.game.weaponEffects.activeEffects.splice(effectIndex, 1);
            }
        }
        
        projectile.destroy();
    }
    
    updateHoming(projectile, delta) {
        let target = null;
        
        // ターゲットが指定されている場合
        if (projectile.homingTarget) {
            if (projectile.homingTarget.isAlive) {
                target = projectile.homingTarget.group || projectile.homingTarget.mesh;
            }
        } else {
            // 最も近い敵を探す
            let closestDistance = Infinity;
            if (window.game && window.game.enemies) {
                window.game.enemies.forEach(enemy => {
                    if (enemy.isAlive) {
                        const distance = projectile.mesh.position.distanceTo(enemy.group.position);
                        if (distance < closestDistance && distance < 100) { // 100ユニット以内
                            closestDistance = distance;
                            target = enemy.group;
                        }
                    }
                });
            }
        }
        
        if (target) {
            // ターゲットへの方向ベクトル
            const toTarget = target.position.clone().sub(projectile.mesh.position).normalize();
            
            // 現在の速度方向
            const currentDirection = projectile.velocity.clone().normalize();
            
            // 方向を補間
            const newDirection = currentDirection.lerp(toTarget, projectile.homingStrength || 0.05);
            
            // 速度を維持しつつ方向を変更
            const speed = projectile.velocity.length();
            projectile.velocity = newDirection.multiplyScalar(speed);
            
            // ミサイルの向きを更新
            projectile.mesh.lookAt(
                projectile.mesh.position.clone().add(projectile.velocity)
            );
        }
    }

    clear() {
        this.projectiles.forEach(projectile => {
            projectile.destroy();
        });
        this.projectiles = [];
    }
}