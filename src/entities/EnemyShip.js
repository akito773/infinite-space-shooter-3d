import * as THREE from 'three';
import { Projectile } from './Projectile.js';

export class EnemyShip {
    constructor(scene) {
        this.scene = scene;
        this.health = 30;
        this.maxHealth = 30;
        this.speed = 20;
        this.isAlive = true;
        this.target = null;
        this.lastShotTime = 0;
        this.fireRate = 1000;
        this.scoreValue = 100; // デフォルトスコア値
        
        this.createMesh();
    }

    createMesh() {
        // 敵機の本体
        const geometry = new THREE.OctahedronGeometry(3);
        const material = new THREE.MeshPhongMaterial({ 
            color: 0xff0000,
            emissive: 0x880000,
            emissiveIntensity: 0.3
        });
        this.bodyMesh = new THREE.Mesh(geometry, material);
        
        // 装飾パーツ
        const ringGeometry = new THREE.TorusGeometry(4, 0.5, 8, 16);
        const ringMaterial = new THREE.MeshPhongMaterial({ 
            color: 0xff4444 
        });
        const ring = new THREE.Mesh(ringGeometry, ringMaterial);
        ring.rotation.x = Math.PI / 2;
        
        this.group = new THREE.Group();
        this.group.add(this.bodyMesh);
        this.group.add(ring);
        
        this.scene.add(this.group);
        
        // 影
        this.bodyMesh.castShadow = true;
        ring.castShadow = true;
        
        // HPバー
        this.createHealthBar();
    }

    createHealthBar() {
        const geometry = new THREE.PlaneGeometry(5, 0.5);
        const material = new THREE.MeshBasicMaterial({ 
            color: 0x00ff00,
            side: THREE.DoubleSide
        });
        this.healthBar = new THREE.Mesh(geometry, material);
        this.healthBar.position.y = 5;
        this.group.add(this.healthBar);
    }

    update(delta, camera) {
        if (!this.isAlive || !this.target) return;
        
        // ターゲットへの方向を計算
        const direction = new THREE.Vector3()
            .subVectors(this.target.position, this.group.position)
            .normalize();
        
        const distance = this.group.position.distanceTo(this.target.position);
        
        // AI行動
        if (distance > 50) {
            // 追跡
            this.group.position.add(
                direction.multiplyScalar(this.speed * delta)
            );
        } else if (distance < 30) {
            // 後退
            this.group.position.add(
                direction.multiplyScalar(-this.speed * delta * 0.5)
            );
        }
        
        // ターゲットの方を向く
        const lookAtMatrix = new THREE.Matrix4().lookAt(
            this.group.position,
            this.target.position,
            new THREE.Vector3(0, 1, 0)
        );
        const targetQuaternion = new THREE.Quaternion()
            .setFromRotationMatrix(lookAtMatrix);
        this.group.quaternion.slerp(targetQuaternion, 2 * delta);
        
        // 回転アニメーション
        if (this.bodyMesh) {
            this.bodyMesh.rotation.y += delta * 2;
        }
        
        // HPバーをカメラに向ける
        if (camera) {
            this.healthBar.lookAt(camera.position);
        }
    }

    shoot() {
        if (!this.isAlive || !this.target) return null;
        
        const now = Date.now();
        if (now - this.lastShotTime < this.fireRate) return null;
        
        const distance = this.group.position.distanceTo(this.target.position);
        if (distance > 60) return null;
        
        this.lastShotTime = now;
        
        // 射撃位置
        const shootPosition = new THREE.Vector3(0, 0, -4);
        shootPosition.applyQuaternion(this.group.quaternion);
        shootPosition.add(this.group.position);
        
        const projectile = new Projectile(
            this.scene,
            shootPosition,
            this.group.quaternion,
            0xff0000,
            50
        );
        
        return projectile;
    }

    takeDamage(damage) {
        this.health -= damage;
        
        // HPバー更新
        const healthPercent = this.health / this.maxHealth;
        this.healthBar.scale.x = healthPercent;
        if (healthPercent < 0.5) {
            this.healthBar.material.color.set(0xffff00);
        }
        if (healthPercent < 0.25) {
            this.healthBar.material.color.set(0xff0000);
        }
        
        // ダメージエフェクト
        if (this.bodyMesh && this.bodyMesh.material) {
            this.bodyMesh.material.emissive = new THREE.Color(0xffffff);
            setTimeout(() => {
                this.bodyMesh.material.emissive = new THREE.Color(0x880000);
            }, 100);
        }
        
        if (this.health <= 0) {
            this.isAlive = false;
        }
    }

    destroy() {
        // 爆発エフェクト
        const explosionGeometry = new THREE.SphereGeometry(5, 8, 8);
        const explosionMaterial = new THREE.MeshBasicMaterial({ 
            color: 0xffff00,
            transparent: true,
            opacity: 0.8
        });
        const explosion = new THREE.Mesh(explosionGeometry, explosionMaterial);
        explosion.position.copy(this.group.position);
        this.scene.add(explosion);
        
        // 爆発アニメーション
        const startTime = Date.now();
        const animate = () => {
            const elapsed = (Date.now() - startTime) / 1000;
            if (elapsed < 0.5) {
                explosion.scale.setScalar(1 + elapsed * 4);
                explosion.material.opacity = 0.8 - elapsed * 1.6;
                requestAnimationFrame(animate);
            } else {
                this.scene.remove(explosion);
            }
        };
        animate();
        
        // メッシュを削除
        this.scene.remove(this.group);
    }

    get mesh() {
        return this.group;
    }
}