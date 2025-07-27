// アドベンチャーパートUI システム

export class AdventureUI {
    constructor(game) {
        this.game = game;
        this.isActive = false;
        this.currentScene = null;
        this.currentBackground = null;
        this.currentCharacters = new Map();
        this.dialogueBox = null;
        this.nameplate = null;
        this.choiceButtons = [];
        
        // フェード用
        this.fadeOverlay = null;
        this.isFading = false;
        
        // オートモード
        this.autoMode = false;
        this.autoModeDelay = 3000; // 3秒
        
        // スキップモード
        this.skipMode = false;
        
        // 履歴
        this.dialogueHistory = [];
        
        this.createUI();
        this.loadAssets();
    }
    
    createUI() {
        // メインコンテナ
        this.container = document.createElement('div');
        this.container.id = 'adventure-ui';
        this.container.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            display: none;
            z-index: 5000;
            overflow: hidden;
        `;
        
        // 背景レイヤー
        this.backgroundLayer = document.createElement('div');
        this.backgroundLayer.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-size: cover;
            background-position: center;
            background-repeat: no-repeat;
            background-color: #000;
        `;
        
        // キャラクターレイヤー
        this.characterLayer = document.createElement('div');
        this.characterLayer.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
        `;
        
        // 会話ボックス
        this.dialogueBox = document.createElement('div');
        this.dialogueBox.style.cssText = `
            position: absolute;
            bottom: 20px;
            left: 50%;
            transform: translateX(-50%);
            width: 90%;
            max-width: 1200px;
            height: 200px;
            background: linear-gradient(to bottom, rgba(0, 0, 0, 0.8), rgba(0, 20, 40, 0.9));
            border: 2px solid #00ffff;
            border-radius: 10px;
            padding: 20px;
            display: none;
            box-shadow: 0 0 20px rgba(0, 255, 255, 0.5);
        `;
        
        // 名前表示
        this.nameplate = document.createElement('div');
        this.nameplate.style.cssText = `
            position: absolute;
            top: -30px;
            left: 20px;
            background: linear-gradient(to right, rgba(0, 100, 200, 0.9), rgba(0, 50, 100, 0.9));
            padding: 5px 20px;
            border: 2px solid #00ffff;
            border-radius: 20px;
            color: white;
            font-size: 18px;
            font-weight: bold;
            display: none;
        `;
        
        // 会話テキスト
        this.dialogueText = document.createElement('div');
        this.dialogueText.style.cssText = `
            color: white;
            font-size: 20px;
            line-height: 1.6;
            text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.8);
            white-space: pre-wrap;
        `;
        
        // 続行インジケーター
        this.continueIndicator = document.createElement('div');
        this.continueIndicator.style.cssText = `
            position: absolute;
            bottom: 10px;
            right: 20px;
            width: 0;
            height: 0;
            border-left: 10px solid transparent;
            border-right: 10px solid transparent;
            border-top: 15px solid #00ffff;
            animation: bounce 1s infinite;
            display: none;
        `;
        
        // 選択肢コンテナ
        this.choiceContainer = document.createElement('div');
        this.choiceContainer.style.cssText = `
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            display: none;
            flex-direction: column;
            gap: 20px;
        `;
        
        // フェードオーバーレイ
        this.fadeOverlay = document.createElement('div');
        this.fadeOverlay.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: black;
            opacity: 0;
            pointer-events: none;
            transition: opacity 0.5s;
        `;
        
        // UIコントロール
        this.uiControls = document.createElement('div');
        this.uiControls.style.cssText = `
            position: absolute;
            bottom: 10px;
            right: 10px;
            display: flex;
            gap: 10px;
        `;
        
        this.createControlButtons();
        
        // 組み立て
        this.dialogueBox.appendChild(this.nameplate);
        this.dialogueBox.appendChild(this.dialogueText);
        this.dialogueBox.appendChild(this.continueIndicator);
        
        this.container.appendChild(this.backgroundLayer);
        this.container.appendChild(this.characterLayer);
        this.container.appendChild(this.dialogueBox);
        this.container.appendChild(this.choiceContainer);
        this.container.appendChild(this.fadeOverlay);
        this.container.appendChild(this.uiControls);
        
        document.body.appendChild(this.container);
        
        // スタイル追加
        this.addStyles();
        
        // イベントリスナー
        this.setupEventListeners();
    }
    
    createControlButtons() {
        // オートボタン
        const autoButton = this.createButton('AUTO', () => {
            this.autoMode = !this.autoMode;
            autoButton.style.background = this.autoMode ? '#00ffff' : 'rgba(0, 100, 200, 0.8)';
            autoButton.style.color = this.autoMode ? '#000' : '#fff';
        });
        
        // スキップボタン
        const skipButton = this.createButton('SKIP', () => {
            this.skipMode = !this.skipMode;
            skipButton.style.background = this.skipMode ? '#ff6600' : 'rgba(0, 100, 200, 0.8)';
        });
        
        // ログボタン
        const logButton = this.createButton('LOG', () => {
            this.showDialogueHistory();
        });
        
        // 閉じるボタン
        const closeButton = this.createButton('×', () => {
            this.hide();
        });
        closeButton.style.background = 'rgba(200, 0, 0, 0.8)';
        
        this.uiControls.appendChild(autoButton);
        this.uiControls.appendChild(skipButton);
        this.uiControls.appendChild(logButton);
        this.uiControls.appendChild(closeButton);
    }
    
    createButton(text, onClick) {
        const button = document.createElement('button');
        button.textContent = text;
        button.style.cssText = `
            padding: 10px 20px;
            background: rgba(0, 100, 200, 0.8);
            border: 1px solid #00ffff;
            color: white;
            border-radius: 5px;
            cursor: pointer;
            font-size: 14px;
            transition: all 0.3s;
        `;
        button.onclick = onClick;
        button.onmouseover = () => {
            button.style.transform = 'scale(1.1)';
        };
        button.onmouseout = () => {
            button.style.transform = 'scale(1)';
        };
        return button;
    }
    
    addStyles() {
        if (!document.querySelector('#adventure-ui-styles')) {
            const style = document.createElement('style');
            style.id = 'adventure-ui-styles';
            style.textContent = `
                @keyframes bounce {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-5px); }
                }
                
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                
                @keyframes characterSlideIn {
                    from { opacity: 0; transform: translateX(-50px); }
                    to { opacity: 1; transform: translateX(0); }
                }
                
                .adventure-character {
                    position: absolute;
                    bottom: 0;
                    transition: all 0.3s ease-out;
                    animation: characterSlideIn 0.5s ease-out;
                }
                
                .adventure-choice {
                    padding: 15px 40px;
                    background: linear-gradient(to right, rgba(0, 50, 100, 0.9), rgba(0, 100, 200, 0.9));
                    border: 2px solid #00ffff;
                    color: white;
                    font-size: 18px;
                    border-radius: 30px;
                    cursor: pointer;
                    transition: all 0.3s;
                    min-width: 400px;
                    text-align: center;
                }
                
                .adventure-choice:hover {
                    background: linear-gradient(to right, rgba(0, 100, 200, 0.9), rgba(0, 150, 255, 0.9));
                    transform: scale(1.05);
                    box-shadow: 0 0 20px rgba(0, 255, 255, 0.8);
                }
                
                .dialogue-history {
                    position: absolute;
                    top: 50px;
                    left: 50%;
                    transform: translateX(-50%);
                    width: 80%;
                    max-width: 800px;
                    height: 70%;
                    background: rgba(0, 0, 0, 0.95);
                    border: 2px solid #00ffff;
                    border-radius: 10px;
                    padding: 20px;
                    overflow-y: auto;
                    display: none;
                }
                
                .dialogue-history-entry {
                    margin-bottom: 20px;
                    padding-bottom: 20px;
                    border-bottom: 1px solid rgba(0, 255, 255, 0.3);
                }
                
                .dialogue-history-name {
                    color: #00ffff;
                    font-weight: bold;
                    margin-bottom: 5px;
                }
                
                .dialogue-history-text {
                    color: white;
                    line-height: 1.6;
                }
            `;
            document.head.appendChild(style);
        }
    }
    
    setupEventListeners() {
        // クリックで次へ
        this.container.addEventListener('click', (e) => {
            if (e.target === this.container || e.target === this.backgroundLayer || e.target === this.dialogueBox) {
                this.nextDialogue();
            }
        });
        
        // キーボード操作
        document.addEventListener('keydown', (e) => {
            if (!this.isActive) return;
            
            switch(e.key) {
                case ' ':
                case 'Enter':
                    this.nextDialogue();
                    break;
                case 'Escape':
                    this.hide();
                    break;
                case 'Control':
                    this.skipMode = true;
                    break;
            }
        });
        
        document.addEventListener('keyup', (e) => {
            if (e.key === 'Control') {
                this.skipMode = false;
            }
        });
    }
    
    loadAssets() {
        // プレースホルダー画像の生成
        this.placeholderImages = {
            background: this.createPlaceholderBackground(),
            character: this.createPlaceholderCharacter()
        };
    }
    
    createPlaceholderBackground() {
        const canvas = document.createElement('canvas');
        canvas.width = 1920;
        canvas.height = 1080;
        const ctx = canvas.getContext('2d');
        
        // デフォルト背景
        const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
        gradient.addColorStop(0, '#001a33');
        gradient.addColorStop(1, '#000511');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        const defaultBg = canvas.toDataURL();
        
        // シーン別の背景を生成
        this.backgrounds = {
            'bg_commander_office': this.createCommanderOffice(ctx, canvas),
            'bg_hangar': this.createHangar(ctx, canvas),
            'bg_mars_surface': this.createMarsSurface(ctx, canvas),
            'bg_space_station': this.createSpaceStation(ctx, canvas)
        };
        
        return defaultBg;
    }
    
    createCommanderOffice(ctx, canvas) {
        // 総統室の背景
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // 暗めの部屋
        const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
        gradient.addColorStop(0, '#1a1a2e');
        gradient.addColorStop(1, '#0a0a15');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // 窓（宇宙が見える）
        ctx.fillStyle = '#000511';
        ctx.fillRect(100, 100, 600, 400);
        
        // 星
        ctx.fillStyle = '#ffffff';
        for (let i = 0; i < 50; i++) {
            const x = 100 + Math.random() * 600;
            const y = 100 + Math.random() * 400;
            const size = Math.random() * 2;
            ctx.beginPath();
            ctx.arc(x, y, size, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // 地球（窓から見える）
        const earthGradient = ctx.createRadialGradient(400, 300, 0, 400, 300, 80);
        earthGradient.addColorStop(0, '#4444ff');
        earthGradient.addColorStop(0.7, '#2222aa');
        earthGradient.addColorStop(1, '#000066');
        ctx.fillStyle = earthGradient;
        ctx.beginPath();
        ctx.arc(400, 300, 80, 0, Math.PI * 2);
        ctx.fill();
        
        // デスク
        ctx.fillStyle = '#2a2a3a';
        ctx.fillRect(0, canvas.height - 300, canvas.width, 300);
        
        // モニター
        ctx.fillStyle = '#000000';
        ctx.fillRect(canvas.width - 400, canvas.height - 500, 300, 200);
        ctx.strokeStyle = '#00ffff';
        ctx.lineWidth = 2;
        ctx.strokeRect(canvas.width - 400, canvas.height - 500, 300, 200);
        
        // 警告表示
        ctx.fillStyle = '#ff0000';
        ctx.font = 'bold 30px monospace';
        ctx.fillText('ALERT', canvas.width - 350, canvas.height - 400);
        
        return canvas.toDataURL();
    }
    
    createHangar(ctx, canvas) {
        // 格納庫の背景
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // 金属的な床
        const floorGradient = ctx.createLinearGradient(0, canvas.height - 200, 0, canvas.height);
        floorGradient.addColorStop(0, '#333344');
        floorGradient.addColorStop(1, '#111122');
        ctx.fillStyle = floorGradient;
        ctx.fillRect(0, canvas.height - 200, canvas.width, 200);
        
        // 天井
        ctx.fillStyle = '#1a1a2a';
        ctx.fillRect(0, 0, canvas.width, 300);
        
        // 支柱
        for (let i = 200; i < canvas.width; i += 400) {
            ctx.fillStyle = '#444455';
            ctx.fillRect(i, 0, 50, canvas.height);
        }
        
        // 機体シルエット
        ctx.fillStyle = '#000000';
        ctx.beginPath();
        ctx.moveTo(300, 600);
        ctx.lineTo(350, 500);
        ctx.lineTo(450, 480);
        ctx.lineTo(550, 500);
        ctx.lineTo(600, 600);
        ctx.closePath();
        ctx.fill();
        
        // ライト
        for (let i = 100; i < canvas.width; i += 200) {
            const lightGradient = ctx.createRadialGradient(i, 100, 0, i, 100, 100);
            lightGradient.addColorStop(0, 'rgba(255, 255, 200, 0.5)');
            lightGradient.addColorStop(1, 'rgba(255, 255, 200, 0)');
            ctx.fillStyle = lightGradient;
            ctx.fillRect(i - 100, 0, 200, 200);
        }
        
        return canvas.toDataURL();
    }
    
    createMarsSurface(ctx, canvas) {
        // 火星の表面
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // 赤い空
        const skyGradient = ctx.createLinearGradient(0, 0, 0, canvas.height / 2);
        skyGradient.addColorStop(0, '#552222');
        skyGradient.addColorStop(1, '#aa4444');
        ctx.fillStyle = skyGradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height / 2);
        
        // 火星の地表
        ctx.fillStyle = '#cc6644';
        ctx.fillRect(0, canvas.height / 2, canvas.width, canvas.height / 2);
        
        // 岩
        for (let i = 0; i < 10; i++) {
            const x = Math.random() * canvas.width;
            const y = canvas.height / 2 + Math.random() * (canvas.height / 2);
            const size = 50 + Math.random() * 100;
            ctx.fillStyle = '#aa4422';
            ctx.beginPath();
            ctx.ellipse(x, y, size, size / 2, 0, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // 破壊されたコロニーのシルエット
        ctx.fillStyle = '#331111';
        ctx.fillRect(200, 400, 300, 200);
        ctx.fillRect(250, 350, 50, 50);
        ctx.fillRect(400, 350, 50, 80);
        
        // 煙
        for (let i = 0; i < 5; i++) {
            const smokeGradient = ctx.createRadialGradient(
                250 + i * 40, 400 - i * 30, 0,
                250 + i * 40, 400 - i * 30, 50
            );
            smokeGradient.addColorStop(0, 'rgba(100, 100, 100, 0.3)');
            smokeGradient.addColorStop(1, 'rgba(100, 100, 100, 0)');
            ctx.fillStyle = smokeGradient;
            ctx.beginPath();
            ctx.arc(250 + i * 40, 400 - i * 30, 50, 0, Math.PI * 2);
            ctx.fill();
        }
        
        return canvas.toDataURL();
    }
    
    createSpaceStation(ctx, canvas) {
        // 宇宙ステーション内部
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // 背景（宇宙）
        ctx.fillStyle = '#000511';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // 星
        ctx.fillStyle = '#ffffff';
        for (let i = 0; i < 100; i++) {
            const x = Math.random() * canvas.width;
            const y = Math.random() * canvas.height;
            const size = Math.random() * 2;
            ctx.beginPath();
            ctx.arc(x, y, size, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // ステーションの窓枠
        ctx.strokeStyle = '#666677';
        ctx.lineWidth = 20;
        ctx.strokeRect(50, 50, canvas.width - 100, canvas.height - 100);
        
        // 内部の床
        const floorGradient = ctx.createLinearGradient(0, canvas.height - 150, 0, canvas.height);
        floorGradient.addColorStop(0, 'rgba(100, 100, 120, 0.8)');
        floorGradient.addColorStop(1, 'rgba(50, 50, 60, 0.8)');
        ctx.fillStyle = floorGradient;
        ctx.fillRect(0, canvas.height - 150, canvas.width, 150);
        
        return canvas.toDataURL();
    }
    
    createPlaceholderCharacter() {
        // キャラクター別のスプライトを生成
        this.characterSprites = {
            'commander': this.createCommanderSprites(),
            'luna': this.createLunaSprites(),
            'mechanic': this.createMechanicSprites()
        };
        
        // デフォルトシルエット
        const canvas = document.createElement('canvas');
        canvas.width = 800;
        canvas.height = 1200;
        const ctx = canvas.getContext('2d');
        
        ctx.fillStyle = 'rgba(0, 255, 255, 0.3)';
        ctx.beginPath();
        ctx.ellipse(400, 200, 150, 180, 0, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = 'rgba(0, 255, 255, 0.4)';
        ctx.fillRect(250, 380, 300, 600);
        
        return canvas.toDataURL();
    }
    
    createCommanderSprites() {
        const sprites = {};
        
        // 通常
        sprites.normal = this.drawCommander('#444466', '#666688', 'neutral');
        // 緊急
        sprites.urgent = this.drawCommander('#554444', '#776666', 'serious');
        // 真剣
        sprites.serious = this.drawCommander('#444455', '#666677', 'serious');
        // 悲しみ
        sprites.sad = this.drawCommander('#334455', '#556677', 'sad');
        // 誇らしげ
        sprites.proud = this.drawCommander('#445566', '#667788', 'proud');
        
        return sprites;
    }
    
    drawCommander(uniformColor, faceColor, expression) {
        const canvas = document.createElement('canvas');
        canvas.width = 800;
        canvas.height = 1200;
        const ctx = canvas.getContext('2d');
        
        // 体（軍服）
        ctx.fillStyle = uniformColor;
        ctx.fillRect(200, 400, 400, 700);
        
        // 肩章
        ctx.fillStyle = '#ffcc00';
        ctx.fillRect(200, 400, 80, 30);
        ctx.fillRect(520, 400, 80, 30);
        
        // 頭
        ctx.fillStyle = faceColor;
        ctx.beginPath();
        ctx.ellipse(400, 250, 120, 150, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // 帽子
        ctx.fillStyle = uniformColor;
        ctx.fillRect(280, 100, 240, 100);
        ctx.fillStyle = '#ffcc00';
        ctx.fillRect(280, 180, 240, 10);
        
        // 表情
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 3;
        
        // 目
        ctx.fillStyle = '#000000';
        ctx.fillRect(350, 240, 20, 5);
        ctx.fillRect(430, 240, 20, 5);
        
        // 口
        ctx.beginPath();
        if (expression === 'serious' || expression === 'urgent') {
            ctx.moveTo(370, 300);
            ctx.lineTo(430, 300);
        } else if (expression === 'sad') {
            ctx.arc(400, 320, 30, 0, Math.PI, true);
        } else if (expression === 'proud') {
            ctx.arc(400, 280, 30, 0, Math.PI, false);
        } else {
            ctx.moveTo(370, 290);
            ctx.lineTo(430, 290);
        }
        ctx.stroke();
        
        // 髭
        ctx.fillStyle = '#888888';
        ctx.fillRect(350, 270, 100, 20);
        
        return canvas.toDataURL();
    }
    
    createLunaSprites() {
        const sprites = {};
        
        // 各表情
        sprites.normal = this.drawLuna('#ffddcc', '#4488ff', 'normal');
        sprites.happy = this.drawLuna('#ffddcc', '#4488ff', 'happy');
        sprites.nervous = this.drawLuna('#ffddcc', '#4488ff', 'nervous');
        sprites.surprised = this.drawLuna('#ffddcc', '#4488ff', 'surprised');
        sprites.urgent = this.drawLuna('#ffddcc', '#4488ff', 'urgent');
        sprites.shy = this.drawLuna('#ffddcc', '#4488ff', 'shy');
        sprites.focused = this.drawLuna('#ffddcc', '#4488ff', 'focused');
        sprites.shout = this.drawLuna('#ffddcc', '#4488ff', 'shout');
        sprites.comm = this.drawLuna('#ffddcc', '#4488ff', 'normal', true);
        
        return sprites;
    }
    
    drawLuna(skinColor, hairColor, expression, isComm = false) {
        const canvas = document.createElement('canvas');
        canvas.width = 800;
        canvas.height = 1200;
        const ctx = canvas.getContext('2d');
        
        if (isComm) {
            // 通信画面風の枠
            ctx.strokeStyle = '#00ffff';
            ctx.lineWidth = 5;
            ctx.strokeRect(100, 100, 600, 800);
            ctx.fillStyle = 'rgba(0, 100, 200, 0.1)';
            ctx.fillRect(100, 100, 600, 800);
        }
        
        // 体（制服）
        ctx.fillStyle = '#2266aa';
        ctx.fillRect(200, 500, 400, 600);
        
        // 襟
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.moveTo(300, 500);
        ctx.lineTo(400, 550);
        ctx.lineTo(500, 500);
        ctx.closePath();
        ctx.fill();
        
        // 頭
        ctx.fillStyle = skinColor;
        ctx.beginPath();
        ctx.ellipse(400, 300, 100, 120, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // 髪
        ctx.fillStyle = hairColor;
        // ポニーテール
        ctx.beginPath();
        ctx.ellipse(400, 200, 110, 80, 0, 0, Math.PI);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(500, 250, 60, 100, -0.3, 0, Math.PI * 2);
        ctx.fill();
        
        // 目
        ctx.fillStyle = '#000000';
        if (expression === 'happy' || expression === 'shy') {
            // 笑い目
            ctx.beginPath();
            ctx.arc(360, 290, 15, 0, Math.PI, true);
            ctx.stroke();
            ctx.beginPath();
            ctx.arc(440, 290, 15, 0, Math.PI, true);
            ctx.stroke();
        } else if (expression === 'surprised' || expression === 'shout') {
            // 大きい目
            ctx.beginPath();
            ctx.ellipse(360, 290, 20, 25, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.ellipse(440, 290, 20, 25, 0, 0, Math.PI * 2);
            ctx.fill();
        } else {
            // 通常の目
            ctx.beginPath();
            ctx.ellipse(360, 290, 15, 20, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.ellipse(440, 290, 15, 20, 0, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // 口
        ctx.strokeStyle = '#ff6666';
        ctx.lineWidth = 3;
        ctx.beginPath();
        if (expression === 'happy') {
            ctx.arc(400, 340, 20, 0, Math.PI, false);
        } else if (expression === 'nervous' || expression === 'shy') {
            ctx.moveTo(380, 340);
            ctx.quadraticCurveTo(400, 335, 420, 340);
        } else if (expression === 'surprised' || expression === 'shout') {
            ctx.ellipse(400, 345, 15, 20, 0, 0, Math.PI * 2);
        } else if (expression === 'urgent') {
            ctx.moveTo(380, 345);
            ctx.lineTo(420, 345);
        } else {
            ctx.moveTo(385, 340);
            ctx.lineTo(415, 340);
        }
        ctx.stroke();
        
        // ヘッドセット（オペレーター）
        ctx.strokeStyle = '#666666';
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.arc(400, 300, 130, Math.PI, 0, true);
        ctx.stroke();
        ctx.fillStyle = '#333333';
        ctx.beginPath();
        ctx.arc(280, 300, 20, 0, Math.PI * 2);
        ctx.fill();
        
        return canvas.toDataURL();
    }
    
    createMechanicSprites() {
        const sprites = {};
        
        sprites.normal = this.drawMechanic('#ccaa88', false);
        sprites.proud = this.drawMechanic('#ccaa88', true);
        sprites.urgent = this.drawMechanic('#ccaa88', false, true);
        
        return sprites;
    }
    
    drawMechanic(skinColor, isProud = false, isUrgent = false) {
        const canvas = document.createElement('canvas');
        canvas.width = 800;
        canvas.height = 1200;
        const ctx = canvas.getContext('2d');
        
        // つなぎ
        ctx.fillStyle = '#666633';
        ctx.fillRect(150, 450, 500, 700);
        
        // ポケット
        ctx.fillStyle = '#555522';
        ctx.fillRect(200, 600, 150, 100);
        ctx.fillRect(450, 600, 150, 100);
        
        // 頭
        ctx.fillStyle = skinColor;
        ctx.beginPath();
        ctx.ellipse(400, 280, 120, 140, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // キャップ
        ctx.fillStyle = '#333333';
        ctx.beginPath();
        ctx.ellipse(400, 200, 130, 60, 0, 0, Math.PI);
        ctx.fill();
        ctx.fillRect(270, 200, 260, 20);
        
        // 目
        ctx.fillStyle = '#000000';
        ctx.fillRect(340, 270, 30, 10);
        ctx.fillRect(430, 270, 30, 10);
        
        // 口
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 3;
        ctx.beginPath();
        if (isProud) {
            ctx.arc(400, 320, 30, 0, Math.PI, false);
        } else if (isUrgent) {
            ctx.moveTo(370, 340);
            ctx.lineTo(430, 340);
        } else {
            ctx.moveTo(370, 330);
            ctx.quadraticCurveTo(400, 340, 430, 330);
        }
        ctx.stroke();
        
        // 工具
        ctx.fillStyle = '#888888';
        ctx.fillRect(600, 500, 30, 200);
        ctx.fillStyle = '#ffaa00';
        ctx.fillRect(590, 480, 50, 40);
        
        return canvas.toDataURL();
    }
    
    // シーン制御
    show(sceneData) {
        this.isActive = true;
        this.container.style.display = 'block';
        this.currentScene = sceneData;
        
        // ゲームを一時停止
        if (this.game) {
            this.game.isPaused = true;
        }
        
        // シーンのセットアップ
        if (sceneData.background) {
            this.setBackground(sceneData.background);
        }
        
        if (sceneData.characters) {
            this.setupCharacters(sceneData.characters);
        }
        
        if (sceneData.dialogue) {
            this.startDialogue(sceneData.dialogue);
        }
        
        // フェードイン
        this.fadeIn();
    }
    
    hide() {
        this.fadeOut(() => {
            this.isActive = false;
            this.container.style.display = 'none';
            this.clearScene();
            
            // ゲーム再開
            if (this.game) {
                this.game.isPaused = false;
            }
            
            // コールバック実行
            if (this.currentScene && this.currentScene.onComplete) {
                this.currentScene.onComplete();
            }
        });
    }
    
    setBackground(backgroundId) {
        // プロシージャル生成された背景を使用
        if (this.backgrounds && this.backgrounds[backgroundId]) {
            this.backgroundLayer.style.backgroundImage = `url(${this.backgrounds[backgroundId]})`;
        } else {
            // デフォルト背景
            this.backgroundLayer.style.backgroundImage = `url(${this.placeholderImages.background})`;
        }
    }
    
    setupCharacters(characters) {
        // 既存のキャラクターをクリア
        this.clearCharacters();
        
        characters.forEach((charData, index) => {
            this.addCharacter(charData, index);
        });
    }
    
    addCharacter(charData, position = 0) {
        const charDiv = document.createElement('div');
        charDiv.className = 'adventure-character';
        charDiv.id = `character-${charData.id}`;
        
        // 位置計算
        const positions = ['20%', '50%', '80%'];
        const xPos = positions[position] || '50%';
        
        charDiv.style.cssText = `
            left: ${xPos};
            transform: translateX(-50%);
            height: 80%;
            width: auto;
        `;
        
        const img = document.createElement('img');
        img.style.cssText = `
            height: 100%;
            width: auto;
            filter: drop-shadow(0 0 10px rgba(0, 0, 0, 0.8));
        `;
        
        // まずプレースホルダーを設定
        img.src = this.placeholderImages.character;
        charDiv.appendChild(img);
        
        // プロシージャル生成されたスプライトを使用
        if (this.characterSprites && this.characterSprites[charData.id] && this.characterSprites[charData.id][charData.sprite]) {
            img.src = this.characterSprites[charData.id][charData.sprite];
        }
        
        this.characterLayer.appendChild(charDiv);
        this.currentCharacters.set(charData.id, charDiv);
    }
    
    clearCharacters() {
        this.currentCharacters.forEach(char => char.remove());
        this.currentCharacters.clear();
    }
    
    // 会話システム
    startDialogue(dialogueData) {
        this.currentDialogue = dialogueData;
        this.currentDialogueIndex = 0;
        this.showCurrentDialogue();
    }
    
    // 外部から呼び出されるメソッド
    showDialogue(dialogues, onComplete) {
        if (!dialogues || dialogues.length === 0) {
            console.warn('No dialogues provided to showDialogue');
            if (onComplete) onComplete();
            return;
        }
        
        this.currentDialogue = dialogues;
        this.currentDialogueIndex = 0;
        this.onDialogueCompleteCallback = onComplete;
        this.dialogueBox.style.display = 'block';
        this.showCurrentDialogue();
    }
    
    showCurrentDialogue() {
        if (!this.currentDialogue || this.currentDialogueIndex >= this.currentDialogue.length) {
            this.onDialogueComplete();
            return;
        }
        
        const dialogue = this.currentDialogue[this.currentDialogueIndex];
        
        // キャラクター名表示
        if (dialogue.name || dialogue.speaker) {
            this.nameplate.textContent = dialogue.name || dialogue.speaker;
            this.nameplate.style.display = 'block';
        } else {
            this.nameplate.style.display = 'none';
        }
        
        // テキスト表示（タイプライター効果）
        this.dialogueBox.style.display = 'block';
        this.typewriterEffect(dialogue.text);
        
        // 履歴に追加
        this.dialogueHistory.push({
            speaker: dialogue.name || dialogue.speaker || 'ナレーション',
            text: dialogue.text
        });
        
        // キャラクター表情変更
        if (dialogue.sprite && dialogue.character) {
            this.updateCharacterSprite(dialogue.character, dialogue.sprite);
        }
        
        // 選択肢がある場合
        if (dialogue.choices) {
            this.showChoices(dialogue.choices);
        }
    }
    
    typewriterEffect(text, speed = 30) {
        this.dialogueText.textContent = '';
        this.continueIndicator.style.display = 'none';
        
        let index = 0;
        const interval = setInterval(() => {
            if (index < text.length) {
                this.dialogueText.textContent += text[index];
                index++;
                
                // スキップモード
                if (this.skipMode) {
                    this.dialogueText.textContent = text;
                    clearInterval(interval);
                    this.onTypewriterComplete();
                }
            } else {
                clearInterval(interval);
                this.onTypewriterComplete();
            }
        }, speed);
    }
    
    onTypewriterComplete() {
        this.continueIndicator.style.display = 'block';
        
        // オートモード
        if (this.autoMode) {
            setTimeout(() => {
                if (this.autoMode) {
                    this.nextDialogue();
                }
            }, this.autoModeDelay);
        }
    }
    
    nextDialogue() {
        if (!this.currentDialogue || this.currentDialogueIndex >= this.currentDialogue.length) {
            return;
        }
        
        if (this.currentDialogue[this.currentDialogueIndex].choices) {
            return; // 選択肢がある場合は進まない
        }
        
        this.currentDialogueIndex++;
        this.showCurrentDialogue();
    }
    
    showChoices(choices) {
        this.choiceContainer.innerHTML = '';
        this.choiceContainer.style.display = 'flex';
        
        choices.forEach((choice, index) => {
            const button = document.createElement('button');
            button.className = 'adventure-choice';
            button.textContent = choice.text;
            button.onclick = () => {
                this.selectChoice(choice);
            };
            
            this.choiceContainer.appendChild(button);
        });
    }
    
    selectChoice(choice) {
        this.choiceContainer.style.display = 'none';
        
        // 選択の結果を処理
        if (choice.onSelect) {
            choice.onSelect();
        }
        
        // 次の会話へ
        if (choice.nextDialogue) {
            this.startDialogue(choice.nextDialogue);
        } else {
            this.currentDialogueIndex++;
            this.showCurrentDialogue();
        }
    }
    
    onDialogueComplete() {
        this.dialogueBox.style.display = 'none';
        
        // コールバックがある場合は実行
        if (this.onDialogueCompleteCallback) {
            const callback = this.onDialogueCompleteCallback;
            this.onDialogueCompleteCallback = null;
            callback();
        } else if (this.currentScene && this.currentScene.onDialogueComplete) {
            this.currentScene.onDialogueComplete();
        } else {
            this.hide();
        }
    }
    
    // キャラクタースプライト更新
    updateCharacterSprite(characterId, spriteName) {
        const charDiv = this.currentCharacters.get(characterId);
        if (!charDiv) {
            // キャラクターがまだ表示されていない場合は追加
            const charData = { id: characterId, sprite: spriteName };
            this.addCharacter(charData, this.currentCharacters.size);
            return;
        }
        
        const img = charDiv.querySelector('img');
        if (!img) return;
        
        // プロシージャル生成されたスプライトを使用
        if (this.characterSprites && this.characterSprites[characterId] && this.characterSprites[characterId][spriteName]) {
            img.src = this.characterSprites[characterId][spriteName];
        }
    }
    
    // エフェクト
    fadeIn(duration = 500) {
        this.fadeOverlay.style.opacity = '1';
        setTimeout(() => {
            this.fadeOverlay.style.opacity = '0';
        }, 50);
    }
    
    fadeOut(callback, duration = 500) {
        this.fadeOverlay.style.opacity = '1';
        setTimeout(() => {
            if (callback) callback();
        }, duration);
    }
    
    // 履歴表示
    showDialogueHistory() {
        const historyDiv = document.createElement('div');
        historyDiv.className = 'dialogue-history';
        historyDiv.style.display = 'block';
        
        const closeButton = document.createElement('button');
        closeButton.textContent = '閉じる';
        closeButton.style.cssText = `
            position: absolute;
            top: 10px;
            right: 10px;
            padding: 10px 20px;
            background: rgba(200, 0, 0, 0.8);
            border: 1px solid #ff6666;
            color: white;
            border-radius: 5px;
            cursor: pointer;
        `;
        closeButton.onclick = () => historyDiv.remove();
        
        historyDiv.appendChild(closeButton);
        
        // 履歴エントリー
        this.dialogueHistory.forEach(entry => {
            const entryDiv = document.createElement('div');
            entryDiv.className = 'dialogue-history-entry';
            
            const nameDiv = document.createElement('div');
            nameDiv.className = 'dialogue-history-name';
            nameDiv.textContent = entry.speaker;
            
            const textDiv = document.createElement('div');
            textDiv.className = 'dialogue-history-text';
            textDiv.textContent = entry.text;
            
            entryDiv.appendChild(nameDiv);
            entryDiv.appendChild(textDiv);
            historyDiv.appendChild(entryDiv);
        });
        
        this.container.appendChild(historyDiv);
        historyDiv.scrollTop = historyDiv.scrollHeight;
    }
    
    clearScene() {
        this.clearCharacters();
        this.backgroundLayer.style.backgroundImage = '';
        this.dialogueBox.style.display = 'none';
        this.choiceContainer.style.display = 'none';
        this.currentScene = null;
        this.currentDialogue = null;
    }
}