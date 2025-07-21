export class InventorySystem {
    constructor() {
        this.credits = 1000; // 初期所持金
        this.items = new Map();
        this.equipment = {
            weapon: null,
            shield: null,
            engine: null,
            special: null
        };
        
        // デフォルト装備
        this.initializeDefaultEquipment();
    }
    
    initializeDefaultEquipment() {
        // 初期武器
        this.equipment.weapon = {
            id: 'laser_mk1',
            name: 'レーザーMk.I',
            type: 'weapon',
            damage: 10,
            fireRate: 100,
            description: '標準的なレーザー砲'
        };
    }
    
    addCredits(amount) {
        this.credits += amount;
        this.onCreditsChange?.();
        return this.credits;
    }
    
    spendCredits(amount) {
        if (this.credits >= amount) {
            this.credits -= amount;
            this.onCreditsChange?.();
            return true;
        }
        return false;
    }
    
    addItem(item, quantity = 1) {
        if (!this.items.has(item.id)) {
            this.items.set(item.id, {
                ...item,
                quantity: 0
            });
        }
        
        const currentItem = this.items.get(item.id);
        currentItem.quantity += quantity;
        this.onInventoryChange?.();
    }
    
    removeItem(itemId, quantity = 1) {
        if (!this.items.has(itemId)) return false;
        
        const item = this.items.get(itemId);
        if (item.quantity >= quantity) {
            item.quantity -= quantity;
            if (item.quantity === 0) {
                this.items.delete(itemId);
            }
            this.onInventoryChange?.();
            return true;
        }
        return false;
    }
    
    equipItem(item) {
        if (item.slot && this.equipment.hasOwnProperty(item.slot)) {
            // 既存の装備をインベントリに戻す
            if (this.equipment[item.slot]) {
                this.addItem(this.equipment[item.slot]);
            }
            
            // 新しい装備を装着
            this.equipment[item.slot] = item;
            this.removeItem(item.id);
            this.onEquipmentChange?.();
            return true;
        }
        return false;
    }
    
    getItemCount(itemId) {
        const item = this.items.get(itemId);
        return item ? item.quantity : 0;
    }
    
    hasItem(itemId, quantity = 1) {
        return this.getItemCount(itemId) >= quantity;
    }
    
    // コールバック登録
    onCreditsChange = null;
    onInventoryChange = null;
    onEquipmentChange = null;
}