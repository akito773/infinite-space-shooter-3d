export class TitleScreen {
    constructor() {
        this.isVisible = true;
        this.createUI();
        this.setupEventListeners();
    }
    
    createUI() {
        // タイトル画面コンテナ
        this.container = document.createElement('div');
        this.container.id = 'title-screen';
        this.container.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: url('./images/title.png') center/cover no-repeat;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            z-index: 10000;
            transition: opacity 0.5s ease-out;
        `;
        
        // タイトルロゴ
        const titleText = document.createElement('h1');
        titleText.style.cssText = `
            font-size: 72px;
            color: white;
            text-shadow: 0 0 30px rgba(0, 200, 255, 0.8);
            margin-bottom: 50px;
            font-family: 'Arial Black', sans-serif;
            letter-spacing: 5px;
            animation: titleGlow 2s ease-in-out infinite;
        `;
        titleText.textContent = 'INFINITE SPACE SHOOTER';
        
        // スタートボタン
        this.startButton = document.createElement('button');
        this.startButton.style.cssText = `
            padding: 20px 60px;
            font-size: 28px;
            background: linear-gradient(45deg, rgba(0, 100, 200, 0.8), rgba(0, 200, 255, 0.8));
            border: 3px solid rgba(255, 255, 255, 0.8);
            color: white;
            font-weight: bold;
            cursor: pointer;
            border-radius: 50px;
            text-transform: uppercase;
            letter-spacing: 3px;
            transition: all 0.3s ease;
            box-shadow: 0 5px 20px rgba(0, 200, 255, 0.5);
            animation: buttonPulse 2s ease-in-out infinite;
        `;
        this.startButton.textContent = 'START GAME';
        
        // ホバーエフェクト
        this.startButton.addEventListener('mouseenter', () => {
            this.startButton.style.transform = 'scale(1.1)';
            this.startButton.style.boxShadow = '0 8px 30px rgba(0, 200, 255, 0.8)';
        });
        
        this.startButton.addEventListener('mouseleave', () => {
            this.startButton.style.transform = 'scale(1)';
            this.startButton.style.boxShadow = '0 5px 20px rgba(0, 200, 255, 0.5)';
        });
        
        // オープニングボタン
        this.openingButton = document.createElement('button');
        this.openingButton.style.cssText = `
            position: absolute;
            top: 30px;
            right: 30px;
            padding: 10px 30px;
            font-size: 18px;
            background: rgba(0, 100, 200, 0.6);
            border: 2px solid rgba(255, 255, 255, 0.6);
            color: white;
            cursor: pointer;
            border-radius: 25px;
            transition: all 0.3s ease;
        `;
        this.openingButton.textContent = 'オープニング';
        
        this.openingButton.addEventListener('mouseenter', () => {
            this.openingButton.style.background = 'rgba(0, 150, 255, 0.8)';
            this.openingButton.style.transform = 'scale(1.05)';
        });
        
        this.openingButton.addEventListener('mouseleave', () => {
            this.openingButton.style.background = 'rgba(0, 100, 200, 0.6)';
            this.openingButton.style.transform = 'scale(1)';
        });
        
        // 操作説明
        const controls = document.createElement('div');
        controls.style.cssText = `
            position: absolute;
            bottom: 30px;
            color: white;
            text-align: center;
            font-size: 16px;
            opacity: 0.8;
            text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.8);
        `;
        controls.innerHTML = `
            <p>W/S: 前進/後退 | A/D: 左右移動 | マウス: 照準 | クリック: 射撃</p>
            <p>Shift: ブースト | L: 着陸 | M: ワープ</p>
        `;
        
        // アニメーションスタイル
        if (!document.querySelector('#title-animation-style')) {
            const style = document.createElement('style');
            style.id = 'title-animation-style';
            style.textContent = `
                @keyframes titleGlow {
                    0%, 100% {
                        text-shadow: 0 0 30px rgba(0, 200, 255, 0.8);
                    }
                    50% {
                        text-shadow: 0 0 50px rgba(0, 255, 255, 1), 0 0 80px rgba(0, 200, 255, 0.8);
                    }
                }
                
                @keyframes buttonPulse {
                    0%, 100% {
                        transform: scale(1);
                    }
                    50% {
                        transform: scale(1.05);
                    }
                }
            `;
            document.head.appendChild(style);
        }
        
        // 要素を追加
        this.container.appendChild(titleText);
        this.container.appendChild(this.startButton);
        this.container.appendChild(this.openingButton);
        this.container.appendChild(controls);
        document.body.appendChild(this.container);
    }
    
    setupEventListeners() {
        // スタートボタンクリック
        this.startButton.addEventListener('click', () => {
            this.hide();
        });
        
        // オープニングボタンクリック
        this.openingButton.addEventListener('click', () => {
            this.playOpening();
        });
        
        // Enterキーでもスタート
        document.addEventListener('keydown', (e) => {
            if (this.isVisible && e.key === 'Enter') {
                this.hide();
            }
        });
    }
    
    playOpening() {
        // オープニングシーンを再生
        if (!this.openingScene) {
            import('./OpeningScene.js').then(module => {
                this.openingScene = new module.OpeningScene();
                this.openingScene.onComplete = () => {
                    // オープニング終了後の処理
                    console.log('オープニング終了');
                };
                this.openingScene.play();
            });
        } else {
            this.openingScene.play();
        }
    }
    
    hide() {
        if (!this.isVisible) return;
        
        this.isVisible = false;
        this.container.style.opacity = '0';
        
        setTimeout(() => {
            this.container.style.display = 'none';
            // ゲーム開始イベントを発火
            window.dispatchEvent(new Event('gameStart'));
        }, 500);
    }
    
    show() {
        this.isVisible = true;
        this.container.style.display = 'flex';
        this.container.style.opacity = '1';
    }
}