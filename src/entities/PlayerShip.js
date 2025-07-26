import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { Projectile } from './Projectile.js';

export class PlayerShip {
    constructor(scene) {
        this.scene = scene;
        this.health = 100;
        this.maxHealth = 100;
        this.speed = 50; // 適切な速度に調整
        this.rotationSpeed = 5; // 回転速度を上げる
        this.lastShotTime = 0;
        this.fireRate = 100; // ミリ秒（連射速度を上げる）
        this.damage = 10; // 基本ダメージ
        this.velocity = new THREE.Vector3();
        this.acceleration = 15; // 加速度を大幅に上げる
        this.isPoweredUp = false;
        this.powerUpEndTime = 0;
        this.isDead = false;
        this.modelLoaded = false; // モデル読み込み完了フラグ
        
        this.createGroup();
        // GLBファイル配置後は以下のコメントアウトを削除してください
        this.loadModel();
        // this.createFallbackMesh(); // GLBファイル使用時はコメントアウト
        this.createEngineEffects();
    }

    createGroup() {
        // プレイヤー機体のルートグループ作成
        this.group = new THREE.Group();
        this.group.position.set(0, 0, 0);
        this.scene.add(this.group);
    }
    
    loadModel() {
        const loader = new GLTFLoader();
        
        loader.load(
            `${import.meta.env.BASE_URL}assets/player_ship_SF-01.glb`,
            (gltf) => {
                console.log('Player ship model loaded successfully');
                this.modelLoaded = true;
                
                // モデルを取得
                this.shipModel = gltf.scene;
                this.shipModel.scale.set(1, 1, 1); // スケール調整（必要に応じて）
                
                // マテリアル設定の調整
                this.shipModel.traverse((child) => {
                    if (child.isMesh) {
                        child.castShadow = true;
                        child.receiveShadow = true;
                        
                        // マテリアル設定（安全に）
                        if (child.material) {
                            // 配列の場合（マルチマテリアル）
                            const materials = Array.isArray(child.material) ? child.material : [child.material];
                            
                            materials.forEach(material => {
                                if (!material) return;
                                
                                try {
                                    // マテリアルを安全に設定
                                    if (material.isMeshStandardMaterial || material.isMeshPhongMaterial || material.isMeshBasicMaterial) {
                                        // 基本設定
                                        material.needsUpdate = true;
                                        
                                        // エンジン部分の設定
                                        if (child.name && child.name.toLowerCase().includes('engine')) {
                                            if (material.emissive !== undefined) {
                                                material.emissive = new THREE.Color(0x00ddff);
                                                material.emissiveIntensity = 0.3;
                                            }
                                        }
                                        
                                        // コックピット設定
                                        if (child.name && child.name.toLowerCase().includes('cockpit')) {
                                            material.transparent = true;
                                            material.opacity = 0.7;
                                            if (material.color !== undefined) {
                                                material.color = new THREE.Color(0x001144);
                                            }
                                        }
                                        
                                        // PBRマテリアルの場合
                                        if (material.isMeshStandardMaterial) {
                                            material.metalness = 0.8;
                                            material.roughness = 0.3;
                                        }
                                    }
                                } catch (error) {
                                    console.warn('Material setup warning:', error);
                                    // エラーが発生した場合は基本マテリアルに置き換え
                                    const fallbackMaterial = new THREE.MeshPhongMaterial({ 
                                        color: 0x505050,
                                        shininess: 30 
                                    });
                                    child.material = fallbackMaterial;
                                }
                            });
                        }
                    }
                });
                
                // グループに追加
                this.group.add(this.shipModel);
                
                // 当たり判定用の参照を保持（旧コードとの互換性）
                this.bodyMesh = this.shipModel;
                
            },
            (progress) => {
                console.log('Loading progress:', (progress.loaded / progress.total * 100) + '%');
            },
            (error) => {
                console.error('Error loading player ship model:', error);
                console.log(`Attempting to load from: ${import.meta.env.BASE_URL}assets/player_ship_SF-01.glb`);
                console.log('Make sure the GLB file is placed in the assets folder');
                // フォールバック：元のジオメトリを使用
                this.createFallbackMesh();
            }
        );
    }
    
    createFallbackMesh() {
        console.log('Using fallback mesh for player ship - Enhanced SF-01 Style');
        
        // SF-01戦闘機 - より詳細な設計
        
        // メイン胴体（前方が尖った流線型）
        const bodyGeometry = new THREE.ConeGeometry(1.5, 8, 8);
        const bodyMaterial = new THREE.MeshBasicMaterial({ 
            color: 0x708090  // スレートグレー
        });
        this.bodyMesh = new THREE.Mesh(bodyGeometry, bodyMaterial);
        this.bodyMesh.rotation.x = Math.PI / 2;
        this.bodyMesh.rotation.z = Math.PI;
        this.bodyMesh.position.set(0, 0, 0);
        
        // メイン翼（逆スイープ型デルタ翼）
        const wingGeometry = new THREE.ConeGeometry(3, 1.5, 4);
        const wingMaterial = new THREE.MeshBasicMaterial({ 
            color: 0x606060
        });
        
        const leftWing = new THREE.Mesh(wingGeometry, wingMaterial.clone());
        leftWing.position.set(-2.5, 0, 1);
        leftWing.rotation.x = Math.PI / 2;
        leftWing.rotation.z = -Math.PI / 4;
        leftWing.scale.set(1.2, 2, 0.2);
        
        const rightWing = new THREE.Mesh(wingGeometry, wingMaterial.clone());
        rightWing.position.set(2.5, 0, 1);
        rightWing.rotation.x = Math.PI / 2;
        rightWing.rotation.z = Math.PI / 4;
        rightWing.scale.set(1.2, 2, 0.2);
        
        // カナード翼（前翼）
        const canardGeometry = new THREE.ConeGeometry(1, 0.5, 3);
        const canardMaterial = new THREE.MeshBasicMaterial({ 
            color: 0x505050
        });
        
        const leftCanard = new THREE.Mesh(canardGeometry, canardMaterial.clone());
        leftCanard.position.set(-1, 0, -2.5);
        leftCanard.rotation.x = Math.PI / 2;
        leftCanard.rotation.z = -Math.PI / 6;
        leftCanard.scale.set(0.8, 1, 0.15);
        
        const rightCanard = new THREE.Mesh(canardGeometry, canardMaterial.clone());
        rightCanard.position.set(1, 0, -2.5);
        rightCanard.rotation.x = Math.PI / 2;
        rightCanard.rotation.z = Math.PI / 6;
        rightCanard.scale.set(0.8, 1, 0.15);
        
        // コックピットカバー（より大型で現実的）
        const cockpitGeometry = new THREE.SphereGeometry(1.2, 12, 8);
        const cockpitMaterial = new THREE.MeshBasicMaterial({
            color: 0x001133,
            transparent: true,
            opacity: 0.7
        });
        const cockpit = new THREE.Mesh(cockpitGeometry, cockpitMaterial);
        cockpit.position.set(0, 0.8, -1);
        cockpit.scale.set(1, 0.5, 1.5);
        
        // エンジンノズル（双発）
        const engineGeometry = new THREE.CylinderGeometry(0.4, 0.7, 2.5, 8);
        const engineMaterial = new THREE.MeshBasicMaterial({
            color: 0x303030
        });
        
        const leftEngine = new THREE.Mesh(engineGeometry, engineMaterial.clone());
        leftEngine.position.set(-0.8, -0.2, 3.5);
        leftEngine.rotation.x = Math.PI / 2;
        
        const rightEngine = new THREE.Mesh(engineGeometry, engineMaterial.clone());
        rightEngine.position.set(0.8, -0.2, 3.5);
        rightEngine.rotation.x = Math.PI / 2;
        
        // エンジン排気口（光るリング）
        const exhaustGeometry = new THREE.RingGeometry(0.3, 0.7, 8);
        const exhaustMaterial = new THREE.MeshBasicMaterial({
            color: 0x00aaff,
            transparent: true,
            opacity: 0.8
        });
        
        const leftExhaust = new THREE.Mesh(exhaustGeometry, exhaustMaterial.clone());
        leftExhaust.position.set(-0.8, -0.2, 4.8);
        
        const rightExhaust = new THREE.Mesh(exhaustGeometry, exhaustMaterial.clone());
        rightExhaust.position.set(0.8, -0.2, 4.8);
        
        // 垂直尾翼
        const tailGeometry = new THREE.ConeGeometry(0.8, 2, 4);
        const tailMaterial = new THREE.MeshBasicMaterial({ 
            color: 0x505050
        });
        const tail = new THREE.Mesh(tailGeometry, tailMaterial);
        tail.position.set(0, 1.2, 2.5);
        tail.rotation.x = Math.PI / 2;
        tail.scale.set(0.3, 1.5, 1);
        
        // 機体番号とマーキング
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 128;
        const ctx = canvas.getContext('2d');
        
        // 背景
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fillRect(0, 0, 256, 128);
        
        // メイン番号
        ctx.fillStyle = '#00aaff';
        ctx.font = 'bold 36px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('SF-01', 128, 50);
        
        // サブテキスト
        ctx.fillStyle = '#ffffff';
        ctx.font = '16px Arial';
        ctx.fillText('SPACE FIGHTER', 128, 75);
        ctx.fillText('PROTOTYPE', 128, 95);
        
        const numberTexture = new THREE.CanvasTexture(canvas);
        const numberMaterial = new THREE.MeshBasicMaterial({
            map: numberTexture,
            transparent: true
        });
        
        const numberPlane = new THREE.PlaneGeometry(3, 1.5);
        const numberMesh = new THREE.Mesh(numberPlane, numberMaterial);
        numberMesh.position.set(1.2, 0, 0.5);
        numberMesh.rotation.y = -Math.PI / 2;
        
        // 機体詳細パネル（左側）
        const detailCanvas = document.createElement('canvas');
        detailCanvas.width = 128;
        detailCanvas.height = 64;
        const detailCtx = detailCanvas.getContext('2d');
        
        detailCtx.fillStyle = '#00aaff';
        detailCtx.fillRect(0, 0, 128, 64);
        detailCtx.fillStyle = '#ffffff';
        detailCtx.font = '12px Arial';
        detailCtx.fillText('01', 64, 40);
        
        const detailTexture = new THREE.CanvasTexture(detailCanvas);
        const detailMaterial = new THREE.MeshBasicMaterial({
            map: detailTexture,
            transparent: true
        });
        
        const detailPlane = new THREE.PlaneGeometry(1.5, 0.75);
        const detailMesh = new THREE.Mesh(detailPlane, detailMaterial);
        detailMesh.position.set(-1.2, 0, 0.5);
        detailMesh.rotation.y = Math.PI / 2;
        
        // 全てをグループに追加
        this.group.add(this.bodyMesh);
        this.group.add(leftWing);
        this.group.add(rightWing);
        this.group.add(leftCanard);
        this.group.add(rightCanard);
        this.group.add(cockpit);
        this.group.add(leftEngine);
        this.group.add(rightEngine);
        this.group.add(leftExhaust);
        this.group.add(rightExhaust);
        this.group.add(tail);
        this.group.add(numberMesh);
        this.group.add(detailMesh);
        
        // 影を有効化
        [this.bodyMesh, leftWing, rightWing, leftCanard, rightCanard, 
         cockpit, leftEngine, rightEngine, tail].forEach(mesh => {
            mesh.castShadow = true;
            mesh.receiveShadow = true;
        });
        
        this.modelLoaded = true;
        console.log('Enhanced SF-01 style fallback mesh created successfully');
    }

    createEngineEffects() {
        // エンジン光（モデル読み込み完了を待つ）
        setTimeout(() => {
            this.engineLight = new THREE.PointLight(0x00ffff, 2, 20);
            this.engineLight.position.set(0, 0, 4); // 機体後方に配置
            this.group.add(this.engineLight);
            
            // パーティクルエフェクト（簡易版）
            const particleGeometry = new THREE.SphereGeometry(0.2, 4, 4);
            const particleMaterial = new THREE.MeshBasicMaterial({ 
                color: 0x00ffff,
                transparent: true,
                opacity: 0.6
            });
            
            this.engineParticles = [];
            for (let i = 0; i < 10; i++) {
                const particle = new THREE.Mesh(particleGeometry, particleMaterial.clone());
                particle.position.set(
                    (Math.random() - 0.5) * 0.5, 
                    (Math.random() - 0.5) * 0.5, 
                    4 + i * 0.3
                );
                particle.visible = false;
                this.group.add(particle);
                this.engineParticles.push(particle);
            }
        }, 100); // 100ms遅延
    }

    update(delta, inputManager) {
        // プレイヤーの向きに基づいた移動
        const moveSpeed = inputManager.keys.shift ? this.speed * 2 : this.speed;
        
        // ブースト開始検出
        if (inputManager.keys.shift && !this.wasBoosting) {
            this.wasBoosting = true;
            // ルナに通知
            if (this.scene.userData.game && this.scene.userData.game.companionSystem) {
                this.scene.userData.game.companionSystem.onSpeedBoost();
            }
        } else if (!inputManager.keys.shift) {
            this.wasBoosting = false;
        }
        
        // 前進・後退の移動ベクトル
        const forward = new THREE.Vector3(0, 0, -1);
        forward.applyQuaternion(this.group.quaternion);
        
        // 左右の移動ベクトル
        const right = new THREE.Vector3(1, 0, 0);
        right.applyQuaternion(this.group.quaternion);
        
        // 移動計算
        const movement = new THREE.Vector3();
        
        if (inputManager.keys.w) {
            // 前進
            movement.add(forward.clone().multiplyScalar(moveSpeed * delta));
        }
        if (inputManager.keys.s) {
            // 後退
            movement.add(forward.clone().multiplyScalar(-moveSpeed * delta * 0.7)); // 後退は少し遅く
        }
        if (inputManager.keys.a) {
            // 左移動
            movement.add(right.clone().multiplyScalar(-moveSpeed * delta * 0.8));
        }
        if (inputManager.keys.d) {
            // 右移動
            movement.add(right.clone().multiplyScalar(moveSpeed * delta * 0.8));
        }
        
        // 位置を更新
        this.group.position.add(movement);
        
        // 移動している場合のエフェクト
        if (movement.length() > 0) {
            
            // エンジンエフェクト表示（パーティクルが存在する場合のみ）
            if (this.engineParticles) {
                this.engineParticles.forEach((particle, i) => {
                    particle.visible = true;
                    particle.scale.setScalar(1 - i * 0.08);
                    // ブースト時は大きく
                    if (inputManager.keys.shift) {
                        particle.scale.multiplyScalar(1.5);
                    }
                });
            }
        } else {
            // エンジンエフェクト非表示
            if (this.engineParticles) {
                this.engineParticles.forEach(particle => {
                    particle.visible = false;
                });
            }
        }
        
        // マウスに向かって回転
        const mouseWorldPos = inputManager.getMouseWorldPosition(100); // 照準距離を延長
        if (mouseWorldPos) {
            const direction = new THREE.Vector3()
                .subVectors(mouseWorldPos, this.group.position)
                .normalize();
            
            const targetQuaternion = new THREE.Quaternion()
                .setFromRotationMatrix(
                    new THREE.Matrix4().lookAt(
                        this.group.position,
                        this.group.position.clone().add(direction),
                        new THREE.Vector3(0, 1, 0)
                    )
                );
            
            // より即座に反応するよう調整
            this.group.quaternion.slerp(targetQuaternion, Math.min(this.rotationSpeed * delta, 0.3));
        }
        
        // エンジン光の明るさを変更（エンジン光が存在する場合のみ）
        if (this.engineLight) {
            this.engineLight.intensity = 2 + Math.sin(Date.now() * 0.01) * 0.5;
        }
        
        // パワーアップ効果の終了チェック
        if (this.isPoweredUp && Date.now() > this.powerUpEndTime) {
            this.isPoweredUp = false;
            this.fireRate = 100; // 通常の連射速度に戻す
        }
        
        // パワーアップ中の視覚効果（安全に）
        if (this.isPoweredUp) {
            // 機体を光らせる
            const bodyMesh = this.group.children[0];
            if (bodyMesh && bodyMesh.material) {
                try {
                    if (bodyMesh.material.emissive !== undefined) {
                        bodyMesh.material.emissive = new THREE.Color(0x00ffff);
                        bodyMesh.material.emissiveIntensity = 0.5 + Math.sin(Date.now() * 0.01) * 0.3;
                    } else {
                        // MeshBasicMaterialの場合は色を変更
                        const originalColor = bodyMesh.material.color.clone();
                        bodyMesh.material.color.lerp(new THREE.Color(0x00ffff), 0.3);
                    }
                } catch (error) {
                    console.warn('PowerUp effect error:', error);
                }
            }
        } else {
            // 通常の色に戻す
            const bodyMesh = this.group.children[0];
            if (bodyMesh && bodyMesh.material) {
                try {
                    if (bodyMesh.material.emissive !== undefined) {
                        bodyMesh.material.emissive = new THREE.Color(0x004488);
                        bodyMesh.material.emissiveIntensity = 0.2;
                    } else {
                        // MeshBasicMaterialの場合
                        bodyMesh.material.color = new THREE.Color(0x505050);
                    }
                } catch (error) {
                    console.warn('Material reset error:', error);
                }
            }
        }
    }

    shoot() {
        // WeaponSystemが存在する場合はそちらを使用
        if (this.scene.userData.game && this.scene.userData.game.weaponSystem) {
            return this.scene.userData.game.weaponSystem.firePrimary();
        }
        
        // フォールバック：従来の射撃処理
        const now = Date.now();
        if (now - this.lastShotTime < this.fireRate) return null;
        
        this.lastShotTime = now;
        
        // 射撃位置（少し前方）
        const shootPosition = new THREE.Vector3(0, 0, -5);
        shootPosition.applyQuaternion(this.group.quaternion);
        shootPosition.add(this.group.position);
        
        // 弾丸作成
        const projectile = new Projectile(
            this.scene,
            shootPosition,
            this.group.quaternion,
            0x00ffff,
            this.damage // 装備によるダメージを使用
        );
        
        return projectile;
    }

    takeDamage(damage) {
        if (this.health <= 0) return; // すでに死んでいる場合は何もしない
        
        this.health -= damage;
        
        // ダメージエフェクト（安全に）
        const bodyMesh = this.group.children[0];
        if (bodyMesh && bodyMesh.material) {
            try {
                if (bodyMesh.material.emissive !== undefined) {
                    bodyMesh.material.emissive = new THREE.Color(0xff0000);
                    setTimeout(() => {
                        if (bodyMesh.material && bodyMesh.material.emissive !== undefined) {
                            bodyMesh.material.emissive = new THREE.Color(0x004488);
                        }
                    }, 100);
                } else {
                    // MeshBasicMaterialの場合
                    const originalColor = bodyMesh.material.color.clone();
                    bodyMesh.material.color = new THREE.Color(0xff0000);
                    setTimeout(() => {
                        if (bodyMesh.material) {
                            bodyMesh.material.color = originalColor;
                        }
                    }, 100);
                }
            } catch (error) {
                console.warn('Damage effect error:', error);
            }
        }
        
        if (this.health <= 0 && !this.isDead) {
            // ゲームオーバー処理（一度だけ実行）
            this.isDead = true;
            console.log('Game Over');
            // TODO: ゲームオーバー画面を表示
        }
    }

    get mesh() {
        return this.group;
    }
}