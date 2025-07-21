// 地下シーン - 2.5D探索エリア

import * as THREE from 'three';

export class UndergroundScene extends THREE.Scene {
    constructor(game) {
        super();
        this.game = game;
        
        // シーン設定
        this.background = new THREE.Color(0x1a1a2e);
        this.fog = new THREE.Fog(0x1a1a2e, 20, 80);
        
        // 地下エリア設定
        this.width = 200;
        this.height = 50;
        this.depth = 20;
        this.layerCount = 5;
        
        // プレイヤー
        this.player = null;
        this.playerPosition = { x: 0, y: 0, layer: 0 };
        this.playerSpeed = 8;
        
        // プレイヤーの体力
        this.maxHealth = 100;
        this.playerHealth = 100;
        this.healthDisplay = null;
        
        // 移動制御
        this.moveLeft = false;
        this.moveRight = false;
        this.isClimbing = false;
        
        // ジャンプと重力
        this.isJumping = false;
        this.velocityY = 0;
        this.gravity = -25;
        this.jumpPower = 12;
        this.onGround = false;
        this.groundY = 0;
        
        // 採掘システム
        this.miningRange = 5; // 採掘範囲
        this.miningPower = 1; // 採掘力
        this.isDigging = false;
        this.digBlocks = []; // 掘削可能なブロック
        
        // カメラ設定（2D横スクロール用）
        this.cameraOffset = new THREE.Vector3(0, 3, 20);
        this.cameraLerpSpeed = 0.1;
        
        // 地下要素
        this.tunnels = [];
        this.resources = [];
        this.hazards = [];
        this.platforms = [];
        
        // 収集可能フラグ
        this.canCollect = true;
        
        // レイヤー構造
        this.undergroundLayers = [];
        
        this.init();
    }
    
    init() {
        console.log('UndergroundScene init start');
        this.setupLighting();
        this.createLayers();
        this.createPlayer();
        this.generateUndergroundStructure();
        this.generateDiggableBlocks();
        this.setupCamera();
        this.setupMining();
        console.log('UndergroundScene init complete, children:', this.children.length);
    }
    
    setupLighting() {
        // 薄暗い環境光
        const ambientLight = new THREE.AmbientLight(0x404080, 0.3);
        this.add(ambientLight);
        
        // プレイヤーの明かり
        this.playerLight = new THREE.PointLight(0xffa500, 1, 15);
        this.playerLight.position.set(0, 10, 0);
        this.add(this.playerLight);
        
        // 地下の雰囲気を出すライト
        for (let i = 0; i < 5; i++) {
            const crystalLight = new THREE.PointLight(0x00ffff, 0.5, 20);
            crystalLight.position.set(
                (Math.random() - 0.5) * this.width,
                Math.random() * this.height,
                (Math.random() - 0.5) * this.depth
            );
            this.add(crystalLight);
        }
    }
    
    createLayers() {
        for (let layer = 0; layer < this.layerCount; layer++) {
            const layerGroup = new THREE.Group();
            layerGroup.position.y = -layer * 10;
            layerGroup.userData = { layer: layer };
            
            this.undergroundLayers.push(layerGroup);
            this.add(layerGroup);
        }
    }
    
    createPlayer() {
        // 地下用プレイヤー（より小さく、ライト付き）
        this.player = new THREE.Group();
        
        // プレイヤーの体（2.5D用に平面的）
        const bodyGeometry = new THREE.CapsuleGeometry(0.3, 1, 3, 8);
        const bodyMaterial = new THREE.MeshStandardMaterial({
            color: 0x4169E1,
            metalness: 0.3,
            roughness: 0.7
        });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.position.y = 0.8;
        
        // ヘッドライト
        const headlight = new THREE.SpotLight(0xffffff, 1, 20, Math.PI / 6);
        headlight.position.set(0, 1.5, 0);
        
        // ヘッドライトのターゲット（Object3D）
        const headlightTarget = new THREE.Object3D();
        headlightTarget.position.set(0, 0, -5);
        headlight.target = headlightTarget;
        
        // 装備
        const equipmentGeometry = new THREE.BoxGeometry(0.4, 0.6, 0.2);
        const equipmentMaterial = new THREE.MeshStandardMaterial({
            color: 0x666666,
            metalness: 0.8
        });
        const equipment = new THREE.Mesh(equipmentGeometry, equipmentMaterial);
        equipment.position.set(-0.25, 0.8, 0);
        
        this.player.add(body);
        this.player.add(headlight);
        this.player.add(headlightTarget);
        this.player.add(equipment);
        
        // 初期位置
        this.player.position.set(0, 0, 0);
        this.player.visible = false;
        this.add(this.player);
    }
    
    generateUndergroundStructure() {
        // 各レイヤーに構造を生成
        for (let layer = 0; layer < this.layerCount; layer++) {
            this.generateLayerStructure(layer);
        }
        
        // 垂直接続（エレベーターシャフト、はしごなど）
        this.createVerticalConnections();
    }
    
    generateLayerStructure(layerIndex) {
        const layerGroup = this.undergroundLayers[layerIndex];
        const yPos = -layerIndex * 10;
        
        // メイントンネル（水平）
        this.createMainTunnel(layerGroup, yPos, layerIndex);
        
        // サブトンネル
        this.createSubTunnels(layerGroup, yPos, layerIndex);
        
        // プラットフォーム
        this.createPlatforms(layerGroup, yPos, layerIndex);
        
        // リソースノード
        this.createUndergroundResources(layerGroup, yPos, layerIndex);
        
        // ハザード（毒ガス、落石など）
        this.createHazards(layerGroup, yPos, layerIndex);
        
        // 装飾要素
        this.createLayerDecorations(layerGroup, yPos, layerIndex);
    }
    
    createMainTunnel(layerGroup, yPos, layerIndex) {
        // メイントンネルの床
        const floorGeometry = new THREE.PlaneGeometry(this.width, 2);
        const floorMaterial = new THREE.MeshStandardMaterial({
            color: 0x3a3a3a,
            roughness: 0.9
        });
        const floor = new THREE.Mesh(floorGeometry, floorMaterial);
        floor.rotation.x = -Math.PI / 2;
        floor.position.y = yPos;
        floor.receiveShadow = true;
        
        layerGroup.add(floor);
        
        // トンネルの壁
        for (let side = -1; side <= 1; side += 2) {
            const wallGeometry = new THREE.PlaneGeometry(this.width, 4);
            const wallMaterial = new THREE.MeshStandardMaterial({
                color: 0x2a2a2a,
                roughness: 0.9
            });
            const wall = new THREE.Mesh(wallGeometry, wallMaterial);
            wall.position.set(0, yPos + 2, side * 1);
            wall.rotation.x = side > 0 ? Math.PI / 2 : -Math.PI / 2;
            
            layerGroup.add(wall);
        }
        
        // 天井
        const ceilingGeometry = new THREE.PlaneGeometry(this.width, 2);
        const ceilingMaterial = new THREE.MeshStandardMaterial({
            color: 0x1a1a1a,
            roughness: 0.9
        });
        const ceiling = new THREE.Mesh(ceilingGeometry, ceilingMaterial);
        ceiling.rotation.x = Math.PI / 2;
        ceiling.position.y = yPos + 4;
        
        layerGroup.add(ceiling);
    }
    
    createSubTunnels(layerGroup, yPos, layerIndex) {
        // サブトンネルをランダムに生成
        const tunnelCount = 3 + Math.floor(Math.random() * 3);
        
        for (let i = 0; i < tunnelCount; i++) {
            const tunnelLength = 20 + Math.random() * 30;
            const tunnelX = (Math.random() - 0.5) * (this.width - 20);
            
            // サブトンネルの床
            const subFloorGeometry = new THREE.PlaneGeometry(tunnelLength, 1.5);
            const subFloorMaterial = new THREE.MeshStandardMaterial({
                color: 0x2a2a2a,
                roughness: 0.9
            });
            const subFloor = new THREE.Mesh(subFloorGeometry, subFloorMaterial);
            subFloor.rotation.x = -Math.PI / 2;
            subFloor.rotation.y = Math.random() * Math.PI / 4 - Math.PI / 8;
            subFloor.position.set(tunnelX, yPos, (Math.random() - 0.5) * 8);
            
            layerGroup.add(subFloor);
        }
    }
    
    createPlatforms(layerGroup, yPos, layerIndex) {
        // 2D横スクロール用のプラットフォーム配置
        const platformCount = 8 + Math.floor(Math.random() * 5);
        let lastX = -this.width / 2 + 10;
        
        for (let i = 0; i < platformCount; i++) {
            const width = 4 + Math.random() * 4;
            const height = 0.5;
            const platformGeometry = new THREE.BoxGeometry(width, height, 2);
            const platformMaterial = new THREE.MeshStandardMaterial({
                color: 0x654321,
                metalness: 0.2,
                roughness: 0.8
            });
            const platform = new THREE.Mesh(platformGeometry, platformMaterial);
            
            // 横方向に段階的に配置、高さはジャンプで届く範囲でランダム
            const xGap = 8 + Math.random() * 6; // ジャンプで届く距離
            const heightVariation = Math.random() * 4 - 1; // 高さの変化
            
            platform.position.set(
                lastX + xGap,
                yPos + 2 + heightVariation,
                0 // Z軸は0で固定（2D横スクロール）
            );
            
            lastX = platform.position.x;
            
            platform.castShadow = true;
            platform.receiveShadow = true;
            platform.userData = { 
                type: 'platform',
                layer: layerIndex,
                width: width,
                height: height
            };
            
            layerGroup.add(platform);
            this.platforms.push(platform);
            
            // 最後まで行ったら終了
            if (lastX > this.width / 2 - 20) break;
        }
    }
    
    createUndergroundResources(layerGroup, yPos, layerIndex) {
        // 地下リソース（より価値の高いもの）
        const resourceTypes = [
            { type: 'crystal', color: 0x00ffff, value: 50 },
            { type: 'rare_metal', color: 0xffd700, value: 30 },
            { type: 'energy_core', color: 0xff00ff, value: 100 }
        ];
        
        const resourceCount = 3 + Math.floor(Math.random() * 5);
        
        for (let i = 0; i < resourceCount; i++) {
            const resourceType = resourceTypes[Math.floor(Math.random() * resourceTypes.length)];
            
            let geometry;
            if (resourceType.type === 'crystal') {
                geometry = new THREE.OctahedronGeometry(0.8);
            } else if (resourceType.type === 'energy_core') {
                geometry = new THREE.SphereGeometry(0.6);
            } else {
                geometry = new THREE.DodecahedronGeometry(0.7);
            }
            
            const material = new THREE.MeshStandardMaterial({
                color: resourceType.color,
                emissive: resourceType.color,
                emissiveIntensity: 0.3,
                metalness: 0.8,
                roughness: 0.2
            });
            
            const resource = new THREE.Mesh(geometry, material);
            resource.position.set(
                (Math.random() - 0.5) * this.width * 0.8,
                yPos + 0.5,
                (Math.random() - 0.5) * this.depth * 0.8
            );
            
            resource.userData = {
                type: 'underground_resource',
                resourceType: resourceType.type,
                value: resourceType.value,
                layer: layerIndex
            };
            
            // 光る効果
            const light = new THREE.PointLight(resourceType.color, 0.5, 8);
            light.position.copy(resource.position);
            light.position.y += 1;
            
            layerGroup.add(resource);
            layerGroup.add(light);
            this.resources.push(resource);
        }
    }
    
    createHazards(layerGroup, yPos, layerIndex) {
        // 地下のハザード
        const hazardCount = Math.floor(Math.random() * 3);
        
        for (let i = 0; i < hazardCount; i++) {
            // 毒ガス雲
            const gasGeometry = new THREE.SphereGeometry(3, 8, 8);
            const gasMaterial = new THREE.MeshBasicMaterial({
                color: 0x90ee90,
                transparent: true,
                opacity: 0.3
            });
            const gas = new THREE.Mesh(gasGeometry, gasMaterial);
            
            gas.position.set(
                (Math.random() - 0.5) * this.width * 0.6,
                yPos + 2,
                (Math.random() - 0.5) * this.depth * 0.6
            );
            
            gas.userData = {
                type: 'hazard',
                hazardType: 'poison_gas',
                damage: 10
            };
            
            layerGroup.add(gas);
            this.hazards.push(gas);
        }
    }
    
    createLayerDecorations(layerGroup, yPos, layerIndex) {
        // 地下の装飾要素
        
        // 鍾乳石
        for (let i = 0; i < 8; i++) {
            const stalactiteGeometry = new THREE.ConeGeometry(0.3, 2 + Math.random() * 2, 6);
            const stalactiteMaterial = new THREE.MeshStandardMaterial({
                color: 0x696969,
                roughness: 0.9
            });
            const stalactite = new THREE.Mesh(stalactiteGeometry, stalactiteMaterial);
            
            stalactite.position.set(
                (Math.random() - 0.5) * this.width * 0.8,
                yPos + 4,
                (Math.random() - 0.5) * this.depth * 0.8
            );
            stalactite.rotation.x = Math.PI;
            
            layerGroup.add(stalactite);
        }
        
        // 石筍
        for (let i = 0; i < 6; i++) {
            const stalagmiteGeometry = new THREE.ConeGeometry(0.4, 1.5 + Math.random() * 1.5, 6);
            const stalagmiteMaterial = new THREE.MeshStandardMaterial({
                color: 0x708090,
                roughness: 0.9
            });
            const stalagmite = new THREE.Mesh(stalagmiteGeometry, stalagmiteMaterial);
            
            stalagmite.position.set(
                (Math.random() - 0.5) * this.width * 0.8,
                yPos,
                (Math.random() - 0.5) * this.depth * 0.8
            );
            
            layerGroup.add(stalagmite);
        }
    }
    
    createVerticalConnections() {
        // レイヤー間の接続（はしご、エレベーター等）
        for (let layer = 0; layer < this.layerCount - 1; layer++) {
            // はしご
            const ladderGeometry = new THREE.BoxGeometry(0.1, 10, 0.5);
            const ladderMaterial = new THREE.MeshStandardMaterial({
                color: 0x8b4513,
                metalness: 0.1,
                roughness: 0.8
            });
            const ladder = new THREE.Mesh(ladderGeometry, ladderMaterial);
            
            ladder.position.set(
                (Math.random() - 0.5) * this.width * 0.5,
                -layer * 10 - 5,
                0
            );
            
            ladder.userData = {
                type: 'ladder',
                connectsLayers: [layer, layer + 1]
            };
            
            this.add(ladder);
        }
    }
    
    setupCamera() {
        if (!this.game.camera) return;
        
        // 2.5D用カメラ設定
        this.game.camera.position.set(0, 5, 15);
        this.game.camera.lookAt(0, 0, 0);
    }
    
    // プレイヤー制御
    enterUnderground() {
        this.player.visible = true;
        this.playerPosition = { x: -this.width / 2 + 10, y: 0, layer: 0 };
        this.velocityY = 0;
        this.onGround = true;
        this.isJumping = false;
        this.updatePlayerPosition();
        
        // 体力をリセット
        this.playerHealth = this.maxHealth;
        
        // 体力表示を作成
        this.createHealthDisplay();
        this.updateHealthDisplay();
        
        console.log('地下エリアに入りました');
    }
    
    createHealthDisplay() {
        if (!this.healthDisplay) {
            this.healthDisplay = document.createElement('div');
            this.healthDisplay.style.position = 'fixed';
            this.healthDisplay.style.bottom = '20px';
            this.healthDisplay.style.left = '20px';
            this.healthDisplay.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
            this.healthDisplay.style.color = '#44ff44';
            this.healthDisplay.style.padding = '10px 20px';
            this.healthDisplay.style.borderRadius = '5px';
            this.healthDisplay.style.border = '2px solid #44ff44';
            this.healthDisplay.style.fontSize = '20px';
            this.healthDisplay.style.fontWeight = 'bold';
            this.healthDisplay.style.zIndex = '1000';
            document.body.appendChild(this.healthDisplay);
        }
    }
    
    exitUnderground() {
        this.player.visible = false;
        
        // 移動フラグをリセット
        this.moveLeft = false;
        this.moveRight = false;
        this.isClimbing = false;
        
        // 体力表示を削除
        if (this.healthDisplay) {
            document.body.removeChild(this.healthDisplay);
            this.healthDisplay = null;
        }
        
        console.log('地下エリアから出ました');
    }
    
    updatePlayerPosition() {
        const layerY = -this.playerPosition.layer * 10;
        this.player.position.set(this.playerPosition.x, layerY + this.playerPosition.y + 1, 0);
        
        // プレイヤーライトを追従
        this.playerLight.position.copy(this.player.position);
        this.playerLight.position.y += 2;
    }
    
    checkGroundCollision() {
        // 現在のレイヤーの地面の高さ（各レイヤーの基準高さ）
        const currentGroundY = 0;
        
        // プラットフォームとの当たり判定
        let onPlatform = false;
        for (const platform of this.platforms) {
            if (platform.userData.layer === this.playerPosition.layer) {
                const platLeft = platform.position.x - platform.geometry.parameters.width / 2;
                const platRight = platform.position.x + platform.geometry.parameters.width / 2;
                const platTop = platform.position.y + platform.geometry.parameters.height / 2;
                
                // プレイヤーがプラットフォーム上にいるかチェック
                if (this.playerPosition.x >= platLeft && 
                    this.playerPosition.x <= platRight &&
                    this.playerPosition.y <= platTop + 0.5 &&
                    this.playerPosition.y >= platTop - 0.5 &&
                    this.velocityY <= 0) {
                    
                    this.playerPosition.y = platTop;
                    this.velocityY = 0;
                    this.onGround = true;
                    this.isJumping = false;
                    onPlatform = true;
                    break;
                }
            }
        }
        
        // プラットフォーム上にいない場合、地面との判定
        if (!onPlatform && this.playerPosition.y <= currentGroundY) {
            this.playerPosition.y = currentGroundY;
            this.velocityY = 0;
            this.onGround = true;
            this.isJumping = false;
        }
    }
    
    checkLayerTransition() {
        // 特定の場所（はしごや穴）でのレイヤー移動をチェック
        // TODO: はしごや穴の実装
    }
    
    update(deltaTime) {
        // プレイヤー移動
        this.updatePlayerMovement(deltaTime);
        
        // カメラ更新
        this.updateCamera();
        
        // アニメーション
        this.updateAnimations(deltaTime);
        
        // ハザードとの衝突判定
        this.checkHazardCollisions();
        
        // リソース収集判定
        this.checkResourceCollection();
    }
    
    updatePlayerMovement(deltaTime) {
        if (!this.player.visible) return;
        
        const moveSpeed = this.playerSpeed * deltaTime;
        
        // 左右移動
        if (this.moveLeft) {
            this.playerPosition.x -= moveSpeed;
        }
        if (this.moveRight) {
            this.playerPosition.x += moveSpeed;
        }
        
        // 重力適用
        this.velocityY += this.gravity * deltaTime;
        this.playerPosition.y += this.velocityY * deltaTime;
        
        // 地面との当たり判定
        this.checkGroundCollision();
        
        // 境界チェック
        this.playerPosition.x = Math.max(-this.width / 2 + 2, Math.min(this.width / 2 - 2, this.playerPosition.x));
        
        this.updatePlayerPosition();
    }
    
    updateCamera() {
        if (!this.game.camera || !this.player.visible) return;
        
        // プレイヤーを追従するカメラ
        const targetPosition = this.player.position.clone().add(this.cameraOffset);
        this.game.camera.position.lerp(targetPosition, this.cameraLerpSpeed);
        
        const lookAtPoint = this.player.position.clone();
        this.game.camera.lookAt(lookAtPoint);
    }
    
    updateAnimations(deltaTime) {
        // リソースの回転アニメーション
        for (const resource of this.resources) {
            resource.rotation.y += deltaTime;
            resource.rotation.x += deltaTime * 0.5;
            
            // 浮遊効果
            const time = Date.now() * 0.001;
            resource.position.y += Math.sin(time + resource.position.x) * 0.01;
        }
        
        // ハザードのアニメーション
        for (const hazard of this.hazards) {
            if (hazard.userData.hazardType === 'poison_gas') {
                hazard.rotation.y += deltaTime * 0.5;
                hazard.material.opacity = 0.3 + Math.sin(Date.now() * 0.003) * 0.1;
            }
        }
    }
    
    checkHazardCollisions() {
        if (!this.player.visible) return;
        
        const hazardRange = 2.5; // ハザードの影響範囲
        const playerPos = this.player.position;
        
        // 現在のレイヤーのハザードをチェック
        for (const hazard of this.hazards) {
            // 同じレイヤーのハザードのみチェック
            if (hazard.userData.layer !== this.playerPosition.layer) continue;
            
            const distance = playerPos.distanceTo(hazard.position);
            
            if (distance < hazardRange) {
                // ハザードの影響を受ける
                this.applyHazardEffect(hazard);
            }
        }
    }
    
    applyHazardEffect(hazard) {
        const hazardData = hazard.userData;
        const now = Date.now();
        
        // クールダウンチェック（1秒に1回のダメージ）
        if (hazardData.lastDamageTime && now - hazardData.lastDamageTime < 1000) {
            return;
        }
        
        hazardData.lastDamageTime = now;
        
        switch(hazardData.hazardType) {
            case 'poison_gas':
                // 毒ガスダメージ
                if (this.playerHealth > 0) {
                    this.playerHealth -= 10;
                    this.showMessage('毒ガスでダメージを受けた！ (-10 HP)', 'error');
                    
                    // 画面エフェクト
                    this.playDamageEffect();
                    
                    // サウンド
                    if (this.game.systems.sound) {
                        this.game.systems.sound.play('error');
                    }
                    
                    // 体力が0になったら地上に戻る
                    if (this.playerHealth <= 0) {
                        this.showMessage('体力が尽きました。地上に戻ります...', 'error');
                        setTimeout(() => {
                            this.game.exitUnderground();
                        }, 1500);
                    }
                }
                break;
                
            case 'lava':
                // 溶岩ダメージ（より大きい）
                if (this.playerHealth > 0) {
                    this.playerHealth -= 20;
                    this.showMessage('溶岩でダメージを受けた！ (-20 HP)', 'error');
                    
                    // 画面エフェクト
                    this.playDamageEffect();
                    
                    // サウンド
                    if (this.game.systems.sound) {
                        this.game.systems.sound.play('error');
                    }
                    
                    if (this.playerHealth <= 0) {
                        this.showMessage('体力が尽きました。地上に戻ります...', 'error');
                        setTimeout(() => {
                            this.game.exitUnderground();
                        }, 1500);
                    }
                }
                break;
        }
        
        // UI更新
        this.updateHealthDisplay();
    }
    
    playDamageEffect() {
        // ダメージを受けた時の画面エフェクト
        const damageOverlay = document.createElement('div');
        damageOverlay.style.position = 'fixed';
        damageOverlay.style.top = '0';
        damageOverlay.style.left = '0';
        damageOverlay.style.width = '100%';
        damageOverlay.style.height = '100%';
        damageOverlay.style.backgroundColor = 'red';
        damageOverlay.style.opacity = '0.3';
        damageOverlay.style.pointerEvents = 'none';
        damageOverlay.style.zIndex = '9999';
        document.body.appendChild(damageOverlay);
        
        // フェードアウト
        let opacity = 0.3;
        const fadeOut = () => {
            opacity -= 0.05;
            if (opacity > 0) {
                damageOverlay.style.opacity = opacity.toString();
                requestAnimationFrame(fadeOut);
            } else {
                document.body.removeChild(damageOverlay);
            }
        };
        requestAnimationFrame(fadeOut);
    }
    
    updateHealthDisplay() {
        // 体力表示を更新（UIコンポーネントがある場合）
        if (this.healthDisplay) {
            this.healthDisplay.textContent = `HP: ${Math.max(0, this.playerHealth)} / ${this.maxHealth}`;
            
            // 体力が低い時は赤く表示
            if (this.playerHealth <= 30) {
                this.healthDisplay.style.color = '#ff4444';
            } else if (this.playerHealth <= 60) {
                this.healthDisplay.style.color = '#ffaa44';
            } else {
                this.healthDisplay.style.color = '#44ff44';
            }
        }
    }
    
    checkResourceCollection() {
        if (!this.player.visible || !this.canCollect) return;
        
        const collectRange = 2.0; // 収集範囲
        const playerPos = this.player.position;
        
        // 現在のレイヤーのリソースをチェック
        for (let i = this.resources.length - 1; i >= 0; i--) {
            const resource = this.resources[i];
            
            // 同じレイヤーのリソースのみチェック
            if (resource.userData.layer !== this.playerPosition.layer) continue;
            
            const distance = playerPos.distanceTo(resource.position);
            
            if (distance < collectRange) {
                // リソースを収集
                this.collectResource(resource, i);
            }
        }
    }
    
    collectResource(resource, index) {
        const resourceData = resource.userData;
        
        // リソースを追加
        if (this.game.systems.resource) {
            switch(resourceData.resourceType) {
                case 'crystal':
                    this.game.systems.resource.addResource('crystal', resourceData.value);
                    break;
                case 'rare_metal':
                    this.game.systems.resource.addResource('iron', resourceData.value * 2);
                    break;
                case 'energy_core':
                    this.game.systems.resource.addResource('energy', resourceData.value);
                    break;
            }
        }
        
        // エフェクトを再生
        this.playCollectEffect(resource.position);
        
        // サウンド再生
        if (this.game.systems.sound) {
            this.game.systems.sound.play('collect');
        }
        
        // リソースを削除
        const parentGroup = resource.parent;
        if (parentGroup) {
            parentGroup.remove(resource);
        }
        this.resources.splice(index, 1);
        
        // 通知
        this.showMessage(`${resourceData.resourceType}を収集しました (+${resourceData.value})`, 'success');
        
        console.log(`地下リソース収集: ${resourceData.resourceType} (+${resourceData.value})`);
    }
    
    playCollectEffect(position) {
        // 収集エフェクト（パーティクル）
        const particleCount = 20;
        const particles = [];
        
        for (let i = 0; i < particleCount; i++) {
            const particleGeometry = new THREE.SphereGeometry(0.1);
            const particleMaterial = new THREE.MeshBasicMaterial({
                color: 0xffff00,
                opacity: 1,
                transparent: true
            });
            const particle = new THREE.Mesh(particleGeometry, particleMaterial);
            particle.position.copy(position);
            
            // ランダムな方向に飛ばす
            particle.userData.velocity = new THREE.Vector3(
                (Math.random() - 0.5) * 0.3,
                Math.random() * 0.5 + 0.2,
                (Math.random() - 0.5) * 0.3
            );
            
            this.undergroundLayers[this.playerPosition.layer].add(particle);
            particles.push(particle);
        }
        
        // パーティクルアニメーション
        const animateParticles = () => {
            let allDone = true;
            
            for (const particle of particles) {
                particle.position.add(particle.userData.velocity);
                particle.userData.velocity.y -= 0.02; // 重力
                particle.material.opacity -= 0.02;
                
                if (particle.material.opacity > 0) {
                    allDone = false;
                } else {
                    const parentGroup = particle.parent;
                    if (parentGroup) {
                        parentGroup.remove(particle);
                    }
                }
            }
            
            if (!allDone) {
                requestAnimationFrame(animateParticles);
            }
        };
        
        animateParticles();
    }
    
    // 階層移動
    moveToLayer(targetLayer) {
        if (targetLayer >= 0 && targetLayer < this.layerCount) {
            this.playerPosition.layer = targetLayer;
            this.updatePlayerPosition();
            console.log(`レイヤー ${targetLayer} に移動しました`);
        }
    }
    
    // キーボード入力処理
    onKeyDown(event) {
        if (!this.player.visible) return;
        
        switch(event.key.toLowerCase()) {
            case 'a':
                this.moveLeft = true;
                break;
            case 'd':
                this.moveRight = true;
                break;
            case ' ':
            case 'w':
                // ジャンプ（地面にいる時のみ）
                if (this.onGround && !this.isJumping) {
                    this.velocityY = this.jumpPower;
                    this.isJumping = true;
                    this.onGround = false;
                }
                break;
            case 's':
                // 下の階層に移動（特定の場所でのみ）
                if (this.playerPosition.layer < this.layerCount - 1) {
                    this.checkLayerTransition();
                }
                break;
        }
    }
    
    onKeyUp(event) {
        if (!this.player.visible) return;
        
        switch(event.key.toLowerCase()) {
            case 'a':
                this.moveLeft = false;
                break;
            case 'd':
                this.moveRight = false;
                break;
        }
    }
    
    showMessage(text, type = 'info') {
        // メインゲームのメッセージシステムを使用
        if (this.game.showMessage) {
            this.game.showMessage(text, type);
        }
    }
    
    // === 採掘システム ===
    
    generateDiggableBlocks() {
        // 各レイヤーに掘削可能なブロックを配置
        for (let layer = 0; layer < this.layerCount; layer++) {
            this.generateLayerDigBlocks(layer);
        }
    }
    
    generateLayerDigBlocks(layerIndex) {
        const layerGroup = this.undergroundLayers[layerIndex];
        const yPos = -layerIndex * 10;
        const blockSize = 2;
        
        // グリッド状にブロックを配置
        for (let x = -this.width / 2; x < this.width / 2; x += blockSize) {
            for (let y = yPos - 5; y < yPos + 5; y += blockSize) {
                // ランダムでブロックを配置（密度調整）
                if (Math.random() < 0.6) {
                    const blockGeometry = new THREE.BoxGeometry(blockSize, blockSize, blockSize);
                    const blockMaterial = new THREE.MeshStandardMaterial({
                        color: this.getBlockColor(layerIndex),
                        roughness: 0.8,
                        metalness: 0.1
                    });
                    const block = new THREE.Mesh(blockGeometry, blockMaterial);
                    
                    block.position.set(x, y, 0);
                    block.userData = {
                        type: 'digBlock',
                        layer: layerIndex,
                        hardness: 1 + layerIndex * 0.5, // 深いほど硬い
                        resources: this.getBlockResources(layerIndex)
                    };
                    
                    layerGroup.add(block);
                    this.digBlocks.push(block);
                }
            }
        }
    }
    
    getBlockColor(layerIndex) {
        const colors = [
            0x8B4513, // 茶色（表土）
            0x696969, // 灰色（岩石）
            0x2F4F4F, // 暗い灰色（硬岩）
            0x800080, // 紫（深層岩）
            0x4B0082  // 藍色（最深層）
        ];
        return colors[layerIndex] || 0x696969;
    }
    
    getBlockResources(layerIndex) {
        // 深層ほど貴重な資源
        const resourcePools = [
            ['iron', 'stone'],
            ['iron', 'copper', 'stone'],
            ['copper', 'silver', 'crystal'],
            ['silver', 'gold', 'crystal', 'energy_core'],
            ['gold', 'crystal', 'energy_core', 'rare_element']
        ];
        
        const pool = resourcePools[layerIndex] || resourcePools[0];
        return pool[Math.floor(Math.random() * pool.length)];
    }
    
    setupMining() {
        // マウスクリックで採掘
        this.game.renderer.domElement.addEventListener('click', (event) => {
            if (this.player.visible) {
                this.handleMiningClick(event);
            }
        });
    }
    
    handleMiningClick(event) {
        // レイキャスティングでクリック位置を取得
        const rect = this.game.renderer.domElement.getBoundingClientRect();
        const mouse = new THREE.Vector2();
        mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
        
        const raycaster = new THREE.Raycaster();
        raycaster.setFromCamera(mouse, this.game.camera);
        
        // 掘削可能ブロックとの交差判定
        const intersects = raycaster.intersectObjects(this.digBlocks);
        
        if (intersects.length > 0) {
            const targetBlock = intersects[0].object;
            this.digBlock(targetBlock);
        }
    }
    
    digBlock(block) {
        if (!block.userData || block.userData.type !== 'digBlock') return;
        
        // プレイヤーとの距離チェック
        const distance = this.player.position.distanceTo(block.position);
        if (distance > this.miningRange) {
            this.showMessage('採掘範囲外です', 'warning');
            return;
        }
        
        // ブロックを削除
        const layerGroup = this.undergroundLayers[block.userData.layer];
        layerGroup.remove(block);
        
        // 配列からも削除
        const index = this.digBlocks.indexOf(block);
        if (index > -1) {
            this.digBlocks.splice(index, 1);
        }
        
        // 資源を獲得
        this.collectMiningResource(block.userData.resources);
        
        // エフェクト表示
        this.showDigEffect(block.position);
    }
    
    collectMiningResource(resourceType) {
        // ゲームの資源システムに追加
        if (this.game.systems.resource) {
            this.game.systems.resource.addResource(resourceType, 1);
            this.showMessage(`${resourceType}を獲得しました`, 'success');
        }
    }
    
    showDigEffect(position) {
        // 掘削エフェクト（パーティクル）
        const particleCount = 10;
        for (let i = 0; i < particleCount; i++) {
            const particleGeometry = new THREE.SphereGeometry(0.1);
            const particleMaterial = new THREE.MeshBasicMaterial({
                color: 0x8B4513,
                transparent: true,
                opacity: 0.8
            });
            const particle = new THREE.Mesh(particleGeometry, particleMaterial);
            
            particle.position.copy(position);
            particle.position.add(new THREE.Vector3(
                (Math.random() - 0.5) * 2,
                (Math.random() - 0.5) * 2,
                (Math.random() - 0.5) * 2
            ));
            
            this.undergroundLayers[this.playerPosition.layer].add(particle);
            
            // パーティクルのアニメーション
            setTimeout(() => {
                this.undergroundLayers[this.playerPosition.layer].remove(particle);
            }, 1000);
        }
    }
    
    // クリーンアップ
    dispose() {
        this.traverse((object) => {
            if (object.geometry) {
                object.geometry.dispose();
            }
            if (object.material) {
                if (Array.isArray(object.material)) {
                    object.material.forEach(material => material.dispose());
                } else {
                    object.material.dispose();
                }
            }
        });
        
        this.tunnels = [];
        this.resources = [];
        this.hazards = [];
        this.platforms = [];
        this.undergroundLayers = [];
        this.digBlocks = [];
    }
}