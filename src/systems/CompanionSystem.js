export class CompanionSystem {
    constructor(game) {
        this.game = game;
        this.companion = null;
        this.isActive = false;
        this.communicationUI = null;
        this.lastMessageTime = 0;
        this.messageQueue = [];
        this.relationshipLevel = 0; // 0-100
        
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
            background: url('/infinite-space-shooter-3d/assets/luna_avatar.png') center center / cover;
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
        this.showMessage(this.getRandomMessage('greetings'));
        console.log('Companion Luna activated');
    }
    
    deactivate() {
        this.isActive = false;
        this.hideMessage();
    }
    
    showMessage(message, duration = 5000) {
        if (!this.isActive) return;
        
        this.messageArea.innerHTML = `<span style="color: #fff;">${message}</span>`;
        this.trustBar.innerHTML = `信頼度: ${this.relationshipLevel}/100 ⭐`;
        
        this.communicationUI.style.display = 'block';
        this.communicationUI.style.animation = 'slideIn 0.3s ease-out';
        
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
        this.showMessage(this.getRandomMessage('combatComments'), 3000);
        this.increaseTrust(1);
    }
    
    onDiscovery() {
        if (!this.isActive) return;
        this.showMessage(this.getRandomMessage('discoveryComments'), 4000);
        this.increaseTrust(2);
    }
    
    onBossEncounter() {
        if (!this.isActive) return;
        this.showMessage(this.getRandomMessage('bossComments'), 6000);
        this.increaseTrust(3);
    }
    
    onBossDefeat() {
        if (!this.isActive) return;
        this.showMessage("すっごーい！よくやったわ！これで宇宙がちょっと平和になったわね〜♪", 5000);
        this.increaseTrust(5);
    }
    
    sendCasualMessage() {
        if (!this.isActive) return;
        if (Date.now() - this.lastMessageTime < 30000) return; // 30秒クールダウン
        
        this.showMessage(this.getRandomMessage('casualTalk'), 4000);
    }
    
    increaseTrust(amount) {
        this.relationshipLevel = Math.min(100, this.relationshipLevel + amount);
        
        // 特定の信頼度で特別なメッセージ
        if (this.relationshipLevel === 25) {
            this.showMessage("ありがと！あなたと話してると楽しいわ〜", 4000);
        } else if (this.relationshipLevel === 50) {
            this.showMessage("もうすっかり友達ね！今度ギルドに遊びに来てよ♪", 5000);
        } else if (this.relationshipLevel === 75) {
            this.showMessage("あなたって本当に頼りになるのね。私の一番の友達よ！", 5000);
        } else if (this.relationshipLevel === 100) {
            this.showMessage("最高のパートナーね！これからもずっとよろしく！", 6000);
        }
    }
    
    update(deltaTime) {
        if (!this.isActive) return;
        
        // ランダムな雑談（低確率）
        if (Math.random() < 0.0001) { // 1/10000の確率で毎フレーム
            this.sendCasualMessage();
        }
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