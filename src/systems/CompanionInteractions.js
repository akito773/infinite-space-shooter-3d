// コンパニオンインタラクションシステム
// ルナとの様々なインタラクションを管理

export class CompanionInteractions {
    constructor(game) {
        this.game = game;
        this.companionSystem = game.companionSystem;
        
        // インタラクション状態
        this.lastInteractionTime = 0;
        this.interactionCooldown = 30000; // 30秒
        
        // プレゼントシステム
        this.giftableItems = {
            'space_flower': {
                name: '宇宙の花',
                trustBonus: 5,
                response: 'わぁ！きれいな花ね！ありがとう♪',
                voiceType: 'gift_happy'
            },
            'rare_crystal': {
                name: 'レアクリスタル',
                trustBonus: 3,
                response: 'これ、すごく珍しいやつじゃない！',
                voiceType: 'gift_surprised'
            },
            'alien_snack': {
                name: '宇宙のお菓子',
                trustBonus: 2,
                response: 'おいしそう！一緒に食べましょ？',
                voiceType: 'gift_normal'
            },
            'ancient_book': {
                name: '古代の書物',
                trustBonus: 4,
                response: '興味深いわ...後で読ませてもらえる？',
                voiceType: 'gift_interested'
            }
        };
        
        // 会話選択肢
        this.conversationTopics = {
            past: {
                title: '過去について聞く',
                trustRequired: 25,
                dialogues: [
                    {
                        player: 'ギルドで働く前は何をしていたの？',
                        luna: '実は...宇宙考古学を勉強してたの。父と一緒に遺跡を回ってた時期もあったわ。',
                        trustGain: 2
                    },
                    {
                        player: 'お父さんはどんな人だったの？',
                        luna: '優しくて、でも謎が多い人だった。いつも「宇宙には守るべき秘密がある」って言ってたの。',
                        trustGain: 3,
                        unlockCondition: { trustLevel: 50 }
                    }
                ]
            },
            dreams: {
                title: '夢について聞く',
                trustRequired: 0,
                dialogues: [
                    {
                        player: '将来の夢はある？',
                        luna: 'いつか自分の宇宙船を持って、まだ誰も見たことのない星を見つけたいな！',
                        trustGain: 1
                    },
                    {
                        player: '一緒に冒険できたらいいね',
                        luna: 'ほんと？約束よ！絶対一緒に行きましょうね♪',
                        trustGain: 2,
                        unlockCondition: { trustLevel: 75 }
                    }
                ]
            },
            combat: {
                title: '戦闘について話す',
                trustRequired: 10,
                dialogues: [
                    {
                        player: '戦闘のアドバイスをもらえる？',
                        luna: 'ヴォイドは予測可能な動きをするから、パターンを覚えれば楽勝よ！',
                        trustGain: 1,
                        effect: 'combatTip'
                    }
                ]
            }
        };
        
        // 特殊イベント
        this.specialEvents = {
            birthday: {
                date: '03-15', // 3月15日
                triggered: false,
                dialogue: 'あれ？今日って私の誕生日だって覚えててくれたの？嬉しい！',
                trustBonus: 10
            },
            longTime: {
                condition: () => Date.now() - this.lastInteractionTime > 86400000, // 24時間
                dialogue: '久しぶり！心配してたのよ〜',
                trustBonus: 2
            }
        };
        
        this.createInteractionUI();
        this.setupKeyboardShortcuts();
    }
    
    createInteractionUI() {
        // インタラクションメニュー
        this.interactionMenu = document.createElement('div');
        this.interactionMenu.id = 'companion-interaction-menu';
        this.interactionMenu.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(0, 20, 40, 0.95);
            border: 2px solid #ff6b9d;
            border-radius: 15px;
            padding: 30px;
            display: none;
            z-index: 2000;
            min-width: 400px;
            box-shadow: 0 0 30px rgba(255, 107, 157, 0.3);
        `;
        
        // タイトル
        const title = document.createElement('h2');
        title.style.cssText = `
            color: #ff6b9d;
            text-align: center;
            margin: 0 0 20px 0;
            font-size: 24px;
        `;
        title.textContent = 'ルナとの交流';
        
        // 選択肢コンテナ
        this.optionsContainer = document.createElement('div');
        this.optionsContainer.style.cssText = `
            display: flex;
            flex-direction: column;
            gap: 10px;
            margin-bottom: 20px;
        `;
        
        // 閉じるボタン
        const closeBtn = document.createElement('button');
        closeBtn.style.cssText = `
            background: #666;
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 5px;
            cursor: pointer;
            font-size: 16px;
            display: block;
            margin: 0 auto;
        `;
        closeBtn.textContent = '閉じる (ESC)';
        closeBtn.onclick = () => this.closeInteractionMenu();
        
        this.interactionMenu.appendChild(title);
        this.interactionMenu.appendChild(this.optionsContainer);
        this.interactionMenu.appendChild(closeBtn);
        
        document.body.appendChild(this.interactionMenu);
        
        // プレゼントUI
        this.createGiftUI();
    }
    
    createGiftUI() {
        this.giftMenu = document.createElement('div');
        this.giftMenu.id = 'gift-menu';
        this.giftMenu.style.cssText = `
            position: fixed;
            bottom: 100px;
            right: 20px;
            background: rgba(0, 20, 40, 0.9);
            border: 2px solid #ff6b9d;
            border-radius: 10px;
            padding: 15px;
            display: none;
            z-index: 1500;
        `;
        
        const giftTitle = document.createElement('h3');
        giftTitle.style.cssText = `
            color: #ff6b9d;
            margin: 0 0 10px 0;
            font-size: 18px;
        `;
        giftTitle.textContent = 'プレゼントを渡す';
        
        this.giftList = document.createElement('div');
        this.giftList.style.cssText = `
            display: flex;
            flex-direction: column;
            gap: 5px;
        `;
        
        this.giftMenu.appendChild(giftTitle);
        this.giftMenu.appendChild(this.giftList);
        
        document.body.appendChild(this.giftMenu);
    }
    
    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // ルナがアクティブな時のみ反応
            if (!this.game.isPaused && this.companionSystem?.isActive) {
                // Cキーで会話メニュー（ルナが表示されている時）
                if (e.key.toLowerCase() === 'c') {
                    this.openInteractionMenu();
                }
                // Pキーでプレゼントメニュー（Presentの頭文字）
                else if (e.key.toLowerCase() === 'p' && !e.shiftKey && !e.ctrlKey) {
                    this.toggleGiftMenu();
                }
            }
        });
    }
    
    openInteractionMenu() {
        // ルナが表示されていない場合のチェック
        if (!this.companionSystem || !this.companionSystem.isActive) {
            console.log('ルナがアクティブではありません');
            return;
        }
        
        if (Date.now() - this.lastInteractionTime < this.interactionCooldown) {
            const remaining = Math.ceil((this.interactionCooldown - (Date.now() - this.lastInteractionTime)) / 1000);
            this.companionSystem.showMessage(
                `ちょっと待って〜！あと${remaining}秒後にまた話しましょ♪`,
                3000
            );
            return;
        }
        
        this.game.isPaused = true;
        this.interactionMenu.style.display = 'block';
        
        // 選択肢を生成
        this.optionsContainer.innerHTML = '';
        
        // 会話選択肢
        const conversationBtn = this.createMenuButton('💬 会話する', () => {
            this.showConversationTopics();
        });
        
        // プレゼント選択肢
        const giftBtn = this.createMenuButton('🎁 プレゼントを渡す', () => {
            this.closeInteractionMenu();
            this.toggleGiftMenu();
        });
        
        // 一緒に写真を撮る
        const photoBtn = this.createMenuButton('📸 一緒に写真を撮る', () => {
            this.takePhotoTogether();
        });
        
        // ミニゲーム
        if (this.companionSystem.relationshipLevel >= 50) {
            const gameBtn = this.createMenuButton('🎮 ミニゲームで遊ぶ', () => {
                this.startMiniGame();
            });
            this.optionsContainer.appendChild(gameBtn);
        }
        
        this.optionsContainer.appendChild(conversationBtn);
        this.optionsContainer.appendChild(giftBtn);
        this.optionsContainer.appendChild(photoBtn);
    }
    
    createMenuButton(text, onClick) {
        const btn = document.createElement('button');
        btn.style.cssText = `
            background: rgba(255, 107, 157, 0.2);
            border: 1px solid #ff6b9d;
            color: white;
            padding: 15px 20px;
            border-radius: 8px;
            cursor: pointer;
            font-size: 16px;
            text-align: left;
            transition: all 0.3s ease;
        `;
        btn.textContent = text;
        btn.onclick = onClick;
        
        btn.onmouseover = () => {
            btn.style.background = 'rgba(255, 107, 157, 0.4)';
            btn.style.transform = 'translateX(5px)';
        };
        btn.onmouseout = () => {
            btn.style.background = 'rgba(255, 107, 157, 0.2)';
            btn.style.transform = 'translateX(0)';
        };
        
        return btn;
    }
    
    showConversationTopics() {
        this.optionsContainer.innerHTML = '';
        
        Object.entries(this.conversationTopics).forEach(([key, topic]) => {
            if (this.companionSystem.relationshipLevel >= topic.trustRequired) {
                const topicBtn = this.createMenuButton(`💭 ${topic.title}`, () => {
                    this.startConversation(key);
                });
                this.optionsContainer.appendChild(topicBtn);
            }
        });
        
        // 戻るボタン
        const backBtn = this.createMenuButton('← 戻る', () => {
            this.openInteractionMenu();
        });
        backBtn.style.marginTop = '10px';
        this.optionsContainer.appendChild(backBtn);
    }
    
    startConversation(topicKey) {
        const topic = this.conversationTopics[topicKey];
        const availableDialogues = topic.dialogues.filter(d => {
            if (d.unlockCondition) {
                return this.companionSystem.relationshipLevel >= d.unlockCondition.trustLevel;
            }
            return true;
        });
        
        if (availableDialogues.length === 0) return;
        
        // ランダムに会話を選択
        const dialogue = availableDialogues[Math.floor(Math.random() * availableDialogues.length)];
        
        this.closeInteractionMenu();
        this.lastInteractionTime = Date.now();
        
        // 会話を表示
        this.showDialogueSequence([
            { speaker: 'player', text: dialogue.player },
            { speaker: 'luna', text: dialogue.luna }
        ], () => {
            // 信頼度を上げる
            this.companionSystem.increaseTrust(dialogue.trustGain);
            
            // 特殊効果があれば実行
            if (dialogue.effect) {
                this.applyDialogueEffect(dialogue.effect);
            }
        });
    }
    
    showDialogueSequence(dialogues, onComplete) {
        let index = 0;
        
        const showNext = () => {
            if (index >= dialogues.length) {
                if (onComplete) onComplete();
                return;
            }
            
            const dialogue = dialogues[index];
            
            if (dialogue.speaker === 'luna') {
                this.companionSystem.showMessage(dialogue.text, 4000);
            } else {
                // プレイヤーの発言は別のUIで表示
                this.showPlayerDialogue(dialogue.text);
            }
            
            index++;
            setTimeout(showNext, 4500);
        };
        
        showNext();
    }
    
    showPlayerDialogue(text) {
        const playerUI = document.createElement('div');
        playerUI.style.cssText = `
            position: fixed;
            bottom: 200px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(0, 50, 100, 0.9);
            border: 2px solid #00aaff;
            border-radius: 10px;
            padding: 15px 30px;
            color: white;
            font-size: 16px;
            z-index: 1500;
        `;
        playerUI.textContent = text;
        
        document.body.appendChild(playerUI);
        
        setTimeout(() => {
            playerUI.style.opacity = '0';
            playerUI.style.transition = 'opacity 0.5s';
            setTimeout(() => {
                document.body.removeChild(playerUI);
            }, 500);
        }, 3500);
    }
    
    toggleGiftMenu() {
        if (this.giftMenu.style.display === 'block') {
            this.giftMenu.style.display = 'none';
        } else {
            this.updateGiftList();
            this.giftMenu.style.display = 'block';
        }
    }
    
    updateGiftList() {
        this.giftList.innerHTML = '';
        
        // インベントリから贈り物可能なアイテムを取得
        const inventory = this.game.inventorySystem?.items || [];
        
        Object.entries(this.giftableItems).forEach(([itemId, giftData]) => {
            const hasItem = inventory.some(item => item.id === itemId);
            
            if (hasItem) {
                const giftBtn = document.createElement('button');
                giftBtn.style.cssText = `
                    background: rgba(255, 107, 157, 0.2);
                    border: 1px solid #ff6b9d;
                    color: white;
                    padding: 10px;
                    border-radius: 5px;
                    cursor: pointer;
                    font-size: 14px;
                `;
                giftBtn.textContent = `🎁 ${giftData.name}`;
                giftBtn.onclick = () => this.giveGift(itemId);
                
                this.giftList.appendChild(giftBtn);
            }
        });
        
        if (this.giftList.children.length === 0) {
            const noGifts = document.createElement('p');
            noGifts.style.cssText = 'color: #aaa; font-size: 14px; margin: 0;';
            noGifts.textContent = 'プレゼントできるアイテムがありません';
            this.giftList.appendChild(noGifts);
        }
    }
    
    giveGift(itemId) {
        const giftData = this.giftableItems[itemId];
        if (!giftData) return;
        
        // アイテムを消費
        if (this.game.inventorySystem) {
            this.game.inventorySystem.removeItem(itemId);
        }
        
        // ルナの反応
        this.companionSystem.showMessage(giftData.response, 5000, giftData.voiceType);
        this.companionSystem.increaseTrust(giftData.trustBonus);
        
        // 特別なエフェクト
        this.showGiftEffect();
        
        this.toggleGiftMenu();
        this.lastInteractionTime = Date.now();
    }
    
    showGiftEffect() {
        const hearts = [];
        for (let i = 0; i < 5; i++) {
            const heart = document.createElement('div');
            heart.style.cssText = `
                position: fixed;
                left: ${20 + Math.random() * 60}px;
                top: 50%;
                font-size: 30px;
                z-index: 3000;
                animation: floatUp 2s ease-out;
            `;
            heart.textContent = '💖';
            document.body.appendChild(heart);
            hearts.push(heart);
            
            setTimeout(() => {
                document.body.removeChild(heart);
            }, 2000);
        }
    }
    
    takePhotoTogether() {
        this.closeInteractionMenu();
        
        // カメラエフェクト
        const flash = document.createElement('div');
        flash.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: white;
            z-index: 5000;
            opacity: 0;
        `;
        document.body.appendChild(flash);
        
        // カウントダウン
        let count = 3;
        const countdown = document.createElement('div');
        countdown.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            font-size: 72px;
            color: white;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.8);
            z-index: 4000;
        `;
        document.body.appendChild(countdown);
        
        const countInterval = setInterval(() => {
            countdown.textContent = count;
            count--;
            
            if (count < 0) {
                clearInterval(countInterval);
                document.body.removeChild(countdown);
                
                // フラッシュ
                flash.style.opacity = '1';
                setTimeout(() => {
                    flash.style.transition = 'opacity 0.5s';
                    flash.style.opacity = '0';
                    setTimeout(() => {
                        document.body.removeChild(flash);
                    }, 500);
                }, 100);
                
                // 写真撮影成功
                this.companionSystem.showMessage(
                    'いい写真が撮れたね！この瞬間、ずっと覚えてる♪',
                    5000,
                    'photo_success'
                );
                this.companionSystem.increaseTrust(3);
                
                // スクリーンショットを保存（実装は省略）
                this.saveScreenshot();
            }
        }, 1000);
        
        this.lastInteractionTime = Date.now();
    }
    
    saveScreenshot() {
        // Canvas要素からスクリーンショットを作成
        // 実際の実装では、Three.jsのrendererからイメージを取得
        console.log('Screenshot saved!');
    }
    
    startMiniGame() {
        this.closeInteractionMenu();
        
        // ミニゲームの実装（じゃんけんなど）
        this.companionSystem.showMessage(
            'じゃんけんしよう！じゃーんけーん...',
            3000
        );
        
        // 簡易的なじゃんけんゲーム
        setTimeout(() => {
            const choices = ['グー', 'チョキ', 'パー'];
            const lunaChoice = choices[Math.floor(Math.random() * 3)];
            
            this.companionSystem.showMessage(
                `${lunaChoice}！`,
                3000
            );
            
            // プレイヤーの選択UI（省略）
            this.companionSystem.increaseTrust(1);
        }, 3500);
        
        this.lastInteractionTime = Date.now();
    }
    
    applyDialogueEffect(effect) {
        switch (effect) {
            case 'combatTip':
                // 一時的に命中率アップ
                if (this.game.player) {
                    this.game.player.accuracy = (this.game.player.accuracy || 1) * 1.2;
                    setTimeout(() => {
                        this.game.player.accuracy /= 1.2;
                    }, 60000); // 1分間
                }
                break;
        }
    }
    
    checkSpecialEvents() {
        // 誕生日チェック
        const today = new Date();
        const dateStr = `${(today.getMonth() + 1).toString().padStart(2, '0')}-${today.getDate().toString().padStart(2, '0')}`;
        
        if (this.specialEvents.birthday.date === dateStr && !this.specialEvents.birthday.triggered) {
            this.specialEvents.birthday.triggered = true;
            this.companionSystem.showMessage(
                this.specialEvents.birthday.dialogue,
                6000,
                'birthday'
            );
            this.companionSystem.increaseTrust(this.specialEvents.birthday.trustBonus);
        }
        
        // 長時間会っていない
        if (this.specialEvents.longTime.condition()) {
            this.companionSystem.showMessage(
                this.specialEvents.longTime.dialogue,
                4000,
                'greeting'  // 'long_time'は存在しないので'greeting'を使用
            );
            this.companionSystem.increaseTrust(this.specialEvents.longTime.trustBonus);
        }
    }
    
    closeInteractionMenu() {
        this.interactionMenu.style.display = 'none';
        this.game.isPaused = false;
    }
    
    update(deltaTime) {
        // 特殊イベントのチェック
        if (Math.random() < 0.001) { // 低確率でチェック
            this.checkSpecialEvents();
        }
    }
}

// CSSアニメーション
const style = document.createElement('style');
style.textContent = `
    @keyframes floatUp {
        0% {
            transform: translateY(0) scale(0);
            opacity: 1;
        }
        50% {
            transform: translateY(-100px) scale(1);
        }
        100% {
            transform: translateY(-200px) scale(0.5);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);