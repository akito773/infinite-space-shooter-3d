import { AdventureUI } from './AdventureUI.js';

export class EarthEscapeSequence {
    constructor(game) {
        this.game = game;
        this.adventureUI = new AdventureUI(game);
        this.isCompleted = false;
    }
    
    start() {
        // ゲームを一時停止
        this.game.isPaused = true;
        
        // 敵のスポーンを停止
        if (this.game.waveManager) {
            this.game.waveManager.isActive = false;
        }
        
        // BGMを変更（緊急事態の雰囲気）
        if (this.game.soundManager) {
            this.game.soundManager.playBGM('emergency');
        }
        
        this.showInitialBriefing();
    }
    
    showInitialBriefing() {
        const scene = {
            background: 'bg_commander_office',
            characters: []
        };
        
        this.adventureUI.show(scene);
        
        const dialogues = [
            {
                text: '警報が鳴り響く中、緊急通信が入る。'
            },
            {
                character: 'commander',
                name: '総統',
                text: 'パイロット！緊急事態だ！',
                sprite: 'commander_urgent'
            },
            {
                character: 'commander',
                name: '総統',
                text: 'ヴォイドの大群が地球に接近している！',
                sprite: 'commander_serious'
            },
            {
                character: 'commander',
                name: '総統',
                text: '防衛ラインは既に突破された...もはや地球は持たない。',
                sprite: 'commander_sad'
            },
            {
                character: 'player',
                text: '総統！市民の避難は！？'
            },
            {
                character: 'commander',
                name: '総統',
                text: '避難船の護衛は別部隊が担当している。',
                sprite: 'commander_serious'
            },
            {
                character: 'commander',
                name: '総統',
                text: '君には別の任務がある。我々の希望を託したい。',
                sprite: 'commander_normal'
            }
        ];
        
        this.adventureUI.showDialogue(dialogues, () => {
            this.showMissionChoice();
        });
    }
    
    showMissionChoice() {
        const dialogues = [
            {
                character: 'commander',
                name: '総統',
                text: '君には最新鋭の試作機「スターファイター」を託す。',
                sprite: 'commander_normal'
            },
            {
                character: 'commander',
                name: '総統',
                text: 'この機体には、我々の全ての技術が詰まっている。',
                sprite: 'commander_proud'
            },
            {
                character: 'commander',
                name: '総統',
                text: '生き延びて、人類の希望となってくれ。',
                sprite: 'commander_serious'
            }
        ];
        
        const choices = [
            {
                text: '了解しました！必ず生き延びて見せます！',
                action: () => this.acceptMission()
            },
            {
                text: 'でも、地球を見捨てるなんて...',
                action: () => this.hesitateAboutLeaving()
            }
        ];
        
        dialogues.push({
            character: 'commander',
            name: '総統',
            text: '決断の時だ。どうする？',
            sprite: 'commander_serious',
            choices: choices
        });
        
        this.adventureUI.showDialogue(dialogues);
    }
    
    acceptMission() {
        const dialogues = [
            {
                character: 'commander',
                name: '総統',
                text: 'よく言った。その覚悟があれば大丈夫だ。',
                sprite: 'commander_proud'
            },
            {
                character: 'commander',
                name: '総統',
                text: '格納庫で準備を整えろ。時間がない！',
                sprite: 'commander_urgent'
            }
        ];
        
        this.adventureUI.showDialogue(dialogues, () => {
            this.showHangarScene();
        });
    }
    
    hesitateAboutLeaving() {
        const dialogues = [
            {
                character: 'commander',
                name: '総統',
                text: '気持ちは分かる...私も同じ思いだ。',
                sprite: 'commander_sad'
            },
            {
                character: 'commander',
                name: '総統',
                text: 'だが、全滅しては元も子もない。',
                sprite: 'commander_serious'
            },
            {
                character: 'commander',
                name: '総統',
                text: '君が生き延びることが、地球への最大の貢献だ。',
                sprite: 'commander_normal'
            },
            {
                character: 'player',
                text: '...分かりました。必ず戻ってきます。'
            }
        ];
        
        this.adventureUI.showDialogue(dialogues, () => {
            this.showHangarScene();
        });
    }
    
    showHangarScene() {
        const scene = {
            background: 'bg_hangar',
            characters: []
        };
        
        this.adventureUI.show(scene);
        
        const dialogues = [
            {
                text: '格納庫に到着すると、整備士たちが慌ただしく動き回っている。'
            },
            {
                character: 'mechanic',
                name: '整備主任',
                text: 'パイロット！機体の準備は完了しています！',
                sprite: 'mechanic_normal'
            },
            {
                character: 'mechanic',
                name: '整備主任',
                text: '武装は最大積載、シールドも強化済みです。',
                sprite: 'mechanic_proud'
            },
            {
                text: '突然、通信機から声が聞こえる。'
            },
            {
                character: 'luna',
                name: '???',
                text: 'あの...聞こえますか？',
                sprite: 'luna_comm'
            },
            {
                character: 'luna',
                name: '???',
                text: '私、ルナといいます。ギルドのオペレーターです。',
                sprite: 'luna_nervous'
            },
            {
                character: 'luna',
                name: 'ルナ',
                text: 'これから、あなたのナビゲーションを担当させていただきます。',
                sprite: 'luna_normal'
            }
        ];
        
        const choices = [
            {
                text: 'よろしく、ルナ。頼りにしてるよ。',
                action: () => this.greetLunaWarmly()
            },
            {
                text: 'ギルド？軍の通信士じゃないのか？',
                action: () => this.askAboutGuild()
            }
        ];
        
        dialogues.push({
            character: 'luna',
            name: 'ルナ',
            text: 'えっと...初めてなので緊張してますが、よろしくお願いします！',
            sprite: 'luna_shy',
            choices: choices
        });
        
        this.adventureUI.showDialogue(dialogues);
    }
    
    greetLunaWarmly() {
        const dialogues = [
            {
                character: 'luna',
                name: 'ルナ',
                text: 'あ、ありがとうございます！頑張ります！',
                sprite: 'luna_happy'
            },
            {
                character: 'luna',
                name: 'ルナ',
                text: '発進シークエンスを開始します。',
                sprite: 'luna_normal'
            }
        ];
        
        this.adventureUI.showDialogue(dialogues, () => {
            this.showLaunchSequence();
        });
    }
    
    askAboutGuild() {
        const dialogues = [
            {
                character: 'luna',
                name: 'ルナ',
                text: 'はい、民間協力という形で...軍の通信システムは既に...',
                sprite: 'luna_sad'
            },
            {
                character: 'mechanic',
                name: '整備主任',
                text: '詳しい話は後だ！時間がない！',
                sprite: 'mechanic_urgent'
            },
            {
                character: 'luna',
                name: 'ルナ',
                text: 'そ、そうですね！発進準備を始めます！',
                sprite: 'luna_surprised'
            }
        ];
        
        this.adventureUI.showDialogue(dialogues, () => {
            this.showLaunchSequence();
        });
    }
    
    showLaunchSequence() {
        // アドベンチャーUIを非表示
        this.adventureUI.hide();
        
        // メッセージ表示
        this.game.showMessage('発射シーケンス開始', 3000);
        
        // ルナのボイス
        if (this.game.companionSystem) {
            this.game.companionSystem.playVoice('launch_preparation');
        }
        
        // 3D発射シーケンスを開始
        setTimeout(() => {
            this.launchSequence3D.start(() => {
                this.onLaunchComplete();
            });
        }, 2000);
    }
    
    onLaunchComplete() {
        // 宇宙到達メッセージ
        this.game.showMessage('地球軌道を離脱しました', 3000);
        
        // ルナのボイス
        if (this.game.companionSystem) {
            this.game.companionSystem.playVoice('mission_start');
        }
        
        // エスケープシーケンス完了
        setTimeout(() => {
            this.completeEscapeSequence();
        }, 2000);
    }
    
    showLaunchSequence_old() {
        const dialogues = [
            {
                character: 'luna',
                name: 'ルナ',
                text: 'カタパルト接続完了。エンジン出力上昇中...',
                sprite: 'luna_focused'
            },
            {
                text: '機体が振動し始める。エンジンの轟音が格納庫に響き渡る。'
            },
            {
                character: 'luna',
                name: 'ルナ',
                text: 'すべてのシステム、グリーン！',
                sprite: 'luna_normal'
            },
            {
                character: 'luna',
                name: 'ルナ',
                text: '発進まで、10秒...',
                sprite: 'luna_serious'
            },
            {
                text: '外では爆発音が聞こえ、格納庫が揺れる。'
            },
            {
                character: 'commander',
                name: '総統',
                text: '（通信）もう時間がない！今すぐ発進しろ！',
                sprite: 'commander_urgent'
            },
            {
                character: 'luna',
                name: 'ルナ',
                text: '緊急発進シークエンス起動！3...2...1...',
                sprite: 'luna_urgent'
            },
            {
                character: 'luna',
                name: 'ルナ',
                text: '発進！！',
                sprite: 'luna_shout'
            }
        ];
        
        this.adventureUI.showDialogue(dialogues, () => {
            this.completeEscapeSequence();
        });
    }
    
    completeEscapeSequence() {
        // アドベンチャーUIを非表示
        this.adventureUI.hide();
        
        // フラグを立てる
        this.isCompleted = true;
        if (this.game.storyFlags) {
            this.game.storyFlags.hasCompletedEarthEscape = true;
            this.game.storyFlags.hasMetLuna = true;
        }
        
        // ルナをアクティブ化
        if (this.game.companionSystem) {
            this.game.companionSystem.activate();
        }
        
        // 発進エフェクト
        this.showLaunchEffect(() => {
            // ゲーム再開
            this.game.isPaused = false;
            
            // 敵のスポーンを遅延開始（プレイヤーに準備時間を与える）
            setTimeout(() => {
                if (this.game.waveManager) {
                    this.game.waveManager.isActive = true;
                    this.game.waveManager.startWave(1); // 最初は簡単なウェーブから
                }
            }, 5000); // 5秒後に敵が出現開始
            
            // ルナの最初のメッセージ
            if (this.game.companionSystem) {
                setTimeout(() => {
                    this.game.companionSystem.showMessage(
                        '発進成功！これから私がナビゲートします！',
                        4000,
                        'support'
                    );
                }, 1000);
                
                setTimeout(() => {
                    this.game.companionSystem.showMessage(
                        'レーダーに敵影！戦闘準備を！',
                        3000,
                        'warning'
                    );
                }, 4000);
            }
            
            // BGMを戦闘用に変更
            if (this.game.soundManager) {
                this.game.soundManager.playBGM('battle');
            }
        });
    }
    
    showLaunchEffect(callback) {
        // 発進エフェクト用のオーバーレイ
        const overlay = document.createElement('div');
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: white;
            z-index: 10000;
            opacity: 0;
            transition: opacity 0.3s;
        `;
        document.body.appendChild(overlay);
        
        // スピードライン
        const speedLines = document.createElement('div');
        speedLines.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: radial-gradient(ellipse at center, transparent 0%, rgba(0, 255, 255, 0.3) 100%);
            z-index: 9999;
            opacity: 0;
            animation: speedLineEffect 2s ease-out;
        `;
        document.body.appendChild(speedLines);
        
        // アニメーションスタイル
        const style = document.createElement('style');
        style.textContent = `
            @keyframes speedLineEffect {
                0% {
                    opacity: 0;
                    transform: scale(0.5);
                }
                50% {
                    opacity: 1;
                    transform: scale(1.5);
                }
                100% {
                    opacity: 0;
                    transform: scale(2);
                }
            }
        `;
        document.head.appendChild(style);
        
        // フラッシュエフェクト
        setTimeout(() => {
            overlay.style.opacity = '1';
        }, 10);
        
        setTimeout(() => {
            overlay.style.opacity = '0';
        }, 300);
        
        // クリーンアップとコールバック
        setTimeout(() => {
            document.body.removeChild(overlay);
            document.body.removeChild(speedLines);
            document.head.removeChild(style);
            if (callback) callback();
        }, 2000);
    }
}