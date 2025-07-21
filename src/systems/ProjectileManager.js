import * as THREE from 'three';

export class ProjectileManager {
    constructor(scene) {
        this.scene = scene;
        this.projectiles = [];
    }

    addProjectile(projectile, type) {
        if (!projectile) return;
        
        projectile.type = type;
        // シーンにメッシュを追加
        if (projectile.mesh) {
            this.scene.add(projectile.mesh);
        }
        this.projectiles.push(projectile);
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
                projectile.destroy();
            }
            
            // updateメソッドがある場合は呼び出す
            if (projectile.update) {
                projectile.update(delta);
            }
            
            if (projectile.isDestroyed) {
                return false;
            }
            
            return true;
        });
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