// キャラクターボイス再生システム

export class VoiceSystem {
    constructor(game) {
        this.game = game;
        this.enabled = true;
        this.volume = 0.7;
        
        // 音声ファイルのキャッシュ
        this.voiceCache = new Map();
        
        // 現在再生中の音声
        this.currentVoice = null;
        
        // キャラクターごとの音声設定
        this.voiceConfig = {
            luna: {
                path: '', // ボイスファイルはassetsフォルダ直下
                volume: 0.8,
                pitch: 1.0
            },
            boss_battleship: {
                path: 'voices/boss/battleship/',
                volume: 0.9,
                pitch: 0.8
            },
            boss_raid: {
                path: 'voices/boss/raid/',
                volume: 1.0,
                pitch: 0.7
            },
            system: {
                path: 'voices/system/',
                volume: 0.6,
                pitch: 1.0
            }
        };
        
        // 音声ファイルのマッピング（実際のファイル名に合わせる）
        this.voiceMap = {
            luna: {
                // 挨拶
                greeting_1: 'voice_よー元気にしてた_日向 ここあ.mp3',
                greeting_2: 'voice_おつかれさま今日はどんな冒険してるの_日向 ここあ.mp3',
                greeting_3: 'voice_あらタイミングいいじゃない_日向 ここあ.mp3',
                greeting_4: 'voice_お疲れ様何か面白い情報ない_日向 ここあ.mp3',
                
                // 戦闘応援
                combat_1: 'voice_その調子その調子_日向 ここあ.mp3',
                combat_2: 'voice_うわー派手にやってるわね_日向 ここあ.mp3',
                combat_3: 'voice_気をつけて敵が多いよ_日向 ここあ.mp3',
                combat_4: 'voice_ナイスファイト私も見習わなきゃ_日向 ここあ.mp3',
                combat_5: 'voice_すごいじゃない流石ね_日向 ここあ.mp3',
                
                // 発見
                discovery_1: 'voice_おお何か見つけた_日向 ここあ.mp3',
                discovery_2: 'voice_面白そうな場所ね_日向 ここあ.mp3',
                discovery_3: 'voice_これは珍しいものを発見したわね_日向 ここあ.mp3',
                discovery_4: 'voice_情報料もらっちゃおうかな_日向 ここあ.mp3',
                
                // ボス戦
                boss_1: 'voice_うっわーデカいのが出てきた_日向 ここあ.mp3',
                boss_2: 'voice_負けちゃダメよ応援してるから_日向 ここあ.mp3',
                boss_3: 'voice_こんなのと戦うなんて無茶しないでよ_日向 ここあ.mp3',
                boss_4: 'voice_頑張って私も祈ってるから_日向 ここあ.mp3',
                
                // ボス撃破
                boss_defeat: 'voice_すっごーいよくやったわこれで宇宙がち_日向 ここあ.mp3',
                
                // 雑談
                casual_1: 'voice_そういえば新しい酒場ができたって聞いた_日向 ここあ.mp3',
                casual_2: 'voice_最近宇宙が騒がしいと思わない_日向 ここあ.mp3',
                casual_3: 'voice_今度一緒に飲みに行きましょうよ_日向 ここあ.mp3',
                casual_4: 'voice_あなたの機体カッコいいわね_日向 ここあ.mp3',
                casual_5: 'voice_ギルドでも噂になってるのよあなたのこと_日向 ここあ.mp3',
                
                // 信頼度
                trust_25: 'voice_ありがとあなたと話してると楽しいわ_日向 ここあ.mp3',
                trust_50: 'voice_もうすっかり友達ね今度ギルドに遊びに来_日向 ここあ.mp3',
                trust_75: 'voice_あなたって本当に頼りになるのね私の一番_日向 ここあ.mp3',
                trust_100: 'voice_最高のパートナーねこれからもずっとよろ_日向 ここあ.mp3',
                
                // 酒場
                tavern_meet_1: 'voice_あら見ない顔ね新人さん私ルナよ_日向 ここあ.mp3',
                tavern_meet_2: 'voice_ここは流れ星酒場宇宙で一番美味しい_日向 ここあ.mp3',
                tavern_meet_3: 'voice_あなた面白そうね今度一緒に飲みましょ_日向 ここあ.mp3',
                
                // 追加の反応ボイス（将来追加予定）
                itemPickup: null, // 将来追加予定
                lowHealth: null, // 将来追加予定
                speedBoost: null, // 将来追加予定
                longFlight: null // 将来追加予定
            }
        };
        
        // 設定をロード
        this.loadSettings();
    }
    
    loadSettings() {
        const savedVolume = localStorage.getItem('voiceVolume');
        if (savedVolume !== null) {
            this.volume = parseFloat(savedVolume);
        }
        
        const savedEnabled = localStorage.getItem('voiceEnabled');
        if (savedEnabled !== null) {
            this.enabled = savedEnabled === 'true';
        }
    }
    
    saveSettings() {
        localStorage.setItem('voiceVolume', this.volume.toString());
        localStorage.setItem('voiceEnabled', this.enabled.toString());
    }
    
    async preloadCharacterVoices(character) {
        if (!this.voiceMap[character]) {
            console.warn(`No voice map for character: ${character}`);
            return;
        }
        
        const config = this.voiceConfig[character];
        const voices = this.voiceMap[character];
        
        console.log(`Preloading voices for ${character}...`);
        
        for (const [key, filename] of Object.entries(voices)) {
            if (filename === null) continue; // 将来追加予定のボイスはスキップ
            const url = `assets/${filename}`;
            try {
                await this.preloadVoice(character, key, url);
            } catch (error) {
                console.warn(`Failed to preload voice: ${url}`, error);
            }
        }
        
        console.log(`Voice preloading complete for ${character}`);
    }
    
    async preloadVoice(character, key, url) {
        const cacheKey = `${character}_${key}`;
        
        if (this.voiceCache.has(cacheKey)) {
            return this.voiceCache.get(cacheKey);
        }
        
        return new Promise((resolve, reject) => {
            const audio = new Audio();
            audio.src = url;
            audio.volume = this.volume;
            
            audio.addEventListener('canplaythrough', () => {
                this.voiceCache.set(cacheKey, audio);
                resolve(audio);
            });
            
            audio.addEventListener('error', (e) => {
                console.error(`Failed to load voice: ${url}`, e);
                reject(e);
            });
            
            // 読み込み開始
            audio.load();
        });
    }
    
    playVoice(character, voiceKey, options = {}) {
        if (!this.enabled) return null;
        
        const cacheKey = `${character}_${voiceKey}`;
        
        // 現在再生中の音声を停止
        if (this.currentVoice && !options.overlap) {
            this.stopCurrentVoice();
        }
        
        // キャッシュから音声を取得
        let audio = this.voiceCache.get(cacheKey);
        
        if (!audio) {
            // キャッシュにない場合は読み込みを試みる
            const config = this.voiceConfig[character];
            const filename = this.voiceMap[character]?.[voiceKey];
            
            if (!filename) {
                console.warn(`Voice not found: ${character}.${voiceKey}`);
                return null;
            }
            
            const url = `assets/${filename}`;
            audio = new Audio(url);
            this.voiceCache.set(cacheKey, audio);
        }
        
        // 音声を複製（同時再生対応）
        const audioClone = audio.cloneNode();
        
        // 設定を適用
        const config = this.voiceConfig[character];
        audioClone.volume = this.volume * (config.volume || 1.0) * (options.volume || 1.0);
        
        // ピッチ調整（Web Audio APIを使用する場合）
        if (config.pitch !== 1.0 && this.game.audioContext) {
            this.applyPitchEffect(audioClone, config.pitch);
        }
        
        // コールバック設定
        if (options.onEnd) {
            audioClone.addEventListener('ended', options.onEnd);
        }
        
        // 再生
        audioClone.play().catch(error => {
            console.error('Failed to play voice:', error);
        });
        
        if (!options.overlap) {
            this.currentVoice = audioClone;
        }
        
        return audioClone;
    }
    
    playLunaVoice(category, index = null) {
        // カテゴリー内のランダムな音声を再生
        const voiceKeys = [];
        
        switch (category) {
            case 'greeting':
                voiceKeys.push('greeting_1', 'greeting_2', 'greeting_3', 'greeting_4');
                break;
            case 'combat':
                voiceKeys.push('combat_1', 'combat_2', 'combat_3', 'combat_4', 'combat_5');
                break;
            case 'discovery':
                voiceKeys.push('discovery_1', 'discovery_2', 'discovery_3', 'discovery_4');
                break;
            case 'boss':
                voiceKeys.push('boss_1', 'boss_2', 'boss_3', 'boss_4');
                break;
            case 'casual':
                voiceKeys.push('casual_1', 'casual_2', 'casual_3', 'casual_4', 'casual_5');
                break;
            case 'itemPickup':
            case 'lowHealth':
            case 'speedBoost':
            case 'longFlight':
                // これらのボイスは将来追加予定
                return null;
            default:
                console.warn(`Unknown Luna voice category: ${category}`);
                return null;
        }
        
        if (index !== null && index < voiceKeys.length) {
            return this.playVoice('luna', voiceKeys[index]);
        } else {
            const randomKey = voiceKeys[Math.floor(Math.random() * voiceKeys.length)];
            return this.playVoice('luna', randomKey);
        }
    }
    
    playTrustLevelVoice(level) {
        const voiceKey = `trust_${level}`;
        return this.playVoice('luna', voiceKey);
    }
    
    stopCurrentVoice() {
        if (this.currentVoice) {
            this.currentVoice.pause();
            this.currentVoice.currentTime = 0;
            this.currentVoice = null;
        }
    }
    
    stopAllVoices() {
        this.stopCurrentVoice();
        
        // キャッシュされた全ての音声を停止
        this.voiceCache.forEach(audio => {
            audio.pause();
            audio.currentTime = 0;
        });
    }
    
    setVolume(volume) {
        this.volume = Math.max(0, Math.min(1, volume));
        this.saveSettings();
        
        // 現在再生中の音声の音量を更新
        if (this.currentVoice) {
            this.currentVoice.volume = this.volume;
        }
    }
    
    setEnabled(enabled) {
        this.enabled = enabled;
        this.saveSettings();
        
        if (!enabled) {
            this.stopAllVoices();
        }
    }
    
    // Web Audio APIを使用したピッチ変更（将来実装）
    applyPitchEffect(audio, pitch) {
        // TODO: Web Audio APIを使用してピッチを変更
        // 現在は未実装
    }
    
    // デバッグ用：音声テスト
    testVoice(character, voiceKey) {
        console.log(`Testing voice: ${character}.${voiceKey}`);
        return this.playVoice(character, voiceKey, { overlap: true });
    }
}