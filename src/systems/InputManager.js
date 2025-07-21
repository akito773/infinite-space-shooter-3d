import * as THREE from 'three';

export class InputManager {
    constructor(camera) {
        this.camera = camera;
        this.keys = {
            w: false,
            a: false,
            s: false,
            d: false,
            shift: false,
            space: false
        };
        this.mouse = new THREE.Vector2();
        this.isShooting = false;
        
        this.raycaster = new THREE.Raycaster();
        
        this.initEventListeners();
        this.initTouchControls();
    }

    initEventListeners() {
        // キーボード
        document.addEventListener('keydown', (e) => {
            switch(e.key.toLowerCase()) {
                case 'w': this.keys.w = true; break;
                case 'a': this.keys.a = true; break;
                case 's': this.keys.s = true; break;
                case 'd': this.keys.d = true; break;
                case 'shift': this.keys.shift = true; break;
                case ' ': 
                    this.keys.space = true; 
                    // ストーリーダイアログのスキップ
                    if (window.game && window.game.storySystem) {
                        window.game.storySystem.skipDialogue();
                    }
                    break;
            }
            
            // スキル発動（1-4キー）
            if (e.key >= '1' && e.key <= '4' && window.game && window.game.skillSystem) {
                window.game.skillSystem.useSkill(parseInt(e.key));
            }
            
            // 採掘キー（Eキー）
            if (e.key.toLowerCase() === 'e' && window.game && window.game.miningSystem && window.game.player) {
                // 近くの採掘可能な小惑星を探す
                const playerPos = window.game.player.group.position;
                window.game.asteroidFields.forEach(field => {
                    if (field.asteroids) {
                        field.asteroids.forEach(asteroid => {
                            if (asteroid && asteroid.userData && asteroid.userData.mineable && 
                                asteroid.position && asteroid.position.distanceTo(playerPos) < 30) {
                                window.game.miningSystem.startMining(asteroid);
                            }
                        });
                    }
                });
            }
            
            // ズーム機能（Zキー）
            if (e.key.toLowerCase() === 'z' && window.game && window.game.zoomSystem) {
                window.game.zoomSystem.toggleZoom();
            }
            
            // 予測照準トグル（Pキー）
            if (e.key.toLowerCase() === 'p' && window.game && window.game.predictiveAiming) {
                const enabled = window.game.predictiveAiming.toggle();
                console.log(`予測照準: ${enabled ? 'ON' : 'OFF'}`);
            }
            
            // デバッグ：ボス強制出現（Bキー）
            if (e.key.toLowerCase() === 'b' && window.game && window.game.bossSpawnSystem) {
                window.game.bossSpawnSystem.forceSpawnBoss();
                console.log('Boss spawned!');
            }
            
            // デバッグ：レイドボス強制出現（Rキー）
            if (e.key.toLowerCase() === 'r' && window.game && window.game.bossSpawnSystem) {
                window.game.bossSpawnSystem.forceSpawnRaidBoss();
                console.log('Raid Boss spawned!');
            }
            
            // 酒場訪問（Tキー）
            if (e.key.toLowerCase() === 't' && window.game && window.game.triggerTavernMeeting) {
                window.game.triggerTavernMeeting();
                console.log('Tavern meeting triggered!');
            }
        });

        document.addEventListener('keyup', (e) => {
            switch(e.key.toLowerCase()) {
                case 'w': this.keys.w = false; break;
                case 'a': this.keys.a = false; break;
                case 's': this.keys.s = false; break;
                case 'd': this.keys.d = false; break;
                case 'shift': this.keys.shift = false; break;
                case ' ': this.keys.space = false; break;
            }
        });

        // マウス
        document.addEventListener('mousemove', (e) => {
            this.mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
            this.mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
        });

        document.addEventListener('mousedown', (e) => {
            if (e.button === 0) this.isShooting = true;
        });

        document.addEventListener('mouseup', (e) => {
            if (e.button === 0) this.isShooting = false;
        });
    }

    initTouchControls() {
        const joystick = document.getElementById('joystick');
        const joystickThumb = document.getElementById('joystick-thumb');
        const fireButton = document.getElementById('fire-button');
        
        if (!joystick || !fireButton) return;
        
        // タッチデバイスの場合、コントロールを表示
        if ('ontouchstart' in window || navigator.maxTouchPoints > 0) {
            document.querySelector('.touch-controls').style.display = 'block';
        }
        
        // ジョイスティック
        let joystickActive = false;
        let joystickStart = { x: 0, y: 0 };
        
        joystick.addEventListener('touchstart', (e) => {
            joystickActive = true;
            const touch = e.touches[0];
            const rect = joystick.getBoundingClientRect();
            joystickStart.x = touch.clientX - rect.left - rect.width / 2;
            joystickStart.y = touch.clientY - rect.top - rect.height / 2;
        });
        
        joystick.addEventListener('touchmove', (e) => {
            if (!joystickActive) return;
            e.preventDefault();
            
            const touch = e.touches[0];
            const rect = joystick.getBoundingClientRect();
            let x = touch.clientX - rect.left - rect.width / 2;
            let y = touch.clientY - rect.top - rect.height / 2;
            
            // 制限
            const distance = Math.sqrt(x * x + y * y);
            const maxDistance = rect.width / 2 - 25;
            if (distance > maxDistance) {
                x = (x / distance) * maxDistance;
                y = (y / distance) * maxDistance;
            }
            
            // ジョイスティックサム移動
            joystickThumb.style.transform = `translate(${x}px, ${y}px)`;
            
            // 入力値に変換（感度を調整）
            const deadzone = 15; // デッドゾーンを小さく
            this.keys.w = y < -deadzone;
            this.keys.s = y > deadzone;
            this.keys.a = x < -deadzone;
            this.keys.d = x > deadzone;
            
            // ブーストボタンチェック（ジョイスティックを強く押した場合）
            this.keys.shift = distance > maxDistance * 0.8;
        });
        
        joystick.addEventListener('touchend', () => {
            joystickActive = false;
            joystickThumb.style.transform = 'translate(0, 0)';
            this.keys.w = false;
            this.keys.s = false;
            this.keys.a = false;
            this.keys.d = false;
        });
        
        // 射撃ボタン
        fireButton.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.isShooting = true;
        });
        
        fireButton.addEventListener('touchend', () => {
            this.isShooting = false;
        });
        
        // タッチで照準（画面の上半分）
        let touchAiming = false;
        document.addEventListener('touchstart', (e) => {
            const touch = e.touches[0];
            // 画面の上半分をタッチした場合は照準として扱う
            if (touch.clientY < window.innerHeight / 2) {
                touchAiming = true;
                this.updateMouseFromTouch(touch);
            }
        });
        
        document.addEventListener('touchmove', (e) => {
            if (touchAiming && e.touches.length > 0) {
                e.preventDefault();
                this.updateMouseFromTouch(e.touches[0]);
            }
        });
        
        document.addEventListener('touchend', () => {
            touchAiming = false;
        });
    }
    
    updateMouseFromTouch(touch) {
        this.mouse.x = (touch.clientX / window.innerWidth) * 2 - 1;
        this.mouse.y = -(touch.clientY / window.innerHeight) * 2 + 1;
    }

    getMouseWorldPosition(distance = 100) {
        this.raycaster.setFromCamera(this.mouse, this.camera);
        const direction = this.raycaster.ray.direction;
        const position = this.camera.position.clone();
        position.add(direction.multiplyScalar(distance));
        return position;
    }

    update() {
        // 必要に応じて更新処理
    }
}