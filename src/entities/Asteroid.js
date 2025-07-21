import * as THREE from 'three';

export class Asteroid {
    constructor(scene, position, size = 'medium') {
        this.scene = scene;
        this.position = position;
        this.size = size;
        this.rotationSpeed = {
            x: (Math.random() - 0.5) * 0.02,
            y: (Math.random() - 0.5) * 0.02,
            z: (Math.random() - 0.5) * 0.02
        };
        
        this.health = this.getHealthBySize();
        this.isDestroyed = false;
        
        this.createMesh();
    }

    getHealthBySize() {
        switch(this.size) {
            case 'small': return 10;
            case 'medium': return 20;
            case 'large': return 40;
            default: return 20;
        }
    }

    getRadiusBySize() {
        switch(this.size) {
            case 'small': return 2 + Math.random() * 2;
            case 'medium': return 4 + Math.random() * 3;
            case 'large': return 8 + Math.random() * 4;
            default: return 5;
        }
    }

    createMesh() {
        const radius = this.getRadiusBySize();
        
        // より不規則な小惑星形状
        const detail = 1;
        const geometry = new THREE.IcosahedronGeometry(radius, detail);
        
        // 頂点をランダムに変形
        const positions = geometry.attributes.position;
        for (let i = 0; i < positions.count; i++) {
            const vertex = new THREE.Vector3(
                positions.getX(i),
                positions.getY(i),
                positions.getZ(i)
            );
            
            // ランダムな変形
            const noise = 0.3 + Math.random() * 0.7;
            vertex.multiplyScalar(noise);
            
            positions.setXYZ(i, vertex.x, vertex.y, vertex.z);
        }
        
        geometry.computeVertexNormals();
        
        // マテリアル
        const material = new THREE.MeshPhongMaterial({
            color: 0x666666,
            emissive: 0x111111,
            shininess: 10,
            flatShading: true
        });
        
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.position.copy(this.position);
        this.mesh.castShadow = true;
        this.mesh.receiveShadow = true;
        
        // ランダムな初期回転
        this.mesh.rotation.set(
            Math.random() * Math.PI * 2,
            Math.random() * Math.PI * 2,
            Math.random() * Math.PI * 2
        );
        
        this.scene.add(this.mesh);
        
        // 物理ボディのサイズ
        this.radius = radius;
    }

    update(delta) {
        if (this.isDestroyed) return;
        
        // 回転
        this.mesh.rotation.x += this.rotationSpeed.x;
        this.mesh.rotation.y += this.rotationSpeed.y;
        this.mesh.rotation.z += this.rotationSpeed.z;
    }

    takeDamage(damage) {
        if (this.isDestroyed) return;
        
        this.health -= damage;
        
        // ダメージエフェクト
        this.mesh.material.emissive = new THREE.Color(0xff3333);
        setTimeout(() => {
            if (this.mesh) {
                this.mesh.material.emissive = new THREE.Color(0x111111);
            }
        }, 100);
        
        if (this.health <= 0) {
            this.destroy();
        }
    }

    destroy() {
        if (this.isDestroyed) return;
        
        this.isDestroyed = true;
        
        // 破壊エフェクト
        const particleCount = this.size === 'large' ? 12 : this.size === 'medium' ? 8 : 4;
        const particles = [];
        
        for (let i = 0; i < particleCount; i++) {
            const particleGeometry = new THREE.TetrahedronGeometry(this.radius * 0.3);
            const particleMaterial = new THREE.MeshPhongMaterial({
                color: 0x666666,
                emissive: 0x333333
            });
            
            const particle = new THREE.Mesh(particleGeometry, particleMaterial);
            particle.position.copy(this.mesh.position);
            
            // ランダムな飛散方向
            particle.userData.velocity = new THREE.Vector3(
                (Math.random() - 0.5) * 20,
                (Math.random() - 0.5) * 20,
                (Math.random() - 0.5) * 20
            );
            
            particle.userData.rotationSpeed = new THREE.Vector3(
                Math.random() * 0.1,
                Math.random() * 0.1,
                Math.random() * 0.1
            );
            
            this.scene.add(particle);
            particles.push(particle);
        }
        
        // パーティクルアニメーション
        const animateParticles = () => {
            let allDone = true;
            
            particles.forEach(particle => {
                if (particle.scale.x > 0.01) {
                    allDone = false;
                    
                    // 移動
                    particle.position.add(particle.userData.velocity.clone().multiplyScalar(0.02));
                    
                    // 回転
                    particle.rotation.x += particle.userData.rotationSpeed.x;
                    particle.rotation.y += particle.userData.rotationSpeed.y;
                    particle.rotation.z += particle.userData.rotationSpeed.z;
                    
                    // 縮小
                    particle.scale.multiplyScalar(0.95);
                    
                    // 速度減衰
                    particle.userData.velocity.multiplyScalar(0.98);
                }
            });
            
            if (allDone) {
                particles.forEach(particle => {
                    this.scene.remove(particle);
                });
            } else {
                requestAnimationFrame(animateParticles);
            }
        };
        
        animateParticles();
        
        // メッシュを削除
        this.scene.remove(this.mesh);
        
        // 破壊時のイベント
        return this.getDrops();
    }

    getDrops() {
        // サイズに応じてアイテムドロップ
        const dropChance = this.size === 'large' ? 0.8 : this.size === 'medium' ? 0.5 : 0.3;
        
        if (Math.random() < dropChance) {
            return {
                shouldDrop: true,
                position: this.mesh.position.clone()
            };
        }
        
        return { shouldDrop: false };
    }

    checkCollision(position, radius) {
        if (this.isDestroyed) return false;
        
        const distance = this.mesh.position.distanceTo(position);
        return distance < (this.radius + radius);
    }
}