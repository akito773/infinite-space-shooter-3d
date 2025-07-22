export class StoryProgressionSystem {
    constructor(game) {
        this.game = game;
        
        // ストーリー進行状態
        this.storyFlags = {
            tutorialComplete: false,
            firstWaveComplete: false,
            midBossDefeated: false,
            raidBossDefeated: false,
            marsUnlocked: false,
            dataFragmentsCollected: 0,
            voidOriginDiscovered: false,
            // 新しいストーリーフラグ
            hasMetLuna: false,
            darkNebulaEncountered: false,
            darkNebulaIdentityRevealed: false,
            jupiterUnlocked: false,
            saturnUnlocked: false,
            ancientSealCount: 0,
            lunaFatherSaved: false
        };
        
        // 現在のストーリーフェーズ
        this.currentPhase = 'EARTH_DEFENSE'; // EARTH_DEFENSE -> INVESTIGATION -> MARS_JOURNEY
        
        // ストーリーイベント
        this.storyEvents = {
            GAME_START: {
                triggered: false,
                dialogue: [
                    "警告：未知の敵性体「ヴォイド」が地球圏に侵入",
                    "全パイロットは迎撃態勢を取れ！",
                    "敵の目的は不明...だが、絶対に通すな！"
                ]
            },
            MID_BOSS_DEFEATED: {
                triggered: false,
                dialogue: [
                    "敵中型艦を撃破！",
                    "待て...敵艦からデータストリームを検出",
                    "これは...座標データ？火星方面を示している...",
                    "データフラグメント 1/3 を回収"
                ]
            },
            RAID_BOSS_DEFEATED: {
                triggered: false,
                dialogue: [
                    "超大型戦艦撃破！信じられない...",
                    "大量のデータを回収中...解析を開始",
                    "判明：ヴォイドは火星の古代遺跡を探している",
                    "データフラグメント 3/3 回収完了",
                    "火星への航路データが復元されました"
                ]
            },
            MARS_UNLOCKED: {
                triggered: false,
                dialogue: [
                    "火星コロニーから緊急信号を受信",
                    "「こちら火星研究施設...ヴォイドの攻撃を受けている」",
                    "「古代遺跡の防衛システムが...まだ生きて...」",
                    "信号途絶...急げ！火星へ向かうんだ！",
                    "新たな目的地：火星が解放されました"
                ]
            },
            WAVE_10_COMPLETE: {
                triggered: false,
                dialogue: [
                    "偵察部隊から報告",
                    "ヴォイドの増援が接近中...これは、まずい",
                    "データフラグメント 2/3 を敵残骸から回収"
                ]
            }
        };
        
        // ダイアログ表示用
        this.currentDialogue = null;
        this.dialogueIndex = 0;
        this.dialogueTimer = 0;
        this.dialogueDisplayTime = 4000; // 4秒表示
        
        this.createDialogueUI();
    }
    
    createDialogueUI() {
        // ストーリーダイアログ表示用UI
        const dialogueContainer = document.createElement('div');
        dialogueContainer.id = 'story-dialogue';
        dialogueContainer.style.cssText = `
            position: absolute;
            bottom: 150px;
            left: 50%;
            transform: translateX(-50%);
            width: 600px;
            background: linear-gradient(135deg, rgba(0,0,0,0.9), rgba(0,20,40,0.9));
            border: 2px solid #00ffff;
            border-radius: 10px;
            padding: 20px;
            display: none;
            z-index: 500;
            box-shadow: 0 0 30px rgba(0,255,255,0.5);
        `;
        
        const speaker = document.createElement('div');
        speaker.style.cssText = `
            color: #00ffff;
            font-size: 14px;
            margin-bottom: 10px;
            text-transform: uppercase;
            letter-spacing: 2px;
        `;
        speaker.textContent = 'SYSTEM MESSAGE';
        
        const dialogueText = document.createElement('div');
        dialogueText.style.cssText = `
            color: white;
            font-size: 18px;
            line-height: 1.5;
            text-shadow: 0 0 10px rgba(0,255,255,0.3);
        `;
        
        const skipHint = document.createElement('div');
        skipHint.style.cssText = `
            position: absolute;
            bottom: 5px;
            right: 10px;
            color: #666;
            font-size: 12px;
        `;
        skipHint.textContent = 'Press SPACE to continue';
        
        dialogueContainer.appendChild(speaker);
        dialogueContainer.appendChild(dialogueText);
        dialogueContainer.appendChild(skipHint);
        
        document.body.appendChild(dialogueContainer);
        
        this.dialogueUI = {
            container: dialogueContainer,
            speaker: speaker,
            text: dialogueText
        };
    }
    
    update(delta) {
        // ダイアログ表示の更新
        if (this.currentDialogue) {
            this.dialogueTimer += delta * 1000;
            
            if (this.dialogueTimer >= this.dialogueDisplayTime) {
                this.nextDialogue();
            }
        }
        
        // ストーリー進行チェック
        this.checkStoryProgress();
    }
    
    checkStoryProgress() {
        // ゲーム開始時
        if (!this.storyEvents.GAME_START.triggered && this.game.enemies && this.game.enemies.length > 0) {
            this.triggerStoryEvent('GAME_START');
        }
        
        // Wave 10 完了
        if (!this.storyEvents.WAVE_10_COMPLETE.triggered && 
            this.game.waveManager && this.game.waveManager.currentWave >= 10) {
            this.triggerStoryEvent('WAVE_10_COMPLETE');
            this.storyFlags.dataFragmentsCollected = 2;
        }
        
        // 火星解放チェック
        if (!this.storyFlags.marsUnlocked && 
            this.storyFlags.dataFragmentsCollected >= 3 &&
            this.storyFlags.raidBossDefeated) {
            this.unlockMars();
        }
    }
    
    onBossDefeated(bossType) {
        if (bossType === 'BossBattleship' && !this.storyFlags.midBossDefeated) {
            this.storyFlags.midBossDefeated = true;
            this.storyFlags.dataFragmentsCollected = 1;
            this.triggerStoryEvent('MID_BOSS_DEFEATED');
        } else if (bossType === 'RaidBoss' && !this.storyFlags.raidBossDefeated) {
            this.storyFlags.raidBossDefeated = true;
            this.storyFlags.dataFragmentsCollected = 3;
            this.triggerStoryEvent('RAID_BOSS_DEFEATED');
        }
    }
    
    unlockMars() {
        this.storyFlags.marsUnlocked = true;
        this.storyFlags.voidOriginDiscovered = true;
        this.currentPhase = 'INVESTIGATION';
        
        setTimeout(() => {
            this.triggerStoryEvent('MARS_UNLOCKED');
            
            // 火星を実際に解放
            if (this.game.onMarsUnlocked) {
                this.game.onMarsUnlocked();
            }
        }, 2000);
    }
    
    triggerStoryEvent(eventName) {
        const event = this.storyEvents[eventName];
        if (!event || event.triggered) return;
        
        event.triggered = true;
        this.showDialogue(event.dialogue);
    }
    
    showDialogue(dialogues) {
        this.currentDialogue = dialogues;
        this.dialogueIndex = 0;
        this.dialogueTimer = 0;
        
        this.displayCurrentDialogue();
    }
    
    displayCurrentDialogue() {
        if (!this.currentDialogue || this.dialogueIndex >= this.currentDialogue.length) {
            this.hideDialogue();
            return;
        }
        
        this.dialogueUI.container.style.display = 'block';
        this.dialogueUI.text.textContent = this.currentDialogue[this.dialogueIndex];
        
        // タイプライター効果（オプション）
        this.animateText();
    }
    
    animateText() {
        const fullText = this.dialogueUI.text.textContent;
        this.dialogueUI.text.textContent = '';
        let charIndex = 0;
        
        const typeInterval = setInterval(() => {
            if (charIndex < fullText.length) {
                this.dialogueUI.text.textContent += fullText[charIndex];
                charIndex++;
            } else {
                clearInterval(typeInterval);
            }
        }, 30);
    }
    
    nextDialogue() {
        this.dialogueIndex++;
        this.dialogueTimer = 0;
        
        if (this.dialogueIndex < this.currentDialogue.length) {
            this.displayCurrentDialogue();
        } else {
            this.hideDialogue();
        }
    }
    
    skipDialogue() {
        if (this.currentDialogue) {
            this.nextDialogue();
        }
    }
    
    hideDialogue() {
        this.dialogueUI.container.style.display = 'none';
        this.currentDialogue = null;
    }
    
    // セーブデータ
    serialize() {
        return {
            storyFlags: this.storyFlags,
            currentPhase: this.currentPhase,
            storyEvents: Object.keys(this.storyEvents).reduce((acc, key) => {
                acc[key] = { triggered: this.storyEvents[key].triggered };
                return acc;
            }, {})
        };
    }
    
    deserialize(data) {
        if (data.storyFlags) this.storyFlags = data.storyFlags;
        if (data.currentPhase) this.currentPhase = data.currentPhase;
        if (data.storyEvents) {
            Object.keys(data.storyEvents).forEach(key => {
                if (this.storyEvents[key]) {
                    this.storyEvents[key].triggered = data.storyEvents[key].triggered;
                }
            });
        }
    }
}