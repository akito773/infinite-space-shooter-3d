// レイドバトルシステム - 球体空間での特殊戦闘

import * as THREE from 'three';

export class RaidBattleSystem {
    constructor(game) {
        this.game = game;
        this.active = false;
        this.raidBoss = null;
        this.battleSphere = null;
        this.sphereRadius = 1500;
        
        // ジャミング状態
        this.jammingActive = false;
        this.jammingLevel = 0; // 0-1
        this.jammingDuration = 0;
        
        // 位置情報共有
        this.teamPositions = new Map();
        this.positionUpdateDelay = 0;
        this.lastPositionBroadcast = 0;
        
        // 戦闘モード
        this.battleMode = 'raid'; // 'raid', 'pvp', 'capture'
        
        // UI要素
        this.raidUI = null;
        this.sphericalRadar = null;
        
        this.init();
    }
    
    init() {
        // レイド専用UIを準備
        this.createRaidUI();
        
        // イベントリスナー
        this.setupEventListeners();
    }
    
    startRaidBattle(bossData, players = []) {
        if (this.active) return;
        
        this.active = true;
        this.raidBoss = bossData;
        
        // 球体バトルフィールドを生成
        this.createBattleSphere(bossData.position);
        
        // カメラとプレイヤーの設定を変更
        this.transitionTo3DMode();
        
        // 演出
        this.playRaidIntro();
        
        // BGM変更
        if (this.game.soundManager) {
            this.game.soundManager.playBGM('raid_battle');
        }
        
        // マルチプレイヤーの場合
        if (players.length > 0) {
            this.initializeMultiplayer(players);
        }
        
        console.log('レイドバトル開始！');
    }
    
    createBattleSphere(centerPosition) {
        // 球体フィールドのビジュアル
        const sphereGeometry = new THREE.SphereGeometry(
            this.sphereRadius, 
            64, 
            32
        );
        
        // 半透明のエネルギーフィールド
        const sphereMaterial = new THREE.MeshBasicMaterial({
            color: 0x00ffff,
            transparent: true,
            opacity: 0.1,
            side: THREE.BackSide,
            wireframe: true
        });
        
        this.battleSphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
        this.battleSphere.position.copy(centerPosition);
        this.game.scene.add(this.battleSphere);
        
        // パルスアニメーション用
        this.battleSphere.userData = {
            pulsePhase: 0,
            baseScale: 1
        };
        
        // グリッドライン（球面座標表示）
        this.addSphereGrid();
        
        // 境界警告システム
        this.boundaryWarning = this.createBoundaryWarning();
    }
    
    addSphereGrid() {
        // 緯度線
        for (let i = 1; i < 6; i++) {
            const radius = this.sphereRadius * Math.sin((i * Math.PI) / 6);
            const y = this.sphereRadius * Math.cos((i * Math.PI) / 6);
            
            const curve = new THREE.EllipseCurve(
                0, 0,
                radius, radius,
                0, 2 * Math.PI,
                false,
                0
            );
            
            const points = curve.getPoints(50);
            const geometry = new THREE.BufferGeometry().setFromPoints(points);
            const material = new THREE.LineBasicMaterial({
                color: 0x004466,
                transparent: true,
                opacity: 0.3
            });
            
            const line = new THREE.Line(geometry, material);
            line.position.y = y;
            line.rotation.x = Math.PI / 2;
            this.battleSphere.add(line);
        }
        
        // 経度線
        for (let i = 0; i < 8; i++) {
            const angle = (i * Math.PI) / 4;
            const geometry = new THREE.BufferGeometry();
            const points = [];
            
            for (let j = 0; j <= 32; j++) {
                const theta = (j * Math.PI) / 32;
                points.push(new THREE.Vector3(
                    this.sphereRadius * Math.sin(theta) * Math.cos(angle),
                    this.sphereRadius * Math.cos(theta),
                    this.sphereRadius * Math.sin(theta) * Math.sin(angle)
                ));
            }
            
            geometry.setFromPoints(points);
            const material = new THREE.LineBasicMaterial({
                color: 0x004466,
                transparent: true,
                opacity: 0.3
            });
            
            const line = new THREE.Line(geometry, material);
            this.battleSphere.add(line);
        }
    }
    
    createBoundaryWarning() {
        // 境界に近づいたときの警告エフェクト
        const warningGeometry = new THREE.RingGeometry(
            this.sphereRadius * 0.95,
            this.sphereRadius * 1.05,
            64
        );
        
        const warningMaterial = new THREE.MeshBasicMaterial({
            color: 0xff0000,
            transparent: true,
            opacity: 0,
            side: THREE.DoubleSide
        });
        
        const warning = new THREE.Mesh(warningGeometry, warningMaterial);
        return warning;
    }
    
    transitionTo3DMode() {
        // プレイヤーの移動を3Dモードに
        if (this.game.player) {
            this.game.player.enable3DMovement = true;
            this.game.player.position.copy(
                this.getRandomSpherePosition()
            );
        }
        
        // カメラを引く
        const targetDistance = this.sphereRadius * 2.5;
        this.animateCameraTransition(targetDistance);
        
        // UIを球体戦闘用に切り替え
        this.showRaidUI();
    }
    
    getRandomSpherePosition() {
        // 球面上のランダムな位置を返す
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        
        return new THREE.Vector3(
            this.sphereRadius * Math.sin(phi) * Math.cos(theta),
            this.sphereRadius * Math.sin(phi) * Math.sin(theta),
            this.sphereRadius * Math.cos(phi)
        ).add(this.battleSphere.position);
    }
    
    // ジャミングシステム
    
    activateJamming(level = 0.5, duration = 10000) {
        this.jammingActive = true;
        this.jammingLevel = level;
        this.jammingDuration = duration;
        
        // 画面効果
        this.applyJammingEffects();
        
        // 通信遅延を設定
        this.positionUpdateDelay = 5000 * level; // 最大5秒遅延
        
        // 警告メッセージ
        this.showJammingWarning();
        
        // ジャミング終了タイマー
        setTimeout(() => {
            this.deactivateJamming();
        }, duration);
    }
    
    applyJammingEffects() {
        // ノイズシェーダーを適用
        if (!this.noiseEffect) {
            this.noiseEffect = document.createElement('div');
            this.noiseEffect.id = 'jamming-noise';
            this.noiseEffect.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                pointer-events: none;
                z-index: 999;
                background: repeating-linear-gradient(
                    0deg,
                    rgba(0, 255, 255, 0.03),
                    rgba(255, 0, 255, 0.03) 2px,
                    transparent 2px,
                    transparent 4px
                );
                animation: jamming-scan 0.5s linear infinite;
            `;
            document.body.appendChild(this.noiseEffect);
        }
        
        // アニメーションスタイル
        if (!document.querySelector('#jamming-animation')) {
            const style = document.createElement('style');
            style.id = 'jamming-animation';
            style.textContent = `
                @keyframes jamming-scan {
                    0% { transform: translateY(0); }
                    100% { transform: translateY(4px); }
                }
                
                .jammed {
                    animation: glitch 0.3s infinite;
                }
                
                @keyframes glitch {
                    0%, 100% { transform: translateX(0); }
                    20% { transform: translateX(-2px); }
                    40% { transform: translateX(2px); }
                    60% { transform: translateX(-1px); }
                    80% { transform: translateX(1px); }
                }
            `;
            document.head.appendChild(style);
        }
        
        // UIにジャミング効果を適用
        document.querySelectorAll('.raid-ui-element').forEach(el => {
            el.classList.add('jammed');
        });
    }
    
    showJammingWarning() {
        const warning = document.createElement('div');
        warning.className = 'jamming-warning';
        warning.innerHTML = `
            <div style="color: #ff0000; font-size: 24px; font-weight: bold;">
                ⚠️ 電磁妨害検出 ⚠️
            </div>
            <div style="color: #ffaa00; font-size: 16px;">
                通信システム障害 - レーダー精度低下
            </div>
            <div style="color: #ffffff; font-size: 14px;">
                ジャミングレベル: ${Math.floor(this.jammingLevel * 100)}%
            </div>
        `;
        
        warning.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(0, 0, 0, 0.9);
            border: 2px solid #ff0000;
            padding: 20px;
            text-align: center;
            z-index: 10000;
            animation: warning-pulse 0.5s ease-in-out infinite;
        `;
        
        document.body.appendChild(warning);
        
        setTimeout(() => {
            warning.style.opacity = '0';
            warning.style.transition = 'opacity 1s';
            setTimeout(() => warning.remove(), 1000);
        }, 3000);
    }
    
    deactivateJamming() {
        this.jammingActive = false;
        this.jammingLevel = 0;
        this.positionUpdateDelay = 0;
        
        // エフェクトを削除
        if (this.noiseEffect) {
            this.noiseEffect.remove();
            this.noiseEffect = null;
        }
        
        // UIからジャミング効果を削除
        document.querySelectorAll('.jammed').forEach(el => {
            el.classList.remove('jammed');
        });
        
        this.game.showMessage('通信システム回復');
    }
    
    // 位置情報共有システム
    
    broadcastPosition() {
        const now = Date.now();
        
        // ジャミング中は更新頻度が低下
        const updateInterval = this.jammingActive ? 
            1000 + this.positionUpdateDelay : 100;
        
        if (now - this.lastPositionBroadcast < updateInterval) return;
        
        const playerData = {
            id: this.game.playerId,
            position: this.game.player.mesh.position.clone(),
            rotation: this.game.player.mesh.rotation.clone(),
            health: this.game.player.health,
            shield: this.game.player.shield,
            status: this.getPlayerStatus(),
            timestamp: now
        };
        
        // ジャミング中は位置に誤差を追加
        if (this.jammingActive) {
            const error = 50 * this.jammingLevel;
            playerData.position.x += (Math.random() - 0.5) * error;
            playerData.position.y += (Math.random() - 0.5) * error;
            playerData.position.z += (Math.random() - 0.5) * error;
        }
        
        // ネットワークに送信（実装時）
        // this.network.send('position_update', playerData);
        
        this.lastPositionBroadcast = now;
    }
    
    updateTeamPosition(playerId, data) {
        // ジャミング中は古いデータの可能性
        if (this.jammingActive) {
            const age = Date.now() - data.timestamp;
            if (age > this.positionUpdateDelay) {
                // 古いデータは半透明で表示
                data.outdated = true;
            }
        }
        
        this.teamPositions.set(playerId, data);
        
        // 3Dレーダーに反映
        if (this.sphericalRadar) {
            this.sphericalRadar.updatePlayerMarker(playerId, data);
        }
    }
    
    // ピンシステム
    
    placePing(type, position) {
        const pingTypes = {
            attack: { color: 0xff0000, icon: '⚔️', message: '攻撃目標' },
            defend: { color: 0x0000ff, icon: '🛡️', message: '防衛位置' },
            danger: { color: 0xffaa00, icon: '⚠️', message: '危険' },
            rally: { color: 0x00ff00, icon: '🚩', message: '集合' }
        };
        
        const pingData = pingTypes[type] || pingTypes.danger;
        
        // 3D空間にピンを配置
        const ping = this.create3DPing(position, pingData);
        this.battleSphere.add(ping);
        
        // チームに通知
        this.broadcastPing(type, position);
        
        // 一定時間後に削除
        setTimeout(() => {
            this.battleSphere.remove(ping);
        }, 30000);
    }
    
    create3DPing(position, data) {
        const group = new THREE.Group();
        
        // ピンの柱
        const lineGeometry = new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(0, 0, 0),
            new THREE.Vector3(0, 100, 0)
        ]);
        const lineMaterial = new THREE.LineBasicMaterial({
            color: data.color,
            linewidth: 3
        });
        const line = new THREE.Line(lineGeometry, lineMaterial);
        
        // アイコン（スプライト）
        const canvas = document.createElement('canvas');
        canvas.width = 128;
        canvas.height = 128;
        const ctx = canvas.getContext('2d');
        ctx.font = '64px Arial';
        ctx.fillText(data.icon, 32, 80);
        
        const texture = new THREE.CanvasTexture(canvas);
        const spriteMaterial = new THREE.SpriteMaterial({
            map: texture,
            color: data.color
        });
        const sprite = new THREE.Sprite(spriteMaterial);
        sprite.position.y = 120;
        sprite.scale.set(50, 50, 1);
        
        group.add(line);
        group.add(sprite);
        group.position.copy(position);
        
        // パルスアニメーション
        group.userData = {
            pulse: 0,
            pulseSpeed: 2
        };
        
        return group;
    }
    
    // レイド専用UI
    
    createRaidUI() {
        const raidContainer = document.createElement('div');
        raidContainer.id = 'raid-ui';
        raidContainer.className = 'raid-ui-element';
        raidContainer.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            display: none;
        `;
        
        // 3Dレーダー
        const radar3D = document.createElement('div');
        radar3D.id = 'spherical-radar';
        radar3D.style.cssText = `
            position: absolute;
            bottom: 20px;
            left: 20px;
            width: 200px;
            height: 200px;
            background: rgba(0, 20, 40, 0.8);
            border: 2px solid #00ffff;
            border-radius: 50%;
            pointer-events: auto;
        `;
        
        // ジャミングインジケーター
        const jammingIndicator = document.createElement('div');
        jammingIndicator.id = 'jamming-indicator';
        jammingIndicator.style.cssText = `
            position: absolute;
            top: 100px;
            right: 20px;
            width: 200px;
            padding: 10px;
            background: rgba(0, 0, 0, 0.8);
            border: 1px solid #ff0000;
            color: white;
            font-family: monospace;
        `;
        jammingIndicator.innerHTML = `
            <div>SIGNAL STRENGTH</div>
            <div class="signal-bars">
                <span>■</span><span>■</span><span>■</span><span>□</span><span>□</span>
            </div>
            <div class="jamming-status">CLEAR</div>
        `;
        
        // チーム状態パネル
        const teamPanel = document.createElement('div');
        teamPanel.id = 'team-status-panel';
        teamPanel.style.cssText = `
            position: absolute;
            top: 20px;
            right: 20px;
            width: 250px;
            background: rgba(0, 0, 0, 0.8);
            border: 1px solid #00ffff;
            padding: 10px;
            color: white;
        `;
        
        raidContainer.appendChild(radar3D);
        raidContainer.appendChild(jammingIndicator);
        raidContainer.appendChild(teamPanel);
        document.body.appendChild(raidContainer);
        
        this.raidUI = raidContainer;
    }
    
    showRaidUI() {
        if (this.raidUI) {
            this.raidUI.style.display = 'block';
        }
        
        // 通常UIの一部を非表示
        document.querySelector('.minimap')?.classList.add('hidden');
    }
    
    hideRaidUI() {
        if (this.raidUI) {
            this.raidUI.style.display = 'none';
        }
        
        // 通常UIを復元
        document.querySelector('.minimap')?.classList.remove('hidden');
    }
    
    // 更新処理
    
    update(delta) {
        if (!this.active) return;
        
        // 球体のパルスアニメーション
        if (this.battleSphere) {
            this.battleSphere.userData.pulsePhase += delta * 0.001;
            const scale = 1 + Math.sin(this.battleSphere.userData.pulsePhase) * 0.02;
            this.battleSphere.scale.setScalar(scale);
        }
        
        // 境界チェック
        this.checkBoundary();
        
        // 位置情報の送信
        this.broadcastPosition();
        
        // ピンのアニメーション
        this.updatePings(delta);
        
        // ジャミング効果の更新
        if (this.jammingActive) {
            this.updateJammingEffects(delta);
        }
    }
    
    checkBoundary() {
        if (!this.game.player || !this.battleSphere) return;
        
        const distance = this.game.player.mesh.position.distanceTo(
            this.battleSphere.position
        );
        
        // 境界に近づいたら警告
        if (distance > this.sphereRadius * 0.9) {
            if (!this.boundaryWarningActive) {
                this.showBoundaryWarning();
                this.boundaryWarningActive = true;
            }
            
            // 強制的に内側に押し戻す
            if (distance > this.sphereRadius * 0.95) {
                const direction = this.game.player.mesh.position.clone()
                    .sub(this.battleSphere.position)
                    .normalize();
                
                this.game.player.mesh.position.copy(
                    this.battleSphere.position.clone()
                        .add(direction.multiplyScalar(this.sphereRadius * 0.94))
                );
            }
        } else {
            this.boundaryWarningActive = false;
        }
    }
    
    showBoundaryWarning() {
        // 画面を赤くフラッシュ
        const flash = document.createElement('div');
        flash.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: radial-gradient(transparent, rgba(255, 0, 0, 0.5));
            pointer-events: none;
            z-index: 9999;
            animation: boundary-flash 0.5s ease-in-out;
        `;
        
        document.body.appendChild(flash);
        setTimeout(() => flash.remove(), 500);
        
        // 警告音
        if (this.game.soundManager) {
            this.game.soundManager.play('warning');
        }
    }
    
    endRaidBattle(victory = true) {
        this.active = false;
        
        // 球体を縮小して消す
        const shrinkAnimation = () => {
            if (this.battleSphere.scale.x > 0.01) {
                this.battleSphere.scale.multiplyScalar(0.95);
                requestAnimationFrame(shrinkAnimation);
            } else {
                this.game.scene.remove(this.battleSphere);
                this.battleSphere = null;
            }
        };
        shrinkAnimation();
        
        // プレイヤーを2.5Dモードに戻す
        if (this.game.player) {
            this.game.player.enable3DMovement = false;
            this.game.player.mesh.position.y = 0;
        }
        
        // UIを通常に戻す
        this.hideRaidUI();
        
        // ジャミングを解除
        if (this.jammingActive) {
            this.deactivateJamming();
        }
        
        // 結果表示
        this.showBattleResult(victory);
    }
    
    showBattleResult(victory) {
        const result = document.createElement('div');
        result.className = 'raid-result';
        result.innerHTML = `
            <h1>${victory ? 'VICTORY!' : 'DEFEATED'}</h1>
            <div class="rewards">
                ${victory ? this.generateRewardsList() : ''}
            </div>
        `;
        
        result.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(0, 0, 0, 0.9);
            border: 3px solid ${victory ? '#00ff00' : '#ff0000'};
            padding: 40px;
            text-align: center;
            color: white;
            font-size: 24px;
            z-index: 10000;
        `;
        
        document.body.appendChild(result);
        
        setTimeout(() => {
            result.style.opacity = '0';
            result.style.transition = 'opacity 2s';
            setTimeout(() => result.remove(), 2000);
        }, 5000);
    }
    
    generateRewardsList() {
        // 仮の報酬リスト
        return `
            <ul style="list-style: none; padding: 0;">
                <li>💰 10,000 Credits</li>
                <li>⚡ Plasma Cannon Mk.III</li>
                <li>🛡️ Quantum Shield Generator</li>
                <li>🏆 Achievement: Void Slayer</li>
            </ul>
        `;
    }
    
    setupEventListeners() {
        // ピン配置のキーバインド
        document.addEventListener('keydown', (e) => {
            if (!this.active) return;
            
            if (e.key >= '1' && e.key <= '4') {
                const types = ['attack', 'defend', 'danger', 'rally'];
                const type = types[parseInt(e.key) - 1];
                
                // レイキャストで3D位置を取得
                const position = this.getRaycastPosition();
                if (position) {
                    this.placePing(type, position);
                }
            }
        });
    }
    
    getRaycastPosition() {
        // マウス位置から3D空間への位置を計算
        // 簡易実装
        return this.game.player.mesh.position.clone()
            .add(new THREE.Vector3(
                (Math.random() - 0.5) * 200,
                (Math.random() - 0.5) * 200,
                -300
            ));
    }
    
    playRaidIntro() {
        // レイド開始時の演出
        const intro = document.createElement('div');
        intro.className = 'raid-intro';
        intro.innerHTML = `
            <div class="warning-text">WARNING</div>
            <div class="raid-title">VOID EMPEROR AWAKENS</div>
            <div class="objective">Destroy the core within the time limit</div>
        `;
        
        intro.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.8);
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            color: white;
            z-index: 10000;
            animation: intro-fade 3s ease-out forwards;
        `;
        
        const style = document.createElement('style');
        style.textContent = `
            .warning-text {
                font-size: 48px;
                color: #ff0000;
                animation: warning-blink 1s ease-in-out infinite;
            }
            
            .raid-title {
                font-size: 64px;
                color: #ffffff;
                margin: 20px 0;
                text-shadow: 0 0 20px #00ffff;
            }
            
            .objective {
                font-size: 24px;
                color: #aaaaaa;
            }
            
            @keyframes intro-fade {
                0% { opacity: 0; }
                20% { opacity: 1; }
                80% { opacity: 1; }
                100% { opacity: 0; pointer-events: none; }
            }
            
            @keyframes warning-blink {
                0%, 100% { opacity: 1; }
                50% { opacity: 0.3; }
            }
        `;
        
        document.head.appendChild(style);
        document.body.appendChild(intro);
        
        setTimeout(() => {
            intro.remove();
            style.remove();
        }, 3000);
    }
}

// PvPモード拡張
export class PvPBattleMode extends RaidBattleSystem {
    constructor(game) {
        super(game);
        this.battleMode = 'pvp';
        this.teams = {
            red: new Set(),
            blue: new Set()
        };
        this.objectives = [];
        this.timeLimit = 600000; // 10分
        this.startTime = 0;
    }
    
    startPvPBattle(mode = 'deathmatch', playerList = []) {
        this.active = true;
        this.startTime = Date.now();
        
        // プレイヤーをチーム分け
        this.assignTeams(playerList);
        
        // モードに応じた目標を設定
        switch(mode) {
            case 'capture':
                this.setupCapturePoints();
                break;
            case 'ctf':
                this.setupFlags();
                break;
            case 'deathmatch':
                // 特別な設定なし
                break;
        }
        
        // 球体バトルフィールドを生成
        this.createBattleSphere(new THREE.Vector3(0, 0, 0));
        
        // PvP用UIを表示
        this.showPvPUI();
    }
    
    assignTeams(players) {
        players.forEach((player, index) => {
            const team = index % 2 === 0 ? 'red' : 'blue';
            this.teams[team].add(player.id);
            
            // チームカラーを設定
            player.teamColor = team === 'red' ? 0xff0000 : 0x0000ff;
        });
    }
    
    setupCapturePoints() {
        // 球面上に3つのキャプチャーポイントを配置
        const points = [
            { angle: 0, name: 'Alpha' },
            { angle: Math.PI * 2/3, name: 'Beta' },
            { angle: Math.PI * 4/3, name: 'Gamma' }
        ];
        
        points.forEach(point => {
            const position = new THREE.Vector3(
                Math.cos(point.angle) * this.sphereRadius * 0.7,
                0,
                Math.sin(point.angle) * this.sphereRadius * 0.7
            );
            
            this.objectives.push({
                type: 'capture',
                name: point.name,
                position: position,
                owner: null,
                progress: 0
            });
        });
    }
}