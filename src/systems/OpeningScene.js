// オープニングシーン

export class OpeningScene {
    constructor(game) {
        this.game = game;
        this.container = null;
        this.skipButton = null;
        this.currentSlide = 0;
        this.autoPlayTimer = null;
        this.onComplete = null;
        
        // スライドデータ
        this.slides = [
            {
                id: 'intro',
                duration: 5000,
                content: `
                    <div class="opening-slide" style="background: radial-gradient(circle at center, #000033, #000000);">
                        <h1 style="font-size: 48px; color: #00ffff; text-shadow: 0 0 20px rgba(0,255,255,0.8); animation: fadeIn 2s;">
                            INFINITE SPACE SHOOTER
                        </h1>
                        <p style="font-size: 24px; color: #ffffff; margin-top: 30px; animation: fadeIn 2s 0.5s both;">
                            西暦2384年...
                        </p>
                    </div>
                `
            },
            {
                id: 'story1',
                duration: 6000,
                content: `
                    <div class="opening-slide" style="background: linear-gradient(to bottom, #000033, #000066);">
                        <div style="max-width: 800px; text-align: left; animation: slideIn 1.5s;">
                            <p style="font-size: 20px; line-height: 1.8; color: #ddddff;">
                                人類は太陽系全域への進出を果たし、<br>
                                各惑星に植民地を建設していた。<br><br>
                                
                                しかし、未知の敵対勢力が突如として現れ、<br>
                                辺境の植民地が次々と襲撃を受けている...
                            </p>
                        </div>
                    </div>
                `
            },
            {
                id: 'story2',
                duration: 6000,
                content: `
                    <div class="opening-slide" style="background: url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxkZWZzPjxyYWRpYWxHcmFkaWVudCBpZD0ic3RhcnMiPjxzdG9wIG9mZnNldD0iMCUiIHN0b3AtY29sb3I9IiNmZmZmZmYiLz48c3RvcCBvZmZzZXQ9IjEwMCUiIHN0b3AtY29sb3I9IiMwMDAwMDAiLz48L3JhZGlhbEdyYWRpZW50PjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjMDAwMDMzIi8+PGNpcmNsZSBjeD0iMjAlIiBjeT0iMjAlIiByPSIxIiBmaWxsPSJ3aGl0ZSIvPjxjaXJjbGUgY3g9IjgwJSIgY3k9IjMwJSIgcj0iMC41IiBmaWxsPSJ3aGl0ZSIvPjxjaXJjbGUgY3g9IjUwJSIgY3k9IjcwJSIgcj0iMC44IiBmaWxsPSJ3aGl0ZSIvPjxjaXJjbGUgY3g9IjEwJSIgY3k9IjgwJSIgcj0iMC4zIiBmaWxsPSJ3aGl0ZSIvPjwvc3ZnPg==');">
                        <div style="animation: fadeIn 2s;">
                            <h2 style="font-size: 36px; color: #ffaa00; text-shadow: 0 0 15px rgba(255,170,0,0.8);">
                                あなたの使命
                            </h2>
                            <ul style="font-size: 20px; color: #ffffff; text-align: left; max-width: 600px; margin: 30px auto; line-height: 2;">
                                <li>敵対勢力の侵攻を阻止する</li>
                                <li>失われた植民地を奪還する</li>
                                <li>未知の宇宙領域を探索する</li>
                                <li>人類の生存を守り抜く</li>
                            </ul>
                        </div>
                    </div>
                `
            },
            {
                id: 'controls',
                duration: 8000,
                content: `
                    <div class="opening-slide" style="background: linear-gradient(135deg, #000044, #000066);">
                        <h2 style="font-size: 32px; color: #00ffff; margin-bottom: 40px; animation: fadeIn 1s;">
                            基本操作
                        </h2>
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 30px; max-width: 800px; margin: 0 auto;">
                            <div style="background: rgba(0,100,200,0.2); padding: 20px; border-radius: 10px; border: 1px solid #0088ff; animation: slideIn 1s 0.2s both;">
                                <h3 style="color: #ffaa00; margin-bottom: 15px;">移動</h3>
                                <p style="color: #ddd; line-height: 1.6;">
                                    W/A/S/D: 移動<br>
                                    Shift: ブースト<br>
                                    Q/E: ロール回転
                                </p>
                            </div>
                            <div style="background: rgba(200,100,0,0.2); padding: 20px; border-radius: 10px; border: 1px solid #ff8800; animation: slideIn 1s 0.4s both;">
                                <h3 style="color: #ffaa00; margin-bottom: 15px;">戦闘</h3>
                                <p style="color: #ddd; line-height: 1.6;">
                                    マウス: 照準<br>
                                    クリック/Space: 射撃<br>
                                    I: インベントリ
                                </p>
                            </div>
                            <div style="background: rgba(0,200,100,0.2); padding: 20px; border-radius: 10px; border: 1px solid #00ff88; animation: slideIn 1s 0.6s both;">
                                <h3 style="color: #ffaa00; margin-bottom: 15px;">探索</h3>
                                <p style="color: #ddd; line-height: 1.6;">
                                    S: スキャン<br>
                                    F: インタラクト<br>
                                    G: ゲームガイド
                                </p>
                            </div>
                            <div style="background: rgba(200,0,200,0.2); padding: 20px; border-radius: 10px; border: 1px solid #ff00ff; animation: slideIn 1s 0.8s both;">
                                <h3 style="color: #ffaa00; margin-bottom: 15px;">ヒント</h3>
                                <p style="color: #ddd; line-height: 1.6;">
                                    H: ヘルプ表示<br>
                                    +/-: マップ拡大縮小<br>
                                    敵を倒してクレジット獲得！
                                </p>
                            </div>
                        </div>
                    </div>
                `
            },
            {
                id: 'ready',
                duration: 4000,
                content: `
                    <div class="opening-slide" style="background: radial-gradient(circle at center, #000066, #000000);">
                        <div style="animation: zoomIn 2s;">
                            <h1 style="font-size: 64px; color: #ffff00; text-shadow: 0 0 30px rgba(255,255,0,0.8); margin-bottom: 40px;">
                                準備はいいか？
                            </h1>
                            <p style="font-size: 28px; color: #00ffff; animation: pulse 2s infinite;">
                                宇宙の運命は君の手に...
                            </p>
                        </div>
                        <button id="start-game-button" style="
                            margin-top: 60px;
                            padding: 20px 60px;
                            font-size: 24px;
                            background: linear-gradient(135deg, #00aa00, #00ff00);
                            border: none;
                            color: white;
                            cursor: pointer;
                            border-radius: 50px;
                            text-shadow: 0 2px 4px rgba(0,0,0,0.5);
                            box-shadow: 0 5px 20px rgba(0,255,0,0.5);
                            animation: fadeIn 1s 1s both, pulse 2s 2s infinite;
                            transition: all 0.3s;
                        " onmouseover="this.style.transform='scale(1.1)'" onmouseout="this.style.transform='scale(1)'">
                            ゲーム開始
                        </button>
                    </div>
                `
            }
        ];
        
        this.createUI();
    }
    
    createUI() {
        // メインコンテナ
        this.container = document.createElement('div');
        this.container.id = 'opening-scene';
        this.container.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: black;
            z-index: 20000;
            font-family: 'Orbitron', monospace;
            color: white;
            display: flex;
            align-items: center;
            justify-content: center;
            overflow: hidden;
        `;
        
        // スライドコンテナ
        const slideContainer = document.createElement('div');
        slideContainer.id = 'slide-container';
        slideContainer.style.cssText = `
            width: 100%;
            height: 100%;
            position: relative;
        `;
        
        // プログレスバー
        const progressBar = document.createElement('div');
        progressBar.style.cssText = `
            position: absolute;
            bottom: 0;
            left: 0;
            height: 4px;
            background: linear-gradient(to right, #00ffff, #00ff00);
            width: 0%;
            transition: width 1s linear;
            z-index: 100;
        `;
        progressBar.id = 'opening-progress';
        
        // スキップボタン
        this.skipButton = document.createElement('button');
        this.skipButton.textContent = 'スキップ ▶';
        this.skipButton.style.cssText = `
            position: absolute;
            bottom: 30px;
            right: 30px;
            padding: 10px 30px;
            background: rgba(255, 255, 255, 0.1);
            border: 1px solid rgba(255, 255, 255, 0.3);
            color: white;
            cursor: pointer;
            border-radius: 5px;
            font-size: 16px;
            transition: all 0.3s;
            z-index: 100;
        `;
        
        this.skipButton.onmouseover = () => {
            this.skipButton.style.background = 'rgba(255, 255, 255, 0.2)';
            this.skipButton.style.borderColor = 'rgba(255, 255, 255, 0.5)';
        };
        
        this.skipButton.onmouseout = () => {
            this.skipButton.style.background = 'rgba(255, 255, 255, 0.1)';
            this.skipButton.style.borderColor = 'rgba(255, 255, 255, 0.3)';
        };
        
        this.skipButton.onclick = () => this.skip();
        
        // スタイル追加
        this.addStyles();
        
        this.container.appendChild(slideContainer);
        this.container.appendChild(progressBar);
        this.container.appendChild(this.skipButton);
        
        document.body.appendChild(this.container);
    }
    
    addStyles() {
        if (document.querySelector('#opening-scene-styles')) return;
        
        const style = document.createElement('style');
        style.id = 'opening-scene-styles';
        style.textContent = `
            @keyframes fadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }
            
            @keyframes slideIn {
                from {
                    opacity: 0;
                    transform: translateY(30px);
                }
                to {
                    opacity: 1;
                    transform: translateY(0);
                }
            }
            
            @keyframes zoomIn {
                from {
                    opacity: 0;
                    transform: scale(0.8);
                }
                to {
                    opacity: 1;
                    transform: scale(1);
                }
            }
            
            @keyframes pulse {
                0%, 100% { transform: scale(1); }
                50% { transform: scale(1.05); }
            }
            
            .opening-slide {
                position: absolute;
                width: 100%;
                height: 100%;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                text-align: center;
                padding: 40px;
                box-sizing: border-box;
            }
        `;
        document.head.appendChild(style);
    }
    
    start(onComplete) {
        this.onComplete = onComplete;
        this.currentSlide = 0;
        this.showSlide(0);
    }
    
    showSlide(index) {
        if (index >= this.slides.length) {
            this.complete();
            return;
        }
        
        const slide = this.slides[index];
        const slideContainer = document.getElementById('slide-container');
        
        // スライド内容を更新
        slideContainer.innerHTML = slide.content;
        
        // プログレスバー更新
        const progress = ((index + 1) / this.slides.length) * 100;
        document.getElementById('opening-progress').style.width = progress + '%';
        
        // 最後のスライドの場合、ゲーム開始ボタンにイベントを設定
        if (slide.id === 'ready') {
            const startButton = document.getElementById('start-game-button');
            if (startButton) {
                startButton.onclick = () => this.complete();
            }
        }
        
        // 自動進行
        if (this.autoPlayTimer) {
            clearTimeout(this.autoPlayTimer);
        }
        
        this.autoPlayTimer = setTimeout(() => {
            this.nextSlide();
        }, slide.duration);
    }
    
    nextSlide() {
        this.currentSlide++;
        this.showSlide(this.currentSlide);
    }
    
    skip() {
        if (this.autoPlayTimer) {
            clearTimeout(this.autoPlayTimer);
        }
        this.complete();
    }
    
    complete() {
        // フェードアウトアニメーション
        this.container.style.transition = 'opacity 1s';
        this.container.style.opacity = '0';
        
        setTimeout(() => {
            this.container.remove();
            
            // コールバック実行
            if (this.onComplete) {
                this.onComplete();
            }
        }, 1000);
    }
    
    // 初回プレイかどうかをチェック
    static shouldShowOpening() {
        return !localStorage.getItem('hasSeenOpening');
    }
    
    // オープニングを見たことを記録
    static markAsSeen() {
        localStorage.setItem('hasSeenOpening', 'true');
    }
}