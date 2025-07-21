// 建物エフェクト - 建設完了時やアップグレード時の視覚効果

import * as THREE from 'three';

export class BuildingEffects {
    constructor(scene) {
        this.scene = scene;
        this.activeEffects = [];
    }
    
    // 建設完了エフェクト
    playConstructionComplete(building) {
        const position = building.mesh.position.clone();
        
        // パーティクルエフェクト
        this.createConstructionParticles(position);
        
        // 光の波紋エフェクト
        this.createLightWave(position);
        
        // 建物のフラッシュ
        this.flashBuilding(building.mesh);
    }
    
    // アップグレードエフェクト
    playUpgradeEffect(building) {
        const position = building.mesh.position.clone();
        
        // アップグレードパーティクル
        this.createUpgradeParticles(position);
        
        // エネルギーリング
        this.createEnergyRing(position);
        
        // 建物の光る効果
        this.glowBuilding(building.mesh);
    }
    
    // 建設パーティクル
    createConstructionParticles(position) {
        const particleCount = 50;
        const particles = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        const velocities = [];
        const lifetimes = [];
        
        for (let i = 0; i < particleCount; i++) {
            // 初期位置（建物の中心から）
            positions[i * 3] = position.x;
            positions[i * 3 + 1] = position.y;
            positions[i * 3 + 2] = position.z;
            
            // ランダムな速度
            const angle = Math.random() * Math.PI * 2;
            const speed = 0.1 + Math.random() * 0.3;
            const upSpeed = 0.2 + Math.random() * 0.3;
            
            velocities.push({
                x: Math.cos(angle) * speed,
                y: upSpeed,
                z: Math.sin(angle) * speed
            });
            
            lifetimes.push(1.0);
        }
        
        particles.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        
        const particleMaterial = new THREE.PointsMaterial({
            color: 0x00ff00,
            size: 0.5,
            transparent: true,
            opacity: 1.0,
            blending: THREE.AdditiveBlending
        });
        
        const particleSystem = new THREE.Points(particles, particleMaterial);
        this.scene.add(particleSystem);
        
        // アニメーション
        const startTime = Date.now();
        const animate = () => {
            const elapsed = (Date.now() - startTime) / 1000;
            
            if (elapsed > 2) {
                this.scene.remove(particleSystem);
                return;
            }
            
            const positions = particleSystem.geometry.attributes.position.array;
            
            for (let i = 0; i < particleCount; i++) {
                const velocity = velocities[i];
                positions[i * 3] += velocity.x;
                positions[i * 3 + 1] += velocity.y;
                positions[i * 3 + 2] += velocity.z;
                
                // 重力
                velocity.y -= 0.01;
                
                // ライフタイム
                lifetimes[i] -= 0.02;
            }
            
            particleSystem.geometry.attributes.position.needsUpdate = true;
            particleMaterial.opacity = Math.max(0, 1 - elapsed / 2);
            
            requestAnimationFrame(animate);
        };
        
        animate();
    }
    
    // 光の波紋
    createLightWave(position) {
        const geometry = new THREE.RingGeometry(0.1, 0.5, 32);
        const material = new THREE.MeshBasicMaterial({
            color: 0x00ffff,
            transparent: true,
            opacity: 0.8,
            side: THREE.DoubleSide
        });
        
        const ring = new THREE.Mesh(geometry, material);
        ring.position.copy(position);
        ring.position.y = 0.1;
        ring.rotation.x = -Math.PI / 2;
        this.scene.add(ring);
        
        // アニメーション
        const startTime = Date.now();
        const animate = () => {
            const elapsed = (Date.now() - startTime) / 1000;
            
            if (elapsed > 1.5) {
                this.scene.remove(ring);
                return;
            }
            
            const scale = 1 + elapsed * 10;
            ring.scale.set(scale, scale, 1);
            ring.material.opacity = Math.max(0, 0.8 - elapsed / 1.5);
            
            requestAnimationFrame(animate);
        };
        
        animate();
    }
    
    // 建物フラッシュ
    flashBuilding(mesh) {
        const originalEmissive = mesh.material.emissive ? mesh.material.emissive.clone() : new THREE.Color(0x000000);
        const originalEmissiveIntensity = mesh.material.emissiveIntensity || 0;
        
        mesh.material.emissive = new THREE.Color(0x00ff00);
        
        const startTime = Date.now();
        const animate = () => {
            const elapsed = (Date.now() - startTime) / 1000;
            
            if (elapsed > 1) {
                mesh.material.emissive = originalEmissive;
                mesh.material.emissiveIntensity = originalEmissiveIntensity;
                return;
            }
            
            mesh.material.emissiveIntensity = Math.sin(elapsed * Math.PI) * 0.5;
            
            requestAnimationFrame(animate);
        };
        
        animate();
    }
    
    // アップグレードパーティクル
    createUpgradeParticles(position) {
        const particleCount = 100;
        const particles = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        const angles = [];
        const heights = [];
        const speeds = [];
        
        for (let i = 0; i < particleCount; i++) {
            const angle = (i / particleCount) * Math.PI * 2;
            const radius = 2 + Math.random() * 2;
            
            positions[i * 3] = position.x + Math.cos(angle) * radius;
            positions[i * 3 + 1] = position.y;
            positions[i * 3 + 2] = position.z + Math.sin(angle) * radius;
            
            angles.push(angle);
            heights.push(0);
            speeds.push(0.02 + Math.random() * 0.03);
        }
        
        particles.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        
        const particleMaterial = new THREE.PointsMaterial({
            color: 0xffff00,
            size: 0.3,
            transparent: true,
            opacity: 1.0,
            blending: THREE.AdditiveBlending
        });
        
        const particleSystem = new THREE.Points(particles, particleMaterial);
        this.scene.add(particleSystem);
        
        // アニメーション
        const startTime = Date.now();
        const animate = () => {
            const elapsed = (Date.now() - startTime) / 1000;
            
            if (elapsed > 3) {
                this.scene.remove(particleSystem);
                return;
            }
            
            const positions = particleSystem.geometry.attributes.position.array;
            
            for (let i = 0; i < particleCount; i++) {
                // 螺旋上昇
                angles[i] += speeds[i];
                heights[i] += 0.05;
                
                const radius = (2 + Math.random() * 2) * (1 - elapsed / 3);
                
                positions[i * 3] = position.x + Math.cos(angles[i]) * radius;
                positions[i * 3 + 1] = position.y + heights[i];
                positions[i * 3 + 2] = position.z + Math.sin(angles[i]) * radius;
            }
            
            particleSystem.geometry.attributes.position.needsUpdate = true;
            particleMaterial.opacity = Math.max(0, 1 - elapsed / 3);
            
            requestAnimationFrame(animate);
        };
        
        animate();
    }
    
    // エネルギーリング
    createEnergyRing(position) {
        const geometry = new THREE.TorusGeometry(3, 0.2, 8, 32);
        const material = new THREE.MeshBasicMaterial({
            color: 0xffff00,
            transparent: true,
            opacity: 0.8
        });
        
        const ring = new THREE.Mesh(geometry, material);
        ring.position.copy(position);
        ring.position.y += 5;
        this.scene.add(ring);
        
        // アニメーション
        const startTime = Date.now();
        const animate = () => {
            const elapsed = (Date.now() - startTime) / 1000;
            
            if (elapsed > 2) {
                this.scene.remove(ring);
                return;
            }
            
            ring.rotation.y += 0.05;
            ring.position.y = position.y + 5 - elapsed * 2.5;
            ring.scale.set(1 - elapsed * 0.3, 1 - elapsed * 0.3, 1 - elapsed * 0.3);
            ring.material.opacity = Math.max(0, 0.8 - elapsed / 2);
            
            requestAnimationFrame(animate);
        };
        
        animate();
    }
    
    // 建物の光る効果
    glowBuilding(mesh) {
        const originalEmissive = mesh.material.emissive ? mesh.material.emissive.clone() : new THREE.Color(0x000000);
        const originalEmissiveIntensity = mesh.material.emissiveIntensity || 0;
        
        mesh.material.emissive = new THREE.Color(0xffff00);
        
        const startTime = Date.now();
        const animate = () => {
            const elapsed = (Date.now() - startTime) / 1000;
            
            if (elapsed > 2) {
                mesh.material.emissive = originalEmissive;
                mesh.material.emissiveIntensity = originalEmissiveIntensity;
                return;
            }
            
            mesh.material.emissiveIntensity = (Math.sin(elapsed * Math.PI * 3) * 0.5 + 0.5) * 0.8;
            
            requestAnimationFrame(animate);
        };
        
        animate();
    }
    
    // クリーンアップ
    dispose() {
        // 必要に応じて実装
    }
}