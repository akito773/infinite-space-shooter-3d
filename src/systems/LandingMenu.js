import { DialogueSystem } from './DialogueSystem.js';

export class LandingMenu {
    constructor(game) {
        this.game = game;
        this.isOpen = false;
        this.currentLocation = null;
        this.selectedIndex = 0;
        this.dialogueSystem = new DialogueSystem(game);
        
        this.createUI();
        this.setupEventListeners();
    }
    
    createUI() {
        // メニューコンテナ
        this.menuContainer = document.createElement('div');
        this.menuContainer.id = 'landing-menu';
        this.menuContainer.style.cssText = `
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(0, 0, 20, 0.95);
            border: 2px solid rgba(0, 255, 255, 0.5);
            border-radius: 10px;
            padding: 20px;
            min-width: 400px;
            display: none;
            z-index: 2000;
            font-family: Arial, sans-serif;
        `;
        
        // タイトル
        this.titleElement = document.createElement('h2');
        this.titleElement.style.cssText = `
            color: #00ffff;
            text-align: center;
            margin: 0 0 20px 0;
            font-size: 24px;
            text-shadow: 0 0 10px rgba(0, 255, 255, 0.5);
        `;
        
        // 説明文
        this.descriptionElement = document.createElement('p');
        this.descriptionElement.style.cssText = `
            color: #ffffff;
            text-align: center;
            margin: 0 0 20px 0;
            font-size: 14px;
            line-height: 1.5;
        `;
        
        // オプションリスト
        this.optionsContainer = document.createElement('div');
        this.optionsContainer.style.cssText = `
            display: flex;
            flex-direction: column;
            gap: 10px;
        `;
        
        // 操作説明
        this.controlsInfo = document.createElement('div');
        this.controlsInfo.style.cssText = `
            margin-top: 20px;
            padding-top: 20px;
            border-top: 1px solid rgba(255, 255, 255, 0.2);
            color: #888888;
            text-align: center;
            font-size: 12px;
        `;
        this.controlsInfo.textContent = '↑↓: 選択 | Enter: 決定 | ESC: 閉じる';
        
        // 要素を組み立て
        this.menuContainer.appendChild(this.titleElement);
        this.menuContainer.appendChild(this.descriptionElement);
        this.menuContainer.appendChild(this.optionsContainer);
        this.menuContainer.appendChild(this.controlsInfo);
        document.body.appendChild(this.menuContainer);
    }
    
    setupEventListeners() {
        document.addEventListener('keydown', (e) => {
            if (!this.isOpen) return;
            
            switch(e.key) {
                case 'ArrowUp':
                    e.preventDefault();
                    this.selectPrevious();
                    break;
                case 'ArrowDown':
                    e.preventDefault();
                    this.selectNext();
                    break;
                case 'Enter':
                    e.preventDefault();
                    this.confirmSelection();
                    break;
                case 'Escape':
                    e.preventDefault();
                    this.close();
                    break;
            }
        });
    }
    
    open(location) {
        this.currentLocation = location;
        this.selectedIndex = 0;
        this.isOpen = true;
        
        // ゲームを一時停止
        this.game.isPaused = true;
        
        // タイトルと説明を設定
        this.titleElement.textContent = location.name;
        this.descriptionElement.textContent = this.getLocationDescription(location);
        
        // オプションを生成
        this.createOptions(location);
        
        // メニューを表示
        this.menuContainer.style.display = 'block';
        
        // フェードイン効果
        this.menuContainer.style.opacity = '0';
        setTimeout(() => {
            this.menuContainer.style.transition = 'opacity 0.3s';
            this.menuContainer.style.opacity = '1';
        }, 10);
    }
    
    close() {
        this.isOpen = false;
        this.game.isPaused = false;
        
        // フェードアウト
        this.menuContainer.style.opacity = '0';
        setTimeout(() => {
            this.menuContainer.style.display = 'none';
            this.menuContainer.style.transition = '';
        }, 300);
    }
    
    getLocationDescription(location) {
        const descriptions = {
            'spaceStation': '宇宙の交差点。様々な種族が集まる交易の中心地です。',
            'planet': '美しい水の惑星。しかし、ヴォイドの脅威が迫っています。',
            'colony': '人類の最前線。勇敢な開拓者たちが暮らしています。'
        };
        
        return descriptions[location.type] || '未知の場所です。';
    }
    
    createOptions(location) {
        // 既存のオプションをクリア
        this.optionsContainer.innerHTML = '';
        
        const options = this.getLocationOptions(location);
        this.optionElements = [];
        
        options.forEach((option, index) => {
            const optionElement = document.createElement('button');
            optionElement.style.cssText = `
                background: rgba(0, 50, 100, 0.5);
                border: 1px solid rgba(0, 150, 255, 0.5);
                color: white;
                padding: 15px 20px;
                font-size: 16px;
                cursor: pointer;
                transition: all 0.2s;
                text-align: left;
                position: relative;
                overflow: hidden;
            `;
            
            // アイコンとテキスト
            optionElement.innerHTML = `
                <span style="font-size: 20px; margin-right: 10px;">${option.icon}</span>
                <span>${option.text}</span>
                ${option.badge ? `<span style="position: absolute; right: 10px; top: 50%; transform: translateY(-50%); background: #ff6600; padding: 2px 8px; border-radius: 10px; font-size: 12px;">${option.badge}</span>` : ''}
            `;
            
            optionElement.addEventListener('mouseenter', () => {
                this.selectedIndex = index;
                this.updateSelection();
            });
            
            optionElement.addEventListener('click', () => {
                this.confirmSelection();
            });
            
            this.optionsContainer.appendChild(optionElement);
            this.optionElements.push(optionElement);
        });
        
        this.options = options;
        this.updateSelection();
    }
    
    getLocationOptions(location) {
        const baseOptions = {
            spaceStation: [
                { text: 'ショップを見る', action: 'shop', icon: '🛒' },
                { text: '酒場で情報収集', action: 'tavern', icon: '🍺' },
                { text: '機体を修理', action: 'repair', icon: '🔧' },
                { text: 'ミッション確認', action: 'missions', icon: '📋', badge: 'NEW' },
                { text: '出発する', action: 'leave', icon: '🚀' }
            ],
            planet: [
                { text: '総督と会う', action: 'governor', icon: '👤' },
                { text: '街を探索', action: 'explore', icon: '🏃' },
                { text: '研究所を訪問', action: 'lab', icon: '🔬' },
                { text: '惑星開発', action: 'develop', icon: '🏗️', badge: '開発中' },
                { text: 'クエスト確認', action: 'quests', icon: '❗', badge: '3' },
                { text: '出発する', action: 'leave', icon: '🚀' }
            ],
            colony: [
                { text: '避難民と話す', action: 'refugees', icon: '👥' },
                { text: '防衛準備', action: 'defense', icon: '🛡️' },
                { text: '物資を寄付', action: 'donate', icon: '📦' },
                { text: '出発する', action: 'leave', icon: '🚀' }
            ]
        };
        
        return baseOptions[location.type] || baseOptions.spaceStation;
    }
    
    selectPrevious() {
        this.selectedIndex = Math.max(0, this.selectedIndex - 1);
        this.updateSelection();
        if (this.game.soundManager) {
            this.game.soundManager.play('collect');
        }
    }
    
    selectNext() {
        this.selectedIndex = Math.min(this.options.length - 1, this.selectedIndex + 1);
        this.updateSelection();
        if (this.game.soundManager) {
            this.game.soundManager.play('collect');
        }
    }
    
    updateSelection() {
        this.optionElements.forEach((element, index) => {
            if (index === this.selectedIndex) {
                element.style.background = 'rgba(0, 100, 200, 0.8)';
                element.style.borderColor = 'rgba(0, 255, 255, 1)';
                element.style.transform = 'translateX(10px)';
                element.style.boxShadow = '0 0 20px rgba(0, 255, 255, 0.5)';
            } else {
                element.style.background = 'rgba(0, 50, 100, 0.5)';
                element.style.borderColor = 'rgba(0, 150, 255, 0.5)';
                element.style.transform = 'translateX(0)';
                element.style.boxShadow = 'none';
            }
        });
    }
    
    confirmSelection() {
        const selectedOption = this.options[this.selectedIndex];
        
        if (this.game.soundManager) {
            this.game.soundManager.play('powerup');
        }
        
        // アクションを実行
        this.handleAction(selectedOption.action);
    }
    
    handleAction(action) {
        switch(action) {
            case 'leave':
                this.close();
                this.showMessage('離陸しました！');
                break;
                
            case 'shop':
                this.close();
                if (this.game.shopSystem) {
                    this.game.shopSystem.open(true);  // 着陸メニューから開いたことを伝える
                }
                break;
                
            case 'tavern':
                this.close();
                // ルナとまだ出会っていない場合は出会いイベント
                if (this.game.storySystem && !this.game.storySystem.storyFlags.hasMetLuna) {
                    // ルナとの出会いイベントをトリガー
                    if (this.game.storyEventTrigger) {
                        this.game.storyEventTrigger.forceEvent('earth_first_landing');
                    } else if (this.game.triggerTavernMeeting) {
                        this.game.triggerTavernMeeting();
                    }
                } else {
                    // すでに出会っている場合は通常の酒場会話
                    this.dialogueSystem.startDialogue('merchant', 'first', '酒場');
                }
                break;
                
            case 'lab':
                this.close();
                this.dialogueSystem.startDialogue('scientist');
                break;
                
            case 'refugees':
                this.close();
                this.dialogueSystem.startDialogue('refugee');
                break;
                
            case 'repair':
                if (this.game.player.health < this.game.player.maxHealth) {
                    this.game.player.health = this.game.player.maxHealth;
                    this.game.updateHealth(this.game.player.health, this.game.player.maxHealth);
                    this.showMessage('機体を完全に修理しました！');
                } else {
                    this.showMessage('機体は既に万全の状態です。');
                }
                break;
                
            case 'governor':
                this.close();
                this.dialogueSystem.startDialogue('governor');
                break;
                
            case 'explore':
                this.showMessage('街の探索機能は開発中です...');
                break;
                
            case 'missions':
                this.showMessage('ミッション機能は実装予定です');
                break;
                
            case 'quests':
                this.showMessage('クエスト機能は実装予定です');
                break;
                
            case 'defense':
                this.showMessage('防衛準備機能は実装予定です');
                break;
                
            case 'donate':
                this.showMessage('寄付機能は実装予定です');
                break;
                
            case 'develop':
                this.close();
                this.showDevelopmentPreview();
                break;
                
            default:
                this.showMessage(`${action}機能は準備中です...`);
        }
    }
    
    showMessage(text) {
        const message = document.createElement('div');
        message.style.cssText = `
            position: absolute;
            bottom: 100px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 15px 30px;
            border-radius: 5px;
            font-size: 16px;
            z-index: 3000;
            animation: messageSlide 2s ease-out;
        `;
        message.textContent = text;
        
        // アニメーションスタイルを追加
        if (!document.querySelector('#message-animation-style')) {
            const style = document.createElement('style');
            style.id = 'message-animation-style';
            style.textContent = `
                @keyframes messageSlide {
                    0% {
                        opacity: 0;
                        transform: translateX(-50%) translateY(20px);
                    }
                    20% {
                        opacity: 1;
                        transform: translateX(-50%) translateY(0);
                    }
                    80% {
                        opacity: 1;
                        transform: translateX(-50%) translateY(0);
                    }
                    100% {
                        opacity: 0;
                        transform: translateX(-50%) translateY(-20px);
                    }
                }
            `;
            document.head.appendChild(style);
        }
        
        document.body.appendChild(message);
        
        setTimeout(() => {
            message.remove();
        }, 2000);
    }
    
    showDevelopmentPreview() {
        // 惑星開発プレビュー画面
        const preview = document.createElement('div');
        preview.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.95);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 5000;
        `;
        
        const content = document.createElement('div');
        content.style.cssText = `
            background: linear-gradient(135deg, rgba(0, 20, 40, 0.98), rgba(0, 40, 80, 0.98));
            border: 2px solid rgba(0, 200, 255, 0.8);
            border-radius: 20px;
            padding: 40px;
            max-width: 600px;
            text-align: center;
            box-shadow: 0 0 50px rgba(0, 200, 255, 0.5);
        `;
        
        content.innerHTML = `
            <h1 style="color: #00ffff; margin-bottom: 30px; font-size: 32px;">
                🏗️ 惑星開発システム
            </h1>
            <div style="color: white; font-size: 18px; line-height: 1.8; margin-bottom: 30px;">
                <p>この機能は現在開発中です！</p>
                <p style="color: #ffaa00; margin: 20px 0;">
                    Coming Soon...
                </p>
                <div style="text-align: left; background: rgba(0, 0, 0, 0.5); padding: 20px; border-radius: 10px; margin: 20px 0;">
                    <h3 style="color: #00ff00; margin-bottom: 15px;">実装予定の機能:</h3>
                    <ul style="list-style: none; padding: 0;">
                        <li>🏭 基地建設 - 施設を建てて資源を自動生産</li>
                        <li>⛏️ 採掘システム - 惑星の資源を採掘</li>
                        <li>🔬 研究開発 - 新技術のアンロック</li>
                        <li>🛡️ 防衛設備 - 基地を守る自動防衛システム</li>
                        <li>🚇 地下探索 - 2.5Dモードで地下を探検</li>
                        <li>💎 レア資源 - 深層で希少な資源を発見</li>
                    </ul>
                </div>
                <p style="font-size: 14px; color: #888;">
                    ※ 別システムとして開発中のため、統合までしばらくお待ちください
                </p>
            </div>
            <button id="close-preview" style="
                padding: 15px 40px;
                font-size: 18px;
                background: linear-gradient(45deg, rgba(0, 100, 200, 0.8), rgba(0, 200, 255, 0.8));
                border: 2px solid white;
                color: white;
                cursor: pointer;
                border-radius: 30px;
                transition: all 0.3s;
            ">閉じる</button>
        `;
        
        preview.appendChild(content);
        document.body.appendChild(preview);
        
        // フェードイン
        preview.style.opacity = '0';
        setTimeout(() => {
            preview.style.transition = 'opacity 0.3s';
            preview.style.opacity = '1';
        }, 10);
        
        // 閉じるボタン
        document.getElementById('close-preview').addEventListener('click', () => {
            preview.style.opacity = '0';
            setTimeout(() => {
                preview.remove();
                // 着陸メニューを再度開く
                this.open(this.currentLocation);
            }, 300);
        });
        
        // ESCキーでも閉じる
        const handleEsc = (e) => {
            if (e.key === 'Escape') {
                document.getElementById('close-preview').click();
                document.removeEventListener('keydown', handleEsc);
            }
        };
        document.addEventListener('keydown', handleEsc);
    }
}