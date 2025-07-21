// チュートリアル・ガイドシステム

import * as THREE from 'three';

export class TutorialSystem {
    constructor(game) {
        this.game = game;
        
        // 初回プレイフラグ
        this.isFirstPlay = !localStorage.getItem('hasPlayedBefore');
        
        // 現在のチュートリアルステップ
        this.currentStep = 0;
        this.tutorialActive = this.isFirstPlay;
        
        // チュートリアルステップ定義
        this.tutorialSteps = [
            {
                id: 'welcome',
                title: 'ようこそ、パイロット！',
                message: '宇宙探査へようこそ。基本操作を確認しましょう。',
                duration: 5000,
                highlight: null
            },
            {
                id: 'movement',
                title: '移動操作',
                message: 'W/A/S/D: 移動\nShift: ブースト\nマウス: 視点操作',
                duration: 8000,
                highlight: 'controls'
            },
            {
                id: 'combat',
                title: '戦闘操作',
                message: 'Space/左クリック: 射撃\nQ/E: ロール回転',
                duration: 6000,
                highlight: 'combat'
            },
            {
                id: 'scan',
                title: '探索機能',
                message: 'S: Deep Spaceスキャン\n新しい惑星を発見できます',
                duration: 6000,
                highlight: 'scan'
            },
            {
                id: 'mission',
                title: '最初のミッション',
                message: '近くの宇宙ステーションを探して接近しましょう\nミニマップの黄色いマーカーを目指してください',
                duration: 8000,
                highlight: 'minimap'
            }
        ];
        
        // UI要素
        this.tutorialUI = null;
        this.guidanceArrow = null;
        this.helpButton = null;
        
        this.init();
    }
    
    init() {
        // チュートリアルUI作成
        this.createTutorialUI();
        
        // ヘルプボタン作成（常時表示）
        this.createHelpButton();
        
        // ガイダンス矢印作成
        this.createGuidanceArrow();
        
        // 初回プレイならチュートリアル開始
        if (this.tutorialActive) {
            this.startTutorial();
        }
        
        // キーボードショートカット
        document.addEventListener('keydown', (e) => {
            if (e.key === 'h' || e.key === 'H') {
                this.toggleHelp();
            }
            if (e.key === 'k' || e.key === 'K') {
                this.game.skillTreeSystem?.showSkillTree();
            }
            if (e.key === 'Escape' && this.tutorialActive) {
                this.skipTutorial();
            }
        });
    }
    
    createTutorialUI() {
        // チュートリアルメッセージ表示用のUI
        const tutorialDiv = document.createElement('div');
        tutorialDiv.id = 'tutorial-ui';
        tutorialDiv.style.cssText = `
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: linear-gradient(135deg, rgba(0, 20, 40, 0.95), rgba(0, 40, 80, 0.95));
            border: 2px solid #00ffff;
            border-radius: 10px;
            padding: 20px 30px;
            color: white;
            font-family: 'Orbitron', monospace;
            z-index: 1000;
            display: none;
            box-shadow: 0 0 20px rgba(0, 255, 255, 0.5);
            min-width: 400px;
            text-align: center;
        `;
        
        tutorialDiv.innerHTML = `
            <div class="tutorial-header" style="font-size: 20px; color: #00ffff; margin-bottom: 10px;"></div>
            <div class="tutorial-message" style="font-size: 16px; line-height: 1.5; white-space: pre-line;"></div>
            <div class="tutorial-progress" style="margin-top: 15px;">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <button id="skip-tutorial" style="
                        background: rgba(255, 0, 0, 0.3);
                        border: 1px solid #ff0000;
                        color: white;
                        padding: 5px 15px;
                        cursor: pointer;
                        border-radius: 5px;
                        font-size: 12px;
                    ">スキップ (ESC)</button>
                    <div class="step-indicator" style="font-size: 12px; color: #888;"></div>
                </div>
            </div>
        `;
        
        document.body.appendChild(tutorialDiv);
        this.tutorialUI = tutorialDiv;
        
        // スキップボタンイベント
        document.getElementById('skip-tutorial').onclick = () => this.skipTutorial();
    }
    
    createHelpButton() {
        // ヘルプボタン（常時表示）
        const helpBtn = document.createElement('button');
        helpBtn.id = 'help-button';
        helpBtn.innerHTML = '❓ ヘルプ (H)';
        helpBtn.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: linear-gradient(135deg, #004488, #0066cc);
            border: 2px solid #00aaff;
            color: white;
            padding: 10px 20px;
            cursor: pointer;
            border-radius: 5px;
            font-size: 14px;
            font-family: 'Orbitron', monospace;
            z-index: 999;
            transition: all 0.3s;
        `;
        
        helpBtn.onmouseover = () => {
            helpBtn.style.background = 'linear-gradient(135deg, #0066cc, #0088ff)';
            helpBtn.style.transform = 'scale(1.05)';
        };
        
        helpBtn.onmouseout = () => {
            helpBtn.style.background = 'linear-gradient(135deg, #004488, #0066cc)';
            helpBtn.style.transform = 'scale(1)';
        };
        
        helpBtn.onclick = () => this.toggleHelp();
        
        document.body.appendChild(helpBtn);
        this.helpButton = helpBtn;
    }
    
    createGuidanceArrow() {
        // 3D空間のガイダンス矢印
        const arrowGeometry = new THREE.ConeGeometry(2, 5, 8);
        const arrowMaterial = new THREE.MeshBasicMaterial({
            color: 0xffff00,
            transparent: true,
            opacity: 0.8
        });
        
        this.guidanceArrow = new THREE.Mesh(arrowGeometry, arrowMaterial);
        this.guidanceArrow.visible = false;
        
        // 点滅アニメーション用
        this.guidanceArrow.userData.pulseTime = 0;
        
        this.game.scene.add(this.guidanceArrow);
    }
    
    startTutorial() {
        this.tutorialActive = true;
        this.currentStep = 0;
        this.showTutorialStep(this.currentStep);
        
        // 初回プレイフラグを保存
        localStorage.setItem('hasPlayedBefore', 'true');
    }
    
    showTutorialStep(stepIndex) {
        if (stepIndex >= this.tutorialSteps.length) {
            this.completeTutorial();
            return;
        }
        
        const step = this.tutorialSteps[stepIndex];
        
        // UI更新
        this.tutorialUI.style.display = 'block';
        this.tutorialUI.querySelector('.tutorial-header').textContent = step.title;
        this.tutorialUI.querySelector('.tutorial-message').textContent = step.message;
        this.tutorialUI.querySelector('.step-indicator').textContent = 
            `ステップ ${stepIndex + 1} / ${this.tutorialSteps.length}`;
        
        // ハイライト処理
        this.highlightElement(step.highlight);
        
        // 自動進行
        if (step.duration > 0) {
            setTimeout(() => {
                if (this.tutorialActive && this.currentStep === stepIndex) {
                    this.nextTutorialStep();
                }
            }, step.duration);
        }
    }
    
    nextTutorialStep() {
        this.currentStep++;
        this.showTutorialStep(this.currentStep);
    }
    
    skipTutorial() {
        this.tutorialActive = false;
        this.tutorialUI.style.display = 'none';
        this.clearHighlights();
        
        this.game.showMessage('チュートリアルをスキップしました。Hキーでヘルプを表示できます。');
    }
    
    completeTutorial() {
        this.tutorialActive = false;
        this.tutorialUI.style.display = 'none';
        this.clearHighlights();
        
        this.game.showMessage('チュートリアル完了！宇宙探索を開始しましょう！');
        
        // 最初のミッションを開始
        if (this.game.missionSystem) {
            this.game.missionSystem.startFirstMission();
        }
    }
    
    highlightElement(elementId) {
        this.clearHighlights();
        
        switch(elementId) {
            case 'controls':
                // 操作説明をハイライト
                const controls = document.querySelector('.controls-info');
                if (controls) controls.style.border = '2px solid yellow';
                break;
                
            case 'minimap':
                // ミニマップをハイライト
                const minimap = document.getElementById('minimap');
                if (minimap) minimap.style.border = '3px solid yellow';
                break;
                
            case 'scan':
                // スキャンボタンをハイライト
                const scanBtn = document.getElementById('scan-button');
                if (scanBtn) {
                    scanBtn.style.border = '3px solid yellow';
                    scanBtn.style.animation = 'pulse 1s infinite';
                }
                break;
        }
    }
    
    clearHighlights() {
        // すべてのハイライトを削除
        document.querySelectorAll('[style*="border:"][style*="yellow"]').forEach(el => {
            el.style.border = '';
        });
        
        const scanBtn = document.getElementById('scan-button');
        if (scanBtn) scanBtn.style.animation = '';
    }
    
    toggleHelp() {
        // ヘルプパネルの表示切り替え
        let helpPanel = document.getElementById('help-panel');
        
        if (!helpPanel) {
            this.createHelpPanel();
            helpPanel = document.getElementById('help-panel');
        }
        
        helpPanel.style.display = helpPanel.style.display === 'none' ? 'block' : 'none';
    }
    
    createHelpPanel() {
        const helpPanel = document.createElement('div');
        helpPanel.id = 'help-panel';
        helpPanel.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(0, 0, 0, 0.9);
            border: 2px solid #00ffff;
            border-radius: 10px;
            padding: 30px;
            color: white;
            font-family: monospace;
            z-index: 10000;
            max-width: 600px;
            max-height: 80vh;
            overflow-y: auto;
            display: none;
        `;
        
        helpPanel.innerHTML = `
            <h2 style="color: #00ffff; margin-bottom: 20px;">🚀 操作ガイド</h2>
            
            <div style="margin-bottom: 20px;">
                <h3 style="color: #ffaa00;">基本操作</h3>
                <table style="width: 100%; font-size: 14px;">
                    <tr><td style="padding: 5px;">W/A/S/D</td><td>移動</td></tr>
                    <tr><td style="padding: 5px;">マウス</td><td>視点操作</td></tr>
                    <tr><td style="padding: 5px;">Shift</td><td>ブースト</td></tr>
                    <tr><td style="padding: 5px;">Q/E</td><td>ロール回転</td></tr>
                </table>
            </div>
            
            <div style="margin-bottom: 20px;">
                <h3 style="color: #ffaa00;">戦闘</h3>
                <table style="width: 100%; font-size: 14px;">
                    <tr><td style="padding: 5px;">Space/左クリック</td><td>射撃</td></tr>
                    <tr><td style="padding: 5px;">R</td><td>リロード（将来実装）</td></tr>
                </table>
            </div>
            
            <div style="margin-bottom: 20px;">
                <h3 style="color: #ffaa00;">探索</h3>
                <table style="width: 100%; font-size: 14px;">
                    <tr><td style="padding: 5px;">S</td><td>Deep Spaceスキャン</td></tr>
                    <tr><td style="padding: 5px;">F</td><td>インタラクト（ステーション/ワープゲート）</td></tr>
                    <tr><td style="padding: 5px;">Tab</td><td>ミッション確認</td></tr>
                </table>
            </div>
            
            <div style="margin-bottom: 20px;">
                <h3 style="color: #ffaa00;">その他</h3>
                <table style="width: 100%; font-size: 14px;">
                    <tr><td style="padding: 5px;">H</td><td>このヘルプを表示/非表示</td></tr>
                    <tr><td style="padding: 5px;">I</td><td>インベントリを開く</td></tr>
                    <tr><td style="padding: 5px;">K</td><td>スキルツリーを開く</td></tr>
                    <tr><td style="padding: 5px;">G</td><td>ゲームガイドを開く</td></tr>
                    <tr><td style="padding: 5px;">ESC</td><td>メニュー（将来実装）</td></tr>
                </table>
            </div>
            
            <button id="close-help" style="
                background: #ff4444;
                border: none;
                color: white;
                padding: 10px 20px;
                cursor: pointer;
                border-radius: 5px;
                margin-top: 10px;
                width: 100%;
            ">閉じる (H)</button>
        `;
        
        document.body.appendChild(helpPanel);
        
        // 閉じるボタン
        document.getElementById('close-help').onclick = () => {
            helpPanel.style.display = 'none';
        };
    }
    
    update(delta) {
        // ガイダンス矢印のアニメーション
        if (this.guidanceArrow && this.guidanceArrow.visible) {
            this.guidanceArrow.userData.pulseTime += delta;
            const scale = 1 + Math.sin(this.guidanceArrow.userData.pulseTime * 3) * 0.2;
            this.guidanceArrow.scale.setScalar(scale);
            
            // 矢印を回転
            this.guidanceArrow.rotation.y += delta;
        }
    }
    
    // 特定の対象に向けてガイダンス矢印を表示
    showGuidanceArrow(targetPosition) {
        if (!this.guidanceArrow || !this.game.player) return;
        
        const playerPos = this.game.player.group.position;
        const direction = new THREE.Vector3()
            .subVectors(targetPosition, playerPos)
            .normalize();
        
        // 矢印の位置をプレイヤーの前方に配置
        const arrowPos = playerPos.clone().add(direction.multiplyScalar(20));
        this.guidanceArrow.position.copy(arrowPos);
        
        // 矢印を目標に向ける
        this.guidanceArrow.lookAt(targetPosition);
        this.guidanceArrow.rotateX(Math.PI / 2);
        
        this.guidanceArrow.visible = true;
    }
    
    hideGuidanceArrow() {
        if (this.guidanceArrow) {
            this.guidanceArrow.visible = false;
        }
    }
    
    // 初心者向けヒント表示
    showHint(message, duration = 3000) {
        const hintDiv = document.createElement('div');
        hintDiv.style.cssText = `
            position: fixed;
            bottom: 100px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(0, 0, 0, 0.8);
            border: 1px solid #ffaa00;
            border-radius: 5px;
            padding: 10px 20px;
            color: #ffaa00;
            font-size: 14px;
            z-index: 500;
            animation: fadeIn 0.5s;
        `;
        hintDiv.textContent = `💡 ヒント: ${message}`;
        
        document.body.appendChild(hintDiv);
        
        setTimeout(() => {
            hintDiv.style.animation = 'fadeOut 0.5s';
            setTimeout(() => hintDiv.remove(), 500);
        }, duration);
    }
}