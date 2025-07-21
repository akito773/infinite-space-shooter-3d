export class DialogueSystem {
    constructor(game) {
        this.game = game;
        this.isActive = false;
        this.currentDialogue = null;
        this.currentLineIndex = 0;
        this.choiceCallback = null;
        
        this.createUI();
        this.setupEventListeners();
        this.loadNPCData();
    }
    
    createUI() {
        // 会話ウィンドウ
        this.dialogueContainer = document.createElement('div');
        this.dialogueContainer.id = 'dialogue-container';
        this.dialogueContainer.style.cssText = `
            position: absolute;
            bottom: 50px;
            left: 50%;
            transform: translateX(-50%);
            width: 80%;
            max-width: 800px;
            background: linear-gradient(to bottom, rgba(0, 10, 30, 0.95), rgba(0, 20, 40, 0.95));
            border: 2px solid rgba(0, 200, 255, 0.8);
            border-radius: 15px;
            padding: 20px;
            display: none;
            z-index: 2100;
            box-shadow: 0 0 30px rgba(0, 200, 255, 0.5);
            background-size: cover;
            background-position: center;
        `;
        
        // キャラクター名
        this.nameElement = document.createElement('div');
        this.nameElement.style.cssText = `
            color: #00ffff;
            font-size: 20px;
            font-weight: bold;
            margin-bottom: 10px;
            text-shadow: 0 0 10px rgba(0, 255, 255, 0.5);
        `;
        
        // キャラクターポートレート
        this.portraitElement = document.createElement('div');
        this.portraitElement.style.cssText = `
            position: absolute;
            left: -80px;
            top: 50%;
            transform: translateY(-50%);
            width: 120px;
            height: 120px;
            background: rgba(0, 100, 200, 0.3);
            border: 2px solid rgba(0, 200, 255, 0.8);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 60px;
        `;
        
        // テキスト本文
        this.textElement = document.createElement('div');
        this.textElement.style.cssText = `
            color: white;
            font-size: 18px;
            line-height: 1.6;
            min-height: 60px;
        `;
        
        // 選択肢コンテナ
        this.choicesContainer = document.createElement('div');
        this.choicesContainer.style.cssText = `
            margin-top: 20px;
            display: none;
        `;
        
        // 続行プロンプト
        this.continuePrompt = document.createElement('div');
        this.continuePrompt.style.cssText = `
            position: absolute;
            bottom: 10px;
            right: 20px;
            color: #00ffff;
            font-size: 14px;
            animation: blink 1s infinite;
        `;
        this.continuePrompt.textContent = '▼ Enter/クリックで続行';
        
        // アニメーションスタイル
        if (!document.querySelector('#dialogue-animation-style')) {
            const style = document.createElement('style');
            style.id = 'dialogue-animation-style';
            style.textContent = `
                @keyframes blink {
                    0%, 50% { opacity: 1; }
                    51%, 100% { opacity: 0; }
                }
                
                @keyframes typewriter {
                    from { width: 0; }
                    to { width: 100%; }
                }
                
                .dialogue-choice {
                    background: rgba(0, 50, 100, 0.5);
                    border: 1px solid rgba(0, 150, 255, 0.5);
                    color: white;
                    padding: 10px 20px;
                    margin: 5px 0;
                    font-size: 16px;
                    cursor: pointer;
                    transition: all 0.2s;
                    display: block;
                    width: 100%;
                    text-align: left;
                }
                
                .dialogue-choice:hover {
                    background: rgba(0, 100, 200, 0.8);
                    border-color: rgba(0, 255, 255, 1);
                    transform: translateX(10px);
                }
            `;
            document.head.appendChild(style);
        }
        
        // 要素を組み立て
        this.dialogueContainer.appendChild(this.portraitElement);
        this.dialogueContainer.appendChild(this.nameElement);
        this.dialogueContainer.appendChild(this.textElement);
        this.dialogueContainer.appendChild(this.choicesContainer);
        this.dialogueContainer.appendChild(this.continuePrompt);
        document.body.appendChild(this.dialogueContainer);
    }
    
    setupEventListeners() {
        // クリックで次へ
        this.dialogueContainer.addEventListener('click', (e) => {
            if (e.target.classList.contains('dialogue-choice')) return;
            this.nextLine();
        });
        
        // キーボード操作
        document.addEventListener('keydown', (e) => {
            if (!this.isActive) return;
            
            if (e.key === 'Enter') {
                e.preventDefault();
                this.nextLine();
            } else if (e.key === 'Escape') {
                e.preventDefault();
                this.endDialogue();
            } else if (e.key >= '1' && e.key <= '9') {
                // 数字キーで選択肢を選ぶ
                const choiceIndex = parseInt(e.key) - 1;
                const choiceButtons = this.choicesContainer.querySelectorAll('.dialogue-choice');
                if (choiceButtons[choiceIndex]) {
                    choiceButtons[choiceIndex].click();
                }
            }
        });
    }
    
    loadNPCData() {
        // NPCの会話データ
        this.npcData = {
            governor: {
                name: '総督マルコス',
                portrait: '👨‍✈️',
                dialogues: {
                    first: [
                        "ようこそ、パイロット。私がこのコロニーの総督、マルコスだ。",
                        "ヴォイドの侵攻が始まってから、状況は日々悪化している。",
                        "君のような腕利きのパイロットが必要だ。協力してくれるか？",
                        {
                            type: 'choice',
                            choices: [
                                { text: "もちろん協力します", next: 'accept' },
                                { text: "報酬次第ですね", next: 'reward' },
                                { text: "状況を詳しく教えてください", next: 'info' }
                            ]
                        }
                    ],
                    accept: [
                        "素晴らしい！君のような勇敢なパイロットを待っていた。",
                        "まずは防衛線の構築を手伝ってくれ。",
                        "報酬は十分に用意する。頼んだぞ！"
                    ],
                    reward: [
                        "ビジネスライクな態度、嫌いじゃない。",
                        "標準報酬に加えて、特別ボーナスも用意しよう。",
                        "ただし、成果次第だがな。"
                    ],
                    info: [
                        "3日前、第7セクターでヴォイドの大規模な艦隊が確認された。",
                        "我々の防衛艦隊は既に半数が失われている。",
                        "このままでは、コロニーが陥落するのは時間の問題だ..."
                    ]
                }
            },
            
            scientist: {
                name: 'Dr.エミリア',
                portrait: '👩‍🔬',
                dialogues: {
                    first: [
                        "あら、新しいパイロットね。私はエミリア、ここの研究主任よ。",
                        "ヴォイドについて興味深い発見があったの。",
                        "彼らは単なる侵略者じゃない...もっと複雑な存在よ。",
                        {
                            type: 'choice',
                            choices: [
                                { text: "どんな発見ですか？", next: 'discovery' },
                                { text: "危険じゃないんですか？", next: 'danger' }
                            ]
                        }
                    ],
                    discovery: [
                        "ヴォイドの残骸を解析したところ、彼らの技術は我々より1000年は進んでいる。",
                        "でも奇妙なことに、彼らのコアには有機的な構造が...",
                        "まるで、機械と生命体の融合体のようなの。"
                    ],
                    danger: [
                        "もちろん危険よ。でも知識なくして勝利なし、でしょう？",
                        "彼らの弱点を見つけるには、まず理解する必要があるわ。",
                        "...ところで、サンプル収集を手伝ってくれない？"
                    ]
                }
            },
            
            merchant: {
                name: '商人ザック',
                portrait: '🧔',
                dialogues: {
                    first: [
                        "おっ、新顔だな！俺はザック、この宙域一の商人だ。",
                        "戦争は悲劇だが、ビジネスチャンスでもある。",
                        "いい装備が必要なら、俺に任せな！"
                    ]
                }
            },
            
            refugee: {
                name: '避難民',
                portrait: '👥',
                dialogues: {
                    first: [
                        "お願いです...私たちを助けてください...",
                        "第3コロニーから逃げてきました。そこは既に...",
                        "家族とはぐれてしまって...娘を探しています..."
                    ]
                }
            }
        };
    }
    
    startDialogue(npcKey, dialogueKey = 'first', location = null) {
        const npc = this.npcData[npcKey];
        if (!npc) return;
        
        this.currentDialogue = {
            npc: npc,
            lines: npc.dialogues[dialogueKey] || npc.dialogues.first,
            key: dialogueKey
        };
        
        this.currentLineIndex = 0;
        this.isActive = true;
        this.game.isPaused = true;
        
        // UI表示
        this.dialogueContainer.style.display = 'block';
        this.nameElement.textContent = npc.name;
        this.portraitElement.textContent = npc.portrait;
        
        // 場所に応じて背景画像を設定
        if (location === '酒場') {
            this.dialogueContainer.style.backgroundImage = 'url(./images/locations/tavern.png)';
            this.dialogueContainer.style.background = `url(./images/locations/tavern.png), linear-gradient(to bottom, rgba(0, 10, 30, 0.95), rgba(0, 20, 40, 0.95))`;
            this.dialogueContainer.style.backgroundBlendMode = 'multiply';
        } else {
            this.dialogueContainer.style.backgroundImage = '';
            this.dialogueContainer.style.background = 'linear-gradient(to bottom, rgba(0, 10, 30, 0.95), rgba(0, 20, 40, 0.95))';
        }
        
        // 最初の行を表示
        this.displayCurrentLine();
    }
    
    displayCurrentLine() {
        const line = this.currentDialogue.lines[this.currentLineIndex];
        
        if (typeof line === 'string') {
            // 通常のテキスト
            this.displayText(line);
            this.choicesContainer.style.display = 'none';
            this.continuePrompt.style.display = 'block';
        } else if (line && line.type === 'choice') {
            // 選択肢
            this.displayChoices(line.choices);
            this.continuePrompt.style.display = 'none';
        }
    }
    
    displayText(text) {
        this.textElement.innerHTML = '';
        
        // タイプライター効果
        let charIndex = 0;
        const typeInterval = setInterval(() => {
            if (charIndex < text.length) {
                this.textElement.textContent += text[charIndex];
                charIndex++;
            } else {
                clearInterval(typeInterval);
            }
        }, 30);
    }
    
    displayChoices(choices) {
        this.choicesContainer.innerHTML = '';
        this.choicesContainer.style.display = 'block';
        
        choices.forEach((choice, index) => {
            const button = document.createElement('button');
            button.className = 'dialogue-choice';
            button.textContent = `${index + 1}. ${choice.text}`;
            button.addEventListener('click', (e) => {
                e.stopPropagation(); // イベントバブリングを防ぐ
                console.log('選択肢がクリックされました:', choice);
                this.selectChoice(choice);
            });
            this.choicesContainer.appendChild(button);
        });
    }
    
    selectChoice(choice) {
        if (this.game.soundManager) {
            this.game.soundManager.play('collect');
        }
        
        // 選択結果を処理
        if (choice.next) {
            // 現在のNPCキーを保持して次の会話へ
            const currentNpcKey = Object.keys(this.npcData).find(key => 
                this.npcData[key].name === this.currentDialogue.npc.name
            );
            
            if (currentNpcKey) {
                this.startDialogue(currentNpcKey, choice.next);
            }
        } else if (choice.action) {
            // アクションを実行
            this.handleAction(choice.action);
        }
        
        // コールバックがあれば実行
        if (this.choiceCallback) {
            this.choiceCallback(choice);
        }
    }
    
    handleAction(action) {
        switch(action) {
            case 'accept_quest':
                this.game.showCollectMessage('クエストを受注しました！');
                break;
            case 'open_shop':
                // ショップを開く（後で実装）
                break;
        }
        
        this.endDialogue();
    }
    
    nextLine() {
        if (!this.isActive) return;
        
        const currentLine = this.currentDialogue.lines[this.currentLineIndex];
        
        // 選択肢の場合は次に進まない
        if (currentLine && currentLine.type === 'choice') return;
        
        this.currentLineIndex++;
        
        if (this.currentLineIndex >= this.currentDialogue.lines.length) {
            this.endDialogue();
        } else {
            this.displayCurrentLine();
        }
    }
    
    endDialogue() {
        this.isActive = false;
        this.game.isPaused = false;
        
        // フェードアウト
        this.dialogueContainer.style.opacity = '0';
        this.dialogueContainer.style.transition = 'opacity 0.3s';
        
        setTimeout(() => {
            this.dialogueContainer.style.display = 'none';
            this.dialogueContainer.style.opacity = '1';
            this.dialogueContainer.style.transition = '';
        }, 300);
    }
}