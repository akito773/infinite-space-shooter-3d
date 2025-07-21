// アドバイザーシステム - ナビ助によるゲーム進行サポート

import { ADVISOR_CHARACTER, ADVICE_CONDITIONS, ADVISOR_RESPONSES, ADVISOR_TIPS } from '../data/advisorData.js';

export class AdvisorSystem {
    constructor(game) {
        this.game = game;
        
        // アドバイザー設定
        this.character = ADVISOR_CHARACTER;
        
        // アドバイス管理
        this.currentAdvice = null;
        this.adviceHistory = [];
        this.lastAdviceTime = 0;
        this.adviceInterval = 30000; // 30秒間隔でチェック
        
        // 状態追跡
        this.gameStateCache = {};
        this.playerActions = [];
        
        // チュートリアル完了チェック
        this.tutorialCompleted = false;
        
        // ティップス表示
        this.tipIndex = 0;
        this.lastTipTime = 0;
        this.tipInterval = 120000; // 2分間隔でティップス
        
        console.log(`${this.character.name}が起動したナビ〜！`);
    }
    
    update(deltaTime) {
        const now = Date.now();
        
        // ゲーム状態を更新
        this.updateGameState();
        
        // アドバイスチェック
        if (now - this.lastAdviceTime >= this.adviceInterval) {
            this.checkForAdvice();
            this.lastAdviceTime = now;
        }
        
        // ティップス表示
        if (now - this.lastTipTime >= this.tipInterval) {
            this.showRandomTip();
            this.lastTipTime = now;
        }
    }
    
    updateGameState() {
        const buildings = this.game.systems.building?.buildings || new Map();
        const resources = this.game.systems.resource?.getResources() || {};
        const ownership = this.game.systems.planetOwnership?.players?.get('player1');
        
        this.gameStateCache = {
            // 建物関連
            buildingCount: buildings.size,
            defenseCount: Array.from(buildings.values()).filter(b => b.type === 'defense_turret').length,
            researchLabs: Array.from(buildings.values()).filter(b => b.type === 'research_lab').length,
            transportTerminals: Array.from(buildings.values()).filter(b => b.type === 'transport_terminal').length,
            
            // 資源関連
            resources: resources,
            credits: resources.credits || 0,
            energyBalance: this.calculateEnergyBalance(),
            
            // プレイヤー進行
            hasVisitedUnderground: this.game.currentScene === 'underground' || this.hasActionHistory('underground_visit'),
            eventCount: this.game.systems.event?.eventHistory?.length || 0,
            
            // 所有権関連
            ownedPlanets: ownership?.ownedPlanets?.length || 0,
            timeUntilSettlement: this.game.systems.planetOwnership?.nextSettlement ? 
                this.game.systems.planetOwnership.nextSettlement - Date.now() : 0
        };
    }
    
    calculateEnergyBalance() {
        const buildings = this.game.systems.building?.buildings || new Map();
        let production = 0;
        let consumption = 0;
        
        for (const building of buildings.values()) {
            if (building.type === 'power_plant') {
                production += 10 * (building.level || 1);
            }
            
            // 他の建物のエネルギー消費
            const consumptionRates = {
                mine: 3,
                research_lab: 25,
                defense_turret: 10,
                transport_terminal: 20
            };
            
            consumption += (consumptionRates[building.type] || 0) * (building.level || 1);
        }
        
        return production - consumption;
    }
    
    hasActionHistory(actionType) {
        return this.playerActions.some(action => action.type === actionType);
    }
    
    checkForAdvice() {
        // 最も優先度の高いアドバイスを検索
        let bestAdvice = null;
        let highestPriority = -1;
        
        for (const [conditionId, conditionData] of Object.entries(ADVICE_CONDITIONS)) {
            // 既に同じアドバイスを最近出した場合はスキップ
            if (this.wasRecentlyAdvised(conditionId)) continue;
            
            // 条件チェック
            if (conditionData.condition(this.gameStateCache)) {
                if (conditionData.priority > highestPriority) {
                    highestPriority = conditionData.priority;
                    bestAdvice = {
                        id: conditionId,
                        ...conditionData.advice
                    };
                }
            }
        }
        
        // アドバイスを表示
        if (bestAdvice) {
            this.showAdvice(bestAdvice);
        }
    }
    
    wasRecentlyAdvised(conditionId) {
        const recentThreshold = 300000; // 5分間
        return this.adviceHistory.some(advice => 
            advice.id === conditionId && 
            Date.now() - advice.timestamp < recentThreshold
        );
    }
    
    showAdvice(advice) {
        this.currentAdvice = advice;
        
        // 履歴に追加
        this.adviceHistory.push({
            id: advice.id,
            timestamp: Date.now(),
            title: advice.title
        });
        
        // UIに表示
        if (this.game.components.advisorUI) {
            this.game.components.advisorUI.showAdvice(advice);
        }
        
        console.log(`${this.character.name}: ${advice.title}`);
    }
    
    showRandomTip() {
        const tip = ADVISOR_TIPS[this.tipIndex % ADVISOR_TIPS.length];
        this.tipIndex++;
        
        if (this.game.components.advisorUI) {
            this.game.components.advisorUI.showTip(tip);
        }
    }
    
    // プレイヤーの行動に対する反応
    onPlayerAction(actionType, data = {}) {
        // 行動を記録
        this.playerActions.push({
            type: actionType,
            timestamp: Date.now(),
            data: data
        });
        
        // 行動に応じた反応
        this.reactToAction(actionType, data);
    }
    
    reactToAction(actionType, data) {
        const responses = ADVISOR_RESPONSES[actionType];
        if (!responses || responses.length === 0) return;
        
        const response = responses[Math.floor(Math.random() * responses.length)];
        
        if (this.game.components.advisorUI) {
            this.game.components.advisorUI.showReaction(response);
        }
    }
    
    // 特定アクションのアドバイス
    getActionAdvice(actionType) {
        const actionAdvice = {
            building_menu: 'まずは採掘施設か発電所から始めるのがオススメナビ〜',
            energy_management: 'エネルギー不足は致命的やで〜、発電所を優先するナビ！',
            transport_terminal: 'Yキーで輸送画面開けるナビ〜、余った資源を売って稼ごう！',
            underground_exploration: 'Uキーで地下に行けるナビ〜、マウスクリックでブロック採掘や〜',
            build_defense: '防衛タレット建てとき〜、隕石とか海賊から守ってくれるナビ！',
            build_research: '研究所で新技術覚えられるナビ〜、長期投資や〜',
            build_transport: '輸送ターミナルで定期収入ゲットナビ〜、安定経営の基本や〜',
            prepare_settlement: '建物いっぱい建てて開発レベル上げるナビ〜、収益に直結するで〜',
            event_preparation: '通信塔と防衛タレットあると、イベント選択肢増えるナビ〜',
            planet_buyout: '他の惑星買収すると連鎖ボーナスもらえるナビ〜、帝国建設や〜'
        };
        
        return actionAdvice[actionType] || 'がんばるナビ〜！';
    }
    
    // 緊急時の警告
    showUrgentWarning(message) {
        const urgentMessage = {
            id: 'urgent_warning',
            title: '⚠️ 緊急事態ナビ！',
            content: message,
            urgency: 'critical'
        };
        
        if (this.game.components.advisorUI) {
            this.game.components.advisorUI.showAdvice(urgentMessage, true);
        }
    }
    
    // プレイヤーからの質問に対する回答（将来拡張用）
    answerQuestion(question) {
        const answers = {
            'エネルギー': 'エネルギーは発電所で作るナビ〜、足りんと建物止まるから要注意や〜',
            '地下': '地下探索はUキーナビ〜、レア資源いっぱいあるで〜',
            '輸送': '輸送はYキーで画面開けるナビ〜、資源売って稼ごう〜',
            '決算': '決算は12時間ごとナビ〜、建物多いほど収益アップや〜',
            'AI': 'AIも本気で来るで〜、油断したらあかんナビ〜'
        };
        
        for (const [keyword, answer] of Object.entries(answers)) {
            if (question.includes(keyword)) {
                return `${answer}`;
            }
        }
        
        return 'よくわからんけど、がんばるナビ〜！';
    }
}