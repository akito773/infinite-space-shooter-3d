// アセット管理システム - メモリ効率の最適化

export class AssetManager {
    constructor() {
        // 読み込み済みアセット
        this.loadedGeometries = new Map();
        this.loadedTextures = new Map();
        this.loadedMaterials = new Map();
        this.loadedMeshes = new Map();
        
        // 使用カウンタ（参照カウンタ）
        this.geometryRefCount = new Map();
        this.textureRefCount = new Map();
        this.materialRefCount = new Map();
        
        // ガベージコレクションの閾値
        this.maxUnusedTime = 30000; // 30秒未使用でGC対象
        this.lastUsedTime = new Map();
        
        // メモリ監視
        this.memoryStats = {
            geometries: 0,
            textures: 0,
            materials: 0,
            meshes: 0
        };
        
        this.init();
    }
    
    init() {
        // 定期的なガベージコレクション
        setInterval(() => {
            this.performGarbageCollection();
        }, 10000); // 10秒ごと
        
        // デバッグ用メモリ監視
        if (window.game?.debugMode) {
            setInterval(() => {
                this.logMemoryStats();
            }, 5000);
        }
    }
    
    // ジオメトリの取得（キャッシュ付き）
    getGeometry(type, params = {}) {
        const key = this.generateGeometryKey(type, params);
        
        if (this.loadedGeometries.has(key)) {
            this.addGeometryRef(key);
            this.updateLastUsed(key);
            return this.loadedGeometries.get(key);
        }
        
        // 新しいジオメトリを作成
        const geometry = this.createGeometry(type, params);
        this.loadedGeometries.set(key, geometry);
        this.addGeometryRef(key);
        this.updateLastUsed(key);
        
        return geometry;
    }
    
    generateGeometryKey(type, params) {
        // パラメータを文字列化してキーを生成
        const paramStr = JSON.stringify(params);
        return `${type}_${paramStr}`;
    }
    
    createGeometry(type, params) {
        switch (type) {
            case 'sphere':
                return new THREE.SphereGeometry(
                    params.radius || 1,
                    params.widthSegments || 32,
                    params.heightSegments || 16
                );
                
            case 'box':
                return new THREE.BoxGeometry(
                    params.width || 1,
                    params.height || 1,
                    params.depth || 1
                );
                
            case 'cylinder':
                return new THREE.CylinderGeometry(
                    params.radiusTop || 1,
                    params.radiusBottom || 1,
                    params.height || 1,
                    params.radialSegments || 32
                );
                
            case 'torus':
                return new THREE.TorusGeometry(
                    params.radius || 1,
                    params.tube || 0.4,
                    params.radialSegments || 16,
                    params.tubularSegments || 100
                );
                
            case 'icosahedron':
                return new THREE.IcosahedronGeometry(
                    params.radius || 1,
                    params.detail || 0
                );
                
            case 'plane':
                return new THREE.PlaneGeometry(
                    params.width || 1,
                    params.height || 1,
                    params.widthSegments || 1,
                    params.heightSegments || 1
                );
                
            case 'ring':
                return new THREE.RingGeometry(
                    params.innerRadius || 0.5,
                    params.outerRadius || 1,
                    params.thetaSegments || 32
                );
                
            default:
                console.warn(`Unknown geometry type: ${type}`);
                return new THREE.BoxGeometry(1, 1, 1);
        }
    }
    
    // マテリアルの取得（キャッシュ付き）
    getMaterial(type, params = {}) {
        const key = this.generateMaterialKey(type, params);
        
        if (this.loadedMaterials.has(key)) {
            this.addMaterialRef(key);
            this.updateLastUsed(key);
            return this.loadedMaterials.get(key);
        }
        
        // 新しいマテリアルを作成
        const material = this.createMaterial(type, params);
        this.loadedMaterials.set(key, material);
        this.addMaterialRef(key);
        this.updateLastUsed(key);
        
        return material;
    }
    
    generateMaterialKey(type, params) {
        // カラーや数値パラメータのみをキーに使用
        const keyParams = {
            color: params.color,
            emissive: params.emissive,
            metalness: params.metalness,
            roughness: params.roughness,
            transparent: params.transparent,
            opacity: params.opacity
        };
        const paramStr = JSON.stringify(keyParams);
        return `${type}_${paramStr}`;
    }
    
    createMaterial(type, params) {
        switch (type) {
            case 'basic':
                return new THREE.MeshBasicMaterial(params);
                
            case 'phong':
                return new THREE.MeshPhongMaterial(params);
                
            case 'standard':
                return new THREE.MeshStandardMaterial(params);
                
            case 'lambert':
                return new THREE.MeshLambertMaterial(params);
                
            case 'points':
                return new THREE.PointsMaterial(params);
                
            case 'line':
                return new THREE.LineBasicMaterial(params);
                
            default:
                console.warn(`Unknown material type: ${type}`);
                return new THREE.MeshBasicMaterial(params);
        }
    }
    
    // 参照カウンタ管理
    addGeometryRef(key) {
        const count = this.geometryRefCount.get(key) || 0;
        this.geometryRefCount.set(key, count + 1);
    }
    
    removeGeometryRef(key) {
        const count = this.geometryRefCount.get(key) || 0;
        if (count > 1) {
            this.geometryRefCount.set(key, count - 1);
        } else {
            this.geometryRefCount.delete(key);
            // 参照がなくなったらガベージコレクション候補
            this.markForGC(key, 'geometry');
        }
    }
    
    addMaterialRef(key) {
        const count = this.materialRefCount.get(key) || 0;
        this.materialRefCount.set(key, count + 1);
    }
    
    removeMaterialRef(key) {
        const count = this.materialRefCount.get(key) || 0;
        if (count > 1) {
            this.materialRefCount.set(key, count - 1);
        } else {
            this.materialRefCount.delete(key);
            this.markForGC(key, 'material');
        }
    }
    
    updateLastUsed(key) {
        this.lastUsedTime.set(key, Date.now());
    }
    
    markForGC(key, type) {
        // すぐには削除せず、しばらく待つ
        setTimeout(() => {
            this.checkAndDispose(key, type);
        }, this.maxUnusedTime);
    }
    
    checkAndDispose(key, type) {
        const now = Date.now();
        const lastUsed = this.lastUsedTime.get(key) || 0;
        
        // まだ使用されている場合は削除しない
        if (now - lastUsed < this.maxUnusedTime) return;
        
        // 参照カウンタがある場合は削除しない
        if (type === 'geometry' && this.geometryRefCount.has(key)) return;
        if (type === 'material' && this.materialRefCount.has(key)) return;
        
        // リソースを破棄
        this.disposeResource(key, type);
    }
    
    disposeResource(key, type) {
        switch (type) {
            case 'geometry':
                const geometry = this.loadedGeometries.get(key);
                if (geometry) {
                    geometry.dispose();
                    this.loadedGeometries.delete(key);
                    this.memoryStats.geometries--;
                    console.log(`Disposed geometry: ${key}`);
                }
                break;
                
            case 'material':
                const material = this.loadedMaterials.get(key);
                if (material) {
                    material.dispose();
                    this.loadedMaterials.delete(key);
                    this.memoryStats.materials--;
                    console.log(`Disposed material: ${key}`);
                }
                break;
        }
        
        this.lastUsedTime.delete(key);
    }
    
    // 手動ガベージコレクション
    performGarbageCollection() {
        const now = Date.now();
        const keysToCheck = [];
        
        // 未使用時間が閾値を超えたアセットを検索
        for (const [key, lastUsed] of this.lastUsedTime) {
            if (now - lastUsed > this.maxUnusedTime) {
                keysToCheck.push(key);
            }
        }
        
        // ガベージコレクション実行
        keysToCheck.forEach(key => {
            if (this.loadedGeometries.has(key) && !this.geometryRefCount.has(key)) {
                this.disposeResource(key, 'geometry');
            }
            if (this.loadedMaterials.has(key) && !this.materialRefCount.has(key)) {
                this.disposeResource(key, 'material');
            }
        });
        
        // WebGLのガベージコレクションを促進
        if (window.game?.renderer) {
            window.game.renderer.info.programs?.forEach(program => {
                if (program.usedTimes === 0) {
                    program.destroy();
                }
            });
        }
    }
    
    // 強制的な全リソース解放
    forceDisposeAll() {
        // ジオメトリを全て破棄
        this.loadedGeometries.forEach((geometry, key) => {
            geometry.dispose();
        });
        this.loadedGeometries.clear();
        
        // マテリアルを全て破棄
        this.loadedMaterials.forEach((material, key) => {
            material.dispose();
        });
        this.loadedMaterials.clear();
        
        // テクスチャを全て破棄
        this.loadedTextures.forEach((texture, key) => {
            texture.dispose();
        });
        this.loadedTextures.clear();
        
        // 参照カウンタをリセット
        this.geometryRefCount.clear();
        this.materialRefCount.clear();
        this.textureRefCount.clear();
        this.lastUsedTime.clear();
        
        // メモリ統計をリセット
        this.memoryStats = {
            geometries: 0,
            textures: 0,
            materials: 0,
            meshes: 0
        };
        
        console.log('All assets forcefully disposed');
    }
    
    // メッシュの作成（アセット管理付き）
    createMesh(geometryType, geometryParams, materialType, materialParams) {
        const geometry = this.getGeometry(geometryType, geometryParams);
        const material = this.getMaterial(materialType, materialParams);
        
        const mesh = new THREE.Mesh(geometry, material);
        
        // メッシュにクリーンアップ情報を付与
        mesh.userData.assetManager = this;
        mesh.userData.geometryKey = this.generateGeometryKey(geometryType, geometryParams);
        mesh.userData.materialKey = this.generateMaterialKey(materialType, materialParams);
        
        this.memoryStats.meshes++;
        
        return mesh;
    }
    
    // メッシュの破棄
    disposeMesh(mesh) {
        if (mesh.userData.assetManager === this) {
            if (mesh.userData.geometryKey) {
                this.removeGeometryRef(mesh.userData.geometryKey);
            }
            if (mesh.userData.materialKey) {
                this.removeMaterialRef(mesh.userData.materialKey);
            }
            this.memoryStats.meshes--;
        }
    }
    
    // メモリ使用状況の監視
    logMemoryStats() {
        const stats = {
            loadedGeometries: this.loadedGeometries.size,
            loadedMaterials: this.loadedMaterials.size,
            loadedTextures: this.loadedTextures.size,
            activeMeshes: this.memoryStats.meshes,
            totalRefs: {
                geometries: Array.from(this.geometryRefCount.values()).reduce((a, b) => a + b, 0),
                materials: Array.from(this.materialRefCount.values()).reduce((a, b) => a + b, 0)
            }
        };
        
        console.log('AssetManager Memory Stats:', stats);
        
        // WebGLの統計も表示
        if (window.game?.renderer) {
            const info = window.game.renderer.info;
            console.log('WebGL Stats:', {
                geometries: info.memory.geometries,
                textures: info.memory.textures,
                drawCalls: info.render.calls,
                triangles: info.render.triangles
            });
        }
    }
    
    // プリロード機能
    preloadAssets(assetList) {
        const promises = assetList.map(asset => {
            return new Promise((resolve) => {
                switch (asset.type) {
                    case 'geometry':
                        this.getGeometry(asset.geometryType, asset.params);
                        break;
                    case 'material':
                        this.getMaterial(asset.materialType, asset.params);
                        break;
                }
                resolve();
            });
        });
        
        return Promise.all(promises);
    }
}