// 探索システム - プレイヤーキャラクターと探索機能

import * as THREE from 'three';

export class ExplorationSystem {
    constructor(game) {
        this.game = game;
        
        // プレイヤー設定
        this.player = null;
        this.playerSpeed = 10; // 移動速度
        this.basePlayerSpeed = 10; // 基本移動速度
        this.playerRotationSpeed = 0.05;
        this.isExploring = false;
        
        // 移動制御
        this.moveForward = false;
        this.moveBackward = false;
        this.moveLeft = false;
        this.moveRight = false;
        this.isRunning = false;
        
        // カメラ設定
        this.cameraDistance = 15;
        this.cameraHeight = 10;
        this.cameraLerpSpeed = 0.1;
        
        // レイキャスター（地形追従用）
        this.raycaster = new THREE.Raycaster();
        this.downVector = new THREE.Vector3(0, -1, 0);
        
        // リソース収集
        this.nearbyResources = new Set();
        this.collectRange = 5;
        
        // 探索済みエリア
        this.exploredAreas = new Set();
        
        this.init();
    }
    
    init() {
        this.createPlayer();
        this.setupEventListeners();
    }
    
    createPlayer() {
        // プレイヤーグループ
        this.player = new THREE.Group();
        
        // プレイヤーの体
        const bodyGeometry = new THREE.CapsuleGeometry(0.5, 1.5, 4, 8);
        const bodyMaterial = new THREE.MeshStandardMaterial({
            color: 0x4169E1,
            metalness: 0.3,
            roughness: 0.7
        });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.position.y = 1.25;
        body.castShadow = true;
        body.receiveShadow = true;
        
        // ヘルメット
        const helmetGeometry = new THREE.SphereGeometry(0.6, 16, 16);
        const helmetMaterial = new THREE.MeshStandardMaterial({
            color: 0x87CEEB,
            metalness: 0.8,
            roughness: 0.2,
            transparent: true,
            opacity: 0.7
        });
        const helmet = new THREE.Mesh(helmetGeometry, helmetMaterial);
        helmet.position.y = 2.3;
        helmet.scale.y = 0.8;
        
        // バックパック
        const backpackGeometry = new THREE.BoxGeometry(0.8, 1, 0.4);
        const backpackMaterial = new THREE.MeshStandardMaterial({
            color: 0x696969,
            metalness: 0.2,
            roughness: 0.8
        });
        const backpack = new THREE.Mesh(backpackGeometry, backpackMaterial);
        backpack.position.set(-0.35, 1.2, 0);
        
        // ライト（プレイヤーの周りを照らす）
        const playerLight = new THREE.PointLight(0xffffff, 0.5, 10);
        playerLight.position.y = 2;
        
        this.player.add(body);
        this.player.add(helmet);
        this.player.add(backpack);
        this.player.add(playerLight);
        
        // 初期位置
        this.player.position.set(10, 0, 10);
        this.player.visible = false; // 初期は非表示
        
        if (this.game.surfaceScene) {
            this.game.surfaceScene.add(this.player);
        }
    }
    
    toggleExplorationMode() {
        this.isExploring = !this.isExploring;
        
        if (this.isExploring) {
            this.enterExplorationMode();
        } else {
            this.exitExplorationMode();
        }
    }
    
    enterExplorationMode() {
        this.isExploring = true;
        this.player.visible = true;
        
        // 建設モードを終了
        if (this.game.systems.building) {
            this.game.systems.building.exitBuildMode();
        }
        
        // カメラをプレイヤー追従モードに
        this.updateCamera();
        
        // キーボードイベントを有効化
        document.addEventListener('keydown', this.boundKeyDown);
        document.addEventListener('keyup', this.boundKeyUp);
        
        // 移動フラグをリセット
        this.moveForward = false;
        this.moveBackward = false;
        this.moveLeft = false;
        this.moveRight = false;
        this.isRunning = false;
        
        // UI通知
        this.showMessage('探索モード開始', 'info');
        
        // チュートリアル通知
        if (this.game.systems.tutorial) {
            this.game.systems.tutorial.onExplorationEntered();
        }
        
        console.log('探索モード開始');
    }
    
    exitExplorationMode() {
        this.isExploring = false;
        this.player.visible = false;
        
        // キーボードイベントを無効化
        document.removeEventListener('keydown', this.boundKeyDown);
        document.removeEventListener('keyup', this.boundKeyUp);
        
        // 移動フラグをリセット
        this.moveForward = false;
        this.moveBackward = false;
        this.moveLeft = false;
        this.moveRight = false;
        this.isRunning = false;
        
        // カメラを通常モードに戻す
        if (this.game.surfaceScene) {
            this.game.surfaceScene.updateCameraPosition();
        }
        
        // UI通知
        this.showMessage('探索モード終了', 'info');
        
        console.log('探索モード終了');
    }
    
    // 移動速度を更新（研究効果など）
    updateMoveSpeed(multiplier) {
        this.playerSpeed = this.basePlayerSpeed * multiplier;
        console.log(`移動速度更新: ${this.playerSpeed}`);
    }
    
    update(deltaTime) {
        if (!this.isExploring || !this.player) return;
        
        // 移動処理
        this.updateMovement(deltaTime);
        
        // 地形追従
        this.updateGroundFollowing();
        
        // カメラ更新
        this.updateCamera();
        
        // リソース検出
        this.checkNearbyResources();
        
        // アニメーション
        this.updateAnimation(deltaTime);
    }
    
    updateMovement(deltaTime) {
        const moveSpeed = this.playerSpeed * (this.isRunning ? 1.5 : 1) * deltaTime;
        const movement = new THREE.Vector3();
        
        // カメラの向きを取得
        const cameraDirection = new THREE.Vector3();
        this.game.camera.getWorldDirection(cameraDirection);
        cameraDirection.y = 0; // Y成分を除去
        cameraDirection.normalize();
        
        // カメラの右方向を計算
        const cameraRight = new THREE.Vector3();
        cameraRight.crossVectors(cameraDirection, new THREE.Vector3(0, 1, 0));
        cameraRight.normalize();
        
        // 前進/後退
        if (this.moveForward) {
            movement.add(cameraDirection.clone().multiplyScalar(moveSpeed));
        }
        if (this.moveBackward) {
            movement.add(cameraDirection.clone().multiplyScalar(-moveSpeed));
        }
        
        // 左右移動
        if (this.moveLeft) {
            movement.add(cameraRight.clone().multiplyScalar(-moveSpeed));
        }
        if (this.moveRight) {
            movement.add(cameraRight.clone().multiplyScalar(moveSpeed));
        }
        
        // 移動がある場合
        if (movement.length() > 0) {
            // 位置更新
            this.player.position.add(movement);
            
            // 前後移動の時のみ方向を変える
            if (this.moveForward || this.moveBackward) {
                const angle = Math.atan2(cameraDirection.x, cameraDirection.z);
                if (this.moveBackward) {
                    // 後退時は180度回転
                    this.player.rotation.y = angle + Math.PI;
                } else {
                    this.player.rotation.y = angle;
                }
            }
        }
    }
    
    updateGroundFollowing() {
        // プレイヤーの位置から下方向にレイキャスト
        const origin = this.player.position.clone();
        origin.y += 10; // 十分高い位置から
        
        this.raycaster.set(origin, this.downVector);
        
        // 地形との交差判定
        const intersects = this.raycaster.intersectObject(this.game.surfaceScene.terrain);
        
        if (intersects.length > 0) {
            const groundHeight = intersects[0].point.y;
            // スムーズに地形に追従
            this.player.position.y = THREE.MathUtils.lerp(
                this.player.position.y,
                groundHeight + 0.1, // 少し浮かせる
                0.2
            );
        }
    }
    
    updateCamera() {
        if (!this.game.camera) return;
        
        // 現在のカメラ位置からプレイヤーへの方向を計算
        const cameraToPlayer = new THREE.Vector3();
        cameraToPlayer.subVectors(this.game.camera.position, this.player.position);
        cameraToPlayer.y = 0;
        cameraToPlayer.normalize();
        
        // 理想的なカメラ位置（プレイヤーの後ろ上方）
        const idealPosition = this.player.position.clone();
        idealPosition.x += cameraToPlayer.x * this.cameraDistance;
        idealPosition.y += this.cameraHeight;
        idealPosition.z += cameraToPlayer.z * this.cameraDistance;
        
        // スムーズにカメラを移動
        this.game.camera.position.lerp(idealPosition, this.cameraLerpSpeed);
        
        // プレイヤーを見る
        const lookAtPoint = this.player.position.clone();
        lookAtPoint.y += 2;
        this.game.camera.lookAt(lookAtPoint);
    }
    
    checkNearbyResources() {
        if (!this.game.systems.resourceNode) return;
        
        // 以前の近くのリソースをクリア
        for (const resource of this.nearbyResources) {
            this.unhighlightResource(resource);
        }
        this.nearbyResources.clear();
        
        // 新しい近くの資源ノードをチェック
        const nearbyNodes = this.game.systems.resourceNode.getNodesInRange(
            this.player.position,
            this.collectRange * 2
        );
        
        nearbyNodes.forEach(node => {
            const distance = this.player.position.distanceTo(node.position);
            
            if (distance <= this.collectRange && !node.userData.depleted) {
                this.nearbyResources.add(node);
                this.highlightResource(node);
                
                // 最も近いリソースに対してプロンプトを表示
                if (distance <= this.collectRange * 0.7) {
                    this.showCollectPrompt(node);
                }
            }
        });
    }
    
    highlightResource(resource) {
        // リソースをハイライト
        const originalEmissive = resource.material.emissive.clone();
        resource.userData.originalEmissive = originalEmissive;
        resource.material.emissive = new THREE.Color(0x00ff00);
        resource.material.emissiveIntensity = 0.5;
        
        // 収集可能メッセージ
        this.showCollectPrompt(resource);
    }
    
    unhighlightResource(resource) {
        // ハイライトを解除
        if (resource.userData.originalEmissive) {
            resource.material.emissive = resource.userData.originalEmissive;
            resource.material.emissiveIntensity = 0.2;
        }
    }
    
    collectResource(resource) {
        if (!this.nearbyResources.has(resource)) return;
        
        // ResourceNodeSystemを使用してハーベスト
        if (this.game.systems.resourceNode) {
            const harvestAmount = this.game.systems.resourceNode.harvestNode(resource);
            const resourceType = resource.userData.resourceType;
            
            // リソースを追加
            if (this.game.systems.resource && harvestAmount > 0) {
                this.game.systems.resource.addResource(resourceType, harvestAmount);
                
                // 音
                if (this.game.systems.sound) {
                    this.game.systems.sound.play('success');
                }
                
                // メッセージ
                this.showMessage(`+${harvestAmount} ${this.getResourceName(resourceType)}`, 'success');
            }
            
            // リストから削除
            this.nearbyResources.delete(resource);
        }
    }
    
    createCollectEffect(position) {
        if (!this.game.systems.building?.effects) return;
        
        // 収集エフェクトを作成
        const particleCount = 20;
        const particles = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        
        for (let i = 0; i < particleCount; i++) {
            positions[i * 3] = position.x + (Math.random() - 0.5) * 2;
            positions[i * 3 + 1] = position.y + Math.random() * 2;
            positions[i * 3 + 2] = position.z + (Math.random() - 0.5) * 2;
        }
        
        particles.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        
        const material = new THREE.PointsMaterial({
            color: 0x00ff00,
            size: 0.3,
            transparent: true,
            opacity: 1,
            blending: THREE.AdditiveBlending
        });
        
        const particleSystem = new THREE.Points(particles, material);
        this.game.surfaceScene.add(particleSystem);
        
        // アニメーション
        const startTime = Date.now();
        const animate = () => {
            const elapsed = (Date.now() - startTime) / 1000;
            
            if (elapsed > 1) {
                this.game.surfaceScene.remove(particleSystem);
                return;
            }
            
            particleSystem.position.y += 0.02;
            material.opacity = 1 - elapsed;
            
            requestAnimationFrame(animate);
        };
        
        animate();
    }
    
    updateAnimation(deltaTime) {
        // 歩行アニメーション（簡易版）
        if (this.moveForward || this.moveBackward || this.moveLeft || this.moveRight) {
            const bobAmount = Math.sin(Date.now() * 0.01) * 0.1;
            this.player.children[0].position.y = 1.25 + bobAmount;
        } else {
            this.player.children[0].position.y = 1.25;
        }
    }
    
    setupEventListeners() {
        // キーボードイベント
        this.boundKeyDown = (e) => this.onKeyDown(e);
        this.boundKeyUp = (e) => this.onKeyUp(e);
    }
    
    onKeyDown(event) {
        if (!this.isExploring) return;
        
        switch(event.key.toLowerCase()) {
            case 'w':
                this.moveForward = true;
                break;
            case 's':
                this.moveBackward = true;
                break;
            case 'a':
                this.moveLeft = true;
                break;
            case 'd':
                this.moveRight = true;
                break;
            case 'shift':
                this.isRunning = true;
                break;
            case 'e':
                // 最も近いリソースを収集
                if (this.nearbyResources.size > 0) {
                    const nearestResource = Array.from(this.nearbyResources)[0];
                    this.collectResource(nearestResource);
                }
                break;
            case 'escape':
                // 探索モード終了
                this.exitExplorationMode();
                if (this.game.components.explorationUI) {
                    this.game.components.explorationUI.updateButtonState();
                }
                break;
        }
    }
    
    onKeyUp(event) {
        if (!this.isExploring) return;
        
        switch(event.key.toLowerCase()) {
            case 'w':
                this.moveForward = false;
                break;
            case 's':
                this.moveBackward = false;
                break;
            case 'a':
                this.moveLeft = false;
                break;
            case 'd':
                this.moveRight = false;
                break;
            case 'shift':
                this.isRunning = false;
                break;
        }
    }
    
    showMessage(text, type = 'info') {
        // BuildingMenuのshowMessageを使用
        if (this.game.components.buildingMenu) {
            this.game.components.buildingMenu.showMessage(text, type);
        }
    }
    
    showCollectPrompt(resource) {
        // UIに収集プロンプトを表示
        if (this.game.components.explorationUI) {
            this.game.components.explorationUI.showCollectPrompt(resource.userData.resourceType);
        }
    }
    
    getResourceName(resourceType) {
        const names = {
            iron: '鉄',
            energy: 'エネルギー',
            crystal: 'クリスタル'
        };
        return names[resourceType] || resourceType;
    }
    
    // プレイヤーの位置をリセット
    resetPlayerPosition() {
        this.player.position.set(10, 0, 10);
        this.player.rotation.y = 0;
    }
    
    // クリーンアップ
    dispose() {
        if (this.player && this.game.surfaceScene) {
            this.game.surfaceScene.remove(this.player);
        }
    }
    
    // プレイヤー位置の取得
    getPlayerPosition() {
        if (this.player) {
            return {
                x: this.player.position.x,
                y: this.player.position.y,
                z: this.player.position.z
            };
        }
        return { x: 0, y: 0, z: 0 };
    }
    
    // プレイヤー位置の設定
    setPlayerPosition(position) {
        if (this.player && position) {
            this.player.position.set(
                position.x || 0,
                position.y || 0,
                position.z || 0
            );
        }
    }
}