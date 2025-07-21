// 決算UI - 収益結果とランキング表示

export class SettlementUI {
    constructor(game) {
        this.game = game;
        this.isVisible = false;
        
        this.createUI();
        this.setupStyles();
    }
    
    setupStyles() {
        const style = document.createElement('style');
        style.textContent = `
            @keyframes settlementSlideIn {
                from {
                    transform: translate(-50%, -50%) scale(0.8);
                    opacity: 0;
                }
                to {
                    transform: translate(-50%, -50%) scale(1);
                    opacity: 1;
                }
            }
            
            @keyframes incomeCount {
                0% { transform: scale(1); }
                50% { transform: scale(1.2); }
                100% { transform: scale(1); }
            }
            
            .settlement-result-item {
                margin: 15px 0;
                padding: 15px;
                background: rgba(255, 255, 255, 0.1);
                border-radius: 10px;
                border: 2px solid transparent;
                transition: all 0.3s;
            }
            
            .settlement-result-item.rank-1 {
                border-color: #ffd700;
                background: rgba(255, 215, 0, 0.1);
            }
            
            .settlement-result-item.rank-2 {
                border-color: #c0c0c0;
                background: rgba(192, 192, 192, 0.1);
            }
            
            .settlement-result-item.rank-3 {
                border-color: #cd7f32;
                background: rgba(205, 127, 50, 0.1);
            }
            
            .settlement-result-item.current-player {
                box-shadow: 0 0 20px rgba(0, 255, 0, 0.5);
            }
            
            .income-animation {
                animation: incomeCount 0.5s ease-out;
                color: #00ff00;
                font-weight: bold;
            }
            
            .planet-income-item {
                display: flex;
                justify-content: space-between;
                padding: 5px 10px;
                margin: 5px 0;
                background: rgba(0, 0, 0, 0.3);
                border-radius: 5px;
                font-size: 14px;
            }
        `;
        document.head.appendChild(style);
    }
    
    createUI() {
        // メインコンテナ
        this.container = document.createElement('div');
        this.container.id = 'settlement-ui';
        this.container.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: linear-gradient(135deg, rgba(0, 20, 60, 0.98), rgba(0, 40, 80, 0.98));
            border: 3px solid #00ffff;
            border-radius: 20px;
            padding: 30px;
            min-width: 600px;
            max-width: 800px;
            max-height: 80vh;
            overflow-y: auto;
            color: #ffffff;
            font-family: 'Orbitron', monospace;
            display: none;
            z-index: 3000;
            animation: settlementSlideIn 0.5s ease-out;
        `;
        
        // ヘッダー
        this.header = document.createElement('div');
        this.header.style.cssText = `
            text-align: center;
            margin-bottom: 30px;
        `;
        
        // タイトル
        this.title = document.createElement('h1');
        this.title.style.cssText = `
            font-size: 36px;
            color: #00ffff;
            margin: 0 0 10px 0;
            text-shadow: 0 0 20px rgba(0, 255, 255, 0.5);
        `;
        
        // サブタイトル
        this.subtitle = document.createElement('div');
        this.subtitle.style.cssText = `
            font-size: 18px;
            color: #88ffff;
        `;
        
        this.header.appendChild(this.title);
        this.header.appendChild(this.subtitle);
        
        // 結果コンテナ
        this.resultsContainer = document.createElement('div');
        this.resultsContainer.style.cssText = `
            margin-bottom: 20px;
        `;
        
        // 次回決算情報
        this.nextSettlementInfo = document.createElement('div');
        this.nextSettlementInfo.style.cssText = `
            text-align: center;
            margin-top: 20px;
            padding: 15px;
            background: rgba(0, 0, 0, 0.5);
            border-radius: 10px;
            font-size: 16px;
            color: #ffff88;
        `;
        
        // 閉じるボタン
        this.closeButton = document.createElement('button');
        this.closeButton.textContent = '確認';
        this.closeButton.style.cssText = `
            display: block;
            margin: 20px auto 0;
            padding: 15px 40px;
            background: linear-gradient(135deg, #00ff00, #00aa00);
            border: none;
            border-radius: 25px;
            color: #000000;
            font-size: 18px;
            font-weight: bold;
            cursor: pointer;
            transition: all 0.3s;
            box-shadow: 0 4px 15px rgba(0, 255, 0, 0.3);
        `;
        
        this.closeButton.onmouseover = () => {
            this.closeButton.style.transform = 'scale(1.1)';
            this.closeButton.style.boxShadow = '0 6px 20px rgba(0, 255, 0, 0.5)';
        };
        
        this.closeButton.onmouseout = () => {
            this.closeButton.style.transform = 'scale(1)';
            this.closeButton.style.boxShadow = '0 4px 15px rgba(0, 255, 0, 0.3)';
        };
        
        this.closeButton.onclick = () => this.hide();
        
        // 組み立て
        this.container.appendChild(this.header);
        this.container.appendChild(this.resultsContainer);
        this.container.appendChild(this.nextSettlementInfo);
        this.container.appendChild(this.closeButton);
        
        document.body.appendChild(this.container);
    }
    
    showResults(results, isRegular) {
        this.isVisible = true;
        
        // タイトル設定
        this.title.textContent = isRegular ? '🏆 定期決算 🏆' : '💰 ミニ決算 💰';
        this.subtitle.textContent = `${new Date().toLocaleString('ja-JP')}`;
        
        // 結果をクリア
        this.resultsContainer.innerHTML = '';
        
        // ランキング形式で表示
        results.forEach((result, index) => {
            const resultItem = document.createElement('div');
            resultItem.className = `settlement-result-item rank-${index + 1}`;
            
            // 現在のプレイヤーかチェック
            if (result.playerId === this.game.systems.planetOwnership?.currentPlayerId) {
                resultItem.className += ' current-player';
            }
            
            // ランク表示
            const rankDisplay = document.createElement('div');
            rankDisplay.style.cssText = `
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 10px;
            `;
            
            const rankBadge = document.createElement('span');
            rankBadge.style.cssText = `
                font-size: 24px;
                font-weight: bold;
            `;
            rankBadge.textContent = this.getRankEmoji(index + 1) + ` ${index + 1}位`;
            
            const playerName = document.createElement('span');
            playerName.style.cssText = `
                font-size: 20px;
                color: #ffffff;
            `;
            playerName.textContent = result.playerName;
            
            const incomeDisplay = document.createElement('span');
            incomeDisplay.className = 'income-animation';
            incomeDisplay.style.cssText = `
                font-size: 24px;
            `;
            incomeDisplay.textContent = `+${result.totalIncome.toLocaleString()} cr`;
            
            rankDisplay.appendChild(rankBadge);
            rankDisplay.appendChild(playerName);
            rankDisplay.appendChild(incomeDisplay);
            
            resultItem.appendChild(rankDisplay);
            
            // 惑星別収益（展開可能）
            if (result.planetIncomes.length > 0) {
                const detailsToggle = document.createElement('div');
                detailsToggle.style.cssText = `
                    cursor: pointer;
                    color: #aaaaaa;
                    font-size: 14px;
                    margin-top: 5px;
                `;
                detailsToggle.textContent = `▶ 詳細を見る (${result.planetIncomes.length}惑星)`;
                
                const detailsContainer = document.createElement('div');
                detailsContainer.style.display = 'none';
                detailsContainer.style.marginTop = '10px';
                
                result.planetIncomes.forEach(planet => {
                    const planetItem = document.createElement('div');
                    planetItem.className = 'planet-income-item';
                    planetItem.innerHTML = `
                        <span>${planet.planetName}</span>
                        <span>+${planet.income.toLocaleString()} cr</span>
                    `;
                    detailsContainer.appendChild(planetItem);
                });
                
                detailsToggle.onclick = () => {
                    if (detailsContainer.style.display === 'none') {
                        detailsContainer.style.display = 'block';
                        detailsToggle.textContent = `▼ 詳細を隠す (${result.planetIncomes.length}惑星)`;
                    } else {
                        detailsContainer.style.display = 'none';
                        detailsToggle.textContent = `▶ 詳細を見る (${result.planetIncomes.length}惑星)`;
                    }
                };
                
                resultItem.appendChild(detailsToggle);
                resultItem.appendChild(detailsContainer);
            }
            
            // 新残高表示
            const balanceDisplay = document.createElement('div');
            balanceDisplay.style.cssText = `
                margin-top: 10px;
                text-align: right;
                color: #88ff88;
                font-size: 16px;
            `;
            balanceDisplay.textContent = `残高: ${result.newBalance.toLocaleString()} cr`;
            resultItem.appendChild(balanceDisplay);
            
            this.resultsContainer.appendChild(resultItem);
        });
        
        // 次回決算情報
        this.updateNextSettlementInfo();
        
        // 表示
        this.container.style.display = 'block';
        
        // 効果音
        if (this.game.systems.sound) {
            this.game.systems.sound.playSound('settlement');
        }
        
        // 一定時間後に自動で閉じる（オプション）
        // setTimeout(() => this.hide(), 10000);
    }
    
    getRankEmoji(rank) {
        switch (rank) {
            case 1: return '🥇';
            case 2: return '🥈';
            case 3: return '🥉';
            default: return '🏅';
        }
    }
    
    updateNextSettlementInfo() {
        const ownership = this.game.systems.planetOwnership;
        if (!ownership) return;
        
        const nextTime = ownership.nextSettlement;
        const now = Date.now();
        const timeUntilNext = nextTime - now;
        
        const hours = Math.floor(timeUntilNext / (1000 * 60 * 60));
        const minutes = Math.floor((timeUntilNext % (1000 * 60 * 60)) / (1000 * 60));
        
        this.nextSettlementInfo.innerHTML = `
            <div style="margin-bottom: 5px;">次回ミニ決算まで</div>
            <div style="font-size: 24px; color: #ffffff;">
                ${hours}時間 ${minutes}分
            </div>
            <div style="font-size: 14px; margin-top: 10px; color: #aaaaaa;">
                定期決算: 毎週日曜日 21:00
            </div>
        `;
    }
    
    hide() {
        this.isVisible = false;
        this.container.style.display = 'none';
    }
    
    // ミニ通知（画面端に表示）
    showMiniNotification(message) {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: linear-gradient(135deg, rgba(0, 255, 0, 0.9), rgba(0, 128, 0, 0.9));
            color: #000000;
            padding: 15px 25px;
            border-radius: 10px;
            font-family: 'Orbitron', monospace;
            font-weight: bold;
            box-shadow: 0 4px 20px rgba(0, 255, 0, 0.5);
            animation: slideInRight 0.5s ease-out;
            z-index: 4000;
        `;
        
        notification.textContent = message;
        document.body.appendChild(notification);
        
        // 3秒後に削除
        setTimeout(() => {
            notification.style.animation = 'slideOutRight 0.5s ease-out';
            setTimeout(() => notification.remove(), 500);
        }, 3000);
    }
}