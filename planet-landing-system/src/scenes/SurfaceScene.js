// 地表シーン - 惑星の地上部分の管理

import * as THREE from 'three';

export class SurfaceScene extends THREE.Scene {
    constructor(game) {
        super();
        this.game = game;
        
        // シーン設定
        this.background = new THREE.Color(0x87CEEB); // 空の色
        this.fog = new THREE.Fog(0x87CEEB, 100, 500);
        
        // 地形関連
        this.terrain = null;
        this.terrainSize = 200;
        this.terrainDivisions = 50;
        
        // 環境オブジェクト
        this.decorations = [];
        
        // カメラコントロール
        this.cameraTarget = new THREE.Vector3(0, 0, 0);
        this.cameraDistance = 50;
        this.cameraAngle = 0;
        this.cameraHeight = 30;
        
        this.init();
    }
    
    init() {
        this.setupLighting();
        this.createTerrain();
        this.createEnvironment();
        this.setupCamera();
    }
    
    setupLighting() {
        // 環境光
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
        this.add(ambientLight);
        
        // 太陽光（メインライト）
        this.sunLight = new THREE.DirectionalLight(0xffffff, 0.8);
        this.sunLight.position.set(50, 100, 50);
        this.sunLight.castShadow = true;
        
        // シャドウマップ設定
        this.sunLight.shadow.mapSize.width = 2048;
        this.sunLight.shadow.mapSize.height = 2048;
        this.sunLight.shadow.camera.near = 0.5;
        this.sunLight.shadow.camera.far = 500;
        
        const shadowSize = 100;
        this.sunLight.shadow.camera.left = -shadowSize;
        this.sunLight.shadow.camera.right = shadowSize;
        this.sunLight.shadow.camera.top = shadowSize;
        this.sunLight.shadow.camera.bottom = -shadowSize;
        
        this.add(this.sunLight);
        
        // 補助光（リムライト効果）
        const fillLight = new THREE.DirectionalLight(0x4488ff, 0.3);
        fillLight.position.set(-50, 50, -50);
        this.add(fillLight);
        
        // 半球光（空と地面の反射）
        const hemisphereLight = new THREE.HemisphereLight(0x87CEEB, 0x3a7d44, 0.3);
        this.add(hemisphereLight);
    }
    
    createTerrain() {
        // 地形ジオメトリ
        const geometry = new THREE.PlaneGeometry(
            this.terrainSize, 
            this.terrainSize, 
            this.terrainDivisions, 
            this.terrainDivisions
        );
        
        // 地形に起伏を追加
        const vertices = geometry.attributes.position.array;
        for (let i = 0; i < vertices.length; i += 3) {
            const x = vertices[i];
            const z = vertices[i + 1];
            
            // ノイズベースの高さマップ
            let height = 0;
            
            // 大きな起伏
            height += Math.sin(x * 0.05) * Math.cos(z * 0.05) * 3;
            
            // 中程度の起伏
            height += Math.sin(x * 0.1) * Math.cos(z * 0.1) * 1.5;
            
            // 小さな起伏
            height += Math.sin(x * 0.3) * Math.cos(z * 0.3) * 0.5;
            
            // 中心に近いほど平坦に
            const distance = Math.sqrt(x * x + z * z);
            const flatness = Math.max(0, 1 - distance / 50);
            height *= (1 - flatness * 0.8);
            
            vertices[i + 2] = height;
        }
        
        // 法線を再計算
        geometry.computeVertexNormals();
        
        // 地形マテリアル
        const material = new THREE.MeshStandardMaterial({ 
            color: 0x3a7d44,
            roughness: 0.8,
            metalness: 0.1
        });
        
        // 地形メッシュ
        this.terrain = new THREE.Mesh(geometry, material);
        this.terrain.rotation.x = -Math.PI / 2;
        this.terrain.receiveShadow = true;
        this.add(this.terrain);
        
        // グリッドヘルパー（デバッグ用、通常は非表示）
        const gridHelper = new THREE.GridHelper(this.terrainSize, 40, 0x444444, 0x222222);
        gridHelper.visible = false;
        this.add(gridHelper);
    }
    
    createEnvironment() {
        // 岩
        this.createRocks();
        
        // 植物
        this.createVegetation();
        
        // 資源ノード
        // ResourceNodeSystemが資源ノードを管理するため、ここでは作成しない
        
        // 惑星固有の装飾
        this.createPlanetSpecificDecorations();
    }
    
    createRocks() {
        const rockGeometry = new THREE.DodecahedronGeometry(1);
        const rockMaterial = new THREE.MeshStandardMaterial({
            color: 0x666666,
            roughness: 0.9
        });
        
        for (let i = 0; i < 20; i++) {
            const rock = new THREE.Mesh(rockGeometry, rockMaterial);
            
            // ランダムな位置
            const angle = Math.random() * Math.PI * 2;
            const distance = 20 + Math.random() * 60;
            rock.position.x = Math.cos(angle) * distance;
            rock.position.z = Math.sin(angle) * distance;
            rock.position.y = this.getTerrainHeight(rock.position.x, rock.position.z) + 0.5;
            
            // ランダムなスケールと回転
            const scale = 0.5 + Math.random() * 2;
            rock.scale.set(scale, scale * 0.8, scale);
            rock.rotation.set(
                Math.random() * Math.PI,
                Math.random() * Math.PI,
                Math.random() * Math.PI
            );
            
            rock.castShadow = true;
            rock.receiveShadow = true;
            
            this.decorations.push(rock);
            this.add(rock);
        }
    }
    
    createVegetation() {
        // 簡易的な木
        const treeGeometry = new THREE.ConeGeometry(2, 8, 8);
        const treeMaterial = new THREE.MeshStandardMaterial({
            color: 0x228b22,
            roughness: 0.8
        });
        
        const trunkGeometry = new THREE.CylinderGeometry(0.5, 0.7, 3);
        const trunkMaterial = new THREE.MeshStandardMaterial({
            color: 0x8b4513,
            roughness: 0.9
        });
        
        for (let i = 0; i < 15; i++) {
            const tree = new THREE.Group();
            
            // 幹
            const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
            trunk.position.y = 1.5;
            tree.add(trunk);
            
            // 葉
            const leaves = new THREE.Mesh(treeGeometry, treeMaterial);
            leaves.position.y = 5;
            tree.add(leaves);
            
            // ランダムな位置（中心から離れた場所）
            const angle = Math.random() * Math.PI * 2;
            const distance = 40 + Math.random() * 40;
            tree.position.x = Math.cos(angle) * distance;
            tree.position.z = Math.sin(angle) * distance;
            tree.position.y = this.getTerrainHeight(tree.position.x, tree.position.z);
            
            // ランダムなスケールと回転
            const scale = 0.8 + Math.random() * 0.4;
            tree.scale.set(scale, scale, scale);
            tree.rotation.y = Math.random() * Math.PI * 2;
            
            trunk.castShadow = true;
            trunk.receiveShadow = true;
            leaves.castShadow = true;
            leaves.receiveShadow = true;
            
            this.decorations.push(tree);
            this.add(tree);
        }
    }
    
    createResourceNodes() {
        // 鉄鉱石ノード
        const ironNodeGeometry = new THREE.IcosahedronGeometry(1.5, 0);
        const ironNodeMaterial = new THREE.MeshStandardMaterial({
            color: 0x8b7355,
            metalness: 0.7,
            roughness: 0.3,
            emissive: 0x4a4a4a,
            emissiveIntensity: 0.2
        });
        
        for (let i = 0; i < 5; i++) {
            const node = new THREE.Mesh(ironNodeGeometry, ironNodeMaterial);
            
            // ランダムな位置
            const angle = Math.random() * Math.PI * 2;
            const distance = 15 + Math.random() * 50;
            node.position.x = Math.cos(angle) * distance;
            node.position.z = Math.sin(angle) * distance;
            node.position.y = this.getTerrainHeight(node.position.x, node.position.z) + 0.5;
            
            node.rotation.set(
                Math.random() * Math.PI,
                Math.random() * Math.PI,
                Math.random() * Math.PI
            );
            
            node.castShadow = true;
            node.receiveShadow = true;
            
            // メタデータ
            node.userData = {
                type: 'resource_node',
                resourceType: 'iron'
            };
            
            this.decorations.push(node);
            this.add(node);
        }
    }
    
    createPlanetSpecificDecorations() {
        // 惑星タイプに応じた装飾を追加
        const planetType = this.game.planetData?.planetData?.type || 'terrestrial';
        
        switch (planetType) {
            case 'terrestrial':
                // 地球型惑星の装飾
                this.createCrystals();
                break;
            case 'desert':
                // 砂漠惑星の装飾
                this.createCacti();
                break;
            case 'ice':
                // 氷惑星の装飾
                this.createIceFormations();
                break;
        }
    }
    
    createCrystals() {
        // エネルギークリスタル
        const crystalGeometry = new THREE.OctahedronGeometry(1, 0);
        const crystalMaterial = new THREE.MeshStandardMaterial({
            color: 0x00ffff,
            emissive: 0x00ffff,
            emissiveIntensity: 0.5,
            transparent: true,
            opacity: 0.8
        });
        
        for (let i = 0; i < 3; i++) {
            const crystal = new THREE.Group();
            
            // メインクリスタル
            const mainCrystal = new THREE.Mesh(crystalGeometry, crystalMaterial);
            mainCrystal.scale.set(1, 2, 1);
            crystal.add(mainCrystal);
            
            // 小さなクリスタル
            for (let j = 0; j < 3; j++) {
                const smallCrystal = new THREE.Mesh(crystalGeometry, crystalMaterial);
                smallCrystal.scale.set(0.3, 0.6, 0.3);
                smallCrystal.position.set(
                    (Math.random() - 0.5) * 3,
                    0,
                    (Math.random() - 0.5) * 3
                );
                crystal.add(smallCrystal);
            }
            
            // ランダムな位置
            const angle = Math.random() * Math.PI * 2;
            const distance = 30 + Math.random() * 40;
            crystal.position.x = Math.cos(angle) * distance;
            crystal.position.z = Math.sin(angle) * distance;
            crystal.position.y = this.getTerrainHeight(crystal.position.x, crystal.position.z) + 1;
            
            crystal.rotation.y = Math.random() * Math.PI * 2;
            
            // アニメーション用のデータ
            crystal.userData = {
                type: 'decoration',
                decorationType: 'crystal',
                rotationSpeed: 0.01 + Math.random() * 0.02
            };
            
            this.decorations.push(crystal);
            this.add(crystal);
        }
    }
    
    createCacti() {
        // サボテン（砂漠惑星用）
        const cactusGeometry = new THREE.CylinderGeometry(0.5, 0.7, 4, 8);
        const cactusMaterial = new THREE.MeshStandardMaterial({
            color: 0x2d5016,
            roughness: 0.8
        });
        
        for (let i = 0; i < 10; i++) {
            const cactus = new THREE.Mesh(cactusGeometry, cactusMaterial);
            
            const angle = Math.random() * Math.PI * 2;
            const distance = 20 + Math.random() * 50;
            cactus.position.x = Math.cos(angle) * distance;
            cactus.position.z = Math.sin(angle) * distance;
            cactus.position.y = this.getTerrainHeight(cactus.position.x, cactus.position.z) + 2;
            
            cactus.castShadow = true;
            cactus.receiveShadow = true;
            
            this.decorations.push(cactus);
            this.add(cactus);
        }
    }
    
    createIceFormations() {
        // 氷の形成物（氷惑星用）
        const iceGeometry = new THREE.ConeGeometry(2, 5, 4);
        const iceMaterial = new THREE.MeshStandardMaterial({
            color: 0xaaffff,
            emissive: 0x4488ff,
            emissiveIntensity: 0.1,
            transparent: true,
            opacity: 0.9
        });
        
        for (let i = 0; i < 15; i++) {
            const ice = new THREE.Mesh(iceGeometry, iceMaterial);
            
            const angle = Math.random() * Math.PI * 2;
            const distance = 15 + Math.random() * 60;
            ice.position.x = Math.cos(angle) * distance;
            ice.position.z = Math.sin(angle) * distance;
            ice.position.y = this.getTerrainHeight(ice.position.x, ice.position.z) + 2.5;
            
            const scale = 0.5 + Math.random() * 1.5;
            ice.scale.set(scale, scale, scale);
            ice.rotation.set(0, Math.random() * Math.PI * 2, Math.random() * 0.3);
            
            ice.castShadow = true;
            ice.receiveShadow = true;
            
            this.decorations.push(ice);
            this.add(ice);
        }
    }
    
    // 地形の高さを取得
    getTerrainHeight(x, z) {
        if (!this.terrain) return 0;
        
        // 簡易的な高さ計算（実際の地形メッシュから取得する場合はレイキャストを使用）
        let height = 0;
        height += Math.sin(x * 0.05) * Math.cos(z * 0.05) * 3;
        height += Math.sin(x * 0.1) * Math.cos(z * 0.1) * 1.5;
        height += Math.sin(x * 0.3) * Math.cos(z * 0.3) * 0.5;
        
        const distance = Math.sqrt(x * x + z * z);
        const flatness = Math.max(0, 1 - distance / 50);
        height *= (1 - flatness * 0.8);
        
        return height;
    }
    
    setupCamera() {
        if (!this.game.camera) return;
        
        // 初期カメラ位置
        this.updateCameraPosition();
    }
    
    updateCameraPosition() {
        if (!this.game.camera) return;
        
        const x = Math.cos(this.cameraAngle) * this.cameraDistance;
        const z = Math.sin(this.cameraAngle) * this.cameraDistance;
        
        this.game.camera.position.set(
            this.cameraTarget.x + x,
            this.cameraTarget.y + this.cameraHeight,
            this.cameraTarget.z + z
        );
        
        this.game.camera.lookAt(this.cameraTarget);
    }
    
    // カメラコントロール
    rotateCamera(deltaAngle) {
        this.cameraAngle += deltaAngle;
        this.updateCameraPosition();
    }
    
    zoomCamera(deltaDistance) {
        this.cameraDistance = Math.max(20, Math.min(100, this.cameraDistance + deltaDistance));
        this.updateCameraPosition();
    }
    
    panCamera(deltaX, deltaZ) {
        this.cameraTarget.x += deltaX;
        this.cameraTarget.z += deltaZ;
        this.updateCameraPosition();
    }
    
    // 更新処理
    update(deltaTime) {
        // 装飾アニメーション
        for (const decoration of this.decorations) {
            if (decoration.userData.type === 'decoration') {
                if (decoration.userData.decorationType === 'crystal') {
                    decoration.rotation.y += decoration.userData.rotationSpeed;
                }
            }
        }
        
        // 太陽の動き（昼夜サイクル）
        const time = Date.now() * 0.0001;
        this.sunLight.position.x = Math.cos(time) * 100;
        this.sunLight.position.y = Math.abs(Math.sin(time)) * 100 + 20;
        this.sunLight.position.z = Math.sin(time) * 100;
        
        // 太陽の強度調整
        const sunIntensity = Math.max(0.2, Math.sin(time));
        this.sunLight.intensity = sunIntensity * 0.8;
        
        // 空の色も変更
        const skyColor = new THREE.Color();
        skyColor.setHSL(0.6, 0.5, 0.3 + sunIntensity * 0.4);
        this.background = skyColor;
        if (this.fog) {
            this.fog.color = skyColor;
        }
    }
    
    // クリーンアップ
    dispose() {
        // ジオメトリとマテリアルの破棄
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
        
        this.decorations = [];
    }
}