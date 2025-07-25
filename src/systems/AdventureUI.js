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
        
        // グラデーション背景
        const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
        gradient.addColorStop(0, '#001a33');
        gradient.addColorStop(1, '#000511');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // グリッド
        ctx.strokeStyle = 'rgba(0, 255, 255, 0.1)';
        ctx.lineWidth = 1;
        for (let i = 0; i < canvas.width; i += 100) {
            ctx.beginPath();
            ctx.moveTo(i, 0);
            ctx.lineTo(i, canvas.height);
            ctx.stroke();
        }
        for (let i = 0; i < canvas.height; i += 100) {
            ctx.beginPath();
            ctx.moveTo(0, i);
            ctx.lineTo(canvas.width, i);
            ctx.stroke();
        }
        
        return canvas.toDataURL();
    }
    
    createPlaceholderCharacter() {
        const canvas = document.createElement('canvas');
        canvas.width = 800;
        canvas.height = 1200;
        const ctx = canvas.getContext('2d');
        
        // シルエット
        ctx.fillStyle = 'rgba(0, 255, 255, 0.3)';
        ctx.beginPath();
        ctx.ellipse(400, 200, 150, 180, 0, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = 'rgba(0, 255, 255, 0.4)';
        ctx.fillRect(250, 380, 300, 600);
        
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
        // まずプレースホルダーを設定
        this.backgroundLayer.style.backgroundImage = `url(${this.placeholderImages.background})`;
        
        // 実際の画像を試す
        const imagePath = `${import.meta.env.BASE_URL}assets/adventure/backgrounds/${backgroundId}.jpg`;
        const img = new Image();
        
        img.onload = () => {
            this.backgroundLayer.style.backgroundImage = `url(${imagePath})`;
        };
        
        img.onerror = () => {
            console.warn(`Background image not found: ${backgroundId}`);
            // プレースホルダーは既に設定済み
        };
        
        img.src = imagePath;
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
        
        // 実際の画像を試す
        const imagePath = `${import.meta.env.BASE_URL}assets/adventure/characters/${charData.id}/${charData.sprite}.png`;
        const testImg = new Image();
        
        testImg.onload = () => {
            img.src = imagePath;
        };
        
        testImg.onerror = () => {
            console.warn(`Character sprite not found: ${charData.id}/${charData.sprite}`);
            // プレースホルダーは既に設定済み
        };
        
        testImg.src = imagePath;
        
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
        this.showDialogue();
    }
    
    showDialogue() {
        if (this.currentDialogueIndex >= this.currentDialogue.length) {
            this.onDialogueComplete();
            return;
        }
        
        const dialogue = this.currentDialogue[this.currentDialogueIndex];
        
        // キャラクター名表示
        if (dialogue.speaker) {
            this.nameplate.textContent = dialogue.speaker;
            this.nameplate.style.display = 'block';
        } else {
            this.nameplate.style.display = 'none';
        }
        
        // テキスト表示（タイプライター効果）
        this.dialogueBox.style.display = 'block';
        this.typewriterEffect(dialogue.text);
        
        // 履歴に追加
        this.dialogueHistory.push({
            speaker: dialogue.speaker || 'ナレーション',
            text: dialogue.text
        });
        
        // キャラクター表情変更
        if (dialogue.sprite) {
            this.updateCharacterSprite(dialogue.characterId, dialogue.sprite);
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
        if (this.currentDialogue[this.currentDialogueIndex].choices) {
            return; // 選択肢がある場合は進まない
        }
        
        this.currentDialogueIndex++;
        this.showDialogue();
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
            this.showDialogue();
        }
    }
    
    onDialogueComplete() {
        this.dialogueBox.style.display = 'none';
        
        // シーン完了処理
        if (this.currentScene.onDialogueComplete) {
            this.currentScene.onDialogueComplete();
        } else {
            this.hide();
        }
    }
    
    // キャラクタースプライト更新
    updateCharacterSprite(characterId, spriteName) {
        const charDiv = this.currentCharacters.get(characterId);
        if (!charDiv) return;
        
        const img = charDiv.querySelector('img');
        if (!img) return;
        
        const imagePath = `${import.meta.env.BASE_URL}assets/adventure/characters/${characterId}/${spriteName}.png`;
        img.src = imagePath;
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