// 地球脱出シーケンス
export class EarthEscapeSequence {
    constructor(game) {
        this.game = game;
        this.isActive = false;
        this.phase = 0;
        this.phaseStartTime = 0;
        this.hasShownFirstEnemy = false;
    }
    
    start() {
        this.isActive = true;
        this.phase = 0;
        this.phaseStartTime = Date.now();
        
        // 最初の敵スポーンを遅らせる
        if (this.game.waveManager) {
            this.game.waveManager.enabled = false;
        }
        
        // ボイスシステムを使って緊急メッセージ
        if (this.game.voiceSystem) {
            this.game.voiceSystem.play('emergency');
        }
        
        // フェーズ1: 緊急脱出メッセージ
        this.showEscapeMessage();
    }
    
    showEscapeMessage() {
        // 画面上部に緊急メッセージ
        const alertContainer = document.createElement('div');
        alertContainer.className = 'escape-alert';
        alertContainer.style.cssText = `
            position: fixed;
            top: 100px;
            left: 50%;
            transform: translateX(-50%);
            background: linear-gradient(45deg, rgba(255, 0, 0, 0.9), rgba(200, 0, 0, 0.9));
            border: 2px solid #ff0000;
            border-radius: 10px;
            padding: 20px 40px;
            color: white;
            font-size: 24px;
            font-weight: bold;
            z-index: 1500;
            animation: alertPulse 1s infinite;
            text-align: center;
            max-width: 600px;
        `;
        
        alertContainer.innerHTML = `
            <div style="color: #ffaa00; font-size: 28px; margin-bottom: 10px;">
                ⚠️ 緊急事態発生 ⚠️
            </div>
            <div>地球防衛軍本部より緊急通達</div>
            <div style="font-size: 20px; margin-top: 10px;">
                ヴォイド艦隊が地球圏に侵入！<br>
                全パイロットは直ちに脱出せよ！
            </div>
        `;
        
        // アニメーションスタイル
        const style = document.createElement('style');
        style.textContent = `
            @keyframes alertPulse {
                0% { box-shadow: 0 0 20px rgba(255, 0, 0, 0.5); }
                50% { box-shadow: 0 0 40px rgba(255, 0, 0, 0.8); }
                100% { box-shadow: 0 0 20px rgba(255, 0, 0, 0.5); }
            }
            
            @keyframes shakeCamera {
                0%, 100% { transform: translateX(0); }
                25% { transform: translateX(-5px); }
                75% { transform: translateX(5px); }
            }
        `;
        document.head.appendChild(style);
        document.body.appendChild(alertContainer);
        
        // 5秒後にストーリーダイアログを開始
        setTimeout(() => {
            alertContainer.style.opacity = '0';
            alertContainer.style.transition = 'opacity 1s';
            setTimeout(() => alertContainer.remove(), 1000);
            
            this.startStoryDialogue();
        }, 5000);
    }
    
    startStoryDialogue() {
        // ストーリーダイアログで状況説明
        if (this.game.storyDialogueSystem) {
            const dialogue = {
                character: 'ナレーター',
                lines: [
                    "西暦2157年、人類は宇宙へと進出し、数多くの惑星に植民地を築いていた。",
                    "しかし、深宇宙から現れた謎の侵略者「ヴォイド」により、平和は打ち砕かれた。",
                    "あなたは地球防衛軍の新人パイロット。今、地球が襲撃を受けている！",
                    "司令部からの通信：「緊急発進！敵の第一波が接近中だ！」"
                ]
            };
            
            this.game.storyDialogueSystem.startDialogue(dialogue, () => {
                this.showFirstEnemyWarning();
            });
        } else {
            // フォールバック
            this.showFirstEnemyWarning();
        }
    }
    
    showFirstEnemyWarning() {
        // 敵接近警告
        const warningContainer = document.createElement('div');
        warningContainer.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(0, 0, 0, 0.9);
            border: 3px solid #ff0000;
            border-radius: 20px;
            padding: 40px;
            color: white;
            font-size: 32px;
            font-weight: bold;
            z-index: 2000;
            text-align: center;
            animation: warningFlash 0.5s infinite;
        `;
        
        warningContainer.innerHTML = `
            <div style="color: #ff0000; font-size: 48px; margin-bottom: 20px;">
                ⚠️ WARNING ⚠️
            </div>
            <div>敵機接近！</div>
            <div style="font-size: 24px; margin-top: 10px; color: #ffaa00;">
                戦闘準備！
            </div>
        `;
        
        const warningStyle = document.createElement('style');
        warningStyle.textContent = `
            @keyframes warningFlash {
                0%, 100% { opacity: 1; }
                50% { opacity: 0.7; }
            }
        `;
        document.head.appendChild(warningStyle);
        document.body.appendChild(warningContainer);
        
        // 警告音
        if (this.game.soundManager) {
            this.game.soundManager.play('alarm');
        }
        
        // 3秒後に最初の敵を出現させる
        setTimeout(() => {
            warningContainer.style.opacity = '0';
            warningContainer.style.transition = 'opacity 0.5s';
            setTimeout(() => {
                warningContainer.remove();
                warningStyle.remove();
            }, 500);
            
            this.spawnFirstEnemies();
        }, 3000);
    }
    
    spawnFirstEnemies() {
        // チュートリアル的な最初の敵
        this.hasShownFirstEnemy = true;
        
        // ルナからの通信
        if (this.game.companionSystem && this.game.companionSystem.isActive) {
            this.game.companionSystem.speak("敵機確認！気をつけて！");
        }
        
        // 少数の敵をスポーン（チュートリアル用）
        if (this.game.waveManager) {
            // 最初は敵を少なくする
            this.game.waveManager.enemiesPerWave = 2;
            this.game.waveManager.enabled = true;
            this.game.waveManager.startNextWave();
            
            // 通常のウェーブシステムに戻す
            setTimeout(() => {
                this.game.waveManager.enemiesPerWave = 3;
                this.isActive = false;
            }, 10000);
        }
        
        // 戦闘のヒントを表示
        this.showCombatHint();
    }
    
    showCombatHint() {
        const hintContainer = document.createElement('div');
        hintContainer.style.cssText = `
            position: fixed;
            bottom: 150px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(0, 50, 100, 0.9);
            border: 2px solid #00aaff;
            border-radius: 10px;
            padding: 20px 30px;
            color: white;
            font-size: 18px;
            z-index: 1000;
            animation: fadeIn 1s;
            max-width: 500px;
            text-align: center;
        `;
        
        hintContainer.innerHTML = `
            <div style="color: #00ffff; font-weight: bold; margin-bottom: 10px;">
                💡 戦闘のヒント
            </div>
            <div>
                マウスで照準を合わせて、左クリックまたはスペースキーで射撃！<br>
                WASDキーで移動、Shiftでブースト！
            </div>
        `;
        
        const hintStyle = document.createElement('style');
        hintStyle.textContent = `
            @keyframes fadeIn {
                from { opacity: 0; transform: translate(-50%, 20px); }
                to { opacity: 1; transform: translate(-50%, 0); }
            }
        `;
        document.head.appendChild(hintStyle);
        document.body.appendChild(hintContainer);
        
        // 10秒後に自動的に消す
        setTimeout(() => {
            hintContainer.style.opacity = '0';
            hintContainer.style.transition = 'opacity 1s';
            setTimeout(() => {
                hintContainer.remove();
                hintStyle.remove();
            }, 1000);
        }, 10000);
    }
    
    // 地球の背景に爆発エフェクトを追加
    addEarthExplosions() {
        // 地球の近くにランダムな爆発エフェクトを追加
        const explosionInterval = setInterval(() => {
            if (!this.isActive) {
                clearInterval(explosionInterval);
                return;
            }
            
            // ランダムな位置に爆発エフェクトを生成
            const angle = Math.random() * Math.PI * 2;
            const distance = 150 + Math.random() * 50;
            const x = Math.cos(angle) * distance;
            const z = Math.sin(angle) * distance;
            const y = (Math.random() - 0.5) * 100;
            
            // 爆発エフェクト（パーティクルシステムを使用）
            if (this.game.explosionEffect) {
                this.game.explosionEffect.explode({ x, y, z });
            }
        }, 2000);
    }
}