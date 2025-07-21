export class TavernScene {
    constructor(game) {
        this.game = game;
        this.isActive = false;
        this.tavernUI = null;
        this.currentDialogue = 0;
        this.dialogueData = null;
        
        this.createTavernUI();
    }
    
    createTavernUI() {
        // メインコンテナ
        this.tavernUI = document.createElement('div');
        this.tavernUI.id = 'tavern-scene';
        this.tavernUI.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: linear-gradient(45deg, rgba(20, 10, 30, 0.95), rgba(40, 20, 60, 0.95));
            display: none;
            z-index: 2000;
            font-family: 'Arial', sans-serif;
        `;
        
        // 背景画像エリア
        const background = document.createElement('div');
        background.style.cssText = `
            width: 100%;
            height: 60%;
            background: linear-gradient(to bottom, rgba(0,0,0,0.3), rgba(0,0,0,0.7)),
                       url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600"><rect width="800" height="600" fill="%23220033"/><circle cx="200" cy="150" r="30" fill="%23ffaa00" opacity="0.8"/><circle cx="600" cy="200" r="25" fill="%23ff6600" opacity="0.7"/><rect x="100" y="400" width="600" height="200" rx="10" fill="%23330044"/><rect x="300" y="300" width="200" height="100" rx="5" fill="%23440055"/></svg>');
            background-size: cover;
            background-position: center;
            position: relative;
        `;
        
        // タイトル
        const title = document.createElement('div');
        title.style.cssText = `
            position: absolute;
            top: 30px;
            left: 50%;
            transform: translateX(-50%);
            font-size: 28px;
            color: #ffaa00;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.8);
            font-weight: bold;
        `;
        title.textContent = '🍻 流れ星酒場 - Shooting Star Tavern';
        background.appendChild(title);
        
        // キャラクター表示エリア
        const characterArea = document.createElement('div');
        characterArea.style.cssText = `
            position: absolute;
            right: 50px;
            bottom: 50px;
            width: 200px;
            height: 250px;
            background: url('/infinite-space-shooter-3d/assets/luna_avatar.png') center center / cover,
                       linear-gradient(45deg, #ff6b9d, #c44569);
            border-radius: 20px;
            box-shadow: 0 10px 30px rgba(255, 107, 157, 0.5);
            border: 3px solid #ffaa00;
        `;
        background.appendChild(characterArea);
        
        // ダイアログエリア
        this.dialogueBox = document.createElement('div');
        this.dialogueBox.style.cssText = `
            position: absolute;
            bottom: 0;
            left: 0;
            width: 100%;
            height: 40%;
            background: rgba(0, 0, 0, 0.9);
            border-top: 3px solid #00aaff;
            padding: 20px;
            box-sizing: border-box;
        `;
        
        // スピーカー名
        this.speakerName = document.createElement('div');
        this.speakerName.style.cssText = `
            font-size: 20px;
            color: #00aaff;
            font-weight: bold;
            margin-bottom: 10px;
        `;
        
        // ダイアログテキスト
        this.dialogueText = document.createElement('div');
        this.dialogueText.style.cssText = `
            font-size: 16px;
            color: white;
            line-height: 1.5;
            margin-bottom: 20px;
            min-height: 100px;
        `;
        
        // コントロールボタン
        const buttonContainer = document.createElement('div');
        buttonContainer.style.cssText = `
            display: flex;
            justify-content: space-between;
            align-items: center;
        `;
        
        this.nextButton = document.createElement('button');
        this.nextButton.textContent = '次へ ▶';
        this.nextButton.style.cssText = `
            background: linear-gradient(45deg, #00aaff, #0088cc);
            border: none;
            color: white;
            padding: 12px 24px;
            border-radius: 25px;
            cursor: pointer;
            font-size: 14px;
            font-weight: bold;
            transition: all 0.3s;
        `;
        this.nextButton.onmouseover = () => {
            this.nextButton.style.transform = 'scale(1.05)';
            this.nextButton.style.boxShadow = '0 5px 15px rgba(0, 170, 255, 0.4)';
        };
        this.nextButton.onmouseout = () => {
            this.nextButton.style.transform = 'scale(1)';
            this.nextButton.style.boxShadow = 'none';
        };
        this.nextButton.onclick = () => this.nextDialogue();
        
        const skipButton = document.createElement('button');
        skipButton.textContent = 'スキップ';
        skipButton.style.cssText = `
            background: transparent;
            border: 1px solid #666;
            color: #aaa;
            padding: 8px 16px;
            border-radius: 20px;
            cursor: pointer;
            font-size: 12px;
        `;
        skipButton.onclick = () => this.skipDialogue();
        
        buttonContainer.appendChild(skipButton);
        buttonContainer.appendChild(this.nextButton);
        
        // ダイアログボックス組み立て
        this.dialogueBox.appendChild(this.speakerName);
        this.dialogueBox.appendChild(this.dialogueText);
        this.dialogueBox.appendChild(buttonContainer);
        
        // UI組み立て
        this.tavernUI.appendChild(background);
        this.tavernUI.appendChild(this.dialogueBox);
        
        document.body.appendChild(this.tavernUI);
    }
    
    show(dialogueData) {
        this.dialogueData = dialogueData;
        this.currentDialogue = 0;
        this.isActive = true;
        
        this.tavernUI.style.display = 'block';
        this.tavernUI.style.animation = 'fadeIn 0.5s ease-out';
        
        this.displayCurrentDialogue();
        
        // ゲームを一時停止
        if (this.game.pause) {
            this.game.pause();
        }
        
        // BGM変更（酒場用）
        this.playTavernMusic();
    }
    
    hide() {
        this.isActive = false;
        this.tavernUI.style.animation = 'fadeOut 0.5s ease-in';
        
        setTimeout(() => {
            this.tavernUI.style.display = 'none';
            
            // ゲーム再開
            if (this.game.resume) {
                this.game.resume();
            }
            
            // 通常BGMに戻す
            this.resumeGameMusic();
        }, 500);
    }
    
    displayCurrentDialogue() {
        if (!this.dialogueData || this.currentDialogue >= this.dialogueData.dialogue.length) {
            this.completeDialogue();
            return;
        }
        
        const dialogue = this.dialogueData.dialogue[this.currentDialogue];
        
        // スピーカー名設定
        let displayName = dialogue.speaker;
        if (dialogue.speaker === 'Luna') {
            displayName = '🌙 Luna Skywalker';
        } else if (dialogue.speaker === 'System') {
            displayName = '📡 システム';
        }
        
        this.speakerName.textContent = displayName;
        
        // テキストアニメーション
        this.dialogueText.textContent = '';
        this.typewriterEffect(dialogue.text);
        
        // 最後のダイアログの場合はボタンテキスト変更
        if (this.currentDialogue === this.dialogueData.dialogue.length - 1) {
            this.nextButton.textContent = '完了 ✓';
        } else {
            this.nextButton.textContent = '次へ ▶';
        }
    }
    
    typewriterEffect(text) {
        let index = 0;
        const speed = 30; // ミリ秒
        
        const typeInterval = setInterval(() => {
            this.dialogueText.textContent += text[index];
            index++;
            
            if (index >= text.length) {
                clearInterval(typeInterval);
            }
        }, speed);
    }
    
    nextDialogue() {
        this.currentDialogue++;
        this.displayCurrentDialogue();
    }
    
    skipDialogue() {
        this.hide();
    }
    
    completeDialogue() {
        // 相棒システム活性化
        if (this.game.companionSystem && this.dialogueData.title.includes('酒場')) {
            this.game.companionSystem.activate();
        }
        
        this.hide();
    }
    
    playTavernMusic() {
        // 酒場用の音楽を再生（実装予定）
        console.log('Playing tavern background music...');
    }
    
    resumeGameMusic() {
        // ゲーム音楽に戻す（実装予定）  
        console.log('Resuming game background music...');
    }
}

// CSS追加
const tavernStyle = document.createElement('style');
tavernStyle.textContent = `
    @keyframes fadeIn {
        from { opacity: 0; transform: scale(0.95); }
        to { opacity: 1; transform: scale(1); }
    }
    
    @keyframes fadeOut {
        from { opacity: 1; transform: scale(1); }
        to { opacity: 0; transform: scale(0.95); }
    }
`;
document.head.appendChild(tavernStyle);