// インベントリUI

export class InventoryUI {
    constructor(game) {
        this.game = game;
        this.inventorySystem = game.inventorySystem;
        this.isOpen = false;
        this.selectedTab = 'all';
        this.selectedItem = null;
        
        this.createUI();
        this.setupEventListeners();
        this.updateDisplay();
    }
    
    createUI() {
        // メインコンテナ
        this.container = document.createElement('div');
        this.container.id = 'inventory-ui';
        this.container.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 800px;
            height: 600px;
            background: linear-gradient(to bottom, rgba(0, 10, 30, 0.98), rgba(0, 20, 40, 0.98));
            border: 2px solid #00ffff;
            border-radius: 10px;
            display: none;
            z-index: 5000;
            font-family: 'Orbitron', monospace;
            color: white;
            box-shadow: 0 0 30px rgba(0, 255, 255, 0.5);
        `;
        
        // ヘッダー
        const header = document.createElement('div');
        header.style.cssText = `
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 20px;
            border-bottom: 2px solid #00ffff;
        `;
        
        const title = document.createElement('h2');
        title.textContent = 'インベントリ';
        title.style.cssText = `
            margin: 0;
            color: #00ffff;
            font-size: 24px;
            text-shadow: 0 0 10px rgba(0, 255, 255, 0.5);
        `;
        
        const closeButton = document.createElement('button');
        closeButton.textContent = '✕';
        closeButton.style.cssText = `
            background: none;
            border: 2px solid #ff4444;
            color: #ff4444;
            width: 40px;
            height: 40px;
            border-radius: 5px;
            cursor: pointer;
            font-size: 20px;
            transition: all 0.3s;
        `;
        closeButton.onclick = () => this.close();
        
        header.appendChild(title);
        header.appendChild(closeButton);
        
        // メインコンテンツ
        const content = document.createElement('div');
        content.style.cssText = `
            display: flex;
            height: calc(100% - 80px);
        `;
        
        // 左側：装備スロット
        const equipmentPanel = this.createEquipmentPanel();
        
        // 右側：アイテムリスト
        const itemsPanel = this.createItemsPanel();
        
        content.appendChild(equipmentPanel);
        content.appendChild(itemsPanel);
        
        this.container.appendChild(header);
        this.container.appendChild(content);
        document.body.appendChild(this.container);
        
        // スタイル追加
        this.addStyles();
    }
    
    createEquipmentPanel() {
        const panel = document.createElement('div');
        panel.style.cssText = `
            width: 300px;
            padding: 20px;
            border-right: 1px solid #00ffff;
        `;
        
        const title = document.createElement('h3');
        title.textContent = '装備中';
        title.style.cssText = `
            color: #00ffff;
            margin-bottom: 20px;
            font-size: 18px;
        `;
        panel.appendChild(title);
        
        // 装備スロット
        this.equipmentSlots = {};
        const slots = [
            { id: 'weapon', name: '武器', icon: '🔫' },
            { id: 'shield', name: 'シールド', icon: '🛡️' },
            { id: 'engine', name: 'エンジン', icon: '🚀' },
            { id: 'special', name: '特殊装備', icon: '⚡' }
        ];
        
        slots.forEach(slot => {
            const slotElement = document.createElement('div');
            slotElement.className = 'equipment-slot';
            slotElement.dataset.slot = slot.id;
            
            const slotIcon = document.createElement('div');
            slotIcon.className = 'slot-icon';
            slotIcon.textContent = slot.icon;
            
            const slotInfo = document.createElement('div');
            slotInfo.className = 'slot-info';
            
            const slotName = document.createElement('div');
            slotName.className = 'slot-name';
            slotName.textContent = slot.name;
            
            const slotItem = document.createElement('div');
            slotItem.className = 'slot-item';
            slotItem.textContent = '空き';
            
            slotInfo.appendChild(slotName);
            slotInfo.appendChild(slotItem);
            
            slotElement.appendChild(slotIcon);
            slotElement.appendChild(slotInfo);
            
            panel.appendChild(slotElement);
            this.equipmentSlots[slot.id] = slotItem;
        });
        
        // ステータス表示
        const stats = document.createElement('div');
        stats.className = 'equipment-stats';
        stats.style.cssText = `
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #0088ff;
        `;
        
        const statsTitle = document.createElement('h4');
        statsTitle.textContent = 'ステータス';
        statsTitle.style.cssText = `
            color: #ffaa00;
            margin-bottom: 10px;
        `;
        stats.appendChild(statsTitle);
        
        this.statsDisplay = document.createElement('div');
        this.statsDisplay.id = 'equipment-stats-display';
        stats.appendChild(this.statsDisplay);
        
        panel.appendChild(stats);
        
        return panel;
    }
    
    createItemsPanel() {
        const panel = document.createElement('div');
        panel.style.cssText = `
            flex: 1;
            padding: 20px;
            display: flex;
            flex-direction: column;
        `;
        
        // タブ
        const tabs = document.createElement('div');
        tabs.className = 'inventory-tabs';
        tabs.style.cssText = `
            display: flex;
            gap: 10px;
            margin-bottom: 20px;
        `;
        
        const tabTypes = [
            { id: 'all', name: 'すべて' },
            { id: 'weapon', name: '武器' },
            { id: 'shield', name: 'シールド' },
            { id: 'item', name: 'アイテム' }
        ];
        
        tabTypes.forEach(tab => {
            const tabButton = document.createElement('button');
            tabButton.className = 'inventory-tab';
            tabButton.dataset.tab = tab.id;
            tabButton.textContent = tab.name;
            tabButton.onclick = () => this.selectTab(tab.id);
            tabs.appendChild(tabButton);
        });
        
        panel.appendChild(tabs);
        
        // アイテムグリッド
        this.itemGrid = document.createElement('div');
        this.itemGrid.className = 'item-grid';
        this.itemGrid.style.cssText = `
            flex: 1;
            display: grid;
            grid-template-columns: repeat(6, 1fr);
            gap: 10px;
            overflow-y: auto;
            padding: 10px;
            background: rgba(0, 0, 0, 0.3);
            border-radius: 5px;
        `;
        
        panel.appendChild(this.itemGrid);
        
        // アイテム詳細
        this.itemDetail = document.createElement('div');
        this.itemDetail.className = 'item-detail';
        this.itemDetail.style.cssText = `
            height: 150px;
            margin-top: 20px;
            padding: 15px;
            background: rgba(0, 50, 100, 0.3);
            border: 1px solid #0088ff;
            border-radius: 5px;
        `;
        
        panel.appendChild(this.itemDetail);
        
        return panel;
    }
    
    addStyles() {
        if (document.querySelector('#inventory-ui-styles')) return;
        
        const style = document.createElement('style');
        style.id = 'inventory-ui-styles';
        style.textContent = `
            .equipment-slot {
                display: flex;
                align-items: center;
                padding: 15px;
                margin-bottom: 10px;
                background: rgba(0, 50, 100, 0.3);
                border: 2px solid #0088ff;
                border-radius: 5px;
                cursor: pointer;
                transition: all 0.3s;
            }
            
            .equipment-slot:hover {
                background: rgba(0, 100, 200, 0.5);
                border-color: #00ffff;
                transform: translateX(5px);
            }
            
            .equipment-slot.active {
                border-color: #ffaa00;
                box-shadow: 0 0 10px rgba(255, 170, 0, 0.5);
            }
            
            .slot-icon {
                font-size: 32px;
                margin-right: 15px;
            }
            
            .slot-info {
                flex: 1;
            }
            
            .slot-name {
                color: #00ffff;
                font-size: 14px;
                margin-bottom: 5px;
            }
            
            .slot-item {
                color: white;
                font-size: 16px;
            }
            
            .inventory-tab {
                padding: 10px 20px;
                background: rgba(0, 50, 100, 0.5);
                border: 1px solid #0088ff;
                color: white;
                cursor: pointer;
                transition: all 0.3s;
                font-size: 14px;
            }
            
            .inventory-tab:hover {
                background: rgba(0, 100, 200, 0.7);
            }
            
            .inventory-tab.active {
                background: #0088ff;
                border-color: #00ffff;
            }
            
            .item-slot {
                aspect-ratio: 1;
                background: rgba(0, 50, 100, 0.3);
                border: 2px solid #0088ff;
                border-radius: 5px;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                cursor: pointer;
                transition: all 0.2s;
                position: relative;
            }
            
            .item-slot:hover {
                background: rgba(0, 100, 200, 0.5);
                border-color: #00ffff;
                transform: scale(1.05);
            }
            
            .item-slot.selected {
                border-color: #ffaa00;
                box-shadow: 0 0 10px rgba(255, 170, 0, 0.5);
            }
            
            .item-icon {
                font-size: 32px;
                margin-bottom: 5px;
            }
            
            .item-name {
                font-size: 10px;
                text-align: center;
                color: #aaa;
            }
            
            .item-quantity {
                position: absolute;
                bottom: 5px;
                right: 5px;
                background: #ffaa00;
                color: black;
                padding: 2px 5px;
                border-radius: 3px;
                font-size: 10px;
                font-weight: bold;
            }
            
            .item-detail h4 {
                color: #00ffff;
                margin: 0 0 10px 0;
            }
            
            .item-detail-stats {
                font-size: 14px;
                line-height: 1.6;
            }
            
            .item-actions {
                margin-top: 15px;
                display: flex;
                gap: 10px;
            }
            
            .action-button {
                padding: 8px 16px;
                background: #0088ff;
                border: none;
                color: white;
                cursor: pointer;
                border-radius: 5px;
                transition: all 0.3s;
            }
            
            .action-button:hover {
                background: #00aaff;
                transform: scale(1.05);
            }
            
            .action-button:disabled {
                background: #444;
                cursor: not-allowed;
                transform: none;
            }
        `;
        document.head.appendChild(style);
    }
    
    setupEventListeners() {
        // Iキーでインベントリを開く
        document.addEventListener('keydown', (e) => {
            if (e.key === 'i' || e.key === 'I') {
                e.preventDefault();
                this.toggle();
            } else if (e.key === 'Escape' && this.isOpen) {
                e.preventDefault();
                this.close();
            }
        });
        
        // インベントリシステムの変更を監視
        this.inventorySystem.onInventoryChange = () => this.updateDisplay();
        this.inventorySystem.onEquipmentChange = () => this.updateDisplay();
    }
    
    open() {
        this.isOpen = true;
        this.container.style.display = 'block';
        this.game.isPaused = true;
        this.updateDisplay();
    }
    
    close() {
        this.isOpen = false;
        this.container.style.display = 'none';
        this.game.isPaused = false;
    }
    
    toggle() {
        if (this.isOpen) {
            this.close();
        } else {
            this.open();
        }
    }
    
    selectTab(tabId) {
        this.selectedTab = tabId;
        
        // タブのアクティブ状態を更新
        document.querySelectorAll('.inventory-tab').forEach(tab => {
            if (tab.dataset.tab === tabId) {
                tab.classList.add('active');
            } else {
                tab.classList.remove('active');
            }
        });
        
        this.updateItemGrid();
    }
    
    updateDisplay() {
        this.updateEquipmentSlots();
        this.updateItemGrid();
        this.updateStats();
    }
    
    updateEquipmentSlots() {
        const equipment = this.inventorySystem.equipment;
        
        Object.keys(this.equipmentSlots).forEach(slotId => {
            const slotElement = this.equipmentSlots[slotId];
            const equipped = equipment[slotId];
            
            if (equipped) {
                slotElement.textContent = equipped.name;
                slotElement.style.color = '#00ff00';
            } else {
                slotElement.textContent = '空き';
                slotElement.style.color = '#888';
            }
        });
    }
    
    updateItemGrid() {
        this.itemGrid.innerHTML = '';
        
        const items = Array.from(this.inventorySystem.items.values());
        const filteredItems = this.selectedTab === 'all' 
            ? items 
            : items.filter(item => item.type === this.selectedTab);
        
        filteredItems.forEach(item => {
            const itemSlot = this.createItemSlot(item);
            this.itemGrid.appendChild(itemSlot);
        });
    }
    
    createItemSlot(item) {
        const slot = document.createElement('div');
        slot.className = 'item-slot';
        if (this.selectedItem === item) {
            slot.classList.add('selected');
        }
        
        const icon = document.createElement('div');
        icon.className = 'item-icon';
        icon.textContent = this.getItemIcon(item);
        
        const name = document.createElement('div');
        name.className = 'item-name';
        name.textContent = item.name;
        
        if (item.quantity > 1) {
            const quantity = document.createElement('div');
            quantity.className = 'item-quantity';
            quantity.textContent = item.quantity;
            slot.appendChild(quantity);
        }
        
        slot.appendChild(icon);
        slot.appendChild(name);
        
        slot.onclick = () => this.selectItem(item);
        
        return slot;
    }
    
    getItemIcon(item) {
        const icons = {
            weapon: '🔫',
            shield: '🛡️',
            engine: '🚀',
            special: '⚡',
            consumable: '🧪',
            material: '📦'
        };
        return icons[item.type] || '❓';
    }
    
    selectItem(item) {
        this.selectedItem = item;
        this.updateItemGrid();
        this.showItemDetail(item);
    }
    
    showItemDetail(item) {
        this.itemDetail.innerHTML = `
            <h4>${item.name}</h4>
            <div class="item-detail-stats">
                ${item.description || '説明なし'}<br>
                ${this.getItemStats(item)}
            </div>
            <div class="item-actions">
                ${this.getItemActions(item)}
            </div>
        `;
        
        // アクションボタンのイベントリスナー
        const equipButton = this.itemDetail.querySelector('#equip-button');
        if (equipButton) {
            equipButton.onclick = () => this.equipItem(item);
        }
    }
    
    getItemStats(item) {
        let stats = [];
        
        if (item.damage) stats.push(`攻撃力: ${item.damage}`);
        if (item.fireRate) stats.push(`連射速度: ${item.fireRate}`);
        if (item.defense) stats.push(`防御力: ${item.defense}`);
        if (item.speed) stats.push(`速度: +${item.speed}%`);
        
        return stats.join('<br>') || '特殊効果なし';
    }
    
    getItemActions(item) {
        const actions = [];
        
        if (item.slot) {
            const isEquipped = this.inventorySystem.equipment[item.slot] === item;
            if (!isEquipped) {
                actions.push('<button class="action-button" id="equip-button">装備する</button>');
            }
        }
        
        return actions.join('');
    }
    
    equipItem(item) {
        if (this.inventorySystem.equipItem(item)) {
            this.game.showMessage(`${item.name}を装備しました`);
            this.updateDisplay();
            
            // プレイヤーの武器を更新
            if (item.slot === 'weapon' && this.game.player) {
                this.game.player.damage = item.damage || 10;
                this.game.player.fireRate = item.fireRate || 100;
            }
        }
    }
    
    updateStats() {
        const equipment = this.inventorySystem.equipment;
        let totalDamage = equipment.weapon?.damage || 10;
        let totalDefense = equipment.shield?.defense || 0;
        let totalSpeed = equipment.engine?.speed || 0;
        
        this.statsDisplay.innerHTML = `
            <div style="color: #ff6666;">攻撃力: ${totalDamage}</div>
            <div style="color: #6666ff;">防御力: ${totalDefense}</div>
            <div style="color: #66ff66;">速度: +${totalSpeed}%</div>
        `;
    }
}