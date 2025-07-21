// 建設メニューUI - 建物選択と配置

import { BUILDING_TYPES } from '../data/buildings.js';

export class BuildingMenu {
    constructor(game) {
        this.game = game;
        this.container = null;
        this.menuElement = null;
        this.isOpen = false;
        this.selectedBuilding = null;
        
        this.createUI();
        this.setupEventListeners();
    }
    
    createUI() {
        // メインコンテナ
        this.container = document.createElement('div');
        this.container.id = 'building-menu-container';
        this.container.style.cssText = `
            position: absolute;
            bottom: 20px;
            left: 50%;
            transform: translateX(-50%);
            pointer-events: auto;
            z-index: 100;
        `;
        
        // 建設ボタン
        const buildButton = document.createElement('button');
        buildButton.id = 'build-button';
        buildButton.style.cssText = `
            padding: 15px 30px;
            background: linear-gradient(135deg, #4CAF50, #45a049);
            color: white;
            border: none;
            border-radius: 25px;
            font-size: 18px;
            font-weight: bold;
            cursor: pointer;
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
            transition: all 0.3s ease;
        `;
        buildButton.innerHTML = '🏗️ 建設';
        buildButton.onmouseover = () => {
            buildButton.style.transform = 'scale(1.05)';
            buildButton.style.boxShadow = '0 6px 20px rgba(0, 0, 0, 0.4)';
        };
        buildButton.onmouseout = () => {
            buildButton.style.transform = 'scale(1)';
            buildButton.style.boxShadow = '0 4px 15px rgba(0, 0, 0, 0.3)';
        };
        buildButton.onclick = () => {
            if (this.game.systems.sound) {
                this.game.systems.sound.play('buttonClick');
            }
            this.toggleMenu();
        };
        
        // 建物選択メニュー
        this.menuElement = document.createElement('div');
        this.menuElement.id = 'building-selection-menu';
        this.menuElement.style.cssText = `
            position: absolute;
            bottom: 70px;
            left: 50%;
            transform: translateX(-50%) scale(0);
            background: rgba(0, 0, 0, 0.9);
            border: 2px solid #0ff;
            border-radius: 15px;
            padding: 20px;
            display: flex;
            gap: 15px;
            opacity: 0;
            transition: all 0.3s ease;
            box-shadow: 0 10px 30px rgba(0, 255, 255, 0.3);
        `;
        
        // 各建物タイプのボタンを作成
        for (const [key, building] of Object.entries(BUILDING_TYPES)) {
            const buildingButton = this.createBuildingButton(key, building);
            this.menuElement.appendChild(buildingButton);
        }
        
        // 閉じるボタン
        const closeButton = document.createElement('button');
        closeButton.style.cssText = `
            position: absolute;
            top: -10px;
            right: -10px;
            width: 30px;
            height: 30px;
            background: #ff4444;
            color: white;
            border: none;
            border-radius: 50%;
            font-size: 16px;
            cursor: pointer;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
        `;
        closeButton.innerHTML = '✕';
        closeButton.onclick = () => this.closeMenu();
        this.menuElement.appendChild(closeButton);
        
        this.container.appendChild(buildButton);
        this.container.appendChild(this.menuElement);
        
        // UIコンテナに追加
        const uiContainer = document.getElementById('planet-ui');
        if (uiContainer) {
            uiContainer.appendChild(this.container);
        }
    }
    
    createBuildingButton(key, buildingData) {
        const button = document.createElement('div');
        button.className = 'building-option';
        button.style.cssText = `
            width: 120px;
            padding: 15px;
            background: rgba(255, 255, 255, 0.1);
            border: 1px solid #666;
            border-radius: 10px;
            cursor: pointer;
            text-align: center;
            transition: all 0.2s ease;
            position: relative;
        `;
        
        // アイコンと名前
        const icon = document.createElement('div');
        icon.style.cssText = `
            font-size: 36px;
            margin-bottom: 5px;
        `;
        icon.innerHTML = buildingData.icon;
        
        const name = document.createElement('div');
        name.style.cssText = `
            font-size: 14px;
            color: #fff;
            margin-bottom: 10px;
            font-weight: bold;
        `;
        name.textContent = buildingData.name;
        
        // コスト表示
        const cost = document.createElement('div');
        cost.style.cssText = `
            font-size: 12px;
            color: #aaa;
            line-height: 1.4;
        `;
        const baseCost = buildingData.baseStats.cost;
        cost.innerHTML = `
            💰 ${this.formatNumber(baseCost.credits)}<br>
            ⚡ ${this.formatNumber(baseCost.energy)}
        `;
        
        // ツールチップ
        const tooltip = document.createElement('div');
        tooltip.style.cssText = `
            position: absolute;
            bottom: 100%;
            left: 50%;
            transform: translateX(-50%) scale(0);
            background: rgba(0, 0, 0, 0.95);
            border: 1px solid #0ff;
            border-radius: 5px;
            padding: 10px;
            width: 200px;
            font-size: 12px;
            color: #fff;
            opacity: 0;
            transition: all 0.2s ease;
            pointer-events: none;
            z-index: 1000;
        `;
        tooltip.innerHTML = this.getBuildingTooltip(buildingData);
        
        button.appendChild(icon);
        button.appendChild(name);
        button.appendChild(cost);
        button.appendChild(tooltip);
        
        // ホバー効果
        button.onmouseover = () => {
            button.style.background = 'rgba(255, 255, 255, 0.2)';
            button.style.borderColor = '#0ff';
            button.style.transform = 'translateY(-5px)';
            tooltip.style.opacity = '1';
            tooltip.style.transform = 'translateX(-50%) scale(1)';
        };
        
        button.onmouseout = () => {
            button.style.background = 'rgba(255, 255, 255, 0.1)';
            button.style.borderColor = '#666';
            button.style.transform = 'translateY(0)';
            tooltip.style.opacity = '0';
            tooltip.style.transform = 'translateX(-50%) scale(0)';
        };
        
        // クリックイベント
        button.onclick = () => {
            // 資源チェック
            if (!this.canAfford(baseCost)) {
                if (this.game.systems.sound) {
                    this.game.systems.sound.play('error');
                }
                this.showMessage('資源が不足しています！', 'error');
                return;
            }
            
            if (this.game.systems.sound) {
                this.game.systems.sound.play('buttonClick');
            }
            this.selectBuilding(key);
        };
        
        // 資源不足の場合は無効化表示
        if (!this.canAfford(baseCost)) {
            button.style.opacity = '0.5';
            button.style.cursor = 'not-allowed';
            cost.style.color = '#ff4444';
        }
        
        return button;
    }
    
    getBuildingTooltip(buildingData) {
        let tooltip = `<strong>${buildingData.name}</strong><br><br>`;
        
        // 効果
        const stats = buildingData.baseStats;
        if (stats.production) {
            tooltip += '<strong>生産:</strong><br>';
            for (const [resource, rate] of Object.entries(stats.production)) {
                tooltip += `${this.getResourceIcon(resource)} ${rate}/分<br>`;
            }
        }
        
        if (stats.effects) {
            tooltip += '<strong>効果:</strong><br>';
            if (stats.effects.population) {
                tooltip += `👥 人口 +${stats.effects.population}<br>`;
            }
            if (stats.effects.workforce) {
                tooltip += `👷 労働力 +${stats.effects.workforce}<br>`;
            }
        }
        
        if (stats.energyConsumption) {
            tooltip += `<br><strong>消費:</strong><br>⚡ エネルギー ${stats.energyConsumption}/分<br>`;
        }
        
        if (stats.workforceRequired) {
            tooltip += `👷 労働力 ${stats.workforceRequired}<br>`;
        }
        
        tooltip += `<br><strong>建設時間:</strong> ${stats.buildTime}秒`;
        
        return tooltip;
    }
    
    getResourceIcon(resource) {
        const icons = {
            iron: '🔩',
            energy: '⚡',
            crystal: '💎',
            research: '🔬',
            credits: '💰'
        };
        return icons[resource] || '📦';
    }
    
    formatNumber(num) {
        if (num >= 1000000) {
            return (num / 1000000).toFixed(1) + 'M';
        } else if (num >= 1000) {
            return (num / 1000).toFixed(1) + 'K';
        }
        return num.toString();
    }
    
    canAfford(cost) {
        if (!this.game.systems.resource) return true; // リソースシステムがない場合は常に建設可能
        
        const resources = this.game.systems.resource.getResources();
        for (const [type, amount] of Object.entries(cost)) {
            if (resources[type] < amount) {
                return false;
            }
        }
        return true;
    }
    
    toggleMenu() {
        if (this.isOpen) {
            this.closeMenu();
        } else {
            this.openMenu();
        }
    }
    
    openMenu() {
        this.isOpen = true;
        this.menuElement.style.transform = 'translateX(-50%) scale(1)';
        this.menuElement.style.opacity = '1';
        
        // メニューボタンを更新
        this.updateMenuButtons();
    }
    
    closeMenu() {
        this.isOpen = false;
        this.menuElement.style.transform = 'translateX(-50%) scale(0)';
        this.menuElement.style.opacity = '0';
    }
    
    selectBuilding(buildingType) {
        this.selectedBuilding = buildingType;
        this.closeMenu();
        
        // 建設システムに通知（idを使用）
        if (this.game.systems.building) {
            const buildingData = BUILDING_TYPES[buildingType];
            this.game.systems.building.enterBuildMode(buildingData.id);
        }
        
        this.showMessage(`${BUILDING_TYPES[buildingType].name}を配置してください`, 'info');
    }
    
    updateMenuButtons() {
        // 資源の変更に応じてボタンの状態を更新
        const buttons = this.menuElement.querySelectorAll('.building-option');
        buttons.forEach((button, index) => {
            const buildingKey = Object.keys(BUILDING_TYPES)[index];
            const buildingData = BUILDING_TYPES[buildingKey];
            const baseCost = buildingData.baseStats.cost;
            
            if (this.canAfford(baseCost)) {
                button.style.opacity = '1';
                button.style.cursor = 'pointer';
                button.querySelector('div:nth-child(3)').style.color = '#aaa';
            } else {
                button.style.opacity = '0.5';
                button.style.cursor = 'not-allowed';
                button.querySelector('div:nth-child(3)').style.color = '#ff4444';
            }
        });
    }
    
    showMessage(text, type = 'info') {
        // メッセージ表示
        const message = document.createElement('div');
        message.style.cssText = `
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: ${type === 'error' ? 'rgba(255, 0, 0, 0.8)' : 'rgba(0, 255, 255, 0.8)'};
            color: white;
            padding: 15px 30px;
            border-radius: 5px;
            font-size: 18px;
            font-weight: bold;
            pointer-events: none;
            animation: fadeInOut 2s ease;
            z-index: 1000;
        `;
        message.textContent = text;
        
        // アニメーション
        const style = document.createElement('style');
        style.textContent = `
            @keyframes fadeInOut {
                0% { opacity: 0; transform: translate(-50%, -50%) scale(0.8); }
                20% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
                80% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
                100% { opacity: 0; transform: translate(-50%, -50%) scale(0.8); }
            }
        `;
        document.head.appendChild(style);
        
        document.body.appendChild(message);
        
        setTimeout(() => {
            message.remove();
            style.remove();
        }, 2000);
    }
    
    setupEventListeners() {
        // ESCキーでメニューを閉じる
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isOpen) {
                this.closeMenu();
            }
        });
        
        // 資源更新時にメニューを更新
        if (this.game.systems.resource) {
            this.game.systems.resource.onResourcesChanged = () => {
                if (this.isOpen) {
                    this.updateMenuButtons();
                }
            };
        }
    }
    
    // クリーンアップ
    dispose() {
        if (this.container && this.container.parentNode) {
            this.container.parentNode.removeChild(this.container);
        }
    }
}