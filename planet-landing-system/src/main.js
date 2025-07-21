// 惑星着陸システム - エントリーポイント

import { PlanetLandingGame } from './PlanetLandingGame.js';

// 開発用のモックデータ
const mockPlanetData = {
    playerId: "dev_player",
    playerData: {
        credits: 10000,
        inventory: {
            repair_kit: 5,
            energy_cell: 10
        },
        unlockedTech: ["basic_mining", "basic_building"]
    },
    planetData: {
        id: "planet_emerald",
        name: "エメラルド",
        type: "terrestrial",
        position: { x: 300, y: -30, z: 400 },
        resources: {
            iron: { abundance: 0.7 },
            energy: { abundance: 0.5 },
            crystal: { abundance: 0.2 }
        }
    }
};

// タイトル画面管理
class TitleScreen {
    constructor() {
        this.planetGame = null;
        this.setupEventListeners();
    }
    
    setupEventListeners() {
        document.getElementById('new-game-btn').onclick = () => this.startNewGame();
        document.getElementById('load-game-btn').onclick = () => this.showSaveSelection();
        document.getElementById('back-btn').onclick = () => this.showMainMenu();
    }
    
    startNewGame() {
        this.hideTitle();
        this.initGame(mockPlanetData);
    }
    
    showSaveSelection() {
        document.getElementById('new-game-btn').style.display = 'none';
        document.getElementById('load-game-btn').style.display = 'none';
        document.querySelector('h1').style.display = 'none';
        document.getElementById('save-selection').classList.remove('hidden');
        
        this.loadSaveList();
    }
    
    showMainMenu() {
        document.getElementById('new-game-btn').style.display = 'block';
        document.getElementById('load-game-btn').style.display = 'block';
        document.querySelector('h1').style.display = 'block';
        document.getElementById('save-selection').classList.add('hidden');
    }
    
    loadSaveList() {
        // 一時的なSaveLoadSystemインスタンスを作成してセーブ情報取得
        const storageKey = 'planet_landing_save';
        const infoKey = `${storageKey}_info`;
        const saveInfo = JSON.parse(localStorage.getItem(infoKey) || '{}');
        
        const saveList = document.getElementById('save-list');
        saveList.innerHTML = '';
        
        let hasSaves = false;
        
        for (let slot = 0; slot < 10; slot++) {
            const info = saveInfo[slot];
            if (info) {
                hasSaves = true;
                const saveItem = document.createElement('div');
                saveItem.className = 'save-item';
                saveItem.innerHTML = `
                    <h3>スロット ${slot + 1}: ${info.planetId || '未知の惑星'}</h3>
                    <p>💰 クレジット: ${info.credits || 0}</p>
                    <p>🏢 建物数: ${info.developmentLevel || 0}</p>
                    <p>🗓️ セーブ日時: ${new Date(info.timestamp).toLocaleString()}</p>
                `;
                saveItem.onclick = () => this.loadGame(slot);
                saveList.appendChild(saveItem);
            }
        }
        
        if (!hasSaves) {
            saveList.innerHTML = '<div style="text-align: center; color: #888; padding: 40px;">セーブデータがありません</div>';
        }
    }
    
    loadGame(slot) {
        this.hideTitle();
        this.initGame(mockPlanetData, slot);
    }
    
    hideTitle() {
        document.getElementById('title-screen').style.display = 'none';
        document.getElementById('planet-container').classList.remove('hidden');
    }
    
    showTitle() {
        document.getElementById('title-screen').style.display = 'flex';
        document.getElementById('planet-container').classList.add('hidden');
        this.showMainMenu();
    }
    
    initGame(planetData, loadSlot = null) {
        const container = document.getElementById('planet-container');
        
        // ローディング表示を削除
        const loading = document.getElementById('loading');
        if (loading) loading.remove();
        
        // ゲームインスタンス作成
        this.planetGame = new PlanetLandingGame({
            container: container,
            planetData: planetData,
            onReturn: (data) => {
                console.log('メインゲームに戻る:', data);
                // タイトル画面に戻る
                this.showTitle();
                // 本番環境では、ここでメインゲームにイベントを送信
                window.dispatchEvent(new CustomEvent('returnToSpace', { detail: data }));
            }
        });
        
        // 開発用：グローバルに公開
        window.planetGame = this.planetGame;
        
        // ゲーム開始
        this.planetGame.start();
        
        // セーブデータからロード
        if (loadSlot !== null) {
            setTimeout(() => {
                if (this.planetGame.systems.saveLoad) {
                    this.planetGame.systems.saveLoad.load(loadSlot);
                }
            }, 1000); // システム初期化待ち
        }
    }
}

// ゲーム初期化
window.addEventListener('DOMContentLoaded', () => {
    const titleScreen = new TitleScreen();
    window.titleScreen = titleScreen;
    
    // メインゲームからの着陸イベントをリッスン
    window.addEventListener('landOnPlanet', (event) => {
        console.log('惑星着陸イベント受信:', event.detail);
        // 新しい惑星データでゲームを再初期化
        planetGame.loadPlanet(event.detail);
    });
});

// エラーハンドリング
window.addEventListener('error', (event) => {
    console.error('エラー発生:', event.error);
});