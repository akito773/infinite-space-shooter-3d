// カットシーンシステム
// ストーリーの重要な場面で映画的な演出を提供

import * as THREE from 'three';

export class CutsceneSystem {
    constructor(game) {
        this.game = game;
        this.isPlaying = false;
        this.currentCutscene = null;
        this.cutsceneCamera = null;
        this.originalCamera = null;
        
        // カットシーン定義
        this.cutscenes = {
            // ダークネビュラ登場シーン
            dark_nebula_appears: {
                duration: 8000,
                shots: [
                    {
                        type: 'pan',
                        start: { position: [0, 50, 100], lookAt: [0, 0, 0] },
                        end: { position: [-50, 30, 50], lookAt: [0, 0, -100] },
                        duration: 3000,
                        onStart: () => {
                            this.showSubtitle("未知のエネルギー反応を検出...", 2000);
                        }
                    },
                    {
                        type: 'zoom',
                        start: { position: [0, 20, 80], fov: 75 },
                        end: { position: [0, 20, 40], fov: 45 },
                        duration: 2000,
                        lookAt: [0, 0, -150],
                        onStart: () => {
                            this.showSubtitle("警告: 強大な敵性体が接近中", 2000);
                        }
                    },
                    {
                        type: 'shake',
                        position: [0, 30, 60],
                        lookAt: [0, 0, -150],
                        intensity: 5,
                        duration: 3000,
                        onStart: () => {
                            // ダークネビュラ出現エフェクト
                            this.createAppearanceEffect(new THREE.Vector3(0, 0, -150));
                        }
                    }
                ]
            },
            
            // 父親の正体判明シーン
            father_reveal: {
                duration: 10000,
                shots: [
                    {
                        type: 'closeup',
                        target: 'boss',
                        offset: [0, 10, 30],
                        duration: 2000,
                        onStart: () => {
                            this.showSubtitle("その仮面の下には...", 2000);
                        }
                    },
                    {
                        type: 'dramatic',
                        position: [20, 5, 20],
                        lookAt: 'boss',
                        duration: 3000,
                        onStart: () => {
                            // 仮面が割れるエフェクト
                            if (this.game.currentBoss) {
                                this.createMaskBreakEffect(this.game.currentBoss.group.position);
                            }
                            this.showSubtitle("ルナ: まさか...お父さん！？", 3000);
                        }
                    },
                    {
                        type: 'rotate',
                        center: 'boss',
                        radius: 50,
                        height: 20,
                        duration: 5000,
                        onStart: () => {
                            this.showSubtitle("ヴィクター: ルナ...すまない...", 3000);
                        }
                    }
                ]
            },
            
            // 最終決戦開始
            final_battle_start: {
                duration: 6000,
                shots: [
                    {
                        type: 'epic',
                        start: { position: [0, 100, 200], fov: 90 },
                        end: { position: [0, 50, 100], fov: 60 },
                        lookAt: [0, 0, 0],
                        duration: 3000,
                        onStart: () => {
                            this.showSubtitle("運命の戦いが始まる...", 3000);
                        }
                    },
                    {
                        type: 'split',
                        leftTarget: 'player',
                        rightTarget: 'boss',
                        duration: 3000,
                        onStart: () => {
                            this.createEpicLighting();
                        }
                    }
                ]
            }
        };
        
        this.createCutsceneCamera();
        this.createUI();
    }
    
    createCutsceneCamera() {
        this.cutsceneCamera = new THREE.PerspectiveCamera(
            75,
            window.innerWidth / window.innerHeight,
            0.1,
            10000
        );
    }
    
    createUI() {
        // 黒い帯（映画的な演出）
        this.letterbox = document.createElement('div');
        this.letterbox.id = 'cutscene-letterbox';
        this.letterbox.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 5000;
            display: none;
        `;
        
        // 上下の黒い帯
        const topBar = document.createElement('div');
        topBar.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 15%;
            background: black;
            transition: height 0.5s ease;
        `;
        
        const bottomBar = document.createElement('div');
        bottomBar.style.cssText = `
            position: absolute;
            bottom: 0;
            left: 0;
            width: 100%;
            height: 15%;
            background: black;
            transition: height 0.5s ease;
        `;
        
        this.letterbox.appendChild(topBar);
        this.letterbox.appendChild(bottomBar);
        
        // 字幕表示エリア
        this.subtitleArea = document.createElement('div');
        this.subtitleArea.style.cssText = `
            position: absolute;
            bottom: 20%;
            left: 50%;
            transform: translateX(-50%);
            text-align: center;
            color: white;
            font-size: 24px;
            font-weight: bold;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.8);
            width: 80%;
            opacity: 0;
            transition: opacity 0.5s ease;
        `;
        this.letterbox.appendChild(this.subtitleArea);
        
        // スキップボタン
        this.skipButton = document.createElement('button');
        this.skipButton.textContent = 'スキップ (ESC)';
        this.skipButton.style.cssText = `
            position: absolute;
            bottom: 20px;
            right: 20px;
            background: rgba(0,0,0,0.5);
            border: 1px solid white;
            color: white;
            padding: 10px 20px;
            cursor: pointer;
            font-size: 14px;
            opacity: 0.5;
            transition: opacity 0.3s ease;
        `;
        this.skipButton.onmouseover = () => this.skipButton.style.opacity = '1';
        this.skipButton.onmouseout = () => this.skipButton.style.opacity = '0.5';
        this.skipButton.onclick = () => this.skip();
        this.letterbox.appendChild(this.skipButton);
        
        document.body.appendChild(this.letterbox);
        
        // ESCキーでスキップ
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isPlaying) {
                this.skip();
            }
        });
    }
    
    play(cutsceneName, onComplete) {
        const cutscene = this.cutscenes[cutsceneName];
        if (!cutscene || this.isPlaying) return;
        
        this.isPlaying = true;
        this.currentCutscene = cutscene;
        this.onCompleteCallback = onComplete;
        this.currentShotIndex = 0;
        
        // ゲームを一時停止
        this.game.isPaused = true;
        
        // カメラを保存
        this.originalCamera = this.game.camera;
        
        // レターボックス表示
        this.letterbox.style.display = 'block';
        
        // 最初のショットを開始
        this.playShot(0);
        
        // BGM変更（もしあれば）
        if (this.game.soundManager) {
            this.game.soundManager.fadeOutBGM(1000);
        }
    }
    
    playShot(index) {
        if (index >= this.currentCutscene.shots.length) {
            this.end();
            return;
        }
        
        const shot = this.currentCutscene.shots[index];
        this.currentShot = shot;
        this.currentShotIndex = index;
        
        // ショット開始時のコールバック
        if (shot.onStart) {
            shot.onStart();
        }
        
        // ショットタイプに応じた処理
        switch (shot.type) {
            case 'pan':
                this.executePanShot(shot);
                break;
            case 'zoom':
                this.executeZoomShot(shot);
                break;
            case 'shake':
                this.executeShakeShot(shot);
                break;
            case 'closeup':
                this.executeCloseupShot(shot);
                break;
            case 'dramatic':
                this.executeDramaticShot(shot);
                break;
            case 'rotate':
                this.executeRotateShot(shot);
                break;
            case 'epic':
                this.executeEpicShot(shot);
                break;
            case 'split':
                this.executeSplitShot(shot);
                break;
        }
        
        // 次のショットへ
        setTimeout(() => {
            this.playShot(index + 1);
        }, shot.duration);
    }
    
    executePanShot(shot) {
        const startPos = new THREE.Vector3(...shot.start.position);
        const endPos = new THREE.Vector3(...shot.end.position);
        const startLook = new THREE.Vector3(...shot.start.lookAt);
        const endLook = new THREE.Vector3(...shot.end.lookAt);
        
        const startTime = Date.now();
        
        const animate = () => {
            if (!this.isPlaying) return;
            
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / shot.duration, 1);
            const eased = this.easeInOut(progress);
            
            this.cutsceneCamera.position.lerpVectors(startPos, endPos, eased);
            const lookAt = new THREE.Vector3().lerpVectors(startLook, endLook, eased);
            this.cutsceneCamera.lookAt(lookAt);
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };
        
        animate();
    }
    
    executeZoomShot(shot) {
        const startPos = new THREE.Vector3(...shot.start.position);
        const endPos = new THREE.Vector3(...shot.end.position);
        const lookAt = Array.isArray(shot.lookAt) ? 
            new THREE.Vector3(...shot.lookAt) : 
            this.getTargetPosition(shot.lookAt);
        
        const startFov = shot.start.fov;
        const endFov = shot.end.fov;
        
        const startTime = Date.now();
        
        const animate = () => {
            if (!this.isPlaying) return;
            
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / shot.duration, 1);
            const eased = this.easeInOut(progress);
            
            this.cutsceneCamera.position.lerpVectors(startPos, endPos, eased);
            this.cutsceneCamera.fov = startFov + (endFov - startFov) * eased;
            this.cutsceneCamera.updateProjectionMatrix();
            this.cutsceneCamera.lookAt(lookAt);
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };
        
        animate();
    }
    
    executeShakeShot(shot) {
        const basePos = new THREE.Vector3(...shot.position);
        const lookAt = Array.isArray(shot.lookAt) ? 
            new THREE.Vector3(...shot.lookAt) : 
            this.getTargetPosition(shot.lookAt);
        
        const startTime = Date.now();
        
        const animate = () => {
            if (!this.isPlaying) return;
            
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / shot.duration, 1);
            
            // シェイク効果
            const shakeX = (Math.random() - 0.5) * shot.intensity * (1 - progress);
            const shakeY = (Math.random() - 0.5) * shot.intensity * (1 - progress);
            const shakeZ = (Math.random() - 0.5) * shot.intensity * (1 - progress);
            
            this.cutsceneCamera.position.copy(basePos);
            this.cutsceneCamera.position.add(new THREE.Vector3(shakeX, shakeY, shakeZ));
            this.cutsceneCamera.lookAt(lookAt);
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };
        
        animate();
    }
    
    showSubtitle(text, duration) {
        this.subtitleArea.textContent = text;
        this.subtitleArea.style.opacity = '1';
        
        setTimeout(() => {
            this.subtitleArea.style.opacity = '0';
        }, duration);
    }
    
    createAppearanceEffect(position) {
        // ダークネビュラ出現エフェクト
        const geometry = new THREE.SphereGeometry(50, 32, 32);
        const material = new THREE.MeshBasicMaterial({
            color: 0x9900ff,
            transparent: true,
            opacity: 0.5,
            side: THREE.BackSide
        });
        
        const sphere = new THREE.Mesh(geometry, material);
        sphere.position.copy(position);
        this.game.scene.add(sphere);
        
        // アニメーション
        const startTime = Date.now();
        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = elapsed / 2000;
            
            sphere.scale.setScalar(1 + Math.sin(progress * Math.PI));
            material.opacity = 0.5 * (1 - progress);
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                this.game.scene.remove(sphere);
                geometry.dispose();
                material.dispose();
            }
        };
        
        animate();
    }
    
    createMaskBreakEffect(position) {
        // 仮面が割れるパーティクルエフェクト
        const particleCount = 50;
        const particles = [];
        
        for (let i = 0; i < particleCount; i++) {
            const geometry = new THREE.BoxGeometry(2, 2, 0.5);
            const material = new THREE.MeshPhongMaterial({
                color: 0x000000,
                emissive: 0xff0066,
                emissiveIntensity: 0.5
            });
            
            const particle = new THREE.Mesh(geometry, material);
            particle.position.copy(position);
            particle.position.add(new THREE.Vector3(
                (Math.random() - 0.5) * 10,
                (Math.random() - 0.5) * 10,
                (Math.random() - 0.5) * 10
            ));
            
            particle.velocity = new THREE.Vector3(
                (Math.random() - 0.5) * 20,
                Math.random() * 20,
                (Math.random() - 0.5) * 20
            );
            
            particle.rotationSpeed = new THREE.Vector3(
                Math.random() * 0.1,
                Math.random() * 0.1,
                Math.random() * 0.1
            );
            
            this.game.scene.add(particle);
            particles.push(particle);
        }
        
        // アニメーション
        const startTime = Date.now();
        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = elapsed / 3000;
            
            particles.forEach(particle => {
                particle.position.add(particle.velocity.clone().multiplyScalar(0.016));
                particle.velocity.y -= 0.5; // 重力
                
                particle.rotation.x += particle.rotationSpeed.x;
                particle.rotation.y += particle.rotationSpeed.y;
                particle.rotation.z += particle.rotationSpeed.z;
                
                particle.material.opacity = 1 - progress;
            });
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                particles.forEach(particle => {
                    this.game.scene.remove(particle);
                    particle.geometry.dispose();
                    particle.material.dispose();
                });
            }
        };
        
        animate();
    }
    
    createEpicLighting() {
        // ドラマチックな照明効果
        const light1 = new THREE.SpotLight(0xff0066, 2, 200, Math.PI / 4);
        light1.position.set(50, 100, 0);
        light1.target.position.set(0, 0, -150);
        
        const light2 = new THREE.SpotLight(0x0066ff, 2, 200, Math.PI / 4);
        light2.position.set(-50, 100, 0);
        light2.target.position.set(0, 0, 0);
        
        this.game.scene.add(light1);
        this.game.scene.add(light1.target);
        this.game.scene.add(light2);
        this.game.scene.add(light2.target);
        
        // フェードアウト
        setTimeout(() => {
            const fadeOut = () => {
                light1.intensity *= 0.95;
                light2.intensity *= 0.95;
                
                if (light1.intensity > 0.01) {
                    requestAnimationFrame(fadeOut);
                } else {
                    this.game.scene.remove(light1);
                    this.game.scene.remove(light1.target);
                    this.game.scene.remove(light2);
                    this.game.scene.remove(light2.target);
                }
            };
            fadeOut();
        }, 2000);
    }
    
    getTargetPosition(target) {
        if (target === 'player' && this.game.player) {
            return this.game.player.group.position.clone();
        } else if (target === 'boss' && this.game.currentBoss) {
            return this.game.currentBoss.group.position.clone();
        }
        return new THREE.Vector3(0, 0, 0);
    }
    
    easeInOut(t) {
        return t < 0.5 ? 
            2 * t * t : 
            -1 + (4 - 2 * t) * t;
    }
    
    skip() {
        this.end();
    }
    
    end() {
        this.isPlaying = false;
        
        // レターボックスを非表示
        this.letterbox.style.display = 'none';
        
        // ゲームを再開
        this.game.isPaused = false;
        
        // 字幕をクリア
        this.subtitleArea.textContent = '';
        this.subtitleArea.style.opacity = '0';
        
        // BGMを再開
        if (this.game.soundManager) {
            this.game.soundManager.resumeBGM();
        }
        
        // コールバック実行
        if (this.onCompleteCallback) {
            this.onCompleteCallback();
        }
    }
    
    update(delta) {
        // カットシーン中はカットシーンカメラを使用
        if (this.isPlaying) {
            this.game.renderer.render(this.game.scene, this.cutsceneCamera);
            return true; // メインのレンダリングをスキップ
        }
        return false;
    }
}