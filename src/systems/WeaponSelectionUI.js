// 武器選択UIシステム

export class WeaponSelectionUI {
    constructor(game) {
        this.game = game;
        this.weaponInventory = game.weaponInventory;
        this.isOpen = false;
        
        this.createUI();
        this.setupStyles();
        this.setupEventListeners();
    }
    
    createUI() {
        // メインコンテナ
        this.container = document.createElement('div');
        this.container.id = 'weapon-selection-ui';
        this.container.className = 'weapon-selection-container';
        this.container.style.display = 'none';
        
        // ヘッダー
        const header = document.createElement('div');
        header.className = 'weapon-selection-header';
        header.innerHTML = `
            <h2>武器選択</h2>
            <button class="close-button">×</button>
        `;
        
        // タブメニュー
        const tabMenu = document.createElement('div');
        tabMenu.className = 'weapon-tabs';
        tabMenu.innerHTML = `
            <button class="tab-button active" data-slot="primary">プライマリ</button>
            <button class="tab-button" data-slot="secondary">セカンダリ</button>
            <button class="tab-button" data-slot="special">スペシャル</button>
        `;
        
        // 武器リストコンテナ
        this.weaponListContainer = document.createElement('div');
        this.weaponListContainer.className = 'weapon-list-container';
        
        // 武器詳細パネル
        this.detailPanel = document.createElement('div');
        this.detailPanel.className = 'weapon-detail-panel';
        
        // 組み立て
        this.container.appendChild(header);
        this.container.appendChild(tabMenu);
        
        const contentArea = document.createElement('div');
        contentArea.className = 'weapon-selection-content';
        contentArea.appendChild(this.weaponListContainer);
        contentArea.appendChild(this.detailPanel);
        
        this.container.appendChild(contentArea);
        document.body.appendChild(this.container);
        
        // 初期表示
        this.currentSlot = 'primary';
        this.selectedWeaponId = null;
    }
    
    setupStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .weapon-selection-container {
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                width: 800px;
                height: 600px;
                background: rgba(0, 0, 0, 0.95);
                border: 2px solid #00ffff;
                border-radius: 15px;
                color: white;
                font-family: 'Orbitron', monospace;
                z-index: 2000;
                overflow: hidden;
                box-shadow: 0 0 30px rgba(0, 255, 255, 0.5);
            }
            
            .weapon-selection-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 20px;
                border-bottom: 1px solid rgba(0, 255, 255, 0.3);
                background: rgba(0, 255, 255, 0.1);
            }
            
            .weapon-selection-header h2 {
                margin: 0;
                font-size: 24px;
                color: #00ffff;
            }
            
            .close-button {
                background: none;
                border: 1px solid #00ffff;
                color: #00ffff;
                font-size: 24px;
                width: 40px;
                height: 40px;
                border-radius: 50%;
                cursor: pointer;
                transition: all 0.3s;
            }
            
            .close-button:hover {
                background: rgba(0, 255, 255, 0.2);
                transform: scale(1.1);
            }
            
            .weapon-tabs {
                display: flex;
                padding: 10px 20px;
                gap: 10px;
                border-bottom: 1px solid rgba(0, 255, 255, 0.3);
            }
            
            .tab-button {
                background: rgba(0, 255, 255, 0.1);
                border: 1px solid rgba(0, 255, 255, 0.3);
                color: #88ddff;
                padding: 10px 20px;
                border-radius: 5px;
                cursor: pointer;
                transition: all 0.3s;
                font-family: 'Orbitron', monospace;
            }
            
            .tab-button:hover {
                background: rgba(0, 255, 255, 0.2);
            }
            
            .tab-button.active {
                background: rgba(0, 255, 255, 0.3);
                border-color: #00ffff;
                color: #00ffff;
            }
            
            .weapon-selection-content {
                display: flex;
                height: calc(100% - 140px);
            }
            
            .weapon-list-container {
                flex: 1;
                padding: 20px;
                overflow-y: auto;
                display: grid;
                grid-template-columns: repeat(3, 1fr);
                gap: 15px;
                align-content: start;
            }
            
            .weapon-card {
                background: rgba(0, 255, 255, 0.1);
                border: 2px solid rgba(0, 255, 255, 0.3);
                border-radius: 10px;
                padding: 15px;
                cursor: pointer;
                transition: all 0.3s;
                text-align: center;
            }
            
            .weapon-card:hover {
                background: rgba(0, 255, 255, 0.2);
                transform: translateY(-5px);
                box-shadow: 0 5px 20px rgba(0, 255, 255, 0.3);
            }
            
            .weapon-card.selected {
                border-color: #00ffff;
                background: rgba(0, 255, 255, 0.3);
            }
            
            .weapon-card.equipped {
                border-color: #ffaa00;
                box-shadow: 0 0 10px rgba(255, 170, 0, 0.5);
            }
            
            .weapon-card.locked {
                opacity: 0.5;
                cursor: not-allowed;
            }
            
            .weapon-card .weapon-icon {
                width: 60px;
                height: 60px;
                margin: 0 auto 10px;
                background: rgba(0, 255, 255, 0.2);
                border-radius: 10px;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 30px;
            }
            
            .weapon-card .weapon-name {
                font-size: 14px;
                color: #00ffff;
                margin-bottom: 5px;
            }
            
            .weapon-card .weapon-level {
                font-size: 12px;
                color: #88ddff;
            }
            
            .weapon-card .rarity-indicator {
                width: 100%;
                height: 3px;
                margin-top: 10px;
                border-radius: 2px;
            }
            
            .weapon-detail-panel {
                width: 300px;
                padding: 20px;
                border-left: 1px solid rgba(0, 255, 255, 0.3);
                background: rgba(0, 0, 0, 0.5);
            }
            
            .weapon-detail-panel h3 {
                color: #00ffff;
                margin-top: 0;
                font-size: 20px;
            }
            
            .weapon-stats {
                margin: 20px 0;
            }
            
            .stat-row {
                display: flex;
                justify-content: space-between;
                margin: 10px 0;
                font-size: 14px;
            }
            
            .stat-name {
                color: #88ddff;
            }
            
            .stat-value {
                color: #00ffff;
                font-weight: bold;
            }
            
            .stat-bar {
                width: 100%;
                height: 4px;
                background: rgba(0, 255, 255, 0.2);
                border-radius: 2px;
                margin-top: 5px;
                overflow: hidden;
            }
            
            .stat-bar-fill {
                height: 100%;
                background: #00ffff;
                transition: width 0.3s;
            }
            
            .weapon-description {
                color: #aaaaaa;
                font-size: 12px;
                line-height: 1.5;
                margin: 20px 0;
            }
            
            .equip-button {
                width: 100%;
                padding: 15px;
                background: rgba(0, 255, 255, 0.2);
                border: 2px solid #00ffff;
                color: #00ffff;
                font-size: 16px;
                font-weight: bold;
                border-radius: 5px;
                cursor: pointer;
                transition: all 0.3s;
                font-family: 'Orbitron', monospace;
            }
            
            .equip-button:hover {
                background: rgba(0, 255, 255, 0.3);
                transform: scale(1.05);
            }
            
            .equip-button:disabled {
                opacity: 0.5;
                cursor: not-allowed;
            }
            
            .experience-bar {
                margin-top: 20px;
            }
            
            .exp-label {
                display: flex;
                justify-content: space-between;
                font-size: 12px;
                color: #88ddff;
                margin-bottom: 5px;
            }
            
            .exp-bar {
                width: 100%;
                height: 8px;
                background: rgba(255, 255, 0, 0.2);
                border-radius: 4px;
                overflow: hidden;
            }
            
            .exp-bar-fill {
                height: 100%;
                background: linear-gradient(90deg, #ffff00 0%, #ffaa00 100%);
                transition: width 0.3s;
            }
            
            @keyframes unlock-flash {
                0% { background: rgba(0, 255, 255, 0.1); }
                50% { background: rgba(0, 255, 255, 0.5); }
                100% { background: rgba(0, 255, 255, 0.1); }
            }
            
            .weapon-card.unlocking {
                animation: unlock-flash 0.5s ease-out;
            }
        `;
        document.head.appendChild(style);
    }
    
    setupEventListeners() {
        // 閉じるボタン
        this.container.querySelector('.close-button').addEventListener('click', () => {
            this.close();
        });
        
        // タブ切り替え
        this.container.querySelectorAll('.tab-button').forEach(button => {
            button.addEventListener('click', (e) => {
                this.switchTab(e.target.dataset.slot);
            });
        });
        
        // ESCキーで閉じる
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isOpen) {
                this.close();
            }
        });
    }
    
    open() {
        this.isOpen = true;
        this.container.style.display = 'block';
        
        // ゲームを一時停止
        if (this.game.pause) {
            this.game.pause();
        }
        
        this.refresh();
    }
    
    close() {
        this.isOpen = false;
        this.container.style.display = 'none';
        
        // ゲームを再開
        if (this.game.resume) {
            this.game.resume();
        }
    }
    
    switchTab(slot) {
        this.currentSlot = slot;
        
        // タブボタンの状態を更新
        this.container.querySelectorAll('.tab-button').forEach(button => {
            button.classList.toggle('active', button.dataset.slot === slot);
        });
        
        this.refresh();
    }
    
    refresh() {
        // 武器リストを更新
        this.weaponListContainer.innerHTML = '';
        
        const weapons = this.weaponInventory.getAvailableWeapons(this.currentSlot);
        
        weapons.forEach(weaponData => {
            const card = this.createWeaponCard(weaponData);
            this.weaponListContainer.appendChild(card);
        });
        
        // 詳細パネルを更新
        if (this.selectedWeaponId) {
            this.showWeaponDetails(this.selectedWeaponId);
        } else {
            this.detailPanel.innerHTML = '<p style="color: #888; text-align: center;">武器を選択してください</p>';
        }
    }
    
    createWeaponCard(weaponData) {
        const card = document.createElement('div');
        card.className = 'weapon-card';
        
        if (weaponData.equipped) {
            card.classList.add('equipped');
        }
        
        // アイコン（仮）
        const iconMap = {
            'pulse_laser': '⚡',
            'rapid_fire': '🔫',
            'plasma_cannon': '💥',
            'scatter_shot': '🎯',
            'homing_missile': '🚀',
            'ion_beam': '⚛️',
            'shield_projector': '🛡️',
            'emp_blast': '⚡',
            'quantum_torpedo': '🌌',
            'laser_array': '✨'
        };
        
        card.innerHTML = `
            <div class="weapon-icon">${iconMap[weaponData.id] || '🔸'}</div>
            <div class="weapon-name">${weaponData.weapon.name}</div>
            <div class="weapon-level">Lv.${weaponData.stats.level}</div>
            <div class="rarity-indicator" style="background: ${weaponData.rarity.color}"></div>
        `;
        
        card.addEventListener('click', () => {
            this.selectWeapon(weaponData.id);
        });
        
        return card;
    }
    
    selectWeapon(weaponId) {
        this.selectedWeaponId = weaponId;
        
        // カードの選択状態を更新
        this.weaponListContainer.querySelectorAll('.weapon-card').forEach((card, index) => {
            const weapons = this.weaponInventory.getAvailableWeapons(this.currentSlot);
            card.classList.toggle('selected', weapons[index].id === weaponId);
        });
        
        this.showWeaponDetails(weaponId);
    }
    
    showWeaponDetails(weaponId) {
        const weaponData = this.weaponInventory.ownedWeapons.get(weaponId);
        if (!weaponData) return;
        
        const stats = this.weaponInventory.getWeaponStats(weaponId);
        const weapon = weaponData.weapon;
        
        const isEquipped = this.weaponInventory.equippedSlots[this.currentSlot] === weaponId;
        
        this.detailPanel.innerHTML = `
            <h3>${weapon.name}</h3>
            <div class="weapon-stats">
                <div class="stat-row">
                    <span class="stat-name">ダメージ</span>
                    <span class="stat-value">${stats.damage}</span>
                </div>
                <div class="stat-bar">
                    <div class="stat-bar-fill" style="width: ${Math.min(stats.damage / 100, 1) * 100}%"></div>
                </div>
                
                <div class="stat-row">
                    <span class="stat-name">連射速度</span>
                    <span class="stat-value">${1000 / stats.fireRate} /秒</span>
                </div>
                <div class="stat-bar">
                    <div class="stat-bar-fill" style="width: ${Math.min((1000 / stats.fireRate) / 20, 1) * 100}%"></div>
                </div>
                
                <div class="stat-row">
                    <span class="stat-name">弾速</span>
                    <span class="stat-value">${stats.speed}</span>
                </div>
                <div class="stat-bar">
                    <div class="stat-bar-fill" style="width: ${Math.min(stats.speed / 300, 1) * 100}%"></div>
                </div>
                
                <div class="stat-row">
                    <span class="stat-name">レアリティ</span>
                    <span class="stat-value" style="color: ${weaponData.rarity.color}">${weaponData.rarity.name}</span>
                </div>
            </div>
            
            <p class="weapon-description">${weapon.description}</p>
            
            <div class="experience-bar">
                <div class="exp-label">
                    <span>レベル ${stats.level}</span>
                    <span>${stats.experience} / ${stats.nextLevelExp} EXP</span>
                </div>
                <div class="exp-bar">
                    <div class="exp-bar-fill" style="width: ${(stats.experience / stats.nextLevelExp) * 100}%"></div>
                </div>
            </div>
            
            <button class="equip-button" ${isEquipped ? 'disabled' : ''}>
                ${isEquipped ? '装備中' : '装備する'}
            </button>
        `;
        
        // 装備ボタンのイベント
        const equipButton = this.detailPanel.querySelector('.equip-button');
        if (equipButton && !isEquipped) {
            equipButton.addEventListener('click', () => {
                this.equipWeapon(weaponId);
            });
        }
    }
    
    equipWeapon(weaponId) {
        if (this.weaponInventory.equipWeapon(weaponId, this.currentSlot)) {
            // サウンド再生
            if (this.game.soundManager) {
                this.game.soundManager.play('weapon_switch');
            }
            
            // UI更新
            this.refresh();
        }
    }
}