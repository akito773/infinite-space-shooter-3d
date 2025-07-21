export class SoundManager {
    constructor() {
        this.sounds = {};
        this.enabled = true;
        this.volume = 0.5;
        this.bgmVolume = 0.3;
        
        // AudioContextの初期化
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        
        // BGM管理
        this.bgmTracks = {};
        this.currentBGM = null;
        this.currentBGMName = null;
        
        // 基本的なサウンドエフェクトを生成
        this.createSounds();
        
        // BGMを初期化
        this.initializeBGM();
    }
    
    createSounds() {
        // 射撃音
        this.sounds.shoot = () => this.playTone(800, 0.1, 'sawtooth', 0.3);
        
        // 爆発音
        this.sounds.explosion = () => {
            this.playNoise(0.3, 0.5);
            this.playTone(150, 0.3, 'sine', 0.4);
        };
        
        // アイテム取得音
        this.sounds.collect = () => {
            this.playTone(400, 0.1, 'sine', 0.2);
            setTimeout(() => this.playTone(600, 0.1, 'sine', 0.2), 50);
            setTimeout(() => this.playTone(800, 0.1, 'sine', 0.2), 100);
        };
        
        // ダメージ音
        this.sounds.damage = () => {
            this.playTone(200, 0.2, 'square', 0.3);
        };
        
        // パワーアップ音
        this.sounds.powerup = () => {
            for (let i = 0; i < 5; i++) {
                setTimeout(() => {
                    this.playTone(400 + i * 100, 0.1, 'sine', 0.3);
                }, i * 50);
            }
        };
        
        // エンジン音（ループ）
        this.engineOscillator = null;
        this.engineGain = null;
    }
    
    playTone(frequency, duration, type = 'sine', volume = 0.5) {
        if (!this.enabled) return;
        
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        oscillator.type = type;
        oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
        
        gainNode.gain.setValueAtTime(volume * this.volume, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);
        
        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + duration);
    }
    
    playNoise(duration, volume = 0.5) {
        if (!this.enabled) return;
        
        const bufferSize = this.audioContext.sampleRate * duration;
        const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
        const output = buffer.getChannelData(0);
        
        for (let i = 0; i < bufferSize; i++) {
            output[i] = Math.random() * 2 - 1;
        }
        
        const whiteNoise = this.audioContext.createBufferSource();
        const gainNode = this.audioContext.createGain();
        
        whiteNoise.buffer = buffer;
        whiteNoise.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        gainNode.gain.setValueAtTime(volume * this.volume, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);
        
        whiteNoise.start(this.audioContext.currentTime);
    }
    
    startEngine() {
        if (!this.enabled || this.engineOscillator) return;
        
        this.engineOscillator = this.audioContext.createOscillator();
        this.engineGain = this.audioContext.createGain();
        
        this.engineOscillator.connect(this.engineGain);
        this.engineGain.connect(this.audioContext.destination);
        
        this.engineOscillator.type = 'sawtooth';
        this.engineOscillator.frequency.setValueAtTime(50, this.audioContext.currentTime);
        this.engineGain.gain.setValueAtTime(0.1 * this.volume, this.audioContext.currentTime);
        
        this.engineOscillator.start();
    }
    
    updateEngine(speed) {
        if (!this.engineOscillator || !this.enabled) return;
        
        // スピードに応じて周波数を変更
        const frequency = 50 + speed * 2;
        this.engineOscillator.frequency.linearRampToValueAtTime(
            frequency, 
            this.audioContext.currentTime + 0.1
        );
        
        // 音量も調整
        const volume = Math.min(0.2, 0.1 + speed * 0.001) * this.volume;
        this.engineGain.gain.linearRampToValueAtTime(
            volume,
            this.audioContext.currentTime + 0.1
        );
    }
    
    stopEngine() {
        if (this.engineOscillator) {
            this.engineOscillator.stop();
            this.engineOscillator = null;
            this.engineGain = null;
        }
    }
    
    play(soundName) {
        if (this.sounds[soundName]) {
            this.sounds[soundName]();
        }
    }
    
    setVolume(volume) {
        this.volume = Math.max(0, Math.min(1, volume));
    }
    
    toggle() {
        this.enabled = !this.enabled;
        if (!this.enabled) {
            this.stopEngine();
            this.stopBGM();
        }
    }
    
    // BGM関連のメソッド
    initializeBGM() {
        console.log('BGMシステムを初期化中...');
        // BGMトラックの定義
        const bgmFiles = {
            main: 'assets/bgm/epic_space_orchestra_2025-07-21T17-36-18.wav',
            boss: 'assets/bgm/boss_battle_theme.wav',
            raidBoss: 'assets/bgm/raid_boss_theme.wav',
            tavern: 'assets/bgm/tavern_jazz_theme.wav',
            planet: 'assets/bgm/planet_exploration_theme.wav'
        };
        
        // 各BGMのAudioオブジェクトを作成
        Object.entries(bgmFiles).forEach(([name, path]) => {
            const audio = new Audio(path);
            audio.loop = true;
            audio.volume = this.bgmVolume;
            
            // メインBGMは26秒でループ（無音部分を避ける）
            if (name === 'main') {
                audio.addEventListener('timeupdate', () => {
                    if (audio.currentTime >= 26) {
                        audio.currentTime = 0;
                    }
                });
            }
            
            // エラーハンドリング
            audio.addEventListener('error', (e) => {
                console.warn(`BGMファイルが見つかりません: ${path}`);
                // エラーが発生したトラックは削除
                delete this.bgmTracks[name];
            });
            
            this.bgmTracks[name] = audio;
        });
    }
    
    playBGM(trackName, fadeIn = true) {
        console.log(`BGM再生リクエスト: ${trackName}`);
        if (!this.enabled) {
            console.log('SoundManagerが無効です');
            return;
        }
        
        // 既に同じBGMが再生中なら何もしない
        if (this.currentBGMName === trackName && this.currentBGM && !this.currentBGM.paused) {
            console.log(`${trackName}は既に再生中です`);
            return;
        }
        
        // 現在のBGMをフェードアウト
        if (this.currentBGM) {
            this.fadeOutBGM();
        }
        
        // 新しいBGMを再生
        const newBGM = this.bgmTracks[trackName];
        if (newBGM) {
            console.log(`${trackName}を再生開始します`);
            this.currentBGM = newBGM;
            this.currentBGMName = trackName;
            
            if (fadeIn) {
                newBGM.volume = 0;
                newBGM.play().catch(e => console.log('BGM再生エラー:', e));
                
                // フェードイン
                let volume = 0;
                const fadeInterval = setInterval(() => {
                    volume += 0.01;
                    if (volume >= this.bgmVolume) {
                        volume = this.bgmVolume;
                        clearInterval(fadeInterval);
                    }
                    newBGM.volume = volume;
                }, 20);
            } else {
                newBGM.volume = this.bgmVolume;
                newBGM.play().catch(e => console.log('BGM再生エラー:', e));
            }
        } else {
            console.warn(`BGMトラック'${trackName}'が見つかりません`);
        }
    }
    
    fadeOutBGM() {
        if (!this.currentBGM) return;
        
        const bgm = this.currentBGM;
        let volume = bgm.volume;
        
        const fadeInterval = setInterval(() => {
            volume -= 0.02;
            if (volume <= 0) {
                volume = 0;
                bgm.pause();
                bgm.currentTime = 0;
                clearInterval(fadeInterval);
            }
            bgm.volume = volume;
        }, 20);
    }
    
    stopBGM() {
        if (this.currentBGM) {
            this.currentBGM.pause();
            this.currentBGM.currentTime = 0;
            this.currentBGM = null;
            this.currentBGMName = null;
        }
    }
    
    setBGMVolume(volume) {
        this.bgmVolume = Math.max(0, Math.min(1, volume));
        
        // 全てのBGMトラックの音量を更新
        Object.values(this.bgmTracks).forEach(track => {
            track.volume = this.bgmVolume;
        });
    }
    
    // 特定のシーン用のBGM再生メソッド
    playMainBGM() {
        this.playBGM('main');
    }
    
    playBossBGM() {
        this.playBGM('boss');
    }
    
    playRaidBossBGM() {
        this.playBGM('raidBoss');
    }
    
    playTavernBGM() {
        this.playBGM('tavern');
    }
    
    playPlanetBGM() {
        this.playBGM('planet');
    }
}