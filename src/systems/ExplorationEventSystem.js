// 探索イベントシステム

import * as THREE from 'three';

export class ExplorationEventSystem {
    constructor(game) {
        this.game = game;
        this.activeEvents = new Map();
        this.eventHistory = [];
        this.nextEventId = 1;
        
        // イベント発生タイマー
        this.eventCheckTimer = 0;
        this.eventCheckInterval = 10000; // 10秒ごとにチェック
        this.baseEventChance = 0.05; // 基本5%
        
        // イベント定義
        this.eventDefinitions = {
            // デブリフィールド
            debrisField: {
                id: 'debrisField',
                name: 'デブリフィールド',
                type: 'combat',
                icon: '🚨',
                rarity: 'common',
                minDistance: 500,
                maxDistance: 3000,
                spawn: (position) => this.spawnDebrisField(position)
            },
            
            // レア資源小惑星
            rareAsteroid: {
                id: 'rareAsteroid',
                name: 'レア資源小惑星',
                type: 'resource',
                icon: '💎',
                rarity: 'uncommon',
                minDistance: 1000,
                maxDistance: 4000,
                spawn: (position) => this.spawnRareAsteroid(position)
            },
            
            // 宇宙クジラ
            spaceWhale: {
                id: 'spaceWhale',
                name: '宇宙クジラ',
                type: 'friendly',
                icon: '🐋',
                rarity: 'rare',
                minDistance: 2000,
                maxDistance: 5000,
                zones: ['jupiter', 'saturn'],
                spawn: (position) => this.spawnSpaceWhale(position)
            },
            
            // ボイジャー発見
            voyagerDiscovery: {
                id: 'voyagerDiscovery',
                name: 'ボイジャー探査機',
                type: 'historical',
                icon: '🛰️',
                rarity: 'legendary',
                minDistance: 3000,
                maxDistance: 8000,
                zones: ['jupiter', 'saturn'],
                oneTime: true,
                spawn: (position) => this.spawnVoyager(position)
            },
            
            // 友好的商人
            merchantEncounter: {
                id: 'merchantEncounter',
                name: '異星商人',
                type: 'friendly',
                icon: '👽',
                rarity: 'uncommon',
                minDistance: 500,
                maxDistance: 2000,
                spawn: (position) => this.spawnMerchant(position)
            },
            
            // 宇宙海賊
            pirateTrap: {
                id: 'pirateTrap',
                name: '海賊の待ち伏せ',
                type: 'combat',
                icon: '🏴‍☠️',
                rarity: 'common',
                minDistance: 1500,
                maxDistance: 4000,
                spawn: (position) => this.spawnPirates(position)
            }
        };
        
        // レアリティ別の重み
        this.rarityWeights = {
            common: 50,
            uncommon: 30,
            rare: 15,
            legendary: 5
        };
        
        this.init();
    }
    
    init() {
        // イベントUIを作成
        this.createEventUI();
    }
    
    update(delta) {
        // イベント発生チェック
        this.eventCheckTimer += delta;
        if (this.eventCheckTimer >= this.eventCheckInterval) {
            this.eventCheckTimer = 0;
            this.checkForNewEvent();
        }
        
        // アクティブイベントの更新
        for (const [id, event] of this.activeEvents) {
            this.updateEvent(event, delta);
        }
    }
    
    checkForNewEvent() {
        // 現在のゾーン情報を取得
        const currentZone = this.game.zoneManager?.getCurrentZoneInfo();
        if (!currentZone) return;
        
        // イベント発生率を計算
        let eventChance = this.baseEventChance;
        
        // 修正要素
        if (this.game.player.isScanning) eventChance += 0.02;
        if (this.game.player.velocity.length() > 50) eventChance -= 0.03;
        if (this.game.lastCombatTime && Date.now() - this.game.lastCombatTime < 30000) {
            eventChance -= 0.05;
        }
        
        // 確率チェック
        if (Math.random() > eventChance) return;
        
        // イベントを選択
        const event = this.selectRandomEvent(currentZone);
        if (event) {
            this.spawnEvent(event);
        }
    }
    
    selectRandomEvent(zone) {
        // 利用可能なイベントをフィルタ
        const availableEvents = Object.values(this.eventDefinitions).filter(event => {
            // ゾーン制限チェック
            if (event.zones && !event.zones.includes(zone.id)) return false;
            
            // 一度きりのイベントチェック
            if (event.oneTime && this.eventHistory.includes(event.id)) return false;
            
            // アクティブな同じイベントがないかチェック
            for (const [id, active] of this.activeEvents) {
                if (active.definition.id === event.id) return false;
            }
            
            return true;
        });
        
        if (availableEvents.length === 0) return null;
        
        // レアリティに基づいて選択
        const weightedEvents = [];
        availableEvents.forEach(event => {
            const weight = this.rarityWeights[event.rarity] || 10;
            for (let i = 0; i < weight; i++) {
                weightedEvents.push(event);
            }
        });
        
        return weightedEvents[Math.floor(Math.random() * weightedEvents.length)];
    }
    
    spawnEvent(eventDef) {
        // プレイヤーからの距離を計算
        const distance = eventDef.minDistance + 
            Math.random() * (eventDef.maxDistance - eventDef.minDistance);
        
        // ランダムな角度
        const angle = Math.random() * Math.PI * 2;
        const position = new THREE.Vector3(
            Math.cos(angle) * distance,
            (Math.random() - 0.5) * 200,
            Math.sin(angle) * distance
        );
        
        // イベントを生成
        const event = {
            id: `event_${this.nextEventId++}`,
            definition: eventDef,
            position: position,
            active: true,
            discovered: false,
            startTime: Date.now()
        };
        
        // 具体的なイベントを生成
        event.instance = eventDef.spawn(position);
        
        this.activeEvents.set(event.id, event);
        
        // 通知
        this.notifyEventSpawned(event);
    }
    
    // 個別イベントの生成メソッド
    
    spawnDebrisField(position) {
        const debris = {
            pieces: [],
            radius: 200,
            cleared: 0,
            total: 20 + Math.floor(Math.random() * 10)
        };
        
        // デブリを生成
        for (let i = 0; i < debris.total; i++) {
            const offset = new THREE.Vector3(
                (Math.random() - 0.5) * debris.radius * 2,
                (Math.random() - 0.5) * debris.radius,
                (Math.random() - 0.5) * debris.radius * 2
            );
            
            const size = Math.random() < 0.7 ? 'small' : 'large';
            const piece = {
                position: position.clone().add(offset),
                size: size,
                velocity: new THREE.Vector3(
                    (Math.random() - 0.5) * 10,
                    (Math.random() - 0.5) * 5,
                    (Math.random() - 0.5) * 10
                ),
                health: size === 'small' ? 1 : 3,
                mesh: null // 実際のメッシュは後で作成
            };
            
            debris.pieces.push(piece);
        }
        
        return debris;
    }
    
    spawnRareAsteroid(position) {
        return {
            position: position,
            resources: {
                crystal: Math.floor(Math.random() * 50) + 50,
                rareMetal: Math.floor(Math.random() * 30) + 20
            },
            miningProgress: 0,
            discovered: false
        };
    }
    
    spawnSpaceWhale(position) {
        return {
            position: position,
            velocity: new THREE.Vector3(
                (Math.random() - 0.5) * 5,
                0,
                (Math.random() - 0.5) * 5
            ),
            following: false,
            followTime: 0,
            blessed: false
        };
    }
    
    spawnVoyager(position) {
        return {
            position: position,
            rotating: true,
            discovered: false,
            historical: {
                name: 'ボイジャー1号',
                year: 1977,
                message: '人類の黄金のレコードを搭載した探査機。46年の旅を経て、ここに眠る。',
                reward: {
                    credits: 10000,
                    title: '人類の遺産発見者'
                }
            }
        };
    }
    
    spawnMerchant(position) {
        return {
            position: position,
            inventory: this.generateMerchantInventory(),
            mood: 'neutral',
            traded: false
        };
    }
    
    spawnPirates(position) {
        const pirateCount = 3 + Math.floor(Math.random() * 3);
        return {
            position: position,
            pirates: Array(pirateCount).fill(null).map(() => ({
                health: 50,
                maxHealth: 50,
                fireRate: 1,
                destroyed: false
            })),
            ambushRadius: 300,
            activated: false
        };
    }
    
    generateMerchantInventory() {
        return [
            { item: 'energy_cell', price: 100, stock: 10 },
            { item: 'repair_kit', price: 200, stock: 5 },
            { item: 'shield_boost', price: 500, stock: 2 },
            { item: 'star_map', price: 1000, stock: 1 }
        ];
    }
    
    updateEvent(event, delta) {
        // イベントタイプに応じた更新
        switch (event.definition.type) {
            case 'combat':
                this.updateCombatEvent(event, delta);
                break;
            case 'friendly':
                this.updateFriendlyEvent(event, delta);
                break;
            case 'resource':
                this.updateResourceEvent(event, delta);
                break;
            case 'historical':
                this.updateHistoricalEvent(event, delta);
                break;
        }
        
        // プレイヤーとの距離チェック
        const playerDistance = event.position.distanceTo(this.game.player.mesh.position);
        
        // 発見チェック
        if (!event.discovered && playerDistance < 500) {
            event.discovered = true;
            this.onEventDiscovered(event);
        }
        
        // 範囲外チェック
        if (playerDistance > 10000) {
            this.removeEvent(event.id);
        }
    }
    
    updateCombatEvent(event, delta) {
        if (event.definition.id === 'debrisField') {
            // デブリの移動
            event.instance.pieces.forEach(piece => {
                if (piece.health > 0) {
                    piece.position.add(piece.velocity.clone().multiplyScalar(delta / 1000));
                }
            });
        }
    }
    
    updateFriendlyEvent(event, delta) {
        if (event.definition.id === 'spaceWhale') {
            const whale = event.instance;
            const playerDist = event.position.distanceTo(this.game.player.mesh.position);
            
            // プレイヤーを追従
            if (playerDist < 300 && !whale.following) {
                whale.following = true;
            }
            
            if (whale.following) {
                whale.followTime += delta;
                
                // 30秒追従したら祝福を与える
                if (whale.followTime > 30000 && !whale.blessed) {
                    whale.blessed = true;
                    this.giveWhaleBlessing();
                }
            }
        }
    }
    
    onEventDiscovered(event) {
        // 発見通知
        this.game.showMessage(`${event.definition.icon} ${event.definition.name}を発見！`);
        
        // サウンド再生
        if (this.game.soundManager) {
            this.game.soundManager.play('discovery');
        }
        
        // レーダーにマーカー追加
        if (this.game.radarSystem) {
            this.game.radarSystem.addMarker(event.id, event.position, event.definition.icon);
        }
    }
    
    giveWhaleBlessing() {
        this.game.showMessage('🐋 宇宙クジラがあなたを祝福した！');
        
        // 一時的なバフを付与
        this.game.player.addBuff({
            type: 'whale_blessing',
            duration: 300000, // 5分
            effects: {
                shieldBoost: 1.5,
                luckBoost: 1.2
            }
        });
    }
    
    removeEvent(eventId) {
        const event = this.activeEvents.get(eventId);
        if (!event) return;
        
        // 履歴に追加
        if (event.definition.oneTime) {
            this.eventHistory.push(event.definition.id);
        }
        
        // クリーンアップ
        // TODO: 3Dオブジェクトの削除
        
        this.activeEvents.delete(eventId);
    }
    
    notifyEventSpawned(event) {
        // 画面端にアラート表示
        const alert = document.createElement('div');
        alert.className = 'event-alert';
        alert.innerHTML = `
            <div class="event-icon">${event.definition.icon}</div>
            <div class="event-text">
                <div class="event-name">未知の信号を検出</div>
                <div class="event-distance">距離: ${Math.floor(event.position.length())}m</div>
            </div>
        `;
        
        alert.style.cssText = `
            position: absolute;
            top: 100px;
            right: -300px;
            background: rgba(0, 50, 100, 0.9);
            border: 2px solid #0ff;
            padding: 15px;
            color: white;
            font-family: monospace;
            transition: right 0.5s;
            z-index: 1000;
        `;
        
        document.body.appendChild(alert);
        
        // スライドイン
        setTimeout(() => {
            alert.style.right = '20px';
        }, 100);
        
        // 5秒後に削除
        setTimeout(() => {
            alert.style.right = '-300px';
            setTimeout(() => alert.remove(), 500);
        }, 5000);
    }
    
    createEventUI() {
        // イベント用のスタイル
        const style = document.createElement('style');
        style.textContent = `
            .event-alert {
                display: flex;
                align-items: center;
                gap: 15px;
                min-width: 250px;
            }
            
            .event-icon {
                font-size: 32px;
                filter: drop-shadow(0 0 10px rgba(0, 255, 255, 0.5));
            }
            
            .event-text {
                flex: 1;
            }
            
            .event-name {
                font-size: 16px;
                font-weight: bold;
                color: #0ff;
                margin-bottom: 5px;
            }
            
            .event-distance {
                font-size: 12px;
                color: #aaa;
            }
            
            .event-marker {
                position: absolute;
                width: 40px;
                height: 40px;
                font-size: 24px;
                text-align: center;
                line-height: 40px;
                filter: drop-shadow(0 0 5px rgba(255, 255, 255, 0.8));
                animation: pulse 2s infinite;
                pointer-events: none;
            }
            
            @keyframes pulse {
                0%, 100% { transform: scale(1); opacity: 1; }
                50% { transform: scale(1.2); opacity: 0.8; }
            }
        `;
        document.head.appendChild(style);
    }
}