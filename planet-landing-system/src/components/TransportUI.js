// 輸送UI - 輸送契約の管理と輸送状況の表示

export class TransportUI {
    constructor(game) {
        this.game = game;
        this.isVisible = false;
        this.selectedShipType = 'small';
        this.selectedCargo = {
            iron: 0,
            energy: 0,
            crystal: 0
        };
        
        this.createUI();
        this.setupEventListeners();
    }
    
    createUI() {
        // メインコンテナ
        this.container = document.createElement('div');
        this.container.id = 'transport-ui';
        this.container.className = 'ui-panel';
        this.container.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(0, 20, 40, 0.95);
            border: 2px solid #00ffff;
            border-radius: 10px;
            padding: 20px;
            min-width: 500px;
            max-width: 800px;
            color: #ffffff;
            font-family: 'Orbitron', monospace;
            display: none;
            z-index: 1000;
        `;
        
        // ヘッダー
        const header = document.createElement('div');
        header.style.cssText = `
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 20px;
            padding-bottom: 10px;
            border-bottom: 1px solid #00ffff;
        `;
        
        const title = document.createElement('h2');
        title.textContent = '🚀 輸送ターミナル';
        title.style.cssText = `
            margin: 0;
            color: #00ffff;
            font-size: 24px;
        `;
        
        const closeBtn = document.createElement('button');
        closeBtn.textContent = '✕';
        closeBtn.style.cssText = `
            background: none;
            border: none;
            color: #ff4444;
            font-size: 20px;
            cursor: pointer;
        `;
        closeBtn.onclick = () => this.hide();
        
        header.appendChild(title);
        header.appendChild(closeBtn);
        
        // コンテンツエリア
        this.contentArea = document.createElement('div');
        this.contentArea.style.cssText = `
            display: flex;
            gap: 20px;
        `;
        
        // 左側：新規契約
        const leftPanel = document.createElement('div');
        leftPanel.style.cssText = `
            flex: 1;
            background: rgba(0, 0, 0, 0.5);
            padding: 15px;
            border-radius: 5px;
        `;
        
        const contractTitle = document.createElement('h3');
        contractTitle.textContent = '新規輸送契約';
        contractTitle.style.cssText = `
            margin: 0 0 15px 0;
            color: #44ff44;
            font-size: 18px;
        `;
        leftPanel.appendChild(contractTitle);
        
        // 輸送船タイプ選択
        const shipTypeSection = this.createShipTypeSelector();
        leftPanel.appendChild(shipTypeSection);
        
        // 貨物選択
        const cargoSection = this.createCargoSelector();
        leftPanel.appendChild(cargoSection);
        
        // 契約ボタン
        this.contractButton = document.createElement('button');
        this.contractButton.textContent = '輸送契約を作成';
        this.contractButton.style.cssText = `
            width: 100%;
            padding: 10px;
            margin-top: 15px;
            background: #44ff44;
            border: none;
            border-radius: 5px;
            color: #000000;
            font-weight: bold;
            cursor: pointer;
            transition: all 0.3s;
        `;
        this.contractButton.onmouseover = () => {
            this.contractButton.style.background = '#66ff66';
        };
        this.contractButton.onmouseout = () => {
            this.contractButton.style.background = '#44ff44';
        };
        this.contractButton.onclick = () => this.createContract();
        leftPanel.appendChild(this.contractButton);
        
        // 右側：現在の輸送状況
        const rightPanel = document.createElement('div');
        rightPanel.style.cssText = `
            flex: 1;
            background: rgba(0, 0, 0, 0.5);
            padding: 15px;
            border-radius: 5px;
        `;
        
        const statusTitle = document.createElement('h3');
        statusTitle.textContent = '輸送状況';
        statusTitle.style.cssText = `
            margin: 0 0 15px 0;
            color: #44ff44;
            font-size: 18px;
        `;
        rightPanel.appendChild(statusTitle);
        
        this.statusContainer = document.createElement('div');
        this.statusContainer.style.cssText = `
            max-height: 300px;
            overflow-y: auto;
        `;
        rightPanel.appendChild(this.statusContainer);
        
        // パネルを追加
        this.contentArea.appendChild(leftPanel);
        this.contentArea.appendChild(rightPanel);
        
        // ターミナル情報
        this.terminalInfo = document.createElement('div');
        this.terminalInfo.style.cssText = `
            margin-top: 20px;
            padding: 10px;
            background: rgba(0, 0, 0, 0.5);
            border-radius: 5px;
            font-size: 14px;
        `;
        
        // 組み立て
        this.container.appendChild(header);
        this.container.appendChild(this.contentArea);
        this.container.appendChild(this.terminalInfo);
        
        document.body.appendChild(this.container);
    }
    
    createShipTypeSelector() {
        const container = document.createElement('div');
        container.style.cssText = `
            margin-bottom: 15px;
        `;
        
        const label = document.createElement('div');
        label.textContent = '輸送船タイプ:';
        label.style.cssText = `
            margin-bottom: 5px;
            color: #aaaaaa;
        `;
        container.appendChild(label);
        
        const shipTypes = this.game.systems.transport.shipTypes;
        
        Object.entries(shipTypes).forEach(([type, data]) => {
            const option = document.createElement('div');
            option.style.cssText = `
                padding: 10px;
                margin: 5px 0;
                background: rgba(255, 255, 255, 0.1);
                border: 2px solid ${this.selectedShipType === type ? '#00ffff' : 'transparent'};
                border-radius: 5px;
                cursor: pointer;
                transition: all 0.3s;
            `;
            
            option.innerHTML = `
                <div style="font-weight: bold; color: #00ffff;">${data.name}</div>
                <div style="font-size: 12px; color: #aaaaaa;">
                    容量: ${data.capacity} | 速度: ${data.speed} | コスト: ${data.cost}
                </div>
            `;
            
            option.onclick = () => {
                this.selectedShipType = type;
                this.updateUI();
            };
            
            option.onmouseover = () => {
                if (this.selectedShipType !== type) {
                    option.style.border = '2px solid rgba(0, 255, 255, 0.5)';
                }
            };
            
            option.onmouseout = () => {
                if (this.selectedShipType !== type) {
                    option.style.border = '2px solid transparent';
                }
            };
            
            container.appendChild(option);
        });
        
        return container;
    }
    
    createCargoSelector() {
        const container = document.createElement('div');
        container.style.cssText = `
            margin-bottom: 15px;
        `;
        
        const label = document.createElement('div');
        label.textContent = '貨物内容:';
        label.style.cssText = `
            margin-bottom: 5px;
            color: #aaaaaa;
        `;
        container.appendChild(label);
        
        const resources = ['iron', 'energy', 'crystal'];
        const maxCapacity = this.game.systems.transport.shipTypes[this.selectedShipType].capacity;
        
        resources.forEach(resource => {
            const resourceContainer = document.createElement('div');
            resourceContainer.style.cssText = `
                display: flex;
                align-items: center;
                margin: 10px 0;
            `;
            
            const resourceLabel = document.createElement('span');
            resourceLabel.textContent = resource.charAt(0).toUpperCase() + resource.slice(1) + ':';
            resourceLabel.style.cssText = `
                width: 80px;
                color: #ffffff;
            `;
            
            const slider = document.createElement('input');
            slider.type = 'range';
            slider.min = 0;
            slider.max = maxCapacity;
            slider.value = this.selectedCargo[resource];
            slider.style.cssText = `
                flex: 1;
                margin: 0 10px;
            `;
            
            const valueDisplay = document.createElement('span');
            valueDisplay.textContent = this.selectedCargo[resource];
            valueDisplay.style.cssText = `
                width: 60px;
                text-align: right;
                color: #44ff44;
            `;
            
            slider.oninput = () => {
                const total = Object.values(this.selectedCargo).reduce((sum, val) => sum + val, 0) 
                            - this.selectedCargo[resource] + parseInt(slider.value);
                
                if (total <= maxCapacity) {
                    this.selectedCargo[resource] = parseInt(slider.value);
                    valueDisplay.textContent = slider.value;
                } else {
                    slider.value = this.selectedCargo[resource];
                }
                
                this.updateCargoDisplay();
            };
            
            resourceContainer.appendChild(resourceLabel);
            resourceContainer.appendChild(slider);
            resourceContainer.appendChild(valueDisplay);
            container.appendChild(resourceContainer);
        });
        
        // 容量表示
        this.capacityDisplay = document.createElement('div');
        this.capacityDisplay.style.cssText = `
            margin-top: 10px;
            text-align: center;
            color: #ffff44;
        `;
        container.appendChild(this.capacityDisplay);
        
        this.updateCargoDisplay();
        
        return container;
    }
    
    updateCargoDisplay() {
        const total = Object.values(this.selectedCargo).reduce((sum, val) => sum + val, 0);
        const maxCapacity = this.game.systems.transport.shipTypes[this.selectedShipType].capacity;
        this.capacityDisplay.textContent = `容量: ${total} / ${maxCapacity}`;
        
        if (total > maxCapacity) {
            this.capacityDisplay.style.color = '#ff4444';
        } else if (total === maxCapacity) {
            this.capacityDisplay.style.color = '#44ff44';
        } else {
            this.capacityDisplay.style.color = '#ffff44';
        }
    }
    
    createContract() {
        const transport = this.game.systems.transport;
        
        // ターミナルがあるかチェック
        if (!transport.hasAvailableTerminal()) {
            this.game.showMessage('利用可能な輸送ターミナルがありません', 'error');
            return;
        }
        
        // 貨物が空でないかチェック
        const total = Object.values(this.selectedCargo).reduce((sum, val) => sum + val, 0);
        if (total === 0) {
            this.game.showMessage('貨物を選択してください', 'warning');
            return;
        }
        
        // コスト計算
        const cost = transport.calculateTransportCost({
            from: 'current_planet',
            to: 'earth',
            cargo: this.selectedCargo,
            shipType: this.selectedShipType
        });
        
        // 資源チェック
        const resources = this.game.systems.resource.getResources();
        if (resources.credits < cost) {
            this.game.showMessage(`クレジットが不足しています (必要: ${cost})`, 'error');
            return;
        }
        
        // 契約作成
        const contract = transport.createContract({
            from: 'current_planet',
            to: 'earth',
            cargo: { ...this.selectedCargo },
            shipType: this.selectedShipType,
            type: 'regular'
        });
        
        // コストを支払う
        this.game.systems.resource.consumeResource('credits', cost);
        
        this.game.showMessage('輸送契約を作成しました！', 'success');
        this.updateUI();
        
        // 貨物をリセット
        this.selectedCargo = { iron: 0, energy: 0, crystal: 0 };
    }
    
    updateUI() {
        // 輸送状況を更新
        this.updateTransportStatus();
        
        // ターミナル情報を更新
        this.updateTerminalInfo();
        
        // UIを再描画（選択状態の更新など）
        const shipOptions = this.container.querySelectorAll('.ship-option');
        shipOptions.forEach(option => {
            // 実装が必要な場合
        });
    }
    
    updateTransportStatus() {
        const data = this.game.systems.transport.getTransportData();
        
        this.statusContainer.innerHTML = '';
        
        if (data.schedule.length === 0) {
            this.statusContainer.innerHTML = '<div style="color: #aaaaaa;">輸送中の船はありません</div>';
            return;
        }
        
        data.schedule.forEach(scheduled => {
            const contract = data.contracts.find(c => c.id === scheduled.contractId);
            if (!contract) return;
            
            const statusItem = document.createElement('div');
            statusItem.style.cssText = `
                padding: 10px;
                margin: 5px 0;
                background: rgba(255, 255, 255, 0.1);
                border-radius: 5px;
            `;
            
            const shipInfo = this.game.systems.transport.shipTypes[contract.shipType];
            const timeRemaining = Math.max(0, scheduled.arrivalTime - Date.now()) / 1000;
            
            statusItem.innerHTML = `
                <div style="font-weight: bold; color: #44ff44;">
                    ${shipInfo.name} - ${scheduled.status === 'in_transit' ? '輸送中' : 'スケジュール済み'}
                </div>
                <div style="font-size: 12px; color: #aaaaaa;">
                    貨物: ${this.formatCargo(contract.cargo)}
                </div>
                <div style="font-size: 12px; color: #ffff44;">
                    到着まで: ${Math.floor(timeRemaining)}秒
                </div>
            `;
            
            this.statusContainer.appendChild(statusItem);
        });
    }
    
    updateTerminalInfo() {
        const data = this.game.systems.transport.getTransportData();
        
        let terminalCount = data.terminals.length;
        let totalCapacity = 0;
        let usedCapacity = 0;
        
        data.terminals.forEach(terminal => {
            totalCapacity += terminal.capacity;
            usedCapacity += terminal.currentShips;
        });
        
        this.terminalInfo.innerHTML = `
            <div style="color: #00ffff;">ターミナル情報</div>
            <div style="margin-top: 5px;">
                ターミナル数: ${terminalCount} | 
                着陸容量: ${usedCapacity}/${totalCapacity} | 
                輸送中: ${data.schedule.length}
            </div>
        `;
    }
    
    formatCargo(cargo) {
        const parts = [];
        Object.entries(cargo).forEach(([resource, amount]) => {
            if (amount > 0) {
                parts.push(`${resource}: ${amount}`);
            }
        });
        return parts.join(', ');
    }
    
    setupEventListeners() {
        // Yキーでトグル（TはすでにDebugで使用中のため）
        document.addEventListener('keydown', (e) => {
            if (e.key.toLowerCase() === 'y' && !e.ctrlKey && !e.altKey) {
                if (this.isVisible) {
                    this.hide();
                } else {
                    this.show();
                }
            }
        });
    }
    
    show() {
        if (!this.game.systems.transport.hasAvailableTerminal()) {
            this.game.showMessage('輸送ターミナルを建設してください', 'warning');
            return;
        }
        
        this.isVisible = true;
        this.container.style.display = 'block';
        this.updateUI();
        
        // 定期更新
        this.updateInterval = setInterval(() => {
            this.updateUI();
        }, 1000);
    }
    
    hide() {
        this.isVisible = false;
        this.container.style.display = 'none';
        
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }
    }
}