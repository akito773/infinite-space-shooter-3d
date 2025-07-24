// ワープゲートオブジェクト

import * as THREE from 'three';

export class WarpGate {
    constructor(scene, config) {
        this.scene = scene;
        this.position = config.position;
        this.targetZone = config.targetZone;
        this.targetZoneName = config.targetZoneName;
        this.id = config.id;
        this.size = config.size || 50;
        
        this.group = new THREE.Group();
        this.active = true;
        this.cooldown = 0;
        this.particles = [];
        
        // アニメーション用
        this.rotationSpeed = 0.01;
        this.pulsePhase = 0;
        this.activationProgress = 0;
        this.playerNearby = false;
        
        this.init();
    }
    
    init() {
        this.group.position.copy(this.position);
        this.scene.add(this.group);
        
        // ゲート本体を作成
        this.createGateStructure();
        
        // パーティクルエフェクト
        this.createParticleSystem();
        
        // ポータルエフェクト
        this.createPortalEffect();
        
        // 情報表示
        this.createInfoDisplay();
        
        // ライト効果
        this.createLightEffects();
    }
    
    createGateStructure() {
        // 外側のリング
        const outerRingGeometry = new THREE.TorusGeometry(
            this.size, 
            this.size * 0.1, 
            16, 
            64
        );
        const outerRingMaterial = new THREE.MeshPhongMaterial({
            color: 0x4488ff,
            emissive: 0x2244aa,
            specular: 0xffffff,
            shininess: 150
        });
        this.outerRing = new THREE.Mesh(outerRingGeometry, outerRingMaterial);
        this.group.add(this.outerRing);
        
        // 内側のリング（回転用）
        const innerRingGeometry = new THREE.TorusGeometry(
            this.size * 0.8,
            this.size * 0.05,
            8,
            64
        );
        const innerRingMaterial = new THREE.MeshPhongMaterial({
            color: 0x00ffff,
            emissive: 0x00aaaa,
            specular: 0xffffff,
            shininess: 200
        });
        this.innerRing = new THREE.Mesh(innerRingGeometry, innerRingMaterial);
        this.innerRing.rotation.x = Math.PI / 2;
        this.group.add(this.innerRing);
        
        // エネルギーコア
        const coreGeometry = new THREE.IcosahedronGeometry(this.size * 0.15, 2);
        const coreMaterial = new THREE.MeshPhongMaterial({
            color: 0xffffff,
            emissive: 0x00ffff,
            transparent: true,
            opacity: 0.8
        });
        this.core = new THREE.Mesh(coreGeometry, coreMaterial);
        this.group.add(this.core);
        
        // 支柱
        for (let i = 0; i < 4; i++) {
            const angle = (i / 4) * Math.PI * 2;
            const strutGeometry = new THREE.BoxGeometry(
                this.size * 0.05,
                this.size * 0.3,
                this.size * 0.05
            );
            const strutMaterial = new THREE.MeshPhongMaterial({
                color: 0x666666,
                specular: 0xffffff,
                shininess: 100
            });
            const strut = new THREE.Mesh(strutGeometry, strutMaterial);
            strut.position.set(
                Math.cos(angle) * this.size * 0.9,
                0,
                Math.sin(angle) * this.size * 0.9
            );
            strut.lookAt(this.group.position);
            this.group.add(strut);
        }
    }
    
    createPortalEffect() {
        // ポータル面
        const portalGeometry = new THREE.CircleGeometry(this.size * 0.9, 64);
        
        // カスタムシェーダーマテリアル
        const portalMaterial = new THREE.ShaderMaterial({
            uniforms: {
                time: { value: 0 },
                color1: { value: new THREE.Color(0x0044ff) },
                color2: { value: new THREE.Color(0x00ffff) },
                opacity: { value: 0.6 }
            },
            vertexShader: `
                varying vec2 vUv;
                void main() {
                    vUv = uv;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                uniform float time;
                uniform vec3 color1;
                uniform vec3 color2;
                uniform float opacity;
                varying vec2 vUv;
                
                void main() {
                    vec2 center = vec2(0.5, 0.5);
                    float dist = distance(vUv, center);
                    
                    // 渦巻きパターン
                    float angle = atan(vUv.y - 0.5, vUv.x - 0.5);
                    float spiral = sin(angle * 5.0 - time * 2.0 + dist * 10.0);
                    
                    // 中心から外側へのグラデーション
                    float gradient = 1.0 - dist * 2.0;
                    gradient = clamp(gradient, 0.0, 1.0);
                    
                    // 色の混合
                    vec3 color = mix(color1, color2, spiral * 0.5 + 0.5);
                    
                    // 透明度
                    float alpha = gradient * opacity * (0.8 + spiral * 0.2);
                    
                    gl_FragColor = vec4(color, alpha);
                }
            `,
            transparent: true,
            side: THREE.DoubleSide
        });
        
        this.portal = new THREE.Mesh(portalGeometry, portalMaterial);
        this.portal.rotation.x = Math.PI / 2;
        this.group.add(this.portal);
        
        this.portalMaterial = portalMaterial;
    }
    
    createParticleSystem() {
        const particleCount = 100;
        const particleGeometry = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        const colors = new Float32Array(particleCount * 3);
        const sizes = new Float32Array(particleCount);
        
        for (let i = 0; i < particleCount; i++) {
            // 円形に配置
            const angle = Math.random() * Math.PI * 2;
            const radius = this.size * (0.5 + Math.random() * 0.5);
            
            positions[i * 3] = Math.cos(angle) * radius;
            positions[i * 3 + 1] = (Math.random() - 0.5) * this.size * 0.5;
            positions[i * 3 + 2] = Math.sin(angle) * radius;
            
            // 青系の色
            colors[i * 3] = 0.2 + Math.random() * 0.3;
            colors[i * 3 + 1] = 0.6 + Math.random() * 0.4;
            colors[i * 3 + 2] = 1.0;
            
            sizes[i] = Math.random() * 3 + 1;
            
            // パーティクルデータを保存
            this.particles.push({
                angle: angle,
                radius: radius,
                speed: 0.02 + Math.random() * 0.02,
                ySpeed: (Math.random() - 0.5) * 0.5
            });
        }
        
        particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        particleGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        particleGeometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
        
        const particleMaterial = new THREE.PointsMaterial({
            size: 2,
            vertexColors: true,
            blending: THREE.AdditiveBlending,
            transparent: true,
            opacity: 0.8
        });
        
        this.particleSystem = new THREE.Points(particleGeometry, particleMaterial);
        this.group.add(this.particleSystem);
    }
    
    createInfoDisplay() {
        // 目的地を表示するスプライト
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 128;
        const context = canvas.getContext('2d');
        
        // 背景
        context.fillStyle = 'rgba(0, 0, 0, 0.7)';
        context.fillRect(0, 0, 512, 128);
        
        // テキスト
        context.fillStyle = '#00ffff';
        context.font = 'bold 48px Arial';
        context.textAlign = 'center';
        context.fillText(this.targetZoneName, 256, 60);
        
        context.fillStyle = '#ffffff';
        context.font = '24px Arial';
        context.fillText('ワープゲート', 256, 90);
        
        const texture = new THREE.CanvasTexture(canvas);
        const spriteMaterial = new THREE.SpriteMaterial({
            map: texture,
            transparent: true
        });
        
        this.infoSprite = new THREE.Sprite(spriteMaterial);
        this.infoSprite.position.y = this.size + 20;
        this.infoSprite.scale.set(100, 25, 1);
        this.group.add(this.infoSprite);
    }
    
    createLightEffects() {
        // ポイントライト
        this.pointLight = new THREE.PointLight(0x00aaff, 2, this.size * 3);
        this.group.add(this.pointLight);
        
        // スポットライト（ポータル効果用）
        this.spotLight = new THREE.SpotLight(0x00ffff, 1, this.size * 2, Math.PI / 4, 0.5);
        this.spotLight.position.set(0, 0, this.size);
        this.spotLight.target.position.set(0, 0, 0);
        this.group.add(this.spotLight);
        this.group.add(this.spotLight.target);
    }
    
    update(delta, playerPosition) {
        if (!this.active) return;
        
        // クールダウン更新
        if (this.cooldown > 0) {
            this.cooldown -= delta;
        }
        
        // リングの回転
        this.outerRing.rotation.z += this.rotationSpeed;
        this.innerRing.rotation.z -= this.rotationSpeed * 1.5;
        this.innerRing.rotation.y += this.rotationSpeed * 0.5;
        
        // コアのパルス
        this.pulsePhase += delta * 0.002;
        const pulseScale = 1 + Math.sin(this.pulsePhase) * 0.2;
        this.core.scale.setScalar(pulseScale);
        
        // コアの回転
        this.core.rotation.x += 0.01;
        this.core.rotation.y += 0.02;
        
        // ポータルシェーダーの更新
        if (this.portalMaterial) {
            this.portalMaterial.uniforms.time.value += delta * 0.001;
        }
        
        // パーティクルの更新
        this.updateParticles(delta);
        
        // プレイヤーとの距離チェック
        const distance = this.group.position.distanceTo(playerPosition);
        const wasNearby = this.playerNearby;
        this.playerNearby = distance < this.size * 2;
        
        // プレイヤーが近づいた時
        if (this.playerNearby && !wasNearby) {
            this.onPlayerApproach();
        } else if (!this.playerNearby && wasNearby) {
            this.onPlayerLeave();
        }
        
        // アクティベーション進行度の更新
        if (this.playerNearby && this.cooldown <= 0) {
            this.activationProgress = Math.min(1, this.activationProgress + delta * 0.0005);
            this.updateActivationEffects();
        } else {
            this.activationProgress = Math.max(0, this.activationProgress - delta * 0.001);
        }
        
        // ライトの強度更新
        this.pointLight.intensity = 2 + this.activationProgress * 2;
        this.spotLight.intensity = 1 + this.activationProgress;
    }
    
    updateParticles(delta) {
        const positions = this.particleSystem.geometry.attributes.position.array;
        
        this.particles.forEach((particle, i) => {
            // 回転
            particle.angle += particle.speed;
            
            // 新しい位置
            positions[i * 3] = Math.cos(particle.angle) * particle.radius;
            positions[i * 3 + 2] = Math.sin(particle.angle) * particle.radius;
            
            // 上下の動き
            positions[i * 3 + 1] += particle.ySpeed * delta * 0.1;
            
            // 境界チェック
            if (Math.abs(positions[i * 3 + 1]) > this.size * 0.25) {
                particle.ySpeed *= -1;
            }
        });
        
        this.particleSystem.geometry.attributes.position.needsUpdate = true;
    }
    
    updateActivationEffects() {
        // ゲートの明るさを変更
        // Three.jsのバージョンによってはemissiveIntensityがサポートされていない場合がある
        if ('emissiveIntensity' in this.outerRing.material) {
            this.outerRing.material.emissiveIntensity = 0.5 + this.activationProgress * 0.5;
        }
        if ('emissiveIntensity' in this.innerRing.material) {
            this.innerRing.material.emissiveIntensity = 0.8 + this.activationProgress * 0.2;
        }
        
        // ポータルの不透明度
        if (this.portalMaterial) {
            this.portalMaterial.uniforms.opacity.value = 0.6 + this.activationProgress * 0.4;
        }
        
        // 回転速度の増加
        this.rotationSpeed = 0.01 + this.activationProgress * 0.02;
    }
    
    onPlayerApproach() {
        // UI表示
        this.showActivationUI();
        
        // サウンド再生
        if (this.game && this.game.soundManager) {
            this.game.soundManager.play('gate_approach');
        }
        
        // エフェクト強化
        this.particleSystem.material.size = 3;
    }
    
    onPlayerLeave() {
        // UI非表示
        this.hideActivationUI();
        
        // エフェクト通常化
        this.particleSystem.material.size = 2;
    }
    
    showActivationUI() {
        const ui = document.createElement('div');
        ui.id = `warp-gate-ui-${this.id}`;
        ui.className = 'warp-gate-ui';
        ui.innerHTML = `
            <div class="gate-prompt">
                <div class="destination">${this.targetZoneName}へワープ</div>
                <div class="instruction">Fキーを長押しで起動</div>
                <div class="progress-bar">
                    <div class="progress-fill" style="width: 0%"></div>
                </div>
            </div>
        `;
        
        ui.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(0, 0, 0, 0.8);
            border: 2px solid #00ffff;
            padding: 20px;
            color: white;
            font-family: monospace;
            text-align: center;
            z-index: 1000;
        `;
        
        // スタイル追加
        if (!document.querySelector('#warp-gate-styles')) {
            const style = document.createElement('style');
            style.id = 'warp-gate-styles';
            style.textContent = `
                .gate-prompt {
                    min-width: 300px;
                }
                
                .destination {
                    font-size: 24px;
                    color: #00ffff;
                    margin-bottom: 10px;
                    text-shadow: 0 0 10px rgba(0, 255, 255, 0.5);
                }
                
                .instruction {
                    font-size: 16px;
                    color: #aaaaaa;
                    margin-bottom: 15px;
                }
                
                .progress-bar {
                    width: 100%;
                    height: 10px;
                    background: rgba(0, 0, 0, 0.5);
                    border: 1px solid #00ffff;
                    border-radius: 5px;
                    overflow: hidden;
                }
                
                .progress-fill {
                    height: 100%;
                    background: linear-gradient(90deg, #0088ff, #00ffff);
                    transition: width 0.1s;
                    box-shadow: 0 0 10px rgba(0, 255, 255, 0.8);
                }
            `;
            document.head.appendChild(style);
        }
        
        document.body.appendChild(ui);
        this.activationUI = ui;
    }
    
    hideActivationUI() {
        if (this.activationUI) {
            this.activationUI.remove();
            this.activationUI = null;
        }
    }
    
    updateActivationProgress(progress) {
        if (this.activationUI) {
            const progressBar = this.activationUI.querySelector('.progress-fill');
            if (progressBar) {
                progressBar.style.width = `${progress * 100}%`;
            }
        }
    }
    
    activate(player) {
        if (this.cooldown > 0 || !this.active) return false;
        
        // ワープエフェクト
        this.createWarpEffect(player);
        
        // クールダウン設定
        this.cooldown = 5000; // 5秒
        
        // ゲートを一時的に無効化
        this.active = false;
        setTimeout(() => {
            this.active = true;
        }, this.cooldown);
        
        return true;
    }
    
    createWarpEffect(player) {
        // 光の柱エフェクト
        const beamGeometry = new THREE.CylinderGeometry(5, 5, 200, 32);
        const beamMaterial = new THREE.MeshBasicMaterial({
            color: 0x00ffff,
            transparent: true,
            opacity: 0.8,
            blending: THREE.AdditiveBlending
        });
        
        const beam = new THREE.Mesh(beamGeometry, beamMaterial);
        beam.position.copy(player.position);
        this.scene.add(beam);
        
        // ビームのアニメーション
        const animateBeam = () => {
            beam.scale.x *= 1.1;
            beam.scale.z *= 1.1;
            beam.material.opacity *= 0.95;
            
            if (beam.material.opacity > 0.01) {
                requestAnimationFrame(animateBeam);
            } else {
                this.scene.remove(beam);
                beam.geometry.dispose();
                beam.material.dispose();
            }
        };
        
        animateBeam();
        
        // パーティクル爆発
        this.createWarpParticles(player.position);
    }
    
    createWarpParticles(position) {
        const particleCount = 200;
        const particles = new THREE.Group();
        
        for (let i = 0; i < particleCount; i++) {
            const particle = new THREE.Mesh(
                new THREE.SphereGeometry(0.5),
                new THREE.MeshBasicMaterial({
                    color: new THREE.Color().setHSL(0.6, 1, 0.5 + Math.random() * 0.5),
                    transparent: true,
                    blending: THREE.AdditiveBlending
                })
            );
            
            particle.position.copy(position);
            
            // ランダムな方向
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(2 * Math.random() - 1);
            
            particle.velocity = new THREE.Vector3(
                Math.sin(phi) * Math.cos(theta),
                Math.sin(phi) * Math.sin(theta),
                Math.cos(phi)
            ).multiplyScalar(10 + Math.random() * 20);
            
            particles.add(particle);
        }
        
        this.scene.add(particles);
        
        // パーティクルアニメーション
        const animateParticles = () => {
            let allDone = true;
            
            particles.children.forEach(particle => {
                particle.position.add(particle.velocity.clone().multiplyScalar(0.02));
                particle.scale.multiplyScalar(0.98);
                particle.material.opacity = particle.scale.x;
                particle.velocity.multiplyScalar(0.98);
                
                if (particle.scale.x > 0.01) {
                    allDone = false;
                }
            });
            
            if (!allDone) {
                requestAnimationFrame(animateParticles);
            } else {
                particles.traverse(child => {
                    if (child.geometry) child.geometry.dispose();
                    if (child.material) child.material.dispose();
                });
                this.scene.remove(particles);
            }
        };
        
        animateParticles();
    }
    
    setGame(game) {
        this.game = game;
    }
    
    destroy() {
        // UIを削除
        this.hideActivationUI();
        
        // ジオメトリとマテリアルを破棄
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
        
        // シーンから削除
        this.scene.remove(this.group);
    }
}