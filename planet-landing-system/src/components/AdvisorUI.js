// アドバイザーUI - ナビ助の表示とアドバイス

export class AdvisorUI {
    constructor(game) {
        this.game = game;
        this.isVisible = false;
        this.currentAdvice = null;
        
        this.createUI();
        this.setupStyles();
        this.setupEventListeners();
    }
    
    setupStyles() {
        const style = document.createElement('style');
        style.textContent = `
            @keyframes advisorBounce {
                0%, 100% { transform: translateY(0px); }
                50% { transform: translateY(-5px); }
            }
            
            @keyframes advisorPulse {
                0% { box-shadow: 0 0 15px rgba(0, 255, 255, 0.3); }
                50% { box-shadow: 0 0 25px rgba(0, 255, 255, 0.6); }
                100% { box-shadow: 0 0 15px rgba(0, 255, 255, 0.3); }
            }
            
            @keyframes slideInFromBottom {
                from {
                    transform: translateY(100px);
                    opacity: 0;
                }
                to {
                    transform: translateY(0);
                    opacity: 1;
                }
            }
            
            .advisor-icon {
                font-size: 48px;
                animation: advisorBounce 2s infinite;
                cursor: pointer;
                transition: all 0.3s;
            }
            
            .advisor-icon:hover {
                transform: scale(1.1) translateY(-5px);
                filter: brightness(1.2);
            }
            
            .advisor-speech-bubble {
                position: relative;
                background: rgba(0, 50, 100, 0.95);
                border: 2px solid #00ffff;
                border-radius: 15px;
                padding: 20px;
                margin-top: 10px;
                animation: slideInFromBottom 0.5s ease-out;
            }
            
            .advisor-speech-bubble::before {
                content: '';
                position: absolute;
                bottom: 100%;
                left: 30px;
                border: 10px solid transparent;
                border-bottom-color: #00ffff;
            }
            
            .advisor-speech-bubble::after {
                content: '';
                position: absolute;
                bottom: 100%;
                left: 32px;
                border: 8px solid transparent;
                border-bottom-color: rgba(0, 50, 100, 0.95);
            }
            
            .advisor-tip {
                background: rgba(255, 215, 0, 0.1);
                border: 1px solid #ffd700;
                border-radius: 10px;
                padding: 10px;
                margin: 10px 0;
                font-size: 14px;
                color: #ffd700;
            }
            
            .advisor-action-button {
                background: linear-gradient(135deg, #00ff00, #00aa00);
                border: none;
                border-radius: 20px;
                color: #000000;
                padding: 8px 16px;
                margin: 5px;
                cursor: pointer;
                font-weight: bold;
                transition: all 0.3s;
            }
            
            .advisor-action-button:hover {
                transform: scale(1.05);
                box-shadow: 0 4px 15px rgba(0, 255, 0, 0.4);
            }
            
            .urgency-high {
                border-color: #ff6600 !important;
                background: rgba(255, 102, 0, 0.1) !important;
                animation: advisorPulse 1s infinite;
            }
            
            .urgency-critical {
                border-color: #ff0000 !important;
                background: rgba(255, 0, 0, 0.2) !important;
                animation: advisorPulse 0.5s infinite;
            }
        `;
        document.head.appendChild(style);
    }
    
    createUI() {
        // メインコンテナ（右下に固定）
        this.container = document.createElement('div');
        this.container.id = 'advisor-ui';
        this.container.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            width: 350px;
            font-family: 'Orbitron', monospace;
            color: #ffffff;
            z-index: 1500;
            pointer-events: auto;
        `;
        
        // アドバイザーアイコン
        this.advisorIcon = document.createElement('div');
        this.advisorIcon.className = 'advisor-icon';
        this.advisorIcon.style.cssText = `
            text-align: center;
            background: rgba(0, 20, 40, 0.9);
            border: 2px solid #00ffff;
            border-radius: 50%;
            width: 80px;
            height: 80px;
            display: flex;
            align-items: center;
            justify-content: center;
            margin-left: auto;
            margin-right: 10px;
        `;
        this.advisorIcon.textContent = '🤖';
        
        // スピーチバブル（初期は非表示）
        this.speechBubble = document.createElement('div');
        this.speechBubble.className = 'advisor-speech-bubble';
        this.speechBubble.style.display = 'none';
        
        // アドバイスタイトル
        this.adviceTitle = document.createElement('div');
        this.adviceTitle.style.cssText = `
            font-size: 18px;
            font-weight: bold;
            color: #00ffff;
            margin-bottom: 10px;
        `;
        
        // アドバイス内容
        this.adviceContent = document.createElement('div');
        this.adviceContent.style.cssText = `
            font-size: 14px;
            line-height: 1.4;
            margin-bottom: 15px;
        `;
        
        // アクションボタンコンテナ
        this.actionContainer = document.createElement('div');
        this.actionContainer.style.cssText = `
            display: flex;
            flex-wrap: wrap;
            gap: 5px;
            margin-bottom: 10px;
        `;
        
        // 閉じるボタン
        this.closeButton = document.createElement('button');
        this.closeButton.textContent = 'わかったナビ〜';
        this.closeButton.style.cssText = `
            background: rgba(255, 255, 255, 0.2);
            border: 1px solid #ffffff;
            border-radius: 15px;
            color: #ffffff;
            padding: 5px 15px;
            cursor: pointer;
            font-size: 12px;
            transition: all 0.3s;
        `;
        this.closeButton.onmouseover = () => {
            this.closeButton.style.background = 'rgba(255, 255, 255, 0.3)';
        };
        this.closeButton.onmouseout = () => {
            this.closeButton.style.background = 'rgba(255, 255, 255, 0.2)';
        };
        this.closeButton.onclick = () => this.hideAdvice();
        
        // ティップ表示エリア
        this.tipContainer = document.createElement('div');
        this.tipContainer.className = 'advisor-tip';
        this.tipContainer.style.display = 'none';
        
        // スピーチバブル組み立て
        this.speechBubble.appendChild(this.adviceTitle);
        this.speechBubble.appendChild(this.adviceContent);
        this.speechBubble.appendChild(this.actionContainer);
        this.speechBubble.appendChild(this.closeButton);
        
        // メインコンテナ組み立て
        this.container.appendChild(this.speechBubble);
        this.container.appendChild(this.tipContainer);
        this.container.appendChild(this.advisorIcon);
        
        document.body.appendChild(this.container);
    }
    
    setupEventListeners() {
        // アイコンクリックで前回のアドバイスを再表示
        this.advisorIcon.onclick = () => {
            if (this.currentAdvice) {
                this.showAdvice(this.currentAdvice);
            } else {
                this.showRandomEncouragement();
            }
        };
    }
    
    showAdvice(advice, isUrgent = false) {
        this.currentAdvice = advice;
        this.isVisible = true;
        
        // タイトルと内容を設定
        this.adviceTitle.textContent = advice.title;
        this.adviceContent.textContent = advice.content;
        
        // 緊急度に応じてスタイル変更
        this.speechBubble.className = 'advisor-speech-bubble';
        if (advice.urgency === 'high') {
            this.speechBubble.className += ' urgency-high';
        } else if (advice.urgency === 'critical') {
            this.speechBubble.className += ' urgency-critical';
        }
        
        // アクションボタンを作成
        this.createActionButtons(advice);
        
        // 表示
        this.speechBubble.style.display = 'block';
        this.tipContainer.style.display = 'none';
        
        // アイコンアニメーション
        this.advisorIcon.style.animation = 'advisorBounce 0.5s ease-out';
        
        // 効果音
        if (this.game.systems.sound) {
            this.game.systems.sound.play('success');
        }
        
        // 一定時間後に自動で閉じる（緊急でない場合）
        if (!isUrgent && advice.urgency !== 'critical') {
            setTimeout(() => this.hideAdvice(), 15000);
        }
    }
    
    createActionButtons(advice) {
        this.actionContainer.innerHTML = '';
        
        if (!advice.action) return;
        
        const actionButton = document.createElement('button');
        actionButton.className = 'advisor-action-button';
        actionButton.textContent = this.getActionButtonText(advice.action);
        actionButton.onclick = () => this.executeAction(advice.action);
        
        this.actionContainer.appendChild(actionButton);
        
        // 詳細ボタン
        const detailButton = document.createElement('button');
        detailButton.className = 'advisor-action-button';
        detailButton.style.background = 'linear-gradient(135deg, #0088ff, #0055aa)';
        detailButton.textContent = 'どうすればいいナビ？';
        detailButton.onclick = () => this.showDetailedHelp(advice.action);
        
        this.actionContainer.appendChild(detailButton);
    }
    
    getActionButtonText(action) {
        const texts = {
            building_menu: '建設メニューを開く',
            energy_management: 'エネルギー確認',
            transport_terminal: '輸送画面を開く',
            underground_exploration: '地下探索へ',
            build_defense: '防衛施設建設',
            build_research: '研究所建設',
            build_transport: 'ターミナル建設',
            prepare_settlement: '建設準備',
            event_preparation: '対策確認',
            planet_buyout: '惑星情報確認'
        };
        
        return texts[action] || 'やってみる';
    }
    
    executeAction(action) {
        // アクションを実行
        switch (action) {
            case 'building_menu':
                this.game.components.buildingMenu?.toggle();
                break;
                
            case 'transport_terminal':
                this.game.components.transportUI?.show();
                break;
                
            case 'underground_exploration':
                if (this.game.currentScene !== 'underground') {
                    this.game.toggleUnderground();
                }
                break;
                
            case 'energy_management':
                // エネルギー情報をハイライト
                this.highlightEnergyInfo();
                break;
                
            default:
                this.game.showMessage('この機能は開発中ナビ〜', 'info');
        }
        
        this.hideAdvice();
    }
    
    showDetailedHelp(action) {
        const advisor = this.game.systems.advisor;
        if (advisor) {
            const help = advisor.getActionAdvice(action);
            this.adviceContent.textContent = help;
            
            // ボタンを更新
            this.actionContainer.innerHTML = '';
            const okButton = document.createElement('button');
            okButton.className = 'advisor-action-button';
            okButton.textContent = 'ありがとうナビ〜';
            okButton.onclick = () => this.hideAdvice();
            this.actionContainer.appendChild(okButton);
        }
    }
    
    highlightEnergyInfo() {
        // エネルギー表示をハイライト（簡易実装）
        const resourceDisplay = document.querySelector('.resource-display');
        if (resourceDisplay) {
            resourceDisplay.style.border = '3px solid #ffff00';
            resourceDisplay.style.animation = 'advisorPulse 1s infinite';
            
            setTimeout(() => {
                resourceDisplay.style.border = '';
                resourceDisplay.style.animation = '';
            }, 3000);
        }
    }
    
    showTip(tip) {
        if (this.isVisible) return; // アドバイス表示中はティップを表示しない
        
        this.tipContainer.textContent = `💡 ${tip}`;
        this.tipContainer.style.display = 'block';
        this.speechBubble.style.display = 'none';
        
        // 10秒後に非表示
        setTimeout(() => {
            this.tipContainer.style.display = 'none';
        }, 10000);
    }
    
    showReaction(reaction) {
        // 短い反応を表示
        const reactionBubble = document.createElement('div');
        reactionBubble.style.cssText = `
            position: absolute;
            bottom: 100px;
            right: 10px;
            background: rgba(0, 255, 0, 0.9);
            color: #000000;
            padding: 10px 15px;
            border-radius: 20px;
            font-weight: bold;
            animation: slideInFromBottom 0.5s ease-out;
            z-index: 2000;
        `;
        reactionBubble.textContent = reaction;
        
        this.container.appendChild(reactionBubble);
        
        // 3秒後に削除
        setTimeout(() => {
            reactionBubble.remove();
        }, 3000);
    }
    
    showRandomEncouragement() {
        const encouragements = [
            'いい感じで進んでるナビ〜！',
            '調子はどうナビ？何か困ったことある？',
            'すごい開発っぷりやなぁ〜、感心するわ〜',
            '惑星開拓、楽しんでくれてるナビ〜？',
            '何かわからんことあったら、ワシに聞くナビ〜'
        ];
        
        const message = encouragements[Math.floor(Math.random() * encouragements.length)];
        
        this.showAdvice({
            id: 'encouragement',
            title: 'ナビ助より',
            content: message,
            urgency: 'low'
        });
    }
    
    hideAdvice() {
        this.isVisible = false;
        this.speechBubble.style.display = 'none';
        this.currentAdvice = null;
    }
    
    // 手動でアドバイスをトリガー（デバッグ用）
    triggerAdvice(adviceId) {
        const advisor = this.game.systems.advisor;
        if (advisor && ADVICE_CONDITIONS[adviceId]) {
            const advice = {
                id: adviceId,
                ...ADVICE_CONDITIONS[adviceId].advice
            };
            this.showAdvice(advice);
        }
    }
}