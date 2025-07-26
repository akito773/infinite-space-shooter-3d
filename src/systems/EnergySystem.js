// エネルギーシステム

export class EnergySystem {
    constructor(game) {
        this.game = game;
        
        // エネルギー関連のパラメータ
        this.maxEnergy = 100;
        this.currentEnergy = this.maxEnergy;
        this.rechargeRate = 20; // 毎秒のリチャージ量
        this.rechargeDelay = 1; // リチャージ開始までの遅延（秒）
        this.lastEnergyUse = 0;
        
        // オーバーヒート
        this.heat = 0;
        this.maxHeat = 100;
        this.heatDissipationRate = 15; // 毎秒の放熱量
        this.isOverheated = false;
        this.overheatThreshold = 90;
        this.overheatRecoveryThreshold = 30;
        
        // エネルギーブースト
        this.boostActive = false;
        this.boostMultiplier = 1;
        this.boostDuration = 0;
        
        // UI要素
        this.createUI();
        this.setupStyles();
    }
    
    createUI() {
        this.container = document.createElement('div');
        this.container.id = 'energy-ui';
        this.container.style.cssText = `
            position: absolute;
            bottom: 150px;
            right: 20px;
            width: 250px;
            font-family: 'Orbitron', monospace;
            font-size: 14px;
            color: white;
            user-select: none;
            pointer-events: none;
            z-index: 1000;
        `;
        
        // エネルギーバーコンテナ
        const energyContainer = document.createElement('div');
        energyContainer.style.cssText = `
            margin-bottom: 10px;
        `;
        
        // エネルギーラベル
        this.energyLabel = document.createElement('div');
        this.energyLabel.style.cssText = `
            display: flex;
            justify-content: space-between;
            margin-bottom: 5px;
            font-size: 12px;
            color: #00ffff;
        `;
        
        // エネルギーバー
        this.energyBar = document.createElement('div');
        this.energyBar.style.cssText = `
            width: 100%;
            height: 20px;
            background: rgba(0, 255, 255, 0.2);
            border: 2px solid #00ffff;
            border-radius: 10px;
            overflow: hidden;
            position: relative;
        `;
        
        this.energyFill = document.createElement('div');
        this.energyFill.style.cssText = `
            height: 100%;
            background: linear-gradient(90deg, #00ffff 0%, #00aaff 100%);
            width: 100%;
            transition: width 0.2s ease-out;
            box-shadow: inset 0 0 10px rgba(0, 255, 255, 0.5);
        `;
        
        // エネルギー値表示
        this.energyText = document.createElement('div');
        this.energyText.style.cssText = `
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            font-size: 12px;
            font-weight: bold;
            text-shadow: 0 0 5px rgba(0, 0, 0, 0.8);
        `;
        
        // ヒートバー
        const heatContainer = document.createElement('div');
        heatContainer.style.cssText = `
            margin-top: 10px;
        `;
        
        this.heatLabel = document.createElement('div');
        this.heatLabel.style.cssText = `
            font-size: 12px;
            color: #ff8800;
            margin-bottom: 5px;
        `;
        this.heatLabel.textContent = 'ヒートレベル';
        
        this.heatBar = document.createElement('div');
        this.heatBar.style.cssText = `
            width: 100%;
            height: 10px;
            background: rgba(255, 136, 0, 0.2);
            border: 1px solid #ff8800;
            border-radius: 5px;
            overflow: hidden;
            position: relative;
        `;
        
        this.heatFill = document.createElement('div');
        this.heatFill.style.cssText = `
            height: 100%;
            background: linear-gradient(90deg, #ff8800 0%, #ff0000 100%);
            width: 0%;
            transition: width 0.2s ease-out;
        `;
        
        // オーバーヒート警告
        this.overheatWarning = document.createElement('div');
        this.overheatWarning.className = 'overheat-warning';
        this.overheatWarning.style.cssText = `
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            color: #ff0000;
            font-size: 24px;
            font-weight: bold;
            text-transform: uppercase;
            display: none;
            text-shadow: 0 0 20px #ff0000;
            animation: overheat-pulse 0.5s infinite;
        `;
        this.overheatWarning.textContent = 'オーバーヒート！';
        
        // 組み立て
        this.energyBar.appendChild(this.energyFill);
        this.energyBar.appendChild(this.energyText);
        energyContainer.appendChild(this.energyLabel);
        energyContainer.appendChild(this.energyBar);
        
        this.heatBar.appendChild(this.heatFill);
        heatContainer.appendChild(this.heatLabel);
        heatContainer.appendChild(this.heatBar);
        
        this.container.appendChild(energyContainer);
        this.container.appendChild(heatContainer);
        this.container.appendChild(this.overheatWarning);
        
        document.body.appendChild(this.container);
    }
    
    setupStyles() {
        const style = document.createElement('style');
        style.textContent = `
            @keyframes overheat-pulse {
                0% { opacity: 0.5; transform: translate(-50%, -50%) scale(1); }
                50% { opacity: 1; transform: translate(-50%, -50%) scale(1.1); }
                100% { opacity: 0.5; transform: translate(-50%, -50%) scale(1); }
            }
            
            @keyframes energy-low-flash {
                0% { border-color: #00ffff; }
                50% { border-color: #ff0000; }
                100% { border-color: #00ffff; }
            }
            
            .energy-low {
                animation: energy-low-flash 0.5s infinite;
            }
            
            @keyframes heat-critical {
                0% { background: rgba(255, 136, 0, 0.2); }
                50% { background: rgba(255, 0, 0, 0.4); }
                100% { background: rgba(255, 136, 0, 0.2); }
            }
            
            .heat-critical {
                animation: heat-critical 0.3s infinite;
            }
            
            .energy-boost {
                box-shadow: 0 0 20px #ffff00, inset 0 0 20px rgba(255, 255, 0, 0.5) !important;
            }
        `;
        document.head.appendChild(style);
    }
    
    useEnergy(amount) {
        // オーバーヒート中はエネルギー使用不可
        if (this.isOverheated) {
            this.showOverheatMessage();
            return false;
        }
        
        // エネルギー不足チェック
        if (this.currentEnergy < amount) {
            this.showEnergyLowMessage();
            return false;
        }
        
        // エネルギー消費
        this.currentEnergy -= amount * (1 / this.boostMultiplier);
        this.lastEnergyUse = Date.now();
        
        // ヒート生成
        this.generateHeat(amount * 0.5);
        
        this.updateUI();
        return true;
    }
    
    generateHeat(amount) {
        this.heat = Math.min(this.heat + amount, this.maxHeat);
        
        // オーバーヒートチェック
        if (!this.isOverheated && this.heat >= this.overheatThreshold) {
            this.triggerOverheat();
        }
    }
    
    triggerOverheat() {
        this.isOverheated = true;
        this.overheatWarning.style.display = 'block';
        this.heatBar.classList.add('heat-critical');
        
        // サウンド再生
        if (this.game.soundManager) {
            this.game.soundManager.play('overheat_warning');
        }
        
        // ルナに通知
        if (this.game.companionSystem) {
            this.game.companionSystem.playVoice('overheat_warning');
        }
    }
    
    update(delta) {
        // エネルギーリチャージ
        const timeSinceLastUse = (Date.now() - this.lastEnergyUse) / 1000;
        if (timeSinceLastUse >= this.rechargeDelay && this.currentEnergy < this.maxEnergy) {
            this.currentEnergy = Math.min(
                this.currentEnergy + this.rechargeRate * delta,
                this.maxEnergy
            );
        }
        
        // ヒート放熱
        if (this.heat > 0) {
            this.heat = Math.max(0, this.heat - this.heatDissipationRate * delta);
            
            // オーバーヒート回復
            if (this.isOverheated && this.heat <= this.overheatRecoveryThreshold) {
                this.recoverFromOverheat();
            }
        }
        
        // ブースト時間管理
        if (this.boostActive) {
            this.boostDuration -= delta;
            if (this.boostDuration <= 0) {
                this.deactivateBoost();
            }
        }
        
        this.updateUI();
    }
    
    recoverFromOverheat() {
        this.isOverheated = false;
        this.overheatWarning.style.display = 'none';
        this.heatBar.classList.remove('heat-critical');
        
        // サウンド再生
        if (this.game.soundManager) {
            this.game.soundManager.play('system_ready');
        }
    }
    
    updateUI() {
        // エネルギー表示
        const energyPercent = (this.currentEnergy / this.maxEnergy) * 100;
        this.energyFill.style.width = `${energyPercent}%`;
        this.energyText.textContent = `${Math.floor(this.currentEnergy)} / ${this.maxEnergy}`;
        this.energyLabel.innerHTML = `
            <span>エネルギー</span>
            <span>${Math.floor(energyPercent)}%</span>
        `;
        
        // エネルギー低下警告
        if (energyPercent < 20) {
            this.energyBar.classList.add('energy-low');
        } else {
            this.energyBar.classList.remove('energy-low');
        }
        
        // ヒート表示
        const heatPercent = (this.heat / this.maxHeat) * 100;
        this.heatFill.style.width = `${heatPercent}%`;
        
        // ヒートレベルによる色変更
        if (heatPercent > 75) {
            this.heatFill.style.background = 'linear-gradient(90deg, #ff0000 0%, #ff0066 100%)';
        } else if (heatPercent > 50) {
            this.heatFill.style.background = 'linear-gradient(90deg, #ff8800 0%, #ff0000 100%)';
        } else {
            this.heatFill.style.background = 'linear-gradient(90deg, #ff8800 0%, #ffaa00 100%)';
        }
        
        // ブースト表示
        if (this.boostActive) {
            this.energyBar.classList.add('energy-boost');
            this.energyFill.style.background = 'linear-gradient(90deg, #ffff00 0%, #ff8800 100%)';
        } else {
            this.energyBar.classList.remove('energy-boost');
            this.energyFill.style.background = 'linear-gradient(90deg, #00ffff 0%, #00aaff 100%)';
        }
    }
    
    showEnergyLowMessage() {
        if (this.game.showMessage) {
            this.game.showMessage('エネルギー不足！', 1000);
        }
    }
    
    showOverheatMessage() {
        if (this.game.showMessage) {
            this.game.showMessage('オーバーヒート中！冷却を待ってください', 1500);
        }
    }
    
    activateBoost(duration = 10, multiplier = 1.5) {
        this.boostActive = true;
        this.boostDuration = duration;
        this.boostMultiplier = multiplier;
        
        // サウンド再生
        if (this.game.soundManager) {
            this.game.soundManager.play('energy_boost');
        }
    }
    
    deactivateBoost() {
        this.boostActive = false;
        this.boostMultiplier = 1;
    }
    
    addMaxEnergy(amount) {
        this.maxEnergy += amount;
        this.currentEnergy = Math.min(this.currentEnergy + amount, this.maxEnergy);
        this.updateUI();
    }
    
    restoreEnergy(amount) {
        this.currentEnergy = Math.min(this.currentEnergy + amount, this.maxEnergy);
        this.updateUI();
    }
    
    coolDown(amount) {
        this.heat = Math.max(0, this.heat - amount);
        this.updateUI();
    }
    
    getEnergyPercent() {
        return this.currentEnergy / this.maxEnergy;
    }
    
    getHeatPercent() {
        return this.heat / this.maxHeat;
    }
    
    canUseEnergy(amount) {
        return !this.isOverheated && this.currentEnergy >= amount;
    }
}