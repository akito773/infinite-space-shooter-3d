// 武器インベントリシステム

import { WeaponTypes, WeaponRarity } from '../weapons/WeaponTypes.js';

export class WeaponInventory {
    constructor(game) {
        this.game = game;
        
        // 所持武器リスト
        this.ownedWeapons = new Map();
        
        // 武器アンロック状態
        this.unlockedWeapons = new Set(['pulse_laser']); // 初期武器
        
        // 武器レベル
        this.weaponLevels = new Map();
        
        // 武器経験値
        this.weaponExperience = new Map();
        
        // 装備スロット
        this.equippedSlots = {
            primary: 'pulse_laser',
            secondary: null,
            special: null
        };
        
        // 初期武器を追加
        this.addWeapon('pulse_laser', WeaponRarity.COMMON);
        
        this.loadProgress();
    }
    
    addWeapon(weaponId, rarity = WeaponRarity.COMMON) {
        const weapon = Object.values(WeaponTypes).find(w => w.id === weaponId);
        if (!weapon) return false;
        
        // 既に所持している場合は経験値を追加
        if (this.ownedWeapons.has(weaponId)) {
            this.addWeaponExperience(weaponId, 100);
            return true;
        }
        
        // 新規追加
        this.ownedWeapons.set(weaponId, {
            id: weaponId,
            weapon: weapon,
            rarity: rarity,
            unlockDate: Date.now()
        });
        
        this.unlockedWeapons.add(weaponId);
        this.weaponLevels.set(weaponId, 1);
        this.weaponExperience.set(weaponId, 0);
        
        // 実績システムに通知
        if (this.game.achievementSystem) {
            this.game.achievementSystem.unlock('weapon_collector');
        }
        
        // UI更新
        this.updateUI();
        
        return true;
    }
    
    removeWeapon(weaponId) {
        // 初期武器は削除不可
        if (weaponId === 'pulse_laser') return false;
        
        // 装備中の武器は削除不可
        if (Object.values(this.equippedSlots).includes(weaponId)) {
            return false;
        }
        
        this.ownedWeapons.delete(weaponId);
        this.weaponLevels.delete(weaponId);
        this.weaponExperience.delete(weaponId);
        
        this.updateUI();
        return true;
    }
    
    equipWeapon(weaponId, slot) {
        if (!this.ownedWeapons.has(weaponId)) return false;
        
        const weapon = this.ownedWeapons.get(weaponId).weapon;
        
        // スロットタイプの確認
        if (slot === 'primary' && weapon.type !== 'primary') return false;
        if (slot === 'secondary' && !['secondary', 'defensive'].includes(weapon.type)) return false;
        if (slot === 'special' && !['special', 'ultimate'].includes(weapon.type)) return false;
        
        this.equippedSlots[slot] = weaponId;
        
        // WeaponSystemに反映
        if (this.game.weaponSystem) {
            this.game.weaponSystem.equipWeapon(weaponId, slot);
        }
        
        this.updateUI();
        return true;
    }
    
    addWeaponExperience(weaponId, amount) {
        if (!this.weaponLevels.has(weaponId)) return;
        
        const currentLevel = this.weaponLevels.get(weaponId);
        const currentExp = this.weaponExperience.get(weaponId);
        
        const newExp = currentExp + amount;
        const expForNextLevel = this.getExperienceForLevel(currentLevel + 1);
        
        if (newExp >= expForNextLevel && currentLevel < 10) {
            // レベルアップ
            this.weaponLevels.set(weaponId, currentLevel + 1);
            this.weaponExperience.set(weaponId, newExp - expForNextLevel);
            
            // レベルアップ通知
            this.onWeaponLevelUp(weaponId, currentLevel + 1);
        } else {
            this.weaponExperience.set(weaponId, newExp);
        }
        
        this.updateUI();
    }
    
    getExperienceForLevel(level) {
        return level * level * 100;
    }
    
    onWeaponLevelUp(weaponId, newLevel) {
        const weapon = this.ownedWeapons.get(weaponId);
        if (!weapon) return;
        
        // レベルアップメッセージ
        if (this.game.showMessage) {
            this.game.showMessage(`${weapon.weapon.name} がレベル${newLevel}にアップ！`, 3000);
        }
        
        // サウンド再生
        if (this.game.soundManager) {
            this.game.soundManager.play('powerup');
        }
        
        // ルナに通知
        if (this.game.companionSystem) {
            this.game.companionSystem.playVoice('weapon_levelup');
        }
    }
    
    getWeaponStats(weaponId) {
        const weaponData = this.ownedWeapons.get(weaponId);
        if (!weaponData) return null;
        
        const level = this.weaponLevels.get(weaponId) || 1;
        const baseWeapon = weaponData.weapon;
        const rarity = weaponData.rarity;
        
        // レベルとレアリティによるステータス計算
        const levelMultiplier = 1 + (level - 1) * 0.1;
        const rarityMultiplier = rarity.priceMultiplier * 0.5 + 0.5;
        
        return {
            damage: Math.floor(baseWeapon.damage * levelMultiplier * rarityMultiplier),
            fireRate: Math.floor(baseWeapon.fireRate / (1 + (level - 1) * 0.05)),
            speed: baseWeapon.speed * (1 + (level - 1) * 0.05),
            level: level,
            rarity: rarity,
            experience: this.weaponExperience.get(weaponId) || 0,
            nextLevelExp: this.getExperienceForLevel(level + 1)
        };
    }
    
    getAvailableWeapons(slot = 'primary') {
        const available = [];
        
        this.ownedWeapons.forEach((weaponData, weaponId) => {
            const weapon = weaponData.weapon;
            
            // スロットタイプの確認
            if (slot === 'primary' && weapon.type === 'primary') {
                available.push({
                    id: weaponId,
                    ...weaponData,
                    stats: this.getWeaponStats(weaponId),
                    equipped: this.equippedSlots.primary === weaponId
                });
            } else if (slot === 'secondary' && ['secondary', 'defensive'].includes(weapon.type)) {
                available.push({
                    id: weaponId,
                    ...weaponData,
                    stats: this.getWeaponStats(weaponId),
                    equipped: this.equippedSlots.secondary === weaponId
                });
            } else if (slot === 'special' && ['special', 'ultimate'].includes(weapon.type)) {
                available.push({
                    id: weaponId,
                    ...weaponData,
                    stats: this.getWeaponStats(weaponId),
                    equipped: this.equippedSlots.special === weaponId
                });
            }
        });
        
        return available;
    }
    
    // アンロック条件チェック
    checkUnlockConditions() {
        const unlockConditions = {
            'rapid_fire': { kills: 50 },
            'plasma_cannon': { kills: 100, credits: 5000 },
            'scatter_shot': { kills: 150 },
            'homing_missile': { kills: 200, planets_visited: 3 },
            'ion_beam': { kills: 500, boss_kills: 1 },
            'shield_projector': { damage_taken: 1000 },
            'emp_blast': { enemies_stunned: 50 },
            'quantum_torpedo': { void_kills: 100 },
            'laser_array': { accuracy: 0.7, kills: 1000 }
        };
        
        Object.entries(unlockConditions).forEach(([weaponId, conditions]) => {
            if (this.unlockedWeapons.has(weaponId)) return;
            
            let conditionsMet = true;
            
            // 条件チェック
            if (conditions.kills && this.game.statistics.enemiesKilled < conditions.kills) {
                conditionsMet = false;
            }
            if (conditions.credits && this.game.inventorySystem.credits < conditions.credits) {
                conditionsMet = false;
            }
            if (conditions.planets_visited && this.game.statistics.planetsVisited < conditions.planets_visited) {
                conditionsMet = false;
            }
            // 他の条件も同様にチェック
            
            if (conditionsMet) {
                this.unlockWeapon(weaponId);
            }
        });
    }
    
    unlockWeapon(weaponId) {
        const weapon = Object.values(WeaponTypes).find(w => w.id === weaponId);
        if (!weapon || this.unlockedWeapons.has(weaponId)) return;
        
        this.unlockedWeapons.add(weaponId);
        
        // アンロック通知
        if (this.game.showMessage) {
            this.game.showMessage(`新武器アンロック: ${weapon.name}！`, 5000);
        }
        
        // サウンド再生
        if (this.game.soundManager) {
            this.game.soundManager.play('weapon_unlock');
        }
        
        // 自動的に武器を追加（コモンレアリティ）
        this.addWeapon(weaponId, WeaponRarity.COMMON);
    }
    
    updateUI() {
        // 武器選択UIを更新
        if (this.weaponSelectionUI) {
            this.weaponSelectionUI.refresh();
        }
    }
    
    saveProgress() {
        const data = {
            ownedWeapons: Array.from(this.ownedWeapons.entries()),
            unlockedWeapons: Array.from(this.unlockedWeapons),
            weaponLevels: Array.from(this.weaponLevels.entries()),
            weaponExperience: Array.from(this.weaponExperience.entries()),
            equippedSlots: this.equippedSlots
        };
        
        localStorage.setItem('weaponInventory', JSON.stringify(data));
    }
    
    loadProgress() {
        const saved = localStorage.getItem('weaponInventory');
        if (!saved) return;
        
        try {
            const data = JSON.parse(saved);
            
            // Map/Setの復元
            this.ownedWeapons = new Map(data.ownedWeapons);
            this.unlockedWeapons = new Set(data.unlockedWeapons);
            this.weaponLevels = new Map(data.weaponLevels);
            this.weaponExperience = new Map(data.weaponExperience);
            this.equippedSlots = data.equippedSlots;
            
            // 武器データの再構築
            this.ownedWeapons.forEach((weaponData, weaponId) => {
                const weapon = Object.values(WeaponTypes).find(w => w.id === weaponId);
                if (weapon) {
                    weaponData.weapon = weapon;
                }
            });
            
        } catch (e) {
            console.error('Failed to load weapon inventory:', e);
        }
    }
}