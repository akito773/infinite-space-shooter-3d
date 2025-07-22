export class WaveManager {
    constructor(game) {
        this.game = game;
        this.currentWave = 0;
        this.enemiesPerWave = 3;
        this.enemiesKilledInWave = 0;
        this.waveStartTime = 0;
        this.waveComplete = false;
        this.bossWaveInterval = 5; // 5ウェーブごとにボス
        this.enabled = true; // ウェーブシステムの有効/無効
        
        this.waveConfigs = [
            { normalEnemies: 3, fastEnemies: 0, strongEnemies: 0 },
            { normalEnemies: 4, fastEnemies: 1, strongEnemies: 0 },
            { normalEnemies: 3, fastEnemies: 2, strongEnemies: 0 },
            { normalEnemies: 3, fastEnemies: 2, strongEnemies: 1 },
            { normalEnemies: 2, fastEnemies: 2, strongEnemies: 2 },
        ];
    }
    
    startNextWave() {
        this.currentWave++;
        this.enemiesKilledInWave = 0;
        this.waveComplete = false;
        this.waveStartTime = Date.now();
        
        // ウェーブメッセージを表示
        this.showWaveMessage(`Wave ${this.currentWave}`);
        
        // ボスウェーブかチェック
        if (this.currentWave % this.bossWaveInterval === 0) {
            this.spawnBossWave();
        } else {
            this.spawnNormalWave();
        }
    }
    
    spawnNormalWave() {
        // ウェーブ設定を取得（繰り返し）
        const configIndex = (this.currentWave - 1) % this.waveConfigs.length;
        const config = this.waveConfigs[configIndex];
        
        // 難易度調整（ウェーブが進むごとに敵が増える）
        const difficultyMultiplier = 1 + Math.floor(this.currentWave / 5) * 0.5;
        
        const totalEnemies = Math.floor(
            (config.normalEnemies + config.fastEnemies + config.strongEnemies) * difficultyMultiplier
        );
        
        this.enemiesPerWave = totalEnemies;
        
        // 敵をスポーン
        let enemiesSpawned = 0;
        
        // 強い敵
        for (let i = 0; i < Math.floor(config.strongEnemies * difficultyMultiplier); i++) {
            this.spawnEnemy('strong');
            enemiesSpawned++;
        }
        
        // 速い敵
        for (let i = 0; i < Math.floor(config.fastEnemies * difficultyMultiplier); i++) {
            this.spawnEnemy('fast');
            enemiesSpawned++;
        }
        
        // 通常の敵
        for (let i = 0; i < totalEnemies - enemiesSpawned; i++) {
            this.spawnEnemy('normal');
        }
    }
    
    spawnBossWave() {
        this.showWaveMessage(`BOSS WAVE ${this.currentWave}!`, '#ff0000');
        this.enemiesPerWave = 1; // ボスは1体
        
        // ボスを生成（後で実装）
        this.spawnEnemy('boss');
    }
    
    spawnEnemy(type) {
        const angle = Math.random() * Math.PI * 2;
        const radius = 100 + Math.random() * 50;
        const x = Math.cos(angle) * radius;
        const z = Math.sin(angle) * radius;
        
        setTimeout(() => {
            // Game.jsのspawnEnemiesメソッドを呼び出す代わりに、直接敵を作成
            if (this.game && this.game.enemies && this.game.player) {
                const enemy = new (window.EnemyShip || this.game.enemies[0].constructor)(this.game.scene);
                enemy.group.position.set(x, Math.random() * 20 - 10, z);
                enemy.target = this.game.player.group;
                
                // タイプに応じて設定
                switch(type) {
                    case 'normal':
                        enemy.speed = 30;
                        enemy.health = 50;
                        enemy.scoreValue = 100;
                        break;
                    case 'fast':
                        enemy.speed = 50;
                        enemy.health = 30;
                        enemy.scoreValue = 150;
                        if (enemy.bodyMesh) {
                            enemy.bodyMesh.material.color.set(0xff8800);
                        }
                        break;
                    case 'strong':
                        enemy.speed = 20;
                        enemy.health = 100;
                        enemy.scoreValue = 300;
                        enemy.group.scale.setScalar(1.5);
                        if (enemy.bodyMesh) {
                            enemy.bodyMesh.material.color.set(0xff0088);
                        }
                        break;
                    case 'boss':
                        // ボスの実装は後で
                        enemy.speed = 15;
                        enemy.health = 500;
                        enemy.scoreValue = 1000;
                        enemy.group.scale.setScalar(3);
                        if (enemy.bodyMesh) {
                            enemy.bodyMesh.material.color.set(0x8800ff);
                        }
                        break;
                }
                
                this.game.enemies.push(enemy);
            }
        }, Math.random() * 2000); // ランダムな遅延でスポーン
    }
    
    onEnemyKilled() {
        this.enemiesKilledInWave++;
        
        // ウェーブクリアチェック
        if (this.enemiesKilledInWave >= this.enemiesPerWave && !this.waveComplete) {
            this.waveComplete = true;
            const waveTime = (Date.now() - this.waveStartTime) / 1000;
            
            // ウェーブクリアボーナス
            const timeBonus = Math.max(0, Math.floor((60 - waveTime) * 10));
            const waveBonus = 500 * this.currentWave;
            const totalBonus = waveBonus + timeBonus;
            
            this.game.updateScore(totalBonus);
            this.showWaveMessage(`Wave ${this.currentWave} Clear! +${totalBonus}`, '#00ff00');
            
            // 次のウェーブ開始
            setTimeout(() => {
                this.startNextWave();
            }, 3000);
        }
    }
    
    showWaveMessage(message, color = '#ffffff') {
        // 既存のウェーブメッセージを削除
        const existingMessage = document.querySelector('.wave-message');
        if (existingMessage) {
            existingMessage.remove();
        }
        
        // 新しいメッセージを表示
        const messageElement = document.createElement('div');
        messageElement.className = 'wave-message';
        messageElement.textContent = message;
        messageElement.style.cssText = `
            position: absolute;
            left: 50%;
            top: 20%;
            transform: translateX(-50%);
            color: ${color};
            font-size: 48px;
            font-weight: bold;
            text-shadow: 3px 3px 6px rgba(0,0,0,0.8);
            pointer-events: none;
            animation: waveFade 3s ease-out;
        `;
        
        // アニメーションスタイルを追加
        if (!document.querySelector('#wave-animation-style')) {
            const style = document.createElement('style');
            style.id = 'wave-animation-style';
            style.textContent = `
                @keyframes waveFade {
                    0% {
                        opacity: 0;
                        transform: translateX(-50%) scale(0.5);
                    }
                    20% {
                        opacity: 1;
                        transform: translateX(-50%) scale(1.2);
                    }
                    40% {
                        transform: translateX(-50%) scale(1);
                    }
                    100% {
                        opacity: 0;
                        transform: translateX(-50%) scale(1);
                    }
                }
            `;
            document.head.appendChild(style);
        }
        
        document.getElementById('ui-overlay').appendChild(messageElement);
        
        // アニメーション後に削除
        setTimeout(() => {
            messageElement.remove();
        }, 3000);
    }
    
    reset() {
        this.currentWave = 0;
        this.enemiesKilledInWave = 0;
        this.waveComplete = false;
    }
}