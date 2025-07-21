// サウンドシステム - 効果音とBGMの管理

export class SoundSystem {
    constructor() {
        this.enabled = true;
        this.volume = 0.5;
        this.sounds = {};
        this.audioContext = null;
        this.isInitialized = false;
        this.userInteractionReceived = false;
        
        // ユーザーインタラクション待機
        this.setupUserInteractionHandler();
    }
    
    setupUserInteractionHandler() {
        // ユーザーの最初のクリックまたはキー入力でオーディオを初期化
        const initializeAudio = () => {
            if (!this.userInteractionReceived) {
                this.userInteractionReceived = true;
                this.initAudioContext();
                document.removeEventListener('click', initializeAudio);
                document.removeEventListener('keydown', initializeAudio);
                document.removeEventListener('touchstart', initializeAudio);
            }
        };
        
        document.addEventListener('click', initializeAudio);
        document.addEventListener('keydown', initializeAudio);
        document.addEventListener('touchstart', initializeAudio);
    }
    
    initAudioContext() {
        if (this.isInitialized) return;
        
        try {
            window.AudioContext = window.AudioContext || window.webkitAudioContext;
            this.audioContext = new AudioContext();
            this.isInitialized = true;
            
            // サウンドを生成
            this.createSounds();
            
            console.log('AudioContext initialized successfully');
        } catch (e) {
            console.warn('Web Audio APIがサポートされていません:', e);
            this.enabled = false;
        }
    }
    
    createSounds() {
        if (!this.enabled || !this.audioContext) return;
        
        // 各種効果音を生成
        this.sounds.buildingPlace = this.createBuildingPlaceSound();
        this.sounds.buildingComplete = this.createBuildingCompleteSound();
        this.sounds.upgrade = this.createUpgradeSound();
        this.sounds.buttonClick = this.createButtonClickSound();
        this.sounds.error = this.createErrorSound();
        this.sounds.success = this.createSuccessSound();
        this.sounds.collect = this.createCollectSound();
    }
    
    // 建物配置音
    createBuildingPlaceSound() {
        return () => {
            if (!this.enabled || !this.audioContext) return;
            
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            oscillator.frequency.setValueAtTime(200, this.audioContext.currentTime);
            oscillator.frequency.linearRampToValueAtTime(100, this.audioContext.currentTime + 0.1);
            
            gainNode.gain.setValueAtTime(this.volume * 0.3, this.audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.1);
            
            oscillator.start(this.audioContext.currentTime);
            oscillator.stop(this.audioContext.currentTime + 0.1);
        };
    }
    
    // 建設完了音
    createBuildingCompleteSound() {
        return () => {
            if (!this.enabled || !this.audioContext) return;
            
            // 複数の音を組み合わせる
            for (let i = 0; i < 3; i++) {
                const oscillator = this.audioContext.createOscillator();
                const gainNode = this.audioContext.createGain();
                
                oscillator.connect(gainNode);
                gainNode.connect(this.audioContext.destination);
                
                const baseFreq = 400 + i * 200;
                oscillator.frequency.setValueAtTime(baseFreq, this.audioContext.currentTime + i * 0.05);
                
                gainNode.gain.setValueAtTime(this.volume * 0.2, this.audioContext.currentTime + i * 0.05);
                gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + i * 0.05 + 0.3);
                
                oscillator.start(this.audioContext.currentTime + i * 0.05);
                oscillator.stop(this.audioContext.currentTime + i * 0.05 + 0.3);
            }
        };
    }
    
    // アップグレード音
    createUpgradeSound() {
        return () => {
            if (!this.enabled || !this.audioContext) return;
            
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            const filter = this.audioContext.createBiquadFilter();
            
            oscillator.connect(filter);
            filter.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(800, this.audioContext.currentTime);
            filter.frequency.linearRampToValueAtTime(2000, this.audioContext.currentTime + 0.5);
            
            oscillator.frequency.setValueAtTime(100, this.audioContext.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(800, this.audioContext.currentTime + 0.5);
            
            gainNode.gain.setValueAtTime(this.volume * 0.3, this.audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.5);
            
            oscillator.start(this.audioContext.currentTime);
            oscillator.stop(this.audioContext.currentTime + 0.5);
        };
    }
    
    // ボタンクリック音
    createButtonClickSound() {
        return () => {
            if (!this.enabled || !this.audioContext) return;
            
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            oscillator.frequency.setValueAtTime(800, this.audioContext.currentTime);
            oscillator.type = 'sine';
            
            gainNode.gain.setValueAtTime(this.volume * 0.1, this.audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.05);
            
            oscillator.start(this.audioContext.currentTime);
            oscillator.stop(this.audioContext.currentTime + 0.05);
        };
    }
    
    // エラー音
    createErrorSound() {
        return () => {
            if (!this.enabled || !this.audioContext) return;
            
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            oscillator.frequency.setValueAtTime(200, this.audioContext.currentTime);
            oscillator.type = 'sawtooth';
            
            gainNode.gain.setValueAtTime(this.volume * 0.2, this.audioContext.currentTime);
            gainNode.gain.setValueAtTime(0, this.audioContext.currentTime + 0.05);
            gainNode.gain.setValueAtTime(this.volume * 0.2, this.audioContext.currentTime + 0.1);
            gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.2);
            
            oscillator.start(this.audioContext.currentTime);
            oscillator.stop(this.audioContext.currentTime + 0.2);
        };
    }
    
    // 成功音
    createSuccessSound() {
        return () => {
            if (!this.enabled || !this.audioContext) return;
            
            const notes = [523.25, 659.25, 783.99]; // C, E, G
            
            notes.forEach((freq, i) => {
                const oscillator = this.audioContext.createOscillator();
                const gainNode = this.audioContext.createGain();
                
                oscillator.connect(gainNode);
                gainNode.connect(this.audioContext.destination);
                
                oscillator.frequency.setValueAtTime(freq, this.audioContext.currentTime + i * 0.1);
                
                gainNode.gain.setValueAtTime(this.volume * 0.15, this.audioContext.currentTime + i * 0.1);
                gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + i * 0.1 + 0.3);
                
                oscillator.start(this.audioContext.currentTime + i * 0.1);
                oscillator.stop(this.audioContext.currentTime + i * 0.1 + 0.3);
            });
        };
    }
    
    // 収集音
    createCollectSound() {
        return () => {
            if (!this.enabled || !this.audioContext) return;
            
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            oscillator.frequency.setValueAtTime(440, this.audioContext.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(880, this.audioContext.currentTime + 0.1);
            oscillator.type = 'sine';
            
            gainNode.gain.setValueAtTime(this.volume * 0.3, this.audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.1);
            
            oscillator.start(this.audioContext.currentTime);
            oscillator.stop(this.audioContext.currentTime + 0.1);
        };
    }
    
    // サウンド再生メソッド
    play(soundName) {
        if (!this.enabled) return;
        
        // AudioContextが初期化されていない場合は無音で処理
        if (!this.audioContext || !this.sounds[soundName]) {
            return;
        }
        
        // ユーザーインタラクション後でないと音が鳴らない場合があるため
        if (this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }
        
        try {
            this.sounds[soundName]();
        } catch (e) {
            console.warn('サウンド再生エラー:', e);
        }
    }
    
    // ボリューム設定
    setVolume(volume) {
        this.volume = Math.max(0, Math.min(1, volume));
    }
    
    // サウンドの有効/無効
    setEnabled(enabled) {
        this.enabled = enabled;
        if (enabled && !this.audioContext) {
            this.initAudioContext();
            this.createSounds();
        }
    }
    
    // BGM（将来的な実装用）
    playBGM(bgmName) {
        // 将来的にBGMを実装する場合のプレースホルダー
    }
    
    stopBGM() {
        // 将来的にBGMを実装する場合のプレースホルダー
    }
}