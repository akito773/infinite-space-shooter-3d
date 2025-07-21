// 探索UI - 探索モードのインターフェース

export class ExplorationUI {
    constructor(game) {
        this.game = game;
        this.container = null;
        this.isVisible = false;
        
        this.createUI();
    }
    
    createUI() {
        // メインコンテナ
        this.container = document.createElement('div');
        this.container.id = 'exploration-ui';
        this.container.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            display: none;
        `;
        
        // 探索ボタン
        this.createExplorationButton();
        
        // 探索モード時の操作説明
        this.createExplorationControls();
        
        // リソース収集プロンプト
        this.createCollectPrompt();
        
        // UIコンテナに追加
        const uiContainer = document.getElementById('planet-ui');
        if (uiContainer) {
            uiContainer.appendChild(this.container);
        }
    }
    
    createExplorationButton() {
        const button = document.createElement('button');
        button.id = 'exploration-button';
        button.style.cssText = `
            position: absolute;
            bottom: 80px;
            left: 50%;
            transform: translateX(-50%);
            padding: 15px 30px;
            background: linear-gradient(135deg, #FF6B6B, #FF8C42);
            color: white;
            border: none;
            border-radius: 25px;
            font-size: 18px;
            font-weight: bold;
            cursor: pointer;
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
            transition: all 0.3s ease;
            pointer-events: auto;
        `;
        button.innerHTML = '🚶 探索モード';
        
        button.onmouseover = () => {
            button.style.transform = 'translateX(-50%) scale(1.05)';
            button.style.boxShadow = '0 6px 20px rgba(0, 0, 0, 0.4)';
        };
        
        button.onmouseout = () => {
            button.style.transform = 'translateX(-50%) scale(1)';
            button.style.boxShadow = '0 4px 15px rgba(0, 0, 0, 0.3)';
        };
        
        button.onclick = () => {
            if (this.game.systems.exploration) {
                this.game.systems.exploration.toggleExplorationMode();
                this.updateButtonState();
                
                // 音
                if (this.game.systems.sound) {
                    this.game.systems.sound.play('buttonClick');
                }
            }
        };
        
        this.explorationButton = button;
        this.container.appendChild(button);
        this.container.style.display = 'block'; // ボタンは常に表示
    }
    
    createExplorationControls() {
        const controls = document.createElement('div');
        controls.id = 'exploration-controls';
        controls.style.cssText = `
            position: absolute;
            top: 50%;
            left: 20px;
            transform: translateY(-50%);
            background: rgba(0, 0, 0, 0.8);
            border: 2px solid #FF6B6B;
            border-radius: 10px;
            padding: 20px;
            color: white;
            font-size: 14px;
            line-height: 1.8;
            pointer-events: none;
            opacity: 0;
            transition: opacity 0.3s ease;
        `;
        
        controls.innerHTML = `
            <h3 style="color: #FF6B6B; margin: 0 0 10px 0;">探索モード</h3>
            <div>🚶 WASD: 移動</div>
            <div>🏃 Shift: 走る</div>
            <div>📦 E: リソース収集</div>
            <div>🔨 Tab: 建設モードへ</div>
            <div>❌ ESC: 探索終了</div>
        `;
        
        this.explorationControls = controls;
        this.container.appendChild(controls);
    }
    
    createCollectPrompt() {
        const prompt = document.createElement('div');
        prompt.id = 'collect-prompt';
        prompt.style.cssText = `
            position: absolute;
            bottom: 200px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(0, 0, 0, 0.9);
            border: 2px solid #00ff00;
            border-radius: 10px;
            padding: 15px 30px;
            color: #00ff00;
            font-size: 16px;
            font-weight: bold;
            pointer-events: none;
            opacity: 0;
            transition: all 0.3s ease;
        `;
        
        prompt.innerHTML = '[E]キーで収集';
        
        this.collectPrompt = prompt;
        this.container.appendChild(prompt);
    }
    
    show() {
        this.isVisible = true;
        this.explorationControls.style.opacity = '1';
    }
    
    hide() {
        this.isVisible = false;
        this.explorationControls.style.opacity = '0';
        this.hideCollectPrompt();
    }
    
    updateButtonState() {
        if (this.game.systems.exploration?.isExploring) {
            this.explorationButton.style.background = 'linear-gradient(135deg, #4CAF50, #45a049)';
            this.explorationButton.innerHTML = '🏗️ 建設モード';
            this.show();
        } else {
            this.explorationButton.style.background = 'linear-gradient(135deg, #FF6B6B, #FF8C42)';
            this.explorationButton.innerHTML = '🚶 探索モード';
            this.hide();
        }
    }
    
    showCollectPrompt(resourceType) {
        const resourceNames = {
            iron: '鉄鉱石',
            energy: 'エネルギークリスタル',
            crystal: 'レアクリスタル'
        };
        
        const resourceName = resourceNames[resourceType] || 'リソース';
        this.collectPrompt.innerHTML = `[E]キーで${resourceName}を収集`;
        this.collectPrompt.style.opacity = '1';
        this.collectPrompt.style.transform = 'translateX(-50%) translateY(-10px)';
    }
    
    hideCollectPrompt() {
        this.collectPrompt.style.opacity = '0';
        this.collectPrompt.style.transform = 'translateX(-50%) translateY(0)';
    }
    
    // 探索統計を表示
    showExplorationStats(stats) {
        const statsDisplay = document.createElement('div');
        statsDisplay.style.cssText = `
            position: absolute;
            top: 100px;
            right: 20px;
            background: rgba(0, 0, 0, 0.8);
            border: 2px solid #FF6B6B;
            border-radius: 10px;
            padding: 15px;
            color: white;
            font-size: 14px;
            pointer-events: none;
        `;
        
        statsDisplay.innerHTML = `
            <h4 style="color: #FF6B6B; margin: 0 0 10px 0;">探索統計</h4>
            <div>探索時間: ${Math.floor(stats.time)}秒</div>
            <div>収集リソース: ${stats.collected}個</div>
            <div>発見エリア: ${stats.areasFound}箇所</div>
        `;
        
        this.container.appendChild(statsDisplay);
        
        // 5秒後に自動で消す
        setTimeout(() => {
            statsDisplay.style.opacity = '0';
            setTimeout(() => statsDisplay.remove(), 300);
        }, 5000);
    }
    
    // ミニマップ（将来的な実装用）
    createMinimap() {
        const minimap = document.createElement('canvas');
        minimap.id = 'exploration-minimap';
        minimap.width = 150;
        minimap.height = 150;
        minimap.style.cssText = `
            position: absolute;
            top: 20px;
            right: 20px;
            background: rgba(0, 0, 0, 0.7);
            border: 2px solid #FF6B6B;
            border-radius: 10px;
            pointer-events: none;
        `;
        
        // ミニマップの実装は後日
        
        return minimap;
    }
    
    dispose() {
        if (this.container && this.container.parentNode) {
            this.container.parentNode.removeChild(this.container);
        }
    }
}