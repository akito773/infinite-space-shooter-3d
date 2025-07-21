// ZoneManagerのメモリ管理拡張

export class ZoneManagerMemory {
    constructor(zoneManager) {
        this.zoneManager = zoneManager;
        this.assetManager = zoneManager.assetManager;
        
        // ロード/アンロード設定
        this.maxLoadedZones = 3;
        this.preloadDistance = 1;
        
        // パフォーマンス監視
        this.performanceMetrics = {
            loadTime: 0,
            unloadTime: 0,
            memoryUsage: 0
        };
    }
    
    // メモリ管理機能
    async manageMemory(newZoneId) {
        // 最大ロード数を超える場合、古いゾーンをアンロード
        if (this.zoneManager.loadedZones.size >= this.maxLoadedZones) {
            const zonesToUnload = this.selectZonesToUnload(newZoneId);
            
            for (const zoneId of zonesToUnload) {
                await this.unloadZone(zoneId);
            }
        }
    }
    
    selectZonesToUnload(newZoneId) {
        const zonesToUnload = [];
        const connectedZones = this.zoneManager.getZoneConnections(newZoneId);
        
        // 現在のゾーンと新しいゾーンに接続されていないゾーンを優先的にアンロード
        for (const loadedZone of this.zoneManager.loadedZones) {
            if (loadedZone !== this.zoneManager.currentZone && 
                loadedZone !== newZoneId && 
                !connectedZones.includes(loadedZone)) {
                zonesToUnload.push(loadedZone);
            }
        }
        
        // それでも足りない場合は、現在のゾーン以外をアンロード
        if (zonesToUnload.length === 0) {
            for (const loadedZone of this.zoneManager.loadedZones) {
                if (loadedZone !== this.zoneManager.currentZone && loadedZone !== newZoneId) {
                    zonesToUnload.push(loadedZone);
                    break;
                }
            }
        }
        
        return zonesToUnload;
    }
    
    async unloadZone(zoneId) {
        const startTime = performance.now();
        
        if (!this.zoneManager.loadedZones.has(zoneId) || zoneId === this.zoneManager.currentZone) {
            return;
        }
        
        console.log(`Unloading zone: ${zoneId}`);
        
        // ゾーンのオブジェクトを削除
        this.zoneManager.clearZoneObjects(zoneId);
        
        // ロード済みセットから削除
        this.zoneManager.loadedZones.delete(zoneId);
        
        // アセット参照を削除
        this.zoneManager.zoneAssets.delete(zoneId);
        
        // パフォーマンス測定
        const unloadTime = performance.now() - startTime;
        this.performanceMetrics.unloadTime = unloadTime;
        
        console.log(`Zone ${zoneId} unloaded in ${unloadTime.toFixed(2)}ms`);
        
        // ガベージコレクションを促進
        if (this.assetManager) {
            this.assetManager.performGarbageCollection();
        }
    }
    
    // プリロード機能
    schedulePreloading() {
        // 隣接ゾーンを特定
        const adjacentZones = this.zoneManager.getZoneConnections(this.zoneManager.currentZone);
        
        adjacentZones.forEach(zoneId => {
            if (!this.zoneManager.loadedZones.has(zoneId) && 
                !this.zoneManager.preloadingZones.has(zoneId) &&
                this.zoneManager.zones[zoneId]?.unlocked) {
                
                this.preloadZone(zoneId);
            }
        });
    }
    
    async preloadZone(zoneId) {
        this.zoneManager.preloadingZones.add(zoneId);
        
        try {
            console.log(`Preloading zone: ${zoneId}`);
            
            // バックグラウンドでアセットをプリロード
            const zone = this.zoneManager.zones[zoneId];
            if (zone) {
                await this.preloadZoneAssets(zone);
            }
            
        } catch (error) {
            console.error(`Failed to preload zone ${zoneId}:`, error);
        } finally {
            this.zoneManager.preloadingZones.delete(zoneId);
        }
    }
    
    async preloadZoneAssets(zone) {
        const assetList = [];
        
        // 惑星のアセット
        assetList.push({
            type: 'geometry',
            geometryType: 'sphere',
            params: { radius: zone.planetData.radius }
        });
        
        assetList.push({
            type: 'material',
            materialType: 'phong',
            params: { color: zone.planetData.color }
        });
        
        // 衛星のアセット
        zone.satellites.forEach(satellite => {
            if (satellite.discovered) {
                assetList.push({
                    type: 'geometry',
                    geometryType: 'sphere',
                    params: { radius: satellite.radius }
                });
            }
        });
        
        // ワープゲートのアセット
        assetList.push(
            {
                type: 'geometry',
                geometryType: 'torus',
                params: { radius: 50, tube: 5 }
            },
            {
                type: 'material',
                materialType: 'phong',
                params: { color: 0x4488ff, emissive: 0x2244aa }
            }
        );
        
        // アセットをプリロード
        await this.assetManager.preloadAssets(assetList);
        
        console.log(`Preloaded ${assetList.length} assets for zone: ${zone.name}`);
    }
    
    // パフォーマンス監視
    startPerformanceMonitoring() {
        if (!this.zoneManager.game.debugMode) return;
        
        setInterval(() => {
            this.updatePerformanceStats();
        }, 5000);
    }
    
    updatePerformanceStats() {
        const stats = {
            loadedZones: Array.from(this.zoneManager.loadedZones),
            preloadingZones: Array.from(this.zoneManager.preloadingZones),
            loadTime: this.performanceMetrics.loadTime,
            unloadTime: this.performanceMetrics.unloadTime,
            meshCount: {
                total: 0
            }
        };
        
        // ゾーンごとのメッシュ数をカウント
        this.zoneManager.zoneMeshes.forEach((meshes, zoneId) => {
            stats.meshCount[zoneId] = meshes.length;
            stats.meshCount.total += meshes.length;
        });
        
        console.log('ZoneManager Performance Stats:', stats);
    }
}