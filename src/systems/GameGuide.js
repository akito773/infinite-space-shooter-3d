// ゲームガイドシステム

export class GameGuide {
    constructor(game) {
        this.game = game;
        this.isOpen = false;
        this.currentTab = 'basics';
        
        this.createUI();
        this.setupEventListeners();
    }
    
    createUI() {
        // メインコンテナ
        this.container = document.createElement('div');
        this.container.id = 'game-guide';
        this.container.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 900px;
            height: 700px;
            background: linear-gradient(to bottom, rgba(0, 10, 30, 0.98), rgba(0, 20, 40, 0.98));
            border: 2px solid #00ffff;
            border-radius: 10px;
            display: none;
            z-index: 10000;
            font-family: 'Orbitron', monospace;
            color: white;
            box-shadow: 0 0 30px rgba(0, 255, 255, 0.5);
            overflow: hidden;
        `;
        
        // ヘッダー
        const header = document.createElement('div');
        header.style.cssText = `
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 20px;
            border-bottom: 2px solid #00ffff;
            background: rgba(0, 50, 100, 0.3);
        `;
        
        const title = document.createElement('h2');
        title.textContent = '🎮 ゲームガイド';
        title.style.cssText = `
            margin: 0;
            color: #00ffff;
            font-size: 28px;
            text-shadow: 0 0 10px rgba(0, 255, 255, 0.5);
        `;
        
        const closeButton = document.createElement('button');
        closeButton.textContent = '✕';
        closeButton.style.cssText = `
            background: none;
            border: 2px solid #ff4444;
            color: #ff4444;
            width: 40px;
            height: 40px;
            border-radius: 5px;
            cursor: pointer;
            font-size: 20px;
            transition: all 0.3s;
        `;
        closeButton.onclick = () => this.close();
        
        header.appendChild(title);
        header.appendChild(closeButton);
        
        // メインコンテンツ
        const content = document.createElement('div');
        content.style.cssText = `
            display: flex;
            height: calc(100% - 80px);
        `;
        
        // サイドバー（タブ）
        const sidebar = this.createSidebar();
        
        // コンテンツエリア
        this.contentArea = document.createElement('div');
        this.contentArea.style.cssText = `
            flex: 1;
            padding: 30px;
            overflow-y: auto;
            background: rgba(0, 0, 0, 0.3);
        `;
        
        content.appendChild(sidebar);
        content.appendChild(this.contentArea);
        
        this.container.appendChild(header);
        this.container.appendChild(content);
        document.body.appendChild(this.container);
        
        // 初期コンテンツ表示
        this.showContent('basics');
        
        // スタイル追加
        this.addStyles();
    }
    
    createSidebar() {
        const sidebar = document.createElement('div');
        sidebar.style.cssText = `
            width: 200px;
            background: rgba(0, 30, 60, 0.5);
            border-right: 1px solid #00ffff;
            padding: 20px 0;
        `;
        
        const tabs = [
            { id: 'basics', icon: '🎯', name: '基本操作' },
            { id: 'economy', icon: '💰', name: 'お金の稼ぎ方' },
            { id: 'combat', icon: '⚔️', name: '戦闘のコツ' },
            { id: 'exploration', icon: '🌌', name: '探索ガイド' },
            { id: 'equipment', icon: '🔧', name: '装備について' },
            { id: 'missions', icon: '📋', name: 'ミッション' },
            { id: 'save', icon: '💾', name: 'セーブ・ロード' },
            { id: 'tips', icon: '💡', name: 'ヒント・小技' }
        ];
        
        tabs.forEach(tab => {
            const tabButton = document.createElement('button');
            tabButton.className = 'guide-tab';
            tabButton.dataset.tab = tab.id;
            tabButton.innerHTML = `${tab.icon} ${tab.name}`;
            tabButton.onclick = () => this.showContent(tab.id);
            sidebar.appendChild(tabButton);
        });
        
        return sidebar;
    }
    
    addStyles() {
        if (document.querySelector('#game-guide-styles')) return;
        
        const style = document.createElement('style');
        style.id = 'game-guide-styles';
        style.textContent = `
            .guide-tab {
                display: block;
                width: 100%;
                padding: 15px 20px;
                background: none;
                border: none;
                border-bottom: 1px solid rgba(0, 100, 200, 0.3);
                color: white;
                font-size: 16px;
                text-align: left;
                cursor: pointer;
                transition: all 0.3s;
            }
            
            .guide-tab:hover {
                background: rgba(0, 100, 200, 0.3);
                padding-left: 30px;
            }
            
            .guide-tab.active {
                background: rgba(0, 150, 255, 0.4);
                border-left: 4px solid #00ffff;
                color: #00ffff;
            }
            
            .guide-content h3 {
                color: #00ffff;
                font-size: 24px;
                margin-bottom: 20px;
                text-shadow: 0 0 10px rgba(0, 255, 255, 0.5);
            }
            
            .guide-content h4 {
                color: #ffaa00;
                font-size: 18px;
                margin: 20px 0 10px 0;
            }
            
            .guide-content p {
                line-height: 1.6;
                margin-bottom: 15px;
                color: #ddd;
            }
            
            .guide-tip {
                background: rgba(0, 100, 200, 0.2);
                border-left: 4px solid #00ffff;
                padding: 15px;
                margin: 20px 0;
                border-radius: 5px;
            }
            
            .guide-warning {
                background: rgba(200, 100, 0, 0.2);
                border-left: 4px solid #ff8800;
                padding: 15px;
                margin: 20px 0;
                border-radius: 5px;
            }
            
            .guide-table {
                width: 100%;
                border-collapse: collapse;
                margin: 20px 0;
            }
            
            .guide-table th,
            .guide-table td {
                padding: 10px;
                border: 1px solid #0088ff;
                text-align: left;
            }
            
            .guide-table th {
                background: rgba(0, 100, 200, 0.3);
                color: #00ffff;
            }
            
            .key-binding {
                display: inline-block;
                background: #0088ff;
                padding: 3px 8px;
                border-radius: 3px;
                font-family: monospace;
                margin: 0 3px;
            }
        `;
        document.head.appendChild(style);
    }
    
    setupEventListeners() {
        // Gキーでガイドを開く
        document.addEventListener('keydown', (e) => {
            if (e.key === 'g' || e.key === 'G') {
                e.preventDefault();
                this.toggle();
            } else if (e.key === 'Escape' && this.isOpen) {
                e.preventDefault();
                this.close();
            }
        });
        
        // ガイドボタンを追加
        this.createGuideButton();
    }
    
    createGuideButton() {
        const button = document.createElement('button');
        button.id = 'guide-button';
        button.innerHTML = '📖 ガイド (G)';
        button.style.cssText = `
            position: fixed;
            top: 20px;
            left: 20px;
            padding: 10px 20px;
            background: linear-gradient(135deg, #004488, #0066cc);
            border: 2px solid #00aaff;
            color: white;
            cursor: pointer;
            border-radius: 5px;
            font-size: 16px;
            font-family: 'Orbitron', monospace;
            z-index: 999;
            transition: all 0.3s;
        `;
        
        button.onmouseover = () => {
            button.style.background = 'linear-gradient(135deg, #0066cc, #0088ff)';
            button.style.transform = 'scale(1.05)';
        };
        
        button.onmouseout = () => {
            button.style.background = 'linear-gradient(135deg, #004488, #0066cc)';
            button.style.transform = 'scale(1)';
        };
        
        button.onclick = () => this.toggle();
        
        document.body.appendChild(button);
    }
    
    showContent(tabId) {
        this.currentTab = tabId;
        
        // タブのアクティブ状態を更新
        document.querySelectorAll('.guide-tab').forEach(tab => {
            if (tab.dataset.tab === tabId) {
                tab.classList.add('active');
            } else {
                tab.classList.remove('active');
            }
        });
        
        // コンテンツを表示
        this.contentArea.innerHTML = this.getContent(tabId);
        this.contentArea.scrollTop = 0;
        
        // セーブ・ロードボタンのイベントリスナーを設定
        if (tabId === 'save') {
            const saveButton = document.getElementById('open-save-menu');
            const loadButton = document.getElementById('open-load-menu');
            
            if (saveButton) {
                saveButton.onclick = () => {
                    this.game.saveSystem?.showSaveMenu();
                };
            }
            
            if (loadButton) {
                loadButton.onclick = () => {
                    this.game.saveSystem?.showLoadMenu();
                };
            }
        }
    }
    
    getContent(tabId) {
        const contents = {
            basics: `
                <div class="guide-content">
                    <h3>🎯 基本操作</h3>
                    
                    <h4>移動操作</h4>
                    <table class="guide-table">
                        <tr><th>キー</th><th>操作</th></tr>
                        <tr><td><span class="key-binding">W</span></td><td>前進</td></tr>
                        <tr><td><span class="key-binding">S</span></td><td>後退</td></tr>
                        <tr><td><span class="key-binding">A</span></td><td>左移動</td></tr>
                        <tr><td><span class="key-binding">D</span></td><td>右移動</td></tr>
                        <tr><td><span class="key-binding">Shift</span></td><td>ブースト（速度2倍）</td></tr>
                        <tr><td><span class="key-binding">Q</span>/<span class="key-binding">E</span></td><td>ロール回転</td></tr>
                    </table>
                    
                    <h4>戦闘操作</h4>
                    <table class="guide-table">
                        <tr><th>キー</th><th>操作</th></tr>
                        <tr><td><span class="key-binding">Space</span> / 左クリック</td><td>射撃</td></tr>
                        <tr><td>マウス移動</td><td>照準操作</td></tr>
                    </table>
                    
                    <h4>システム操作</h4>
                    <table class="guide-table">
                        <tr><th>キー</th><th>操作</th></tr>
                        <tr><td><span class="key-binding">H</span></td><td>ヘルプ表示</td></tr>
                        <tr><td><span class="key-binding">I</span></td><td>インベントリ</td></tr>
                        <tr><td><span class="key-binding">G</span></td><td>このガイド</td></tr>
                        <tr><td><span class="key-binding">M</span></td><td>銀河マップ / ワープ</td></tr>
                        <tr><td><span class="key-binding">E</span></td><td>惑星/ステーションに着陸</td></tr>
                        <tr><td><span class="key-binding">F</span></td><td>ステーション/ワープゲートとインタラクト</td></tr>
                        <tr><td><span class="key-binding">S</span></td><td>Deep Spaceスキャン</td></tr>
                    </table>
                    
                    <h4>ルナ（相棒）との交流</h4>
                    <p>ルナは宇宙ステーションの酒場で出会うことができます。</p>
                    <table class="guide-table">
                        <tr><th>キー</th><th>操作</th><th>条件</th></tr>
                        <tr><td><span class="key-binding">C</span></td><td>会話メニュー</td><td>ルナが仲間になった後</td></tr>
                        <tr><td><span class="key-binding">P</span></td><td>プレゼントメニュー</td><td>ルナが仲間になった後</td></tr>
                    </table>
                    
                    <div class="guide-tip">
                        💡 ヒント: ルナと出会うには、宇宙ステーション（🛸）に着陸（Eキー）して「酒場で情報収集」を選択しましょう！<br>
                        初回訪問時に特別なイベントが発生します。
                    </div>
                    
                    <div class="guide-tip">
                        💡 ヒント: ルナとの信頼度を上げると、特別な会話や援護攻撃が解放されます！
                    </div>
                    
                    <div class="guide-tip">
                        💡 ヒント: マウスでの照準が難しい場合は、感度を調整してみましょう！
                    </div>
                </div>
            `,
            
            economy: `
                <div class="guide-content">
                    <h3>💰 お金の稼ぎ方</h3>
                    
                    <h4>基本的な収入源</h4>
                    <p>クレジットはこのゲームの通貨です。以下の方法で獲得できます：</p>
                    
                    <h4>1. 敵を倒す</h4>
                    <p>• 通常の敵: <strong>50クレジット</strong></p>
                    <p>• 速い敵（オレンジ）: <strong>75クレジット</strong></p>
                    <p>• 強い敵（ピンク）: <strong>150クレジット</strong></p>
                    
                    <div class="guide-tip">
                        💡 敵を倒すとスコアの50%がクレジットとして獲得できます！
                    </div>
                    
                    <h4>2. ミッション報酬</h4>
                    <p>• 簡単なミッション: 500～1,000クレジット</p>
                    <p>• 中級ミッション: 2,000～5,000クレジット</p>
                    <p>• 高難度ミッション: 10,000クレジット以上</p>
                    
                    <h4>3. 探索と発見</h4>
                    <p>• 新しい惑星の発見: 1,000～10,000クレジット</p>
                    <p>• 宝箱の発見: ランダムな金額</p>
                    <p>• イベント報酬: 様々</p>
                    
                    <h4>4. 採掘（将来実装）</h4>
                    <p>小惑星や惑星で資源を採掘して売却できます。</p>
                    
                    <div class="guide-warning">
                        ⚠️ 注意: 死亡するとクレジットの一部を失う可能性があります！
                    </div>
                    
                    <h4>効率的な稼ぎ方</h4>
                    <p>1. <strong>コンボを維持</strong>: 連続で敵を倒すとボーナスが増える</p>
                    <p>2. <strong>ウェーブクリア</strong>: 全ての敵を倒すとボーナス</p>
                    <p>3. <strong>高難度エリア</strong>: リスクは高いが報酬も多い</p>
                </div>
            `,
            
            combat: `
                <div class="guide-content">
                    <h3>⚔️ 戦闘のコツ</h3>
                    
                    <h4>基本戦術</h4>
                    <p>1. <strong>移動し続ける</strong>: 止まっているとターゲットになりやすい</p>
                    <p>2. <strong>予測射撃</strong>: 敵の進行方向を予測して撃つ</p>
                    <p>3. <strong>距離を保つ</strong>: 近すぎると回避が困難</p>
                    
                    <h4>敵の種類と対処法</h4>
                    <div class="guide-tip">
                        <strong>通常の敵（青）</strong><br>
                        • 動きが遅い<br>
                        • 正面から攻撃可能<br>
                        • 集団で来ることが多い
                    </div>
                    
                    <div class="guide-tip">
                        <strong>高速の敵（オレンジ）</strong><br>
                        • 素早い動き<br>
                        • 側面から攻撃<br>
                        • 予測射撃が重要
                    </div>
                    
                    <div class="guide-tip">
                        <strong>重装甲の敵（ピンク）</strong><br>
                        • 高耐久力<br>
                        • 強力な武器が必要<br>
                        • 弱点を狙う
                    </div>
                    
                    <h4>戦闘テクニック</h4>
                    <p><strong>ブーストターン</strong>: Shift + 方向キーで急旋回</p>
                    <p><strong>ロール回避</strong>: Q/Eで弾を避ける</p>
                    <p><strong>バックダッシュ</strong>: S + Shiftで後方に急速離脱</p>
                    
                    <h4>武器の使い分け</h4>
                    <p>• レーザー: バランス型、初心者向け</p>
                    <p>• プラズマ: 高威力、低連射</p>
                    <p>• パルス: 高連射、低威力</p>
                    <p>• ミサイル: 追尾、弾数制限</p>
                </div>
            `,
            
            exploration: `
                <div class="guide-content">
                    <h3>🌌 探索ガイド</h3>
                    
                    <h4>Deep Spaceスキャン</h4>
                    <p><span class="key-binding">S</span>キーでスキャンを実行：</p>
                    <p>• 消費エネルギー: 100</p>
                    <p>• クールダウン: 5秒</p>
                    <p>• 発見率: 基本10% + スキャンボーナス30%</p>
                    
                    <h4>発見できるもの</h4>
                    <p>• 隠された惑星</p>
                    <p>• 廃墟・遺跡</p>
                    <p>• 宇宙船の残骸</p>
                    <p>• レアアイテム</p>
                    
                    <h4>エリアガイド</h4>
                    <div class="guide-tip">
                        <strong>地球エリア</strong><br>
                        • 初心者向け<br>
                        • 基本的な資源<br>
                        • 宇宙ステーション多数
                    </div>
                    
                    <div class="guide-tip">
                        <strong>火星エリア</strong><br>
                        • 中級者向け<br>
                        • 採掘可能な資源<br>
                        • 古代遺跡あり
                    </div>
                    
                    <div class="guide-tip">
                        <strong>木星エリア</strong><br>
                        • 上級者向け<br>
                        • 高価値資源<br>
                        • 危険な放射線帯
                    </div>
                    
                    <h4>探索のコツ</h4>
                    <p>1. ミニマップをよく確認</p>
                    <p>2. 未探索エリアを優先</p>
                    <p>3. 燃料と弾薬を管理</p>
                    <p>4. 定期的にセーブ</p>
                </div>
            `,
            
            equipment: `
                <div class="guide-content">
                    <h3>🔧 装備について</h3>
                    
                    <h4>装備スロット</h4>
                    <table class="guide-table">
                        <tr><th>スロット</th><th>効果</th></tr>
                        <tr><td>武器</td><td>攻撃力・連射速度</td></tr>
                        <tr><td>シールド</td><td>防御力・耐久力</td></tr>
                        <tr><td>エンジン</td><td>移動速度・加速</td></tr>
                        <tr><td>特殊装備</td><td>特殊能力</td></tr>
                    </table>
                    
                    <h4>装備の入手方法</h4>
                    <p>1. <strong>ショップで購入</strong>: 最も確実</p>
                    <p>2. <strong>敵からドロップ</strong>: ランダム</p>
                    <p>3. <strong>ミッション報酬</strong>: 高品質</p>
                    <p>4. <strong>探索で発見</strong>: レア装備</p>
                    
                    <h4>装備の管理</h4>
                    <p><span class="key-binding">I</span>キーでインベントリを開く</p>
                    <p>• アイテムをクリックで選択</p>
                    <p>• 「装備する」ボタンで装着</p>
                    <p>• 装備中のアイテムは左側に表示</p>
                    
                    <div class="guide-tip">
                        💡 ヒント: 状況に応じて装備を変更しましょう！<br>
                        強敵には高火力武器、大群には連射武器が有効です。
                    </div>
                    
                    <h4>おすすめ装備セット</h4>
                    <p><strong>初心者向け</strong>: レーザーMk.II + 基本シールド</p>
                    <p><strong>バランス型</strong>: プラズマ砲 + 強化シールド</p>
                    <p><strong>速度重視</strong>: パルスガン + ターボエンジン</p>
                </div>
            `,
            
            missions: `
                <div class="guide-content">
                    <h3>📋 ミッション</h3>
                    
                    <h4>ミッションの種類</h4>
                    <p><strong>メインミッション</strong>: ストーリー進行に必要</p>
                    <p><strong>サイドミッション</strong>: 追加報酬とストーリー</p>
                    <p><strong>デイリーミッション</strong>: 毎日更新される</p>
                    <p><strong>イベントミッション</strong>: 期間限定</p>
                    
                    <h4>ミッション確認方法</h4>
                    <p>• ステーションで話を聞く</p>
                    <p>• ミッションログを確認（実装予定）</p>
                    <p>• NPCと会話</p>
                    
                    <h4>報酬について</h4>
                    <table class="guide-table">
                        <tr><th>難易度</th><th>クレジット</th><th>経験値</th><th>アイテム</th></tr>
                        <tr><td>簡単</td><td>500-1,000</td><td>50-100</td><td>通常</td></tr>
                        <tr><td>普通</td><td>2,000-5,000</td><td>200-500</td><td>レア</td></tr>
                        <tr><td>困難</td><td>10,000+</td><td>1000+</td><td>エピック</td></tr>
                    </table>
                    
                    <div class="guide-warning">
                        ⚠️ 注意: 一部のミッションには時間制限があります！
                    </div>
                </div>
            `,
            
            save: `
                <div class="guide-content">
                    <h3>💾 セーブ・ロード</h3>
                    
                    <h4>セーブ機能</h4>
                    <p>ゲームの進行状況を保存して、後で続きから遊べます。</p>
                    
                    <h4>操作方法</h4>
                    <table class="guide-table">
                        <tr><th>操作</th><th>説明</th></tr>
                        <tr><td><span class="key-binding">Ctrl + S</span></td><td>クイックセーブ</td></tr>
                        <tr><td><span class="key-binding">Ctrl + L</span></td><td>ロードメニュー表示</td></tr>
                        <tr><td>自動セーブ</td><td>30秒間隔で自動保存</td></tr>
                    </table>
                    
                    <h4>保存される情報</h4>
                    <p>• プレイヤーの位置・レベル・装備</p>
                    <p>• クレジット・アイテム</p>
                    <p>• ミッション進行状況</p>
                    <p>• 発見済み惑星・エリア</p>
                    <p>• スキル・アップグレード</p>
                    <p>• 統計情報・実績</p>
                    
                    <div class="guide-tip">
                        💡 ヒント: 3つのセーブスロットがあります。<br>
                        異なる進行状況を複数保存できます！
                    </div>
                    
                    <h4>セーブメニューを開く</h4>
                    <div style="text-align: center; margin: 20px 0;">
                        <button id="open-save-menu" style="
                            padding: 10px 20px;
                            background: linear-gradient(135deg, #004488, #0066cc);
                            border: 2px solid #00aaff;
                            color: white;
                            cursor: pointer;
                            border-radius: 5px;
                            font-size: 16px;
                            margin: 0 10px;
                        ">セーブメニュー</button>
                        <button id="open-load-menu" style="
                            padding: 10px 20px;
                            background: linear-gradient(135deg, #446600, #66aa00);
                            border: 2px solid #88ff00;
                            color: white;
                            cursor: pointer;
                            border-radius: 5px;
                            font-size: 16px;
                            margin: 0 10px;
                        ">ロードメニュー</button>
                    </div>
                </div>
            `,
            
            tips: `
                <div class="guide-content">
                    <h3>💡 ヒント・小技</h3>
                    
                    <h4>戦闘のヒント</h4>
                    <p>• コンボを維持してスコアボーナスを獲得</p>
                    <p>• 小惑星を盾として使う</p>
                    <p>• 敵の攻撃パターンを覚える</p>
                    <p>• ブーストは緊急回避に温存</p>
                    
                    <h4>探索のヒント</h4>
                    <p>• ミニマップの端に注目（隠し要素）</p>
                    <p>• 同じ場所を何度もスキャン</p>
                    <p>• NPCの会話にヒントあり</p>
                    <p>• 惑星の裏側も確認</p>
                    
                    <h4>お金稼ぎのヒント</h4>
                    <p>• ウェーブ開始前に準備を整える</p>
                    <p>• 高難度エリアは報酬も多い</p>
                    <p>• アイテムは売却可能（実装予定）</p>
                    <p>• ミッションを同時進行</p>
                    
                    <h4>知っておくと便利</h4>
                    <p>• ミニマップはマウスホイールで拡大縮小</p>
                    <p>• <span class="key-binding">+</span>/<span class="key-binding">-</span>でも操作可能</p>
                    <p>• ステーション内は安全地帯</p>
                    <p>• 30秒間隔で自動セーブ実行中</p>
                    
                    <div class="guide-tip">
                        🎮 プロのヒント: 敵の弾は実体があるので、<br>
                        小惑星や他の敵を盾にして防げます！
                    </div>
                </div>
            `
        };
        
        return contents[tabId] || '<p>コンテンツが見つかりません</p>';
    }
    
    open() {
        this.isOpen = true;
        this.container.style.display = 'block';
        this.game.isPaused = true;
    }
    
    close() {
        this.isOpen = false;
        this.container.style.display = 'none';
        this.game.isPaused = false;
    }
    
    toggle() {
        if (this.isOpen) {
            this.close();
        } else {
            this.open();
        }
    }
}