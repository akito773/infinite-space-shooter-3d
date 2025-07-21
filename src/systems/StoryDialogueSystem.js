// ストーリーダイアログシステム

export class StoryDialogueSystem {
    constructor(game) {
        this.game = game;
        this.currentDialogue = null;
        this.dialogueQueue = [];
        this.isPlaying = false;
        this.autoPlaySpeed = 3000; // 自動再生の速度（ミリ秒）
        this.autoPlayTimer = null;
        
        // ダイアログUI要素
        this.dialogueContainer = null;
        this.characterName = null;
        this.dialogueText = null;
        this.characterPortrait = null;
        this.nextButton = null;
        
        // ダイアログデータ
        this.dialogues = {};
        
        this.createUI();
        this.loadDialogues();
        this.setupEventListeners();
    }
    
    createUI() {
        // メインコンテナ
        this.dialogueContainer = document.createElement('div');
        this.dialogueContainer.className = 'story-dialogue-container';
        this.dialogueContainer.style.cssText = `
            position: fixed;
            bottom: 20px;
            left: 50%;
            transform: translateX(-50%);
            width: 80%;
            max-width: 800px;
            background: linear-gradient(to bottom, rgba(0,0,0,0.9), rgba(0,20,40,0.95));
            border: 2px solid #00ffff;
            border-radius: 10px;
            padding: 20px;
            display: none;
            z-index: 2000;
            box-shadow: 0 0 30px rgba(0,255,255,0.5);
        `;
        
        // キャラクターポートレート
        this.characterPortrait = document.createElement('img');
        this.characterPortrait.style.cssText = `
            position: absolute;
            left: -80px;
            bottom: 0;
            width: 150px;
            height: 150px;
            border-radius: 50%;
            border: 3px solid #00ffff;
            background: #000;
            object-fit: cover;
        `;
        
        // キャラクター名
        this.characterName = document.createElement('div');
        this.characterName.style.cssText = `
            color: #00ffff;
            font-size: 20px;
            font-weight: bold;
            margin-bottom: 10px;
            text-shadow: 0 0 10px rgba(0,255,255,0.8);
        `;
        
        // ダイアログテキスト
        this.dialogueText = document.createElement('div');
        this.dialogueText.style.cssText = `
            color: white;
            font-size: 16px;
            line-height: 1.6;
            min-height: 60px;
            text-shadow: 1px 1px 2px rgba(0,0,0,0.8);
        `;
        
        // 次へボタン
        this.nextButton = document.createElement('button');
        this.nextButton.textContent = '▶';
        this.nextButton.style.cssText = `
            position: absolute;
            bottom: 10px;
            right: 10px;
            background: rgba(0,255,255,0.2);
            border: 1px solid #00ffff;
            color: #00ffff;
            padding: 5px 15px;
            border-radius: 5px;
            cursor: pointer;
            font-size: 18px;
            transition: all 0.3s;
            animation: pulse 1s infinite;
        `;
        
        // スキップボタン
        this.skipButton = document.createElement('button');
        this.skipButton.textContent = 'スキップ';
        this.skipButton.style.cssText = `
            position: absolute;
            top: 10px;
            right: 10px;
            background: rgba(255,0,0,0.2);
            border: 1px solid #ff6666;
            color: #ff6666;
            padding: 5px 15px;
            border-radius: 5px;
            cursor: pointer;
            font-size: 14px;
            transition: all 0.3s;
        `;
        
        // 組み立て
        this.dialogueContainer.appendChild(this.characterPortrait);
        this.dialogueContainer.appendChild(this.characterName);
        this.dialogueContainer.appendChild(this.dialogueText);
        this.dialogueContainer.appendChild(this.nextButton);
        this.dialogueContainer.appendChild(this.skipButton);
        
        document.body.appendChild(this.dialogueContainer);
        
        // アニメーション用CSS
        const style = document.createElement('style');
        style.textContent = `
            @keyframes pulse {
                0%, 100% { transform: scale(1); opacity: 1; }
                50% { transform: scale(1.1); opacity: 0.8; }
            }
            
            @keyframes typewriter {
                from { width: 0; }
                to { width: 100%; }
            }
            
            .dialogue-fade-in {
                animation: fadeIn 0.5s ease-out;
            }
            
            .dialogue-fade-out {
                animation: fadeOut 0.3s ease-in;
            }
            
            @keyframes fadeIn {
                from { opacity: 0; transform: translateY(20px); }
                to { opacity: 1; transform: translateY(0); }
            }
            
            @keyframes fadeOut {
                from { opacity: 1; transform: translateY(0); }
                to { opacity: 0; transform: translateY(20px); }
            }
        `;
        document.head.appendChild(style);
    }
    
    setupEventListeners() {
        this.nextButton.addEventListener('click', () => this.nextDialogue());
        this.skipButton.addEventListener('click', () => this.skipDialogue());
        
        // スペースキーでも次へ
        document.addEventListener('keydown', (e) => {
            if (e.code === 'Space' && this.isPlaying) {
                e.preventDefault();
                this.nextDialogue();
            }
        });
    }
    
    loadDialogues() {
        // ストーリーダイアログデータ
        this.dialogues = {
            // 序章
            intro_1: [
                { character: 'system', text: '地球軌道上 - 訓練空域', portrait: null },
                { character: 'commander', text: '新兵、聞こえるか？こちら司令部。最終訓練を開始する。', portrait: 'commander' },
                { character: 'player', text: 'こちらスターゲイザー、了解しました。', portrait: 'player' },
                { character: 'commander', text: '標的ドローンを3機撃墜せよ。実弾を使用する。', portrait: 'commander' }
            ],
            
            intro_signal: [
                { character: 'system', text: '警告：未知の信号を検出', portrait: null },
                { character: 'player', text: '司令部、こちらスターゲイザー。謎の信号を受信しています。', portrait: 'player' },
                { character: 'commander', text: '確認した...これは...古い、とても古い信号だ。', portrait: 'commander' },
                { character: 'commander', text: '訓練を中止する。すぐに帰投せよ。', portrait: 'commander' }
            ],
            
            // ルナとの出会い
            luna_first_meet: [
                { character: 'luna', text: 'あら、見ない顔ね。新人さん？私、ルナよ。情報なら何でも知ってるわ〜', portrait: 'luna', voice: 'tavern_meet_1' },
                { character: 'player', text: '初めまして。あの信号について何か知っていますか？', portrait: 'player' },
                { character: 'luna', text: 'ふーん、あの信号を受信したの？面白いわね〜', portrait: 'luna' },
                { character: 'luna', text: 'それ、ヴォイド・キーパーの遺跡から発信されてるのよ。', portrait: 'luna' },
                { character: 'player', text: 'ヴォイド・キーパー？', portrait: 'player' },
                { character: 'luna', text: '1000年前の古代文明。詳しく知りたいなら...また来てくれる？', portrait: 'luna', voice: 'tavern_meet_3' }
            ],
            
            // 仮面の男、初登場
            dark_nebula_intro: [
                { character: 'system', text: '火星 - 古代遺跡内部', portrait: null },
                { character: '???', text: '...ついに来たか。', portrait: 'dark_nebula' },
                { character: 'player', text: '誰だ！？', portrait: 'player' },
                { character: 'dark_nebula', text: '我が名はダークネビュラ。この遺跡の番人だ。', portrait: 'dark_nebula' },
                { character: 'dark_nebula', text: '立ち去れ。ここは貴様のような者が来る場所ではない。', portrait: 'dark_nebula' },
                { character: 'luna', text: 'この感じ...どこかで...', portrait: 'luna' },
                { character: 'dark_nebula', text: '...ルナ。まさか、お前も来ていたのか。', portrait: 'dark_nebula' },
                { character: 'luna', text: '！？ その声...まさか...', portrait: 'luna' }
            ],
            
            // 父の正体判明
            father_reveal: [
                { character: 'luna', text: 'お父さん...？本当にお父さんなの？', portrait: 'luna' },
                { character: 'dark_nebula', text: '...その名で呼ぶな。ヴィクター・スカイウォーカーは死んだ。', portrait: 'dark_nebula' },
                { character: 'luna', text: 'そんな...10年間、ずっと探してたのに...', portrait: 'luna' },
                { character: 'dark_nebula', text: '虚無が...私を選んだ。もはや後戻りはできない。', portrait: 'dark_nebula' },
                { character: 'player', text: 'ルナ、彼は...', portrait: 'player' },
                { character: 'luna', text: '私の...私の父よ。でも、何かがおかしい...', portrait: 'luna' },
                { character: 'dark_nebula', text: '邪魔をするな。宇宙の運命は既に決まっている。', portrait: 'dark_nebula' }
            ]
        };
    }
    
    // ダイアログを開始
    startDialogue(dialogueId, onComplete = null) {
        if (!this.dialogues[dialogueId]) {
            console.warn(`Dialogue '${dialogueId}' not found`);
            return;
        }
        
        this.dialogueQueue = [...this.dialogues[dialogueId]];
        this.currentDialogueIndex = 0;
        this.onCompleteCallback = onComplete;
        
        this.show();
        this.playCurrentDialogue();
    }
    
    // 現在のダイアログを再生
    playCurrentDialogue() {
        if (this.currentDialogueIndex >= this.dialogueQueue.length) {
            this.endDialogue();
            return;
        }
        
        const dialogue = this.dialogueQueue[this.currentDialogueIndex];
        
        // キャラクター情報を更新
        this.updateCharacter(dialogue.character, dialogue.portrait);
        
        // テキストをタイプライター効果で表示
        this.typewriterEffect(dialogue.text);
        
        // ボイス再生
        if (dialogue.voice && this.game.voiceSystem) {
            this.game.voiceSystem.playVoice(dialogue.character, dialogue.voice);
        }
        
        // 自動再生タイマーをリセット
        if (this.autoPlayTimer) {
            clearTimeout(this.autoPlayTimer);
        }
        
        this.autoPlayTimer = setTimeout(() => {
            this.nextDialogue();
        }, this.autoPlaySpeed + dialogue.text.length * 30);
    }
    
    // キャラクター情報を更新
    updateCharacter(character, portrait) {
        const characterData = {
            luna: {
                name: 'ルナ・スカイウォーカー',
                portrait: 'assets/luna_avatar.png',
                color: '#ff99cc'
            },
            player: {
                name: 'スターゲイザー',
                portrait: 'assets/player_avatar.png',
                color: '#00aaff'
            },
            commander: {
                name: '司令官',
                portrait: 'assets/commander_avatar.png',
                color: '#ffaa00'
            },
            dark_nebula: {
                name: 'ダークネビュラ',
                portrait: 'assets/dark_nebula_avatar.png',
                color: '#ff0066'
            },
            system: {
                name: 'システム',
                portrait: null,
                color: '#00ff00'
            }
        };
        
        const data = characterData[character] || characterData.system;
        
        this.characterName.textContent = data.name;
        this.characterName.style.color = data.color;
        
        if (data.portrait && portrait !== null) {
            this.characterPortrait.src = data.portrait;
            this.characterPortrait.style.display = 'block';
        } else {
            this.characterPortrait.style.display = 'none';
        }
    }
    
    // タイプライター効果
    typewriterEffect(text) {
        this.dialogueText.textContent = '';
        let index = 0;
        
        const type = () => {
            if (index < text.length) {
                this.dialogueText.textContent += text[index];
                index++;
                setTimeout(type, 30);
            }
        };
        
        type();
    }
    
    // 次のダイアログへ
    nextDialogue() {
        this.currentDialogueIndex++;
        this.playCurrentDialogue();
    }
    
    // ダイアログをスキップ
    skipDialogue() {
        if (this.autoPlayTimer) {
            clearTimeout(this.autoPlayTimer);
        }
        this.endDialogue();
    }
    
    // ダイアログを終了
    endDialogue() {
        this.hide();
        
        if (this.onCompleteCallback) {
            this.onCompleteCallback();
        }
        
        // ゲームを再開
        if (this.game.isPaused) {
            this.game.isPaused = false;
        }
    }
    
    show() {
        this.isPlaying = true;
        this.dialogueContainer.style.display = 'block';
        this.dialogueContainer.classList.add('dialogue-fade-in');
        
        // ゲームを一時停止
        if (this.game) {
            this.game.isPaused = true;
        }
    }
    
    hide() {
        this.isPlaying = false;
        this.dialogueContainer.classList.add('dialogue-fade-out');
        
        setTimeout(() => {
            this.dialogueContainer.style.display = 'none';
            this.dialogueContainer.classList.remove('dialogue-fade-in', 'dialogue-fade-out');
        }, 300);
    }
}