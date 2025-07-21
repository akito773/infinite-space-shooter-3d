// デブリフィールドオブジェクト

import * as THREE from 'three';

export class DebrisField {
    constructor(scene, position, data) {
        this.scene = scene;
        this.position = position;
        this.data = data;
        this.group = new THREE.Group();
        this.debrisObjects = [];
        
        this.init();
    }
    
    init() {
        this.group.position.copy(this.position);
        this.scene.add(this.group);
        
        // 警告エリアを表示
        this.createWarningArea();
        
        // デブリを作成
        this.data.pieces.forEach((piece, index) => {
            const debris = this.createDebris(piece, index);
            this.debrisObjects.push(debris);
        });
    }
    
    createWarningArea() {
        // 危険エリアを示す半透明の球体
        const geometry = new THREE.SphereGeometry(this.data.radius, 32, 16);
        const material = new THREE.MeshBasicMaterial({
            color: 0xff6600,
            transparent: true,
            opacity: 0.1,
            side: THREE.DoubleSide
        });
        
        const sphere = new THREE.Mesh(geometry, material);
        this.group.add(sphere);
        
        // 警告リング
        const ringGeometry = new THREE.TorusGeometry(this.data.radius, 2, 8, 32);
        const ringMaterial = new THREE.MeshBasicMaterial({
            color: 0xff0000
        });
        
        const ring = new THREE.Mesh(ringGeometry, ringMaterial);
        ring.rotation.x = Math.PI / 2;
        this.group.add(ring);
        
        // パルスアニメーション
        this.warningRing = ring;
    }
    
    createDebris(pieceData, index) {
        const debris = {
            data: pieceData,
            mesh: null,
            destroyed: false
        };
        
        // デブリのジオメトリ
        let geometry;
        let scale;
        
        if (pieceData.size === 'small') {
            // 小さいデブリ - 様々な形状
            const shapes = [
                new THREE.TetrahedronGeometry(2),
                new THREE.OctahedronGeometry(2),
                new THREE.IcosahedronGeometry(2),
                new THREE.BoxGeometry(3, 3, 3)
            ];
            geometry = shapes[Math.floor(Math.random() * shapes.length)];
            scale = 0.5 + Math.random() * 0.5;
        } else {
            // 大きいデブリ - より複雑な形状
            geometry = new THREE.IcosahedronGeometry(5, 0);
            scale = 1 + Math.random() * 0.5;
            
            // 変形を加える
            const positions = geometry.attributes.position;
            for (let i = 0; i < positions.count; i++) {
                positions.setX(i, positions.getX(i) + (Math.random() - 0.5) * 2);
                positions.setY(i, positions.getY(i) + (Math.random() - 0.5) * 2);
                positions.setZ(i, positions.getZ(i) + (Math.random() - 0.5) * 2);
            }
        }
        
        // マテリアル
        const material = new THREE.MeshPhongMaterial({
            color: 0x666666,
            emissive: pieceData.size === 'large' ? 0x330000 : 0x000000,
            emissiveIntensity: 0.2,
            metalness: 0.8,
            roughness: 0.4
        });
        
        // メッシュ作成
        debris.mesh = new THREE.Mesh(geometry, material);
        debris.mesh.scale.setScalar(scale);
        
        // 位置設定（グループからの相対位置）
        const relativePos = pieceData.position.clone().sub(this.position);
        debris.mesh.position.copy(relativePos);
        
        // ランダムな回転
        debris.mesh.rotation.set(
            Math.random() * Math.PI * 2,
            Math.random() * Math.PI * 2,
            Math.random() * Math.PI * 2
        );
        
        // 回転速度
        debris.rotationSpeed = new THREE.Vector3(
            (Math.random() - 0.5) * 2,
            (Math.random() - 0.5) * 2,
            (Math.random() - 0.5) * 2
        );
        
        // ユーザーデータとして参照を保存
        debris.mesh.userData = {
            type: 'debris',
            debrisIndex: index,
            debrisField: this,
            health: pieceData.health
        };
        
        this.group.add(debris.mesh);
        
        return debris;
    }
    
    update(delta) {
        // 警告リングのパルス
        if (this.warningRing) {
            const scale = 1 + Math.sin(Date.now() * 0.002) * 0.1;
            this.warningRing.scale.set(scale, scale, 1);
        }
        
        // デブリの更新
        this.debrisObjects.forEach((debris, index) => {
            if (debris.destroyed) return;
            
            const piece = this.data.pieces[index];
            
            // 移動
            debris.mesh.position.add(
                piece.velocity.clone().multiplyScalar(delta / 1000)
            );
            
            // 回転
            debris.mesh.rotation.x += debris.rotationSpeed.x * delta / 1000;
            debris.mesh.rotation.y += debris.rotationSpeed.y * delta / 1000;
            debris.mesh.rotation.z += debris.rotationSpeed.z * delta / 1000;
            
            // 境界チェック
            const distance = debris.mesh.position.length();
            if (distance > this.data.radius * 2) {
                // 反対側から再出現
                debris.mesh.position.multiplyScalar(-0.9);
            }
        });
    }
    
    hitDebris(debrisIndex, damage = 1) {
        const debris = this.debrisObjects[debrisIndex];
        if (!debris || debris.destroyed) return false;
        
        const piece = this.data.pieces[debrisIndex];
        piece.health -= damage;
        
        if (piece.health <= 0) {
            this.destroyDebris(debrisIndex);
            return true;
        }
        
        // ダメージエフェクト
        this.showDamageEffect(debris.mesh.position);
        return false;
    }
    
    destroyDebris(index) {
        const debris = this.debrisObjects[index];
        if (!debris || debris.destroyed) return;
        
        debris.destroyed = true;
        this.data.cleared++;
        
        // 破壊エフェクト
        this.createDestructionEffect(debris.mesh.position);
        
        // メッシュを削除
        this.group.remove(debris.mesh);
        
        // 報酬をドロップ
        this.dropReward(debris.mesh.position, debris.data.size);
        
        // 全て破壊したかチェック
        if (this.data.cleared >= this.data.total) {
            this.onFieldCleared();
        }
    }
    
    createDestructionEffect(position) {
        // パーティクルエフェクト
        const particleCount = 20;
        const particles = new THREE.Group();
        
        for (let i = 0; i < particleCount; i++) {
            const particle = new THREE.Mesh(
                new THREE.BoxGeometry(0.5, 0.5, 0.5),
                new THREE.MeshBasicMaterial({
                    color: 0xff6600
                })
            );
            
            particle.position.copy(position);
            particle.velocity = new THREE.Vector3(
                (Math.random() - 0.5) * 20,
                (Math.random() - 0.5) * 20,
                (Math.random() - 0.5) * 20
            );
            
            particles.add(particle);
        }
        
        this.group.add(particles);
        
        // パーティクルアニメーション
        const animateParticles = () => {
            let allDone = true;
            
            particles.children.forEach(particle => {
                particle.position.add(particle.velocity.clone().multiplyScalar(0.02));
                particle.scale.multiplyScalar(0.95);
                particle.material.opacity = particle.scale.x;
                
                if (particle.scale.x > 0.01) {
                    allDone = false;
                }
            });
            
            if (!allDone) {
                requestAnimationFrame(animateParticles);
            } else {
                this.group.remove(particles);
            }
        };
        
        animateParticles();
    }
    
    showDamageEffect(position) {
        // 簡単なフラッシュエフェクト
        const flash = new THREE.Mesh(
            new THREE.SphereGeometry(2),
            new THREE.MeshBasicMaterial({
                color: 0xffff00,
                transparent: true,
                opacity: 0.8
            })
        );
        
        flash.position.copy(position);
        this.group.add(flash);
        
        // フェードアウト
        const fadeOut = () => {
            flash.material.opacity -= 0.1;
            flash.scale.multiplyScalar(1.1);
            
            if (flash.material.opacity > 0) {
                requestAnimationFrame(fadeOut);
            } else {
                this.group.remove(flash);
            }
        };
        
        fadeOut();
    }
    
    dropReward(position, size) {
        // サイズに応じた報酬
        const rewards = {
            small: { credits: 10, scrap: 1 },
            large: { credits: 50, scrap: 5, rareMetal: 1 }
        };
        
        const reward = rewards[size] || rewards.small;
        
        // ゲームに報酬を通知
        if (this.game) {
            this.game.collectReward(reward, position);
        }
    }
    
    onFieldCleared() {
        // フィールドクリア通知
        if (this.game) {
            this.game.showMessage('🎉 デブリフィールドをクリア！ボーナス報酬獲得！');
            this.game.collectReward({
                credits: 500,
                experience: 100
            });
        }
        
        // 警告エリアをフェードアウト
        const fadeOut = () => {
            this.group.children.forEach(child => {
                if (child.material && child.material.opacity !== undefined) {
                    child.material.opacity -= 0.02;
                }
            });
            
            if (this.group.children[0] && this.group.children[0].material.opacity > 0) {
                requestAnimationFrame(fadeOut);
            } else {
                this.destroy();
            }
        };
        
        setTimeout(fadeOut, 1000);
    }
    
    destroy() {
        // クリーンアップ
        this.group.traverse(child => {
            if (child.geometry) child.geometry.dispose();
            if (child.material) {
                if (Array.isArray(child.material)) {
                    child.material.forEach(mat => mat.dispose());
                } else {
                    child.material.dispose();
                }
            }
        });
        
        this.scene.remove(this.group);
    }
}