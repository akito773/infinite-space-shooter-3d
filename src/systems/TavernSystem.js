// 酒場システム - アドベンチャーパート対応版

import { AdventureUI } from './AdventureUI.js';

export class TavernSystem {
    constructor(game) {
        this.game = game;
        this.adventureUI = new AdventureUI(game);
        
        // 酒場の状態
        this.visitCount = 0;
        this.hasMetLuna = false;
        this.availableCharacters = [];
        this.tavernEvents = [];
        
        // バーテンダーの情報
        this.bartenderMood = 'normal';
        this.bartenderInfo = [];
        
        this.setupTavernContent();
    }
    
    setupTavernContent() {
        // 酒場で出会えるキャラクター
        this.characters = {
            bartender: {
                id: 'bartender',
                name: 'マスター',
                description: '酒場のマスター。情報通で頼りになる',
                alwaysAvailable: true
            },
            luna: {
                id: 'luna',
                name: 'ルナ',
                description: '謎めいた女性パイロット',
                condition: () => !this.hasMetLuna && this.visitCount >= 1
            },
            veteran: {
                id: 'veteran',
                name: 'ベテランパイロット',
                description: '戦争を生き抜いた老兵',
                condition: () => Math.random() < 0.5
            },
            trader: {
                id: 'trader',
                name: '商人',
                description: '珍しいアイテムを扱う商人',
                condition: () => Math.random() < 0.3
            }
        };
        
        // ドリンクメニュー
        this.drinks = {
            beer: {
                name: 'スペースビール',
                price: 50,
                effect: 'HP回復+20',
                description: '宇宙でも変わらない味'
            },
            whiskey: {
                name: 'ネビュラウイスキー',
                price: 100,
                effect: 'エネルギー回復+50',
                description: '星雲の輝きを閉じ込めた一杯'
            },
            special: {
                name: '本日のスペシャル',
                price: 200,
                effect: 'ランダム効果',
                description: 'マスターの気まぐれカクテル'
            },
            coffee: {
                name: 'ブラックホールコーヒー',
                price: 30,
                effect: '集中力アップ',
                description: '眠気も吸い込む濃厚な一杯'
            }
        };
    }
    
    openTavern() {
        this.visitCount++;
        this.updateAvailableCharacters();
        
        // 初回訪問時の特別イベント
        if (this.visitCount === 1) {
            this.showFirstVisitScene();
        } else {
            this.showTavernMainMenu();
        }
    }
    
    showFirstVisitScene() {
        const scene = {
            background: 'bg_tavern',
            characters: [
                { id: 'bartender', sprite: 'bartender_normal' }
            ],
            dialogue: [
                {
                    speaker: 'マスター',
                    text: 'いらっしゃい。新顔だな。\nうちは「スターダスト」、この宇宙ステーションで一番の酒場さ。'
                },
                {
                    speaker: 'マスター',
                    text: '最近は物騒な話ばかりだが、ここでは誰もが平等だ。\n金さえ払えば、な。'
                },
                {
                    speaker: 'マスター',
                    text: '何か飲むかい？それとも情報が欲しいか？',
                    choices: [
                        {
                            text: '飲み物を頼む',
                            onSelect: () => this.showDrinkMenu()
                        },
                        {
                            text: '情報を聞く',
                            onSelect: () => this.askForInformation()
                        },
                        {
                            text: 'また今度にする',
                            onSelect: () => this.leaveTavern()
                        }
                    ]
                }
            ],
            onDialogueComplete: () => {
                // 会話終了後の処理
            }
        };
        
        this.adventureUI.show(scene);
    }
    
    showTavernMainMenu() {
        const availableChoices = [
            {
                text: 'マスターと話す',
                onSelect: () => this.talkToBartender()
            },
            {
                text: '飲み物を注文する',
                onSelect: () => this.showDrinkMenu()
            }
        ];
        
        // 利用可能なキャラクターを選択肢に追加
        this.availableCharacters.forEach(char => {
            if (char.id !== 'bartender') {
                availableChoices.push({
                    text: `${char.name}に話しかける`,
                    onSelect: () => this.talkToCharacter(char.id)
                });
            }
        });
        
        availableChoices.push({
            text: '酒場を出る',
            onSelect: () => this.leaveTavern()
        });
        
        const scene = {
            background: 'bg_tavern',
            characters: this.getCharacterSprites(),
            dialogue: [
                {
                    text: '薄暗い酒場の中、様々な人々が思い思いの時間を過ごしている。',
                    choices: availableChoices
                }
            ]
        };
        
        this.adventureUI.show(scene);
    }
    
    talkToBartender() {
        const dialogues = [
            {
                speaker: 'マスター',
                text: '何か用かい？'
            }
        ];
        
        // ランダムな情報を追加
        if (Math.random() < 0.7) {
            const info = this.getRandomBartenderInfo();
            dialogues.push({
                speaker: 'マスター',
                text: info
            });
        }
        
        dialogues.push({
            speaker: 'マスター',
            text: '他に何か聞きたいことはあるか？',
            choices: [
                {
                    text: '最近の噂を聞く',
                    onSelect: () => this.askForRumors()
                },
                {
                    text: '仕事の情報を聞く',
                    onSelect: () => this.askForJobs()
                },
                {
                    text: '特に用はない',
                    onSelect: () => this.showTavernMainMenu()
                }
            ]
        });
        
        const scene = {
            background: 'bg_tavern',
            characters: [
                { id: 'bartender', sprite: 'bartender_normal' }
            ],
            dialogue: dialogues
        };
        
        this.adventureUI.show(scene);
    }
    
    showDrinkMenu() {
        const drinkChoices = Object.entries(this.drinks).map(([key, drink]) => ({
            text: `${drink.name} (${drink.price}cr) - ${drink.description}`,
            onSelect: () => this.orderDrink(key)
        }));
        
        drinkChoices.push({
            text: 'やめておく',
            onSelect: () => this.showTavernMainMenu()
        });
        
        const scene = {
            background: 'bg_tavern',
            characters: [
                { id: 'bartender', sprite: 'bartender_normal' }
            ],
            dialogue: [
                {
                    speaker: 'マスター',
                    text: '何を飲む？',
                    choices: drinkChoices
                }
            ]
        };
        
        this.adventureUI.show(scene);
    }
    
    orderDrink(drinkKey) {
        const drink = this.drinks[drinkKey];
        
        // クレジットチェック
        if (this.game.inventorySystem.credits < drink.price) {
            const scene = {
                background: 'bg_tavern',
                characters: [
                    { id: 'bartender', sprite: 'bartender_normal' }
                ],
                dialogue: [
                    {
                        speaker: 'マスター',
                        text: '金が足りないようだな。\nツケは効かないぜ。'
                    }
                ],
                onDialogueComplete: () => this.showDrinkMenu()
            };
            
            this.adventureUI.show(scene);
            return;
        }
        
        // 支払い
        this.game.inventorySystem.credits -= drink.price;
        
        // 効果適用
        this.applyDrinkEffect(drinkKey);
        
        const scene = {
            background: 'bg_tavern',
            characters: [
                { id: 'bartender', sprite: 'bartender_normal' }
            ],
            dialogue: [
                {
                    speaker: 'マスター',
                    text: `${drink.name}だ。\nゆっくり味わってくれ。`
                },
                {
                    text: `${drink.name}を飲んだ。\n${drink.effect}！`
                }
            ],
            onDialogueComplete: () => this.checkDrinkEvent(drinkKey)
        };
        
        this.adventureUI.show(scene);
    }
    
    applyDrinkEffect(drinkKey) {
        switch(drinkKey) {
            case 'beer':
                if (this.game.player) {
                    this.game.player.health = Math.min(
                        this.game.player.health + 20,
                        this.game.player.maxHealth
                    );
                }
                break;
            case 'whiskey':
                if (this.game.player) {
                    this.game.player.energy = Math.min(
                        this.game.player.energy + 50,
                        this.game.player.maxEnergy
                    );
                }
                break;
            case 'special':
                // ランダム効果
                const effects = ['health', 'energy', 'credits', 'experience'];
                const effect = effects[Math.floor(Math.random() * effects.length)];
                this.applyRandomEffect(effect);
                break;
            case 'coffee':
                // 集中力アップ（一時的な命中率上昇など）
                if (this.game.player) {
                    this.game.player.temporaryBuffs = this.game.player.temporaryBuffs || {};
                    this.game.player.temporaryBuffs.accuracy = 1.2;
                    setTimeout(() => {
                        if (this.game.player.temporaryBuffs) {
                            delete this.game.player.temporaryBuffs.accuracy;
                        }
                    }, 60000); // 1分間
                }
                break;
        }
    }
    
    checkDrinkEvent(drinkKey) {
        // 特定の飲み物を頼んだ時のイベント
        if (drinkKey === 'special' && !this.hasMetLuna && Math.random() < 0.5) {
            this.triggerLunaEncounter();
        } else {
            this.showTavernMainMenu();
        }
    }
    
    triggerLunaEncounter() {
        this.hasMetLuna = true;
        
        const scene = {
            background: 'bg_tavern',
            characters: [
                { id: 'luna', sprite: 'luna_casual', position: 1 }
            ],
            dialogue: [
                {
                    text: '酒場のカウンター席で、見知らぬ女性が一人で飲んでいる。'
                },
                {
                    speaker: 'ルナ',
                    text: '......珍しいね、その飲み物を頼む人。'
                },
                {
                    speaker: 'ルナ',
                    text: 'マスターのスペシャルは、味の保証はないけど...\n面白いものが見られることがあるの。'
                },
                {
                    text: '彼女は意味深な笑みを浮かべている。',
                    choices: [
                        {
                            text: '君も飲んでみたことがあるの？',
                            onSelect: () => this.lunaConversation1()
                        },
                        {
                            text: '面白いものって？',
                            onSelect: () => this.lunaConversation2()
                        },
                        {
                            text: '一人で飲んでるの？',
                            onSelect: () => this.lunaConversation3()
                        }
                    ]
                }
            ]
        };
        
        this.adventureUI.show(scene);
    }
    
    lunaConversation1() {
        const scene = {
            background: 'bg_tavern',
            characters: [
                { id: 'luna', sprite: 'luna_happy', position: 1 }
            ],
            dialogue: [
                {
                    speaker: 'ルナ',
                    text: 'ええ、一度だけ。\n三日間、宇宙が虹色に見えたわ。'
                },
                {
                    speaker: 'ルナ',
                    text: '冗談よ。\nでも、マスターの腕は確かよ。味は...個性的だけど。',
                    sprite: 'luna_normal'
                },
                {
                    speaker: 'ルナ',
                    text: '私はルナ。あなたは？'
                }
            ],
            onDialogueComplete: () => this.introduceSelfToLuna()
        };
        
        this.adventureUI.show(scene);
    }
    
    lunaConversation2() {
        const scene = {
            background: 'bg_tavern',
            characters: [
                { id: 'luna', sprite: 'luna_normal', position: 1 }
            ],
            dialogue: [
                {
                    speaker: 'ルナ',
                    text: '新しい出会いとか、\n思いがけない情報とか...'
                },
                {
                    speaker: 'ルナ',
                    text: 'たとえば今みたいに、ね。',
                    sprite: 'luna_happy'
                },
                {
                    speaker: 'ルナ',
                    text: '私はルナ。\nフリーのパイロットをしているの。'
                }
            ],
            onDialogueComplete: () => this.introduceSelfToLuna()
        };
        
        this.adventureUI.show(scene);
    }
    
    lunaConversation3() {
        const scene = {
            background: 'bg_tavern',
            characters: [
                { id: 'luna', sprite: 'luna_sad', position: 1 }
            ],
            dialogue: [
                {
                    speaker: 'ルナ',
                    text: '...そうね。\n最近はずっと一人。'
                },
                {
                    speaker: 'ルナ',
                    text: 'でも、一人の方が気楽なこともあるでしょう？',
                    sprite: 'luna_normal'
                },
                {
                    speaker: 'ルナ',
                    text: 'ルナよ。\nあなたも一人？'
                }
            ],
            onDialogueComplete: () => this.introduceSelfToLuna()
        };
        
        this.adventureUI.show(scene);
    }
    
    introduceSelfToLuna() {
        const scene = {
            background: 'bg_tavern',
            characters: [
                { id: 'luna', sprite: 'luna_normal', position: 1 }
            ],
            dialogue: [
                {
                    text: 'プレイヤーは自己紹介をした。'
                },
                {
                    speaker: 'ルナ',
                    text: '地球連邦軍のパイロット...\n大変な任務を背負っているのね。'
                },
                {
                    speaker: 'ルナ',
                    text: 'もし...協力が必要になったら、\n声をかけて。',
                    sprite: 'luna_happy'
                },
                {
                    speaker: 'ルナ',
                    text: '私の機体「シルバーウィング」は、\nそこらの軍用機には負けないわ。'
                },
                {
                    text: 'ルナと知り合いになった！\n今後、仲間として加入する可能性がある。'
                }
            ],
            onDialogueComplete: () => {
                // ルナのフラグを立てる
                if (this.game.storyFlags) {
                    this.game.storyFlags.hasMetLunaInTavern = true;
                }
                this.showTavernMainMenu();
            }
        };
        
        this.adventureUI.show(scene);
    }
    
    askForRumors() {
        const rumors = [
            '最近、火星方面で謎の信号が観測されているらしい。\n軍は調査隊を派遣したが、音信不通だとか。',
            '木星の衛星エウロパで、古代遺跡が発見されたって話だ。\nただの噂かもしれないがな。',
            'ダークネビュラが活発化してるって聞いたか？\n奴らの目的は誰にも分からない。',
            '新型のエネルギーコアが闇市場に出回ってるらしい。\n出所は不明だが、性能は折り紙付きだとか。',
            'この前、変わった客が来てな。\n全身黒ずくめで、顔も見せなかった。何か探してるようだったが...'
        ];
        
        const rumor = rumors[Math.floor(Math.random() * rumors.length)];
        
        const scene = {
            background: 'bg_tavern',
            characters: [
                { id: 'bartender', sprite: 'bartender_normal' }
            ],
            dialogue: [
                {
                    speaker: 'マスター',
                    text: rumor
                },
                {
                    speaker: 'マスター',
                    text: 'まあ、話半分に聞いといてくれ。\n酒場の噂なんてそんなもんだ。'
                }
            ],
            onDialogueComplete: () => this.showTavernMainMenu()
        };
        
        this.adventureUI.show(scene);
    }
    
    askForJobs() {
        const jobs = [];
        
        // 利用可能なミッションをチェック
        if (this.game.missionSystem) {
            const availableMissions = this.game.missionSystem.getAvailableSideMissions();
            if (availableMissions.length > 0) {
                jobs.push('輸送護衛の仕事があるぜ。\n報酬は悪くない。興味があるなら詳細を教えよう。');
                jobs.push('賞金首の情報が入ってきた。\n腕に自信があるなら挑戦してみるか？');
            }
        }
        
        if (jobs.length === 0) {
            jobs.push('今は特に仕事はないな。\nまた今度来てくれ。');
        }
        
        const scene = {
            background: 'bg_tavern',
            characters: [
                { id: 'bartender', sprite: 'bartender_normal' }
            ],
            dialogue: [
                {
                    speaker: 'マスター',
                    text: jobs[Math.floor(Math.random() * jobs.length)]
                }
            ],
            onDialogueComplete: () => this.showTavernMainMenu()
        };
        
        this.adventureUI.show(scene);
    }
    
    updateAvailableCharacters() {
        this.availableCharacters = [];
        
        // 常に利用可能なキャラクター
        Object.values(this.characters).forEach(char => {
            if (char.alwaysAvailable || (char.condition && char.condition())) {
                this.availableCharacters.push(char);
            }
        });
    }
    
    getCharacterSprites() {
        const sprites = [];
        
        this.availableCharacters.forEach((char, index) => {
            if (char.id === 'bartender') {
                sprites.push({ id: 'bartender', sprite: 'bartender_normal', position: 0 });
            } else if (char.id === 'luna') {
                sprites.push({ id: 'luna', sprite: 'luna_casual', position: 1 });
            }
            // 他のキャラクターも同様に追加
        });
        
        return sprites;
    }
    
    getRandomBartenderInfo() {
        const infos = [
            'そういえば、補給物資の値段が上がってきてる。\n戦況が厳しくなってる証拠だな。',
            '最近、新人パイロットが増えてきた。\n皆、希望に満ちた顔をしてるが...長くは続かない。',
            'この前、面白いものを仕入れたんだ。\n興味があれば後で見せてやろう。',
            'ステーションの警備が厳しくなってきた。\n何か大きな動きがあるのかもな。',
            '昔はもっと賑やかだったんだがな、この店も。\n戦争ってのは、何もかも変えちまう。'
        ];
        
        return infos[Math.floor(Math.random() * infos.length)];
    }
    
    applyRandomEffect(effectType) {
        switch(effectType) {
            case 'health':
                if (this.game.player) {
                    const amount = Math.floor(Math.random() * 30) + 10;
                    this.game.player.health = Math.min(
                        this.game.player.health + amount,
                        this.game.player.maxHealth
                    );
                    this.game.showMessage(`HP+${amount}！`);
                }
                break;
            case 'energy':
                if (this.game.player) {
                    const amount = Math.floor(Math.random() * 40) + 20;
                    this.game.player.energy = Math.min(
                        this.game.player.energy + amount,
                        this.game.player.maxEnergy
                    );
                    this.game.showMessage(`エネルギー+${amount}！`);
                }
                break;
            case 'credits':
                const amount = Math.floor(Math.random() * 100) + 50;
                this.game.inventorySystem.addCredits(amount);
                break;
            case 'experience':
                // 経験値システムがあれば
                this.game.showMessage('なんだか調子が良くなった気がする！');
                break;
        }
    }
    
    leaveTavern() {
        this.adventureUI.hide();
        
        // 酒場を出た後の処理
        if (this.game.shopUI) {
            // ショップUIに戻る
            this.game.shopUI.element.style.display = 'block';
        }
    }
    
    talkToCharacter(characterId) {
        // 他のキャラクターとの会話（今後実装）
        const scene = {
            background: 'bg_tavern',
            dialogue: [
                {
                    text: 'この機能は準備中です。'
                }
            ],
            onDialogueComplete: () => this.showTavernMainMenu()
        };
        
        this.adventureUI.show(scene);
    }
}