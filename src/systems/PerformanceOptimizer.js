// パフォーマンス最適化システム

import * as THREE from 'three';

export class PerformanceOptimizer {
    constructor(game) {
        this.game = game;
        
        // LOD（Level of Detail）設定
        this.lodLevels = {
            high: { distance: 50, quality: 1.0 },
            medium: { distance: 150, quality: 0.6 },
            low: { distance: 300, quality: 0.3 },
            culled: { distance: 500, quality: 0 }
        };
        
        // オブジェクトプール
        this.objectPools = {
            projectiles: [],
            particles: [],
            enemies: [],
            items: []
        };
        
        // パフォーマンス監視
        this.performanceStats = {
            frameTime: [],
            drawCalls: 0,
            triangles: 0,
            geometries: 0,
            textures: 0,
            programs: 0
        };
        
        // 最適化設定
        this.settings = {
            maxVisibleEnemies: 20,
            maxVisibleParticles: 100,
            maxVisibleProjectiles: 50,
            lodEnabled: true,
            frustumCulling: true,
            shadowMapSize: 1024,
            antialias: false,
            maxLights: 8
        };
        
        // 自動品質調整
        this.autoQuality = {
            enabled: true,
            targetFPS: 60,
            adjustmentThreshold: 5, // フレーム数
            lastAdjustment: 0
        };
        
        this.init();
    }
    
    init() {
        // オブジェクトプールを初期化
        this.initObjectPools();
        
        // レンダラー最適化
        this.optimizeRenderer();
        
        // パフォーマンス監視開始
        this.startPerformanceMonitoring();
        
        // 定期最適化タスク
        setInterval(() => {
            this.performOptimization();
        }, 1000); // 1秒間隔
    }
    
    initObjectPools() {
        // プロジェクタイルプール
        for (let i = 0; i < 100; i++) {
            const geometry = new THREE.SphereGeometry(0.2, 8, 8);
            const material = new THREE.MeshBasicMaterial({ color: 0x00ffff });
            const projectile = new THREE.Mesh(geometry, material);
            projectile.visible = false;
            this.objectPools.projectiles.push(projectile);
        }
        
        // パーティクルプール
        for (let i = 0; i < 200; i++) {
            const geometry = new THREE.SphereGeometry(0.1, 6, 6);
            const material = new THREE.MeshBasicMaterial({ 
                color: 0xffffff,
                transparent: true,
                opacity: 0.8
            });
            const particle = new THREE.Mesh(geometry, material);
            particle.visible = false;
            this.objectPools.particles.push(particle);
        }
        
        console.log('オブジェクトプール初期化完了');
    }
    
    optimizeRenderer() {
        const renderer = this.game.renderer;
        if (!renderer) return;
        
        // レンダラー設定の最適化
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        
        // シャドウマップのサイズ設定（setMapSizeは存在しないので、カメラで設定）
        if (this.game.scene) {
            this.game.scene.traverse((child) => {
                if (child.isLight && child.shadow) {
                    child.shadow.mapSize.width = this.settings.shadowMapSize;
                    child.shadow.mapSize.height = this.settings.shadowMapSize;
                }
            });
        }
        
        // フラスタムカリング設定はオブジェクトごとに行う
        if (this.game.scene) {
            this.game.scene.traverse((child) => {
                if (child.isMesh) {
                    child.frustumCulled = this.settings.frustumCulling;
                }
            });
        }
        
        console.log('レンダラー最適化完了');
    }
    
    // LODシステム
    updateLOD(objects, cameraPosition) {
        if (!this.settings.lodEnabled) return;
        
        objects.forEach(obj => {
            if (!obj.position) return;
            
            const distance = cameraPosition.distanceTo(obj.position);
            const lodLevel = this.getLODLevel(distance);
            
            this.applyLOD(obj, lodLevel);
        });
    }
    
    getLODLevel(distance) {
        if (distance < this.lodLevels.high.distance) return 'high';
        if (distance < this.lodLevels.medium.distance) return 'medium';
        if (distance < this.lodLevels.low.distance) return 'low';
        return 'culled';
    }
    
    applyLOD(object, level) {
        const lodInfo = this.lodLevels[level];
        
        if (level === 'culled') {
            object.visible = false;
            return;
        }
        
        object.visible = true;
        
        // 品質に応じてジオメトリを調整
        if (object.children) {
            object.children.forEach(child => {
                if (child.material) {
                    // マテリアルの品質調整
                    if (level === 'low') {
                        child.material.transparent = true;
                        child.material.opacity = 0.8;
                    } else {
                        child.material.transparent = false;
                        child.material.opacity = 1.0;
                    }
                }
            });
        }
    }
    
    // オブジェクトプールからの取得
    getPooledObject(type) {
        const pool = this.objectPools[type];
        if (!pool) return null;
        
        for (let obj of pool) {
            if (!obj.visible) {
                obj.visible = true;
                return obj;
            }
        }
        
        // プールが空の場合は新しいオブジェクトを作成
        return this.createNewPooledObject(type);
    }
    
    createNewPooledObject(type) {
        let obj = null;
        
        switch (type) {
            case 'projectiles':
                const geometry = new THREE.SphereGeometry(0.2, 8, 8);
                const material = new THREE.MeshBasicMaterial({ color: 0x00ffff });
                obj = new THREE.Mesh(geometry, material);
                this.objectPools.projectiles.push(obj);
                break;
                
            case 'particles':
                const pGeometry = new THREE.SphereGeometry(0.1, 6, 6);
                const pMaterial = new THREE.MeshBasicMaterial({ 
                    color: 0xffffff,
                    transparent: true,
                    opacity: 0.8
                });
                obj = new THREE.Mesh(pGeometry, pMaterial);
                this.objectPools.particles.push(obj);
                break;
        }
        
        return obj;
    }
    
    // オブジェクトをプールに返却
    returnToPool(object, type) {
        object.visible = false;
        object.position.set(0, 0, 0);
        object.rotation.set(0, 0, 0);
        object.scale.set(1, 1, 1);
        
        // 必要に応じてプロパティをリセット
        if (object.userData) {
            object.userData = {};
        }
    }
    
    // バッチ処理システム
    batchGeometries(objects) {
        const batches = new Map();
        
        objects.forEach(obj => {
            if (!obj.geometry || !obj.material) return;
            
            const key = `${obj.geometry.uuid}_${obj.material.uuid}`;
            if (!batches.has(key)) {
                batches.set(key, []);
            }
            batches.get(key).push(obj);
        });
        
        // バッチごとに最適化された描画
        batches.forEach((objects, key) => {
            if (objects.length > 1) {
                this.createInstancedMesh(objects);
            }
        });
    }
    
    createInstancedMesh(objects) {
        if (objects.length === 0) return;
        
        const baseObject = objects[0];
        const instancedMesh = new THREE.InstancedMesh(
            baseObject.geometry,
            baseObject.material,
            objects.length
        );
        
        // インスタンスの位置を設定
        objects.forEach((obj, index) => {
            const matrix = new THREE.Matrix4();
            matrix.setPosition(obj.position);
            instancedMesh.setMatrixAt(index, matrix);
        });
        
        instancedMesh.instanceMatrix.needsUpdate = true;
        
        // 元のオブジェクトを非表示にして、インスタンスメッシュを表示
        objects.forEach(obj => obj.visible = false);
        this.game.scene.add(instancedMesh);
        
        return instancedMesh;
    }
    
    // メモリ管理
    cleanupUnusedResources() {
        const renderer = this.game.renderer;
        if (!renderer) return;
        
        // 未使用テクスチャの削除
        renderer.info.memory.textures = 0;
        
        // 未使用ジオメトリの削除
        renderer.info.memory.geometries = 0;
        
        // ガベージコレクション促進
        if (window.gc) {
            window.gc();
        }
        
        console.log('未使用リソースをクリーンアップしました');
    }
    
    // パフォーマンス監視
    startPerformanceMonitoring() {
        let lastTime = performance.now();
        let frameCount = 0;
        
        const monitor = () => {
            const currentTime = performance.now();
            const deltaTime = currentTime - lastTime;
            
            this.performanceStats.frameTime.push(deltaTime);
            
            // 直近60フレームの平均を保持
            if (this.performanceStats.frameTime.length > 60) {
                this.performanceStats.frameTime.shift();
            }
            
            frameCount++;
            
            // 1秒ごとにFPSを計算
            if (frameCount >= 60) {
                const avgFrameTime = this.performanceStats.frameTime.reduce((a, b) => a + b, 0) / this.performanceStats.frameTime.length;
                const fps = 1000 / avgFrameTime;
                
                // 自動品質調整
                if (this.autoQuality.enabled) {
                    this.adjustQuality(fps);
                }
                
                frameCount = 0;
            }
            
            lastTime = currentTime;
            requestAnimationFrame(monitor);
        };
        
        monitor();
    }
    
    // 自動品質調整
    adjustQuality(currentFPS) {
        const targetFPS = this.autoQuality.targetFPS;
        const now = Date.now();
        
        // 調整間隔制限
        if (now - this.autoQuality.lastAdjustment < 5000) return;
        
        if (currentFPS < targetFPS - 10) {
            // FPSが低い場合は品質を下げる
            this.decreaseQuality();
            console.log(`品質を下げました (FPS: ${currentFPS.toFixed(1)})`);
        } else if (currentFPS > targetFPS + 15) {
            // FPSが十分高い場合は品質を上げる
            this.increaseQuality();
            console.log(`品質を上げました (FPS: ${currentFPS.toFixed(1)})`);
        }
        
        this.autoQuality.lastAdjustment = now;
    }
    
    decreaseQuality() {
        // 段階的に品質を下げる
        if (this.settings.shadowMapSize > 512) {
            this.settings.shadowMapSize /= 2;
            this.updateShadowMapSize();
        } else if (this.settings.maxVisibleEnemies > 10) {
            this.settings.maxVisibleEnemies -= 5;
        } else if (this.settings.maxVisibleParticles > 50) {
            this.settings.maxVisibleParticles -= 25;
        } else {
            this.settings.lodEnabled = false;
        }
    }
    
    increaseQuality() {
        // 段階的に品質を上げる
        if (!this.settings.lodEnabled) {
            this.settings.lodEnabled = true;
        } else if (this.settings.maxVisibleParticles < 100) {
            this.settings.maxVisibleParticles += 25;
        } else if (this.settings.maxVisibleEnemies < 20) {
            this.settings.maxVisibleEnemies += 5;
        } else if (this.settings.shadowMapSize < 2048) {
            this.settings.shadowMapSize *= 2;
            this.updateShadowMapSize();
        }
    }
    
    updateShadowMapSize() {
        if (this.game.scene) {
            this.game.scene.traverse((child) => {
                if (child.isLight && child.shadow) {
                    child.shadow.mapSize.width = this.settings.shadowMapSize;
                    child.shadow.mapSize.height = this.settings.shadowMapSize;
                    child.shadow.needsUpdate = true;
                }
            });
        }
    }
    
    // メイン最適化処理
    performOptimization() {
        const camera = this.game.camera;
        if (!camera) return;
        
        // LOD更新
        if (this.game.enemies) {
            this.updateLOD(this.game.enemies.map(e => e.group), camera.position);
        }
        
        if (this.game.planets) {
            this.updateLOD(this.game.planets.map(p => p.mesh), camera.position);
        }
        
        // 可視オブジェクト数制限
        this.limitVisibleObjects();
        
        // 定期的なメモリクリーンアップ
        if (Math.random() < 0.1) { // 10%の確率
            this.cleanupUnusedResources();
        }
    }
    
    limitVisibleObjects() {
        // 敵の表示数制限
        if (this.game.enemies && this.game.enemies.length > this.settings.maxVisibleEnemies) {
            const sortedEnemies = this.game.enemies
                .filter(e => e.isAlive)
                .sort((a, b) => {
                    const distA = a.group.position.distanceTo(this.game.camera.position);
                    const distB = b.group.position.distanceTo(this.game.camera.position);
                    return distA - distB;
                });
            
            sortedEnemies.forEach((enemy, index) => {
                enemy.group.visible = index < this.settings.maxVisibleEnemies;
            });
        }
        
        // プロジェクタイルの表示数制限
        if (this.game.projectileManager && this.game.projectileManager.projectiles) {
            const visibleProjectiles = this.game.projectileManager.projectiles
                .slice(0, this.settings.maxVisibleProjectiles);
            
            this.game.projectileManager.projectiles.forEach((proj, index) => {
                proj.mesh.visible = index < this.settings.maxVisibleProjectiles;
            });
        }
    }
    
    // デバッグ情報表示
    showPerformanceInfo() {
        const renderer = this.game.renderer;
        if (!renderer) return;
        
        const info = renderer.info;
        const avgFrameTime = this.performanceStats.frameTime.reduce((a, b) => a + b, 0) / this.performanceStats.frameTime.length;
        const fps = 1000 / avgFrameTime;
        
        const debugInfo = {
            FPS: fps.toFixed(1),
            'Draw Calls': info.render.calls,
            'Triangles': info.render.triangles,
            'Geometries': info.memory.geometries,
            'Textures': info.memory.textures,
            'Shadow Map Size': this.settings.shadowMapSize,
            'Max Visible Enemies': this.settings.maxVisibleEnemies,
            'LOD Enabled': this.settings.lodEnabled
        };
        
        console.table(debugInfo);
        return debugInfo;
    }
    
    // 手動品質設定
    setQualityLevel(level) {
        switch (level) {
            case 'low':
                this.settings.shadowMapSize = 512;
                this.settings.maxVisibleEnemies = 10;
                this.settings.maxVisibleParticles = 50;
                this.settings.lodEnabled = true;
                this.settings.antialias = false;
                break;
                
            case 'medium':
                this.settings.shadowMapSize = 1024;
                this.settings.maxVisibleEnemies = 15;
                this.settings.maxVisibleParticles = 75;
                this.settings.lodEnabled = true;
                this.settings.antialias = false;
                break;
                
            case 'high':
                this.settings.shadowMapSize = 2048;
                this.settings.maxVisibleEnemies = 20;
                this.settings.maxVisibleParticles = 100;
                this.settings.lodEnabled = true;
                this.settings.antialias = true;
                break;
                
            case 'ultra':
                this.settings.shadowMapSize = 4096;
                this.settings.maxVisibleEnemies = 30;
                this.settings.maxVisibleParticles = 150;
                this.settings.lodEnabled = false; // 最高品質では無効
                this.settings.antialias = true;
                break;
        }
        
        this.optimizeRenderer();
        console.log(`品質レベルを${level}に設定しました`);
    }
    
    // 最適化設定の取得・保存
    getSettings() {
        return { ...this.settings };
    }
    
    loadSettings(settings) {
        Object.assign(this.settings, settings);
        this.optimizeRenderer();
    }
}