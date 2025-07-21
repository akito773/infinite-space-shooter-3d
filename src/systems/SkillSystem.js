export class SkillSystem {
    constructor(game) {
        this.game = game;
        this.unlockedSkills = [];
        this.activeSkills = {};
        this.cooldowns = {};
        
        this.loadSkillData();
        this.loadUnlocked();
        this.createUI();
    }
    
    loadSkillData() {
        this.skills = {
            timeslow: {
                id: 'timeslow',
                name: 'タイムスロー',
                icon: '⏱️',
                description: '時間の流れを遅くし、敵の動きをスローにする',
                cooldown: 30,
                duration: 5,
                energyCost: 50,
                effects: {
                    timeScale: 0.3,
                    playerSpeedBonus: 1.5
                },
                unlock: 'ancient_tech_unlock'
            },
            overload: {
                id: 'overload',
                name: 'オーバーロード',
                icon: '💥',
                description: '全武器を同時発射し、大ダメージを与える',
                cooldown: 45,
                duration: 3,
                energyCost: 80,
                effects: {
                    damageMultiplier: 3,
                    fireRateMultiplier: 5
                },
                unlock: 'weapon_master'
            },
            emergency_dodge: {
                id: 'emergency_dodge',
                name: '緊急回避',
                icon: '💨',
                description: '瞬間的に無敵状態になり、高速移動する',
                cooldown: 20,
                duration: 1,
                energyCost: 30,
                effects: {
                    invincible: true,
                    speedMultiplier: 10
                },
                unlock: 'ace_pilot'
            },
            emp_pulse: {
                id: 'emp_pulse',
                name: 'EMPパルス',
                icon: '⚡',
                description: '周囲の敵を麻痺させる電磁パルスを放つ',
                cooldown: 25,
                duration: 0.5,
                energyCost: 40,
                effects: {
                    range: 100,
                    stunDuration: 3
                },
                unlock: 'tech_specialist'
            }
        };
    }
    
    loadUnlocked() {
        const saved = localStorage.getItem('unlockedSkills');
        if (saved) {
            this.unlockedSkills = JSON.parse(saved);
        } else {
            // デフォルトで緊急回避を解放
            this.unlockedSkills = ['emergency_dodge'];
        }
    }
    
    saveUnlocked() {
        localStorage.setItem('unlockedSkills', JSON.stringify(this.unlockedSkills));
    }
    
    createUI() {
        // スキルバー
        this.skillBar = document.createElement('div');
        this.skillBar.id = 'skill-bar';
        this.skillBar.style.cssText = `
            position: absolute;
            bottom: 100px;
            left: 50%;
            transform: translateX(-50%);
            display: flex;
            gap: 10px;
            z-index: 1000;
        `;
        
        // スキルスロット（1-4）
        for (let i = 1; i <= 4; i++) {
            const slot = document.createElement('div');
            slot.className = 'skill-slot';
            slot.id = `skill-slot-${i}`;
            slot.style.cssText = `
                width: 60px;
                height: 60px;
                background: rgba(0, 20, 40, 0.8);
                border: 2px solid rgba(0, 200, 255, 0.5);
                border-radius: 10px;
                display: flex;
                align-items: center;
                justify-content: center;
                position: relative;
                cursor: pointer;
                transition: all 0.3s;
            `;
            
            // キー表示
            const keyHint = document.createElement('div');
            keyHint.style.cssText = `
                position: absolute;
                top: -20px;
                left: 50%;
                transform: translateX(-50%);
                color: white;
                font-size: 12px;
                text-shadow: 1px 1px 2px black;
            `;
            keyHint.textContent = i.toString();
            slot.appendChild(keyHint);
            
            // クールダウンオーバーレイ
            const cooldownOverlay = document.createElement('div');
            cooldownOverlay.className = 'cooldown-overlay';
            cooldownOverlay.style.cssText = `
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.7);
                border-radius: 8px;
                display: none;
            `;
            
            const cooldownText = document.createElement('div');
            cooldownText.className = 'cooldown-text';
            cooldownText.style.cssText = `
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                color: white;
                font-size: 20px;
                font-weight: bold;
            `;
            cooldownOverlay.appendChild(cooldownText);
            slot.appendChild(cooldownOverlay);
            
            this.skillBar.appendChild(slot);
        }
        
        document.getElementById('ui-overlay').appendChild(this.skillBar);
        
        // スキルエフェクトコンテナ
        this.effectContainer = document.createElement('div');
        this.effectContainer.id = 'skill-effects';
        this.effectContainer.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 900;
        `;
        document.body.appendChild(this.effectContainer);
        
        // スキルの配置
        this.updateSkillBar();
    }
    
    updateSkillBar() {
        this.unlockedSkills.forEach((skillId, index) => {
            if (index >= 4) return; // 最大4スキル
            
            const skill = this.skills[skillId];
            if (!skill) return;
            
            const slot = document.getElementById(`skill-slot-${index + 1}`);
            if (!slot) return;
            
            // アイコン設定
            const icon = slot.querySelector('.skill-icon') || document.createElement('div');
            icon.className = 'skill-icon';
            icon.style.cssText = `
                font-size: 30px;
                filter: drop-shadow(0 0 5px rgba(0, 200, 255, 0.5));
            `;
            icon.textContent = skill.icon;
            
            if (!slot.querySelector('.skill-icon')) {
                slot.appendChild(icon);
            }
            
            // ツールチップ
            slot.title = `${skill.name}\n${skill.description}\nクールダウン: ${skill.cooldown}秒`;
        });
    }
    
    unlockSkill(skillId) {
        if (!this.skills[skillId] || this.unlockedSkills.includes(skillId)) {
            return;
        }
        
        this.unlockedSkills.push(skillId);
        this.saveUnlocked();
        this.updateSkillBar();
        
        // 解放通知
        this.showSkillUnlocked(this.skills[skillId]);
    }
    
    showSkillUnlocked(skill) {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(0, 50, 100, 0.95);
            border: 2px solid rgba(0, 255, 255, 0.8);
            border-radius: 20px;
            padding: 30px;
            text-align: center;
            z-index: 5000;
            animation: skillUnlockAnim 0.5s ease-out;
        `;
        
        notification.innerHTML = `
            <h2 style="color: #00ffff; margin-bottom: 20px;">新スキル解放！</h2>
            <div style="font-size: 60px; margin-bottom: 20px;">${skill.icon}</div>
            <h3 style="color: white; margin-bottom: 10px;">${skill.name}</h3>
            <p style="color: #aaaaaa;">${skill.description}</p>
        `;
        
        // アニメーション
        if (!document.querySelector('#skill-unlock-style')) {
            const style = document.createElement('style');
            style.id = 'skill-unlock-style';
            style.textContent = `
                @keyframes skillUnlockAnim {
                    0% {
                        opacity: 0;
                        transform: translate(-50%, -50%) scale(0.5);
                    }
                    100% {
                        opacity: 1;
                        transform: translate(-50%, -50%) scale(1);
                    }
                }
            `;
            document.head.appendChild(style);
        }
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transition = 'opacity 0.5s';
            setTimeout(() => notification.remove(), 500);
        }, 3000);
    }
    
    useSkill(slotNumber) {
        const skillId = this.unlockedSkills[slotNumber - 1];
        if (!skillId) return;
        
        const skill = this.skills[skillId];
        if (!skill) return;
        
        // クールダウンチェック
        if (this.cooldowns[skillId] && this.cooldowns[skillId] > 0) {
            this.game.showCollectMessage('スキルはクールダウン中です');
            return;
        }
        
        // エネルギーチェック（仮実装）
        // if (this.game.player.energy < skill.energyCost) {
        //     this.game.showCollectMessage('エネルギーが不足しています');
        //     return;
        // }
        
        // スキル発動
        this.activateSkill(skill);
    }
    
    activateSkill(skill) {
        console.log(`スキル発動: ${skill.name}`);
        
        // エフェクト表示
        this.showSkillEffect(skill);
        
        // スキル効果適用
        switch(skill.id) {
            case 'timeslow':
                this.activateTimeSlow(skill);
                break;
            case 'overload':
                this.activateOverload(skill);
                break;
            case 'emergency_dodge':
                this.activateEmergencyDodge(skill);
                break;
            case 'emp_pulse':
                this.activateEMPPulse(skill);
                break;
        }
        
        // クールダウン開始
        this.startCooldown(skill.id, skill.cooldown);
        
        // サウンド再生
        if (this.game.soundManager) {
            this.game.soundManager.play('skill');
        }
    }
    
    activateTimeSlow(skill) {
        this.activeSkills.timeslow = true;
        
        // 敵の速度を遅くする
        this.game.enemies.forEach(enemy => {
            enemy.speedMultiplier = skill.effects.timeScale;
        });
        
        // プレイヤーの速度ボーナス
        this.game.player.speedMultiplier = skill.effects.playerSpeedBonus;
        
        // エフェクト
        this.effectContainer.style.background = 'radial-gradient(circle, transparent 30%, rgba(0, 100, 200, 0.2) 100%)';
        
        // 効果終了
        setTimeout(() => {
            this.activeSkills.timeslow = false;
            this.game.enemies.forEach(enemy => {
                enemy.speedMultiplier = 1;
            });
            this.game.player.speedMultiplier = 1;
            this.effectContainer.style.background = '';
        }, skill.duration * 1000);
    }
    
    activateOverload(skill) {
        this.activeSkills.overload = true;
        
        // 武器の強化
        const originalDamage = this.game.player.weaponDamage || 10;
        const originalFireRate = this.game.player.fireRate || 100;
        
        this.game.player.weaponDamage = originalDamage * skill.effects.damageMultiplier;
        this.game.player.fireRate = originalFireRate / skill.effects.fireRateMultiplier;
        
        // 効果終了
        setTimeout(() => {
            this.activeSkills.overload = false;
            this.game.player.weaponDamage = originalDamage;
            this.game.player.fireRate = originalFireRate;
        }, skill.duration * 1000);
    }
    
    activateEmergencyDodge(skill) {
        this.activeSkills.emergency_dodge = true;
        
        // 無敵化
        this.game.player.invincible = true;
        
        // 高速移動
        const direction = new THREE.Vector3(0, 0, -1);
        direction.applyQuaternion(this.game.player.group.quaternion);
        direction.multiplyScalar(skill.effects.speedMultiplier * 10);
        
        this.game.player.group.position.add(direction);
        
        // ダッシュエフェクト
        this.showDashTrail();
        
        // 効果終了
        setTimeout(() => {
            this.activeSkills.emergency_dodge = false;
            this.game.player.invincible = false;
        }, skill.duration * 1000);
    }
    
    activateEMPPulse(skill) {
        // EMP波エフェクト
        const pulse = document.createElement('div');
        pulse.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            width: 100px;
            height: 100px;
            border: 3px solid rgba(0, 200, 255, 0.8);
            border-radius: 50%;
            transform: translate(-50%, -50%);
            animation: empPulse 1s ease-out;
            pointer-events: none;
        `;
        
        if (!document.querySelector('#emp-pulse-style')) {
            const style = document.createElement('style');
            style.id = 'emp-pulse-style';
            style.textContent = `
                @keyframes empPulse {
                    0% {
                        width: 100px;
                        height: 100px;
                        opacity: 1;
                    }
                    100% {
                        width: 500px;
                        height: 500px;
                        opacity: 0;
                    }
                }
            `;
            document.head.appendChild(style);
        }
        
        this.effectContainer.appendChild(pulse);
        setTimeout(() => pulse.remove(), 1000);
        
        // 範囲内の敵をスタン
        const playerPos = this.game.player.group.position;
        this.game.enemies.forEach(enemy => {
            const distance = enemy.group.position.distanceTo(playerPos);
            if (distance <= skill.effects.range) {
                enemy.stunned = true;
                enemy.stunDuration = skill.effects.stunDuration;
                
                // スタンエフェクト
                if (enemy.group) {
                    const originalEmissive = enemy.bodyMesh?.material.emissive?.getHex();
                    enemy.bodyMesh?.material.emissive?.setHex(0x00ffff);
                    
                    setTimeout(() => {
                        enemy.stunned = false;
                        if (originalEmissive !== undefined) {
                            enemy.bodyMesh?.material.emissive?.setHex(originalEmissive);
                        }
                    }, skill.effects.stunDuration * 1000);
                }
            }
        });
    }
    
    showSkillEffect(skill) {
        const effect = document.createElement('div');
        effect.style.cssText = `
            position: fixed;
            bottom: 200px;
            left: 50%;
            transform: translateX(-50%);
            font-size: 40px;
            color: #00ffff;
            text-shadow: 0 0 20px rgba(0, 255, 255, 0.8);
            animation: skillNameFade 1.5s ease-out;
            pointer-events: none;
        `;
        effect.textContent = skill.name;
        
        if (!document.querySelector('#skill-effect-style')) {
            const style = document.createElement('style');
            style.id = 'skill-effect-style';
            style.textContent = `
                @keyframes skillNameFade {
                    0% {
                        opacity: 0;
                        transform: translateX(-50%) translateY(20px);
                    }
                    50% {
                        opacity: 1;
                        transform: translateX(-50%) translateY(0);
                    }
                    100% {
                        opacity: 0;
                        transform: translateX(-50%) translateY(-20px);
                    }
                }
            `;
            document.head.appendChild(style);
        }
        
        this.effectContainer.appendChild(effect);
        setTimeout(() => effect.remove(), 1500);
    }
    
    showDashTrail() {
        for (let i = 0; i < 5; i++) {
            setTimeout(() => {
                const trail = document.createElement('div');
                trail.style.cssText = `
                    position: fixed;
                    top: 50%;
                    left: 50%;
                    width: 20px;
                    height: 100px;
                    background: linear-gradient(to bottom, transparent, rgba(0, 200, 255, 0.5), transparent);
                    transform: translate(-50%, -50%) rotate(${Math.random() * 360}deg);
                    opacity: 0.8;
                    animation: trailFade 0.5s ease-out;
                    pointer-events: none;
                `;
                
                this.effectContainer.appendChild(trail);
                setTimeout(() => trail.remove(), 500);
            }, i * 50);
        }
    }
    
    startCooldown(skillId, duration) {
        this.cooldowns[skillId] = duration;
        
        const slotIndex = this.unlockedSkills.indexOf(skillId);
        if (slotIndex === -1) return;
        
        const slot = document.getElementById(`skill-slot-${slotIndex + 1}`);
        if (!slot) return;
        
        const overlay = slot.querySelector('.cooldown-overlay');
        const text = slot.querySelector('.cooldown-text');
        
        if (overlay && text) {
            overlay.style.display = 'block';
            
            const updateCooldown = () => {
                this.cooldowns[skillId] -= 0.1;
                
                if (this.cooldowns[skillId] <= 0) {
                    this.cooldowns[skillId] = 0;
                    overlay.style.display = 'none';
                    return;
                }
                
                text.textContent = Math.ceil(this.cooldowns[skillId]);
                setTimeout(updateCooldown, 100);
            };
            
            updateCooldown();
        }
    }
    
    update(delta) {
        // パッシブスキルの更新など
    }
}