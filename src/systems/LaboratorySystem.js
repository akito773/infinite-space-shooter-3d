import { AdventureUI } from './AdventureUI.js';

export class LaboratorySystem {
    constructor(game) {
        this.game = game;
        this.adventureUI = new AdventureUI(game);
        
        // 研究進度フラグ
        this.researchFlags = {
            hasMetScientist: false,
            hasLearnedAboutVoid: false,
            hasReceivedUpgrade: false,
            hasDiscoveredAncientTech: false,
            trustLevel: 0
        };
        
        // 研究可能なアイテム
        this.researchableItems = {
            'void_crystal': {
                name: 'ヴォイドクリスタル',
                researchTime: 3,
                reward: 'void_shield',
                dialogue: 'これは...ヴォイドのエネルギー結晶！？これを解析すれば、対ヴォイドシールドが開発できるぞ！'
            },
            'ancient_artifact': {
                name: '古代の遺物',
                researchTime: 5,
                reward: 'ancient_weapon',
                dialogue: 'なんと！これは失われた古代文明の技術だ！君はどこでこれを...？'
            }
        };
    }
    
    openLaboratory() {
        const backgroundContext = {
            location: '研究所',
            description: 'ハイテク機器が並ぶ研究室。様々な実験装置が青白い光を放っている',
            lighting: 'blue_tech',
            mood: 'scientific'
        };
        
        this.adventureUI.show(backgroundContext);
        
        if (!this.researchFlags.hasMetScientist) {
            this.showFirstMeeting();
        } else {
            this.showLabMenu();
        }
    }
    
    showFirstMeeting() {
        const dialogues = [
            {
                character: 'scientist',
                name: 'ケプラー博士',
                text: 'おお！新しい訪問者かね？私はケプラー、この研究所の主任研究員だ。',
                sprite: 'scientist_happy'
            },
            {
                character: 'player',
                text: 'はじめまして。ヴォイドについて調べているんです。'
            },
            {
                character: 'scientist',
                name: 'ケプラー博士',
                text: 'ヴォイドか...危険な研究対象だが、誰かが解明しなければならない。',
                sprite: 'scientist_serious'
            },
            {
                character: 'scientist',
                name: 'ケプラー博士',
                text: '君が戦闘で収集したサンプルがあれば、一緒に研究できるかもしれない。',
                sprite: 'scientist_normal'
            },
            {
                character: 'scientist',
                name: 'ケプラー博士',
                text: 'ヴォイドの残骸や古代の遺物を持ってきてくれれば、何か発見があるはずだ。',
                sprite: 'scientist_happy'
            }
        ];
        
        this.adventureUI.showDialogue(dialogues, () => {
            this.researchFlags.hasMetScientist = true;
            this.researchFlags.trustLevel += 10;
            this.showLabMenu();
        });
    }
    
    showLabMenu() {
        const hasResearchableItems = this.checkResearchableItems();
        
        const choices = [
            {
                text: '研究を依頼する',
                action: () => this.showResearchMenu(),
                condition: hasResearchableItems
            },
            {
                text: 'ヴォイドについて聞く',
                action: () => this.askAboutVoid()
            },
            {
                text: '技術アップグレード',
                action: () => this.showUpgradeMenu()
            },
            {
                text: '雑談する',
                action: () => this.casualTalk()
            },
            {
                text: '研究所を出る',
                action: () => this.exitLaboratory()
            }
        ];
        
        // 条件を満たさない選択肢をフィルタリング
        const availableChoices = choices.filter(choice => 
            choice.condition === undefined || choice.condition
        );
        
        this.adventureUI.showChoices(availableChoices);
    }
    
    checkResearchableItems() {
        if (!this.game.inventorySystem) return false;
        
        const inventory = this.game.inventorySystem.items || [];
        return Object.keys(this.researchableItems).some(itemId => 
            inventory.some(item => item.id === itemId)
        );
    }
    
    showResearchMenu() {
        const inventory = this.game.inventorySystem.items || [];
        const researchableInInventory = [];
        
        Object.entries(this.researchableItems).forEach(([itemId, data]) => {
            if (inventory.some(item => item.id === itemId)) {
                researchableInInventory.push({
                    id: itemId,
                    ...data
                });
            }
        });
        
        if (researchableInInventory.length === 0) {
            this.adventureUI.showDialogue([
                {
                    character: 'scientist',
                    name: 'ケプラー博士',
                    text: '研究できるアイテムを持っていないようだね。',
                    sprite: 'scientist_normal'
                }
            ], () => this.showLabMenu());
            return;
        }
        
        const choices = researchableInInventory.map(item => ({
            text: `${item.name}を研究してもらう`,
            action: () => this.startResearch(item)
        }));
        
        choices.push({
            text: '戻る',
            action: () => this.showLabMenu()
        });
        
        this.adventureUI.showChoices(choices);
    }
    
    startResearch(item) {
        // アイテムを消費
        this.game.inventorySystem.removeItem(item.id);
        
        const dialogues = [
            {
                character: 'scientist',
                name: 'ケプラー博士',
                text: item.dialogue,
                sprite: 'scientist_excited'
            },
            {
                character: 'scientist',
                name: 'ケプラー博士',
                text: `解析には少し時間がかかるが...よし、完成だ！`,
                sprite: 'scientist_working'
            }
        ];
        
        // 報酬を付与
        if (item.reward) {
            this.game.inventorySystem.addItem({
                id: item.reward,
                name: this.getRewardName(item.reward),
                type: 'equipment'
            });
            
            dialogues.push({
                character: 'scientist',
                name: 'ケプラー博士',
                text: `これを君に渡そう。${this.getRewardName(item.reward)}だ！きっと役に立つはずだ。`,
                sprite: 'scientist_happy'
            });
        }
        
        this.researchFlags.trustLevel += 15;
        
        this.adventureUI.showDialogue(dialogues, () => {
            this.showLabMenu();
        });
    }
    
    getRewardName(rewardId) {
        const rewards = {
            'void_shield': '対ヴォイドシールド',
            'ancient_weapon': '古代兵器プロトタイプ'
        };
        return rewards[rewardId] || 'Unknown Reward';
    }
    
    askAboutVoid() {
        let dialogues = [];
        
        if (!this.researchFlags.hasLearnedAboutVoid) {
            dialogues = [
                {
                    character: 'scientist',
                    name: 'ケプラー博士',
                    text: 'ヴォイドは約10年前に突如出現した謎の存在だ。',
                    sprite: 'scientist_serious'
                },
                {
                    character: 'scientist',
                    name: 'ケプラー博士',
                    text: '彼らは有機的でありながら機械的...まるで生きた兵器のようだ。',
                    sprite: 'scientist_thinking'
                },
                {
                    character: 'scientist',
                    name: 'ケプラー博士',
                    text: '最も恐ろしいのは、彼らが組織的に行動し、明確な目的を持っているように見えることだ。',
                    sprite: 'scientist_worried'
                },
                {
                    character: 'player',
                    text: '目的とは？'
                },
                {
                    character: 'scientist',
                    name: 'ケプラー博士',
                    text: 'それがわからないのだ。ただ...彼らは何かを探しているようにも見える。',
                    sprite: 'scientist_mysterious'
                }
            ];
            this.researchFlags.hasLearnedAboutVoid = true;
            this.researchFlags.trustLevel += 5;
        } else {
            dialogues = [
                {
                    character: 'scientist',
                    name: 'ケプラー博士',
                    text: '新しい発見があればすぐに知らせるよ。',
                    sprite: 'scientist_normal'
                },
                {
                    character: 'scientist',
                    name: 'ケプラー博士',
                    text: 'ヴォイドのサンプルをもっと集めてくれれば、さらに研究が進むはずだ。',
                    sprite: 'scientist_thinking'
                }
            ];
        }
        
        this.adventureUI.showDialogue(dialogues, () => {
            this.showLabMenu();
        });
    }
    
    showUpgradeMenu() {
        const upgrades = [
            {
                id: 'weapon_efficiency',
                name: 'エネルギー効率改善',
                cost: 5000,
                description: '武器のエネルギー消費を20%削減',
                purchased: false
            },
            {
                id: 'shield_boost',
                name: 'シールド強化',
                cost: 7500,
                description: 'シールド容量を30%増加',
                purchased: false
            },
            {
                id: 'engine_tune',
                name: 'エンジンチューニング',
                cost: 3000,
                description: '最高速度を15%向上',
                purchased: false
            }
        ];
        
        const availableUpgrades = upgrades.filter(u => !u.purchased);
        
        if (availableUpgrades.length === 0) {
            this.adventureUI.showDialogue([
                {
                    character: 'scientist',
                    name: 'ケプラー博士',
                    text: '現在提供できるアップグレードはすべて適用済みだ。',
                    sprite: 'scientist_normal'
                }
            ], () => this.showLabMenu());
            return;
        }
        
        const choices = availableUpgrades.map(upgrade => ({
            text: `${upgrade.name} - ${upgrade.cost}クレジット`,
            action: () => this.purchaseUpgrade(upgrade)
        }));
        
        choices.push({
            text: '戻る',
            action: () => this.showLabMenu()
        });
        
        this.adventureUI.showChoices(choices);
    }
    
    purchaseUpgrade(upgrade) {
        if (this.game.inventorySystem.credits < upgrade.cost) {
            this.adventureUI.showDialogue([
                {
                    character: 'scientist',
                    name: 'ケプラー博士',
                    text: 'クレジットが足りないようだね。また来てくれ。',
                    sprite: 'scientist_normal'
                }
            ], () => this.showLabMenu());
            return;
        }
        
        // クレジットを消費
        this.game.inventorySystem.spendCredits(upgrade.cost);
        
        // アップグレードを適用
        this.applyUpgrade(upgrade.id);
        upgrade.purchased = true;
        
        if (!this.researchFlags.hasReceivedUpgrade) {
            this.researchFlags.hasReceivedUpgrade = true;
            this.researchFlags.trustLevel += 10;
        }
        
        this.adventureUI.showDialogue([
            {
                character: 'scientist',
                name: 'ケプラー博士',
                text: 'アップグレード完了！君の機体はさらに強力になったぞ。',
                sprite: 'scientist_happy'
            },
            {
                character: 'scientist',
                name: 'ケプラー博士',
                text: upgrade.description,
                sprite: 'scientist_proud'
            }
        ], () => this.showLabMenu());
    }
    
    applyUpgrade(upgradeId) {
        switch(upgradeId) {
            case 'weapon_efficiency':
                // 武器のエネルギー効率を改善
                if (this.game.player) {
                    this.game.player.weaponEnergyModifier = 0.8;
                }
                break;
            case 'shield_boost':
                // シールド容量を増加
                if (this.game.player) {
                    this.game.player.maxShield = (this.game.player.maxShield || 100) * 1.3;
                    this.game.player.shield = this.game.player.maxShield;
                }
                break;
            case 'engine_tune':
                // 移動速度を向上
                if (this.game.player) {
                    this.game.player.speedModifier = 1.15;
                }
                break;
        }
    }
    
    casualTalk() {
        const topics = [
            {
                condition: () => this.researchFlags.trustLevel >= 20,
                dialogues: [
                    {
                        character: 'scientist',
                        name: 'ケプラー博士',
                        text: '実は私も若い頃は戦闘機のパイロットだったんだ。',
                        sprite: 'scientist_nostalgic'
                    },
                    {
                        character: 'player',
                        text: '意外です！なぜ研究者に？'
                    },
                    {
                        character: 'scientist',
                        name: 'ケプラー博士',
                        text: '知識こそが最強の武器だと気づいたからさ。',
                        sprite: 'scientist_wise'
                    }
                ]
            },
            {
                condition: () => this.researchFlags.trustLevel >= 40,
                dialogues: [
                    {
                        character: 'scientist',
                        name: 'ケプラー博士',
                        text: '君の父親も優秀なパイロットだったと聞いている。',
                        sprite: 'scientist_serious'
                    },
                    {
                        character: 'player',
                        text: '父を知っているんですか？'
                    },
                    {
                        character: 'scientist',
                        name: 'ケプラー博士',
                        text: '...いや、記録で読んだだけだ。彼は英雄だった。',
                        sprite: 'scientist_mysterious'
                    }
                ]
            },
            {
                condition: () => true,
                dialogues: [
                    {
                        character: 'scientist',
                        name: 'ケプラー博士',
                        text: '最近面白い論文を読んだんだ。量子もつれを利用した通信について...',
                        sprite: 'scientist_excited'
                    },
                    {
                        character: 'player',
                        text: '（話が長くなりそうだ...）'
                    },
                    {
                        character: 'scientist',
                        name: 'ケプラー博士',
                        text: 'おっと、つい熱くなってしまった。研究者の悪い癖だね。',
                        sprite: 'scientist_embarrassed'
                    }
                ]
            }
        ];
        
        // 条件を満たすトピックからランダムに選択
        const availableTopics = topics.filter(t => t.condition());
        const selectedTopic = availableTopics[Math.floor(Math.random() * availableTopics.length)];
        
        this.adventureUI.showDialogue(selectedTopic.dialogues, () => {
            this.researchFlags.trustLevel += 2;
            this.showLabMenu();
        });
    }
    
    exitLaboratory() {
        this.adventureUI.hide();
        
        // 着陸メニューに戻る
        if (this.game.landingMenu && this.game.landingMenu.currentLocation) {
            this.game.landingMenu.open(this.game.landingMenu.currentLocation);
        }
    }
}