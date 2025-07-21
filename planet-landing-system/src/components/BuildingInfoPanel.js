// 建物情報パネル - 選択した建物の詳細を表示

import { BUILDING_TYPES } from '../data/buildings.js';

export class BuildingInfoPanel {
    constructor(game) {
        this.game = game;
        this.container = null;
        this.selectedBuilding = null;
        this.isVisible = false;
        
        this.createUI();
        this.setupEventListeners();
    }
    
    createUI() {
        // メインコンテナ
        this.container = document.createElement('div');
        this.container.id = 'building-info-panel';
        this.container.style.cssText = `
            position: absolute;
            top: 20px;
            left: 20px;
            width: 300px;
            background: linear-gradient(135deg, rgba(0, 0, 0, 0.9), rgba(0, 20, 40, 0.9));
            border: 2px solid #0ff;
            border-radius: 15px;
            padding: 20px;
            pointer-events: auto;
            transform: translateX(-350px);
            transition: transform 0.3s ease;
            box-shadow: 0 10px 30px rgba(0, 255, 255, 0.2);
        `;
        
        // ヘッダー
        const header = document.createElement('div');
        header.style.cssText = `
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 15px;
            padding-bottom: 10px;
            border-bottom: 1px solid rgba(0, 255, 255, 0.3);
        `;
        
        this.titleElement = document.createElement('h3');
        this.titleElement.style.cssText = `
            margin: 0;
            color: #0ff;
            font-size: 18px;
            display: flex;
            align-items: center;
            gap: 10px;
        `;
        
        const closeButton = document.createElement('button');
        closeButton.style.cssText = `
            background: none;
            border: none;
            color: #0ff;
            font-size: 20px;
            cursor: pointer;
            padding: 0;
            width: 30px;
            height: 30px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 50%;
            transition: all 0.2s ease;
        `;
        closeButton.innerHTML = '✕';
        closeButton.onmouseover = () => {
            closeButton.style.background = 'rgba(0, 255, 255, 0.2)';
        };
        closeButton.onmouseout = () => {
            closeButton.style.background = 'none';
        };
        closeButton.onclick = () => this.hide();
        
        header.appendChild(this.titleElement);
        header.appendChild(closeButton);
        
        // 情報セクション
        this.infoSection = document.createElement('div');
        this.infoSection.style.cssText = `
            margin-bottom: 15px;
        `;
        
        // アクションセクション
        this.actionSection = document.createElement('div');
        this.actionSection.style.cssText = `
            display: flex;
            gap: 10px;
            flex-wrap: wrap;
        `;
        
        this.container.appendChild(header);
        this.container.appendChild(this.infoSection);
        this.container.appendChild(this.actionSection);
        
        // UIコンテナに追加
        const uiContainer = document.getElementById('planet-ui');
        if (uiContainer) {
            uiContainer.appendChild(this.container);
        }
    }
    
    show(building) {
        this.selectedBuilding = building;
        this.isVisible = true;
        this.container.style.transform = 'translateX(0)';
        
        this.updateContent();
    }
    
    hide() {
        this.isVisible = false;
        this.container.style.transform = 'translateX(-350px)';
        this.selectedBuilding = null;
    }
    
    updateContent() {
        if (!this.selectedBuilding) return;
        
        // building.typeはid（例: 'mine'）なので、対応するデータを探す
        let buildingData = null;
        for (const data of Object.values(BUILDING_TYPES)) {
            if (data.id === this.selectedBuilding.type) {
                buildingData = data;
                break;
            }
        }
        
        if (!buildingData) return;
        
        // タイトル更新
        const level = this.selectedBuilding.level || 0;
        this.titleElement.innerHTML = `
            <span style="font-size: 24px;">${buildingData.icon}</span>
            <span>${buildingData.name} Lv.${level}</span>
        `;
        
        // 情報更新
        this.infoSection.innerHTML = '';
        
        // 建設中の場合
        if (this.selectedBuilding.isConstructing) {
            const progress = this.getConstructionProgress();
            this.infoSection.innerHTML = `
                <div style="color: #ffaa00; margin-bottom: 10px;">
                    🚧 建設中...
                </div>
                <div style="margin-bottom: 10px;">
                    <div style="background: rgba(255, 255, 255, 0.1); height: 20px; border-radius: 10px; overflow: hidden;">
                        <div style="background: linear-gradient(90deg, #4CAF50, #8BC34A); height: 100%; width: ${progress}%; transition: width 0.3s ease;"></div>
                    </div>
                    <div style="text-align: center; margin-top: 5px; font-size: 12px; color: #aaa;">
                        ${Math.floor(progress)}% 完了
                    </div>
                </div>
            `;
            
            // 建設中は更新を続ける
            if (this.updateInterval) clearInterval(this.updateInterval);
            this.updateInterval = setInterval(() => {
                if (this.isVisible && this.selectedBuilding?.isConstructing) {
                    this.updateContent();
                } else {
                    clearInterval(this.updateInterval);
                }
            }, 100);
            
            return;
        }
        
        // 生産情報
        const stats = this.selectedBuilding.level === 1 
            ? buildingData.baseStats 
            : buildingData.upgrades[this.selectedBuilding.level];
        
        let infoHTML = '<div style="font-size: 14px; line-height: 1.8;">';
        
        if (stats.production) {
            infoHTML += '<strong style="color: #0ff;">生産:</strong><br>';
            for (const [resource, rate] of Object.entries(stats.production)) {
                infoHTML += `<div style="margin-left: 20px;">${this.getResourceIcon(resource)} ${rate}/分</div>`;
            }
        }
        
        if (stats.effects) {
            infoHTML += '<br><strong style="color: #0ff;">効果:</strong><br>';
            if (stats.effects.population) {
                infoHTML += `<div style="margin-left: 20px;">👥 人口 +${stats.effects.population}</div>`;
            }
            if (stats.effects.workforce) {
                infoHTML += `<div style="margin-left: 20px;">👷 労働力 +${stats.effects.workforce}</div>`;
            }
        }
        
        if (stats.energyConsumption) {
            infoHTML += '<br><strong style="color: #ff4444;">消費:</strong><br>';
            infoHTML += `<div style="margin-left: 20px;">⚡ ${stats.energyConsumption}/分</div>`;
        }
        
        if (stats.workforceRequired) {
            infoHTML += `<div style="margin-left: 20px;">👷 労働力 ${stats.workforceRequired}</div>`;
        }
        
        // 戦闘能力（防衛タレット）
        if (stats.combat) {
            infoHTML += '<br><strong style="color: #0ff;">戦闘能力:</strong><br>';
            infoHTML += `<div style="margin-left: 20px;">💥 ダメージ: ${stats.combat.damage}</div>`;
            infoHTML += `<div style="margin-left: 20px;">📏 射程: ${stats.combat.range}</div>`;
            infoHTML += `<div style="margin-left: 20px;">⚡ 発射速度: ${stats.combat.fireRate}/秒</div>`;
        }
        
        infoHTML += '</div>';
        this.infoSection.innerHTML = infoHTML;
        
        // アクションボタン
        this.updateActions();
    }
    
    updateActions() {
        this.actionSection.innerHTML = '';
        
        // building.typeはid（例: 'mine'）なので、対応するデータを探す
        let buildingData = null;
        for (const data of Object.values(BUILDING_TYPES)) {
            if (data.id === this.selectedBuilding.type) {
                buildingData = data;
                break;
            }
        }
        
        if (!buildingData) return;
        
        // アップグレードボタン
        const currentLevel = this.selectedBuilding.level || 0;
        if (buildingData.maxLevel && currentLevel < buildingData.maxLevel && buildingData.upgrades) {
            const nextLevel = currentLevel + 1;
            const upgradeData = buildingData.upgrades[nextLevel];
            if (upgradeData && upgradeData.cost) {
                const upgradeCost = upgradeData.cost;
                
                const upgradeButton = this.createActionButton(
                    '⬆️ アップグレード',
                    () => this.upgradeBuilding(),
                    upgradeCost
                );
                this.actionSection.appendChild(upgradeButton);
            }
        }
        
        // 削除ボタン
        const deleteButton = this.createActionButton(
            '🗑️ 削除',
            () => this.deleteBuilding(),
            null,
            '#ff4444'
        );
        this.actionSection.appendChild(deleteButton);
    }
    
    createActionButton(text, onClick, cost = null, color = '#4CAF50') {
        const button = document.createElement('button');
        button.style.cssText = `
            flex: 1;
            padding: 10px 15px;
            background: linear-gradient(135deg, ${color}, ${this.darkenColor(color, 20)});
            color: white;
            border: none;
            border-radius: 5px;
            font-size: 14px;
            font-weight: bold;
            cursor: pointer;
            transition: all 0.2s ease;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
        `;
        
        let buttonHTML = text;
        
        // コスト表示
        if (cost) {
            const canAfford = this.game.systems.resource?.hasResources(cost) ?? true;
            
            buttonHTML += '<div style="font-size: 11px; margin-top: 5px; opacity: 0.8;">';
            if (cost.credits) buttonHTML += `💰 ${this.formatNumber(cost.credits)} `;
            if (cost.energy) buttonHTML += `⚡ ${this.formatNumber(cost.energy)}`;
            buttonHTML += '</div>';
            
            if (!canAfford) {
                button.style.opacity = '0.5';
                button.style.cursor = 'not-allowed';
                button.disabled = true;
            }
        }
        
        button.innerHTML = buttonHTML;
        
        button.onmouseover = () => {
            if (!button.disabled) {
                button.style.transform = 'scale(1.05)';
                button.style.boxShadow = '0 4px 15px rgba(0, 0, 0, 0.4)';
            }
        };
        
        button.onmouseout = () => {
            button.style.transform = 'scale(1)';
            button.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.3)';
        };
        
        button.onclick = onClick;
        
        return button;
    }
    
    getConstructionProgress() {
        if (!this.selectedBuilding || !this.selectedBuilding.isConstructing) return 100;
        
        const elapsed = (Date.now() - this.selectedBuilding.constructionStartTime) / 1000;
        const progress = (elapsed / this.selectedBuilding.constructionTime) * 100;
        
        return Math.min(progress, 100);
    }
    
    upgradeBuilding() {
        if (!this.selectedBuilding || !this.game.systems.upgrade) return;
        
        // 新しいアップグレードシステムを使用
        this.game.systems.upgrade.showUpgradeUI(this.selectedBuilding);
        this.hide(); // 情報パネルを閉じる
    }
    
    deleteBuilding() {
        if (!this.selectedBuilding || !this.game.systems.building) return;
        
        // building.typeはid（例: 'mine'）なので、対応するデータを探す
        let buildingData = null;
        for (const data of Object.values(BUILDING_TYPES)) {
            if (data.id === this.selectedBuilding.type) {
                buildingData = data;
                break;
            }
        }
        
        if (!buildingData) return;
        
        // 確認ダイアログ（簡易版）
        const confirmDelete = confirm(`${buildingData.name}を削除しますか？`);
        
        if (confirmDelete) {
            this.game.systems.building.removeBuilding(this.selectedBuilding.id);
            this.hide();
            this.showMessage('建物を削除しました', 'info');
        }
    }
    
    showMessage(text, type = 'info') {
        const message = document.createElement('div');
        const colors = {
            info: '#0ff',
            success: '#4CAF50',
            error: '#ff4444'
        };
        
        message.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: ${colors[type]};
            color: white;
            padding: 15px 30px;
            border-radius: 5px;
            font-size: 16px;
            font-weight: bold;
            z-index: 2000;
            animation: messageAnimation 2s ease;
        `;
        message.textContent = text;
        
        const style = document.createElement('style');
        style.textContent = `
            @keyframes messageAnimation {
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
    
    darkenColor(color, percent) {
        const num = parseInt(color.replace('#', ''), 16);
        const amt = Math.round(2.55 * percent);
        const R = (num >> 16) - amt;
        const G = (num >> 8 & 0x00FF) - amt;
        const B = (num & 0x0000FF) - amt;
        return '#' + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
            (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
            (B < 255 ? B < 1 ? 0 : B : 255)).toString(16).slice(1);
    }
    
    setupEventListeners() {
        // ESCキーで閉じる
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isVisible) {
                this.hide();
            }
        });
    }
    
    dispose() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
        }
        if (this.container && this.container.parentNode) {
            this.container.parentNode.removeChild(this.container);
        }
    }
}