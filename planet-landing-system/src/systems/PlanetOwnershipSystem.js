// 惑星所有権システム - 惑星の所有、買収、収益管理

import { OWNERSHIP_LEVELS, PLANET_BASE_INCOME, TAKEOVER_COSTS, AI_PLAYERS, CHAIN_BONUS } from '../data/planetOwnership.js';

export class PlanetOwnershipSystem {
    constructor(game) {
        this.game = game;
        
        // 惑星所有情報
        this.planetOwnership = new Map(); // planetId -> ownership info
        
        // プレイヤー情報
        this.players = new Map(); // playerId -> player info
        
        // 現在のプレイヤー
        this.currentPlayerId = 'player1';
        
        // AI設定（シングルプレイ時）
        this.aiPlayers = [];
        this.isMultiplayer = false;
        
        // 買収・奪取進行中の情報
        this.takeoverAttempts = new Map();
        
        // 決算タイマー
        this.lastSettlement = Date.now();
        this.nextSettlement = null;
        
        this.init();
    }
    
    init() {
        // プレイヤー初期化
        this.initializePlayers();
        
        // 現在の惑星の所有権設定
        this.initializeCurrentPlanet();
        
        // 次回決算時刻を計算
        this.calculateNextSettlement();
    }
    
    initializePlayers() {
        // 人間プレイヤー
        this.players.set(this.currentPlayerId, {
            id: this.currentPlayerId,
            name: 'プレイヤー1',
            isAI: false,
            color: 0x00ff00,
            credits: 10000,
            ownedPlanets: [],
            totalIncome: 0,
            stats: {
                planetsOwned: 0,
                totalEarnings: 0,
                successfulTakeovers: 0,
                defendedAttempts: 0
            }
        });
        
        // シングルプレイの場合、AIプレイヤーを追加
        if (!this.isMultiplayer) {
            this.initializeAIPlayers();
        }
    }
    
    initializeAIPlayers() {
        // ランダムに3体のAIを選択
        const selectedAIs = [...AI_PLAYERS].sort(() => Math.random() - 0.5).slice(0, 3);
        
        selectedAIs.forEach((aiConfig, index) => {
            const aiPlayer = {
                id: `ai_${index + 1}`,
                name: aiConfig.name,
                isAI: true,
                aiConfig: aiConfig,
                color: aiConfig.color,
                credits: 8000 + Math.random() * 4000,
                ownedPlanets: [],
                totalIncome: 0,
                stats: {
                    planetsOwned: 0,
                    totalEarnings: 0,
                    successfulTakeovers: 0,
                    defendedAttempts: 0
                }
            };
            
            this.players.set(aiPlayer.id, aiPlayer);
            this.aiPlayers.push(aiPlayer.id);
        });
    }
    
    initializeCurrentPlanet() {
        // 現在の惑星データを取得
        const planetData = this.game.planetData?.planetData || {
            id: 'planet_emerald',
            name: 'エメラルド',
            type: 'terrestrial'
        };
        
        // 惑星の所有権情報を初期化
        this.planetOwnership.set(planetData.id, {
            planetId: planetData.id,
            planetName: planetData.name,
            planetType: planetData.type,
            ownerId: null,
            ownershipLevel: OWNERSHIP_LEVELS.UNOWNED.id,
            totalInvestment: 0,
            developmentLevel: 0,
            buildings: new Map(),
            lastIncomeTime: Date.now(),
            defenseStrength: 0,
            isUnderAttack: false
        });
    }
    
    // 惑星に着陸（仮所有権の取得）
    claimPlanet(planetId, playerId = this.currentPlayerId) {
        const ownership = this.planetOwnership.get(planetId);
        if (!ownership) return false;
        
        // 未所有の場合のみ仮所有可能
        if (ownership.ownershipLevel === OWNERSHIP_LEVELS.UNOWNED.id) {
            ownership.ownerId = playerId;
            ownership.ownershipLevel = OWNERSHIP_LEVELS.CLAIMED.id;
            
            const player = this.players.get(playerId);
            if (player) {
                player.ownedPlanets.push(planetId);
                player.stats.planetsOwned++;
            }
            
            this.game.showMessage(`${player.name}が${ownership.planetName}を仮所有しました！`, 'info');
            return true;
        }
        
        return false;
    }
    
    // 建物建設時の処理
    onBuildingConstructed(building) {
        const planetId = this.game.planetData?.planetData?.id;
        if (!planetId) return;
        
        const ownership = this.planetOwnership.get(planetId);
        if (!ownership) return;
        
        // 建物情報を記録
        ownership.buildings.set(building.id, {
            type: building.type,
            level: building.level || 1,
            ownerId: this.currentPlayerId
        });
        
        // 開発レベル更新
        ownership.developmentLevel = ownership.buildings.size;
        
        // 防衛力更新
        if (building.type === 'defense_turret') {
            ownership.defenseStrength += 10 * (building.level || 1);
        }
        
        // 投資額更新
        const buildingCost = this.calculateBuildingValue(building);
        ownership.totalInvestment += buildingCost;
        
        // 初めての建物なら仮所有権を取得
        if (ownership.ownershipLevel === OWNERSHIP_LEVELS.UNOWNED.id) {
            this.claimPlanet(planetId);
        }
        
        // 投資額が一定以上なら正式所有に昇格
        if (ownership.ownershipLevel === OWNERSHIP_LEVELS.CLAIMED.id && 
            ownership.totalInvestment >= 50000) {
            this.upgradeToPermanentOwnership(planetId);
        }
    }
    
    // 正式所有権への昇格
    upgradeToPermanentOwnership(planetId) {
        const ownership = this.planetOwnership.get(planetId);
        if (!ownership || ownership.ownershipLevel !== OWNERSHIP_LEVELS.CLAIMED.id) return;
        
        ownership.ownershipLevel = OWNERSHIP_LEVELS.OWNED.id;
        this.game.showMessage(`${ownership.planetName}の正式所有権を獲得！`, 'success');
        
        // 実績やボーナスの付与
        const player = this.players.get(ownership.ownerId);
        if (player) {
            player.credits += 5000; // ボーナス
        }
    }
    
    // 買収攻撃
    attemptBuyout(planetId, buyerId = this.currentPlayerId) {
        const ownership = this.planetOwnership.get(planetId);
        if (!ownership || !ownership.ownerId || ownership.ownerId === buyerId) {
            return false;
        }
        
        const buyer = this.players.get(buyerId);
        const currentOwner = this.players.get(ownership.ownerId);
        
        if (!buyer || !currentOwner) return false;
        
        // 買収コスト計算
        const planetValue = this.calculatePlanetValue(planetId);
        const buyoutCost = Math.max(
            planetValue * TAKEOVER_COSTS.buyoutMultiplier,
            TAKEOVER_COSTS.minimumBuyout
        );
        
        // 資金チェック
        if (buyer.credits < buyoutCost) {
            this.game.showMessage('買収資金が不足しています', 'error');
            return false;
        }
        
        // 買収実行
        buyer.credits -= buyoutCost;
        currentOwner.credits += buyoutCost * 0.8; // 元の所有者に80%支払い
        
        // 所有権移転
        this.transferOwnership(planetId, buyerId);
        
        // 統計更新
        buyer.stats.successfulTakeovers++;
        
        this.game.showMessage(
            `${buyer.name}が${buyoutCost}crで${ownership.planetName}を買収しました！`,
            'warning'
        );
        
        return true;
    }
    
    // 所有権移転
    transferOwnership(planetId, newOwnerId) {
        const ownership = this.planetOwnership.get(planetId);
        if (!ownership) return;
        
        const oldOwner = this.players.get(ownership.ownerId);
        const newOwner = this.players.get(newOwnerId);
        
        // 旧所有者から削除
        if (oldOwner) {
            const index = oldOwner.ownedPlanets.indexOf(planetId);
            if (index > -1) {
                oldOwner.ownedPlanets.splice(index, 1);
                oldOwner.stats.planetsOwned--;
            }
        }
        
        // 新所有者に追加
        if (newOwner) {
            newOwner.ownedPlanets.push(planetId);
            newOwner.stats.planetsOwned++;
        }
        
        ownership.ownerId = newOwnerId;
    }
    
    // 惑星価値計算
    calculatePlanetValue(planetId) {
        const ownership = this.planetOwnership.get(planetId);
        if (!ownership) return 0;
        
        const baseIncome = PLANET_BASE_INCOME[ownership.planetType]?.baseIncome || 1000;
        
        // 基本価値 = 投資額 + (基本収入 × 10) + (開発度 × 1000)
        let value = ownership.totalInvestment + 
                   (baseIncome * 10) + 
                   (ownership.developmentLevel * 1000);
        
        // 防衛力ボーナス
        value += ownership.defenseStrength * 100;
        
        return Math.floor(value);
    }
    
    // 建物価値計算
    calculateBuildingValue(building) {
        // 建物データから価値を計算（簡易版）
        const baseCosts = {
            mine: 5000,
            power_plant: 8000,
            residence: 10000,
            research_lab: 15000,
            defense_turret: 12000,
            crystal_extractor: 20000,
            comm_tower: 18000,
            transport_terminal: 25000
        };
        
        const baseCost = baseCosts[building.type] || 5000;
        const level = building.level || 1;
        
        return baseCost * level;
    }
    
    // 収益計算
    calculateIncome(planetId) {
        const ownership = this.planetOwnership.get(planetId);
        if (!ownership || !ownership.ownerId) return 0;
        
        const planetType = PLANET_BASE_INCOME[ownership.planetType] || PLANET_BASE_INCOME.terrestrial;
        let income = planetType.baseIncome;
        
        // 開発度ボーナス
        income *= (1 + ownership.developmentLevel * 0.1);
        
        // 連鎖ボーナスチェック
        const chainBonus = this.calculateChainBonus(ownership.ownerId);
        income *= chainBonus;
        
        return Math.floor(income);
    }
    
    // 連鎖ボーナス計算
    calculateChainBonus(playerId) {
        const player = this.players.get(playerId);
        if (!player) return 1.0;
        
        let bonus = 1.0;
        
        // 保有惑星数ボーナス
        if (player.ownedPlanets.length >= 3) {
            bonus *= 1.1;
        }
        if (player.ownedPlanets.length >= 5) {
            bonus *= 1.2;
        }
        
        // TODO: 隣接惑星ボーナス、星系支配ボーナスなど
        
        return bonus;
    }
    
    // 決算処理
    performSettlement(isRegular = true) {
        console.log('決算開始！');
        
        const settlementResults = [];
        
        // 各プレイヤーの収益計算
        for (const [playerId, player] of this.players) {
            let totalIncome = 0;
            const planetIncomes = [];
            
            for (const planetId of player.ownedPlanets) {
                const income = this.calculateIncome(planetId);
                totalIncome += income;
                
                const ownership = this.planetOwnership.get(planetId);
                planetIncomes.push({
                    planetName: ownership.planetName,
                    income: income
                });
            }
            
            // ミニ決算の場合は30%
            if (!isRegular) {
                totalIncome = Math.floor(totalIncome * 0.3);
            }
            
            player.credits += totalIncome;
            player.totalIncome += totalIncome;
            player.stats.totalEarnings += totalIncome;
            
            settlementResults.push({
                playerId: playerId,
                playerName: player.name,
                totalIncome: totalIncome,
                planetIncomes: planetIncomes,
                newBalance: player.credits
            });
        }
        
        // 決算結果を表示
        this.displaySettlementResults(settlementResults, isRegular);
        
        // 次回決算時刻を更新
        this.lastSettlement = Date.now();
        this.calculateNextSettlement();
    }
    
    // 決算結果表示
    displaySettlementResults(results, isRegular) {
        // 収益順にソート
        results.sort((a, b) => b.totalIncome - a.totalIncome);
        
        // UIに通知
        if (this.game.components.settlementUI) {
            this.game.components.settlementUI.showResults(results, isRegular);
        }
        
        // 簡易メッセージ
        const winner = results[0];
        if (winner) {
            this.game.showMessage(
                `決算完了！ 1位: ${winner.playerName} (+${winner.totalIncome}cr)`,
                'success'
            );
        }
    }
    
    // 次回決算時刻計算
    calculateNextSettlement() {
        const now = new Date();
        const nextMini = new Date(now);
        
        // 次の12:00か21:00
        if (now.getHours() < 12) {
            nextMini.setHours(12, 0, 0, 0);
        } else if (now.getHours() < 21) {
            nextMini.setHours(21, 0, 0, 0);
        } else {
            nextMini.setDate(nextMini.getDate() + 1);
            nextMini.setHours(12, 0, 0, 0);
        }
        
        this.nextSettlement = nextMini.getTime();
    }
    
    // AI行動（シングルプレイ用）
    updateAI(deltaTime) {
        if (this.isMultiplayer) return;
        
        for (const aiId of this.aiPlayers) {
            const ai = this.players.get(aiId);
            if (!ai) continue;
            
            // AIの行動決定（簡易版）
            if (Math.random() < 0.01) { // 1%の確率で行動
                this.executeAIAction(ai);
            }
        }
    }
    
    executeAIAction(ai) {
        const config = ai.aiConfig;
        
        // 買収を試みる
        if (Math.random() < config.traits.buyoutTendency) {
            // ランダムな惑星を選択（実装簡略化）
            const targetPlanet = this.game.planetData?.planetData?.id;
            if (targetPlanet) {
                this.attemptBuyout(targetPlanet, ai.id);
            }
        }
    }
    
    // 更新処理
    update(deltaTime) {
        // AI更新
        this.updateAI(deltaTime);
        
        // 決算チェック
        if (Date.now() >= this.nextSettlement) {
            this.performSettlement(false); // ミニ決算
        }
    }
    
    // 現在の順位取得
    getCurrentRanking() {
        const rankings = Array.from(this.players.values())
            .map(player => ({
                playerId: player.id,
                playerName: player.name,
                totalAssets: player.credits + this.calculatePlayerTotalAssets(player.id),
                planetsOwned: player.stats.planetsOwned,
                isPlayer: player.id === this.currentPlayerId
            }))
            .sort((a, b) => b.totalAssets - a.totalAssets);
        
        return rankings;
    }
    
    // プレイヤーの総資産計算
    calculatePlayerTotalAssets(playerId) {
        const player = this.players.get(playerId);
        if (!player) return 0;
        
        let totalAssets = 0;
        for (const planetId of player.ownedPlanets) {
            totalAssets += this.calculatePlanetValue(planetId);
        }
        
        return totalAssets;
    }
}