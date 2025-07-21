import * as THREE from 'three';
import { Game } from './Game.js';
import { TitleScreen } from './TitleScreen.js';

// タイトル画面を表示
const titleScreen = new TitleScreen();

// ゲームインスタンスを作成
const game = new Game();

// ゲーム開始イベントをリッスン
window.addEventListener('gameStart', () => {
    // ゲーム初期化と開始
    game.init();
    game.start();
});

// 初回起動時にオープニングの案内を表示
window.addEventListener('DOMContentLoaded', () => {
    const hasSeenOpening = localStorage.getItem('hasSeenOpening');
    if (!hasSeenOpening) {
        // 初回プレイ時は案内メッセージを表示
        const firstTimeNotice = document.createElement('div');
        firstTimeNotice.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(0, 0, 20, 0.95);
            border: 2px solid rgba(0, 200, 255, 0.8);
            border-radius: 20px;
            padding: 30px 50px;
            color: white;
            text-align: center;
            z-index: 15000;
            max-width: 500px;
        `;
        firstTimeNotice.innerHTML = `
            <h2 style="color: #00ffff; margin-bottom: 20px;">初回プレイへようこそ！</h2>
            <p style="font-size: 18px; margin-bottom: 30px;">
                オープニングムービーをご覧になりますか？<br>
                <span style="font-size: 14px; opacity: 0.8;">（後でタイトル画面からも視聴できます）</span>
            </p>
            <button id="watch-opening" style="
                padding: 15px 40px;
                margin: 0 10px;
                font-size: 18px;
                background: linear-gradient(45deg, rgba(0, 100, 200, 0.8), rgba(0, 200, 255, 0.8));
                border: 2px solid white;
                color: white;
                cursor: pointer;
                border-radius: 30px;
                transition: all 0.3s;
            ">はい</button>
            <button id="skip-opening" style="
                padding: 15px 40px;
                margin: 0 10px;
                font-size: 18px;
                background: rgba(100, 100, 100, 0.5);
                border: 2px solid rgba(255, 255, 255, 0.5);
                color: white;
                cursor: pointer;
                border-radius: 30px;
                transition: all 0.3s;
            ">スキップ</button>
        `;
        
        document.body.appendChild(firstTimeNotice);
        
        document.getElementById('watch-opening').addEventListener('click', () => {
            firstTimeNotice.remove();
            import('./systems/OpeningScene.js').then(module => {
                const openingScene = new module.OpeningScene(game);
                openingScene.start(() => {
                    localStorage.setItem('hasSeenOpening', 'true');
                });
            });
        });
        
        document.getElementById('skip-opening').addEventListener('click', () => {
            localStorage.setItem('hasSeenOpening', 'true');
            firstTimeNotice.remove();
        });
    }
});

// ウィンドウリサイズ対応
window.addEventListener('resize', () => {
    if (game.renderer) {
        game.handleResize();
    }
});