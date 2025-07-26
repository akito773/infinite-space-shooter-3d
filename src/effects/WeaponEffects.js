// 武器エフェクトシステム

import * as THREE from 'three';

export class WeaponEffects {
    constructor(game) {
        this.game = game;
        this.scene = game.scene;
        this.activeEffects = [];
        
        this.initializeEffects();
    }
    
    initializeEffects() {
        // パーティクルシステムの準備
        this.particleSystems = new Map();
        
        // シェーダーマテリアル
        this.createShaderMaterials();
    }
    
    createShaderMaterials() {
        // プラズマエフェクト用シェーダー
        this.plasmaShader = {
            vertexShader: `
                varying vec2 vUv;
                varying float vAlpha;
                attribute float alpha;
                
                void main() {
                    vUv = uv;
                    vAlpha = alpha;
                    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
                    gl_Position = projectionMatrix * mvPosition;
                }
            `,
            fragmentShader: `
                uniform float time;
                uniform vec3 color;
                varying vec2 vUv;
                varying float vAlpha;
                
                void main() {
                    vec2 center = vUv - 0.5;
                    float dist = length(center);
                    float alpha = (1.0 - dist * 2.0) * vAlpha;
                    
                    // プラズマ効果
                    float plasma = sin(dist * 10.0 - time * 3.0) * 0.5 + 0.5;
                    vec3 finalColor = color * (1.0 + plasma * 0.5);
                    
                    gl_FragColor = vec4(finalColor, alpha);
                }
            `
        };
        
        // イオンビームシェーダー
        this.ionBeamShader = {
            vertexShader: `
                varying vec2 vUv;
                void main() {
                    vUv = uv;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                uniform float time;
                uniform vec3 color;
                varying vec2 vUv;
                
                void main() {
                    float beam = 1.0 - abs(vUv.y - 0.5) * 2.0;
                    beam = pow(beam, 3.0);
                    
                    // エネルギー波
                    float wave = sin(vUv.x * 20.0 - time * 10.0) * 0.1;
                    beam *= 1.0 + wave;
                    
                    // エッジグロー
                    float edge = 1.0 - abs(vUv.y - 0.5) * 4.0;
                    edge = clamp(edge, 0.0, 1.0);
                    
                    vec3 finalColor = color * beam + color * edge * 0.5;
                    gl_FragColor = vec4(finalColor, beam);
                }
            `
        };
    }
    
    // パルスレーザーエフェクト
    createPulseLaserEffect(position, direction, color) {
        const geometry = new THREE.CylinderGeometry(0.1, 0.3, 5, 8);
        const material = new THREE.MeshBasicMaterial({
            color: color,
            transparent: true,
            opacity: 0.8,
            emissive: color,
            emissiveIntensity: 2
        });
        
        const laser = new THREE.Mesh(geometry, material);
        laser.position.copy(position);
        laser.lookAt(position.clone().add(direction));
        laser.rotateX(Math.PI / 2);
        
        // グローエフェクト
        const glowGeometry = new THREE.CylinderGeometry(0.2, 0.5, 5, 8);
        const glowMaterial = new THREE.MeshBasicMaterial({
            color: color,
            transparent: true,
            opacity: 0.3
        });
        const glow = new THREE.Mesh(glowGeometry, glowMaterial);
        laser.add(glow);
        
        this.scene.add(laser);
        
        // アニメーション
        const effect = {
            mesh: laser,
            update: (delta) => {
                laser.material.opacity -= delta * 2;
                glow.material.opacity -= delta * 1.5;
                if (laser.material.opacity <= 0) {
                    return true; // 削除
                }
            },
            dispose: () => {
                this.scene.remove(laser);
                geometry.dispose();
                material.dispose();
                glowGeometry.dispose();
                glowMaterial.dispose();
            }
        };
        
        this.activeEffects.push(effect);
        return laser;
    }
    
    // ラピッドファイアエフェクト
    createRapidFireEffect(position, direction, color) {
        const tracers = [];
        
        for (let i = 0; i < 3; i++) {
            const geometry = new THREE.SphereGeometry(0.15, 6, 6);
            const material = new THREE.MeshBasicMaterial({
                color: color,
                transparent: true,
                opacity: 0.9 - i * 0.2
            });
            
            const tracer = new THREE.Mesh(geometry, material);
            const offset = direction.clone().multiplyScalar(i * 0.5);
            tracer.position.copy(position).sub(offset);
            
            // トレイル
            const trailGeometry = new THREE.CylinderGeometry(0.05, 0.05, 2, 4);
            const trailMaterial = new THREE.MeshBasicMaterial({
                color: color,
                transparent: true,
                opacity: 0.5 - i * 0.1
            });
            const trail = new THREE.Mesh(trailGeometry, trailMaterial);
            trail.position.z = 1;
            trail.rotation.x = Math.PI / 2;
            tracer.add(trail);
            
            this.scene.add(tracer);
            tracers.push({ mesh: tracer, trail: trail });
        }
        
        const effect = {
            meshes: tracers,
            life: 0.3,
            update: (delta) => {
                this.life -= delta;
                tracers.forEach((t, i) => {
                    t.mesh.material.opacity -= delta * 3;
                    t.trail.material.opacity -= delta * 2;
                });
                return this.life <= 0;
            },
            dispose: () => {
                tracers.forEach(t => {
                    this.scene.remove(t.mesh);
                    t.mesh.geometry.dispose();
                    t.mesh.material.dispose();
                    t.trail.geometry.dispose();
                    t.trail.material.dispose();
                });
            }
        };
        
        this.activeEffects.push(effect);
    }
    
    // プラズマキャノンエフェクト
    createPlasmaCannonEffect(position, direction, color) {
        // プラズマボール
        const geometry = new THREE.SphereGeometry(0.6, 16, 16);
        const material = new THREE.ShaderMaterial({
            uniforms: {
                time: { value: 0 },
                color: { value: new THREE.Color(color) }
            },
            vertexShader: this.plasmaShader.vertexShader,
            fragmentShader: this.plasmaShader.fragmentShader,
            transparent: true,
            blending: THREE.AdditiveBlending
        });
        
        const plasma = new THREE.Mesh(geometry, material);
        plasma.position.copy(position);
        
        // 外側のグロー
        const glowGeometry = new THREE.SphereGeometry(1, 16, 16);
        const glowMaterial = new THREE.MeshBasicMaterial({
            color: color,
            transparent: true,
            opacity: 0.2,
            blending: THREE.AdditiveBlending
        });
        const glow = new THREE.Mesh(glowGeometry, glowMaterial);
        plasma.add(glow);
        
        // パーティクル
        this.createPlasmaParticles(plasma, color);
        
        this.scene.add(plasma);
        
        const effect = {
            mesh: plasma,
            time: 0,
            update: (delta) => {
                this.time += delta;
                material.uniforms.time.value = this.time;
                
                // パルス効果
                const pulse = Math.sin(this.time * 10) * 0.1 + 1;
                plasma.scale.setScalar(pulse);
                glow.scale.setScalar(1.2 * pulse);
                
                return false; // プロジェクタイルと一緒に移動
            },
            dispose: () => {
                this.scene.remove(plasma);
                geometry.dispose();
                material.dispose();
                glowGeometry.dispose();
                glowMaterial.dispose();
            }
        };
        
        this.activeEffects.push(effect);
        return plasma;
    }
    
    createPlasmaParticles(parent, color) {
        const particleCount = 20;
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        const velocities = new Float32Array(particleCount * 3);
        
        for (let i = 0; i < particleCount; i++) {
            const angle = (i / particleCount) * Math.PI * 2;
            positions[i * 3] = Math.cos(angle) * 0.5;
            positions[i * 3 + 1] = Math.sin(angle) * 0.5;
            positions[i * 3 + 2] = 0;
            
            velocities[i * 3] = Math.cos(angle) * 0.5;
            velocities[i * 3 + 1] = Math.sin(angle) * 0.5;
            velocities[i * 3 + 2] = (Math.random() - 0.5) * 0.5;
        }
        
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('velocity', new THREE.BufferAttribute(velocities, 3));
        
        const material = new THREE.PointsMaterial({
            color: color,
            size: 0.2,
            transparent: true,
            opacity: 0.8,
            blending: THREE.AdditiveBlending
        });
        
        const particles = new THREE.Points(geometry, material);
        parent.add(particles);
        
        // パーティクルアニメーション
        const updateParticles = () => {
            const positions = geometry.attributes.position.array;
            const velocities = geometry.attributes.velocity.array;
            
            for (let i = 0; i < particleCount; i++) {
                positions[i * 3] += velocities[i * 3] * 0.02;
                positions[i * 3 + 1] += velocities[i * 3 + 1] * 0.02;
                positions[i * 3 + 2] += velocities[i * 3 + 2] * 0.02;
                
                // 中心からの距離
                const dist = Math.sqrt(
                    positions[i * 3] * positions[i * 3] +
                    positions[i * 3 + 1] * positions[i * 3 + 1]
                );
                
                // リセット
                if (dist > 1.5) {
                    const angle = Math.random() * Math.PI * 2;
                    positions[i * 3] = Math.cos(angle) * 0.3;
                    positions[i * 3 + 1] = Math.sin(angle) * 0.3;
                    positions[i * 3 + 2] = 0;
                }
            }
            
            geometry.attributes.position.needsUpdate = true;
            requestAnimationFrame(updateParticles);
        };
        
        updateParticles();
    }
    
    // ホーミングミサイルエフェクト
    createHomingMissileEffect(position, color) {
        // ミサイル本体
        const geometry = new THREE.ConeGeometry(0.2, 1, 6);
        const material = new THREE.MeshBasicMaterial({
            color: color,
            emissive: color,
            emissiveIntensity: 0.5
        });
        
        const missile = new THREE.Mesh(geometry, material);
        missile.rotation.x = -Math.PI / 2;
        
        // 煙トレイル
        const trailGroup = new THREE.Group();
        missile.add(trailGroup);
        
        const createSmokePuff = () => {
            const puffGeometry = new THREE.SphereGeometry(0.3, 8, 8);
            const puffMaterial = new THREE.MeshBasicMaterial({
                color: 0x888888,
                transparent: true,
                opacity: 0.6
            });
            
            const puff = new THREE.Mesh(puffGeometry, puffMaterial);
            puff.position.z = 0.5;
            trailGroup.add(puff);
            
            // フェードアウト
            const fadePuff = () => {
                puff.scale.multiplyScalar(1.05);
                puff.material.opacity -= 0.02;
                if (puff.material.opacity > 0) {
                    requestAnimationFrame(fadePuff);
                } else {
                    trailGroup.remove(puff);
                    puffGeometry.dispose();
                    puffMaterial.dispose();
                }
            };
            fadePuff();
        };
        
        // 定期的に煙を生成
        const smokeInterval = setInterval(createSmokePuff, 50);
        
        return {
            mesh: missile,
            stopSmoke: () => clearInterval(smokeInterval)
        };
    }
    
    // イオンビームエフェクト
    createIonBeamEffect(startPos, endPos, color, width = 2) {
        const distance = startPos.distanceTo(endPos);
        const geometry = new THREE.PlaneGeometry(width, distance);
        
        const material = new THREE.ShaderMaterial({
            uniforms: {
                time: { value: 0 },
                color: { value: new THREE.Color(color) }
            },
            vertexShader: this.ionBeamShader.vertexShader,
            fragmentShader: this.ionBeamShader.fragmentShader,
            transparent: true,
            blending: THREE.AdditiveBlending,
            side: THREE.DoubleSide
        });
        
        const beam = new THREE.Mesh(geometry, material);
        beam.position.copy(startPos).add(endPos).multiplyScalar(0.5);
        beam.lookAt(endPos);
        
        // コアビーム
        const coreGeometry = new THREE.PlaneGeometry(width * 0.3, distance);
        const coreMaterial = new THREE.MeshBasicMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0.9,
            blending: THREE.AdditiveBlending
        });
        const core = new THREE.Mesh(coreGeometry, coreMaterial);
        beam.add(core);
        
        this.scene.add(beam);
        
        const effect = {
            mesh: beam,
            time: 0,
            duration: 1,
            update: (delta) => {
                this.time += delta;
                material.uniforms.time.value = this.time;
                
                // フェードアウト
                const fadeProgress = this.time / this.duration;
                if (fadeProgress < 1) {
                    material.opacity = 1 - fadeProgress;
                    coreMaterial.opacity = 0.9 * (1 - fadeProgress);
                } else {
                    return true; // 削除
                }
            },
            dispose: () => {
                this.scene.remove(beam);
                geometry.dispose();
                material.dispose();
                coreGeometry.dispose();
                coreMaterial.dispose();
            }
        };
        
        this.activeEffects.push(effect);
        return beam;
    }
    
    // シールドエフェクト
    createShieldEffect(target, radius = 5, duration = 5) {
        const geometry = new THREE.SphereGeometry(radius, 32, 32);
        const material = new THREE.MeshBasicMaterial({
            color: 0x0088ff,
            transparent: true,
            opacity: 0.3,
            side: THREE.BackSide,
            blending: THREE.AdditiveBlending
        });
        
        const shield = new THREE.Mesh(geometry, material);
        target.add(shield);
        
        // ヘキサゴンパターン
        const hexGeometry = new THREE.IcosahedronGeometry(radius * 1.01, 1);
        const hexMaterial = new THREE.MeshBasicMaterial({
            color: 0x00ffff,
            wireframe: true,
            transparent: true,
            opacity: 0.5
        });
        const hexPattern = new THREE.Mesh(hexGeometry, hexMaterial);
        shield.add(hexPattern);
        
        const effect = {
            mesh: shield,
            time: 0,
            duration: duration,
            update: (delta) => {
                this.time += delta;
                
                // 回転
                hexPattern.rotation.y += delta * 0.5;
                hexPattern.rotation.x += delta * 0.3;
                
                // パルス
                const pulse = Math.sin(this.time * 3) * 0.05 + 1;
                shield.scale.setScalar(pulse);
                
                // フェードアウト（最後の1秒）
                if (this.time > this.duration - 1) {
                    const fade = 1 - (this.time - (this.duration - 1));
                    material.opacity = 0.3 * fade;
                    hexMaterial.opacity = 0.5 * fade;
                }
                
                return this.time >= this.duration;
            },
            dispose: () => {
                target.remove(shield);
                geometry.dispose();
                material.dispose();
                hexGeometry.dispose();
                hexMaterial.dispose();
            }
        };
        
        this.activeEffects.push(effect);
        return shield;
    }
    
    // EMP爆発エフェクト
    createEMPBlastEffect(position, radius) {
        // 電磁波リング
        const rings = [];
        for (let i = 0; i < 3; i++) {
            const ringGeometry = new THREE.TorusGeometry(radius * (i + 1) * 0.3, 0.5, 8, 32);
            const ringMaterial = new THREE.MeshBasicMaterial({
                color: 0xffffff,
                transparent: true,
                opacity: 0.8 - i * 0.2,
                blending: THREE.AdditiveBlending
            });
            
            const ring = new THREE.Mesh(ringGeometry, ringMaterial);
            ring.position.copy(position);
            ring.rotation.x = Math.random() * Math.PI;
            ring.rotation.y = Math.random() * Math.PI;
            this.scene.add(ring);
            rings.push(ring);
        }
        
        // 電気エフェクト
        const createLightning = () => {
            const points = [];
            const segments = 10;
            for (let i = 0; i <= segments; i++) {
                const angle = (i / segments) * Math.PI * 2;
                const r = radius + (Math.random() - 0.5) * 5;
                points.push(new THREE.Vector3(
                    Math.cos(angle) * r,
                    (Math.random() - 0.5) * 5,
                    Math.sin(angle) * r
                ));
            }
            
            const lightningGeometry = new THREE.BufferGeometry().setFromPoints(points);
            const lightningMaterial = new THREE.LineBasicMaterial({
                color: 0x00ffff,
                transparent: true,
                opacity: 0.8,
                blending: THREE.AdditiveBlending
            });
            
            const lightning = new THREE.Line(lightningGeometry, lightningMaterial);
            lightning.position.copy(position);
            this.scene.add(lightning);
            
            // フェードアウト
            const fadeLightning = () => {
                lightning.material.opacity -= 0.05;
                if (lightning.material.opacity > 0) {
                    requestAnimationFrame(fadeLightning);
                } else {
                    this.scene.remove(lightning);
                    lightningGeometry.dispose();
                    lightningMaterial.dispose();
                }
            };
            fadeLightning();
        };
        
        // 複数の稲妻を生成
        for (let i = 0; i < 5; i++) {
            setTimeout(() => createLightning(), i * 100);
        }
        
        const effect = {
            meshes: rings,
            time: 0,
            update: (delta) => {
                this.time += delta;
                
                rings.forEach((ring, i) => {
                    // 拡大
                    ring.scale.multiplyScalar(1 + delta * 3);
                    // フェードアウト
                    ring.material.opacity -= delta * 2;
                    // 回転
                    ring.rotation.x += delta * (i + 1);
                    ring.rotation.y += delta * (i + 1) * 0.5;
                });
                
                return rings[0].material.opacity <= 0;
            },
            dispose: () => {
                rings.forEach(ring => {
                    this.scene.remove(ring);
                    ring.geometry.dispose();
                    ring.material.dispose();
                });
            }
        };
        
        this.activeEffects.push(effect);
    }
    
    update(delta) {
        // アクティブなエフェクトを更新
        this.activeEffects = this.activeEffects.filter(effect => {
            const shouldRemove = effect.update(delta);
            if (shouldRemove) {
                effect.dispose();
                return false;
            }
            return true;
        });
    }
    
    dispose() {
        // すべてのエフェクトをクリーンアップ
        this.activeEffects.forEach(effect => effect.dispose());
        this.activeEffects = [];
    }
}