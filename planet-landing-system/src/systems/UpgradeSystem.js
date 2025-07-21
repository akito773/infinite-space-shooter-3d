// アップグレードシステム - 建物の強化・レベルアップ

import * as THREE from 'three';

export class UpgradeSystem {
    constructor(game) {
        this.game = game;
        
        // アップグレード設定
        this.upgradeData = {
            power_plant: {
                maxLevel: 5,
                upgrades: {
                    1: { cost: { credits: 2000, iron: 50 }, multiplier: 1.5, energyOutput: 15 },
                    2: { cost: { credits: 4000, iron: 100 }, multiplier: 2.0, energyOutput: 20 },
                    3: { cost: { credits: 8000, iron: 200, crystal: 10 }, multiplier: 2.5, energyOutput: 25 },
                    4: { cost: { credits: 15000, iron: 400, crystal: 25 }, multiplier: 3.0, energyOutput: 30 },
                    5: { cost: { credits: 30000, iron: 800, crystal: 50 }, multiplier: 4.0, energyOutput: 40 }
                }
            },
            mine: {
                maxLevel: 5,
                upgrades: {
                    1: { cost: { credits: 1500, iron: 30 }, multiplier: 1.4, ironOutput: 4 },
                    2: { cost: { credits: 3000, iron: 80 }, multiplier: 1.8, ironOutput: 5 },
                    3: { cost: { credits: 6000, iron: 150, crystal: 5 }, multiplier: 2.2, ironOutput: 6 },
                    4: { cost: { credits: 12000, iron: 300, crystal: 15 }, multiplier: 2.8, ironOutput: 8 },
                    5: { cost: { credits: 25000, iron: 600, crystal: 35 }, multiplier: 3.5, ironOutput: 10 }
                }
            },
            residence: {
                maxLevel: 4,
                upgrades: {
                    1: { cost: { credits: 2500, iron: 60 }, multiplier: 1.3, population: 8 },
                    2: { cost: { credits: 5000, iron: 120 }, multiplier: 1.6, population: 10 },
                    3: { cost: { credits: 10000, iron: 250, crystal: 8 }, multiplier: 2.0, population: 15 },
                    4: { cost: { credits: 20000, iron: 500, crystal: 20 }, multiplier: 2.5, population: 20 }
                }
            },
            research_lab: {
                maxLevel: 4,
                upgrades: {
                    1: { cost: { credits: 3000, iron: 80, crystal: 5 }, multiplier: 1.5, researchOutput: 3 },
                    2: { cost: { credits: 6000, iron: 160, crystal: 15 }, multiplier: 2.0, researchOutput: 4 },
                    3: { cost: { credits: 12000, iron: 320, crystal: 30 }, multiplier: 2.5, researchOutput: 6 },
                    4: { cost: { credits: 25000, iron: 640, crystal: 60 }, multiplier: 3.0, researchOutput: 8 }
                }
            },
            defense_turret: {
                maxLevel: 3,
                upgrades: {
                    1: { cost: { credits: 5000, iron: 150, crystal: 10 }, multiplier: 1.5, damage: 35 },
                    2: { cost: { credits: 10000, iron: 300, crystal: 25 }, multiplier: 2.0, damage: 50 },
                    3: { cost: { credits: 20000, iron: 600, crystal: 50 }, multiplier: 2.5, damage: 75 }
                }
            }
        };
        
        // アップグレード中の建物
        this.upgradingBuildings = new Map(); // buildingId -> upgradeInfo
        
        // UI
        this.upgradeUI = null;
        this.selectedBuildingForUpgrade = null;
        
        this.init();
    }
    
    init() {
        this.createUpgradeUI();
        console.log('アップグレードシステム初期化完了');
    }
    
    createUpgradeUI() {
        // アップグレードパネル
        this.upgradeUI = document.createElement('div');
        this.upgradeUI.id = 'upgrade-ui';
        this.upgradeUI.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: linear-gradient(135deg, rgba(0, 0, 0, 0.95), rgba(20, 20, 40, 0.95));
            border: 2px solid #4ade80;
            border-radius: 15px;
            padding: 25px;
            color: white;
            display: none;
            z-index: 1000;
            min-width: 400px;
            max-width: 500px;
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5);
        `;
        
        document.body.appendChild(this.upgradeUI);
    }
    
    showUpgradeUI(building) {
        this.selectedBuildingForUpgrade = building;
        const upgradeData = this.upgradeData[building.type];
        
        if (!upgradeData) {
            this.showMessage('この建物はアップグレードできません', 'error');
            return;
        }
        
        const currentLevel = building.level || 0;
        const nextLevel = currentLevel + 1;
        
        if (nextLevel > upgradeData.maxLevel) {
            this.showMessage('最大レベルに達しています', 'error');
            return;
        }
        
        const upgrade = upgradeData.upgrades[nextLevel];
        const canAfford = this.canAffordUpgrade(upgrade.cost);
        
        this.upgradeUI.innerHTML = `
            <div style="display: flex; justify-content: between; align-items: center; margin-bottom: 20px;">
                <h3 style="margin: 0; color: #4ade80;">🔧 建物アップグレード</h3>
                <button onclick="window.planetGame.systems.upgrade.hideUpgradeUI()" style="
                    background: none;
                    border: none;
                    color: #aaa;
                    font-size: 24px;
                    cursor: pointer;
                    margin-left: auto;
                ">✕</button>
            </div>
            
            <div style="margin-bottom: 20px;">
                <h4 style="color: #a5b4fc; margin-bottom: 10px;">${this.getBuildingDisplayName(building.type)}</h4>
                <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 15px;">
                    <span style="color: #94a3b8;">現在レベル:</span>
                    <span style="font-size: 18px; font-weight: bold;">${currentLevel}</span>
                    <span style="color: #4ade80;">→</span>
                    <span style="font-size: 18px; font-weight: bold; color: #4ade80;">${nextLevel}</span>
                </div>
            </div>
            
            <div style="margin-bottom: 20px;">
                <h5 style="color: #fbbf24; margin-bottom: 10px;">📈 アップグレード効果</h5>
                ${this.getUpgradeEffectsHTML(building.type, currentLevel, nextLevel)}
            </div>
            
            <div style="margin-bottom: 20px;">
                <h5 style="color: #f87171; margin-bottom: 10px;">💰 アップグレード費用</h5>
                ${this.getUpgradeCostHTML(upgrade.cost, canAfford)}
            </div>
            
            <div style="display: flex; gap: 10px; justify-content: center;">
                <button onclick="window.planetGame.systems.upgrade.startUpgrade()" 
                        style="
                            padding: 12px 30px;
                            background: ${canAfford ? 'linear-gradient(135deg, #4ade80, #22c55e)' : '#666'};
                            color: white;
                            border: none;
                            border-radius: 8px;
                            font-size: 16px;
                            font-weight: bold;
                            cursor: ${canAfford ? 'pointer' : 'not-allowed'};
                            ${canAfford ? 'box-shadow: 0 4px 15px rgba(74, 222, 128, 0.3);' : ''}
                        "
                        ${!canAfford ? 'disabled' : ''}>
                    ${canAfford ? '⬆️ アップグレード開始' : '❌ 資源不足'}
                </button>
                <button onclick="window.planetGame.systems.upgrade.hideUpgradeUI()" style="
                    padding: 12px 30px;
                    background: #6b7280;
                    color: white;
                    border: none;
                    border-radius: 8px;
                    font-size: 16px;
                    cursor: pointer;
                ">キャンセル</button>
            </div>
        `;
        
        this.upgradeUI.style.display = 'block';
        
        // グローバルアクセス用
        window.planetGame = this.game;
    }
    
    getBuildingDisplayName(type) {
        const names = {
            power_plant: '発電所',
            mine: '採掘施設',
            residence: '居住区',
            research_lab: '研究所',
            defense_turret: '防衛タレット',
            crystal_extractor: 'クリスタル抽出機',
            comm_tower: '通信タワー'
        };
        return names[type] || type;
    }
    
    getUpgradeEffectsHTML(buildingType, currentLevel, nextLevel) {
        const upgradeData = this.upgradeData[buildingType];
        const currentUpgrade = currentLevel > 0 ? upgradeData.upgrades[currentLevel] : null;
        const nextUpgrade = upgradeData.upgrades[nextLevel];
        
        let effects = [];
        
        // 生産量の変化
        if (nextUpgrade.energyOutput) {
            const current = currentUpgrade?.energyOutput || 10; // ベース値
            effects.push(`⚡ エネルギー生産: ${current} → ${nextUpgrade.energyOutput}`);
        }
        
        if (nextUpgrade.ironOutput) {
            const current = currentUpgrade?.ironOutput || 3; // ベース値
            effects.push(`🔩 鉄生産: ${current} → ${nextUpgrade.ironOutput}`);
        }
        
        if (nextUpgrade.researchOutput) {
            const current = currentUpgrade?.researchOutput || 2; // ベース値
            effects.push(`🔬 研究生産: ${current} → ${nextUpgrade.researchOutput}`);
        }
        
        if (nextUpgrade.population) {
            const current = currentUpgrade?.population || 5; // ベース値
            effects.push(`👥 人口: ${current} → ${nextUpgrade.population}`);
        }
        
        if (nextUpgrade.damage) {
            const current = currentUpgrade?.damage || 25; // ベース値
            effects.push(`💥 攻撃力: ${current} → ${nextUpgrade.damage}`);
        }
        
        // 効率乗数
        if (nextUpgrade.multiplier) {
            const current = currentUpgrade?.multiplier || 1.0;
            effects.push(`📊 効率乗数: ×${current.toFixed(1)} → ×${nextUpgrade.multiplier.toFixed(1)}`);
        }
        
        return effects.map(effect => 
            `<div style="padding: 5px 0; border-left: 3px solid #4ade80; padding-left: 10px; margin: 5px 0;">${effect}</div>`
        ).join('');
    }
    
    getUpgradeCostHTML(cost, canAfford) {
        const resources = this.game.systems.resource?.getResources() || {};
        
        return Object.entries(cost).map(([resource, amount]) => {
            const available = resources[resource] || 0;
            const hasEnough = available >= amount;
            const icon = this.getResourceIcon(resource);
            
            return `
                <div style="display: flex; justify-content: space-between; align-items: center; margin: 5px 0; padding: 8px; background: ${hasEnough ? 'rgba(74, 222, 128, 0.1)' : 'rgba(248, 113, 113, 0.1)'}; border-radius: 5px;">
                    <span>${icon} ${resource}</span>
                    <span style="color: ${hasEnough ? '#4ade80' : '#f87171'};">${this.formatNumber(available)} / ${this.formatNumber(amount)}</span>
                </div>
            `;
        }).join('');
    }
    
    getResourceIcon(resource) {
        const icons = {
            credits: '💰',
            iron: '🔩',
            energy: '⚡',
            crystal: '💎',
            research: '🔬'
        };
        return icons[resource] || '📦';
    }
    
    formatNumber(num) {
        if (num >= 1000000) {
            return (num / 1000000).toFixed(1) + 'M';
        } else if (num >= 1000) {
            return (num / 1000).toFixed(1) + 'K';
        }
        return num.toString();
    }
    
    canAffordUpgrade(cost) {
        if (!this.game.systems.resource) return false;
        
        const resources = this.game.systems.resource.getResources();
        
        for (const [resource, amount] of Object.entries(cost)) {
            if ((resources[resource] || 0) < amount) {
                return false;
            }
        }
        
        return true;
    }
    
    startUpgrade() {
        if (!this.selectedBuildingForUpgrade) return;
        
        const building = this.selectedBuildingForUpgrade;
        const upgradeData = this.upgradeData[building.type];
        const currentLevel = building.level || 0;
        const nextLevel = currentLevel + 1;
        const upgrade = upgradeData.upgrades[nextLevel];
        
        // 資源チェック
        if (!this.canAffordUpgrade(upgrade.cost)) {
            this.showMessage('資源が不足しています', 'error');
            return;
        }
        
        // 資源を消費
        if (this.game.systems.resource) {
            for (const [resource, amount] of Object.entries(upgrade.cost)) {
                this.game.systems.resource.addResource(resource, -amount);
            }
        }
        
        // アップグレード開始
        const upgradeTime = this.getUpgradeTime(building.type, nextLevel);
        
        this.upgradingBuildings.set(building.id, {
            building: building,
            targetLevel: nextLevel,
            startTime: Date.now(),
            duration: upgradeTime,
            upgrade: upgrade
        });
        
        // 建物の見た目を変更（アップグレード中表示）
        this.showUpgradingEffect(building);
        
        // UI更新
        this.hideUpgradeUI();
        this.showMessage(`${this.getBuildingDisplayName(building.type)}のアップグレードを開始しました`, 'success');
        
        // サウンド
        if (this.game.systems.sound) {
            this.game.systems.sound.play('upgrade');
        }
        
        console.log(`アップグレード開始: ${building.type} レベル${currentLevel} → ${nextLevel}`);
    }
    
    getUpgradeTime(buildingType, level) {
        // レベルに応じてアップグレード時間を決定（秒）
        const baseTimes = {
            power_plant: 30,
            mine: 25,
            residence: 40,
            research_lab: 45,
            defense_turret: 35,
            crystal_extractor: 50,
            comm_tower: 35
        };
        
        const baseTime = baseTimes[buildingType] || 30;
        return baseTime * level * 1000; // ミリ秒に変換
    }
    
    showUpgradingEffect(building) {
        // アップグレード中エフェクト
        if (building.mesh) {
            // 建物を少し浮上させる
            building.originalY = building.mesh.position.y;
            building.mesh.position.y += 1;
            
            // 回転アニメーション用フラグ
            building.isUpgrading = true;
            
            // パーティクルエフェクト
            this.createUpgradeParticles(building.position);
        }
    }
    
    createUpgradeParticles(position) {
        // アップグレードパーティクル（簡易版）
        for (let i = 0; i < 10; i++) {
            setTimeout(() => {
                const particle = this.createUpgradeParticle(position);
                this.game.surfaceScene.add(particle);
                
                // パーティクルアニメーション
                this.animateUpgradeParticle(particle);
            }, i * 200);
        }
    }
    
    createUpgradeParticle(position) {
        const geometry = new THREE.SphereGeometry(0.2, 8, 8);
        const material = new THREE.MeshBasicMaterial({
            color: 0x4ade80,
            transparent: true,
            opacity: 1
        });
        
        const particle = new THREE.Mesh(geometry, material);
        particle.position.copy(position);
        particle.position.y += Math.random() * 2;
        particle.position.x += (Math.random() - 0.5) * 4;
        particle.position.z += (Math.random() - 0.5) * 4;
        
        return particle;
    }
    
    animateUpgradeParticle(particle) {
        const startY = particle.position.y;
        const targetY = startY + 5;
        let progress = 0;
        
        const animate = () => {
            progress += 0.02;
            
            if (progress <= 1) {
                particle.position.y = startY + (targetY - startY) * progress;
                particle.material.opacity = 1 - progress;
                particle.rotation.y += 0.1;
                
                requestAnimationFrame(animate);
            } else {
                // パーティクル削除
                if (particle.parent) {
                    particle.parent.remove(particle);
                }
            }
        };
        
        animate();
    }
    
    hideUpgradeUI() {
        this.upgradeUI.style.display = 'none';
        this.selectedBuildingForUpgrade = null;
    }
    
    update(deltaTime) {
        // アップグレード中の建物を更新
        for (const [buildingId, upgradeInfo] of this.upgradingBuildings) {
            this.updateUpgrading(upgradeInfo, deltaTime);
        }
    }
    
    updateUpgrading(upgradeInfo, deltaTime) {
        const now = Date.now();
        const elapsed = now - upgradeInfo.startTime;
        const progress = elapsed / upgradeInfo.duration;
        
        // アップグレード中の視覚効果
        if (upgradeInfo.building.mesh && upgradeInfo.building.isUpgrading) {
            // 回転アニメーション
            upgradeInfo.building.mesh.rotation.y += deltaTime * 2;
            
            // 上下の浮遊
            const floatOffset = Math.sin(now * 0.005) * 0.3;
            upgradeInfo.building.mesh.position.y = upgradeInfo.building.originalY + 1 + floatOffset;
        }
        
        // アップグレード完了チェック
        if (progress >= 1) {
            this.completeUpgrade(upgradeInfo);
        }
    }
    
    completeUpgrade(upgradeInfo) {
        const building = upgradeInfo.building;
        const targetLevel = upgradeInfo.targetLevel;
        const upgrade = upgradeInfo.upgrade;
        
        // レベルアップ
        building.level = targetLevel;
        
        // 統計を適用
        this.applyUpgradeEffects(building, upgrade);
        
        // 視覚効果をリセット
        if (building.mesh) {
            building.mesh.position.y = building.originalY || building.mesh.position.y - 1;
            building.mesh.rotation.y = 0;
            building.isUpgrading = false;
            
            // レベル表示更新
            this.updateBuildingVisuals(building);
        }
        
        // アップグレード完了エフェクト
        this.createUpgradeCompleteEffect(building.position);
        
        // アップグレードリストから削除
        this.upgradingBuildings.delete(building.id);
        
        // 完了メッセージ
        this.showMessage(`${this.getBuildingDisplayName(building.type)} レベル${targetLevel} にアップグレード完了！`, 'success');
        
        // サウンド
        if (this.game.systems.sound) {
            this.game.systems.sound.play('buildingComplete');
        }
        
        console.log(`アップグレード完了: ${building.type} レベル${targetLevel}`);
    }
    
    applyUpgradeEffects(building, upgrade) {
        // 建物の統計を更新
        
        // 生産量の更新
        if (upgrade.energyOutput) {
            building.energyProduction = upgrade.energyOutput;
        }
        
        if (upgrade.ironOutput) {
            building.ironProduction = upgrade.ironOutput;
        }
        
        if (upgrade.researchOutput) {
            building.researchProduction = upgrade.researchOutput;
        }
        
        if (upgrade.population) {
            building.populationProvided = upgrade.population;
        }
        
        if (upgrade.damage) {
            building.damage = upgrade.damage;
        }
        
        // 効率乗数
        building.efficiencyMultiplier = upgrade.multiplier;
        
        // リソースシステムに変更を通知
        if (this.game.systems.resource) {
            this.game.systems.resource.notifyResourcesChanged();
        }
        
        // 戦闘システムに防衛タレットの更新を通知
        if (building.type === 'defense_turret' && this.game.systems.combat) {
            this.game.systems.combat.updateDefenseTurrets();
        }
    }
    
    updateBuildingVisuals(building) {
        if (!building.mesh) return;
        
        // レベル表示（建物の上にテキスト）
        if (building.levelDisplay) {
            building.mesh.remove(building.levelDisplay);
        }
        
        if (building.level > 0) {
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            canvas.width = 64;
            canvas.height = 32;
            
            context.fillStyle = '#4ade80';
            context.fillRect(0, 0, canvas.width, canvas.height);
            
            context.fillStyle = 'white';
            context.font = 'bold 16px Arial';
            context.textAlign = 'center';
            context.fillText(`Lv.${building.level}`, canvas.width / 2, 20);
            
            const texture = new THREE.CanvasTexture(canvas);
            const material = new THREE.MeshBasicMaterial({ 
                map: texture, 
                transparent: true 
            });
            const geometry = new THREE.PlaneGeometry(2, 1);
            
            building.levelDisplay = new THREE.Mesh(geometry, material);
            building.levelDisplay.position.set(0, 3, 0);
            building.levelDisplay.lookAt(this.game.camera.position);
            
            building.mesh.add(building.levelDisplay);
        }
    }
    
    createUpgradeCompleteEffect(position) {
        // アップグレード完了の爆発エフェクト
        const particleCount = 20;
        
        for (let i = 0; i < particleCount; i++) {
            const particle = this.createUpgradeParticle(position);
            particle.material.color.setHex(0xffd700); // 金色
            
            // ランダムな方向に飛ばす
            particle.userData = {
                velocity: new THREE.Vector3(
                    (Math.random() - 0.5) * 10,
                    Math.random() * 8 + 2,
                    (Math.random() - 0.5) * 10
                )
            };
            
            this.game.surfaceScene.add(particle);
            
            // アニメーション
            this.animateCompleteParticle(particle);
        }
    }
    
    animateCompleteParticle(particle) {
        let life = 1.0;
        
        const animate = () => {
            life -= 0.02;
            
            if (life > 0) {
                particle.position.add(particle.userData.velocity.clone().multiplyScalar(0.02));
                particle.userData.velocity.y -= 0.2; // 重力
                particle.material.opacity = life;
                
                requestAnimationFrame(animate);
            } else {
                if (particle.parent) {
                    particle.parent.remove(particle);
                }
            }
        };
        
        animate();
    }
    
    showMessage(text, type = 'info') {
        if (this.game.components.buildingMenu) {
            this.game.components.buildingMenu.showMessage(text, type);
        }
    }
    
    // 建物右クリック時の処理
    onBuildingRightClick(building) {
        if (this.upgradingBuildings.has(building.id)) {
            this.showMessage('アップグレード中です', 'warning');
            return;
        }
        
        this.showUpgradeUI(building);
    }
    
    // セーブ/ロード
    serialize() {
        const upgradingData = {};
        for (const [buildingId, upgradeInfo] of this.upgradingBuildings) {
            upgradingData[buildingId] = {
                targetLevel: upgradeInfo.targetLevel,
                startTime: upgradeInfo.startTime,
                duration: upgradeInfo.duration,
                upgrade: upgradeInfo.upgrade
            };
        }
        
        return {
            upgradingBuildings: upgradingData
        };
    }
    
    deserialize(data) {
        if (data.upgradingBuildings) {
            for (const [buildingId, upgradeData] of Object.entries(data.upgradingBuildings)) {
                const building = this.game.systems.building.buildings.get(buildingId);
                if (building) {
                    this.upgradingBuildings.set(buildingId, {
                        building: building,
                        targetLevel: upgradeData.targetLevel,
                        startTime: upgradeData.startTime,
                        duration: upgradeData.duration,
                        upgrade: upgradeData.upgrade
                    });
                    
                    // 視覚効果を復元
                    this.showUpgradingEffect(building);
                }
            }
        }
    }
    
    // クリーンアップ
    dispose() {
        if (this.upgradeUI && this.upgradeUI.parentNode) {
            this.upgradeUI.parentNode.removeChild(this.upgradeUI);
        }
        
        this.upgradingBuildings.clear();
    }
}