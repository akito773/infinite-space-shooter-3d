import * as THREE from 'three';

export class Planet {
    constructor(scene, position, config = {}) {
        this.scene = scene;
        this.position = position;
        
        // デフォルト設定
        this.radius = config.radius || 20;
        this.color = config.color || 0x4444ff;
        this.name = config.name || '未知の惑星';
        this.rotationSpeed = config.rotationSpeed || 0.001;
        this.hasAtmosphere = config.hasAtmosphere || false;
        this.hasRings = config.hasRings || false;
        this.texture = config.texture || null;
        this.locked = config.locked || false;
        this.unlockMessage = config.unlockMessage || null;
        
        this.createMesh();
        this.createAtmosphere();
        if (this.hasRings) this.createRings();
        if (this.locked) this.createLockIndicator();
    }

    createMesh() {
        // 惑星本体
        const geometry = new THREE.SphereGeometry(this.radius, 64, 64);
        
        // マテリアル作成
        let material;
        if (this.texture) {
            // テクスチャがある場合
            const textureLoader = new THREE.TextureLoader();
            const planetTexture = textureLoader.load(this.texture);
            
            material = new THREE.MeshPhongMaterial({
                map: planetTexture,
                shininess: 10,
                specular: new THREE.Color(0x222222)
            });
        } else {
            // テクスチャがない場合は色を使用
            material = new THREE.MeshPhongMaterial({
                color: this.color,
                emissive: this.color,
                emissiveIntensity: 0.1,
                shininess: 30
            });
        }
        
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.position.copy(this.position);
        this.mesh.castShadow = true;
        this.mesh.receiveShadow = true;
        
        // 雲のレイヤー（オプション）
        if (this.hasAtmosphere) {
            const cloudGeometry = new THREE.SphereGeometry(this.radius * 1.02, 32, 32);
            const cloudMaterial = new THREE.MeshPhongMaterial({
                color: 0xffffff,
                transparent: true,
                opacity: 0.3,
                emissive: 0xffffff,
                emissiveIntensity: 0.05
            });
            this.clouds = new THREE.Mesh(cloudGeometry, cloudMaterial);
            this.mesh.add(this.clouds);
        }
        
        this.scene.add(this.mesh);
        
        // 名前表示
        this.createNameLabel();
    }

    createAtmosphere() {
        if (!this.hasAtmosphere) return;
        
        // 大気の光彩効果
        const atmosphereGeometry = new THREE.SphereGeometry(this.radius * 1.3, 32, 32);
        const atmosphereMaterial = new THREE.MeshBasicMaterial({
            color: new THREE.Color(this.color).multiplyScalar(1.5),
            transparent: true,
            opacity: 0.15,
            side: THREE.BackSide
        });
        
        this.atmosphere = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial);
        this.atmosphere.position.copy(this.position);
        this.scene.add(this.atmosphere);
    }

    createRings() {
        // 土星のような環
        const innerRadius = this.radius * 1.5;
        const outerRadius = this.radius * 2.5;
        
        const ringGeometry = new THREE.RingGeometry(innerRadius, outerRadius, 64);
        const ringMaterial = new THREE.MeshBasicMaterial({
            color: 0xcccccc,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.7
        });
        
        this.rings = new THREE.Mesh(ringGeometry, ringMaterial);
        this.rings.rotation.x = Math.PI / 2;
        this.mesh.add(this.rings);
    }

    createNameLabel() {
        // 3Dテキストの代わりにスプライトを使用
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 64;
        const context = canvas.getContext('2d');
        
        context.fillStyle = 'rgba(0, 0, 0, 0.5)';
        context.fillRect(0, 0, 256, 64);
        
        context.font = '24px Arial';
        context.fillStyle = 'white';
        context.textAlign = 'center';
        context.fillText(this.name, 128, 40);
        
        const texture = new THREE.CanvasTexture(canvas);
        const spriteMaterial = new THREE.SpriteMaterial({ 
            map: texture,
            transparent: true
        });
        
        this.nameLabel = new THREE.Sprite(spriteMaterial);
        this.nameLabel.position.set(0, this.radius + 10, 0);
        this.nameLabel.scale.set(40, 10, 1);
        this.mesh.add(this.nameLabel);
    }

    createLockIndicator() {
        // ロックアイコン（バリア）
        const barrierGeometry = new THREE.IcosahedronGeometry(this.radius * 1.2, 1);
        const barrierMaterial = new THREE.MeshBasicMaterial({
            color: 0xff0000,
            wireframe: true,
            transparent: true,
            opacity: 0.3
        });
        
        this.lockBarrier = new THREE.Mesh(barrierGeometry, barrierMaterial);
        this.mesh.add(this.lockBarrier);
        
        // ロックアイコン
        const lockCanvas = document.createElement('canvas');
        lockCanvas.width = 256;
        lockCanvas.height = 256;
        const ctx = lockCanvas.getContext('2d');
        
        // 背景
        ctx.fillStyle = 'rgba(255, 0, 0, 0.8)';
        ctx.beginPath();
        ctx.arc(128, 128, 100, 0, Math.PI * 2);
        ctx.fill();
        
        // ロックアイコン
        ctx.fillStyle = 'white';
        ctx.font = 'bold 120px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('🔒', 128, 128);
        
        const lockTexture = new THREE.CanvasTexture(lockCanvas);
        const lockSpriteMaterial = new THREE.SpriteMaterial({ 
            map: lockTexture,
            transparent: true
        });
        
        this.lockSprite = new THREE.Sprite(lockSpriteMaterial);
        this.lockSprite.position.set(0, 0, this.radius * 1.5);
        this.lockSprite.scale.set(20, 20, 1);
        this.mesh.add(this.lockSprite);
    }
    
    showUnlockEffect() {
        if (!this.lockBarrier || !this.lockSprite) return;
        
        // バリア破壊エフェクト
        const destroyBarrier = () => {
            let opacity = 0.3;
            const fadeOut = setInterval(() => {
                opacity -= 0.02;
                if (this.lockBarrier) {
                    this.lockBarrier.material.opacity = opacity;
                    this.lockBarrier.scale.multiplyScalar(1.02);
                }
                
                if (opacity <= 0) {
                    clearInterval(fadeOut);
                    if (this.lockBarrier) {
                        this.mesh.remove(this.lockBarrier);
                        this.lockBarrier.geometry.dispose();
                        this.lockBarrier.material.dispose();
                        this.lockBarrier = null;
                    }
                    if (this.lockSprite) {
                        this.mesh.remove(this.lockSprite);
                        this.lockSprite.material.map.dispose();
                        this.lockSprite.material.dispose();
                        this.lockSprite = null;
                    }
                }
            }, 50);
        };
        
        // フラッシュエフェクト
        const flash = new THREE.PointLight(0x00ff00, 5, this.radius * 3);
        flash.position.copy(this.position);
        this.scene.add(flash);
        
        setTimeout(() => {
            this.scene.remove(flash);
        }, 1000);
        
        destroyBarrier();
    }

    update(delta, camera) {
        // 惑星の自転
        this.mesh.rotation.y += this.rotationSpeed;
        
        // 雲の回転
        if (this.clouds) {
            this.clouds.rotation.y += this.rotationSpeed * 1.5;
        }
        
        // 環の微妙な動き
        if (this.rings) {
            this.rings.rotation.z += this.rotationSpeed * 0.5;
        }
        
        // ロックバリアの回転
        if (this.lockBarrier) {
            this.lockBarrier.rotation.x += 0.01;
            this.lockBarrier.rotation.y += 0.01;
        }
        
        // ロックスプライトを常にカメラに向ける
        if (this.lockSprite && camera) {
            this.lockSprite.lookAt(camera.position);
        }
        
        // 名前ラベルをカメラに向ける
        if (this.nameLabel && camera) {
            this.nameLabel.lookAt(camera.position);
        }
    }

    checkProximity(playerPosition, threshold = 50) {
        const distance = this.mesh.position.distanceTo(playerPosition);
        return distance < this.radius + threshold;
    }
}