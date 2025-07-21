// 太陽系ゾーン管理システム

import * as THREE from 'three';
import { AssetManager } from './AssetManager.js';
import { ZoneManagerMemory } from './ZoneManagerMemory.js';

export class ZoneManager {
    constructor(game) {
        this.game = game;
        
        // アセット管理
        this.assetManager = new AssetManager();
        
        // メモリ管理
        this.memoryManager = new ZoneManagerMemory(this);
        
        // ロードされたゾーン管理
        this.loadedZones = new Set(['earth']); // 地球は最初からロード
        this.preloadingZones = new Set();
        this.zoneMeshes = new Map(); // ゾーンごとのメッシュ管理
        this.zoneAssets = new Map(); // ゾーンごとのアセット参照
        
        // ロード/アンロード設定
        this.maxLoadedZones = 3; // 最大3ゾーンまで同時ロード
        this.preloadDistance = 1; // 隣接ゾーンをプリロード
        
        // パフォーマンス監視
        this.performanceMetrics = {
            loadTime: 0,
            unloadTime: 0,
            memoryUsage: 0
        };
        
        // ゾーン定義
        this.zones = {
            earth: {
                id: 'earth',
                name: '地球エリア',
                japaneseName: 'ちきゅうエリア',
                position: 3,
                radius: 5000,
                solarDistance: 1.0, // AU
                description: '人類の故郷。青く美しい水の惑星。',
                unlocked: true,
                discovered: true,
                planetData: {
                    radius: 50,
                    color: 0x4169E1,
                    texture: `${import.meta.env.BASE_URL}assets/earth_texture.png`,
                    atmosphere: true,
                    dayLength: 24,
                    gravity: 1.0,
                    trivia: '太陽系で唯一生命が確認されている惑星'
                },
                satellites: [
                    { name: '月', radius: 15, distance: 200, discovered: true }
                ],
                features: ['spaceStation', 'asteroidField']
            },
            mars: {
                id: 'mars',
                name: '火星エリア',
                japaneseName: 'かせいエリア',
                position: 4,
                radius: 4000,
                solarDistance: 1.52,
                description: '赤い惑星。人類の次なるフロンティア。',
                unlocked: false,
                discovered: false,
                planetData: {
                    radius: 35,
                    color: 0xCD853F,
                    atmosphere: false,
                    dayLength: 24.6,
                    gravity: 0.38,
                    trivia: '太陽系最大の火山オリンポス山がある'
                },
                satellites: [
                    { name: 'フォボス', radius: 5, distance: 100, discovered: false },
                    { name: 'ダイモス', radius: 3, distance: 150, discovered: false }
                ],
                features: ['miningColony', 'ancientRuins']
            },
            jupiter: {
                id: 'jupiter',
                name: '木星エリア', 
                japaneseName: 'もくせいエリア',
                position: 5,
                radius: 8000,
                solarDistance: 5.20,
                description: 'ガスの巨人。強力な磁場と多数の衛星を持つ。',
                unlocked: false,
                discovered: false,
                planetData: {
                    radius: 120,
                    color: 0xDAA520,
                    atmosphere: true,
                    dayLength: 9.9,
                    gravity: 2.36,
                    trivia: '大赤斑は地球が3個入る巨大な嵐'
                },
                satellites: [
                    { name: 'イオ', radius: 15, distance: 300, discovered: false },
                    { name: 'エウロパ', radius: 12, distance: 400, discovered: false },
                    { name: 'ガニメデ', radius: 20, distance: 500, discovered: false },
                    { name: 'カリスト', radius: 18, distance: 600, discovered: false }
                ],
                features: ['gasStation', 'radiationBelt', 'greatRedSpot']
            }
        };
        
        // 現在のゾーン
        this.currentZone = 'earth';
        
        // ゾーン間の接続（ワープゲート）
        this.connections = new Map();
        this.warpGates = new Map();
        
        // ゾーン遷移の状態
        this.isTransitioning = false;
        this.transitionProgress = 0;
    }
    
    init() {
        // 初期ゾーン（地球）をロード
        this.loadZone('earth');
        
        // 隣接ゾーンのプリロード
        this.memoryManager.schedulePreloading();
        
        // デバッグ：火星への接続を追加（後でクエストで解除）
        if (this.game.debugMode) {
            this.addConnection('earth', 'mars');
        }
        
        // パフォーマンス監視開始
        this.memoryManager.startPerformanceMonitoring();
    }
    
    async loadZone(zoneId, clearCurrent = true) {
        const startTime = performance.now();
        
        const zone = this.zones[zoneId];
        if (!zone) {
            console.error(`Zone ${zoneId} not found`);
            return;
        }
        
        // 既にロード済みの場合はスキップ
        if (this.loadedZones.has(zoneId) && !clearCurrent) {
            this.currentZone = zoneId;
            this.updateZoneUI(zone);
            return;
        }
        
        console.log(`Loading zone: ${zone.name}`);
        
        // ローディングUIを表示
        this.showLoadingUI(zone.name);
        
        try {
            // メモリ管理：古いゾーンをアンロード
            if (clearCurrent) {
                await this.memoryManager.manageMemory(zoneId);
                // 既存のオブジェクトをクリア
                this.clearZoneObjects();
            }
            
            // ゾーンの中心をリセット
            this.game.scene.position.set(0, 0, 0);
            
            // 新しいゾーンのオブジェクトを生成
            await this.createZoneObjects(zone);
            
            // ゾーンをロード済みに追加
            this.loadedZones.add(zoneId);
            this.currentZone = zoneId;
            
            // UIを更新
            this.updateZoneUI(zone);
            
            // 隣接ゾーンのプリロードをスケジュール
            this.memoryManager.schedulePreloading();
            
            // パフォーマンス測定
            const loadTime = performance.now() - startTime;
            this.performanceMetrics.loadTime = loadTime;
            console.log(`Zone ${zoneId} loaded in ${loadTime.toFixed(2)}ms`);
            
            // ゾーン変更イベントを発火
            if (this.game.eventBus) {
                this.game.eventBus.emit('zoneChanged', { zone: zone });
            }
            
        } catch (error) {
            console.error(`Failed to load zone ${zoneId}:`, error);
        } finally {
            this.hideLoadingUI();
        }
    }
    
    clearZoneObjects(zoneId = null) {
        const targetZone = zoneId || this.currentZone;
        
        // ゾーン固有のメッシュを取得
        const zoneMeshes = this.zoneMeshes.get(targetZone) || [];
        
        // メッシュをアセットマネージャーで管理しながら削除
        zoneMeshes.forEach(mesh => {
            if (mesh.parent) {
                mesh.parent.remove(mesh);
            }
            this.assetManager.disposeMesh(mesh);
        });
        
        // 惑星を削除（現在のゾーンのみ）
        if (this.game.planets && (!zoneId || zoneId === this.currentZone)) {
            this.game.planets.forEach(planet => {
                if (planet.destroy) {
                    planet.destroy();
                }
            });
            this.game.planets = [];
        }
        
        // ステーションを削除
        if (this.game.stations && (!zoneId || zoneId === this.currentZone)) {
            this.game.stations.forEach(station => {
                if (station.destroy) {
                    station.destroy();
                }
            });
            this.game.stations = [];
        }
        
        // 小惑星フィールドを削除
        if (this.game.asteroidFields && (!zoneId || zoneId === this.currentZone)) {
            this.game.asteroidFields.forEach(field => {
                if (field.destroy) {
                    field.destroy();
                }
            });
            this.game.asteroidFields = [];
        }
        
        // ワープゲートを削除
        this.warpGates.forEach((gate, id) => {
            if (id.startsWith(targetZone)) {
                if (gate.destroy) {
                    gate.destroy();
                }
                this.warpGates.delete(id);
            }
        });
        
        // ゾーンメッシュマップをクリア
        this.zoneMeshes.delete(targetZone);
        
        console.log(`Cleared objects for zone: ${targetZone}`);
    }
    
    async createZoneObjects(zone) {
        const zoneMeshes = [];
        
        // メイン惑星を作成
        const mainPlanet = await this.createPlanet(zone);
        this.game.planets.push(mainPlanet);
        if (mainPlanet.mesh) {
            zoneMeshes.push(mainPlanet.mesh);
        }
        
        // 衛星を作成
        for (const satelliteData of zone.satellites) {
            if (satelliteData.discovered) {
                const satellite = await this.createSatellite(satelliteData, mainPlanet);
                this.game.planets.push(satellite);
                if (satellite.mesh) {
                    zoneMeshes.push(satellite.mesh);
                }
            }
        }
        
        // ゾーンの特徴を作成
        const featureMeshes = await this.createZoneFeatures(zone);
        zoneMeshes.push(...featureMeshes);
        
        // ワープゲートを作成
        const gateMeshes = await this.createWarpGates(zone);
        zoneMeshes.push(...gateMeshes);
        
        // ゾーンメッシュを登録
        this.zoneMeshes.set(zone.id, zoneMeshes);
        
        console.log(`Created ${zoneMeshes.length} meshes for zone: ${zone.name}`);
    }
    
    createPlanet(zone) {
        const Planet = this.game.Planet; // Planetクラスを取得
        const planet = new Planet(
            this.game.scene,
            new THREE.Vector3(0, 0, 0), // ゾーンの中心
            {
                name: zone.name.replace('エリア', ''),
                radius: zone.planetData.radius,
                color: zone.planetData.color,
                texture: zone.planetData.texture || null,
                rotationSpeed: 0.001,
                hasAtmosphere: zone.planetData.atmosphere,
                atmosphereColor: zone.planetData.atmosphere ? 0x87CEEB : null,
                hasRings: zone.id === 'saturn',
                landingEnabled: true
            });
        
        planet.planetData = zone.planetData;
        planet.zoneId = zone.id;
        
        return planet;
    }
    
    createSatellite(satelliteData, parentPlanet) {
        const angle = Math.random() * Math.PI * 2;
        const x = Math.cos(angle) * satelliteData.distance;
        const z = Math.sin(angle) * satelliteData.distance;
        
        const Planet = this.game.Planet;
        const satellite = new Planet(
            this.game.scene,
            new THREE.Vector3(x, 0, z),
            {
                name: satelliteData.name,
                radius: satelliteData.radius,
                color: 0x808080,
                rotationSpeed: 0.002,
            hasAtmosphere: false,
            landingEnabled: true
        });
        
        satellite.isSatellite = true;
        satellite.parentPlanet = parentPlanet;
        satellite.orbitData = {
            radius: satelliteData.distance,
            speed: 0.0005,
            angle: angle
        };
        
        return satellite;
    }
    
    createZoneFeatures(zone) {
        const features = [];
        
        zone.features.forEach(feature => {
            switch(feature) {
                case 'spaceStation':
                    this.createSpaceStation(zone);
                    break;
                case 'asteroidField':
                    this.createAsteroidField(zone);
                    break;
                case 'miningColony':
                    // TODO: 採掘コロニーの実装
                    break;
                case 'gasStation':
                    // TODO: ガス採取ステーションの実装
                    break;
            }
        });
        
        return features;
    }
    
    createSpaceStation(zone) {
        // 既存のSpaceStationクラスを使用
        const SpaceStation = this.game.SpaceStation;
        const station = new SpaceStation(
            this.game.scene,
            new THREE.Vector3(300, 50, 200),
            {
                name: `${zone.name}宇宙ステーション`
            }
        );
        
        // stationsが存在しない場合は作成
        if (!this.game.stations) {
            this.game.stations = [];
        }
        this.game.stations.push(station);
    }
    
    createAsteroidField(zone) {
        const AsteroidField = this.game.AsteroidField;
        const field = new AsteroidField(
            this.game.scene,
            new THREE.Vector3(-500, 0, 300),
            {
                radius: 300,
                density: 0.3
            }
        );
        
        this.game.asteroidFields.push(field);
    }
    
    createWarpGates(zone) {
        const gateMeshes = [];
        
        // このゾーンから接続されている他のゾーンへのゲートを作成
        const connections = this.getZoneConnections(zone.id);
        
        connections.forEach((targetZoneId, index) => {
            const targetZone = this.zones[targetZoneId];
            if (!targetZone) return;
            
            // ゲートの位置を計算（円周上に配置）
            const angle = (index / connections.length) * Math.PI * 2;
            const distance = zone.radius * 0.8;
            const x = Math.cos(angle) * distance;
            const z = Math.sin(angle) * distance;
            
            const gate = this.createWarpGate({
                id: `${zone.id}_to_${targetZoneId}`,
                position: { x, y: 0, z },
                targetZone: targetZoneId,
                targetZoneName: targetZone.name
            });
            
            if (gate) {
                this.warpGates.set(gate.id, gate);
                if (gate.mesh) {
                    gateMeshes.push(gate.mesh);
                }
            }
        });
        
        return gateMeshes;
    }
    
    createWarpGate(config) {
        // WarpGateクラスをインポート
        const { WarpGate } = window;
        
        if (!WarpGate) {
            console.error('WarpGate class not found');
            return null;
        }
        
        // ワープゲートオブジェクトを作成
        const gate = new WarpGate(this.game.scene, {
            id: config.id,
            position: new THREE.Vector3(config.position.x, config.position.y, config.position.z),
            targetZone: config.targetZone,
            targetZoneName: config.targetZoneName,
            size: 50
        });
        
        // ゲームインスタンスを設定
        gate.setGame(this.game);
        
        return gate;
    }
    
    addConnection(zoneId1, zoneId2, bidirectional = true) {
        // ゾーン間の接続を追加
        if (!this.connections.has(zoneId1)) {
            this.connections.set(zoneId1, new Set());
        }
        this.connections.get(zoneId1).add(zoneId2);
        
        if (bidirectional) {
            if (!this.connections.has(zoneId2)) {
                this.connections.set(zoneId2, new Set());
            }
            this.connections.get(zoneId2).add(zoneId1);
        }
        
        console.log(`Added connection: ${zoneId1} <-> ${zoneId2}`);
    }
    
    getZoneConnections(zoneId) {
        return Array.from(this.connections.get(zoneId) || []);
    }
    
    canTravelTo(targetZoneId) {
        // 現在のゾーンから目標ゾーンへ移動可能かチェック
        const connections = this.connections.get(this.currentZone);
        return connections && connections.has(targetZoneId);
    }
    
    travelToZone(targetZoneId) {
        if (this.isTransitioning) {
            console.log('Already transitioning between zones');
            return;
        }
        
        if (!this.canTravelTo(targetZoneId)) {
            console.log(`Cannot travel from ${this.currentZone} to ${targetZoneId}`);
            return;
        }
        
        const targetZone = this.zones[targetZoneId];
        if (!targetZone.unlocked) {
            this.game.showMessage('このエリアはまだロックされています');
            return;
        }
        
        // ワープアニメーションを開始
        this.startWarpTransition(targetZoneId);
    }
    
    startWarpTransition(targetZoneId) {
        this.isTransitioning = true;
        this.transitionProgress = 0;
        
        // ワープエフェクトを表示
        if (this.game.warpSystem) {
            this.game.warpSystem.startWarpEffect();
        }
        
        // 遷移アニメーション
        const transitionDuration = 3000; // 3秒
        const startTime = Date.now();
        
        const animate = () => {
            const elapsed = Date.now() - startTime;
            this.transitionProgress = Math.min(elapsed / transitionDuration, 1);
            
            if (this.transitionProgress >= 1) {
                // 新しいゾーンをロード
                this.loadZone(targetZoneId);
                this.isTransitioning = false;
                
                if (this.game.warpSystem) {
                    this.game.warpSystem.endWarpEffect();
                }
                
                // ゾーンを発見済みにする
                this.zones[targetZoneId].discovered = true;
                
                // 到着メッセージ
                this.game.showMessage(`${this.zones[targetZoneId].name}に到着しました！`);
            } else {
                requestAnimationFrame(animate);
            }
        };
        
        animate();
    }
    
    updateZoneUI(zone) {
        // ゾーン情報をUIに表示
        const infoPanel = document.getElementById('zone-info');
        if (infoPanel) {
            infoPanel.innerHTML = `
                <h3>${zone.name}</h3>
                <p>${zone.description}</p>
                <p>太陽からの距離: ${zone.solarDistance} AU</p>
            `;
        }
    }
    
    discoverSatellite(satelliteName) {
        // 衛星を発見
        Object.values(this.zones).forEach(zone => {
            const satellite = zone.satellites.find(s => s.name === satelliteName);
            if (satellite) {
                satellite.discovered = true;
                this.game.showMessage(`${satelliteName}を発見しました！`);
                
                // 現在のゾーンなら再生成
                if (zone.id === this.currentZone) {
                    this.loadZone(this.currentZone);
                }
            }
        });
    }
    
    unlockZone(zoneId) {
        const zone = this.zones[zoneId];
        if (zone && !zone.unlocked) {
            zone.unlocked = true;
            this.game.showMessage(`${zone.name}がアンロックされました！`);
        }
    }
    
    getZoneInfo(zoneId) {
        return this.zones[zoneId];
    }
    
    getCurrentZoneInfo() {
        return this.zones[this.currentZone];
    }
    
    update(delta) {
        // 衛星の軌道運動を更新
        if (this.game.planets) {
            this.game.planets.forEach(planet => {
                if (planet.isSatellite && planet.orbitData) {
                    planet.orbitData.angle += planet.orbitData.speed * delta;
                    const x = Math.cos(planet.orbitData.angle) * planet.orbitData.radius;
                    const z = Math.sin(planet.orbitData.angle) * planet.orbitData.radius;
                    planet.mesh.position.set(x, 0, z);
                }
            });
        }
        
        // ワープゲートの更新
        this.warpGates.forEach((gate, id) => {
            if (id.startsWith(this.currentZone) && gate.update) {
                gate.update(delta, this.game.player.mesh.position);
                
                // プレイヤーがゲートに十分近づいてFキーを押したらワープ
                if (gate.playerNearby && this.game.inputManager.keys.f) {
                    if (gate.activationProgress >= 1) {
                        this.activateWarpGate(gate);
                    }
                }
            }
        });
    }
    
    activateWarpGate(gate) {
        if (!gate.activate(this.game.player)) return;
        
        // ワープ実行
        this.travelToZone(gate.targetZone);
    }
    
    showLoadingUI(zoneName) {
        const loadingDiv = document.createElement('div');
        loadingDiv.id = 'zone-loading';
        loadingDiv.innerHTML = `
            <div class="loading-container">
                <div class="loading-spinner"></div>
                <div class="loading-text">${zoneName}をロード中...</div>
                <div class="loading-progress">
                    <div class="progress-bar"></div>
                </div>
            </div>
        `;
        
        loadingDiv.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.8);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 10000;
            color: white;
            font-family: monospace;
        `;
        
        // スタイルを追加
        if (!document.querySelector('#loading-styles')) {
            const style = document.createElement('style');
            style.id = 'loading-styles';
            style.textContent = `
                .loading-container {
                    text-align: center;
                    background: rgba(0, 20, 40, 0.9);
                    padding: 40px;
                    border: 2px solid #00ffff;
                    border-radius: 10px;
                }
                
                .loading-spinner {
                    width: 50px;
                    height: 50px;
                    border: 3px solid rgba(0, 255, 255, 0.3);
                    border-top: 3px solid #00ffff;
                    border-radius: 50%;
                    animation: spin 1s linear infinite;
                    margin: 0 auto 20px;
                }
                
                .loading-text {
                    font-size: 18px;
                    margin-bottom: 20px;
                    color: #00ffff;
                }
                
                .loading-progress {
                    width: 200px;
                    height: 4px;
                    background: rgba(0, 0, 0, 0.5);
                    border: 1px solid #00ffff;
                    margin: 0 auto;
                    overflow: hidden;
                }
                
                .progress-bar {
                    width: 0%;
                    height: 100%;
                    background: linear-gradient(90deg, #0088ff, #00ffff);
                    animation: progress-indeterminate 2s ease-in-out infinite;
                }
                
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
                
                @keyframes progress-indeterminate {
                    0% { width: 0%; margin-left: 0%; }
                    50% { width: 75%; margin-left: 25%; }
                    100% { width: 0%; margin-left: 100%; }
                }
            `;
            document.head.appendChild(style);
        }
        
        document.body.appendChild(loadingDiv);
    }
    
    hideLoadingUI() {
        const loadingDiv = document.getElementById('zone-loading');
        if (loadingDiv) {
            loadingDiv.remove();
        }
    }
    
    destroy() {
        // 全ゾーンをアンロード
        const allZones = Array.from(this.loadedZones);
        allZones.forEach(zoneId => {
            this.clearZoneObjects(zoneId);
        });
        
        this.loadedZones.clear();
        this.preloadingZones.clear();
        this.zoneMeshes.clear();
        this.zoneAssets.clear();
        this.warpGates.clear();
        this.connections.clear();
        
        // アセットマネージャーもクリーンアップ
        if (this.assetManager) {
            this.assetManager.forceDisposeAll();
        }
        
        console.log('ZoneManager destroyed');
    }
}