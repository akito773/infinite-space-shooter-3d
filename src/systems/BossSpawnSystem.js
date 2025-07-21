import * as THREE from 'three';
import { BossBattleship } from '../entities/BossBattleship.js';
import { RaidBoss } from '../entities/RaidBoss.js';

export class BossSpawnSystem {
    constructor(game) {
        this.game = game;
        this.currentBoss = null;
        this.bossSpawned = false;
        this.raidBossSpawned = false;
        
        // ボス出現条件
        this.spawnConditions = {
            wave: 10,           // ウェーブ10で中ボス出現
            score: 50000,       // または スコア50000
            playtime: 600000    // または プレイ時間10分
        };
        
        // レイドボス出現条件
        this.raidSpawnConditions = {
            wave: 20,           // ウェーブ20でレイドボス
            score: 150000,      // または スコア150000
            playtime: 1200000,  // または プレイ時間20分
            bossesDefeated: 1   // 中ボス撃破後
        };
        
        // ボス戦BGM
        this.bossBattleActive = false;
        this.bossesDefeated = 0;
        
        // ボス戦UI
        this.bossHealthBar = null;
        this.createBossUI();
    }
    
    createBossUI() {
        // ボス体力バーコンテナ
        const container = document.createElement('div');
        container.id = 'boss-health-container';
        container.style.cssText = `
            position: absolute;
            top: 50px;
            left: 50%;
            transform: translateX(-50%);
            width: 600px;
            display: none;
            z-index: 100;
        `;
        
        // ボス名
        const bossName = document.createElement('div');
        bossName.style.cssText = `
            text-align: center;
            color: #ff0000;
            font-size: 24px;
            font-weight: bold;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.8);
            margin-bottom: 10px;
        `;
        bossName.textContent = 'タイタン級戦艦';
        
        // 体力バー背景
        const healthBarBg = document.createElement('div');
        healthBarBg.style.cssText = `
            width: 100%;
            height: 30px;
            background: rgba(0,0,0,0.8);
            border: 2px solid #ff0000;
            border-radius: 15px;
            overflow: hidden;
            position: relative;
        `;
        
        // 体力バー
        const healthBar = document.createElement('div');
        healthBar.style.cssText = `
            width: 100%;
            height: 100%;
            background: linear-gradient(90deg, #ff0000, #ff6600);
            transition: width 0.3s ease;
            box-shadow: 0 0 20px rgba(255,0,0,0.8);
        `;
        
        // フェーズインジケーター
        const phaseIndicators = document.createElement('div');
        phaseIndicators.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
        `;
        
        // フェーズマーカー（75%, 50%, 25%）
        [75, 50, 25].forEach(percent => {
            const marker = document.createElement('div');
            marker.style.cssText = `
                position: absolute;
                left: ${percent}%;
                top: 0;
                width: 2px;
                height: 100%;
                background: rgba(255,255,255,0.5);
            `;
            phaseIndicators.appendChild(marker);
        });
        
        // 体力数値
        const healthText = document.createElement('div');
        healthText.style.cssText = `
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            color: white;
            font-size: 16px;
            font-weight: bold;
            text-shadow: 1px 1px 2px rgba(0,0,0,0.8);
        `;
        healthText.textContent = '5000 / 5000';
        
        healthBarBg.appendChild(healthBar);
        healthBarBg.appendChild(phaseIndicators);
        healthBarBg.appendChild(healthText);
        
        container.appendChild(bossName);
        container.appendChild(healthBarBg);
        
        document.body.appendChild(container);
        
        // シールドバー（レイドボス用）
        const shieldBarBg = document.createElement('div');
        shieldBarBg.style.cssText = `
            width: 100%;
            height: 20px;
            background: rgba(0,0,0,0.6);
            border: 2px solid #00ffff;
            border-radius: 10px;
            overflow: hidden;
            position: relative;
            margin-top: 10px;
            display: none;
        `;
        
        const shieldBar = document.createElement('div');
        shieldBar.style.cssText = `
            width: 100%;
            height: 100%;
            background: linear-gradient(90deg, #00ffff, #0088ff);
            transition: width 0.3s ease;
            box-shadow: 0 0 15px rgba(0,255,255,0.8);
        `;
        
        const shieldText = document.createElement('div');
        shieldText.style.cssText = `
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            color: white;
            font-size: 14px;
            font-weight: bold;
            text-shadow: 1px 1px 2px rgba(0,0,0,0.8);
        `;
        shieldText.textContent = 'SHIELD: 100%';
        
        shieldBarBg.appendChild(shieldBar);
        shieldBarBg.appendChild(shieldText);
        container.appendChild(shieldBarBg);
        
        this.bossHealthBar = {
            container: container,
            bar: healthBar,
            text: healthText,
            name: bossName,
            shieldBarBg: shieldBarBg,
            shieldBar: shieldBar,
            shieldText: shieldText
        };
    }
    
    showShieldBar() {
        if (!this.bossHealthBar || !this.bossHealthBar.shieldBarBg) return;
        
        this.bossHealthBar.shieldBarBg.style.display = 'block';
        
        if (this.currentBoss && this.currentBoss.shieldHealth !== undefined) {
            const shieldPercent = Math.max(0, this.currentBoss.shieldHealth / this.currentBoss.maxShieldHealth);
            this.bossHealthBar.shieldBar.style.width = `${shieldPercent * 100}%`;
            this.bossHealthBar.shieldText.textContent = `SHIELD: ${Math.floor(shieldPercent * 100)}%`;
        }
    }
    
    hideShieldBar() {
        if (!this.bossHealthBar || !this.bossHealthBar.shieldBarBg) return;
        this.bossHealthBar.shieldBarBg.style.display = 'none';
    }
    
    update(delta) {
        // 中ボス出現チェック
        if (!this.bossSpawned && !this.raidBossSpawned && this.checkSpawnConditions()) {
            this.spawnBoss();
        }
        
        // レイドボス出現チェック
        if (!this.raidBossSpawned && this.bossesDefeated > 0 && this.checkRaidSpawnConditions()) {
            this.spawnRaidBoss();
        }
        
        // ボス更新
        if (this.currentBoss && this.currentBoss.isAlive) {
            const playerPos = this.game.player ? this.game.player.group.position : null;
            this.currentBoss.update(delta, playerPos);
            
            // ボスの弾丸を発射
            const projectiles = this.currentBoss.updateWeapons(delta, playerPos);
            if (projectiles && projectiles.length > 0) {
                projectiles.forEach(proj => {
                    this.createBossProjectile(proj);
                });
            }
            
            // UI更新
            this.updateBossUI();
            
            // ボス撃破チェック
            if (!this.currentBoss.isAlive) {
                this.onBossDefeated();
            }
        }
    }
    
    checkSpawnConditions() {
        // デバッグ用：即座にボス出現
        if (window.debugBossSpawn) {
            return true;
        }
        
        // 通常の出現条件
        const wave = this.game.waveManager ? this.game.waveManager.currentWave : 0;
        const score = this.game.score || 0;
        const playtime = Date.now() - (this.game.startTime || Date.now());
        
        return (
            wave >= this.spawnConditions.wave ||
            score >= this.spawnConditions.score ||
            playtime >= this.spawnConditions.playtime
        );
    }
    
    checkRaidSpawnConditions() {
        // デバッグ用：即座にレイドボス出現
        if (window.debugRaidBossSpawn) {
            return true;
        }
        
        // レイドボスの出現条件
        const wave = this.game.waveManager ? this.game.waveManager.currentWave : 0;
        const score = this.game.score || 0;
        const playtime = Date.now() - (this.game.startTime || Date.now());
        
        return (
            this.bossesDefeated >= this.raidSpawnConditions.bossesDefeated &&
            (wave >= this.raidSpawnConditions.wave ||
             score >= this.raidSpawnConditions.score ||
             playtime >= this.raidSpawnConditions.playtime)
        );
    }
    
    spawnBoss() {
        console.log('BOSS SPAWNING!');
        this.bossSpawned = true;
        
        // 既存の敵を全て削除
        if (this.game.enemies) {
            this.game.enemies.forEach(enemy => {
                if (enemy.destroy) enemy.destroy();
            });
            this.game.enemies = [];
        }
        
        // ボス出現位置
        const spawnPosition = new THREE.Vector3(0, 0, -200);
        
        // ボス作成
        this.currentBoss = new BossBattleship(this.game.scene, spawnPosition);
        
        // ボス戦開始演出
        this.startBossBattleSequence();
        
        // BGM変更（playBossMusicメソッドが存在する場合のみ）
        if (this.game.soundManager && this.game.soundManager.playBossMusic) {
            this.game.soundManager.playBossMusic();
        } else if (this.game.soundManager && this.game.soundManager.play) {
            // 代替：効果音を再生
            this.game.soundManager.play('warning');
        }
        
        // UI表示
        this.showBossUI();
    }
    
    startBossBattleSequence() {
        // 警告メッセージ
        const warning = document.createElement('div');
        warning.style.cssText = `
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            font-size: 48px;
            color: #ff0000;
            font-weight: bold;
            text-shadow: 0 0 20px rgba(255,0,0,0.8);
            animation: pulse 0.5s ease-in-out infinite;
            z-index: 1000;
        `;
        warning.textContent = 'WARNING: BOSS APPROACHING!';
        
        // アニメーションスタイル追加
        const style = document.createElement('style');
        style.textContent = `
            @keyframes pulse {
                0% { transform: translate(-50%, -50%) scale(1); }
                50% { transform: translate(-50%, -50%) scale(1.1); }
                100% { transform: translate(-50%, -50%) scale(1); }
            }
        `;
        document.head.appendChild(style);
        
        document.body.appendChild(warning);
        
        // 3秒後に警告削除
        setTimeout(() => {
            document.body.removeChild(warning);
            document.head.removeChild(style);
        }, 3000);
        
        // カメラシェイク
        this.cameraShake(2);
    }
    
    cameraShake(duration) {
        const startTime = Date.now();
        const originalPosition = this.game.camera.position.clone();
        
        const shake = () => {
            const elapsed = (Date.now() - startTime) / 1000;
            if (elapsed < duration) {
                const intensity = (1 - elapsed / duration) * 2;
                this.game.camera.position.x = originalPosition.x + (Math.random() - 0.5) * intensity;
                this.game.camera.position.y = originalPosition.y + (Math.random() - 0.5) * intensity;
                requestAnimationFrame(shake);
            } else {
                this.game.camera.position.copy(originalPosition);
            }
        };
        
        shake();
    }
    
    createBossProjectile(projData) {
        // ボスの弾丸を作成
        const geometry = new THREE.SphereGeometry(projData.size || 1, 8, 8);
        const material = new THREE.MeshBasicMaterial({
            color: projData.color || 0xff0000,
            emissive: projData.color || 0xff0000,
            emissiveIntensity: 0.5
        });
        
        const projectile = {
            mesh: new THREE.Mesh(geometry, material),
            velocity: projData.direction.multiplyScalar(projData.speed),
            damage: projData.damage,
            lifeTime: 5,
            isDestroyed: false,
            type: 'boss',
            isHoming: projData.isHoming || false,
            homingTarget: projData.target,
            homingStrength: 0.03,
            fuel: 3,
            destroy: function() {
                if (this.isDestroyed) return;
                this.isDestroyed = true;
                if (this.mesh && this.mesh.parent) {
                    this.mesh.parent.remove(this.mesh);
                }
                if (this.mesh) {
                    this.mesh.geometry?.dispose();
                    this.mesh.material?.dispose();
                }
            }
        };
        
        projectile.mesh.position.copy(projData.position);
        this.game.scene.add(projectile.mesh);
        
        // プロジェクトマネージャーに追加
        if (this.game.projectileManager) {
            this.game.projectileManager.projectiles.push(projectile);
        }
        
        // ミサイルの場合は軌跡エフェクト追加
        if (projData.isHoming) {
            const light = new THREE.PointLight(projData.color || 0xff00ff, 1, 10);
            light.position.copy(projectile.mesh.position);
            projectile.mesh.add(light);
        }
        
        return projectile;
    }
    
    showBossUI() {
        if (this.bossHealthBar) {
            this.bossHealthBar.container.style.display = 'block';
            this.updateBossUI();
        }
    }
    
    hideBossUI() {
        if (this.bossHealthBar) {
            this.bossHealthBar.container.style.display = 'none';
        }
    }
    
    updateBossUI() {
        if (!this.bossHealthBar || !this.currentBoss) return;
        
        const isRaidBoss = this.currentBoss.constructor.name === 'RaidBoss';
        const healthPercent = Math.max(0, this.currentBoss.health / this.currentBoss.maxHealth);
        
        // ボス名更新
        this.bossHealthBar.name.textContent = isRaidBoss ? 'タイタン級超巨大戦艦' : 'タイタン級戦艦';
        
        // 体力バー更新
        this.bossHealthBar.bar.style.width = `${healthPercent * 100}%`;
        this.bossHealthBar.text.textContent = `${Math.floor(this.currentBoss.health)} / ${this.currentBoss.maxHealth}`;
        
        // フェーズに応じて色変更
        if (isRaidBoss) {
            // レイドボスのフェーズ別色
            if (this.currentBoss.phase >= 6) {
                this.bossHealthBar.bar.style.background = 'linear-gradient(90deg, #ff0000, #000000)';
            } else if (this.currentBoss.phase >= 5) {
                this.bossHealthBar.bar.style.background = 'linear-gradient(90deg, #ff00ff, #ff0066)';
            } else if (this.currentBoss.phase >= 4) {
                this.bossHealthBar.bar.style.background = 'linear-gradient(90deg, #ff6600, #ff00ff)';
            } else if (this.currentBoss.phase >= 3) {
                this.bossHealthBar.bar.style.background = 'linear-gradient(90deg, #ffaa00, #ff6600)';
            } else if (this.currentBoss.phase >= 2) {
                this.bossHealthBar.bar.style.background = 'linear-gradient(90deg, #ffff00, #ffaa00)';
            }
            
            // シールド表示（レイドボスのみ）
            if (this.currentBoss.shieldActive && this.currentBoss.shieldHealth > 0) {
                this.showShieldBar();
            } else {
                this.hideShieldBar();
            }
        } else {
            // 中ボスのフェーズ別色
            if (this.currentBoss.phase >= 3) {
                this.bossHealthBar.bar.style.background = 'linear-gradient(90deg, #ff00ff, #ff0066)';
            } else if (this.currentBoss.phase >= 2) {
                this.bossHealthBar.bar.style.background = 'linear-gradient(90deg, #ff6600, #ffaa00)';
            }
        }
    }
    
    spawnRaidBoss() {
        console.log('RAID BOSS SPAWNING!');
        this.raidBossSpawned = true;
        
        // 既存の敵を全て削除
        if (this.game.enemies) {
            this.game.enemies.forEach(enemy => {
                if (enemy.destroy) enemy.destroy();
            });
            this.game.enemies = [];
        }
        
        // レイドボス出現位置（より遠く）
        const spawnPosition = new THREE.Vector3(0, 0, -500);
        
        // レイドボス作成
        this.currentBoss = new RaidBoss(this.game.scene, spawnPosition);
        
        // レイドボス戦開始演出
        this.startRaidBossSequence();
        
        // BGM変更
        if (this.game.soundManager && this.game.soundManager.playBossMusic) {
            this.game.soundManager.playBossMusic();
        } else if (this.game.soundManager && this.game.soundManager.play) {
            this.game.soundManager.play('warning');
        }
        
        // UI表示
        this.showBossUI();
    }
    
    startRaidBossSequence() {
        // 超巨大警告メッセージ
        const warning = document.createElement('div');
        warning.style.cssText = `
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            font-size: 72px;
            color: #ff00ff;
            font-weight: bold;
            text-shadow: 0 0 30px rgba(255,0,255,0.8);
            animation: raidPulse 0.3s ease-in-out infinite;
            z-index: 1000;
            text-align: center;
        `;
        warning.innerHTML = 'RAID BOSS<br>INCOMING!';
        
        // アニメーションスタイル追加
        const style = document.createElement('style');
        style.textContent = `
            @keyframes raidPulse {
                0% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
                50% { transform: translate(-50%, -50%) scale(1.2); opacity: 0.8; }
                100% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
            }
        `;
        document.head.appendChild(style);
        
        document.body.appendChild(warning);
        
        // 5秒後に警告削除
        setTimeout(() => {
            document.body.removeChild(warning);
            document.head.removeChild(style);
        }, 5000);
        
        // 強力なカメラシェイク
        this.cameraShake(5);
    }
    
    onBossDefeated() {
        const isRaidBoss = this.currentBoss.constructor.name === 'RaidBoss';
        const bossType = this.currentBoss.constructor.name;
        
        console.log(isRaidBoss ? 'RAID BOSS DEFEATED!' : 'BOSS DEFEATED!');
        this.bossBattleActive = false;
        
        // ボス撃破数を増やす
        this.bossesDefeated++;
        
        // UI非表示
        this.hideBossUI();
        
        // 勝利演出
        this.showVictory(isRaidBoss);
        
        // 報酬
        if (this.game.score !== undefined) {
            this.game.score += isRaidBoss ? 50000 : 10000;
        }
        
        // ストーリー進行システムに通知
        if (this.game.storySystem) {
            this.game.storySystem.onBossDefeated(bossType);
        }
        
        // BGMを通常に戻す
        if (this.game.soundManager && this.game.soundManager.playNormalMusic) {
            this.game.soundManager.playNormalMusic();
        }
        
        // 次のボスのためにリセット
        this.currentBoss = null;
        if (isRaidBoss) {
            this.raidBossSpawned = false;
        } else {
            this.bossSpawned = false;
        }
    }
    
    showVictory(isRaidBoss = false) {
        const victory = document.createElement('div');
        victory.style.cssText = `
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            font-size: ${isRaidBoss ? '96px' : '72px'};
            color: ${isRaidBoss ? '#ffff00' : '#00ff00'};
            font-weight: bold;
            text-shadow: 0 0 30px rgba(${isRaidBoss ? '255,255,0' : '0,255,0'},0.8);
            animation: victoryPulse 1s ease-in-out infinite;
            z-index: 1000;
            text-align: center;
        `;
        victory.innerHTML = isRaidBoss ? 'EPIC VICTORY!<br>RAID BOSS DEFEATED!' : 'VICTORY!';
        
        const style = document.createElement('style');
        style.textContent = `
            @keyframes victoryPulse {
                0% { transform: translate(-50%, -50%) scale(1) rotate(0deg); }
                50% { transform: translate(-50%, -50%) scale(1.2) rotate(5deg); }
                100% { transform: translate(-50%, -50%) scale(1) rotate(0deg); }
            }
        `;
        document.head.appendChild(style);
        
        document.body.appendChild(victory);
        
        // 削除タイマー（レイドボスは長め）
        setTimeout(() => {
            document.body.removeChild(victory);
            document.head.removeChild(style);
        }, isRaidBoss ? 8000 : 5000);
    }
    
    // プレイヤーとボスの衝突判定
    checkBossCollision(playerPosition, playerRadius = 3) {
        if (!this.currentBoss || !this.currentBoss.isAlive) return null;
        
        const bossBox = this.currentBoss.getBoundingBox();
        const playerSphere = new THREE.Sphere(playerPosition, playerRadius);
        
        if (bossBox.intersectsSphere(playerSphere)) {
            // 部位判定
            const hitPart = this.currentBoss.checkPartHit(playerPosition);
            return {
                boss: this.currentBoss,
                part: hitPart
            };
        }
        
        return null;
    }
    
    // デバッグ用：強制ボス出現
    forceSpawnBoss() {
        if (!this.bossSpawned && !this.raidBossSpawned) {
            window.debugBossSpawn = true;
            this.spawnBoss();
            window.debugBossSpawn = false;
        }
    }
    
    // デバッグ用：強制レイドボス出現
    forceSpawnRaidBoss() {
        if (!this.raidBossSpawned) {
            // 中ボスが出現中の場合は削除
            if (this.currentBoss && this.currentBoss.isAlive) {
                this.currentBoss.destroy();
                this.currentBoss = null;
                this.bossSpawned = false;
            }
            
            window.debugRaidBossSpawn = true;
            this.spawnRaidBoss();
            window.debugRaidBossSpawn = false;
        }
    }
}