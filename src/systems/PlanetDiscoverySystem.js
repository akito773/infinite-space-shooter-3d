// 新惑星発見システム

import * as THREE from 'three';

export class PlanetDiscoverySystem {
    constructor(game) {
        this.game = game;
        this.zoneManager = game.zoneManager;
        
        // 発見可能な惑星の定義
        this.discoverablePlanets = new Map();
        this.foundPlanets = new Set();
        
        // スキャンシステム
        this.scanRange = 2000; // スキャン範囲
        this.scanCooldown = 5000; // 5秒クールダウン
        this.lastScanTime = 0;
        this.isScanning = false;
        this.scanProgress = 0;
        
        // 発見確率
        this.baseFindChance = 0.1; // 基本10%
        this.scanBonusChance = 0.3; // スキャン時30%追加
        
        // UI要素
        this.scanUI = null;
        this.discoveryEffect = null;
        
        this.init();
    }
    
    init() {
        // 発見可能な惑星を設定
        this.setupDiscoverablePlanets();
        
        // スキャンUIを作成
        this.createScanUI();
        
        // イベントリスナー
        this.setupEventListeners();
        
        // 定期チェック（パッシブ発見）
        setInterval(() => {
            this.checkPassiveDiscovery();
        }, 10000); // 10秒ごと
    }
    
    setupDiscoverablePlanets() {
        // 地球エリアの隠し惑星
        this.discoverablePlanets.set('earth_moon_base', {
            id: 'earth_moon_base',
            name: '月面基地跡',
            type: 'special',
            zone: 'earth',
            position: { x: 800, y: 15, z: -600 },
            radius: 15,
            color: 0x888888,
            discoveryCondition: {
                type: 'scan',
                minScanCount: 3,
                requiredProximity: 500
            },
            rewards: {
                credits: 5000,
                items: ['ancient_tech', 'moon_rock'],
                experience: 200
            },
            lore: '人類初の月面基地の廃墟。貴重な技術資料が眠っている。'
        });
        
        // 火星エリアの隠し惑星
        this.discoverablePlanets.set('mars_asteroid', {
            id: 'mars_asteroid',
            name: 'フォボス採掘跡',
            type: 'asteroid',
            zone: 'mars',
            position: { x: -1200, y: -50, z: 800 },
            radius: 8,
            color: 0x664433,
            discoveryCondition: {
                type: 'proximity',
                distance: 200,
                timeRequired: 30000 // 30秒間滞在
            },
            rewards: {
                credits: 3000,
                items: ['rare_metal', 'mining_data'],
                experience: 150
            },
            lore: '火星の衛星フォボスでの採掘作業跡。レアメタルが残されている。'
        });
        
        // 木星エリアの隠し惑星
        this.discoverablePlanets.set('jupiter_derelict', {
            id: 'jupiter_derelict',
            name: '謎の宇宙船',
            type: 'derelict',
            zone: 'jupiter',
            position: { x: 2000, y: 100, z: -1500 },
            radius: 25,
            color: 0x440088,
            discoveryCondition: {
                type: 'scan',
                minScanCount: 5,
                energyCost: 500
            },
            rewards: {
                credits: 10000,
                items: ['alien_tech', 'quantum_core'],
                experience: 500,
                unlockZone: 'outer_rim' // 新エリア解放
            },
            lore: '正体不明の巨大宇宙船。高度な技術が使われている。'
        });
        
        // ランダム生成惑星のテンプレート
        this.planetTemplates = [
            {
                type: 'ice_world',
                namePrefix: '氷の',
                color: 0x88ccff,
                resources: ['ice', 'rare_gas'],
                rarity: 'common'
            },
            {
                type: 'volcanic',
                namePrefix: '火山の',
                color: 0xff4400,
                resources: ['sulfur', 'metal_ore'],
                rarity: 'uncommon'
            },
            {
                type: 'crystal',
                namePrefix: 'クリスタル',
                color: 0xff88ff,
                resources: ['crystal', 'energy_crystal'],
                rarity: 'rare'
            },
            {
                type: 'gas_giant',
                namePrefix: 'ガス雲',
                color: 0xffaa44,
                resources: ['gas', 'quantum_material'],
                rarity: 'legendary'
            }
        ];
    }
    
    // スキャンシステム
    startScan() {
        const now = Date.now();
        
        // クールダウンチェック
        if (now - this.lastScanTime < this.scanCooldown) {
            const remaining = Math.ceil((this.scanCooldown - (now - this.lastScanTime)) / 1000);
            this.showMessage(`スキャンクールダウン中: ${remaining}秒`);
            return;
        }
        
        // エネルギーチェック
        const energyCost = 100;
        if (this.game.player.energy < energyCost) {
            this.showMessage('エネルギーが不足しています');
            return;
        }
        
        // スキャン開始
        this.isScanning = true;
        this.scanProgress = 0;
        this.lastScanTime = now;
        
        // エネルギー消費
        this.game.player.energy -= energyCost;
        
        // スキャンエフェクト
        this.createScanEffect();
        
        // スキャン処理
        this.performScan();
        
        console.log('Deep space scan initiated...');
    }
    
    performScan() {
        const scanDuration = 3000; // 3秒
        const startTime = Date.now();
        
        const scanAnimation = () => {
            const elapsed = Date.now() - startTime;
            this.scanProgress = Math.min(elapsed / scanDuration, 1);
            
            // UI更新
            this.updateScanUI();
            
            if (this.scanProgress >= 1) {
                // スキャン完了
                this.completeScan();
                this.isScanning = false;
            } else {
                requestAnimationFrame(scanAnimation);
            }
        };
        
        scanAnimation();
    }
    
    completeScan() {
        // 現在のゾーンで発見可能な惑星をチェック
        const currentZone = this.zoneManager.currentZone;
        const discoveries = [];
        
        for (const [id, planet] of this.discoverablePlanets) {
            if (planet.zone === currentZone && 
                !this.foundPlanets.has(id) &&
                this.checkDiscoveryCondition(planet, 'scan')) {
                
                discoveries.push(planet);
            }
        }
        
        // ランダム惑星の生成チェック
        if (discoveries.length === 0 && Math.random() < 0.3) {
            const randomPlanet = this.generateRandomPlanet(currentZone);
            if (randomPlanet) {
                discoveries.push(randomPlanet);
            }
        }
        
        // 発見処理
        if (discoveries.length > 0) {
            discoveries.forEach(planet => {
                this.discoverPlanet(planet);
            });
        } else {
            this.showMessage('スキャン完了 - 新たな発見はありませんでした');
        }
        
        // スキャンエフェクト終了
        this.endScanEffect();
    }
    
    checkDiscoveryCondition(planet, triggerType) {
        const condition = planet.discoveryCondition;
        
        switch (condition.type) {
            case 'scan':
                if (triggerType !== 'scan') return false;
                
                // スキャン回数チェック（実装簡略化）
                const chance = this.baseFindChance + this.scanBonusChance;
                return Math.random() < chance;
                
            case 'proximity':
                const playerPos = this.game.player.mesh.position;
                const distance = playerPos.distanceTo(
                    new THREE.Vector3(planet.position.x, planet.position.y, planet.position.z)
                );
                return distance < condition.distance;
                
            default:
                return false;
        }
    }
    
    discoverPlanet(planetData) {
        // 発見済みリストに追加
        this.foundPlanets.add(planetData.id);
        
        // ゾーンマネージャーに惑星を追加
        const planet = this.addPlanetToZone(planetData);
        
        // 発見演出
        this.playDiscoveryEffect(planetData);
        
        // 報酬付与
        this.grantRewards(planetData.rewards);
        
        // ログ記録
        this.recordDiscovery(planetData);
        
        // WarpSystemとGalaxyMapに通知
        if (planet && this.game.warpSystem) {
            this.game.warpSystem.discoverLocation(planet);
        }
        if (planet && this.game.galaxyMap) {
            this.game.galaxyMap.discoverLocation(planet);
        }
        
        console.log(`Planet discovered: ${planetData.name}`);
    }
    
    addPlanetToZone(planetData) {
        // Three.jsの惑星オブジェクトを作成
        const Planet = this.game.Planet || window.Planet;
        const planet = new Planet(this.game.scene, 
            new THREE.Vector3(planetData.position.x, planetData.position.y, planetData.position.z), {
            radius: planetData.radius,
            color: planetData.color,
            name: planetData.name,
            hasAtmosphere: planetData.type !== 'asteroid',
            hasRings: false,
            landingEnabled: true
        });
        
        // 特別なプロパティを追加
        planet.discoveredPlanet = true;
        planet.planetData = planetData;
        planet.lore = planetData.lore;
        
        // ゲームの惑星リストに追加
        this.game.planets.push(planet);
        
        // ゾーンメッシュに追加（メモリ管理のため）
        const zoneMeshes = this.zoneManager.zoneMeshes.get(planetData.zone) || [];
        zoneMeshes.push(planet.mesh);
        this.zoneManager.zoneMeshes.set(planetData.zone, zoneMeshes);
        
        return planet;
    }
    
    generateRandomPlanet(zoneId) {
        const template = this.planetTemplates[
            Math.floor(Math.random() * this.planetTemplates.length)
        ];
        
        // ランダム位置生成（ゾーン境界内）
        const zone = this.zoneManager.zones[zoneId];
        const maxDistance = zone.radius * 0.9;
        const angle = Math.random() * Math.PI * 2;
        const distance = Math.random() * maxDistance + maxDistance * 0.5;
        
        const randomPlanet = {
            id: `random_${Date.now()}`,
            name: `${template.namePrefix}惑星-${Math.floor(Math.random() * 999)}`,
            type: template.type,
            zone: zoneId,
            position: {
                x: Math.cos(angle) * distance,
                y: (Math.random() - 0.5) * 100,
                z: Math.sin(angle) * distance
            },
            radius: 10 + Math.random() * 20,
            color: template.color,
            discoveryCondition: { type: 'scan' },
            rewards: {
                credits: Math.floor(Math.random() * 5000) + 1000,
                items: template.resources,
                experience: Math.floor(Math.random() * 200) + 50
            },
            lore: `発見されたばかりの${template.namePrefix}惑星。詳細な調査が必要。`
        };
        
        // 生成された惑星をマップに追加
        this.discoverablePlanets.set(randomPlanet.id, randomPlanet);
        
        return randomPlanet;
    }
    
    checkPassiveDiscovery() {
        if (this.isScanning) return;
        
        const currentZone = this.zoneManager.currentZone;
        
        // 近接発見をチェック
        for (const [id, planet] of this.discoverablePlanets) {
            if (planet.zone === currentZone && 
                !this.foundPlanets.has(id) &&
                planet.discoveryCondition.type === 'proximity') {
                
                if (this.checkDiscoveryCondition(planet, 'proximity')) {
                    this.discoverPlanet(planet);
                }
            }
        }
    }
    
    grantRewards(rewards) {
        if (rewards.credits) {
            this.game.inventorySystem.addCredits(rewards.credits);
        }
        
        if (rewards.items) {
            rewards.items.forEach(item => {
                this.game.inventorySystem.addItem(item, 1);
            });
        }
        
        if (rewards.experience) {
            // 経験値システムがあれば追加
            console.log(`Experience gained: ${rewards.experience}`);
        }
        
        if (rewards.unlockZone) {
            this.zoneManager.unlockZone(rewards.unlockZone);
        }
    }
    
    recordDiscovery(planetData) {
        // 発見記録をローカルストレージに保存
        const discoveries = JSON.parse(localStorage.getItem('planetDiscoveries') || '[]');
        
        discoveries.push({
            id: planetData.id,
            name: planetData.name,
            zone: planetData.zone,
            discoveryTime: new Date().toISOString(),
            lore: planetData.lore
        });
        
        localStorage.setItem('planetDiscoveries', JSON.stringify(discoveries));
    }
    
    // エフェクト関連
    createScanEffect() {
        // スキャンパルスエフェクト
        const scanPulse = document.createElement('div');
        scanPulse.id = 'scan-pulse';
        scanPulse.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            width: 200px;
            height: 200px;
            margin: -100px 0 0 -100px;
            border: 3px solid #00ffff;
            border-radius: 50%;
            background: radial-gradient(transparent, rgba(0, 255, 255, 0.1));
            animation: scan-pulse 3s ease-out;
            pointer-events: none;
            z-index: 9999;
        `;
        
        // アニメーションスタイル
        if (!document.querySelector('#scan-animation-style')) {
            const style = document.createElement('style');
            style.id = 'scan-animation-style';
            style.textContent = `
                @keyframes scan-pulse {
                    0% {
                        transform: scale(0.1);
                        opacity: 1;
                    }
                    100% {
                        transform: scale(5);
                        opacity: 0;
                    }
                }
                
                @keyframes scan-radar {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            `;
            document.head.appendChild(style);
        }
        
        document.body.appendChild(scanPulse);
        
        // サウンド再生
        if (this.game.soundManager) {
            this.game.soundManager.play('scan');
        }
    }
    
    endScanEffect() {
        const scanPulse = document.getElementById('scan-pulse');
        if (scanPulse) {
            scanPulse.remove();
        }
    }
    
    playDiscoveryEffect(planetData) {
        // 画面エフェクト
        const discoveryFlash = document.createElement('div');
        discoveryFlash.innerHTML = `
            <div class="discovery-content">
                <div class="discovery-icon">🌟</div>
                <div class="discovery-title">新惑星発見！</div>
                <div class="discovery-name">${planetData.name}</div>
                <div class="discovery-lore">${planetData.lore}</div>
            </div>
        `;
        
        discoveryFlash.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: radial-gradient(rgba(255, 215, 0, 0.3), transparent);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 10000;
            animation: discovery-flash 4s ease-out;
        `;
        
        // スタイル追加
        if (!document.querySelector('#discovery-style')) {
            const style = document.createElement('style');
            style.id = 'discovery-style';
            style.textContent = `
                .discovery-content {
                    text-align: center;
                    background: rgba(0, 0, 0, 0.9);
                    border: 3px solid gold;
                    border-radius: 20px;
                    padding: 40px;
                    color: white;
                    max-width: 600px;
                }
                
                .discovery-icon {
                    font-size: 64px;
                    margin-bottom: 20px;
                }
                
                .discovery-title {
                    font-size: 32px;
                    color: gold;
                    margin-bottom: 15px;
                    text-shadow: 0 0 10px rgba(255, 215, 0, 0.8);
                }
                
                .discovery-name {
                    font-size: 24px;
                    color: #00ffff;
                    margin-bottom: 20px;
                }
                
                .discovery-lore {
                    font-size: 16px;
                    color: #cccccc;
                    line-height: 1.5;
                }
                
                @keyframes discovery-flash {
                    0%, 100% { opacity: 0; }
                    10%, 90% { opacity: 1; }
                }
            `;
            document.head.appendChild(style);
        }
        
        document.body.appendChild(discoveryFlash);
        
        // 4秒後に削除
        setTimeout(() => {
            discoveryFlash.remove();
        }, 4000);
        
        // 発見サウンド
        if (this.game.soundManager) {
            this.game.soundManager.play('discovery');
        }
    }
    
    // UI作成
    createScanUI() {
        const scanButton = document.createElement('button');
        scanButton.id = 'scan-button';
        scanButton.innerHTML = '🔍 スキャン';
        scanButton.style.cssText = `
            position: fixed;
            bottom: 120px;
            right: 20px;
            padding: 10px 20px;
            background: linear-gradient(135deg, #004488, #0066cc);
            border: 2px solid #00aaff;
            color: white;
            font-size: 16px;
            cursor: pointer;
            border-radius: 5px;
            z-index: 1000;
            transition: all 0.3s;
        `;
        
        scanButton.onmouseover = () => {
            scanButton.style.background = 'linear-gradient(135deg, #0066cc, #0088ff)';
            scanButton.style.transform = 'scale(1.05)';
        };
        
        scanButton.onmouseout = () => {
            scanButton.style.background = 'linear-gradient(135deg, #004488, #0066cc)';
            scanButton.style.transform = 'scale(1)';
        };
        
        scanButton.onclick = () => this.startScan();
        
        document.body.appendChild(scanButton);
        this.scanUI = scanButton;
    }
    
    updateScanUI() {
        if (this.scanUI && this.isScanning) {
            const progress = Math.floor(this.scanProgress * 100);
            this.scanUI.innerHTML = `🔍 スキャン中... ${progress}%`;
            this.scanUI.style.opacity = 0.6;
        } else if (this.scanUI) {
            this.scanUI.innerHTML = '🔍 スキャン';
            this.scanUI.style.opacity = 1;
        }
    }
    
    setupEventListeners() {
        // Xキーでディープスペーススキャン
        document.addEventListener('keydown', (e) => {
            if (e.key.toLowerCase() === 'x' && !e.ctrlKey && !e.altKey && !this.game.isPaused) {
                if (!this.isScanning) {
                    this.startScan();
                }
            }
        });
    }
    
    // セーブ/ロード
    serialize() {
        return {
            foundPlanets: Array.from(this.foundPlanets),
            discoveries: JSON.parse(localStorage.getItem('planetDiscoveries') || '[]')
        };
    }
    
    deserialize(data) {
        if (data.foundPlanets) {
            this.foundPlanets = new Set(data.foundPlanets);
        }
    }
    
    // 発見記録の取得
    getDiscoveryLog() {
        return JSON.parse(localStorage.getItem('planetDiscoveries') || '[]');
    }
    
    // 統計情報
    getDiscoveryStats() {
        const discoveries = this.getDiscoveryLog();
        const stats = {
            totalDiscovered: discoveries.length,
            byZone: {},
            byType: {},
            recentDiscoveries: discoveries.slice(-5)
        };
        
        discoveries.forEach(discovery => {
            stats.byZone[discovery.zone] = (stats.byZone[discovery.zone] || 0) + 1;
        });
        
        return stats;
    }
    
    // ヘルパーメソッド
    showMessage(text) {
        const message = document.createElement('div');
        message.style.cssText = `
            position: fixed;
            bottom: 150px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(0, 0, 0, 0.8);
            color: #00ffff;
            padding: 15px 30px;
            border-radius: 5px;
            font-size: 18px;
            z-index: 10000;
            pointer-events: none;
            animation: messageSlide 2s ease-out;
        `;
        message.textContent = text;
        
        const style = document.createElement('style');
        style.textContent = `
            @keyframes messageSlide {
                0% { opacity: 0; transform: translateX(-50%) translateY(20px); }
                20% { opacity: 1; transform: translateX(-50%) translateY(0); }
                80% { opacity: 1; transform: translateX(-50%) translateY(0); }
                100% { opacity: 0; transform: translateX(-50%) translateY(-20px); }
            }
        `;
        document.head.appendChild(style);
        document.body.appendChild(message);
        
        setTimeout(() => {
            message.remove();
            style.remove();
        }, 2000);
    }
}