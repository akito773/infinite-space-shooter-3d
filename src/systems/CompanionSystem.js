export class CompanionSystem {
    constructor(game) {
        this.game = game;
        this.companion = null;
        this.isActive = false;
        this.communicationUI = null;
        this.lastMessageTime = 0;
        this.messageQueue = [];
        this.relationshipLevel = 0; // 0-100
        
        // ボイス再生用インデックス管理
        this.lastVoiceIndex = {
            greetings: -1,
            combatComments: -1,
            discoveryComments: -1,
            bossComments: -1,
            casualTalk: -1
        };
        
        this.initializeLuna();
        this.createUI();
    }
    
    initializeLuna() {
        this.companion = {
            name: 'Luna',
            fullName: 'Luna Skywalker',
            title: 'Information Broker',
            faction: 'Stardust Guild',
            personality: 'cheerful',
            avatar: '/images/characters/luna_avatar.png',
            
            // 会話パターン
            greetings: [
                "よー！元気にしてた？",
                "おつかれさま！今日はどんな冒険してるの？",
                "あら、タイミングいいじゃない！",
                "お疲れ様！何か面白い情報ない？"
            ],
            
            combatComments: [
                "その調子その調子！",
                "うわー、派手にやってるわね〜",
                "気をつけて！敵が多いよ！",
                "ナイスファイト！私も見習わなきゃ",
                "すごいじゃない！流石ね！"
            ],
            
            discoveryComments: [
                "おお！何か見つけた？",
                "面白そうな場所ね〜",
                "これは珍しいものを発見したわね！",
                "情報料もらっちゃおうかな〜♪"
            ],
            
            bossComments: [
                "うっわー！デカいのが出てきた！",
                "負けちゃダメよ！応援してるから！",
                "こんなのと戦うなんて...無茶しないでよ〜",
                "頑張って！私も祈ってるから！"
            ],
            
            casualTalk: [
                "そういえば、新しい酒場ができたって聞いたわ",
                "最近宇宙が騒がしいと思わない？",
                "今度一緒に飲みに行きましょうよ〜",
                "あなたの機体、カッコいいわね！",
                "ギルドでも噂になってるのよ、あなたのこと"
            ],
            
            // 追加の反応
            itemPickup: [
                "いいもの拾ったわね！",
                "それ、結構レアよ〜",
                "ラッキー！",
                "おめでとう〜♪"
            ],
            
            lowHealth: [
                "大丈夫！？無理しないで！",
                "ちょっと危ないよ！修理した方がいいかも",
                "心配だなぁ...気をつけて！"
            ],
            
            speedBoost: [
                "うわっ、速い速い！",
                "ブースト気持ちよさそう〜",
                "私も飛びたいな〜"
            ],
            
            longFlight: [
                "長旅お疲れ様〜",
                "そろそろ休憩する？",
                "景色きれいね〜"
            ]
        };
    }
    
    createUI() {
        // 通信UI作成
        this.communicationUI = document.createElement('div');
        this.communicationUI.id = 'communication-ui';
        this.communicationUI.style.cssText = `
            position: fixed;
            top: 20px;
            left: 20px;
            width: 350px;
            background: rgba(0, 20, 40, 0.9);
            border: 2px solid #00aaff;
            border-radius: 15px;
            padding: 15px;
            font-family: 'Arial', sans-serif;
            color: white;
            display: none;
            z-index: 1000;
            box-shadow: 0 0 20px rgba(0, 170, 255, 0.5);
        `;
        
        // アバター部分
        const avatar = document.createElement('div');
        avatar.style.cssText = `
            display: flex;
            align-items: center;
            margin-bottom: 10px;
        `;
        
        const avatarImg = document.createElement('div');
        avatarImg.style.cssText = `
            width: 50px;
            height: 50px;
            background: url('${import.meta.env.BASE_URL}assets/luna_avatar.png') center center / cover;
            border-radius: 50%;
            margin-right: 15px;
            border: 2px solid #ff6b9d;
            box-shadow: 0 0 10px rgba(255, 107, 157, 0.5);
        `;
        
        const nameTag = document.createElement('div');
        nameTag.innerHTML = `
            <div style="font-weight: bold; color: #00aaff; font-size: 16px;">Luna</div>
            <div style="font-size: 12px; color: #aaa;">Stardust Guild</div>
        `;
        
        avatar.appendChild(avatarImg);
        avatar.appendChild(nameTag);
        
        // メッセージエリア
        this.messageArea = document.createElement('div');
        this.messageArea.style.cssText = `
            background: rgba(0, 0, 0, 0.3);
            padding: 10px;
            border-radius: 10px;
            min-height: 60px;
            font-size: 14px;
            line-height: 1.4;
            border-left: 3px solid #00aaff;
        `;
        
        // 信頼度バー
        this.trustBar = document.createElement('div');
        this.trustBar.style.cssText = `
            margin-top: 10px;
            font-size: 12px;
            color: #aaa;
        `;
        
        this.communicationUI.appendChild(avatar);
        this.communicationUI.appendChild(this.messageArea);
        this.communicationUI.appendChild(this.trustBar);
        
        document.body.appendChild(this.communicationUI);
        
        // 閉じるボタン
        const closeButton = document.createElement('button');
        closeButton.textContent = '✕';
        closeButton.style.cssText = `
            position: absolute;
            top: 5px;
            right: 10px;
            background: transparent;
            border: none;
            color: #aaa;
            cursor: pointer;
            font-size: 16px;
        `;
        closeButton.onclick = () => this.hideMessage();
        this.communicationUI.appendChild(closeButton);
    }
    
    activate() {
        this.isActive = true;
        const greetingIndex = Math.floor(Math.random() * this.companion.greetings.length);
        this.showMessage(this.companion.greetings[greetingIndex], 5000, 'greetings', greetingIndex);
        console.log('Companion Luna activated');
    }
    
    deactivate() {
        this.isActive = false;
        this.hideMessage();
    }
    
    showMessage(message, duration = 5000, voiceCategory = null, voiceIndex = null) {
        if (!this.isActive) return;
        
        this.messageArea.innerHTML = `<span style="color: #fff;">${message}</span>`;
        this.trustBar.innerHTML = `信頼度: ${this.relationshipLevel}/100 ⭐`;
        
        this.communicationUI.style.display = 'block';
        this.communicationUI.style.animation = 'slideIn 0.3s ease-out';
        
        // ボイス再生（VoiceSystemが存在する場合）
        if (voiceCategory && this.game.voiceSystem) {
            const categoryMap = {
                'greetings': 'greeting',
                'combatComments': 'combat',
                'discoveryComments': 'discovery',
                'bossComments': 'boss',
                'casualTalk': 'casual'
            };
            
            const mappedCategory = categoryMap[voiceCategory] || voiceCategory;
            
            // インデックスを管理して順番に再生
            if (voiceIndex === null && this.lastVoiceIndex[voiceCategory] !== undefined) {
                const messages = this.companion[voiceCategory];
                if (messages) {
                    this.lastVoiceIndex[voiceCategory] = (this.lastVoiceIndex[voiceCategory] + 1) % messages.length;
                    voiceIndex = this.lastVoiceIndex[voiceCategory];
                }
            }
            
            this.game.voiceSystem.playLunaVoice(mappedCategory, voiceIndex);
        }
        
        // 自動的に非表示
        setTimeout(() => {
            this.hideMessage();
        }, duration);
        
        this.lastMessageTime = Date.now();
    }
    
    hideMessage() {
        this.communicationUI.style.animation = 'slideOut 0.3s ease-in';
        setTimeout(() => {
            this.communicationUI.style.display = 'none';
        }, 300);
    }
    
    getRandomMessage(category) {
        const messages = this.companion[category];
        if (!messages || messages.length === 0) return "...";
        return messages[Math.floor(Math.random() * messages.length)];
    }
    
    onCombatStart() {
        if (!this.isActive) return;
        const message = this.getRandomMessage('combatComments');
        const index = this.companion.combatComments.indexOf(message);
        this.showMessage(message, 3000, 'combatComments', index);
        this.increaseTrust(1);
    }
    
    onDiscovery() {
        if (!this.isActive) return;
        const message = this.getRandomMessage('discoveryComments');
        const index = this.companion.discoveryComments.indexOf(message);
        this.showMessage(message, 4000, 'discoveryComments', index);
        this.increaseTrust(2);
    }
    
    onBossEncounter() {
        if (!this.isActive) return;
        const message = this.getRandomMessage('bossComments');
        const index = this.companion.bossComments.indexOf(message);
        this.showMessage(message, 6000, 'bossComments', index);
        this.increaseTrust(3);
    }
    
    onBossDefeat() {
        if (!this.isActive) return;
        this.showMessage("すっごーい！よくやったわ！これで宇宙がちょっと平和になったわね〜♪", 5000, 'boss_defeat');
        this.increaseTrust(5);
    }
    
    sendCasualMessage() {
        if (!this.isActive) return;
        if (Date.now() - this.lastMessageTime < 20000) return; // 20秒クールダウン（短縮）
        
        const message = this.getRandomMessage('casualTalk');
        const index = this.companion.casualTalk.indexOf(message);
        this.showMessage(message, 4000, 'casualTalk', index);
    }
    
    increaseTrust(amount) {
        this.relationshipLevel = Math.min(100, this.relationshipLevel + amount);
        
        // 特定の信頼度で特別なメッセージ
        if (this.relationshipLevel === 25) {
            this.showMessage("ありがと！あなたと話してると楽しいわ〜", 4000, 'trust_25');
            if (this.game.voiceSystem) {
                this.game.voiceSystem.playTrustLevelVoice(25);
            }
        } else if (this.relationshipLevel === 50) {
            this.showMessage("もうすっかり友達ね！今度ギルドに遊びに来てよ♪", 5000, 'trust_50');
            if (this.game.voiceSystem) {
                this.game.voiceSystem.playTrustLevelVoice(50);
            }
        } else if (this.relationshipLevel === 75) {
            this.showMessage("あなたって本当に頼りになるのね。私の一番の友達よ！", 5000, 'trust_75');
            if (this.game.voiceSystem) {
                this.game.voiceSystem.playTrustLevelVoice(75);
            }
        } else if (this.relationshipLevel === 100) {
            this.showMessage("最高のパートナーね！これからもずっとよろしく！", 6000, 'trust_100');
            if (this.game.voiceSystem) {
                this.game.voiceSystem.playTrustLevelVoice(100);
            }
        }
    }
    
    update(deltaTime) {
        if (!this.isActive) return;
        
        // ランダムな雑談（確率を上げる）
        if (Math.random() < 0.0003) { // 1/3333の確率で毎フレーム（3倍に増加）
            this.sendCasualMessage();
        }
        
        // 低HPチェック
        if (this.game.player && this.game.player.health < 30 && !this.lowHealthWarned) {
            this.onLowHealth();
            this.lowHealthWarned = true;
        } else if (this.game.player && this.game.player.health > 50) {
            this.lowHealthWarned = false;
        }
        
        // 長時間飛行チェック
        if (!this.flightStartTime) {
            this.flightStartTime = Date.now();
        }
        if (Date.now() - this.flightStartTime > 120000 && !this.longFlightCommented) { // 2分
            this.onLongFlight();
            this.longFlightCommented = true;
            this.flightStartTime = Date.now();
        }
    }
    
    // アイテム取得時の反応
    onItemPickup(itemType) {
        if (!this.isActive) return;
        // 確率で反応（すべてのアイテムに反応しない）
        if (Math.random() < 0.3) { // 30%の確率
            const message = this.getRandomMessage('itemPickup');
            const index = this.companion.itemPickup.indexOf(message);
            this.showMessage(message, 2500, 'itemPickup', index);
        }
    }
    
    // 低HP時の反応
    onLowHealth() {
        if (!this.isActive) return;
        const message = this.getRandomMessage('lowHealth');
        const index = this.companion.lowHealth.indexOf(message);
        this.showMessage(message, 4000, 'lowHealth', index);
    }
    
    // ブースト使用時の反応
    onSpeedBoost() {
        if (!this.isActive) return;
        // 確率で反応
        if (Math.random() < 0.2) { // 20%の確率
            const message = this.getRandomMessage('speedBoost');
            const index = this.companion.speedBoost.indexOf(message);
            this.showMessage(message, 3000, 'speedBoost', index);
        }
    }
    
    // 長時間飛行時の反応
    onLongFlight() {
        if (!this.isActive) return;
        const message = this.getRandomMessage('longFlight');
        const index = this.companion.longFlight.indexOf(message);
        this.showMessage(message, 4000, 'longFlight', index);
        this.longFlightCommented = false;
    }
    
    // 酒場で出会うイベント
    triggerTavernMeeting() {
        return {
            title: "宇宙ステーション - 「流れ星」酒場",
            dialogue: [
                {
                    speaker: "Luna",
                    text: "あら、見ない顔ね。新人さん？私、ルナよ。情報なら何でも知ってるわ〜",
                    avatar: "luna"
                },
                {
                    speaker: "Luna", 
                    text: "ここは「流れ星」酒場。宇宙で一番美味しいお酒が飲めるのよ♪",
                    avatar: "luna"
                },
                {
                    speaker: "Luna",
                    text: "あなた、面白そうね！今度一緒に飲みましょう。通信コード交換しない？",
                    avatar: "luna"
                },
                {
                    speaker: "System",
                    text: "ルナの通信コードを入手しました。今後、冒険中に連絡を取れるようになります。",
                    avatar: "system"
                }
            ]
        };
    }
}

// CSSアニメーション追加
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(-100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(-100%); opacity: 0; }
    }
`;
document.head.appendChild(style);