// 総統との会話システム

import { AdventureUI } from './AdventureUI.js';

export class CommanderDialogue {
    constructor(game) {
        this.game = game;
        this.adventureUI = new AdventureUI(game);
        
        // 会話の進行状態
        this.dialogueFlags = {
            hasReceivedFirstMission: false,
            hasCompletedEarthEscape: false,
            hasDiscussedDarkNebula: false,
            trustLevel: 0
        };
    }
    
    // 初回ミッションブリーフィング
    showFirstMissionBriefing() {
        const scene = {
            background: 'bg_commander_office',
            characters: [
                { id: 'commander', sprite: 'commander_serious' }
            ],
            dialogue: [
                {
                    speaker: '総統',
                    text: 'よく来た、パイロット。\n君を呼んだ理由は分かっているな？'
                },
                {
                    speaker: '総統',
                    text: '地球の状況は日に日に悪化している。\nダークネビュラの侵攻は、もはや止められない。'
                },
                {
                    speaker: '総統',
                    text: '我々に残された選択肢は一つ...\n「エクソダス計画」の実行だ。'
                },
                {
                    text: '総統はホログラムディスプレイを起動した。\n地球から外宇宙への脱出ルートが表示される。'
                },
                {
                    speaker: '総統',
                    text: '君には先遣隊として、脱出ルートの安全を確保してもらう。\n敵の防衛線を突破し、安全な航路を確立するのだ。'
                },
                {
                    speaker: '総統',
                    text: 'これは人類の存亡をかけた任務だ。\n失敗は許されない。',
                    choices: [
                        {
                            text: '承知しました。必ず成功させます。',
                            onSelect: () => this.acceptMissionWithDetermination()
                        },
                        {
                            text: '危険すぎます。別の方法は？',
                            onSelect: () => this.questionThePlan()
                        },
                        {
                            text: '援護はあるのですか？',
                            onSelect: () => this.askAboutSupport()
                        }
                    ]
                }
            ]
        };
        
        this.adventureUI.show(scene);
    }
    
    acceptMissionWithDetermination() {
        const scene = {
            background: 'bg_commander_office',
            characters: [
                { id: 'commander', sprite: 'commander_normal' }
            ],
            dialogue: [
                {
                    speaker: '総統',
                    text: 'その意気だ。\n君のような勇敢なパイロットがいて、心強い。'
                },
                {
                    speaker: '総統',
                    text: '出撃の準備が整い次第、連絡する。\nそれまでに機体の整備を済ませておけ。'
                },
                {
                    speaker: '総統',
                    text: '忘れるな。君の肩には、\n人類の未来がかかっている。'
                }
            ],
            onDialogueComplete: () => {
                this.dialogueFlags.hasReceivedFirstMission = true;
                this.dialogueFlags.trustLevel += 10;
                this.completeDialogue();
            }
        };
        
        this.adventureUI.show(scene);
    }
    
    questionThePlan() {
        const scene = {
            background: 'bg_commander_office',
            characters: [
                { id: 'commander', sprite: 'commander_serious' }
            ],
            dialogue: [
                {
                    speaker: '総統',
                    text: '...別の方法？\n君は状況を理解していないようだな。'
                },
                {
                    speaker: '総統',
                    text: '地球防衛軍の80%はすでに壊滅。\n残された時間はわずかだ。'
                },
                {
                    speaker: '総統',
                    text: 'これが最後のチャンスなのだ。\n理解したか？',
                    choices: [
                        {
                            text: '...分かりました。',
                            onSelect: () => this.acceptAfterExplanation()
                        },
                        {
                            text: 'それでも危険すぎます。',
                            onSelect: () => this.continueToDoubt()
                        }
                    ]
                }
            ]
        };
        
        this.adventureUI.show(scene);
    }
    
    askAboutSupport() {
        const scene = {
            background: 'bg_commander_office',
            characters: [
                { id: 'commander', sprite: 'commander_normal' }
            ],
            dialogue: [
                {
                    speaker: '総統',
                    text: '賢明な質問だ。\nもちろん、君一人で行かせるつもりはない。'
                },
                {
                    speaker: '総統',
                    text: '途中のチェックポイントで、\n協力者と合流できるよう手配している。'
                },
                {
                    speaker: '総統',
                    text: 'また、最新の装備とデータも提供する。\n準備は万全だ。'
                },
                {
                    speaker: '総統',
                    text: 'それでも、最終的には君の腕にかかっている。\n頼んだぞ。'
                }
            ],
            onDialogueComplete: () => {
                this.dialogueFlags.hasReceivedFirstMission = true;
                this.dialogueFlags.trustLevel += 5;
                this.completeDialogue();
            }
        };
        
        this.adventureUI.show(scene);
    }
    
    acceptAfterExplanation() {
        const scene = {
            background: 'bg_commander_office',
            characters: [
                { id: 'commander', sprite: 'commander_normal' }
            ],
            dialogue: [
                {
                    speaker: '総統',
                    text: 'よろしい。\n疑問を持つのは悪いことではない。'
                },
                {
                    speaker: '総統',
                    text: 'だが、今は行動の時だ。\n君の活躍に期待している。'
                }
            ],
            onDialogueComplete: () => {
                this.dialogueFlags.hasReceivedFirstMission = true;
                this.completeDialogue();
            }
        };
        
        this.adventureUI.show(scene);
    }
    
    continueToDoubt() {
        const scene = {
            background: 'bg_commander_office',
            characters: [
                { id: 'commander', sprite: 'commander_serious' }
            ],
            dialogue: [
                {
                    speaker: '総統',
                    text: '...そうか。\n臆病者に用はない。出て行け。'
                },
                {
                    text: '総統は背を向けた。'
                },
                {
                    speaker: '総統',
                    text: '待て。\n...君しかいないのだ。頼む。'
                }
            ],
            onDialogueComplete: () => {
                this.dialogueFlags.hasReceivedFirstMission = true;
                this.dialogueFlags.trustLevel -= 5;
                this.completeDialogue();
            }
        };
        
        this.adventureUI.show(scene);
    }
    
    // 地球脱出後の報告
    showPostEscapeDialogue() {
        const scene = {
            background: 'bg_commander_office',
            characters: [
                { id: 'commander', sprite: 'commander_normal' }
            ],
            dialogue: [
                {
                    speaker: '総統',
                    text: 'よくやった！\n君のおかげで脱出作戦は成功した。'
                },
                {
                    speaker: '総統',
                    text: '多くの民間船が無事に脱出できた。\n君は英雄だ。'
                },
                {
                    speaker: '総統',
                    text: 'だが、これで終わりではない。\n新たな任務がある。',
                    choices: [
                        {
                            text: '次は何をすれば？',
                            onSelect: () => this.askAboutNextMission()
                        },
                        {
                            text: '地球はどうなりますか？',
                            onSelect: () => this.askAboutEarth()
                        },
                        {
                            text: 'ダークネビュラについて教えてください',
                            onSelect: () => this.askAboutDarkNebula()
                        }
                    ]
                }
            ]
        };
        
        this.adventureUI.show(scene);
    }
    
    askAboutNextMission() {
        const scene = {
            background: 'bg_commander_office',
            characters: [
                { id: 'commander', sprite: 'commander_serious' }
            ],
            dialogue: [
                {
                    speaker: '総統',
                    text: '火星に前線基地を設立する。\nそこが我々の新たな拠点となる。'
                },
                {
                    speaker: '総統',
                    text: '君には先遣隊として、\n火星エリアの安全を確保してもらいたい。'
                },
                {
                    speaker: '総統',
                    text: '詳細は追って連絡する。\n準備を怠るな。'
                }
            ],
            onDialogueComplete: () => {
                this.dialogueFlags.hasCompletedEarthEscape = true;
                this.completeDialogue();
            }
        };
        
        this.adventureUI.show(scene);
    }
    
    askAboutEarth() {
        const scene = {
            background: 'bg_commander_office',
            characters: [
                { id: 'commander', sprite: 'commander_sad' }
            ],
            dialogue: [
                {
                    speaker: '総統',
                    text: '...地球は、もう持たないだろう。'
                },
                {
                    speaker: '総統',
                    text: 'ダークネビュラの侵食は止められない。\nあと数ヶ月で...'
                },
                {
                    speaker: '総統',
                    text: 'だからこそ、我々は新天地を見つけなければならない。\n人類の存続のために。'
                }
            ],
            onDialogueComplete: () => {
                this.completeDialogue();
            }
        };
        
        this.adventureUI.show(scene);
    }
    
    askAboutDarkNebula() {
        const scene = {
            background: 'bg_commander_office',
            characters: [
                { id: 'commander', sprite: 'commander_serious' }
            ],
            dialogue: [
                {
                    speaker: '総統',
                    text: 'ダークネビュラ...\n我々もその正体を完全には把握していない。'
                },
                {
                    speaker: '総統',
                    text: '分かっているのは、彼らが高度な知性を持ち、\n惑星を「侵食」する能力があるということだ。'
                },
                {
                    speaker: '総統',
                    text: '接触した者の多くは精神を侵され、\n敵に寝返ってしまう。'
                },
                {
                    speaker: '総統',
                    text: '君も気をつけろ。\n奴らの囁きに耳を貸してはならない。'
                }
            ],
            onDialogueComplete: () => {
                this.dialogueFlags.hasDiscussedDarkNebula = true;
                this.dialogueFlags.trustLevel += 10;
                this.completeDialogue();
            }
        };
        
        this.adventureUI.show(scene);
    }
    
    // 通常の会話
    showRegularDialogue() {
        const topics = [];
        
        // 利用可能な話題を追加
        if (!this.dialogueFlags.hasDiscussedDarkNebula) {
            topics.push({
                text: 'ダークネビュラについて',
                onSelect: () => this.askAboutDarkNebula()
            });
        }
        
        topics.push(
            {
                text: '任務の進捗を報告する',
                onSelect: () => this.reportProgress()
            },
            {
                text: '補給物資について',
                onSelect: () => this.askAboutSupplies()
            },
            {
                text: '他のパイロットの状況',
                onSelect: () => this.askAboutOtherPilots()
            },
            {
                text: '特に用はない',
                onSelect: () => this.completeDialogue()
            }
        );
        
        const scene = {
            background: 'bg_commander_office',
            characters: [
                { id: 'commander', sprite: 'commander_normal' }
            ],
            dialogue: [
                {
                    speaker: '総統',
                    text: '何か報告はあるか？',
                    choices: topics
                }
            ]
        };
        
        this.adventureUI.show(scene);
    }
    
    reportProgress() {
        // プレイヤーの進捗に応じた反応
        let response = '';
        
        if (this.game.achievementSystem) {
            const achievements = this.game.achievementSystem.getUnlockedCount();
            if (achievements > 10) {
                response = '素晴らしい成果だ。\n君の活躍は他のパイロットの模範となっている。';
            } else if (achievements > 5) {
                response = 'なかなかの成果だ。\nこの調子で続けてくれ。';
            } else {
                response = 'まだ始まったばかりだ。\n焦る必要はない。着実に進めろ。';
            }
        }
        
        const scene = {
            background: 'bg_commander_office',
            characters: [
                { id: 'commander', sprite: 'commander_normal' }
            ],
            dialogue: [
                {
                    speaker: '総統',
                    text: response
                }
            ],
            onDialogueComplete: () => this.showRegularDialogue()
        };
        
        this.adventureUI.show(scene);
    }
    
    askAboutSupplies() {
        const scene = {
            background: 'bg_commander_office',
            characters: [
                { id: 'commander', sprite: 'commander_serious' }
            ],
            dialogue: [
                {
                    speaker: '総統',
                    text: '補給物資は限られている。\n大切に使ってくれ。'
                },
                {
                    speaker: '総統',
                    text: '必要なものがあれば申請書を提出しろ。\n可能な限り対応する。'
                }
            ],
            onDialogueComplete: () => this.showRegularDialogue()
        };
        
        this.adventureUI.show(scene);
    }
    
    askAboutOtherPilots() {
        const scene = {
            background: 'bg_commander_office',
            characters: [
                { id: 'commander', sprite: 'commander_sad' }
            ],
            dialogue: [
                {
                    speaker: '総統',
                    text: '...多くの勇敢なパイロットを失った。'
                },
                {
                    speaker: '総統',
                    text: '生き残っている者たちは、\nそれぞれの任務を遂行している。'
                },
                {
                    speaker: '総統',
                    text: '君も気をつけろ。\n無謀な行動は避けるんだ。'
                }
            ],
            onDialogueComplete: () => this.showRegularDialogue()
        };
        
        this.adventureUI.show(scene);
    }
    
    completeDialogue() {
        this.adventureUI.hide();
        
        // 会話終了後の処理
        if (this.dialogueFlags.hasReceivedFirstMission && !this.game.storyFlags.hasReceivedFirstMission) {
            this.game.storyFlags.hasReceivedFirstMission = true;
            // ミッション開始のトリガー
            if (this.game.storySystem) {
                this.game.storySystem.startEarthEscapeSequence();
            }
        }
    }
}