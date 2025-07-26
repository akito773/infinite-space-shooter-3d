// 3D発射シーケンスシステム

import * as THREE from 'three';

export class LaunchSequence3D {
    constructor(game) {
        this.game = game;
        this.scene = game.scene;
        this.camera = game.camera;
        this.isActive = false;
        
        // シーケンス用の要素
        this.earth = null;
        this.atmosphere = null;
        this.clouds = [];
        this.stars = null;
        this.launchEffects = [];
        
        // カメラの初期位置を保存
        this.originalCameraPosition = null;
        this.originalCameraRotation = null;
        
        // シーケンスのフェーズ
        this.phase = 'ground'; // ground, launch, ascent, space
        this.phaseTime = 0;
    }
    
    start(onComplete) {
        this.isActive = true;
        this.onComplete = onComplete;
        this.phase = 'ground';
        this.phaseTime = 0;
        
        // 既存の要素を一時的に非表示
        this.hideGameElements();
        
        // カメラ位置を保存
        this.originalCameraPosition = this.camera.position.clone();
        this.originalCameraRotation = this.camera.rotation.clone();
        
        // シーンをセットアップ
        this.setupScene();
        
        // BGM変更
        if (this.game.soundManager) {
            this.game.soundManager.play('launch_sequence');
        }
    }
    
    setupScene() {
        // 地球を作成（大きなスフィア）
        this.createEarth();
        
        // 大気圏
        this.createAtmosphere();
        
        // 雲レイヤー
        this.createClouds();
        
        // 宇宙の星々（最初は見えない）
        this.createStarfield();
        
        // 発射台と施設
        this.createLaunchPad();
        
        // プレイヤーの機体を地上に配置
        this.positionPlayerShip();
        
        // カメラを初期位置に
        this.setupInitialCamera();
        
        // ライティング調整
        this.setupLighting();
    }
    
    createEarth() {
        // 地球の球体（半径1000）
        const earthGeometry = new THREE.SphereGeometry(1000, 64, 64);
        
        // 地球のテクスチャ（プロシージャル）
        const canvas = document.createElement('canvas');
        canvas.width = 1024;
        canvas.height = 512;
        const ctx = canvas.getContext('2d');
        
        // 海
        ctx.fillStyle = '#006994';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // 大陸（簡易的）
        ctx.fillStyle = '#228B22';
        // アメリカ大陸
        ctx.beginPath();
        ctx.ellipse(200, 256, 80, 120, -0.3, 0, Math.PI * 2);
        ctx.fill();
        
        // ユーラシア大陸
        ctx.beginPath();
        ctx.ellipse(600, 200, 150, 100, 0.2, 0, Math.PI * 2);
        ctx.fill();
        
        // アフリカ大陸
        ctx.beginPath();
        ctx.ellipse(550, 350, 60, 100, 0, 0, Math.PI * 2);
        ctx.fill();
        
        const earthTexture = new THREE.CanvasTexture(canvas);
        
        const earthMaterial = new THREE.MeshPhongMaterial({
            map: earthTexture,
            bumpScale: 5,
            specular: new THREE.Color(0x333333),
            shininess: 5
        });
        
        this.earth = new THREE.Mesh(earthGeometry, earthMaterial);
        this.earth.position.y = -1000; // 地面が0になるように
        this.earth.rotation.y = Math.PI; // 発射地点を調整
        this.scene.add(this.earth);
    }
    
    createAtmosphere() {
        // 大気圏（半透明の球体）
        const atmosphereGeometry = new THREE.SphereGeometry(1100, 32, 32);
        const atmosphereMaterial = new THREE.ShaderMaterial({
            uniforms: {
                c: { value: 0.5 },
                p: { value: 4.5 }
            },
            vertexShader: `
                varying vec3 vNormal;
                void main() {
                    vNormal = normalize(normalMatrix * normal);
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                uniform float c;
                uniform float p;
                varying vec3 vNormal;
                void main() {
                    float intensity = pow(c - dot(vNormal, vec3(0, 0, 1.0)), p);
                    gl_FragColor = vec4(0.3, 0.6, 1.0, 1.0) * intensity;
                }
            `,
            side: THREE.BackSide,
            blending: THREE.AdditiveBlending,
            transparent: true
        });
        
        this.atmosphere = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial);
        this.atmosphere.position.copy(this.earth.position);
        this.scene.add(this.atmosphere);
    }
    
    createClouds() {
        // 複数の雲レイヤー
        for (let i = 0; i < 3; i++) {
            const cloudGeometry = new THREE.SphereGeometry(1020 + i * 10, 32, 32);
            const cloudTexture = this.generateCloudTexture();
            
            const cloudMaterial = new THREE.MeshBasicMaterial({
                map: cloudTexture,
                transparent: true,
                opacity: 0.4 - i * 0.1,
                blending: THREE.AdditiveBlending
            });
            
            const cloudLayer = new THREE.Mesh(cloudGeometry, cloudMaterial);
            cloudLayer.position.copy(this.earth.position);
            cloudLayer.rotation.y = Math.random() * Math.PI * 2;
            
            this.clouds.push(cloudLayer);
            this.scene.add(cloudLayer);
        }
    }
    
    generateCloudTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 256;
        const ctx = canvas.getContext('2d');
        
        // ノイズパターンで雲を生成
        ctx.fillStyle = 'rgba(255, 255, 255, 0)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // 雲のパッチを追加
        for (let i = 0; i < 50; i++) {
            const x = Math.random() * canvas.width;
            const y = Math.random() * canvas.height;
            const radius = Math.random() * 30 + 10;
            
            const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
            gradient.addColorStop(0, 'rgba(255, 255, 255, 0.8)');
            gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
            
            ctx.fillStyle = gradient;
            ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2);
        }
        
        return new THREE.CanvasTexture(canvas);
    }
    
    createStarfield() {
        // 宇宙の星々
        const starsGeometry = new THREE.BufferGeometry();
        const starCount = 10000;
        const positions = new Float32Array(starCount * 3);
        const colors = new Float32Array(starCount * 3);
        
        for (let i = 0; i < starCount; i++) {
            const radius = 2000 + Math.random() * 3000;
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.random() * Math.PI;
            
            positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
            positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
            positions[i * 3 + 2] = radius * Math.cos(phi);
            
            // 星の色（白～青～黄色）
            const colorChoice = Math.random();
            if (colorChoice < 0.7) {
                colors[i * 3] = 1;
                colors[i * 3 + 1] = 1;
                colors[i * 3 + 2] = 1;
            } else if (colorChoice < 0.9) {
                colors[i * 3] = 0.8;
                colors[i * 3 + 1] = 0.8;
                colors[i * 3 + 2] = 1;
            } else {
                colors[i * 3] = 1;
                colors[i * 3 + 1] = 1;
                colors[i * 3 + 2] = 0.8;
            }
        }
        
        starsGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        starsGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        
        const starsMaterial = new THREE.PointsMaterial({
            size: 2,
            vertexColors: true,
            transparent: true,
            opacity: 0 // 最初は見えない
        });
        
        this.stars = new THREE.Points(starsGeometry, starsMaterial);
        this.scene.add(this.stars);
    }
    
    createLaunchPad() {
        // 発射台
        const padGeometry = new THREE.CylinderGeometry(10, 15, 5, 8);
        const padMaterial = new THREE.MeshPhongMaterial({
            color: 0x444444,
            metalness: 0.8,
            roughness: 0.2
        });
        
        const launchPad = new THREE.Mesh(padGeometry, padMaterial);
        launchPad.position.set(0, 2.5, 0);
        this.scene.add(launchPad);
        
        // 発射塔
        const towerGeometry = new THREE.BoxGeometry(3, 30, 3);
        const towerMaterial = new THREE.MeshPhongMaterial({
            color: 0x666666,
            metalness: 0.7,
            roughness: 0.3
        });
        
        for (let i = 0; i < 4; i++) {
            const tower = new THREE.Mesh(towerGeometry, towerMaterial);
            const angle = (i / 4) * Math.PI * 2;
            tower.position.set(
                Math.cos(angle) * 20,
                15,
                Math.sin(angle) * 20
            );
            this.scene.add(tower);
        }
        
        // 地面のライト（発射台周辺）
        for (let i = 0; i < 8; i++) {
            const light = new THREE.PointLight(0xffaa00, 1, 30);
            const angle = (i / 8) * Math.PI * 2;
            light.position.set(
                Math.cos(angle) * 30,
                1,
                Math.sin(angle) * 30
            );
            this.scene.add(light);
            this.launchEffects.push(light);
        }
    }
    
    positionPlayerShip() {
        // プレイヤーの機体を発射台に配置
        if (this.game.player) {
            this.game.player.group.position.set(0, 10, 0);
            this.game.player.group.rotation.set(-Math.PI / 2, 0, 0); // 上向き
        }
    }
    
    setupInitialCamera() {
        // カメラを機体の横から見る位置に
        this.camera.position.set(50, 20, 50);
        this.camera.lookAt(0, 10, 0);
        
        // FOVを調整
        this.camera.fov = 60;
        this.camera.updateProjectionMatrix();
    }
    
    setupLighting() {
        // 太陽光（強い指向性ライト）
        const sunLight = new THREE.DirectionalLight(0xffffff, 2);
        sunLight.position.set(1000, 1000, 0);
        sunLight.target.position.set(0, 0, 0);
        this.scene.add(sunLight);
        this.scene.add(sunLight.target);
        
        // 環境光
        const ambientLight = new THREE.AmbientLight(0x404040, 0.5);
        this.scene.add(ambientLight);
        
        // 地球からの反射光
        const earthLight = new THREE.HemisphereLight(0x87CEEB, 0x228B22, 0.3);
        this.scene.add(earthLight);
    }
    
    hideGameElements() {
        // 既存のゲーム要素を一時的に非表示
        this.game.enemies.forEach(enemy => {
            if (enemy.group) enemy.group.visible = false;
        });
        
        this.game.planets.forEach(planet => {
            if (planet.mesh) planet.mesh.visible = false;
        });
        
        this.game.stations.forEach(station => {
            if (station.mesh) station.mesh.visible = false;
        });
        
        // UIも非表示
        if (this.game.minimap) {
            this.game.minimap.container.style.display = 'none';
        }
    }
    
    update(delta) {
        if (!this.isActive) return;
        
        this.phaseTime += delta;
        
        // 地球と雲の回転
        if (this.earth) {
            this.earth.rotation.y += delta * 0.01;
        }
        
        this.clouds.forEach((cloud, i) => {
            cloud.rotation.y += delta * (0.02 + i * 0.01);
        });
        
        // フェーズごとの処理
        switch (this.phase) {
            case 'ground':
                this.updateGroundPhase(delta);
                break;
            case 'launch':
                this.updateLaunchPhase(delta);
                break;
            case 'ascent':
                this.updateAscentPhase(delta);
                break;
            case 'space':
                this.updateSpacePhase(delta);
                break;
        }
    }
    
    updateGroundPhase(delta) {
        // カウントダウン（3秒）
        if (this.phaseTime < 3) {
            // カメラを少しずつズームイン
            this.camera.position.x = 50 - this.phaseTime * 5;
            this.camera.position.z = 50 - this.phaseTime * 5;
            this.camera.lookAt(0, 10, 0);
            
            // エンジン点火エフェクト
            if (this.phaseTime > 2) {
                this.createEngineFlame();
            }
        } else {
            // 発射フェーズへ
            this.phase = 'launch';
            this.phaseTime = 0;
            
            // 発射音
            if (this.game.soundManager) {
                this.game.soundManager.play('rocket_launch');
            }
        }
    }
    
    updateLaunchPhase(delta) {
        const player = this.game.player;
        if (!player) return;
        
        // 機体を上昇させる（加速）
        const acceleration = 10 + this.phaseTime * 5;
        player.group.position.y += acceleration * delta;
        
        // カメラが追従
        this.camera.position.y += acceleration * delta;
        this.camera.lookAt(player.group.position);
        
        // エンジンエフェクト強化
        this.updateEngineEffects(Math.min(this.phaseTime / 3, 1));
        
        // 高度が100を超えたら上昇フェーズへ
        if (player.group.position.y > 100) {
            this.phase = 'ascent';
            this.phaseTime = 0;
        }
    }
    
    updateAscentPhase(delta) {
        const player = this.game.player;
        if (!player) return;
        
        // 継続的な上昇
        const speed = 100 + this.phaseTime * 10;
        player.group.position.y += speed * delta;
        
        // カメラの動的な動き
        const cameraRadius = 50 + this.phaseTime * 5;
        const cameraAngle = this.phaseTime * 0.5;
        this.camera.position.x = Math.cos(cameraAngle) * cameraRadius;
        this.camera.position.z = Math.sin(cameraAngle) * cameraRadius;
        this.camera.position.y = player.group.position.y - 20;
        this.camera.lookAt(player.group.position);
        
        // 高度による効果
        const altitude = player.group.position.y;
        
        // 空が暗くなる
        const skyDarkness = Math.min(altitude / 1000, 1);
        this.scene.fog.color.setRGB(
            0.5 * (1 - skyDarkness),
            0.7 * (1 - skyDarkness),
            1.0 * (1 - skyDarkness)
        );
        
        // 星が見え始める
        if (this.stars) {
            this.stars.material.opacity = skyDarkness * 0.8;
        }
        
        // 大気圏を抜ける（高度1000）
        if (altitude > 1000) {
            this.phase = 'space';
            this.phaseTime = 0;
            
            // 宇宙到達エフェクト
            this.createSpaceTransitionEffect();
        }
    }
    
    updateSpacePhase(delta) {
        const player = this.game.player;
        if (!player) return;
        
        // ゆっくりと減速
        const speed = Math.max(50 - this.phaseTime * 10, 10);
        player.group.position.y += speed * delta;
        
        // 機体を前向きに戻す
        player.group.rotation.x += (0 - player.group.rotation.x) * delta;
        
        // カメラを最終位置へ
        const targetCameraPos = new THREE.Vector3(0, 10, 30);
        this.camera.position.lerp(targetCameraPos, delta);
        this.camera.lookAt(player.group.position);
        
        // 3秒後に完了
        if (this.phaseTime > 3) {
            this.complete();
        }
    }
    
    createEngineFlame() {
        const player = this.game.player;
        if (!player) return;
        
        // 炎のパーティクル
        const flameGeometry = new THREE.ConeGeometry(2, 10, 8);
        const flameMaterial = new THREE.MeshBasicMaterial({
            color: 0xff6600,
            transparent: true,
            opacity: 0.8
        });
        
        const flame = new THREE.Mesh(flameGeometry, flameMaterial);
        flame.position.set(0, -5, 0);
        flame.rotation.x = Math.PI;
        player.group.add(flame);
        
        // 煙のパーティクル
        this.createSmokeParticles();
    }
    
    createSmokeParticles() {
        const particleCount = 100;
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        const opacities = new Float32Array(particleCount);
        
        for (let i = 0; i < particleCount; i++) {
            positions[i * 3] = (Math.random() - 0.5) * 50;
            positions[i * 3 + 1] = -Math.random() * 20;
            positions[i * 3 + 2] = (Math.random() - 0.5) * 50;
            opacities[i] = Math.random();
        }
        
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('opacity', new THREE.BufferAttribute(opacities, 1));
        
        const material = new THREE.PointsMaterial({
            size: 5,
            color: 0xaaaaaa,
            transparent: true,
            opacity: 0.6,
            blending: THREE.AdditiveBlending
        });
        
        const smoke = new THREE.Points(geometry, material);
        smoke.position.y = 0;
        this.scene.add(smoke);
        
        // 煙のアニメーション
        const animateSmoke = () => {
            const positions = smoke.geometry.attributes.position.array;
            for (let i = 0; i < particleCount; i++) {
                positions[i * 3 + 1] += 0.5; // 上昇
                positions[i * 3] += (Math.random() - 0.5) * 0.5; // 拡散
                positions[i * 3 + 2] += (Math.random() - 0.5) * 0.5;
                
                // リセット
                if (positions[i * 3 + 1] > 50) {
                    positions[i * 3 + 1] = -Math.random() * 20;
                }
            }
            smoke.geometry.attributes.position.needsUpdate = true;
            
            if (this.isActive) {
                requestAnimationFrame(animateSmoke);
            }
        };
        animateSmoke();
    }
    
    updateEngineEffects(intensity) {
        // 発射台のライトを明滅させる
        this.launchEffects.forEach((light, i) => {
            light.intensity = 1 + Math.sin(Date.now() * 0.01 + i) * intensity * 2;
            light.color.setHSL(0.1 * (1 - intensity * 0.5), 1, 0.5);
        });
    }
    
    createSpaceTransitionEffect() {
        // 画面全体に白いフラッシュ
        const flash = document.createElement('div');
        flash.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: white;
            opacity: 0;
            pointer-events: none;
            z-index: 10000;
        `;
        document.body.appendChild(flash);
        
        // フラッシュアニメーション
        flash.style.transition = 'opacity 0.3s';
        flash.style.opacity = '0.8';
        
        setTimeout(() => {
            flash.style.opacity = '0';
            setTimeout(() => flash.remove(), 300);
        }, 100);
        
        // サウンド
        if (this.game.soundManager) {
            this.game.soundManager.play('space_transition');
        }
    }
    
    complete() {
        this.isActive = false;
        
        // シーンをクリーンアップ
        this.cleanup();
        
        // カメラを元の位置に
        this.camera.position.copy(this.originalCameraPosition);
        this.camera.rotation.copy(this.originalCameraRotation);
        this.camera.fov = 75;
        this.camera.updateProjectionMatrix();
        
        // ゲーム要素を再表示
        this.showGameElements();
        
        // プレイヤーを正しい位置に
        if (this.game.player) {
            this.game.player.group.position.set(0, 0, 0);
            this.game.player.group.rotation.set(0, 0, 0);
        }
        
        // 完了コールバック
        if (this.onComplete) {
            this.onComplete();
        }
    }
    
    cleanup() {
        // 作成した要素を削除
        if (this.earth) {
            this.scene.remove(this.earth);
            this.earth.geometry.dispose();
            this.earth.material.dispose();
        }
        
        if (this.atmosphere) {
            this.scene.remove(this.atmosphere);
            this.atmosphere.geometry.dispose();
            this.atmosphere.material.dispose();
        }
        
        this.clouds.forEach(cloud => {
            this.scene.remove(cloud);
            cloud.geometry.dispose();
            cloud.material.map.dispose();
            cloud.material.dispose();
        });
        
        if (this.stars) {
            this.scene.remove(this.stars);
            this.stars.geometry.dispose();
            this.stars.material.dispose();
        }
        
        this.launchEffects.forEach(effect => {
            this.scene.remove(effect);
        });
        
        // 配列をクリア
        this.clouds = [];
        this.launchEffects = [];
    }
    
    showGameElements() {
        // ゲーム要素を再表示
        this.game.enemies.forEach(enemy => {
            if (enemy.group) enemy.group.visible = true;
        });
        
        this.game.planets.forEach(planet => {
            if (planet.mesh) planet.mesh.visible = true;
        });
        
        this.game.stations.forEach(station => {
            if (station.mesh) station.mesh.visible = true;
        });
        
        // UIも再表示
        if (this.game.minimap) {
            this.game.minimap.container.style.display = 'block';
        }
    }
}