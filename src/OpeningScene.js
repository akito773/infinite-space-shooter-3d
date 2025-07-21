export class OpeningScene {
    constructor() {
        this.isPlaying = false;
        this.currentScene = 0;
        this.scenes = [];
        this.onComplete = null;
        
        this.createUI();
        this.setupScenes();
        this.preloadAssets();
    }
    
    createUI() {
        // オープニングコンテナ
        this.container = document.createElement('div');
        this.container.id = 'opening-scene';
        this.container.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: black;
            display: none;
            z-index: 20000;
        `;
        
        // ビデオ要素
        this.videoElement = document.createElement('video');
        this.videoElement.style.cssText = `
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 100%;
            height: 100%;
            object-fit: cover;
        `;
        this.videoElement.src = './opening/videos/opening-video.mp4';
        
        // 画像要素
        this.imageElement = document.createElement('img');
        this.imageElement.style.cssText = `
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 100%;
            height: 100%;
            object-fit: cover;
            opacity: 0;
            transition: opacity 1s ease-in-out;
        `;
        
        // 字幕コンテナ
        this.subtitleContainer = document.createElement('div');
        this.subtitleContainer.style.cssText = `
            position: absolute;
            bottom: 100px;
            left: 50%;
            transform: translateX(-50%);
            width: 80%;
            max-width: 800px;
            background: rgba(0, 0, 0, 0.8);
            padding: 20px;
            border-radius: 10px;
            opacity: 0;
            transition: opacity 0.5s ease-in-out;
        `;
        
        // 字幕テキスト
        this.subtitleText = document.createElement('p');
        this.subtitleText.style.cssText = `
            color: white;
            font-size: 20px;
            line-height: 1.6;
            margin: 0;
            text-align: center;
            text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.8);
        `;
        
        // キャラクター名
        this.characterName = document.createElement('div');
        this.characterName.style.cssText = `
            color: #00ffff;
            font-size: 18px;
            margin-bottom: 10px;
            text-align: left;
            font-weight: bold;
        `;
        
        // スキップボタン
        this.skipButton = document.createElement('button');
        this.skipButton.style.cssText = `
            position: absolute;
            bottom: 30px;
            right: 30px;
            padding: 10px 20px;
            background: rgba(255, 255, 255, 0.2);
            border: 1px solid rgba(255, 255, 255, 0.5);
            color: white;
            font-size: 16px;
            cursor: pointer;
            border-radius: 5px;
            transition: all 0.3s ease;
        `;
        this.skipButton.textContent = 'スキップ (ESC)';
        
        this.skipButton.addEventListener('mouseenter', () => {
            this.skipButton.style.background = 'rgba(255, 255, 255, 0.3)';
        });
        
        this.skipButton.addEventListener('mouseleave', () => {
            this.skipButton.style.background = 'rgba(255, 255, 255, 0.2)';
        });
        
        this.skipButton.addEventListener('click', () => {
            this.skip();
        });
        
        // オーディオ要素
        this.audioElement = document.createElement('audio');
        this.audioElement.src = './opening/audio/opening-narration.mp3';
        
        // BGM要素（後で追加予定）
        this.bgmElement = document.createElement('audio');
        this.bgmElement.loop = true;
        this.bgmElement.volume = 0.5;
        
        // 要素を組み立て
        this.subtitleContainer.appendChild(this.characterName);
        this.subtitleContainer.appendChild(this.subtitleText);
        this.container.appendChild(this.videoElement);
        this.container.appendChild(this.imageElement);
        this.container.appendChild(this.subtitleContainer);
        this.container.appendChild(this.skipButton);
        this.container.appendChild(this.audioElement);
        this.container.appendChild(this.bgmElement);
        document.body.appendChild(this.container);
        
        // イベントリスナー
        document.addEventListener('keydown', (e) => {
            if (this.isPlaying && e.key === 'Escape') {
                this.skip();
            }
        });
    }
    
    setupScenes() {
        this.scenes = [
            {
                type: 'video',
                duration: 5000,
                subtitle: '西暦2387年。人類は銀河の果てまで進出し、繁栄の時代を築いていた。',
                character: 'ナレーション',
                audio: './opening/audio/opening-narration.mp3'
            },
            {
                type: 'image',
                src: './opening/images/opening-scene-1.png',
                duration: 5000,
                subtitle: 'だが、その平和は一瞬にして崩れ去った。',
                character: 'ナレーション',
                fadeIn: true
            },
            {
                type: 'image',
                src: './opening/images/opening-scene-2.png',
                duration: 5000,
                subtitle: '「ヴォイド」と呼ばれる謎の勢力が、突如として現れたのだ。',
                character: 'ナレーション',
                fadeIn: true
            },
            {
                type: 'image',
                src: './opening/images/opening-scene-3.png',
                duration: 4000,
                subtitle: 'こちらアルファ中隊！敵の攻撃が激しい！撤退を要請する！',
                character: '通信音声（男性）',
                fadeIn: true
            },
            {
                type: 'video',
                duration: 3000,
                subtitle: 'ダメだ！通信が...ジャミングされて...！',
                character: '通信音声（女性）'
            },
            {
                type: 'black',
                duration: 2000,
                subtitle: '',
                character: ''
            },
            {
                type: 'image',
                src: './opening/images/opening-scene-2.png',
                duration: 5000,
                subtitle: '気がついたのね。あなたは3日間も眠っていたのよ。',
                character: 'Dr.エミリア',
                fadeIn: true
            },
            {
                type: 'image',
                src: './opening/images/opening-scene-3.png',
                duration: 4000,
                subtitle: 'ここは...？俺は一体...',
                character: '主人公',
                fadeIn: true
            },
            {
                type: 'image',
                src: './opening/images/opening-scene-2.png',
                duration: 5000,
                subtitle: '記憶が...やはり戻っていないのね。あなたは唯一の生存者。あの戦闘から。',
                character: 'Dr.エミリア',
                fadeIn: true
            },
            {
                type: 'image',
                src: './opening/images/opening-scene-1.png',
                duration: 4000,
                subtitle: '君の腕前は記録に残っている。最高のパイロットだったと。',
                character: '総督マルコス',
                fadeIn: true
            },
            {
                type: 'image',
                src: './opening/images/opening-scene-3.png',
                duration: 4000,
                subtitle: '記憶はなくても...体が覚えている。俺は戦える。',
                character: '主人公',
                fadeIn: true
            },
            {
                type: 'image',
                src: './opening/images/opening-scene-1.png',
                duration: 5000,
                subtitle: '頼む。人類の未来は、君のような勇敢なパイロットにかかっている。',
                character: '総督マルコス',
                fadeIn: true
            },
            {
                type: 'video',
                duration: 5000,
                subtitle: '行くぞ...俺の過去と、人類の未来を取り戻すために！',
                character: '主人公'
            }
        ];
    }
    
    preloadAssets() {
        // 画像のプリロード
        this.scenes.forEach(scene => {
            if (scene.type === 'image' && scene.src) {
                const img = new Image();
                img.src = scene.src;
            }
        });
    }
    
    play() {
        if (this.isPlaying) return;
        
        this.isPlaying = true;
        this.currentScene = 0;
        this.container.style.display = 'block';
        
        // フェードイン
        this.container.style.opacity = '0';
        setTimeout(() => {
            this.container.style.transition = 'opacity 1s ease-in-out';
            this.container.style.opacity = '1';
        }, 10);
        
        // 音声を有効化（ユーザー操作により呼ばれた場合）
        this.enableAudio();
        
        // 最初のシーンを再生
        this.playScene(0);
    }
    
    enableAudio() {
        // ユーザー操作により音声を有効化
        this.audioElement.volume = 0.8;
        this.videoElement.volume = 0.8;
        this.videoElement.muted = false;
        
        // 音声コンテキストの再開を試みる
        if (window.AudioContext || window.webkitAudioContext) {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            if (audioContext.state === 'suspended') {
                audioContext.resume();
            }
        }
    }
    
    playScene(index) {
        if (index >= this.scenes.length) {
            this.complete();
            return;
        }
        
        const scene = this.scenes[index];
        this.currentScene = index;
        
        // シーンタイプに応じた処理
        switch (scene.type) {
            case 'video':
                this.playVideoScene(scene);
                break;
            case 'image':
                this.playImageScene(scene);
                break;
            case 'black':
                this.playBlackScene(scene);
                break;
        }
        
        // 字幕表示
        if (scene.subtitle) {
            this.showSubtitle(scene.character, scene.subtitle);
        } else {
            this.hideSubtitle();
        }
        
        // 音声再生
        if (scene.audio) {
            this.audioElement.src = scene.audio;
            const audioPromise = this.audioElement.play();
            if (audioPromise !== undefined) {
                audioPromise.catch(error => {
                    console.log('音声の自動再生がブロックされました:', error);
                });
            }
        }
        
        // 次のシーンへ
        setTimeout(() => {
            if (this.isPlaying) {
                this.playScene(index + 1);
            }
        }, scene.duration);
    }
    
    playVideoScene(scene) {
        this.videoElement.style.display = 'block';
        this.imageElement.style.display = 'none';
        this.videoElement.currentTime = 0;
        
        // 自動再生エラーをキャッチ
        const playPromise = this.videoElement.play();
        if (playPromise !== undefined) {
            playPromise.catch(error => {
                console.log('動画の自動再生がブロックされました:', error);
                // エラー時は静止画で代替
                this.playImageScene({
                    src: './opening/images/opening-scene-1.png',
                    fadeIn: true
                });
            });
        }
    }
    
    playImageScene(scene) {
        this.videoElement.style.display = 'none';
        this.imageElement.style.display = 'block';
        
        if (scene.fadeIn) {
            this.imageElement.style.opacity = '0';
            this.imageElement.src = scene.src;
            setTimeout(() => {
                this.imageElement.style.opacity = '1';
            }, 100);
        } else {
            this.imageElement.style.opacity = '1';
            this.imageElement.src = scene.src;
        }
    }
    
    playBlackScene(scene) {
        this.videoElement.style.display = 'none';
        this.imageElement.style.display = 'none';
    }
    
    showSubtitle(character, text) {
        this.characterName.textContent = character ? `【${character}】` : '';
        this.subtitleText.textContent = text;
        this.subtitleContainer.style.opacity = '1';
    }
    
    hideSubtitle() {
        this.subtitleContainer.style.opacity = '0';
    }
    
    skip() {
        if (!this.isPlaying) return;
        
        this.isPlaying = false;
        this.videoElement.pause();
        this.audioElement.pause();
        this.bgmElement.pause();
        
        // フェードアウト
        this.container.style.opacity = '0';
        setTimeout(() => {
            this.container.style.display = 'none';
            this.complete();
        }, 1000);
    }
    
    complete() {
        this.isPlaying = false;
        
        if (this.onComplete) {
            this.onComplete();
        }
        
        // タイトル画面へ遷移
        window.dispatchEvent(new Event('openingComplete'));
    }
}