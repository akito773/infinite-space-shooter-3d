// イベントUI - ランダムイベントの表示と選択

export class EventUI {
    constructor(game) {
        this.game = game;
        this.isVisible = false;
        this.currentEvent = null;
        
        this.createUI();
    }
    
    createUI() {
        // メインコンテナ
        this.container = document.createElement('div');
        this.container.id = 'event-ui';
        this.container.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: linear-gradient(135deg, rgba(20, 0, 40, 0.95), rgba(40, 0, 20, 0.95));
            border: 3px solid #ff6600;
            border-radius: 15px;
            padding: 30px;
            min-width: 400px;
            max-width: 600px;
            color: #ffffff;
            font-family: 'Orbitron', monospace;
            display: none;
            z-index: 2000;
            box-shadow: 0 0 30px rgba(255, 102, 0, 0.5);
            animation: eventPulse 2s infinite;
        `;
        
        // アニメーション定義
        const style = document.createElement('style');
        style.textContent = `
            @keyframes eventPulse {
                0% { box-shadow: 0 0 30px rgba(255, 102, 0, 0.5); }
                50% { box-shadow: 0 0 50px rgba(255, 102, 0, 0.8); }
                100% { box-shadow: 0 0 30px rgba(255, 102, 0, 0.5); }
            }
            
            .event-choice {
                background: rgba(255, 255, 255, 0.1);
                border: 2px solid transparent;
                border-radius: 10px;
                padding: 15px;
                margin: 10px 0;
                cursor: pointer;
                transition: all 0.3s;
            }
            
            .event-choice:hover {
                background: rgba(255, 255, 255, 0.2);
                border-color: #ffaa00;
                transform: translateX(5px);
            }
            
            .event-choice.disabled {
                opacity: 0.5;
                cursor: not-allowed;
            }
            
            .event-choice.disabled:hover {
                background: rgba(255, 255, 255, 0.1);
                border-color: transparent;
                transform: none;
            }
            
            .requirement-not-met {
                color: #ff4444;
                font-size: 12px;
                margin-top: 5px;
            }
        `;
        document.head.appendChild(style);
        
        // イベントアイコン
        this.eventIcon = document.createElement('div');
        this.eventIcon.style.cssText = `
            font-size: 48px;
            text-align: center;
            margin-bottom: 20px;
            animation: bounce 1s infinite;
        `;
        
        // イベントタイトル
        this.eventTitle = document.createElement('h2');
        this.eventTitle.style.cssText = `
            text-align: center;
            color: #ff6600;
            margin: 0 0 15px 0;
            font-size: 28px;
            text-shadow: 0 0 10px rgba(255, 102, 0, 0.5);
        `;
        
        // イベント説明
        this.eventDescription = document.createElement('p');
        this.eventDescription.style.cssText = `
            text-align: center;
            margin: 0 0 30px 0;
            font-size: 16px;
            line-height: 1.5;
            color: #ffccaa;
        `;
        
        // 選択肢コンテナ
        this.choicesContainer = document.createElement('div');
        
        // 組み立て
        this.container.appendChild(this.eventIcon);
        this.container.appendChild(this.eventTitle);
        this.container.appendChild(this.eventDescription);
        this.container.appendChild(this.choicesContainer);
        
        document.body.appendChild(this.container);
    }
    
    showEvent(eventData) {
        this.currentEvent = eventData;
        this.isVisible = true;
        
        // イベント情報を設定
        this.eventIcon.textContent = eventData.icon;
        this.eventTitle.textContent = eventData.name;
        this.eventDescription.textContent = eventData.description;
        
        // 選択肢をクリア
        this.choicesContainer.innerHTML = '';
        
        // 選択肢を作成
        eventData.choices.forEach((choice, index) => {
            const choiceDiv = document.createElement('div');
            choiceDiv.className = 'event-choice';
            
            // 要件チェック
            const meetsRequirements = this.game.systems.event.checkChoiceRequirements(choice.requirements);
            if (!meetsRequirements) {
                choiceDiv.className += ' disabled';
            }
            
            // 選択肢テキスト
            const choiceText = document.createElement('div');
            choiceText.style.cssText = `
                font-weight: bold;
                color: ${meetsRequirements ? '#ffffff' : '#888888'};
                margin-bottom: 5px;
            `;
            choiceText.textContent = choice.text;
            choiceDiv.appendChild(choiceText);
            
            // 要件表示
            if (choice.requirements && Object.keys(choice.requirements).length > 0) {
                const reqDiv = document.createElement('div');
                reqDiv.style.cssText = `
                    font-size: 12px;
                    color: ${meetsRequirements ? '#88ff88' : '#ff8888'};
                `;
                
                const reqTexts = [];
                for (const [req, value] of Object.entries(choice.requirements)) {
                    if (req === 'hasDefense') {
                        reqTexts.push('防衛施設が必要');
                    } else if (req === 'hasEnergyPlant') {
                        reqTexts.push('発電所が必要');
                    } else if (req === 'hasCommTower') {
                        reqTexts.push('通信塔が必要');
                    } else {
                        reqTexts.push(`${req}: ${value}`);
                    }
                }
                
                reqDiv.textContent = '要件: ' + reqTexts.join(', ');
                choiceDiv.appendChild(reqDiv);
            }
            
            // 成功確率のヒント（オプション）
            const outcomeHint = this.getOutcomeHint(choice.outcomes);
            if (outcomeHint) {
                const hintDiv = document.createElement('div');
                hintDiv.style.cssText = `
                    font-size: 11px;
                    color: #aaaaaa;
                    margin-top: 5px;
                    font-style: italic;
                `;
                hintDiv.textContent = outcomeHint;
                choiceDiv.appendChild(hintDiv);
            }
            
            // クリックイベント
            if (meetsRequirements) {
                choiceDiv.onclick = () => this.selectChoice(index);
            }
            
            this.choicesContainer.appendChild(choiceDiv);
        });
        
        // 表示
        this.container.style.display = 'block';
        
        // 効果音
        if (this.game.systems.sound) {
            this.game.systems.sound.playSound('event_appear');
        }
    }
    
    getOutcomeHint(outcomes) {
        // 結果のヒントを生成（プレイヤーへの情報提供）
        let successRate = 0;
        let hasNegative = false;
        
        for (const outcome of outcomes) {
            if (outcome.type === 'success') {
                successRate += outcome.probability;
            } else if (outcome.type === 'error') {
                hasNegative = true;
            }
        }
        
        if (successRate >= 0.8) {
            return '成功率: 高い';
        } else if (successRate >= 0.5) {
            return '成功率: 中程度';
        } else if (hasNegative) {
            return 'リスク: あり';
        }
        
        return null;
    }
    
    selectChoice(choiceIndex) {
        if (!this.currentEvent) return;
        
        // 選択を処理
        this.game.systems.event.handleChoice(choiceIndex);
        
        // エフェクト
        this.showSelectionEffect(choiceIndex);
    }
    
    showSelectionEffect(choiceIndex) {
        // 選択エフェクト
        const choices = this.choicesContainer.querySelectorAll('.event-choice');
        const selectedChoice = choices[choiceIndex];
        
        if (selectedChoice) {
            selectedChoice.style.background = 'rgba(255, 255, 255, 0.3)';
            selectedChoice.style.borderColor = '#00ff00';
            
            setTimeout(() => {
                this.hide();
            }, 500);
        }
    }
    
    hide() {
        this.isVisible = false;
        this.container.style.display = 'none';
        this.currentEvent = null;
    }
    
    // 緊急イベント用の特別な表示
    showUrgentEvent(eventData) {
        this.showEvent(eventData);
        
        // 追加の視覚効果
        this.container.style.border = '3px solid #ff0000';
        this.container.style.animation = 'eventPulse 0.5s infinite, shake 0.5s';
        
        // 震えるアニメーション追加
        const shakeStyle = document.createElement('style');
        shakeStyle.textContent = `
            @keyframes shake {
                0%, 100% { transform: translate(-50%, -50%) rotate(0deg); }
                25% { transform: translate(-48%, -50%) rotate(-1deg); }
                75% { transform: translate(-52%, -50%) rotate(1deg); }
            }
        `;
        document.head.appendChild(shakeStyle);
    }
}