// デバッグパネル - 開発用のリソース補充機能

export class DebugPanel {
    constructor(game) {
        this.game = game;
        this.container = null;
        this.isVisible = false;
        
        this.createUI();
        this.setupEventListeners();
    }
    
    createUI() {
        // メインコンテナ
        this.container = document.createElement('div');
        this.container.id = 'debug-panel';
        this.container.style.cssText = `
            position: absolute;
            bottom: 20px;
            left: 20px;
            background: rgba(50, 0, 50, 0.9);
            border: 2px solid #ff00ff;
            border-radius: 10px;
            padding: 15px;
            min-width: 200px;
            pointer-events: auto;
            transform: translateY(calc(100% + 40px));
            transition: transform 0.3s ease;
        `;
        
        // タイトル
        const title = document.createElement('div');
        title.style.cssText = `
            color: #ff00ff;
            font-size: 16px;
            font-weight: bold;
            margin-bottom: 10px;
            text-align: center;
        `;
        title.textContent = '🔧 デバッグパネル';
        
        // トグルボタン（常に表示）
        const toggleButton = document.createElement('button');
        toggleButton.style.cssText = `
            position: absolute;
            bottom: 100%;
            left: 0;
            margin-bottom: 5px;
            padding: 5px 15px;
            background: rgba(50, 0, 50, 0.9);
            border: 2px solid #ff00ff;
            border-radius: 5px 5px 0 0;
            color: #ff00ff;
            font-size: 12px;
            cursor: pointer;
            transition: all 0.2s ease;
        `;
        toggleButton.textContent = 'DEBUG';
        toggleButton.onclick = () => this.toggle();
        toggleButton.onmouseover = () => {
            toggleButton.style.background = 'rgba(100, 0, 100, 0.9)';
        };
        toggleButton.onmouseout = () => {
            toggleButton.style.background = 'rgba(50, 0, 50, 0.9)';
        };
        
        // リソース補充セクション
        const resourceSection = document.createElement('div');
        resourceSection.style.cssText = `
            margin-bottom: 15px;
        `;
        
        // 各リソースのボタン
        const resources = [
            { id: 'credits', name: 'クレジット', icon: '💰', amount: 10000 },
            { id: 'energy', name: 'エネルギー', icon: '⚡', amount: 1000 },
            { id: 'iron', name: '鉄', icon: '🔩', amount: 500 },
            { id: 'crystal', name: 'クリスタル', icon: '💎', amount: 100 },
            { id: 'research', name: '研究', icon: '🔬', amount: 100 }
        ];
        
        resources.forEach(resource => {
            const button = this.createResourceButton(resource);
            resourceSection.appendChild(button);
        });
        
        // 全リソース補充ボタン
        const allResourcesButton = document.createElement('button');
        allResourcesButton.style.cssText = `
            width: 100%;
            padding: 10px;
            margin-bottom: 10px;
            background: linear-gradient(135deg, #ff00ff, #ff00aa);
            color: white;
            border: none;
            border-radius: 5px;
            font-size: 14px;
            font-weight: bold;
            cursor: pointer;
            transition: all 0.2s ease;
        `;
        allResourcesButton.innerHTML = '🌟 全リソース補充';
        allResourcesButton.onclick = () => this.addAllResources();
        allResourcesButton.onmouseover = () => {
            allResourcesButton.style.transform = 'scale(1.05)';
            allResourcesButton.style.boxShadow = '0 4px 15px rgba(255, 0, 255, 0.4)';
        };
        allResourcesButton.onmouseout = () => {
            allResourcesButton.style.transform = 'scale(1)';
            allResourcesButton.style.boxShadow = 'none';
        };
        
        // その他の機能
        const otherSection = document.createElement('div');
        otherSection.style.cssText = `
            border-top: 1px solid rgba(255, 0, 255, 0.3);
            padding-top: 10px;
            margin-top: 10px;
        `;
        
        // 建設時間スキップ
        const skipBuildButton = document.createElement('button');
        skipBuildButton.style.cssText = `
            width: 100%;
            padding: 8px;
            margin-bottom: 5px;
            background: rgba(0, 255, 255, 0.2);
            color: #0ff;
            border: 1px solid #0ff;
            border-radius: 3px;
            font-size: 12px;
            cursor: pointer;
            transition: all 0.2s ease;
        `;
        skipBuildButton.innerHTML = '⏩ 建設完了';
        skipBuildButton.onclick = () => this.skipAllConstruction();
        skipBuildButton.onmouseover = () => {
            skipBuildButton.style.background = 'rgba(0, 255, 255, 0.4)';
        };
        skipBuildButton.onmouseout = () => {
            skipBuildButton.style.background = 'rgba(0, 255, 255, 0.2)';
        };
        
        // 全建物削除
        const clearBuildingsButton = document.createElement('button');
        clearBuildingsButton.style.cssText = `
            width: 100%;
            padding: 8px;
            margin-bottom: 5px;
            background: rgba(255, 0, 0, 0.2);
            color: #ff4444;
            border: 1px solid #ff4444;
            border-radius: 3px;
            font-size: 12px;
            cursor: pointer;
            transition: all 0.2s ease;
        `;
        clearBuildingsButton.innerHTML = '🗑️ 全建物削除';
        clearBuildingsButton.onclick = () => this.clearAllBuildings();
        clearBuildingsButton.onmouseover = () => {
            clearBuildingsButton.style.background = 'rgba(255, 0, 0, 0.4)';
        };
        clearBuildingsButton.onmouseout = () => {
            clearBuildingsButton.style.background = 'rgba(255, 0, 0, 0.2)';
        };
        
        // サウンドのトグル
        const soundToggle = document.createElement('button');
        soundToggle.style.cssText = `
            width: 100%;
            padding: 8px;
            background: rgba(255, 255, 0, 0.2);
            color: #ffff00;
            border: 1px solid #ffff00;
            border-radius: 3px;
            font-size: 12px;
            cursor: pointer;
            transition: all 0.2s ease;
        `;
        soundToggle.innerHTML = '🔊 サウンド切替';
        soundToggle.onclick = () => this.toggleSound();
        soundToggle.onmouseover = () => {
            soundToggle.style.background = 'rgba(255, 255, 0, 0.4)';
        };
        soundToggle.onmouseout = () => {
            soundToggle.style.background = 'rgba(255, 255, 0, 0.2)';
        };
        
        // 組み立て
        otherSection.appendChild(skipBuildButton);
        otherSection.appendChild(clearBuildingsButton);
        otherSection.appendChild(soundToggle);
        
        this.container.appendChild(toggleButton);
        this.container.appendChild(title);
        this.container.appendChild(allResourcesButton);
        this.container.appendChild(resourceSection);
        this.container.appendChild(otherSection);
        
        // UIコンテナに追加
        const uiContainer = document.getElementById('planet-ui');
        if (uiContainer) {
            uiContainer.appendChild(this.container);
        }
    }
    
    createResourceButton(resource) {
        const button = document.createElement('button');
        button.style.cssText = `
            width: 100%;
            padding: 8px;
            margin-bottom: 5px;
            background: rgba(255, 255, 255, 0.1);
            color: white;
            border: 1px solid rgba(255, 255, 255, 0.3);
            border-radius: 3px;
            font-size: 12px;
            cursor: pointer;
            transition: all 0.2s ease;
            text-align: left;
        `;
        button.innerHTML = `${resource.icon} +${this.formatNumber(resource.amount)} ${resource.name}`;
        
        button.onclick = () => {
            if (this.game.systems.resource) {
                this.game.systems.resource.addResource(resource.id, resource.amount);
                this.showMessage(`+${this.formatNumber(resource.amount)} ${resource.name}`);
                
                // エフェクト
                if (this.game.components.resourceDisplay) {
                    this.game.components.resourceDisplay.flashResource(resource.id, '#00ff00');
                }
                
                // 音
                if (this.game.systems.sound) {
                    this.game.systems.sound.play('success');
                }
            }
        };
        
        button.onmouseover = () => {
            button.style.background = 'rgba(255, 255, 255, 0.2)';
            button.style.borderColor = 'rgba(255, 255, 255, 0.5)';
        };
        
        button.onmouseout = () => {
            button.style.background = 'rgba(255, 255, 255, 0.1)';
            button.style.borderColor = 'rgba(255, 255, 255, 0.3)';
        };
        
        return button;
    }
    
    toggle() {
        this.isVisible = !this.isVisible;
        this.container.style.transform = this.isVisible ? 'translateY(0)' : 'translateY(calc(100% + 40px))';
    }
    
    show() {
        this.isVisible = true;
        this.container.style.transform = 'translateY(0)';
    }
    
    hide() {
        this.isVisible = false;
        this.container.style.transform = 'translateY(calc(100% + 40px))';
    }
    
    addAllResources() {
        if (this.game.systems.resource) {
            this.game.systems.resource.cheatAddResources(10000);
            this.showMessage('全リソース補充完了！');
            
            // 音
            if (this.game.systems.sound) {
                this.game.systems.sound.play('success');
            }
        }
    }
    
    skipAllConstruction() {
        if (!this.game.systems.building) return;
        
        let count = 0;
        for (const building of this.game.systems.building.buildings.values()) {
            if (building.isConstructing) {
                building.isConstructing = false;
                building.mesh.position.y = building.mesh.userData.originalY || 2.5;
                building.mesh.rotation.y = 0;
                count++;
                
                // エフェクト
                if (this.game.systems.building.effects) {
                    this.game.systems.building.effects.playConstructionComplete(building);
                }
            }
        }
        
        if (count > 0) {
            this.showMessage(`${count}個の建設を完了しました`);
            
            // 音
            if (this.game.systems.sound) {
                this.game.systems.sound.play('buildingComplete');
            }
        } else {
            this.showMessage('建設中の建物がありません');
        }
    }
    
    clearAllBuildings() {
        if (!this.game.systems.building) return;
        
        const count = this.game.systems.building.buildings.size;
        if (count === 0) {
            this.showMessage('建物がありません');
            return;
        }
        
        if (confirm(`${count}個の建物を全て削除しますか？`)) {
            const buildingIds = Array.from(this.game.systems.building.buildings.keys());
            for (const id of buildingIds) {
                this.game.systems.building.removeBuilding(id);
            }
            
            this.showMessage(`${count}個の建物を削除しました`);
            
            // 音
            if (this.game.systems.sound) {
                this.game.systems.sound.play('error');
            }
        }
    }
    
    toggleSound() {
        if (this.game.systems.sound) {
            const newState = !this.game.systems.sound.enabled;
            this.game.systems.sound.setEnabled(newState);
            this.showMessage(newState ? 'サウンドON' : 'サウンドOFF');
        }
    }
    
    showMessage(text) {
        const message = document.createElement('div');
        message.style.cssText = `
            position: fixed;
            bottom: 100px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(255, 0, 255, 0.9);
            color: white;
            padding: 10px 20px;
            border-radius: 5px;
            font-size: 14px;
            font-weight: bold;
            z-index: 2000;
            animation: debugMessage 1.5s ease;
        `;
        message.textContent = text;
        
        const style = document.createElement('style');
        style.textContent = `
            @keyframes debugMessage {
                0% { opacity: 0; transform: translate(-50%, 20px); }
                20% { opacity: 1; transform: translate(-50%, 0); }
                80% { opacity: 1; transform: translate(-50%, 0); }
                100% { opacity: 0; transform: translate(-50%, -20px); }
            }
        `;
        document.head.appendChild(style);
        
        document.body.appendChild(message);
        
        setTimeout(() => {
            message.remove();
            style.remove();
        }, 1500);
    }
    
    formatNumber(num) {
        if (num >= 1000000) {
            return (num / 1000000).toFixed(1) + 'M';
        } else if (num >= 1000) {
            return (num / 1000).toFixed(1) + 'K';
        }
        return num.toString();
    }
    
    setupEventListeners() {
        // F12キーでトグル
        document.addEventListener('keydown', (e) => {
            if (e.key === 'F12') {
                e.preventDefault();
                this.toggle();
            }
        });
    }
    
    dispose() {
        if (this.container && this.container.parentNode) {
            this.container.parentNode.removeChild(this.container);
        }
    }
}