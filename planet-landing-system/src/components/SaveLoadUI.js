export class SaveLoadUI {
    constructor(game) {
        this.game = game;
        this.isOpen = false;
        this.currentTab = 'save'; // 'save' or 'load'
        
        this.createUI();
        this.setupEventListeners();
    }
    
    createUI() {
        // メインコンテナ
        this.container = document.createElement('div');
        this.container.id = 'save-load-ui';
        this.container.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 600px;
            max-height: 80vh;
            background: linear-gradient(135deg, #1a1a2e 0%, #0f0f1e 100%);
            border: 2px solid #0ff;
            border-radius: 10px;
            padding: 20px;
            display: none;
            z-index: 1000;
            box-shadow: 0 0 30px rgba(0, 255, 255, 0.5);
            overflow-y: auto;
            pointer-events: auto;
        `;
        
        // ヘッダー
        const header = document.createElement('div');
        header.style.cssText = `
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 20px;
        `;
        
        const title = document.createElement('h2');
        title.style.cssText = `
            color: #0ff;
            margin: 0;
            font-size: 24px;
            text-shadow: 0 0 10px rgba(0, 255, 255, 0.5);
        `;
        title.textContent = 'セーブ / ロード';
        
        const closeBtn = document.createElement('button');
        closeBtn.style.cssText = `
            background: none;
            border: 1px solid #ff0;
            color: #ff0;
            padding: 5px 15px;
            border-radius: 5px;
            cursor: pointer;
            font-size: 16px;
            transition: all 0.3s ease;
        `;
        closeBtn.textContent = '✕';
        closeBtn.onclick = () => this.close();
        
        header.appendChild(title);
        header.appendChild(closeBtn);
        
        // タブ
        const tabs = document.createElement('div');
        tabs.style.cssText = `
            display: flex;
            gap: 10px;
            margin-bottom: 20px;
        `;
        
        this.saveTab = this.createTab('セーブ', 'save');
        this.loadTab = this.createTab('ロード', 'load');
        
        tabs.appendChild(this.saveTab);
        tabs.appendChild(this.loadTab);
        
        // スロットリスト
        this.slotList = document.createElement('div');
        this.slotList.style.cssText = `
            display: grid;
            gap: 10px;
        `;
        
        // ボタンコンテナ
        const buttonContainer = document.createElement('div');
        buttonContainer.style.cssText = `
            display: flex;
            gap: 10px;
            margin-top: 20px;
            justify-content: center;
        `;
        
        // エクスポート/インポートボタン
        const exportBtn = this.createButton('エクスポート', () => this.exportSave());
        const importBtn = this.createButton('インポート', () => this.importSave());
        
        buttonContainer.appendChild(exportBtn);
        buttonContainer.appendChild(importBtn);
        
        // 組み立て
        this.container.appendChild(header);
        this.container.appendChild(tabs);
        this.container.appendChild(this.slotList);
        this.container.appendChild(buttonContainer);
        
        // bodyに直接追加（planet-uiはpointer-events: noneのため）
        document.body.appendChild(this.container);
        
        // 初期表示
        this.updateSlotList();
    }
    
    createTab(text, type) {
        const tab = document.createElement('button');
        tab.style.cssText = `
            flex: 1;
            padding: 10px;
            background: ${type === this.currentTab ? '#0ff' : 'transparent'};
            color: ${type === this.currentTab ? '#000' : '#fff'};
            border: 1px solid #0ff;
            border-radius: 5px;
            cursor: pointer;
            font-size: 16px;
            font-weight: bold;
            transition: all 0.3s ease;
        `;
        tab.textContent = text;
        tab.onclick = () => this.switchTab(type);
        
        return tab;
    }
    
    createButton(text, onClick) {
        const button = document.createElement('button');
        button.style.cssText = `
            padding: 10px 20px;
            background: linear-gradient(135deg, #4a90e2, #357abd);
            color: white;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            font-size: 14px;
            font-weight: bold;
            transition: all 0.3s ease;
        `;
        button.textContent = text;
        button.onclick = onClick;
        
        button.onmouseover = () => {
            button.style.transform = 'scale(1.05)';
            button.style.boxShadow = '0 4px 15px rgba(74, 144, 226, 0.5)';
        };
        button.onmouseout = () => {
            button.style.transform = 'scale(1)';
            button.style.boxShadow = 'none';
        };
        
        return button;
    }
    
    switchTab(type) {
        this.currentTab = type;
        
        // タブの見た目を更新
        this.saveTab.style.background = type === 'save' ? '#0ff' : 'transparent';
        this.saveTab.style.color = type === 'save' ? '#000' : '#fff';
        this.loadTab.style.background = type === 'load' ? '#0ff' : 'transparent';
        this.loadTab.style.color = type === 'load' ? '#000' : '#fff';
        
        // スロットリストを更新
        this.updateSlotList();
    }
    
    updateSlotList() {
        this.slotList.innerHTML = '';
        
        const saveInfo = this.game.systems.saveLoad?.getSaveInfo() || {};
        
        // 10個のスロットを表示
        for (let i = 0; i < 10; i++) {
            const slot = this.createSlot(i, saveInfo[i]);
            this.slotList.appendChild(slot);
        }
    }
    
    createSlot(index, info) {
        const slot = document.createElement('div');
        slot.style.cssText = `
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 15px;
            background: ${info ? 'rgba(0, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.05)'};
            border: 1px solid ${info ? '#0ff' : '#666'};
            border-radius: 5px;
            cursor: pointer;
            transition: all 0.3s ease;
        `;
        
        const slotInfo = document.createElement('div');
        slotInfo.style.cssText = `
            flex: 1;
            color: #fff;
        `;
        
        const slotName = document.createElement('div');
        slotName.style.cssText = `
            font-weight: bold;
            margin-bottom: 5px;
        `;
        slotName.textContent = `スロット ${index + 1}`;
        
        if (index === 8) slotName.textContent += ' (クイックセーブ)';
        if (index === 9) slotName.textContent += ' (自動セーブ)';
        
        const slotDetails = document.createElement('div');
        slotDetails.style.cssText = `
            font-size: 12px;
            color: #aaa;
        `;
        
        if (info) {
            const date = new Date(info.timestamp);
            slotDetails.innerHTML = `
                ${date.toLocaleString()}<br>
                惑星: ${info.planetId} | 開発レベル: ${info.developmentLevel} | クレジット: ${info.credits}
            `;
        } else {
            slotDetails.textContent = '空のスロット';
        }
        
        slotInfo.appendChild(slotName);
        slotInfo.appendChild(slotDetails);
        
        // アクションボタン
        const actions = document.createElement('div');
        actions.style.cssText = `
            display: flex;
            gap: 10px;
        `;
        
        if (this.currentTab === 'save') {
            const saveBtn = this.createActionButton('セーブ', '#4a90e2', () => {
                this.game.systems.saveLoad?.save(index);
                this.updateSlotList();
            });
            actions.appendChild(saveBtn);
        } else {
            if (info) {
                const loadBtn = this.createActionButton('ロード', '#4ae24a', () => {
                    this.game.systems.saveLoad?.load(index);
                    this.close();
                });
                actions.appendChild(loadBtn);
            }
        }
        
        if (info && index < 8) { // クイック/自動セーブは削除不可
            const deleteBtn = this.createActionButton('削除', '#e24a4a', () => {
                if (confirm('このセーブデータを削除しますか？')) {
                    this.game.systems.saveLoad?.deleteSave(index);
                    this.updateSlotList();
                }
            });
            actions.appendChild(deleteBtn);
        }
        
        slot.appendChild(slotInfo);
        slot.appendChild(actions);
        
        slot.onmouseover = () => {
            slot.style.background = info ? 'rgba(0, 255, 255, 0.2)' : 'rgba(255, 255, 255, 0.1)';
            slot.style.transform = 'scale(1.02)';
        };
        slot.onmouseout = () => {
            slot.style.background = info ? 'rgba(0, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.05)';
            slot.style.transform = 'scale(1)';
        };
        
        return slot;
    }
    
    createActionButton(text, color, onClick) {
        const button = document.createElement('button');
        button.style.cssText = `
            padding: 5px 15px;
            background: ${color};
            color: white;
            border: none;
            border-radius: 3px;
            cursor: pointer;
            font-size: 12px;
            transition: all 0.3s ease;
        `;
        button.textContent = text;
        button.onclick = (e) => {
            e.stopPropagation();
            onClick();
        };
        
        return button;
    }
    
    exportSave() {
        const select = document.createElement('select');
        select.style.cssText = `
            padding: 5px;
            margin: 10px;
            background: #222;
            color: #fff;
            border: 1px solid #0ff;
            border-radius: 3px;
        `;
        
        for (let i = 0; i < 10; i++) {
            const option = document.createElement('option');
            option.value = i;
            option.textContent = `スロット ${i + 1}`;
            select.appendChild(option);
        }
        
        const dialog = confirm('どのスロットをエクスポートしますか？');
        if (dialog) {
            this.game.systems.saveLoad?.exportSave(0);
        }
    }
    
    importSave() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.onchange = async (e) => {
            const file = e.target.files[0];
            if (file) {
                await this.game.systems.saveLoad?.importSave(file, 0);
                this.updateSlotList();
            }
        };
        input.click();
    }
    
    setupEventListeners() {
        // ESCキーで閉じる
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isOpen) {
                this.close();
            }
        });
        
        // F5でクイックセーブ、F9でクイックロード
        document.addEventListener('keydown', (e) => {
            if (e.key === 'F5') {
                e.preventDefault();
                this.game.systems.saveLoad?.quickSave();
            } else if (e.key === 'F9') {
                e.preventDefault();
                this.game.systems.saveLoad?.quickLoad();
            }
        });
    }
    
    open() {
        this.isOpen = true;
        this.container.style.display = 'block';
        this.updateSlotList();
        
        // ゲームを一時停止
        if (this.game.systems.saveLoad) {
            this.game.systems.saveLoad.stopAutoSave();
        }
    }
    
    close() {
        this.isOpen = false;
        this.container.style.display = 'none';
        
        // 自動セーブを再開
        if (this.game.systems.saveLoad) {
            this.game.systems.saveLoad.startAutoSave();
        }
    }
    
    toggle() {
        if (this.isOpen) {
            this.close();
        } else {
            this.open();
        }
    }
}