// 武器UI表示システム

export class WeaponUI {
    constructor(game) {
        this.game = game;
        this.weaponSystem = game.weaponSystem;
        
        this.createUI();
        this.setupStyles();
    }
    
    createUI() {
        // メインコンテナ
        this.container = document.createElement('div');
        this.container.id = 'weapon-ui';
        this.container.style.cssText = `
            position: absolute;
            bottom: 20px;
            right: 20px;
            color: white;
            font-family: 'Orbitron', monospace;
            font-size: 14px;
            user-select: none;
            pointer-events: none;
            z-index: 1000;
        `;
        
        // 現在の武器表示
        this.currentWeaponContainer = document.createElement('div');
        this.currentWeaponContainer.className = 'weapon-display';
        this.currentWeaponContainer.style.cssText = `
            background: rgba(0, 0, 0, 0.7);
            border: 2px solid #00ffff;
            border-radius: 10px;
            padding: 15px;
            margin-bottom: 10px;
            min-width: 250px;
            box-shadow: 0 0 20px rgba(0, 255, 255, 0.3);
        `;
        
        // プライマリ武器
        this.primaryWeaponDisplay = document.createElement('div');
        this.primaryWeaponDisplay.style.cssText = `
            margin-bottom: 10px;
        `;
        
        // セカンダリ武器
        this.secondaryWeaponDisplay = document.createElement('div');
        this.secondaryWeaponDisplay.style.cssText = `
            margin-bottom: 10px;
            opacity: 0.7;
        `;
        
        // 弾薬表示
        this.ammoDisplay = document.createElement('div');
        this.ammoDisplay.style.cssText = `
            margin-top: 10px;
            padding-top: 10px;
            border-top: 1px solid rgba(0, 255, 255, 0.3);
        `;
        
        // クールダウンバー
        this.cooldownBar = document.createElement('div');
        this.cooldownBar.style.cssText = `
            width: 100%;
            height: 4px;
            background: rgba(0, 255, 255, 0.2);
            border-radius: 2px;
            margin-top: 5px;
            overflow: hidden;
        `;
        
        this.cooldownFill = document.createElement('div');
        this.cooldownFill.style.cssText = `
            height: 100%;
            background: #00ffff;
            width: 0%;
            transition: width 0.1s ease-out;
            box-shadow: 0 0 10px #00ffff;
        `;
        this.cooldownBar.appendChild(this.cooldownFill);
        
        // 武器切り替えインジケーター
        this.weaponSwitchIndicator = document.createElement('div');
        this.weaponSwitchIndicator.style.cssText = `
            position: absolute;
            top: -40px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(0, 255, 255, 0.9);
            color: black;
            padding: 5px 15px;
            border-radius: 20px;
            font-weight: bold;
            opacity: 0;
            transition: opacity 0.3s;
            white-space: nowrap;
        `;
        
        // 要素を組み立てる
        this.currentWeaponContainer.appendChild(this.primaryWeaponDisplay);
        this.currentWeaponContainer.appendChild(this.secondaryWeaponDisplay);
        this.currentWeaponContainer.appendChild(this.ammoDisplay);
        this.currentWeaponContainer.appendChild(this.cooldownBar);
        this.currentWeaponContainer.appendChild(this.weaponSwitchIndicator);
        
        this.container.appendChild(this.currentWeaponContainer);
        
        // ホットキー表示
        this.hotkeyDisplay = document.createElement('div');
        this.hotkeyDisplay.style.cssText = `
            margin-top: 10px;
            font-size: 12px;
            opacity: 0.7;
            text-align: center;
        `;
        this.hotkeyDisplay.innerHTML = `
            <div>1-9: 武器切り替え</div>
            <div>中クリック: セカンダリ武器</div>
        `;
        this.container.appendChild(this.hotkeyDisplay);
        
        document.body.appendChild(this.container);
    }
    
    setupStyles() {
        // アニメーション用のスタイルを追加
        const style = document.createElement('style');
        style.textContent = `
            @keyframes weapon-switch-flash {
                0% { box-shadow: 0 0 20px rgba(0, 255, 255, 0.3); }
                50% { box-shadow: 0 0 40px rgba(0, 255, 255, 0.8), inset 0 0 20px rgba(0, 255, 255, 0.3); }
                100% { box-shadow: 0 0 20px rgba(0, 255, 255, 0.3); }
            }
            
            .weapon-switching {
                animation: weapon-switch-flash 0.5s ease-out;
            }
            
            @keyframes ammo-low-pulse {
                0% { color: #ff0000; }
                50% { color: #ffff00; }
                100% { color: #ff0000; }
            }
            
            .ammo-low {
                animation: ammo-low-pulse 1s infinite;
            }
            
            @keyframes weapon-ready-glow {
                0% { opacity: 0.5; }
                100% { opacity: 1; }
            }
            
            .weapon-ready {
                animation: weapon-ready-glow 0.3s ease-out;
            }
        `;
        document.head.appendChild(style);
    }
    
    update() {
        if (!this.weaponSystem) return;
        
        // プライマリ武器表示
        const primary = this.weaponSystem.primaryWeapon;
        if (primary) {
            this.primaryWeaponDisplay.innerHTML = `
                <div style="color: #00ffff; font-size: 16px; font-weight: bold;">
                    ${primary.name}
                </div>
                <div style="color: #88ddff; font-size: 12px;">
                    ダメージ: ${primary.damage} | 連射: ${primary.fireRate}ms
                </div>
            `;
        }
        
        // セカンダリ武器表示
        const secondary = this.weaponSystem.secondaryWeapon;
        if (secondary) {
            this.secondaryWeaponDisplay.innerHTML = `
                <div style="color: #ffaa00; font-size: 14px;">
                    [中] ${secondary.name}
                </div>
            `;
            this.secondaryWeaponDisplay.style.display = 'block';
        } else {
            this.secondaryWeaponDisplay.style.display = 'none';
        }
        
        // 弾薬表示
        this.updateAmmoDisplay();
        
        // クールダウン表示
        this.updateCooldownBar();
    }
    
    updateAmmoDisplay() {
        const secondary = this.weaponSystem.secondaryWeapon;
        const special = this.weaponSystem.specialWeapon;
        
        let ammoHTML = '';
        
        if (secondary && secondary.ammo) {
            const ammoPercent = this.weaponSystem.ammo.secondary / secondary.ammo;
            const ammoClass = ammoPercent <= 0.2 ? 'ammo-low' : '';
            ammoHTML += `
                <div class="${ammoClass}">
                    ${secondary.name}: ${this.weaponSystem.ammo.secondary}/${secondary.ammo}
                </div>
            `;
        }
        
        if (special && special.ammo) {
            const ammoPercent = this.weaponSystem.ammo.special / special.ammo;
            const ammoClass = ammoPercent <= 0.2 ? 'ammo-low' : '';
            ammoHTML += `
                <div class="${ammoClass}">
                    ${special.name}: ${this.weaponSystem.ammo.special}/${special.ammo}
                </div>
            `;
        }
        
        this.ammoDisplay.innerHTML = ammoHTML || '<div style="opacity: 0.5;">弾薬不要</div>';
    }
    
    updateCooldownBar() {
        const primary = this.weaponSystem.primaryWeapon;
        if (!primary) return;
        
        const cooldownPercent = Math.max(0, this.weaponSystem.cooldowns.primary / primary.fireRate);
        this.cooldownFill.style.width = `${(1 - cooldownPercent) * 100}%`;
        
        // クールダウン完了時のエフェクト
        if (cooldownPercent === 0 && this.lastCooldownPercent > 0) {
            this.currentWeaponContainer.classList.add('weapon-ready');
            setTimeout(() => {
                this.currentWeaponContainer.classList.remove('weapon-ready');
            }, 300);
        }
        
        this.lastCooldownPercent = cooldownPercent;
    }
    
    showWeaponSwitch(weaponName) {
        this.weaponSwitchIndicator.textContent = `${weaponName}に切り替え`;
        this.weaponSwitchIndicator.style.opacity = '1';
        
        // コンテナにアニメーション
        this.currentWeaponContainer.classList.add('weapon-switching');
        
        setTimeout(() => {
            this.weaponSwitchIndicator.style.opacity = '0';
            this.currentWeaponContainer.classList.remove('weapon-switching');
        }, 1500);
    }
    
    showReloadAnimation() {
        // リロードアニメーション（将来の実装用）
        const reloadIndicator = document.createElement('div');
        reloadIndicator.style.cssText = `
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            color: #00ffff;
            font-size: 20px;
            font-weight: bold;
            animation: pulse 0.5s ease-out;
        `;
        reloadIndicator.textContent = 'RELOADING';
        this.currentWeaponContainer.appendChild(reloadIndicator);
        
        setTimeout(() => {
            reloadIndicator.remove();
        }, 1000);
    }
    
    showDamageBoost(multiplier) {
        const boostIndicator = document.createElement('div');
        boostIndicator.style.cssText = `
            position: absolute;
            top: -20px;
            right: 0;
            color: #ff00ff;
            font-size: 14px;
            font-weight: bold;
            animation: float-up 1s ease-out forwards;
        `;
        boostIndicator.textContent = `×${multiplier}`;
        this.currentWeaponContainer.appendChild(boostIndicator);
        
        setTimeout(() => {
            boostIndicator.remove();
        }, 1000);
    }
    
    dispose() {
        if (this.container && this.container.parentNode) {
            this.container.parentNode.removeChild(this.container);
        }
    }
}