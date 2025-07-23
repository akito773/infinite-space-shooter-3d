// デバッグパネルシステム

export class DebugPanel {
    constructor(game) {
        this.game = game;
        this.isVisible = false;
        this.panel = null;
        this.logs = [];
        
        this.createPanel();
        this.setupKeyBindings();
    }
    
    createPanel() {
        // メインパネル
        this.panel = document.createElement('div');
        this.panel.id = 'debug-panel';
        this.panel.style.cssText = `
            position: fixed;
            top: 10px;
            right: 10px;
            width: 400px;
            max-height: 80vh;
            background: rgba(0, 0, 0, 0.9);
            border: 2px solid #00ffff;
            border-radius: 10px;
            padding: 15px;
            color: #00ffff;
            font-family: monospace;
            font-size: 12px;
            display: none;
            overflow-y: auto;
            z-index: 10000;
        `;
        
        // ヘッダー
        const header = document.createElement('div');
        header.innerHTML = `
            <h3 style="margin: 0 0 10px 0; color: #00ffff;">🔧 デバッグパネル</h3>
            <div style="border-bottom: 1px solid #00ffff; margin-bottom: 10px; padding-bottom: 10px;">
                <button onclick="window.debugPanel.testPlanetDiscovery()" style="margin: 2px; padding: 5px 10px; background: #0066cc; color: white; border: none; cursor: pointer;">惑星発見テスト</button>
                <button onclick="window.debugPanel.checkSystems()" style="margin: 2px; padding: 5px 10px; background: #0066cc; color: white; border: none; cursor: pointer;">システム確認</button>
                <button onclick="window.debugPanel.showMapData()" style="margin: 2px; padding: 5px 10px; background: #0066cc; color: white; border: none; cursor: pointer;">マップデータ</button>
                <button onclick="window.debugPanel.clearLogs()" style="margin: 2px; padding: 5px 10px; background: #cc0000; color: white; border: none; cursor: pointer;">クリア</button>
            </div>
        `;
        
        // ログエリア
        this.logArea = document.createElement('div');
        this.logArea.id = 'debug-log-area';
        this.logArea.style.cssText = `
            max-height: 400px;
            overflow-y: auto;
            background: rgba(0, 0, 0, 0.5);
            padding: 10px;
            border-radius: 5px;
            white-space: pre-wrap;
            word-wrap: break-word;
        `;
        
        this.panel.appendChild(header);
        this.panel.appendChild(this.logArea);
        document.body.appendChild(this.panel);
        
        // グローバルに公開
        window.debugPanel = this;
    }
    
    setupKeyBindings() {
        document.addEventListener('keydown', (e) => {
            // F9でデバッグパネル切り替え
            if (e.key === 'F9') {
                this.toggle();
            }
        });
    }
    
    toggle() {
        this.isVisible = !this.isVisible;
        this.panel.style.display = this.isVisible ? 'block' : 'none';
        if (this.isVisible) {
            this.log('デバッグパネルを開きました (F9で閉じる)', 'info');
        }
    }
    
    log(message, type = 'info') {
        const timestamp = new Date().toLocaleTimeString();
        const colorMap = {
            info: '#00ffff',
            success: '#00ff00',
            warning: '#ffaa00',
            error: '#ff0000'
        };
        const color = colorMap[type] || '#ffffff';
        
        const logEntry = `<span style="color: ${color}">[${timestamp}] ${type.toUpperCase()}: ${message}</span>`;
        this.logs.push(logEntry);
        
        // 最新20件のみ表示
        this.logArea.innerHTML = this.logs.slice(-20).join('<br>');
        this.logArea.scrollTop = this.logArea.scrollHeight;
        
        // コンソールにも出力
        console.log(`[DEBUG] ${message}`);
    }
    
    checkSystems() {
        this.log('=== システム状態確認 ===', 'info');
        const systems = {
            'Game': !!this.game,
            'PlanetDiscoverySystem': !!this.game?.planetDiscoverySystem,
            'ZoneManager': !!this.game?.zoneManager,
            'GalaxyMap': !!this.game?.galaxyMap,
            'WarpSystem': !!this.game?.warpSystem
        };
        
        for (const [name, status] of Object.entries(systems)) {
            this.log(`${name}: ${status ? '✓ OK' : '✗ NG'}`, status ? 'success' : 'error');
        }
        
        if (this.game?.zoneManager?.discoveredPlanets) {
            this.log(`動的惑星数: ${this.game.zoneManager.discoveredPlanets.size}`, 'info');
        }
    }
    
    testPlanetDiscovery() {
        this.log('=== 惑星発見テスト開始 ===', 'warning');
        
        if (!this.game?.planetDiscoverySystem) {
            this.log('PlanetDiscoverySystemが見つかりません', 'error');
            return;
        }
        
        const testPlanet = {
            id: 'debug_planet_' + Date.now(),
            name: 'デバッグ惑星-' + Math.floor(Math.random() * 999),
            type: 'crystal',
            zone: this.game.zoneManager.currentZone,
            position: { 
                x: 300 + Math.random() * 400, 
                y: Math.random() * 100 - 50, 
                z: 300 + Math.random() * 400 
            },
            radius: 30,
            color: 0xFF69B4,
            discoveryCondition: { type: 'scan' },
            rewards: {
                credits: 5000,
                items: ['debug_crystal'],
                experience: 500
            },
            lore: 'デバッグ用に生成された神秘的な惑星'
        };
        
        this.log(`惑星を発見: ${testPlanet.name}`, 'success');
        
        // 発見前の状態を記録
        const beforeSize = this.game.zoneManager.discoveredPlanets.size;
        
        // 惑星を発見
        this.game.planetDiscoverySystem.discoverPlanet(testPlanet);
        
        // 発見後の状態を確認
        setTimeout(() => {
            const afterSize = this.game.zoneManager.discoveredPlanets.size;
            if (afterSize > beforeSize) {
                this.log('ZoneManagerに正常に登録されました', 'success');
                this.log(`登録済み動的惑星数: ${afterSize}`, 'info');
                
                // マップを開いて確認を促す
                this.log('Mキーでマップを開いて確認してください', 'warning');
            } else {
                this.log('ZoneManagerへの登録に失敗しました', 'error');
            }
        }, 100);
    }
    
    showMapData() {
        this.log('=== マップデータ確認 ===', 'info');
        
        if (!this.game?.zoneManager) {
            this.log('ZoneManagerが見つかりません', 'error');
            return;
        }
        
        const allPlanets = this.game.zoneManager.getAllPlanetsForMap();
        const planetCount = Object.keys(allPlanets).length;
        this.log(`総惑星数: ${planetCount}`, 'info');
        
        let staticCount = 0;
        let dynamicCount = 0;
        
        for (const [id, planet] of Object.entries(allPlanets)) {
            if (planet.isDynamic) {
                dynamicCount++;
                this.log(`- [動的] ${planet.name || planet.japaneseName} (${id})`, 'success');
            } else {
                staticCount++;
                this.log(`- [静的] ${planet.japaneseName || planet.name} (${id})`, 'info');
            }
        }
        
        this.log(`静的惑星: ${staticCount}, 動的惑星: ${dynamicCount}`, 'warning');
        
        // 現在のゾーンの動的惑星を詳細表示
        const currentZone = this.game.zoneManager.currentZone;
        this.log(`\n現在のゾーン (${currentZone}) の動的惑星:`, 'info');
        
        let foundInCurrentZone = false;
        for (const [id, planet] of this.game.zoneManager.discoveredPlanets) {
            if (planet.zone === currentZone) {
                foundInCurrentZone = true;
                this.log(`  ${planet.name} - 位置: (${Math.round(planet.position.x)}, ${Math.round(planet.position.y)}, ${Math.round(planet.position.z)})`, 'success');
            }
        }
        
        if (!foundInCurrentZone) {
            this.log('  現在のゾーンに動的惑星はありません', 'warning');
        }
    }
    
    clearLogs() {
        this.logs = [];
        this.logArea.innerHTML = '';
        this.log('ログをクリアしました', 'info');
    }
    
    // 惑星発見時のフック
    onPlanetDiscovered(planetData) {
        this.log(`🌟 惑星発見: ${planetData.name}`, 'success');
        this.log(`  ID: ${planetData.id}`, 'info');
        this.log(`  ゾーン: ${planetData.zone}`, 'info');
        this.log(`  タイプ: ${planetData.type}`, 'info');
    }
    
    // マップ描画時のフック
    onMapDraw(planetCount) {
        this.log(`マップ描画: ${planetCount}個の惑星`, 'info');
    }
}