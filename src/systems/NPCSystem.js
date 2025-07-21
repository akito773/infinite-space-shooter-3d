// NPC雇用・管理システム

export class NPCSystem {
    constructor(game) {
        this.game = game;
        this.npcs = new Map(); // ID -> NPC
        this.ships = new Map(); // ID -> NPCShip
        this.nextId = 1;
        
        // NPC名前生成用データ
        this.firstNames = [
            '太郎', '次郎', '花子', 'ケン', 'ユリ', 'アキラ', 'ミカ',
            'ジョン', 'サラ', 'マイク', 'エマ', 'リュウ', 'アイ'
        ];
        this.lastNames = [
            '田中', '鈴木', '佐藤', '山田', '高橋', '渡辺',
            'スミス', 'ジョンソン', 'ウィリアムズ', 'ブラウン'
        ];
        
        // 特性リスト
        this.traits = {
            positive: ['慎重', '効率的', '勇敢', '熟練', '幸運', '節約家'],
            negative: ['臆病', '浪費家', '短気', '不注意']
        };
        
        // 船タイプ定義
        this.shipTypes = {
            transport_small: {
                name: '小型輸送船',
                capacity: 100,
                speed: 50,
                cost: 5000,
                maintenance: 50,
                model: 'transport_small'
            },
            transport_large: {
                name: '大型貨物船',
                capacity: 500,
                speed: 30,
                cost: 20000,
                maintenance: 200,
                model: 'transport_large'
            },
            mining: {
                name: '採掘船',
                miningRate: 10,
                capacity: 200,
                speed: 40,
                cost: 10000,
                maintenance: 100,
                model: 'mining_ship'
            },
            escort: {
                name: '護衛艦',
                firepower: 20,
                speed: 70,
                cost: 8000,
                maintenance: 80,
                model: 'escort_ship'
            },
            construction: {
                name: '建設船',
                buildSpeed: 1,
                speed: 35,
                cost: 30000,
                maintenance: 300,
                model: 'construction_ship'
            }
        };
        
        // タスクキュー
        this.taskQueue = [];
        
        // 日次更新用タイマー
        this.dayTimer = 0;
        this.dayLength = 60000; // 60秒 = 1日
        
        this.init();
    }
    
    init() {
        // UI要素を作成
        this.createUI();
        
        // イベントリスナー
        this.game.eventBus.on('openHiringOffice', () => this.openHiringOffice());
        this.game.eventBus.on('dayPassed', () => this.onDayPassed());
    }
    
    generateNPC(shipType = null) {
        const npc = {
            id: `npc_${this.nextId++}`,
            name: this.generateName(),
            skill: Math.floor(Math.random() * 5) + 3, // 3-7
            loyalty: Math.floor(Math.random() * 3) + 5, // 5-7
            experience: 0,
            salary: Math.floor(Math.random() * 50) + 75, // 75-125
            shipType: shipType,
            currentTask: null,
            traits: this.generateTraits(),
            hired: false,
            fatigue: 0,
            morale: 75
        };
        
        // スキルに応じて給料調整
        npc.salary = Math.floor(npc.salary * (1 + (npc.skill - 5) * 0.1));
        
        return npc;
    }
    
    generateName() {
        const firstName = this.firstNames[Math.floor(Math.random() * this.firstNames.length)];
        const lastName = this.lastNames[Math.floor(Math.random() * this.lastNames.length)];
        return `${lastName} ${firstName}`;
    }
    
    generateTraits() {
        const traits = [];
        
        // 1-2個のポジティブ特性
        const numPositive = Math.random() < 0.7 ? 1 : 2;
        for (let i = 0; i < numPositive; i++) {
            const trait = this.traits.positive[Math.floor(Math.random() * this.traits.positive.length)];
            if (!traits.includes(trait)) traits.push(trait);
        }
        
        // 20%の確率でネガティブ特性
        if (Math.random() < 0.2) {
            const trait = this.traits.negative[Math.floor(Math.random() * this.traits.negative.length)];
            traits.push(trait);
        }
        
        return traits;
    }
    
    hireNPC(npcId, shipType) {
        const npc = this.npcs.get(npcId);
        if (!npc || npc.hired) return false;
        
        const ship = this.shipTypes[shipType];
        if (!ship) return false;
        
        // コストチェック
        const totalCost = ship.cost;
        if (this.game.inventorySystem.credits < totalCost) {
            this.game.showMessage('資金が不足しています');
            return false;
        }
        
        // 雇用実行
        this.game.inventorySystem.removeCredits(totalCost);
        npc.hired = true;
        npc.shipType = shipType;
        
        // 船を作成
        this.createNPCShip(npc);
        
        this.game.showMessage(`${npc.name}を雇用しました！`);
        return true;
    }
    
    createNPCShip(npc) {
        const shipData = this.shipTypes[npc.shipType];
        
        const ship = {
            id: `ship_${npc.id}`,
            npcId: npc.id,
            type: npc.shipType,
            position: { x: 0, y: 0, z: 0 },
            destination: null,
            cargo: [],
            cargoCapacity: shipData.capacity || 0,
            speed: shipData.speed,
            status: 'idle', // idle, moving, working, combat
            health: 100,
            maxHealth: 100
        };
        
        this.ships.set(ship.id, ship);
        
        // 3Dオブジェクトを作成（簡易版）
        // TODO: 実際の船モデルを作成
        
        return ship;
    }
    
    assignTask(npcId, task) {
        const npc = this.npcs.get(npcId);
        if (!npc || !npc.hired) return false;
        
        const ship = this.getShipByNPC(npcId);
        if (!ship) return false;
        
        // 現在のタスクをキャンセル
        if (npc.currentTask) {
            this.cancelTask(npc.currentTask);
        }
        
        // 新しいタスクを割り当て
        npc.currentTask = task;
        task.assignedNPC = npcId;
        task.status = 'active';
        
        // タスクタイプに応じて処理
        this.executeTask(task);
        
        return true;
    }
    
    executeTask(task) {
        const npc = this.npcs.get(task.assignedNPC);
        const ship = this.getShipByNPC(task.assignedNPC);
        
        switch (task.type) {
            case 'transport':
                this.executeTransportTask(ship, task);
                break;
            case 'mining':
                this.executeMiningTask(ship, task);
                break;
            case 'escort':
                this.executeEscortTask(ship, task);
                break;
            case 'construction':
                this.executeConstructionTask(ship, task);
                break;
        }
    }
    
    executeTransportTask(ship, task) {
        ship.status = 'moving';
        ship.destination = task.from;
        
        // 簡易的な移動シミュレーション
        // TODO: 実際の経路探索と移動を実装
        
        this.game.showMessage(`${this.npcs.get(ship.npcId).name}が輸送任務を開始しました`);
    }
    
    executeMiningTask(ship, task) {
        ship.status = 'moving';
        ship.destination = task.location;
        
        this.game.showMessage(`${this.npcs.get(ship.npcId).name}が採掘任務を開始しました`);
    }
    
    getShipByNPC(npcId) {
        for (const [id, ship] of this.ships) {
            if (ship.npcId === npcId) return ship;
        }
        return null;
    }
    
    update(delta) {
        // 日次タイマー更新
        this.dayTimer += delta;
        if (this.dayTimer >= this.dayLength) {
            this.dayTimer = 0;
            this.onDayPassed();
        }
        
        // NPC船の更新
        for (const [id, ship] of this.ships) {
            this.updateShip(ship, delta);
        }
    }
    
    updateShip(ship, delta) {
        const npc = this.npcs.get(ship.npcId);
        if (!npc) return;
        
        switch (ship.status) {
            case 'moving':
                // 目的地への移動
                if (ship.destination) {
                    // 簡易的な移動処理
                    const dx = ship.destination.x - ship.position.x;
                    const dz = ship.destination.z - ship.position.z;
                    const distance = Math.sqrt(dx * dx + dz * dz);
                    
                    if (distance < 50) {
                        // 到着
                        ship.status = 'idle';
                        this.onShipArrived(ship);
                    } else {
                        // 移動
                        const moveDistance = ship.speed * delta / 1000;
                        ship.position.x += (dx / distance) * moveDistance;
                        ship.position.z += (dz / distance) * moveDistance;
                    }
                }
                break;
                
            case 'working':
                // 作業中の処理
                if (npc.currentTask) {
                    this.updateTaskProgress(npc.currentTask, delta);
                }
                break;
        }
    }
    
    onShipArrived(ship) {
        const npc = this.npcs.get(ship.npcId);
        if (!npc || !npc.currentTask) return;
        
        const task = npc.currentTask;
        
        switch (task.type) {
            case 'transport':
                if (ship.position === task.from) {
                    // 積み込み
                    ship.cargo = task.cargo;
                    ship.destination = task.to;
                    ship.status = 'moving';
                } else {
                    // 荷下ろし
                    task.status = 'completed';
                    this.completeTask(task);
                }
                break;
                
            case 'mining':
                ship.status = 'working';
                break;
        }
    }
    
    completeTask(task) {
        const npc = this.npcs.get(task.assignedNPC);
        if (!npc) return;
        
        // 経験値を付与
        npc.experience += 10;
        
        // スキルアップチェック
        if (npc.experience >= npc.skill * 100) {
            npc.skill = Math.min(10, npc.skill + 1);
            this.game.showMessage(`${npc.name}のスキルが上昇しました！`);
        }
        
        // タスククリア
        npc.currentTask = null;
        
        // 報酬処理
        if (task.reward) {
            this.game.inventorySystem.addCredits(task.reward);
        }
    }
    
    onDayPassed() {
        let totalSalary = 0;
        let totalIncome = 0;
        
        // 給料支払い
        for (const [id, npc] of this.npcs) {
            if (npc.hired) {
                totalSalary += npc.salary;
                
                // 士気の更新
                if (this.game.inventorySystem.credits >= npc.salary) {
                    npc.morale = Math.min(100, npc.morale + 5);
                } else {
                    npc.morale = Math.max(0, npc.morale - 20);
                    this.game.showMessage(`${npc.name}の士気が低下しています！`);
                }
            }
        }
        
        // 自動収入（採掘船など）
        for (const [id, ship] of this.ships) {
            if (ship.type === 'mining' && ship.status === 'working') {
                const miningRate = this.shipTypes.mining.miningRate;
                totalIncome += miningRate * 24; // 1日分
            }
        }
        
        // 収支処理
        this.game.inventorySystem.removeCredits(totalSalary);
        this.game.inventorySystem.addCredits(totalIncome);
        
        // 収支レポート表示
        this.showDailyReport(totalIncome, totalSalary);
    }
    
    showDailyReport(income, expenses) {
        const profit = income - expenses;
        const message = `
            【日次レポート】
            収入: +${income} cr
            支出: -${expenses} cr
            純利益: ${profit >= 0 ? '+' : ''}${profit} cr
        `;
        
        this.game.showMessage(message);
    }
    
    createUI() {
        // 艦隊管理UIのベース
        const fleetUI = document.createElement('div');
        fleetUI.id = 'fleet-management';
        fleetUI.style.cssText = `
            position: absolute;
            top: 60px;
            right: 20px;
            background: rgba(0, 0, 0, 0.8);
            border: 1px solid #0ff;
            padding: 10px;
            color: white;
            font-family: monospace;
            display: none;
        `;
        
        document.body.appendChild(fleetUI);
    }
    
    openHiringOffice() {
        // 雇用オフィスUI
        // TODO: 実装
        this.game.showMessage('雇用オフィスは準備中です');
    }
    
    getFleetStatus() {
        const status = {
            totalShips: this.ships.size,
            activeShips: 0,
            idleShips: 0,
            types: {}
        };
        
        for (const [id, ship] of this.ships) {
            if (ship.status === 'idle') {
                status.idleShips++;
            } else {
                status.activeShips++;
            }
            
            status.types[ship.type] = (status.types[ship.type] || 0) + 1;
        }
        
        return status;
    }
}