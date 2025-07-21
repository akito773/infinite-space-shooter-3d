export class SaveLoadSystem {
    constructor(game) {
        this.game = game;
        this.storageKey = 'planet-landing-save';
        this.autoSaveInterval = 60000; // 60秒ごとに自動セーブ
        this.autoSaveTimer = null;
        
        this.init();
    }
    
    init() {
        // 自動セーブの開始
        this.startAutoSave();
        
        // ページを離れる前に保存
        window.addEventListener('beforeunload', () => {
            this.quickSave();
        });
    }
    
    startAutoSave() {
        this.autoSaveTimer = setInterval(() => {
            this.autoSave();
        }, this.autoSaveInterval);
    }
    
    stopAutoSave() {
        if (this.autoSaveTimer) {
            clearInterval(this.autoSaveTimer);
            this.autoSaveTimer = null;
        }
    }
    
    // セーブデータの作成
    createSaveData() {
        const saveData = {
            version: '1.0.0',
            timestamp: Date.now(),
            planetId: this.game.planetData?.planetData?.id || 'unknown',
            playerData: {
                credits: this.game.systems.resource?.resources.credits || 0,
                position: this.game.systems.exploration?.getPlayerPosition() || { x: 0, y: 0, z: 0 }
            },
            resources: this.game.systems.resource?.serialize() || {},
            buildings: this.game.systems.building?.serialize() || [],
            progress: this.game.systems.progress?.serialize() || {},
            resourceNodes: this.game.systems.resourceNode?.serialize() || {},
            exploration: {
                exploredAreas: this.game.systems.exploration?.exploredAreas || [],
                currentScene: this.game.currentScene || 'surface'
            }
        };
        
        return saveData;
    }
    
    // セーブ
    save(slot = 0) {
        try {
            const saveData = this.createSaveData();
            const key = `${this.storageKey}_${slot}`;
            
            // データを圧縮（簡易的）
            const compressed = this.compressData(saveData);
            localStorage.setItem(key, compressed);
            
            // セーブ情報を更新
            this.updateSaveInfo(slot);
            
            console.log(`セーブ完了 (スロット ${slot})`);
            this.game.showMessage(`セーブしました (スロット ${slot + 1})`, 'success');
            
            return true;
        } catch (error) {
            console.error('セーブエラー:', error);
            this.game.showMessage('セーブに失敗しました', 'error');
            return false;
        }
    }
    
    // ロード
    load(slot = 0) {
        try {
            const key = `${this.storageKey}_${slot}`;
            const compressed = localStorage.getItem(key);
            
            if (!compressed) {
                this.game.showMessage('セーブデータが見つかりません', 'error');
                return false;
            }
            
            // データを解凍
            const saveData = this.decompressData(compressed);
            
            // バージョンチェック
            if (!this.isCompatibleVersion(saveData.version)) {
                this.game.showMessage('セーブデータのバージョンが古いです', 'warning');
                return false;
            }
            
            // データを復元
            this.restoreData(saveData);
            
            console.log(`ロード完了 (スロット ${slot})`);
            this.game.showMessage(`ロードしました (スロット ${slot + 1})`, 'success');
            
            return true;
        } catch (error) {
            console.error('ロードエラー:', error);
            this.game.showMessage('ロードに失敗しました', 'error');
            return false;
        }
    }
    
    // データの復元
    restoreData(saveData) {
        // リソースの復元
        if (saveData.resources && this.game.systems.resource) {
            this.game.systems.resource.deserialize(saveData.resources);
        }
        
        // 建物の復元
        if (saveData.buildings && this.game.systems.building) {
            this.game.systems.building.deserialize(saveData.buildings);
        }
        
        // 進行状況の復元
        if (saveData.progress && this.game.systems.progress) {
            this.game.systems.progress.deserialize(saveData.progress);
        }
        
        // 資源ノードの復元
        if (saveData.resourceNodes && this.game.systems.resourceNode) {
            this.game.systems.resourceNode.deserialize(saveData.resourceNodes);
        }
        
        // 探索データの復元
        if (saveData.exploration) {
            if (this.game.systems.exploration && saveData.exploration.exploredAreas) {
                // exploredAreasが配列であることを確認
                if (Array.isArray(saveData.exploration.exploredAreas)) {
                    this.game.systems.exploration.exploredAreas = new Set(saveData.exploration.exploredAreas);
                } else {
                    console.warn('exploredAreas is not an array, initializing empty Set');
                    this.game.systems.exploration.exploredAreas = new Set();
                }
            }
            
            // シーンの復元
            if (saveData.exploration.currentScene === 'underground' && this.game.currentScene === 'surface') {
                this.game.enterUnderground();
            }
        }
        
        // プレイヤー位置の復元
        if (saveData.playerData?.position && this.game.systems.exploration) {
            this.game.systems.exploration.setPlayerPosition(saveData.playerData.position);
        }
    }
    
    // 自動セーブ
    autoSave() {
        this.save(9); // スロット9は自動セーブ用
        console.log('自動セーブ完了');
    }
    
    // クイックセーブ
    quickSave() {
        this.save(8); // スロット8はクイックセーブ用
    }
    
    // クイックロード
    quickLoad() {
        this.load(8);
    }
    
    // セーブ情報の更新
    updateSaveInfo(slot) {
        const info = {
            slot: slot,
            timestamp: Date.now(),
            planetId: this.game.planetData?.planetData?.id || 'unknown',
            developmentLevel: this.game.systems.building?.buildings.size || 0,
            credits: this.game.systems.resource?.resources.credits || 0
        };
        
        const infoKey = `${this.storageKey}_info`;
        const allInfo = JSON.parse(localStorage.getItem(infoKey) || '{}');
        allInfo[slot] = info;
        localStorage.setItem(infoKey, JSON.stringify(allInfo));
    }
    
    // セーブ情報の取得
    getSaveInfo() {
        const infoKey = `${this.storageKey}_info`;
        return JSON.parse(localStorage.getItem(infoKey) || '{}');
    }
    
    // セーブデータの削除
    deleteSave(slot) {
        const key = `${this.storageKey}_${slot}`;
        localStorage.removeItem(key);
        
        // セーブ情報も削除
        const infoKey = `${this.storageKey}_info`;
        const allInfo = JSON.parse(localStorage.getItem(infoKey) || '{}');
        delete allInfo[slot];
        localStorage.setItem(infoKey, JSON.stringify(allInfo));
        
        console.log(`セーブデータ削除 (スロット ${slot})`);
        this.game.showMessage(`セーブデータを削除しました (スロット ${slot + 1})`, 'info');
    }
    
    // 全セーブデータの削除
    deleteAllSaves() {
        for (let i = 0; i < 10; i++) {
            const key = `${this.storageKey}_${i}`;
            localStorage.removeItem(key);
        }
        
        const infoKey = `${this.storageKey}_info`;
        localStorage.removeItem(infoKey);
        
        console.log('全セーブデータを削除');
        this.game.showMessage('全セーブデータを削除しました', 'info');
    }
    
    // データ圧縮（簡易的）
    compressData(data) {
        return JSON.stringify(data);
    }
    
    // データ解凍（簡易的）
    decompressData(compressed) {
        return JSON.parse(compressed);
    }
    
    // バージョン互換性チェック
    isCompatibleVersion(version) {
        const [major] = version.split('.');
        const [currentMajor] = '1.0.0'.split('.');
        return major === currentMajor;
    }
    
    // セーブデータのエクスポート
    exportSave(slot = 0) {
        const key = `${this.storageKey}_${slot}`;
        const data = localStorage.getItem(key);
        
        if (!data) {
            this.game.showMessage('エクスポートするデータがありません', 'error');
            return;
        }
        
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `planet-landing-save-${slot}-${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
        
        this.game.showMessage('セーブデータをエクスポートしました', 'success');
    }
    
    // セーブデータのインポート
    async importSave(file, slot = 0) {
        try {
            const text = await file.text();
            const key = `${this.storageKey}_${slot}`;
            localStorage.setItem(key, text);
            
            // セーブ情報を更新
            this.updateSaveInfo(slot);
            
            this.game.showMessage('セーブデータをインポートしました', 'success');
            return true;
        } catch (error) {
            console.error('インポートエラー:', error);
            this.game.showMessage('インポートに失敗しました', 'error');
            return false;
        }
    }
}