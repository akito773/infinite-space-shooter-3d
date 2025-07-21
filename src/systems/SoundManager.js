export class SoundManager {
    constructor() {
        this.sounds = {};
        this.enabled = true;
        this.volume = 0.5;
        
        // AudioContextの初期化
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        
        // 基本的なサウンドエフェクトを生成
        this.createSounds();
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
        }
    }
}