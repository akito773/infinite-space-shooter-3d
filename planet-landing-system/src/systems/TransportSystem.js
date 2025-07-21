// 輸送システム - 惑星間の資源輸送を管理

import * as THREE from 'three';
import { BUILDING_TYPES } from '../data/buildings.js';

export class TransportSystem {
    constructor(game) {
        this.game = game;
        
        // 輸送船管理
        this.transportShips = [];
        this.maxShips = 10;
        
        // ターミナル管理
        this.terminals = [];
        
        // 輸送契約
        this.contracts = [];
        this.nextContractId = 1;
        
        // 輸送スケジュール
        this.schedule = [];
        
        // 輸送船タイプ
        this.shipTypes = {
            small: {
                name: '小型輸送船',
                capacity: 100,
                speed: 50,
                cost: 1000,
                fuelConsumption: 5
            },
            medium: {
                name: '中型輸送船',
                capacity: 500,
                speed: 30,
                cost: 3000,
                fuelConsumption: 15
            },
            large: {
                name: '大型輸送船',
                capacity: 2000,
                speed: 20,
                cost: 8000,
                fuelConsumption: 40
            }
        };
        
        // 輸送コスト計算用
        this.baseCostPerUnit = 0.1;
        this.distanceMultiplier = 0.01;
    }
    
    // ターミナルを登録
    registerTerminal(building) {
        if (building.type === 'transport_terminal') {
            this.terminals.push({
                id: building.id,
                building: building,
                currentShips: [],
                storageBuffer: {
                    credits: 0,
                    iron: 0,
                    energy: 0,
                    crystal: 0
                }
            });
            console.log('輸送ターミナル登録:', building.id);
        }
    }
    
    // ターミナルを削除
    unregisterTerminal(buildingId) {
        const index = this.terminals.findIndex(t => t.id === buildingId);
        if (index !== -1) {
            this.terminals.splice(index, 1);
            console.log('輸送ターミナル削除:', buildingId);
        }
    }
    
    // 輸送契約を作成
    createContract(params) {
        // 資源の在庫確認と消費
        const resources = this.game.systems.resource.getResources();
        for (const [resource, amount] of Object.entries(params.cargo)) {
            if (resources[resource] < amount) {
                console.error(`資源不足: ${resource} (必要: ${amount}, 在庫: ${resources[resource]})`);
                return null;
            }
        }
        
        // 資源を消費
        for (const [resource, amount] of Object.entries(params.cargo)) {
            this.game.systems.resource.consumeResource(resource, amount);
        }
        
        const contract = {
            id: this.nextContractId++,
            type: params.type || 'regular', // regular, priority, bulk
            from: params.from, // 出発惑星
            to: params.to, // 到着惑星
            cargo: params.cargo, // { iron: 100, energy: 50 }
            shipType: params.shipType || 'small',
            frequency: params.frequency || 'once', // once, daily, weekly
            status: 'pending',
            createdAt: Date.now(),
            cost: this.calculateTransportCost(params)
        };
        
        this.contracts.push(contract);
        this.scheduleTransport(contract);
        
        return contract;
    }
    
    // 輸送コスト計算
    calculateTransportCost(params) {
        const ship = this.shipTypes[params.shipType || 'small'];
        const cargoAmount = Object.values(params.cargo).reduce((sum, amount) => sum + amount, 0);
        const distance = this.calculateDistance(params.from, params.to);
        
        let cost = ship.cost;
        cost += cargoAmount * this.baseCostPerUnit;
        cost += distance * this.distanceMultiplier * ship.fuelConsumption;
        
        // 優先輸送は追加料金
        if (params.type === 'priority') {
            cost *= 1.5;
        }
        
        return Math.floor(cost);
    }
    
    // 惑星間距離計算（仮実装）
    calculateDistance(from, to) {
        // TODO: 実際の惑星位置から計算
        return 1000;
    }
    
    // 輸送をスケジュール
    scheduleTransport(contract) {
        const ship = this.createTransportShip(contract);
        const travelTime = this.calculateTravelTime(contract);
        
        this.schedule.push({
            contractId: contract.id,
            ship: ship,
            departureTime: Date.now() + 5000, // 5秒後に出発
            arrivalTime: Date.now() + 5000 + travelTime,
            status: 'scheduled'
        });
    }
    
    // 輸送船を作成
    createTransportShip(contract) {
        const shipType = this.shipTypes[contract.shipType];
        const ship = {
            id: `ship_${Date.now()}`,
            type: contract.shipType,
            cargo: { ...contract.cargo },
            position: new THREE.Vector3(0, 100, 0), // 初期位置（上空）
            destination: null,
            speed: shipType.speed,
            status: 'idle',
            visual: null
        };
        
        // ビジュアル作成
        this.createShipVisual(ship);
        
        this.transportShips.push(ship);
        return ship;
    }
    
    // 輸送船のビジュアル作成
    createShipVisual(ship) {
        const geometry = new THREE.ConeGeometry(2, 8, 8);
        const material = new THREE.MeshPhongMaterial({
            color: 0xcccccc,
            emissive: 0x444444
        });
        
        ship.visual = new THREE.Mesh(geometry, material);
        ship.visual.rotation.x = Math.PI / 2;
        ship.visual.position.copy(ship.position);
        
        if (this.game.currentScene === 'surface' && this.game.surfaceScene) {
            this.game.surfaceScene.add(ship.visual);
        }
    }
    
    // 移動時間計算
    calculateTravelTime(contract) {
        const distance = this.calculateDistance(contract.from, contract.to);
        const ship = this.shipTypes[contract.shipType];
        return (distance / ship.speed) * 1000; // ミリ秒
    }
    
    // システム更新
    update(deltaTime) {
        // スケジュールされた輸送の処理
        this.updateSchedule();
        
        // 輸送船の移動
        this.updateShips(deltaTime);
        
        // ターミナルの処理
        this.updateTerminals(deltaTime);
    }
    
    // スケジュール更新
    updateSchedule() {
        const now = Date.now();
        
        for (const scheduled of this.schedule) {
            if (scheduled.status === 'scheduled' && now >= scheduled.departureTime) {
                this.startTransport(scheduled);
            } else if (scheduled.status === 'in_transit' && now >= scheduled.arrivalTime) {
                this.completeTransport(scheduled);
            }
        }
    }
    
    // 輸送開始
    startTransport(scheduled) {
        scheduled.status = 'in_transit';
        scheduled.ship.status = 'in_transit';
        
        // ターミナルから離陸アニメーション
        if (scheduled.ship.visual) {
            // TODO: 離陸アニメーション
        }
        
        console.log(`輸送船 ${scheduled.ship.id} が出発しました`);
        this.game.showMessage('輸送船が出発しました', 'info');
    }
    
    // 輸送完了
    completeTransport(scheduled) {
        scheduled.status = 'completed';
        scheduled.ship.status = 'arrived';
        
        // 資源を目的地に配送（デモ用：売却してクレジットを獲得）
        const contract = this.contracts.find(c => c.id === scheduled.contractId);
        if (contract && this.game.systems.resource) {
            // 輸送した資源の価値を計算
            let totalValue = 0;
            const resourcePrices = {
                iron: 10,
                energy: 20,
                crystal: 100
            };
            
            for (const [resource, amount] of Object.entries(contract.cargo)) {
                totalValue += (resourcePrices[resource] || 10) * amount;
            }
            
            // クレジットを追加（輸送報酬）
            this.game.systems.resource.addResource('credits', totalValue);
            
            console.log(`輸送完了！売却益: ${totalValue} クレジット`);
            this.game.showMessage(`輸送完了！売却益: ${totalValue} クレジット`, 'success');
        }
        
        console.log(`輸送船 ${scheduled.ship.id} が到着しました`);
        
        // 船を削除
        this.removeShip(scheduled.ship);
        
        // スケジュールから削除
        const index = this.schedule.indexOf(scheduled);
        if (index !== -1) {
            this.schedule.splice(index, 1);
        }
    }
    
    // 輸送船の更新
    updateShips(deltaTime) {
        for (const ship of this.transportShips) {
            if (ship.status === 'in_transit' && ship.visual) {
                // 簡単な移動アニメーション
                ship.visual.position.y = 50 + Math.sin(Date.now() * 0.001) * 10;
                ship.visual.rotation.z += deltaTime;
            }
        }
    }
    
    // ターミナル更新
    updateTerminals(deltaTime) {
        for (const terminal of this.terminals) {
            // ターミナルのバッファから本体の資源システムへ転送
            const building = terminal.building;
            const stats = this.game.systems.building.getBuildingStats(building);
            
            if (stats && stats.effects) {
                const transferSpeed = stats.effects.transferSpeed || 10;
                const transferAmount = transferSpeed * deltaTime;
                
                // バッファから資源を転送
                for (const [resource, amount] of Object.entries(terminal.storageBuffer)) {
                    if (amount > 0) {
                        const toTransfer = Math.min(amount, transferAmount);
                        terminal.storageBuffer[resource] -= toTransfer;
                        this.game.systems.resource.addResource(resource, toTransfer);
                    }
                }
            }
        }
    }
    
    // 輸送船を削除
    removeShip(ship) {
        if (ship.visual && this.game.surfaceScene) {
            this.game.surfaceScene.remove(ship.visual);
            ship.visual.geometry.dispose();
            ship.visual.material.dispose();
        }
        
        const index = this.transportShips.indexOf(ship);
        if (index !== -1) {
            this.transportShips.splice(index, 1);
        }
    }
    
    // 利用可能なターミナルがあるか確認
    hasAvailableTerminal() {
        return this.terminals.some(terminal => {
            const building = terminal.building;
            const stats = this.game.systems.building.getBuildingStats(building);
            return stats && terminal.currentShips.length < stats.effects.shipCapacity;
        });
    }
    
    // 輸送UI用のデータ取得
    getTransportData() {
        return {
            terminals: this.terminals.map(t => ({
                id: t.id,
                capacity: this.game.systems.building.getBuildingStats(t.building).effects.shipCapacity,
                currentShips: t.currentShips.length,
                storageBuffer: { ...t.storageBuffer }
            })),
            contracts: this.contracts.filter(c => c.status !== 'completed'),
            schedule: this.schedule.filter(s => s.status !== 'completed'),
            shipTypes: this.shipTypes
        };
    }
}