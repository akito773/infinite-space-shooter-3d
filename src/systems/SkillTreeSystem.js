// スキルツリーシステム

export class SkillTreeSystem {
    constructor(game) {
        this.game = game;
        
        // プレイヤーレベル
        this.level = 1;
        this.experience = 0;
        this.experienceToNext = 100;
        this.skillPoints = 0;
        
        // スキルレベル
        this.skills = {
            // パイロット系
            piloting: {
                level: 1,
                maxLevel: 10,
                name: 'パイロット技能',
                description: '基本的な操縦技術',
                effects: {
                    maneuverability: 0.1,  // 機動性向上
                    acceleration: 0.05     // 加速度向上
                }
            },
            combat: {
                level: 1,
                maxLevel: 10,
                name: '戦闘技能',
                description: '戦闘での有効性',
                effects: {
                    damage: 0.15,          // ダメージ増加
                    fireRate: 0.1,         // 連射速度向上
                    accuracy: 0.05         // 命中率向上
                }
            },
            defense: {
                level: 1,
                maxLevel: 10,
                name: '防御技能',
                description: '生存能力の向上',
                effects: {
                    health: 0.2,           // 最大HP増加
                    shield: 0.15,          // シールド効率向上
                    damage_reduction: 0.05  // ダメージ軽減
                }
            },
            
            // 探索系
            exploration: {
                level: 1,
                maxLevel: 10,
                name: '探索技能',
                description: '宇宙探索の効率化',
                effects: {
                    scan_range: 0.2,       // スキャン範囲拡大
                    discovery_rate: 0.1,   // 発見率向上
                    fuel_efficiency: 0.1   // 燃料効率向上
                }
            },
            salvage: {
                level: 1,
                maxLevel: 8,
                name: 'サルベージ技能',
                description: 'アイテム回収の向上',
                effects: {
                    drop_rate: 0.15,       // ドロップ率向上
                    item_quality: 0.1,     // アイテム品質向上
                    credits_bonus: 0.1     // クレジットボーナス
                }
            },
            navigation: {
                level: 1,
                maxLevel: 6,
                name: 'ナビゲーション',
                description: '宇宙航行の最適化',
                effects: {
                    warp_efficiency: 0.2,  // ワープ効率向上
                    fuel_consumption: -0.1, // 燃料消費削減
                    travel_speed: 0.1      // 移動速度向上
                }
            },
            
            // エンジニアリング系
            engineering: {
                level: 1,
                maxLevel: 10,
                name: 'エンジニアリング',
                description: '技術的専門知識',
                effects: {
                    repair_efficiency: 0.2, // 修理効率向上
                    upgrade_cost: -0.1,     // アップグレード費用削減
                    crafting_bonus: 0.15    // クラフトボーナス
                }
            },
            electronics: {
                level: 1,
                maxLevel: 8,
                name: 'エレクトロニクス',
                description: '電子機器の専門知識',
                effects: {
                    sensor_range: 0.25,    // センサー範囲拡大
                    targeting: 0.1,        // ターゲット精度向上
                    jamming_resistance: 0.2 // 妨害耐性向上
                }
            },
            
            // 経済系
            trading: {
                level: 1,
                maxLevel: 8,
                name: 'トレーディング',
                description: '商取引の効率化',
                effects: {
                    buy_discount: 0.05,    // 購入価格削減
                    sell_bonus: 0.1,       // 売却価格向上
                    market_info: 0.2       // 市場情報の精度
                }
            }
        };
        
        // アンロック済みスキル
        this.unlockedSkills = ['piloting', 'combat', 'defense', 'exploration'];
        
        // スキル依存関係
        this.skillDependencies = {
            salvage: ['exploration'],
            navigation: ['exploration'],
            electronics: ['engineering'],
            trading: ['exploration', 'engineering']
        };
        
        // スキル強化コスト
        this.skillCosts = {
            1: 1, 2: 1, 3: 2, 4: 2, 5: 3,
            6: 3, 7: 4, 8: 4, 9: 5, 10: 5
        };
        
        this.createUI();
    }
    
    // 経験値獲得
    gainExperience(amount, source = '') {
        this.experience += amount;
        
        // レベルアップチェック
        while (this.experience >= this.experienceToNext) {
            this.levelUp();
        }
        
        console.log(`経験値 +${amount} 獲得 (${source})`);
        this.updateUI();
    }
    
    // レベルアップ
    levelUp() {
        this.experience -= this.experienceToNext;
        this.level++;
        this.skillPoints += 2; // レベルアップで2スキルポイント獲得
        
        // 次のレベルまでの経験値を計算
        this.experienceToNext = Math.floor(100 * Math.pow(1.2, this.level - 1));
        
        // レベルアップメッセージ
        this.game.showMessage(`レベルアップ！ Lv.${this.level} (+2 スキルポイント)`, 3000);
        
        // 新しいスキルのアンロック
        this.checkSkillUnlocks();
        
        console.log(`レベルアップ: Lv.${this.level}, SP: ${this.skillPoints}`);
    }
    
    // スキル強化
    upgradeSkill(skillId) {
        const skill = this.skills[skillId];
        if (!skill) return false;
        
        // アンロック確認
        if (!this.unlockedSkills.includes(skillId)) {
            this.game.showMessage('このスキルはまだアンロックされていません', 2000);
            return false;
        }
        
        // 最大レベル確認
        if (skill.level >= skill.maxLevel) {
            this.game.showMessage('このスキルは最大レベルです', 2000);
            return false;
        }
        
        // コスト確認
        const cost = this.skillCosts[skill.level + 1] || 5;
        if (this.skillPoints < cost) {
            this.game.showMessage(`スキルポイントが不足しています (必要: ${cost})`, 2000);
            return false;
        }
        
        // スキル強化実行
        this.skillPoints -= cost;
        skill.level++;
        
        // 効果をプレイヤーに適用
        this.applySkillEffects();
        
        this.game.showMessage(`${skill.name} をレベル${skill.level}に強化しました！`, 2000);
        this.updateUI();
        
        return true;
    }
    
    // スキル効果をプレイヤーに適用
    applySkillEffects() {
        const player = this.game.player;
        if (!player) return;
        
        // 基本ステータスをリセット
        player.baseDamage = player.baseDamage || 10;
        player.baseHealth = player.baseHealth || 100;
        player.baseSpeed = player.baseSpeed || 50;
        
        // スキル効果を累積計算
        let totalDamageBonus = 0;
        let totalHealthBonus = 0;
        let totalSpeedBonus = 0;
        let totalFireRateBonus = 0;
        
        Object.entries(this.skills).forEach(([skillId, skill]) => {
            if (!this.unlockedSkills.includes(skillId)) return;
            
            const levelBonus = skill.level - 1; // レベル1は基本なので-1
            
            if (skill.effects.damage) {
                totalDamageBonus += skill.effects.damage * levelBonus;
            }
            if (skill.effects.health) {
                totalHealthBonus += skill.effects.health * levelBonus;
            }
            if (skill.effects.maneuverability || skill.effects.travel_speed) {
                const speedEffect = skill.effects.maneuverability || skill.effects.travel_speed;
                totalSpeedBonus += speedEffect * levelBonus;
            }
            if (skill.effects.fireRate) {
                totalFireRateBonus += skill.effects.fireRate * levelBonus;
            }
        });
        
        // ステータス適用
        player.damage = Math.floor(player.baseDamage * (1 + totalDamageBonus));
        player.maxHealth = Math.floor(player.baseHealth * (1 + totalHealthBonus));
        player.speed = player.baseSpeed * (1 + totalSpeedBonus);
        
        // 連射速度（fireRateは低いほど速い）
        const baseFireRate = 100;
        player.fireRate = Math.max(50, baseFireRate * (1 - totalFireRateBonus));
        
        console.log(`スキル効果適用: ダメージ${player.damage}, HP${player.maxHealth}, 速度${player.speed.toFixed(1)}`);
    }
    
    // 新しいスキルのアンロック確認
    checkSkillUnlocks() {
        Object.entries(this.skillDependencies).forEach(([skillId, dependencies]) => {
            if (this.unlockedSkills.includes(skillId)) return;
            
            // 依存スキルがすべて一定レベル以上か確認
            const canUnlock = dependencies.every(depSkillId => {
                const depSkill = this.skills[depSkillId];
                return depSkill && depSkill.level >= 3; // レベル3以上で関連スキルアンロック
            });
            
            if (canUnlock) {
                this.unlockedSkills.push(skillId);
                const skill = this.skills[skillId];
                this.game.showMessage(`新しいスキル「${skill.name}」がアンロックされました！`, 3000);
            }
        });
    }
    
    // 経験値計算（アクション別）
    getExperienceReward(action, data = {}) {
        const rewards = {
            enemy_kill: 15,
            boss_kill: 50,
            mission_complete: 100,
            planet_discover: 75,
            item_collect: 5,
            warp_travel: 10,
            trade_complete: 20,
            scan_success: 8
        };
        
        let baseReward = rewards[action] || 0;
        
        // ボーナス計算
        if (action === 'enemy_kill' && data.enemyType) {
            if (data.enemyType === 'elite') baseReward *= 2;
            if (data.enemyType === 'boss') baseReward *= 3;
        }
        
        return baseReward;
    }
    
    // UI作成
    createUI() {
        // スキルツリーUI（初期は非表示）
        this.skillTreeUI = null;
    }
    
    // スキルツリーUI表示
    showSkillTree() {
        if (this.skillTreeUI) {
            this.skillTreeUI.remove();
        }
        
        this.skillTreeUI = document.createElement('div');
        this.skillTreeUI.id = 'skill-tree-ui';
        this.skillTreeUI.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.9);
            z-index: 12000;
            display: flex;
            font-family: 'Orbitron', monospace;
        `;
        
        const container = document.createElement('div');
        container.style.cssText = `
            width: 100%;
            height: 100%;
            overflow-y: auto;
            padding: 20px;
        `;
        
        // ヘッダー
        const header = document.createElement('div');
        header.style.cssText = `
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 30px;
            padding: 20px;
            background: linear-gradient(135deg, rgba(0, 50, 100, 0.8), rgba(0, 100, 150, 0.8));
            border: 2px solid #00ffff;
            border-radius: 10px;
        `;
        
        header.innerHTML = `
            <div>
                <h2 style="color: #00ffff; margin: 0;">スキルツリー</h2>
                <p style="color: #ffffff; margin: 5px 0 0 0;">
                    レベル: ${this.level} | 経験値: ${this.experience}/${this.experienceToNext} | 
                    スキルポイント: ${this.skillPoints}
                </p>
            </div>
            <button id="close-skill-tree" style="
                background: #ff4444;
                border: none;
                color: white;
                width: 40px;
                height: 40px;
                border-radius: 5px;
                cursor: pointer;
                font-size: 20px;
            ">✕</button>
        `;
        
        // スキルカテゴリ
        const skillGrid = document.createElement('div');
        skillGrid.style.cssText = `
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 30px;
        `;
        
        const categories = {
            combat: ['piloting', 'combat', 'defense'],
            exploration: ['exploration', 'salvage', 'navigation'],
            engineering: ['engineering', 'electronics', 'trading']
        };
        
        const categoryNames = {
            combat: '戦闘系',
            exploration: '探索系',
            engineering: '技術系'
        };
        
        Object.entries(categories).forEach(([categoryId, skillIds]) => {
            const categoryDiv = document.createElement('div');
            categoryDiv.style.cssText = `
                background: rgba(0, 30, 60, 0.7);
                border: 1px solid rgba(0, 255, 255, 0.3);
                border-radius: 10px;
                padding: 20px;
            `;
            
            const categoryTitle = document.createElement('h3');
            categoryTitle.textContent = categoryNames[categoryId];
            categoryTitle.style.cssText = `
                color: #ffaa00;
                text-align: center;
                margin-bottom: 20px;
            `;
            categoryDiv.appendChild(categoryTitle);
            
            skillIds.forEach(skillId => {
                const skillDiv = this.createSkillCard(skillId);
                categoryDiv.appendChild(skillDiv);
            });
            
            skillGrid.appendChild(categoryDiv);
        });
        
        container.appendChild(header);
        container.appendChild(skillGrid);
        this.skillTreeUI.appendChild(container);
        
        // 閉じるボタン
        document.getElementById('close-skill-tree').onclick = () => {
            this.skillTreeUI.remove();
            this.skillTreeUI = null;
        };
        
        // ESCキーで閉じる
        const escHandler = (e) => {
            if (e.key === 'Escape') {
                this.skillTreeUI.remove();
                this.skillTreeUI = null;
                document.removeEventListener('keydown', escHandler);
            }
        };
        document.addEventListener('keydown', escHandler);
        
        document.body.appendChild(this.skillTreeUI);
    }
    
    // スキルカード作成
    createSkillCard(skillId) {
        const skill = this.skills[skillId];
        const isUnlocked = this.unlockedSkills.includes(skillId);
        const isMaxLevel = skill.level >= skill.maxLevel;
        const upgradeCost = this.skillCosts[skill.level + 1] || 5;
        const canUpgrade = isUnlocked && !isMaxLevel && this.skillPoints >= upgradeCost;
        
        const skillDiv = document.createElement('div');
        skillDiv.style.cssText = `
            background: ${isUnlocked ? 'rgba(0, 100, 200, 0.3)' : 'rgba(100, 100, 100, 0.2)'};
            border: 2px solid ${isUnlocked ? '#00aaff' : '#666666'};
            border-radius: 8px;
            padding: 15px;
            margin-bottom: 15px;
            transition: all 0.3s;
            cursor: ${canUpgrade ? 'pointer' : 'default'};
        `;
        
        if (canUpgrade) {
            skillDiv.onmouseover = () => {
                skillDiv.style.borderColor = '#00ffff';
                skillDiv.style.background = 'rgba(0, 150, 255, 0.4)';
            };
            skillDiv.onmouseout = () => {
                skillDiv.style.borderColor = '#00aaff';
                skillDiv.style.background = 'rgba(0, 100, 200, 0.3)';
            };
            skillDiv.onclick = () => this.upgradeSkill(skillId);
        }
        
        // 効果説明文作成
        const effectsText = Object.entries(skill.effects).map(([effect, value]) => {
            const effectNames = {
                damage: 'ダメージ',
                health: '最大HP',
                maneuverability: '機動性',
                scan_range: 'スキャン範囲',
                drop_rate: 'ドロップ率',
                fireRate: '連射速度'
            };
            const name = effectNames[effect] || effect;
            const sign = value > 0 ? '+' : '';
            const percent = Math.abs(value * (skill.level - 1) * 100);
            return `${name}: ${sign}${percent.toFixed(0)}%`;
        }).join(', ');
        
        skillDiv.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                <h4 style="color: ${isUnlocked ? '#00ffff' : '#888888'}; margin: 0;">
                    ${skill.name}
                </h4>
                <span style="color: #ffaa00; font-weight: bold;">
                    Lv.${skill.level}/${skill.maxLevel}
                </span>
            </div>
            <p style="color: #cccccc; font-size: 0.9em; margin: 10px 0;">
                ${skill.description}
            </p>
            <p style="color: #aaffaa; font-size: 0.8em; margin: 10px 0;">
                ${effectsText}
            </p>
            ${isUnlocked && !isMaxLevel ? 
                `<div style="text-align: center; margin-top: 10px;">
                    <button style="
                        background: ${canUpgrade ? '#00aa00' : '#666666'};
                        border: none;
                        color: white;
                        padding: 8px 16px;
                        border-radius: 5px;
                        cursor: ${canUpgrade ? 'pointer' : 'not-allowed'};
                    ">
                        強化 (${upgradeCost} SP)
                    </button>
                </div>` : 
                isMaxLevel ? '<div style="text-align: center; color: #ffaa00;">MAX</div>' :
                '<div style="text-align: center; color: #888888;">ロック中</div>'
            }
        `;
        
        return skillDiv;
    }
    
    // UI更新
    updateUI() {
        // スキルツリーが開いている場合は再描画
        if (this.skillTreeUI) {
            this.showSkillTree();
        }
    }
    
    // セーブデータ取得
    getSaveData() {
        return {
            level: this.level,
            experience: this.experience,
            experienceToNext: this.experienceToNext,
            skillPoints: this.skillPoints,
            skills: this.skills,
            unlockedSkills: this.unlockedSkills
        };
    }
    
    // セーブデータロード
    loadSaveData(data) {
        this.level = data.level || 1;
        this.experience = data.experience || 0;
        this.experienceToNext = data.experienceToNext || 100;
        this.skillPoints = data.skillPoints || 0;
        
        if (data.skills) {
            Object.assign(this.skills, data.skills);
        }
        
        if (data.unlockedSkills) {
            this.unlockedSkills = data.unlockedSkills;
        }
        
        // スキル効果を再適用
        this.applySkillEffects();
    }
}