// 資源表示UI - リアルタイムで資源状態を表示

export class ResourceDisplay {
    constructor(game) {
        this.game = game;
        this.container = null;
        this.resourceElements = {};
        this.productionElements = {};
        this.populationElement = null;
        
        this.createUI();
        this.setupEventListeners();
    }
    
    createUI() {
        // 既存のリソース表示を削除（PlanetLandingGame.jsで作成された簡易版）
        const oldDisplay = document.querySelector('#planet-ui > div:nth-child(1)');
        if (oldDisplay) {
            oldDisplay.remove();
        }
        
        // メインコンテナ
        this.container = document.createElement('div');
        this.container.id = 'resource-display';
        this.container.style.cssText = `
            position: absolute;
            top: 20px;
            right: 20px;
            background: linear-gradient(135deg, rgba(0, 0, 0, 0.9), rgba(0, 20, 40, 0.9));
            padding: 20px;
            border: 2px solid #0ff;
            border-radius: 15px;
            min-width: 250px;
            pointer-events: auto;
            box-shadow: 0 10px 30px rgba(0, 255, 255, 0.2);
        `;
        
        // タイトル
        const title = document.createElement('h3');
        title.style.cssText = `
            margin: 0 0 15px 0;
            color: #0ff;
            font-size: 18px;
            text-align: center;
            text-shadow: 0 0 10px rgba(0, 255, 255, 0.5);
        `;
        title.textContent = '資源状況';
        this.container.appendChild(title);
        
        // 資源セクション
        const resourceSection = document.createElement('div');
        resourceSection.style.cssText = `
            margin-bottom: 15px;
            padding-bottom: 15px;
            border-bottom: 1px solid rgba(0, 255, 255, 0.3);
        `;
        
        // 各資源の表示を作成
        const resources = ['credits', 'iron', 'energy', 'crystal', 'research'];
        const resourceIcons = {
            credits: '💰',
            iron: '🔩',
            energy: '⚡',
            crystal: '💎',
            research: '🔬'
        };
        const resourceNames = {
            credits: 'クレジット',
            iron: '鉄',
            energy: 'エネルギー',
            crystal: 'クリスタル',
            research: '研究'
        };
        
        resources.forEach(resource => {
            const resourceRow = document.createElement('div');
            resourceRow.style.cssText = `
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 8px;
                font-size: 14px;
            `;
            
            // 資源名とアイコン
            const nameLabel = document.createElement('div');
            nameLabel.style.cssText = `
                display: flex;
                align-items: center;
                gap: 8px;
                color: #fff;
            `;
            nameLabel.innerHTML = `
                <span style="font-size: 18px;">${resourceIcons[resource]}</span>
                <span>${resourceNames[resource]}</span>
            `;
            
            // 資源量と生産レート
            const valueContainer = document.createElement('div');
            valueContainer.style.cssText = `
                display: flex;
                flex-direction: column;
                align-items: flex-end;
            `;
            
            // 現在値
            const currentValue = document.createElement('div');
            currentValue.style.cssText = `
                color: #fff;
                font-weight: bold;
            `;
            currentValue.textContent = '0';
            this.resourceElements[resource] = currentValue;
            
            // 生産レート
            const productionRate = document.createElement('div');
            productionRate.style.cssText = `
                font-size: 12px;
                color: #888;
            `;
            productionRate.textContent = '+0/分';
            this.productionElements[resource] = productionRate;
            
            valueContainer.appendChild(currentValue);
            valueContainer.appendChild(productionRate);
            
            resourceRow.appendChild(nameLabel);
            resourceRow.appendChild(valueContainer);
            resourceSection.appendChild(resourceRow);
        });
        
        this.container.appendChild(resourceSection);
        
        // 人口セクション
        const populationSection = document.createElement('div');
        populationSection.style.cssText = `
            padding-top: 15px;
        `;
        
        this.populationElement = document.createElement('div');
        this.populationElement.style.cssText = `
            font-size: 14px;
            color: #fff;
            line-height: 1.6;
        `;
        this.populationElement.innerHTML = `
            <div>👥 人口: <span style="font-weight: bold;">0</span></div>
            <div>👷 労働力: <span style="font-weight: bold;">0/0</span></div>
        `;
        
        populationSection.appendChild(this.populationElement);
        this.container.appendChild(populationSection);
        
        // 警告セクション
        this.warningSection = document.createElement('div');
        this.warningSection.style.cssText = `
            margin-top: 15px;
            padding: 10px;
            background: rgba(255, 0, 0, 0.2);
            border: 1px solid rgba(255, 0, 0, 0.5);
            border-radius: 5px;
            font-size: 12px;
            color: #ff6666;
            display: none;
        `;
        this.container.appendChild(this.warningSection);
        
        // UIコンテナに追加
        const uiContainer = document.getElementById('planet-ui');
        if (uiContainer) {
            uiContainer.appendChild(this.container);
        }
    }
    
    updateDisplay(data) {
        if (!data) return;
        
        // 資源量を更新
        if (data.resources) {
            for (const [resource, value] of Object.entries(data.resources)) {
                if (this.resourceElements[resource]) {
                    this.resourceElements[resource].textContent = this.formatNumber(Math.floor(value));
                    
                    // 上限に近い場合は色を変更
                    const resourceCap = this.game.systems.resource?.resourceCaps[resource];
                    if (resourceCap && value / resourceCap > 0.9) {
                        this.resourceElements[resource].style.color = '#ffaa00';
                    } else {
                        this.resourceElements[resource].style.color = '#fff';
                    }
                }
            }
        }
        
        // 生産レートを更新
        if (data.netRates) {
            for (const [resource, rate] of Object.entries(data.netRates)) {
                if (this.productionElements[resource]) {
                    const formattedRate = this.formatRate(rate);
                    this.productionElements[resource].textContent = formattedRate;
                    
                    // レートによって色を変更
                    if (rate > 0) {
                        this.productionElements[resource].style.color = '#00ff00';
                    } else if (rate < 0) {
                        this.productionElements[resource].style.color = '#ff4444';
                        // エネルギー不足の警告アイコンを追加
                        if (resource === 'energy') {
                            this.productionElements[resource].innerHTML = formattedRate + ' ⚠️';
                        }
                    } else {
                        this.productionElements[resource].style.color = '#888';
                    }
                }
            }
        }
        
        // 人口情報を更新
        if (data.population) {
            const pop = data.population;
            this.populationElement.innerHTML = `
                <div>👥 人口: <span style="font-weight: bold;">${pop.population}</span></div>
                <div>👷 労働力: <span style="font-weight: bold; ${pop.workforceUsed > pop.workforce ? 'color: #ff4444;' : ''}">${pop.workforceUsed}/${pop.workforce}</span></div>
            `;
        }
        
        // 警告を表示
        this.updateWarnings(data);
    }
    
    updateWarnings(data) {
        const warnings = [];
        
        // エネルギー不足チェック
        if (data.resources && data.resources.energy < 10) {
            warnings.push('⚠️ エネルギーが不足しています！');
        }
        
        // エネルギー生産がマイナスの場合
        if (data.netRates && data.netRates.energy < 0) {
            const minutesLeft = data.resources.energy / Math.abs(data.netRates.energy);
            if (minutesLeft < 10) {
                warnings.push(`⚡ エネルギーが${Math.floor(minutesLeft)}分で枯渇します！`);
            }
        }
        
        // 労働力不足
        if (data.population && data.population.workforceUsed > data.population.workforce) {
            warnings.push('👷 労働力が不足しています！');
        }
        
        // 警告表示
        if (warnings.length > 0) {
            this.warningSection.innerHTML = warnings.join('<br>');
            this.warningSection.style.display = 'block';
        } else {
            this.warningSection.style.display = 'none';
        }
    }
    
    formatNumber(num) {
        if (num >= 1000000) {
            return (num / 1000000).toFixed(1) + 'M';
        } else if (num >= 1000) {
            return (num / 1000).toFixed(1) + 'K';
        }
        return num.toString();
    }
    
    formatRate(rate) {
        const sign = rate >= 0 ? '+' : '';
        const absRate = Math.abs(rate);
        
        if (absRate < 0.1 && absRate > 0) {
            return `${sign}${absRate.toFixed(2)}/分`;
        } else if (absRate >= 1000) {
            return `${sign}${(absRate / 1000).toFixed(1)}K/分`;
        } else if (absRate >= 100) {
            return `${sign}${Math.floor(absRate)}/分`;
        } else if (absRate >= 10) {
            return `${sign}${absRate.toFixed(1)}/分`;
        } else if (absRate > 0) {
            return `${sign}${absRate.toFixed(1)}/分`;
        }
        return '0/分';
    }
    
    setupEventListeners() {
        // リソースシステムからの更新を受け取る
        if (this.game.systems.resource) {
            const originalCallback = this.game.systems.resource.onResourcesChanged;
            this.game.systems.resource.onResourcesChanged = (data) => {
                this.updateDisplay(data);
                if (originalCallback) {
                    originalCallback(data);
                }
            };
        }
        
        // ホバー時の詳細表示
        this.container.addEventListener('mouseenter', () => {
            this.container.style.transform = 'scale(1.02)';
            this.container.style.boxShadow = '0 15px 40px rgba(0, 255, 255, 0.3)';
        });
        
        this.container.addEventListener('mouseleave', () => {
            this.container.style.transform = 'scale(1)';
            this.container.style.boxShadow = '0 10px 30px rgba(0, 255, 255, 0.2)';
        });
    }
    
    // アニメーション効果
    flashResource(resource, color = '#00ff00') {
        const element = this.resourceElements[resource];
        if (!element) return;
        
        const originalColor = element.style.color || '#fff';
        element.style.color = color;
        element.style.textShadow = `0 0 20px ${color}`;
        element.style.transform = 'scale(1.2)';
        
        setTimeout(() => {
            element.style.color = originalColor;
            element.style.textShadow = '';
            element.style.transform = 'scale(1)';
        }, 500);
    }
    
    // クリーンアップ
    dispose() {
        if (this.container && this.container.parentNode) {
            this.container.parentNode.removeChild(this.container);
        }
    }
}