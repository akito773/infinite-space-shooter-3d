export class MiningSystem {
    constructor(game) {
        this.game = game;
        this.miningLaser = null;
        this.currentTarget = null;
        this.miningProgress = 0;
        this.isActive = false;
        
        this.resources = {
            iron: { name: '鉄鉱石', value: 10, rarity: 'common', color: 0x8B4513 },
            titanium: { name: 'チタン', value: 25, rarity: 'uncommon', color: 0xC0C0C0 },
            crystal: { name: 'エネルギー結晶', value: 50, rarity: 'rare', color: 0x00FFFF },
            quantum: { name: '量子鉱石', value: 100, rarity: 'epic', color: 0xFF00FF },
            void: { name: 'ヴォイド鉱石', value: 500, rarity: 'legendary', color: 0x9400D3 }
        };
        
        this.createUI();
    }
    
    createUI() {
        // 採掘進行状況UI
        this.miningUI = document.createElement('div');
        this.miningUI.id = 'mining-ui';
        this.miningUI.style.cssText = `
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 300px;
            display: none;
            z-index: 1500;
        `;
        
        this.miningUI.innerHTML = `
            <div style="
                background: rgba(0, 20, 40, 0.9);
                border: 2px solid rgba(0, 200, 255, 0.8);
                border-radius: 10px;
                padding: 15px;
                text-align: center;
            ">
                <h3 style="color: #00ffff; margin: 0 0 10px 0;">採掘中...</h3>
                <div style="
                    width: 100%;
                    height: 20px;
                    background: rgba(0, 0, 0, 0.5);
                    border-radius: 10px;
                    overflow: hidden;
                ">
                    <div id="mining-progress" style="
                        width: 0%;
                        height: 100%;
                        background: linear-gradient(90deg, #00ff00, #00ffff);
                        transition: width 0.1s;
                    "></div>
                </div>
                <p id="mining-target" style="color: white; margin: 10px 0 0 0;"></p>
            </div>
        `;
        
        document.getElementById('ui-overlay').appendChild(this.miningUI);
        
        // 採掘結果UI
        this.resultUI = document.createElement('div');
        this.resultUI.style.cssText = `
            position: absolute;
            top: 40%;
            left: 50%;
            transform: translate(-50%, -50%);
            display: none;
            z-index: 1600;
        `;
        
        document.getElementById('ui-overlay').appendChild(this.resultUI);
    }
    
    startMining(asteroid) {
        if (this.isActive || !asteroid || !asteroid.userData.mineable) return;
        
        this.isActive = true;
        this.currentTarget = asteroid;
        this.miningProgress = 0;
        
        // UI表示
        this.miningUI.style.display = 'block';
        const resource = asteroid.userData.resource || 'iron';
        document.getElementById('mining-target').textContent = 
            this.resources[resource].name;
        
        // 採掘レーザーエフェクト
        this.createMiningLaser();
        
        // サウンド再生
        if (this.game.soundManager) {
            this.game.soundManager.play('mining');
        }
    }
    
    createMiningLaser() {
        const material = new THREE.LineBasicMaterial({
            color: 0x00ff00,
            linewidth: 3,
            transparent: true,
            opacity: 0.8
        });
        
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(6);
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        
        this.miningLaser = new THREE.Line(geometry, material);
        this.game.scene.add(this.miningLaser);
    }
    
    updateMining(delta) {
        if (!this.isActive || !this.currentTarget) return;
        
        // プレイヤーとの距離チェック
        const distance = this.game.player.group.position.distanceTo(
            this.currentTarget.position
        );
        
        if (distance > 50) {
            this.cancelMining();
            return;
        }
        
        // 採掘進行
        const miningSpeed = 20; // 1秒あたりの進行率
        this.miningProgress += miningSpeed * delta;
        
        // UI更新
        const progressBar = document.getElementById('mining-progress');
        if (progressBar) {
            progressBar.style.width = `${Math.min(this.miningProgress, 100)}%`;
        }
        
        // レーザー更新
        if (this.miningLaser) {
            const positions = this.miningLaser.geometry.attributes.position.array;
            const start = this.game.player.group.position;
            const end = this.currentTarget.position;
            
            positions[0] = start.x;
            positions[1] = start.y;
            positions[2] = start.z;
            positions[3] = end.x;
            positions[4] = end.y;
            positions[5] = end.z;
            
            this.miningLaser.geometry.attributes.position.needsUpdate = true;
            
            // レーザーの点滅エフェクト
            this.miningLaser.material.opacity = 0.5 + Math.sin(Date.now() * 0.01) * 0.3;
        }
        
        // 採掘完了
        if (this.miningProgress >= 100) {
            this.completeMining();
        }
    }
    
    completeMining() {
        if (!this.currentTarget) return;
        
        const resource = this.currentTarget.userData.resource || 'iron';
        const amount = this.calculateYield(resource);
        
        // リソース追加
        this.addResource(resource, amount);
        
        // 結果表示
        this.showMiningResult(resource, amount);
        
        // 小惑星を削除
        if (this.currentTarget.userData.destroy) {
            this.currentTarget.userData.destroy();
        }
        
        // クリーンアップ
        this.cleanup();
    }
    
    calculateYield(resource) {
        const baseYield = {
            iron: 10,
            titanium: 5,
            crystal: 3,
            quantum: 2,
            void: 1
        };
        
        // ランダム要素を追加
        const variance = 0.5;
        const multiplier = 1 + (Math.random() - 0.5) * variance;
        
        return Math.floor(baseYield[resource] * multiplier);
    }
    
    addResource(resource, amount) {
        // インベントリシステムに追加（簡易実装）
        const currentResources = JSON.parse(
            localStorage.getItem('resources') || '{}'
        );
        
        currentResources[resource] = (currentResources[resource] || 0) + amount;
        localStorage.setItem('resources', JSON.stringify(currentResources));
        
        // クレジット換算
        const value = this.resources[resource].value * amount;
        this.game.inventorySystem.addCredits(value);
    }
    
    showMiningResult(resource, amount) {
        const resourceData = this.resources[resource];
        
        this.resultUI.innerHTML = `
            <div style="
                background: rgba(0, 30, 0, 0.95);
                border: 2px solid rgba(0, 255, 0, 0.8);
                border-radius: 15px;
                padding: 20px;
                text-align: center;
                animation: fadeInScale 0.5s ease-out;
            ">
                <h3 style="color: #00ff00; margin: 0 0 10px 0;">採掘成功！</h3>
                <p style="
                    color: ${this.getRarityColor(resourceData.rarity)};
                    font-size: 20px;
                    margin: 10px 0;
                ">
                    ${resourceData.name} x${amount}
                </p>
                <p style="color: #ffaa00;">
                    💰 ${resourceData.value * amount} クレジット獲得
                </p>
            </div>
        `;
        
        this.resultUI.style.display = 'block';
        
        // アニメーションスタイル
        if (!document.querySelector('#mining-animation-style')) {
            const style = document.createElement('style');
            style.id = 'mining-animation-style';
            style.textContent = `
                @keyframes fadeInScale {
                    0% {
                        opacity: 0;
                        transform: scale(0.8);
                    }
                    100% {
                        opacity: 1;
                        transform: scale(1);
                    }
                }
            `;
            document.head.appendChild(style);
        }
        
        setTimeout(() => {
            this.resultUI.style.display = 'none';
        }, 3000);
    }
    
    getRarityColor(rarity) {
        const colors = {
            common: '#ffffff',
            uncommon: '#00ff00',
            rare: '#0088ff',
            epic: '#ff00ff',
            legendary: '#ff8800'
        };
        return colors[rarity] || '#ffffff';
    }
    
    cancelMining() {
        this.cleanup();
        
        // キャンセルメッセージ
        this.game.showCollectMessage('採掘を中断しました');
    }
    
    cleanup() {
        this.isActive = false;
        this.currentTarget = null;
        this.miningProgress = 0;
        
        // UI非表示
        this.miningUI.style.display = 'none';
        
        // レーザー削除
        if (this.miningLaser) {
            this.game.scene.remove(this.miningLaser);
            this.miningLaser.geometry.dispose();
            this.miningLaser.material.dispose();
            this.miningLaser = null;
        }
    }
    
    // 採掘可能な小惑星を生成
    createMineableAsteroid(position, resourceType = null) {
        // ランダムなリソースタイプ
        if (!resourceType) {
            const rand = Math.random();
            if (rand < 0.5) resourceType = 'iron';
            else if (rand < 0.75) resourceType = 'titanium';
            else if (rand < 0.9) resourceType = 'crystal';
            else if (rand < 0.98) resourceType = 'quantum';
            else resourceType = 'void';
        }
        
        const resourceData = this.resources[resourceType];
        const size = 3 + Math.random() * 2;
        
        const geometry = new THREE.DodecahedronGeometry(size, 0);
        const material = new THREE.MeshPhongMaterial({
            color: resourceData.color,
            emissive: resourceData.color,
            emissiveIntensity: 0.2,
            shininess: 30
        });
        
        const asteroid = new THREE.Mesh(geometry, material);
        asteroid.position.copy(position);
        
        // 採掘情報を追加
        asteroid.userData.mineable = true;
        asteroid.userData.resource = resourceType;
        asteroid.userData.health = 100;
        
        // ゆっくり回転
        asteroid.userData.update = (delta) => {
            asteroid.rotation.x += delta * 0.1;
            asteroid.rotation.y += delta * 0.15;
        };
        
        // 削除関数
        asteroid.userData.destroy = () => {
            this.game.scene.remove(asteroid);
            asteroid.geometry.dispose();
            asteroid.material.dispose();
        };
        
        this.game.scene.add(asteroid);
        
        return asteroid;
    }
}