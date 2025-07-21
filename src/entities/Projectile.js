import * as THREE from 'three';

export class Projectile {
    constructor(scene, position, rotation, color = 0x00ffff, speed = 100) {
        this.scene = scene;
        this.speed = speed;
        this.damage = 10;
        this.lifeTime = 3; // 秒
        this.age = 0;
        this.isDestroyed = false;
        
        // 弾丸メッシュ
        const geometry = new THREE.CapsuleGeometry(0.2, 2, 4, 8);
        const material = new THREE.MeshBasicMaterial({ 
            color: color
        });
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.position.copy(position);
        this.mesh.quaternion.copy(rotation);
        
        // 光源
        this.light = new THREE.PointLight(color, 1, 10);
        this.light.position.copy(position);
        
        // 移動方向
        this.velocity = new THREE.Vector3(0, 0, -1);
        this.velocity.applyQuaternion(rotation);
        this.velocity.multiplyScalar(this.speed);
        
        // シーンに追加
        this.scene.add(this.mesh);
        this.scene.add(this.light);
    }

    update(delta) {
        if (this.isDestroyed) return;
        
        // 移動
        const movement = this.velocity.clone().multiplyScalar(delta);
        this.mesh.position.add(movement);
        this.light.position.copy(this.mesh.position);
        
        // 寿命チェック
        this.age += delta;
        if (this.age > this.lifeTime) {
            this.destroy();
        }
    }

    destroy() {
        if (this.isDestroyed) return;
        
        this.isDestroyed = true;
        this.scene.remove(this.mesh);
        this.scene.remove(this.light);
    }
}