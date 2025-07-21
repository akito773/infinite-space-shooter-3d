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

// ゲーム初期化
window.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('planet-container');
    
    // ローディング表示を削除
    const loading = document.getElementById('loading');
    if (loading) loading.remove();
    
    // ゲームインスタンス作成
    const planetGame = new PlanetLandingGame({
        container: container,
        planetData: mockPlanetData,
        onReturn: (data) => {
            console.log('メインゲームに戻る:', data);
            // 本番環境では、ここでメインゲームにイベントを送信
            window.dispatchEvent(new CustomEvent('returnToSpace', { detail: data }));
        }
    });
    
    // 開発用：グローバルに公開
    window.planetGame = planetGame;
    
    // ゲーム開始
    planetGame.start();
    
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