import * as THREE from 'three';

export class ResourceNodeSystem {
    constructor(game) {
        this.game = game;
        
        // 資源ノードの設定
        this.nodes = new Map();
        this.nodeTypes = {
            iron: {
                color: 0x8B4513,
                emissive: 0xFF4500,
                baseProduction: 5,
                size: { min: 1, max: 2 },
                respawnTime: 60000 // 60秒
            },
            energy: {
                color: 0x00FF00,
                emissive: 0x00FF00,
                baseProduction: 3,
                size: { min: 0.8, max: 1.5 },
                respawnTime: 45000 // 45秒
            },
            crystal: {
                color: 0x87CEEB,
                emissive: 0x00FFFF,
                baseProduction: 2,
                size: { min: 1.2, max: 1.8 },
                respawnTime: 90000 // 90秒
            }
        };
        
        // ノード相互作用設定
        this.interactionRange = 20;
        this.synergyBonus = 0.5; // 近くに同じタイプのノードがある場合のボーナス
        this.diversityBonus = 0.3; // 近くに異なるタイプのノードがある場合のボーナス
        
        // 採掘機との相互作用
        this.miningBoostRange = 15;
        this.miningBoostMultiplier = 2;
        
        this.init();
    }
    
    init() {
        // 初期資源ノードを生成
        this.generateInitialNodes();
    }
    
    generateInitialNodes() {
        const nodeCount = {
            iron: 8,
            energy: 6,
            crystal: 4
        };
        
        Object.entries(nodeCount).forEach(([type, count]) => {
            for (let i = 0; i < count; i++) {
                this.createResourceNode(type);
            }
        });
    }
    
    createResourceNode(type, position = null) {
        const config = this.nodeTypes[type];
        if (!config) return null;
        
        // 位置を決定
        if (!position) {
            position = this.findSuitablePosition(type);
        }
        
        // ノードのメッシュを作成
        const size = config.size.min + Math.random() * (config.size.max - config.size.min);
        const geometry = this.createNodeGeometry(type, size);
        const material = new THREE.MeshStandardMaterial({
            color: config.color,
            emissive: config.emissive,
            emissiveIntensity: 0.3,
            metalness: 0.7,
            roughness: 0.3
        });
        
        const node = new THREE.Mesh(geometry, material);
        node.position.copy(position);
        node.castShadow = true;
        node.receiveShadow = true;
        
        // ノードデータを設定
        node.userData = {
            id: `node_${type}_${Date.now()}_${Math.random()}`,
            type: type,
            resourceType: type,
            baseProduction: config.baseProduction,
            currentProduction: config.baseProduction,
            size: size,
            depleted: false,
            respawnTime: config.respawnTime,
            nearbyNodes: new Set(),
            nearbyBuildings: new Set()
        };
        
        // アニメーション用の初期値
        node.userData.animationOffset = Math.random() * Math.PI * 2;
        
        // ノードを登録
        this.nodes.set(node.userData.id, node);
        
        // シーンに追加
        if (this.game.surfaceScene) {
            this.game.surfaceScene.add(node);
        }
        
        // 相互作用を更新
        this.updateNodeInteractions(node);
        
        return node;
    }
    
    createNodeGeometry(type, size) {
        switch (type) {
            case 'iron':
                // 鉄鉱石は不規則な形状
                return new THREE.DodecahedronGeometry(size, 0);
                
            case 'energy':
                // エネルギーは結晶形状
                return new THREE.OctahedronGeometry(size, 0);
                
            case 'crystal':
                // クリスタルは細長い結晶
                const geometry = new THREE.CylinderGeometry(size * 0.3, size * 0.5, size * 2, 6);
                geometry.rotateZ(Math.random() * 0.3 - 0.15);
                return geometry;
                
            default:
                return new THREE.SphereGeometry(size, 8, 6);
        }
    }
    
    findSuitablePosition(type) {
        const maxAttempts = 50;
        let attempts = 0;
        
        while (attempts < maxAttempts) {
            const angle = Math.random() * Math.PI * 2;
            const distance = 20 + Math.random() * 60;
            const position = new THREE.Vector3(
                Math.cos(angle) * distance,
                0,
                Math.sin(angle) * distance
            );
            
            // 他のノードや建物から適切な距離があるかチェック
            let suitable = true;
            
            // 既存のノードとの距離をチェック
            for (const [id, node] of this.nodes) {
                if (node.position.distanceTo(position) < 8) {
                    suitable = false;
                    break;
                }
            }
            
            // 建物との距離をチェック
            if (suitable && this.game.systems.building) {
                for (const building of this.game.systems.building.buildings.values()) {
                    if (building.position.distanceTo(position) < 10) {
                        suitable = false;
                        break;
                    }
                }
            }
            
            if (suitable) {
                return position;
            }
            
            attempts++;
        }
        
        // 適切な位置が見つからない場合はランダムな位置を返す
        return new THREE.Vector3(
            (Math.random() - 0.5) * 100,
            0,
            (Math.random() - 0.5) * 100
        );
    }
    
    update(deltaTime) {
        // 各ノードを更新
        for (const [id, node] of this.nodes) {
            if (!node.userData.depleted) {
                // アニメーション
                this.animateNode(node, deltaTime);
                
                // 生産量の更新
                this.updateNodeProduction(node);
                
                // 近くの採掘機をチェック
                this.checkMiningInteraction(node);
            }
        }
        
        // 枯渇したノードの再生成をチェック
        this.checkNodeRespawn();
    }
    
    animateNode(node, deltaTime) {
        // 浮遊アニメーション
        const time = Date.now() * 0.001 + node.userData.animationOffset;
        node.position.y = Math.sin(time) * 0.2 + 0.5;
        
        // 回転アニメーション
        node.rotation.y += deltaTime * 0.5;
        
        // パルスエフェクト（生産量に応じて）
        const productionRatio = node.userData.currentProduction / node.userData.baseProduction;
        const pulseIntensity = 0.3 + productionRatio * 0.4;
        node.material.emissiveIntensity = pulseIntensity + Math.sin(time * 3) * 0.1;
    }
    
    updateNodeInteractions(targetNode) {
        // 近くのノードを検出
        targetNode.userData.nearbyNodes.clear();
        
        for (const [id, node] of this.nodes) {
            if (id === targetNode.userData.id) continue;
            
            const distance = targetNode.position.distanceTo(node.position);
            if (distance <= this.interactionRange) {
                targetNode.userData.nearbyNodes.add(node);
            }
        }
        
        // 全てのノードの生産量を更新
        for (const [id, node] of this.nodes) {
            this.updateNodeProduction(node);
        }
    }
    
    updateNodeProduction(node) {
        if (node.userData.depleted) return;
        
        let productionMultiplier = 1;
        
        // 近くの同じタイプのノードによるシナジーボーナス
        let sameTypeCount = 0;
        let differentTypeCount = 0;
        
        for (const nearbyNode of node.userData.nearbyNodes) {
            if (nearbyNode.userData.type === node.userData.type) {
                sameTypeCount++;
            } else {
                differentTypeCount++;
            }
        }
        
        // シナジーボーナス
        productionMultiplier += sameTypeCount * this.synergyBonus;
        
        // 多様性ボーナス
        productionMultiplier += differentTypeCount * this.diversityBonus;
        
        // 最大3倍まで
        productionMultiplier = Math.min(productionMultiplier, 3);
        
        node.userData.currentProduction = node.userData.baseProduction * productionMultiplier;
    }
    
    checkMiningInteraction(node) {
        if (!this.game.systems.building) return;
        
        let hasMiningBoost = false;
        
        // 近くの採掘施設をチェック
        for (const building of this.game.systems.building.buildings.values()) {
            if (building.userData && building.userData.buildingType === 'mine') {
                const distance = node.position.distanceTo(building.position);
                if (distance <= this.miningBoostRange) {
                    hasMiningBoost = true;
                    break;
                }
            }
        }
        
        // 採掘ブーストの視覚的フィードバック
        if (hasMiningBoost && !node.userData.miningBoost) {
            node.userData.miningBoost = true;
            this.createMiningBoostEffect(node);
        } else if (!hasMiningBoost && node.userData.miningBoost) {
            node.userData.miningBoost = false;
        }
    }
    
    createMiningBoostEffect(node) {
        // リング状のエフェクトを作成
        const geometry = new THREE.RingGeometry(2, 2.5, 32);
        const material = new THREE.MeshBasicMaterial({
            color: 0x00ff00,
            transparent: true,
            opacity: 0.5,
            side: THREE.DoubleSide
        });
        
        const ring = new THREE.Mesh(geometry, material);
        ring.position.copy(node.position);
        ring.position.y = 0.1;
        ring.rotation.x = -Math.PI / 2;
        
        if (this.game.surfaceScene) {
            this.game.surfaceScene.add(ring);
        }
        
        // アニメーション
        const startTime = Date.now();
        const animate = () => {
            const elapsed = (Date.now() - startTime) / 1000;
            
            if (elapsed > 2 || !node.userData.miningBoost) {
                this.game.surfaceScene.remove(ring);
                return;
            }
            
            ring.scale.set(1 + elapsed, 1 + elapsed, 1);
            material.opacity = 0.5 * (1 - elapsed / 2);
            
            requestAnimationFrame(animate);
        };
        
        animate();
    }
    
    harvestNode(node, amount = null) {
        if (node.userData.depleted) return 0;
        
        // 採掘量を決定
        const baseAmount = amount || node.userData.currentProduction;
        let harvestAmount = baseAmount;
        
        // 採掘ブーストがある場合
        if (node.userData.miningBoost) {
            harvestAmount *= this.miningBoostMultiplier;
        }
        
        // ノードを枯渇させる
        node.userData.depleted = true;
        node.userData.depletionTime = Date.now();
        
        // 視覚的フィードバック
        this.createHarvestEffect(node);
        
        // ノードを非表示にする
        node.visible = false;
        
        return Math.floor(harvestAmount);
    }
    
    createHarvestEffect(node) {
        // パーティクルエフェクト
        const particleCount = 30;
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        const colors = new Float32Array(particleCount * 3);
        
        const color = new THREE.Color(node.material.emissive);
        
        for (let i = 0; i < particleCount; i++) {
            positions[i * 3] = node.position.x + (Math.random() - 0.5) * 2;
            positions[i * 3 + 1] = node.position.y + Math.random() * 2;
            positions[i * 3 + 2] = node.position.z + (Math.random() - 0.5) * 2;
            
            colors[i * 3] = color.r;
            colors[i * 3 + 1] = color.g;
            colors[i * 3 + 2] = color.b;
        }
        
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        
        const material = new THREE.PointsMaterial({
            size: 0.3,
            vertexColors: true,
            transparent: true,
            opacity: 1
        });
        
        const particles = new THREE.Points(geometry, material);
        
        if (this.game.surfaceScene) {
            this.game.surfaceScene.add(particles);
        }
        
        // アニメーション
        const startTime = Date.now();
        const animate = () => {
            const elapsed = (Date.now() - startTime) / 1000;
            
            if (elapsed > 2) {
                this.game.surfaceScene.remove(particles);
                return;
            }
            
            // パーティクルを上昇させる
            const positions = geometry.attributes.position.array;
            for (let i = 0; i < particleCount; i++) {
                positions[i * 3 + 1] += 0.05;
            }
            geometry.attributes.position.needsUpdate = true;
            
            material.opacity = 1 - elapsed / 2;
            
            requestAnimationFrame(animate);
        };
        
        animate();
    }
    
    checkNodeRespawn() {
        const now = Date.now();
        
        for (const [id, node] of this.nodes) {
            if (node.userData.depleted && node.userData.depletionTime) {
                const timeSinceDepleted = now - node.userData.depletionTime;
                
                if (timeSinceDepleted >= node.userData.respawnTime) {
                    // ノードを再生成
                    this.respawnNode(node);
                }
            }
        }
    }
    
    respawnNode(node) {
        node.userData.depleted = false;
        node.userData.depletionTime = null;
        node.visible = true;
        
        // リスポーンエフェクト
        this.createRespawnEffect(node);
        
        // 相互作用を再計算
        this.updateNodeInteractions(node);
        
        console.log(`資源ノード再生成: ${node.userData.type}`);
    }
    
    createRespawnEffect(node) {
        // 光の柱エフェクト
        const geometry = new THREE.CylinderGeometry(0.5, 2, 10, 8);
        const material = new THREE.MeshBasicMaterial({
            color: node.material.emissive,
            transparent: true,
            opacity: 0.5
        });
        
        const beam = new THREE.Mesh(geometry, material);
        beam.position.copy(node.position);
        beam.position.y = 5;
        
        if (this.game.surfaceScene) {
            this.game.surfaceScene.add(beam);
        }
        
        // アニメーション
        const startTime = Date.now();
        const animate = () => {
            const elapsed = (Date.now() - startTime) / 1000;
            
            if (elapsed > 1.5) {
                this.game.surfaceScene.remove(beam);
                return;
            }
            
            beam.scale.y = 1 - elapsed / 1.5;
            beam.position.y = 5 * (1 - elapsed / 1.5);
            material.opacity = 0.5 * (1 - elapsed / 1.5);
            
            requestAnimationFrame(animate);
        };
        
        animate();
    }
    
    // 最も近い資源ノードを取得
    getNearestNode(position, type = null) {
        let nearestNode = null;
        let nearestDistance = Infinity;
        
        for (const [id, node] of this.nodes) {
            if (node.userData.depleted) continue;
            if (type && node.userData.type !== type) continue;
            
            const distance = position.distanceTo(node.position);
            if (distance < nearestDistance) {
                nearestDistance = distance;
                nearestNode = node;
            }
        }
        
        return nearestNode;
    }
    
    // 範囲内のノードを取得
    getNodesInRange(position, range) {
        const nodesInRange = [];
        
        for (const [id, node] of this.nodes) {
            if (node.userData.depleted) continue;
            
            const distance = position.distanceTo(node.position);
            if (distance <= range) {
                nodesInRange.push({
                    node: node,
                    distance: distance
                });
            }
        }
        
        // 距離でソート
        nodesInRange.sort((a, b) => a.distance - b.distance);
        
        return nodesInRange.map(item => item.node);
    }
    
    // シリアライズ
    serialize() {
        const data = {
            nodes: []
        };
        
        for (const [id, node] of this.nodes) {
            data.nodes.push({
                id: node.userData.id,
                type: node.userData.type,
                position: {
                    x: node.position.x,
                    y: node.position.y,
                    z: node.position.z
                },
                depleted: node.userData.depleted,
                depletionTime: node.userData.depletionTime,
                size: node.userData.size
            });
        }
        
        return data;
    }
    
    // デシリアライズ
    deserialize(data) {
        // 既存のノードをクリア
        for (const [id, node] of this.nodes) {
            if (this.game.surfaceScene) {
                this.game.surfaceScene.remove(node);
            }
        }
        this.nodes.clear();
        
        // ノードを復元
        if (data.nodes) {
            data.nodes.forEach(nodeData => {
                const position = new THREE.Vector3(
                    nodeData.position.x,
                    nodeData.position.y,
                    nodeData.position.z
                );
                
                const node = this.createResourceNode(nodeData.type, position);
                if (node) {
                    node.userData.id = nodeData.id;
                    node.userData.depleted = nodeData.depleted;
                    node.userData.depletionTime = nodeData.depletionTime;
                    node.userData.size = nodeData.size;
                    
                    if (nodeData.depleted) {
                        node.visible = false;
                    }
                }
            });
        }
        
        // 相互作用を再計算
        for (const [id, node] of this.nodes) {
            this.updateNodeInteractions(node);
        }
    }
}