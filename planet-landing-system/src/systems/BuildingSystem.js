// 建物システム - 建物の配置と管理

import * as THREE from 'three';
import { BUILDING_TYPES, PLACEMENT_RULES, BUILDING_VISUALS } from '../data/buildings.js';
import { BuildingEffects } from '../effects/BuildingEffects.js';

export class BuildingSystem {
    constructor(game) {
        this.game = game;
        this.buildings = new Map(); // buildingId -> building object
        this.grid = new Map(); // "x,z" -> building
        this.nextBuildingId = 1;
        
        // 建設モード関連
        this.buildMode = false;
        this.selectedBuildingType = null;
        this.previewMesh = null;
        this.validPlacement = false;
        
        // 選択された建物
        this.selectedBuilding = null;
        this.highlightMesh = null;
        
        // グリッド表示
        this.gridHelper = null;
        this.createGridHelper();
        
        // レイキャスター（クリック検出用）
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();
        
        // エフェクトシステム
        this.effects = null;
        
        // イベントリスナー
        this.setupEventListeners();
    }
    
    createGridHelper() {
        const gridSize = 100;
        const divisions = 20;
        this.gridHelper = new THREE.GridHelper(gridSize, divisions, 0x444444, 0x222222);
        this.gridHelper.visible = false;
        if (this.game.surfaceScene) {
            this.game.surfaceScene.add(this.gridHelper);
            
            // エフェクトシステムを初期化
            this.effects = new BuildingEffects(this.game.surfaceScene);
        }
    }
    
    setupEventListeners() {
        // マウスイベント
        this.game.renderer.domElement.addEventListener('mousemove', (e) => this.onMouseMove(e));
        this.game.renderer.domElement.addEventListener('click', (e) => this.onMouseClick(e));
        document.addEventListener('keydown', (e) => this.onKeyDown(e));
    }
    
    // 建設モードの切り替え
    enterBuildMode(buildingType) {
        // buildingTypeはidとして渡される（例: 'mine', 'power_plant'）
        let buildingKey = null;
        for (const [key, data] of Object.entries(BUILDING_TYPES)) {
            if (data.id === buildingType) {
                buildingKey = key;
                break;
            }
        }
        
        if (!buildingKey) {
            console.error('無効な建物タイプ:', buildingType);
            return;
        }
        
        this.buildMode = true;
        this.selectedBuildingType = buildingType;
        this.selectedBuildingKey = buildingKey;
        this.gridHelper.visible = true;
        
        // プレビューメッシュを作成
        this.createPreviewMesh(buildingType);
        
        console.log(`建設モード開始: ${BUILDING_TYPES[buildingKey].name}`);
    }
    
    exitBuildMode() {
        this.buildMode = false;
        this.selectedBuildingType = null;
        this.gridHelper.visible = false;
        
        if (this.previewMesh) {
            this.game.surfaceScene.remove(this.previewMesh);
            this.previewMesh = null;
        }
        
        console.log('建設モード終了');
    }
    
    createPreviewMesh(buildingType) {
        const visual = BUILDING_VISUALS[buildingType];
        if (!visual) {
            console.error('ビジュアルデータが見つかりません:', buildingType);
            return;
        }
        let geometry;
        
        switch (visual.geometry) {
            case 'box':
                geometry = new THREE.BoxGeometry(visual.size.x, visual.size.y, visual.size.z);
                break;
            case 'cylinder':
                geometry = new THREE.CylinderGeometry(visual.size.radius, visual.size.radius, visual.size.height, 16);
                break;
            case 'sphere':
                geometry = new THREE.SphereGeometry(visual.size.radius, 16, 16);
                break;
            case 'cone':
                geometry = new THREE.ConeGeometry(visual.size.radius, visual.size.height, 8);
                break;
            default:
                geometry = new THREE.BoxGeometry(4, 4, 4);
        }
        
        const material = new THREE.MeshStandardMaterial({
            color: visual.color,
            emissive: visual.emissive,
            transparent: true,
            opacity: 0.7
        });
        
        this.previewMesh = new THREE.Mesh(geometry, material);
        this.previewMesh.position.y = visual.size.y ? visual.size.y / 2 : 2;
        this.game.surfaceScene.add(this.previewMesh);
    }
    
    // マウス位置をグリッド座標に変換
    getGridPosition(mouseX, mouseY) {
        const raycaster = new THREE.Raycaster();
        const mouse = new THREE.Vector2();
        
        mouse.x = (mouseX / window.innerWidth) * 2 - 1;
        mouse.y = -(mouseY / window.innerHeight) * 2 + 1;
        
        raycaster.setFromCamera(mouse, this.game.camera);
        
        // 地面との交差判定
        const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
        const intersection = new THREE.Vector3();
        raycaster.ray.intersectPlane(plane, intersection);
        
        // グリッドに合わせる
        const gridSize = PLACEMENT_RULES.gridSize;
        const gridX = Math.round(intersection.x / gridSize) * gridSize;
        const gridZ = Math.round(intersection.z / gridSize) * gridSize;
        
        return { x: gridX, z: gridZ };
    }
    
    // 配置可能かチェック
    canPlaceBuilding(buildingType, gridX, gridZ) {
        const key = `${gridX},${gridZ}`;
        
        // すでに建物がある場合
        if (this.grid.has(key)) {
            return false;
        }
        
        // 最大建物数チェック
        if (this.buildings.size >= PLACEMENT_RULES.maxBuildings) {
            return false;
        }
        
        // 建物固有の制限チェック
        const restrictions = PLACEMENT_RULES.restrictions[buildingType];
        if (restrictions) {
            // 同じタイプの建物数制限
            if (restrictions.maxPerPlanet) {
                const count = Array.from(this.buildings.values())
                    .filter(b => b.type === buildingType).length;
                if (count >= restrictions.maxPerPlanet) {
                    return false;
                }
            }
            
            // 最小距離制限
            if (restrictions.minimumDistance) {
                const minDist = restrictions.minimumDistance * PLACEMENT_RULES.gridSize;
                for (const building of this.buildings.values()) {
                    if (building.type === buildingType) {
                        const dist = Math.sqrt(
                            Math.pow(building.position.x - gridX, 2) +
                            Math.pow(building.position.z - gridZ, 2)
                        );
                        if (dist < minDist) {
                            return false;
                        }
                    }
                }
            }
        }
        
        // 資源コストチェック
        let buildingData = null;
        for (const data of Object.values(BUILDING_TYPES)) {
            if (data.id === buildingType) {
                buildingData = data;
                break;
            }
        }
        
        if (!buildingData) return false;
        
        const cost = buildingData.baseStats.cost;
        const resources = this.game.systems.resource?.getResources() || { credits: 10000, energy: 1000 };
        
        if (resources.credits < cost.credits || resources.energy < cost.energy) {
            return false;
        }
        
        return true;
    }
    
    // 建物を配置
    placeBuilding(buildingType, gridX, gridZ) {
        if (!this.canPlaceBuilding(buildingType, gridX, gridZ)) {
            console.log('建物を配置できません');
            return null;
        }
        
        // buildingTypeはid（例: 'mine'）なので、対応するデータを探す
        let buildingData = null;
        for (const data of Object.values(BUILDING_TYPES)) {
            if (data.id === buildingType) {
                buildingData = data;
                break;
            }
        }
        
        if (!buildingData) {
            console.error('建物データが見つかりません:', buildingType);
            return null;
        }
        
        const visual = BUILDING_VISUALS[buildingType];
        
        // メッシュを作成
        let geometry;
        switch (visual.geometry) {
            case 'box':
                geometry = new THREE.BoxGeometry(visual.size.x, visual.size.y, visual.size.z);
                break;
            case 'cylinder':
                geometry = new THREE.CylinderGeometry(visual.size.radius, visual.size.radius, visual.size.height, 16);
                break;
            case 'sphere':
                geometry = new THREE.SphereGeometry(visual.size.radius, 16, 16);
                break;
            case 'cone':
                geometry = new THREE.ConeGeometry(visual.size.radius, visual.size.height, 8);
                break;
            default:
                geometry = new THREE.BoxGeometry(4, 4, 4);
        }
        
        const material = new THREE.MeshStandardMaterial({
            color: visual.color,
            emissive: visual.emissive
        });
        
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(gridX, visual.size.y ? visual.size.y / 2 : 2, gridZ);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        this.game.surfaceScene.add(mesh);
        
        // 輸送ターミナルの場合、着陸パッドを追加
        if (buildingType === 'transport_terminal' && visual.hasLandingPad) {
            const padGeometry = new THREE.CircleGeometry(6, 32);
            const padMaterial = new THREE.MeshStandardMaterial({
                color: 0x666666,
                metalness: 0.5,
                roughness: 0.5
            });
            const landingPad = new THREE.Mesh(padGeometry, padMaterial);
            landingPad.rotation.x = -Math.PI / 2;
            landingPad.position.set(gridX, 0.1, gridZ);
            landingPad.receiveShadow = true;
            this.game.surfaceScene.add(landingPad);
            
            // ライトマーカー
            const markerGeometry = new THREE.BoxGeometry(0.3, 0.3, 0.3);
            const markerMaterial = new THREE.MeshBasicMaterial({
                color: 0xff0000,
                emissive: 0xff0000
            });
            
            for (let i = 0; i < 4; i++) {
                const angle = (i / 4) * Math.PI * 2;
                const marker = new THREE.Mesh(markerGeometry, markerMaterial);
                marker.position.set(
                    gridX + Math.cos(angle) * 5,
                    0.2,
                    gridZ + Math.sin(angle) * 5
                );
                this.game.surfaceScene.add(marker);
            }
        }
        
        // 建物オブジェクトを作成
        const building = {
            id: this.nextBuildingId++,
            type: buildingType,
            position: { x: gridX, z: gridZ },
            level: 1,
            mesh: mesh,
            constructionTime: buildingData.baseStats.buildTime,
            constructionStartTime: Date.now(),
            isConstructing: true,
            lastProductionTime: Date.now(),
            nearbyResourceNode: null,
            resourceNodeDistance: null
        };
        
        // 資源ノードとの関連をチェック
        if (buildingData.baseStats.requiresResourceNode && this.game.systems.resourceNode) {
            const restriction = PLACEMENT_RULES.restrictions[buildingType];
            const nearbyNode = this.game.systems.resourceNode.getNearestNode(
                mesh.position,
                restriction?.resourceNodeType
            );
            
            if (nearbyNode) {
                building.nearbyResourceNode = nearbyNode;
                building.resourceNodeDistance = mesh.position.distanceTo(nearbyNode.position);
            }
        }
        
        // 建物を登録
        this.buildings.set(building.id, building);
        this.grid.set(`${gridX},${gridZ}`, building);
        
        // 資源を消費
        if (this.game.systems.resource) {
            const cost = buildingData.baseStats.cost;
            this.game.systems.resource.consumeResources(cost);
        }
        
        // 建設アニメーション
        this.startConstructionAnimation(building);
        
        // 建設音を再生
        if (this.game.systems.sound) {
            this.game.systems.sound.play('buildingPlace');
        }
        
        console.log(`${buildingData.name}を建設開始 (${buildingData.baseStats.buildTime}秒)`);
        
        return building;
    }
    
    // 建設アニメーション
    startConstructionAnimation(building) {
        const originalY = building.mesh.position.y;
        building.mesh.userData.originalY = originalY;
        building.mesh.position.y = -5;
        
        const animate = () => {
            const elapsed = (Date.now() - building.constructionStartTime) / 1000;
            const progress = Math.min(elapsed / building.constructionTime, 1);
            
            building.mesh.position.y = -5 + (originalY + 5) * progress;
            building.mesh.rotation.y = progress * Math.PI * 2;
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                building.isConstructing = false;
                building.mesh.rotation.y = 0;
                console.log(`建設完了: ${BUILDING_TYPES[building.type.toUpperCase()]?.name || building.type}`);
                
                // 建設完了エフェクト
                if (this.effects) {
                    this.effects.playConstructionComplete(building);
                }
                
                // 建設完了音を再生
                if (this.game.systems.sound) {
                    this.game.systems.sound.play('buildingComplete');
                }
                
                // 進行システムに通知
                if (this.game.systems.progress) {
                    // 新規建設の場合
                    if (building.level === 1) {
                        this.game.systems.progress.onBuildingBuilt(building.type);
                    } else {
                        // アップグレードの場合
                        this.game.systems.progress.onBuildingUpgraded(building.type);
                    }
                }
            }
        };
        
        animate();
    }
    
    // 建物のアップグレード
    upgradeBuilding(buildingId) {
        const building = this.buildings.get(buildingId);
        if (!building || building.isConstructing) return false;
        
        // building.typeはid（例: 'mine'）なので、対応するデータを探す
        let buildingData = null;
        for (const data of Object.values(BUILDING_TYPES)) {
            if (data.id === building.type) {
                buildingData = data;
                break;
            }
        }
        
        if (!buildingData) {
            console.error('建物データが見つかりません:', building.type);
            return false;
        }
        
        if (building.level >= buildingData.maxLevel) {
            console.log('最大レベルに達しています');
            return false;
        }
        
        const nextLevel = building.level + 1;
        const upgradeCost = buildingData.upgrades[nextLevel].cost;
        
        // 資源チェック
        if (this.game.systems.resource) {
            const resources = this.game.systems.resource.getResources();
            if (resources.credits < upgradeCost.credits || resources.energy < upgradeCost.energy) {
                console.log('資源が不足しています');
                return false;
            }
            
            // 資源を消費
            this.game.systems.resource.consumeResources(upgradeCost);
        }
        
        // アップグレード実行
        building.level = nextLevel;
        building.isConstructing = true;
        building.constructionTime = buildingData.upgrades[nextLevel].buildTime;
        building.constructionStartTime = Date.now();
        
        // ビジュアル更新
        const scale = 1 + (building.level - 1) * 0.2;
        building.mesh.scale.set(scale, scale, scale);
        
        // アップグレードアニメーション
        this.startConstructionAnimation(building);
        
        console.log(`${buildingData.name}をレベル${nextLevel}にアップグレード`);
        
        // アップグレードエフェクト
        if (this.effects) {
            this.effects.playUpgradeEffect(building);
        }
        
        // アップグレード音を再生
        if (this.game.systems.sound) {
            this.game.systems.sound.play('upgrade');
        }
        
        return true;
    }
    
    // 建物を削除
    removeBuilding(buildingId) {
        const building = this.buildings.get(buildingId);
        if (!building) return false;
        
        // 輸送ターミナルの場合、TransportSystemから登録解除
        if (building.type === 'transport_terminal' && this.game.systems.transport) {
            this.game.systems.transport.unregisterTerminal(buildingId);
        }
        
        // メッシュを削除
        this.game.surfaceScene.remove(building.mesh);
        
        // 登録を削除
        this.buildings.delete(buildingId);
        this.grid.delete(`${building.position.x},${building.position.z}`);
        
        // building.typeはid（例: 'mine'）なので、対応するデータを探す
        let buildingData = null;
        for (const data of Object.values(BUILDING_TYPES)) {
            if (data.id === building.type) {
                buildingData = data;
                break;
            }
        }
        
        console.log(`建物を削除: ${buildingData ? buildingData.name : building.type}`);
        
        return true;
    }
    
    // 更新処理
    update(deltaTime) {
        // 建設中の建物の進捗を更新
        for (const building of this.buildings.values()) {
            if (building.isConstructing) {
                const elapsed = (Date.now() - building.constructionStartTime) / 1000;
                if (elapsed >= building.constructionTime) {
                    building.isConstructing = false;
                    this.onBuildingCompleted(building);
                }
            }
        }
    }
    
    // 建物完成時の処理
    onBuildingCompleted(building) {
        console.log(`建物完成: ${building.type}`);
        
        // 輸送ターミナルの場合、TransportSystemに登録
        if (building.type === 'transport_terminal' && this.game.systems.transport) {
            this.game.systems.transport.registerTerminal(building);
        }
        
        // 惑星所有権システムに通知
        if (this.game.systems.planetOwnership) {
            this.game.systems.planetOwnership.onBuildingConstructed(building);
        }
        
        // 完成メッセージ
        if (this.game.showMessage) {
            this.game.showMessage(`${building.name}が完成しました！`, 'success');
        }
    }
    
    // イベントハンドラ
    onMouseMove(event) {
        if (!this.buildMode || !this.previewMesh) return;
        
        const gridPos = this.getGridPosition(event.clientX, event.clientY);
        this.previewMesh.position.x = gridPos.x;
        this.previewMesh.position.z = gridPos.z;
        
        // 配置可能性をチェック
        this.validPlacement = this.canPlaceBuilding(this.selectedBuildingType, gridPos.x, gridPos.z);
        
        // プレビューの色を変更
        if (this.validPlacement) {
            this.previewMesh.material.color.setHex(BUILDING_VISUALS[this.selectedBuildingType].color);
        } else {
            this.previewMesh.material.color.setHex(0xff0000);
        }
    }
    
    onMouseClick(event) {
        // 建設モードの場合
        if (this.buildMode && this.validPlacement) {
            const gridPos = this.getGridPosition(event.clientX, event.clientY);
            this.placeBuilding(this.selectedBuildingType, gridPos.x, gridPos.z);
            
            // 続けて配置できるようにする（Shiftキーを押していない場合は終了）
            if (!event.shiftKey) {
                this.exitBuildMode();
            }
            return;
        }
        
        // 建物選択モード
        if (!this.buildMode && event.button === 0) { // 左クリック
            this.checkBuildingSelection(event.clientX, event.clientY);
        }
    }
    
    checkBuildingSelection(mouseX, mouseY) {
        // マウス座標を正規化
        this.mouse.x = (mouseX / window.innerWidth) * 2 - 1;
        this.mouse.y = -(mouseY / window.innerHeight) * 2 + 1;
        
        // レイキャスト
        this.raycaster.setFromCamera(this.mouse, this.game.camera);
        
        // 建物のメッシュを収集
        const buildingMeshes = [];
        for (const building of this.buildings.values()) {
            if (building.mesh) {
                buildingMeshes.push(building.mesh);
            }
        }
        
        // 交差判定
        const intersects = this.raycaster.intersectObjects(buildingMeshes);
        
        if (intersects.length > 0) {
            // 最も近い建物を選択
            const selectedMesh = intersects[0].object;
            
            // メッシュから建物を特定
            for (const building of this.buildings.values()) {
                if (building.mesh === selectedMesh) {
                    this.selectBuilding(building);
                    break;
                }
            }
        } else {
            // 何もクリックしていない場合は選択解除
            this.deselectBuilding();
        }
    }
    
    selectBuilding(building) {
        // 前の選択を解除
        this.deselectBuilding();
        
        this.selectedBuilding = building;
        
        // ハイライト表示
        this.createHighlight(building);
        
        // 情報パネルを表示
        if (this.game.components.buildingInfoPanel) {
            this.game.components.buildingInfoPanel.show(building);
        }
    }
    
    deselectBuilding() {
        this.selectedBuilding = null;
        
        // ハイライトを削除
        if (this.highlightMesh) {
            this.game.surfaceScene.remove(this.highlightMesh);
            this.highlightMesh = null;
        }
        
        // 情報パネルを非表示
        if (this.game.components.buildingInfoPanel) {
            this.game.components.buildingInfoPanel.hide();
        }
    }
    
    createHighlight(building) {
        // ハイライト用のジオメトリを作成
        const visual = BUILDING_VISUALS[building.type];
        let geometry;
        
        switch (visual.geometry) {
            case 'box':
                geometry = new THREE.BoxGeometry(
                    visual.size.x * 1.1,
                    visual.size.y * 1.1,
                    visual.size.z * 1.1
                );
                break;
            case 'cylinder':
                geometry = new THREE.CylinderGeometry(
                    visual.size.radius * 1.1,
                    visual.size.radius * 1.1,
                    visual.size.height * 1.1,
                    16
                );
                break;
            case 'sphere':
                geometry = new THREE.SphereGeometry(visual.size.radius * 1.1, 16, 16);
                break;
            case 'cone':
                geometry = new THREE.ConeGeometry(
                    visual.size.radius * 1.1,
                    visual.size.height * 1.1,
                    8
                );
                break;
            default:
                geometry = new THREE.BoxGeometry(4.4, 4.4, 4.4);
        }
        
        // ハイライトマテリアル
        const material = new THREE.MeshBasicMaterial({
            color: 0x00ffff,
            transparent: true,
            opacity: 0.3,
            side: THREE.BackSide
        });
        
        this.highlightMesh = new THREE.Mesh(geometry, material);
        this.highlightMesh.position.copy(building.mesh.position);
        
        // レベルに応じてスケール調整
        if (building.level > 1) {
            const scale = 1 + (building.level - 1) * 0.2;
            this.highlightMesh.scale.set(scale, scale, scale);
        }
        
        this.game.surfaceScene.add(this.highlightMesh);
        
        // ハイライトアニメーション
        const animate = () => {
            if (!this.highlightMesh || this.selectedBuilding !== building) return;
            
            const time = Date.now() * 0.002;
            this.highlightMesh.material.opacity = 0.3 + Math.sin(time) * 0.1;
            
            requestAnimationFrame(animate);
        };
        animate();
    }
    
    onKeyDown(event) {
        if (event.key === 'Escape' && this.buildMode) {
            this.exitBuildMode();
        }
    }
    
    // セーブ/ロード用
    serialize() {
        const data = {
            buildings: []
        };
        
        for (const building of this.buildings.values()) {
            data.buildings.push({
                id: building.id,
                type: building.type,
                position: building.position,
                level: building.level,
                isConstructing: building.isConstructing,
                constructionTime: building.constructionTime,
                constructionStartTime: building.constructionStartTime
            });
        }
        
        return data;
    }
    
    deserialize(data) {
        // 既存の建物をクリア
        for (const building of this.buildings.values()) {
            this.removeBuilding(building.id);
        }
        
        // 建物を復元
        for (const buildingData of data.buildings) {
            // メッシュを作成して配置
            const visual = BUILDING_VISUALS[buildingData.type];
            let geometry;
            switch (visual.geometry) {
                case 'box':
                    geometry = new THREE.BoxGeometry(visual.size.x, visual.size.y, visual.size.z);
                    break;
                case 'cylinder':
                    geometry = new THREE.CylinderGeometry(visual.size.radius, visual.size.radius, visual.size.height, 16);
                    break;
                case 'sphere':
                    geometry = new THREE.SphereGeometry(visual.size.radius, 16, 16);
                    break;
                case 'cone':
                    geometry = new THREE.ConeGeometry(visual.size.radius, visual.size.height, 8);
                    break;
                default:
                    geometry = new THREE.BoxGeometry(4, 4, 4);
            }
            
            const material = new THREE.MeshStandardMaterial({
                color: visual.color,
                emissive: visual.emissive
            });
            
            const mesh = new THREE.Mesh(geometry, material);
            mesh.position.set(buildingData.position.x, visual.size.y ? visual.size.y / 2 : 2, buildingData.position.z);
            mesh.castShadow = true;
            mesh.receiveShadow = true;
            this.game.surfaceScene.add(mesh);
            
            // 建物オブジェクトを復元
            const building = {
                ...buildingData,
                mesh: mesh,
                lastProductionTime: Date.now()
            };
            
            this.buildings.set(building.id, building);
            this.grid.set(`${building.position.x},${building.position.z}`, building);
            
            // レベルに応じてスケール調整
            if (building.level > 1) {
                const scale = 1 + (building.level - 1) * 0.2;
                mesh.scale.set(scale, scale, scale);
            }
        }
        
        this.nextBuildingId = Math.max(...data.buildings.map(b => b.id)) + 1;
    }
}