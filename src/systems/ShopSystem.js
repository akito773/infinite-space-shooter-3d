export class ShopSystem {
    constructor(game, inventory) {
        this.game = game;
        this.inventory = inventory;
        this.isOpen = false;
        this.selectedCategory = 'weapons';
        this.selectedItemIndex = 0;
        
        this.shopData = this.loadShopData();
        this.createUI();
        this.setupEventListeners();
    }
    
    loadShopData() {
        return {
            weapons: [
                {
                    id: 'laser_mk2',
                    name: 'レーザーMk.II',
                    type: 'weapon',
                    slot: 'weapon',
                    price: 2500,
                    damage: 15,
                    fireRate: 90,
                    description: '改良型レーザー砲。威力と連射性能が向上',
                    icon: '🔫'
                },
                {
                    id: 'plasma_cannon',
                    name: 'プラズマキャノン',
                    type: 'weapon',
                    slot: 'weapon',
                    price: 5000,
                    damage: 30,
                    fireRate: 200,
                    description: '高威力のプラズマ弾を発射。範囲攻撃可能',
                    icon: '💥'
                },
                {
                    id: 'missile_launcher',
                    name: 'ミサイルランチャー',
                    type: 'weapon',
                    slot: 'weapon',
                    price: 7500,
                    damage: 50,
                    fireRate: 500,
                    description: '追尾ミサイルを発射。確実に敵を撃墜',
                    icon: '🚀'
                }
            ],
            shields: [
                {
                    id: 'shield_basic',
                    name: 'ベーシックシールド',
                    type: 'shield',
                    slot: 'shield',
                    price: 3000,
                    defense: 50,
                    recharge: 5,
                    description: '基本的なエネルギーシールド',
                    icon: '🛡️'
                },
                {
                    id: 'shield_advanced',
                    name: 'アドバンスドシールド',
                    type: 'shield',
                    slot: 'shield',
                    price: 8000,
                    defense: 100,
                    recharge: 10,
                    description: '高性能シールド。自動回復機能付き',
                    icon: '🔰'
                }
            ],
            items: [
                {
                    id: 'repair_kit',
                    name: '修理キット',
                    type: 'consumable',
                    price: 500,
                    effect: 'heal',
                    value: 50,
                    description: '機体のHPを50回復',
                    icon: '🔧'
                },
                {
                    id: 'energy_cell',
                    name: 'エネルギーセル',
                    type: 'consumable',
                    price: 300,
                    effect: 'energy',
                    value: 100,
                    description: 'エネルギーを補充',
                    icon: '🔋'
                },
                {
                    id: 'boost_module',
                    name: 'ブーストモジュール',
                    type: 'upgrade',
                    slot: 'engine',
                    price: 4000,
                    speedBonus: 1.5,
                    description: '移動速度を50%向上',
                    icon: '⚡'
                }
            ]
        };
    }
    
    createUI() {
        // ショップコンテナ
        this.shopContainer = document.createElement('div');
        this.shopContainer.id = 'shop-container';
        this.shopContainer.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 20, 0.95);
            display: none;
            z-index: 2500;
        `;
        
        // ショップウィンドウ
        const shopWindow = document.createElement('div');
        shopWindow.style.cssText = `
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 90%;
            max-width: 1000px;
            height: 80%;
            background: url(./images/locations/shop.png), linear-gradient(to bottom, rgba(0, 20, 40, 0.98), rgba(0, 30, 60, 0.98));
            background-size: cover;
            background-position: center;
            background-blend-mode: multiply;
            border: 2px solid rgba(0, 200, 255, 0.8);
            border-radius: 20px;
            display: flex;
            flex-direction: column;
            overflow: hidden;
        `;
        
        // ヘッダー
        const header = document.createElement('div');
        header.style.cssText = `
            padding: 20px;
            border-bottom: 1px solid rgba(0, 200, 255, 0.3);
            display: flex;
            justify-content: space-between;
            align-items: center;
        `;
        
        const title = document.createElement('h2');
        title.style.cssText = `
            color: #00ffff;
            margin: 0;
            font-size: 32px;
            text-shadow: 0 0 20px rgba(0, 255, 255, 0.5);
        `;
        title.textContent = '🛒 ショップ';
        
        this.creditsDisplay = document.createElement('div');
        this.creditsDisplay.style.cssText = `
            color: #ffaa00;
            font-size: 24px;
            font-weight: bold;
        `;
        
        header.appendChild(title);
        header.appendChild(this.creditsDisplay);
        
        // メインコンテンツ
        const mainContent = document.createElement('div');
        mainContent.style.cssText = `
            flex: 1;
            display: flex;
            padding: 20px;
            gap: 20px;
            overflow: hidden;
        `;
        
        // カテゴリー選択
        this.categoryList = document.createElement('div');
        this.categoryList.style.cssText = `
            width: 200px;
            display: flex;
            flex-direction: column;
            gap: 10px;
        `;
        
        const categories = [
            { key: 'weapons', label: '武器', icon: '⚔️' },
            { key: 'shields', label: 'シールド', icon: '🛡️' },
            { key: 'items', label: 'アイテム', icon: '📦' }
        ];
        
        categories.forEach(cat => {
            const button = document.createElement('button');
            button.className = 'category-button';
            button.dataset.category = cat.key;
            button.style.cssText = `
                background: rgba(0, 50, 100, 0.5);
                border: 1px solid rgba(0, 150, 255, 0.5);
                color: white;
                padding: 15px;
                font-size: 18px;
                cursor: pointer;
                transition: all 0.2s;
                text-align: left;
            `;
            button.innerHTML = `${cat.icon} ${cat.label}`;
            button.addEventListener('click', () => this.selectCategory(cat.key));
            this.categoryList.appendChild(button);
        });
        
        // アイテムリスト
        this.itemListContainer = document.createElement('div');
        this.itemListContainer.style.cssText = `
            flex: 1;
            overflow-y: auto;
            padding-right: 10px;
        `;
        
        // アイテム詳細
        this.itemDetail = document.createElement('div');
        this.itemDetail.style.cssText = `
            width: 300px;
            background: rgba(0, 30, 60, 0.5);
            border: 1px solid rgba(0, 150, 255, 0.3);
            border-radius: 10px;
            padding: 20px;
        `;
        
        // 購入ボタン
        this.buyButton = document.createElement('button');
        this.buyButton.style.cssText = `
            width: 100%;
            background: #00ff00;
            color: black;
            border: none;
            border-radius: 5px;
            padding: 15px;
            font-size: 20px;
            font-weight: bold;
            cursor: pointer;
            margin-top: 20px;
            transition: all 0.2s;
        `;
        this.buyButton.textContent = '購入';
        this.buyButton.addEventListener('click', () => this.purchaseSelectedItem());
        
        // 閉じるボタン
        const closeButton = document.createElement('button');
        closeButton.style.cssText = `
            position: absolute;
            top: 20px;
            right: 20px;
            background: #ff0000;
            color: white;
            border: none;
            border-radius: 50%;
            width: 40px;
            height: 40px;
            font-size: 24px;
            cursor: pointer;
            transition: all 0.2s;
        `;
        closeButton.textContent = '×';
        closeButton.addEventListener('click', () => this.close());
        
        // スタイル追加
        if (!document.querySelector('#shop-styles')) {
            const style = document.createElement('style');
            style.id = 'shop-styles';
            style.textContent = `
                .category-button.selected {
                    background: rgba(0, 100, 200, 0.8) !important;
                    border-color: rgba(0, 255, 255, 1) !important;
                    transform: translateX(10px);
                }
                
                .shop-item {
                    background: rgba(0, 40, 80, 0.5);
                    border: 1px solid rgba(0, 100, 200, 0.5);
                    border-radius: 10px;
                    padding: 15px;
                    margin-bottom: 10px;
                    cursor: pointer;
                    transition: all 0.2s;
                    display: flex;
                    align-items: center;
                    gap: 15px;
                }
                
                .shop-item:hover, .shop-item.selected {
                    background: rgba(0, 60, 120, 0.8);
                    border-color: rgba(0, 200, 255, 1);
                    transform: translateX(5px);
                }
                
                .shop-item-icon {
                    font-size: 36px;
                }
                
                .shop-item-info {
                    flex: 1;
                }
                
                .shop-item-name {
                    color: #00ffff;
                    font-size: 18px;
                    font-weight: bold;
                    margin-bottom: 5px;
                }
                
                .shop-item-price {
                    color: #ffaa00;
                    font-size: 16px;
                }
                
                .shop-item-owned {
                    background: #00ff00;
                    color: black;
                    padding: 2px 8px;
                    border-radius: 10px;
                    font-size: 12px;
                    font-weight: bold;
                }
                
                #shop-container::-webkit-scrollbar {
                    width: 10px;
                }
                
                #shop-container::-webkit-scrollbar-track {
                    background: rgba(0, 20, 40, 0.5);
                }
                
                #shop-container::-webkit-scrollbar-thumb {
                    background: rgba(0, 100, 200, 0.8);
                    border-radius: 5px;
                }
            `;
            document.head.appendChild(style);
        }
        
        // 要素を組み立て
        mainContent.appendChild(this.categoryList);
        mainContent.appendChild(this.itemListContainer);
        mainContent.appendChild(this.itemDetail);
        
        shopWindow.appendChild(header);
        shopWindow.appendChild(mainContent);
        shopWindow.appendChild(closeButton);
        
        this.shopContainer.appendChild(shopWindow);
        document.body.appendChild(this.shopContainer);
        
        // 初期表示
        this.updateCreditsDisplay();
        this.selectCategory('weapons');
    }
    
    setupEventListeners() {
        // ESCキーで閉じる
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isOpen) {
                this.close();
            }
        });
    }
    
    open() {
        this.isOpen = true;
        this.game.isPaused = true;
        this.shopContainer.style.display = 'block';
        
        // フェードイン
        this.shopContainer.style.opacity = '0';
        setTimeout(() => {
            this.shopContainer.style.transition = 'opacity 0.3s';
            this.shopContainer.style.opacity = '1';
        }, 10);
        
        this.updateCreditsDisplay();
        this.refreshItemList();
    }
    
    close() {
        this.isOpen = false;
        this.game.isPaused = false;
        
        // フェードアウト
        this.shopContainer.style.opacity = '0';
        setTimeout(() => {
            this.shopContainer.style.display = 'none';
            this.shopContainer.style.transition = '';
        }, 300);
    }
    
    selectCategory(category) {
        this.selectedCategory = category;
        this.selectedItemIndex = 0;
        
        // カテゴリーボタンの選択状態を更新
        this.categoryList.querySelectorAll('.category-button').forEach(btn => {
            if (btn.dataset.category === category) {
                btn.classList.add('selected');
            } else {
                btn.classList.remove('selected');
            }
        });
        
        this.refreshItemList();
    }
    
    refreshItemList() {
        this.itemListContainer.innerHTML = '';
        const items = this.shopData[this.selectedCategory] || [];
        
        items.forEach((item, index) => {
            const itemElement = document.createElement('div');
            itemElement.className = 'shop-item';
            if (index === this.selectedItemIndex) {
                itemElement.classList.add('selected');
            }
            
            const owned = this.inventory.hasItem(item.id) || 
                         (this.inventory.equipment[item.slot] && 
                          this.inventory.equipment[item.slot].id === item.id);
            
            itemElement.innerHTML = `
                <div class="shop-item-icon">${item.icon}</div>
                <div class="shop-item-info">
                    <div class="shop-item-name">${item.name}</div>
                    <div class="shop-item-price">💰 ${item.price.toLocaleString()}</div>
                </div>
                ${owned ? '<div class="shop-item-owned">所持</div>' : ''}
            `;
            
            itemElement.addEventListener('click', () => {
                this.selectItem(index);
            });
            
            this.itemListContainer.appendChild(itemElement);
        });
        
        if (items.length > 0) {
            this.showItemDetail(items[this.selectedItemIndex]);
        }
    }
    
    selectItem(index) {
        this.selectedItemIndex = index;
        const items = this.shopData[this.selectedCategory] || [];
        
        // 選択状態を更新
        this.itemListContainer.querySelectorAll('.shop-item').forEach((el, i) => {
            if (i === index) {
                el.classList.add('selected');
            } else {
                el.classList.remove('selected');
            }
        });
        
        if (items[index]) {
            this.showItemDetail(items[index]);
        }
    }
    
    showItemDetail(item) {
        let detailHTML = `
            <h3 style="color: #00ffff; margin: 0 0 10px 0; font-size: 24px;">
                ${item.icon} ${item.name}
            </h3>
            <p style="color: #cccccc; margin: 10px 0; line-height: 1.5;">
                ${item.description}
            </p>
            <div style="margin: 20px 0; padding: 10px; background: rgba(0, 50, 100, 0.3); border-radius: 5px;">
        `;
        
        // アイテムタイプ別の詳細情報
        if (item.type === 'weapon') {
            detailHTML += `
                <div style="color: #ffaa00; margin: 5px 0;">⚔️ ダメージ: ${item.damage}</div>
                <div style="color: #00ff00; margin: 5px 0;">⚡ 連射速度: ${1000/item.fireRate}発/秒</div>
            `;
        } else if (item.type === 'shield') {
            detailHTML += `
                <div style="color: #00aaff; margin: 5px 0;">🛡️ 防御力: ${item.defense}</div>
                <div style="color: #00ff00; margin: 5px 0;">♻️ 回復速度: ${item.recharge}/秒</div>
            `;
        } else if (item.type === 'consumable') {
            detailHTML += `
                <div style="color: #00ff00; margin: 5px 0;">💊 効果値: ${item.value}</div>
            `;
        }
        
        detailHTML += `
            </div>
            <div style="text-align: center; font-size: 24px; color: #ffaa00; margin: 20px 0;">
                💰 ${item.price.toLocaleString()} クレジット
            </div>
        `;
        
        this.itemDetail.innerHTML = detailHTML;
        this.itemDetail.appendChild(this.buyButton);
        
        // 購入可能かチェック
        const canAfford = this.inventory.credits >= item.price;
        const alreadyOwned = this.inventory.hasItem(item.id) || 
                           (item.slot && this.inventory.equipment[item.slot]?.id === item.id);
        
        if (alreadyOwned) {
            this.buyButton.textContent = '所持済み';
            this.buyButton.style.background = '#666666';
            this.buyButton.style.cursor = 'not-allowed';
            this.buyButton.disabled = true;
        } else if (!canAfford) {
            this.buyButton.textContent = 'クレジット不足';
            this.buyButton.style.background = '#ff0000';
            this.buyButton.style.cursor = 'not-allowed';
            this.buyButton.disabled = true;
        } else {
            this.buyButton.textContent = '購入';
            this.buyButton.style.background = '#00ff00';
            this.buyButton.style.cursor = 'pointer';
            this.buyButton.disabled = false;
        }
    }
    
    purchaseSelectedItem() {
        const items = this.shopData[this.selectedCategory] || [];
        const item = items[this.selectedItemIndex];
        
        if (!item) return;
        
        if (this.inventory.spendCredits(item.price)) {
            // アイテムを追加
            this.inventory.addItem(item);
            
            // 効果音
            if (this.game.soundManager) {
                this.game.soundManager.play('powerup');
            }
            
            // メッセージ表示
            this.showPurchaseMessage(`${item.name}を購入しました！`);
            
            // 表示を更新
            this.updateCreditsDisplay();
            this.refreshItemList();
            this.showItemDetail(item);
        }
    }
    
    updateCreditsDisplay() {
        this.creditsDisplay.textContent = `💰 ${this.inventory.credits.toLocaleString()} クレジット`;
    }
    
    showPurchaseMessage(text) {
        const message = document.createElement('div');
        message.style.cssText = `
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(0, 255, 0, 0.9);
            color: black;
            padding: 20px 40px;
            border-radius: 10px;
            font-size: 24px;
            font-weight: bold;
            z-index: 3000;
            animation: purchasePopup 1.5s ease-out;
        `;
        message.textContent = text;
        
        if (!document.querySelector('#purchase-animation')) {
            const style = document.createElement('style');
            style.id = 'purchase-animation';
            style.textContent = `
                @keyframes purchasePopup {
                    0% {
                        transform: translate(-50%, -50%) scale(0.5);
                        opacity: 0;
                    }
                    50% {
                        transform: translate(-50%, -50%) scale(1.2);
                        opacity: 1;
                    }
                    100% {
                        transform: translate(-50%, -50%) scale(1);
                        opacity: 0;
                    }
                }
            `;
            document.head.appendChild(style);
        }
        
        this.shopContainer.appendChild(message);
        
        setTimeout(() => {
            message.remove();
        }, 1500);
    }
}