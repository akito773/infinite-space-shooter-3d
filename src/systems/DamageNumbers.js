import * as THREE from 'three';

export class DamageNumbers {
    constructor(scene, camera) {
        this.scene = scene;
        this.camera = camera;
        this.numbers = [];
        this.numberPool = [];
        this.maxNumbers = 50;
        
        // Canvas2Dを使用してテキストを描画
        this.initializeNumberPool();
    }
    
    initializeNumberPool() {
        // Canvas2Dを使った数字表示のプールを作成
        for (let i = 0; i < this.maxNumbers; i++) {
            const sprite = this.createDamageSprite('0');
            sprite.visible = false;
            this.scene.add(sprite);
            this.numberPool.push(sprite);
        }
    }
    
    createDamageSprite(text) {
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.width = 256;
        canvas.height = 128;
        
        // 背景をクリア
        context.clearRect(0, 0, canvas.width, canvas.height);
        
        // テキストスタイル設定
        context.font = 'bold 72px Arial';
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        
        // 影を追加
        context.shadowColor = 'rgba(0, 0, 0, 0.8)';
        context.shadowBlur = 8;
        context.shadowOffsetX = 2;
        context.shadowOffsetY = 2;
        
        // テキストを描画
        context.fillStyle = '#ffffff';
        context.fillText(text, canvas.width / 2, canvas.height / 2);
        
        // Spriteマテリアルを作成
        const texture = new THREE.CanvasTexture(canvas);
        const material = new THREE.SpriteMaterial({
            map: texture,
            transparent: true,
            opacity: 1
        });
        
        const sprite = new THREE.Sprite(material);
        sprite.scale.set(4, 2, 1);
        
        // アニメーション用のプロパティ
        sprite.userData = {
            velocity: new THREE.Vector3(),
            lifetime: 0,
            maxLifetime: 1.5,
            startScale: sprite.scale.clone(),
            active: false
        };
        
        return sprite;
    }
    
    updateSpriteText(sprite, text, color = '#ffffff', isCritical = false) {
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.width = 256;
        canvas.height = 128;
        
        context.clearRect(0, 0, canvas.width, canvas.height);
        
        // クリティカルヒットの場合は特別なスタイル
        if (isCritical) {
            context.font = 'bold 84px Arial';
            context.strokeStyle = '#ffff00';
            context.lineWidth = 4;
        } else {
            context.font = 'bold 72px Arial';
        }
        
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        
        // 影
        context.shadowColor = 'rgba(0, 0, 0, 0.8)';
        context.shadowBlur = 8;
        context.shadowOffsetX = 2;
        context.shadowOffsetY = 2;
        
        // テキストを描画
        context.fillStyle = color;
        context.fillText(text, canvas.width / 2, canvas.height / 2);
        
        if (isCritical) {
            context.strokeText(text, canvas.width / 2, canvas.height / 2);
        }
        
        // テクスチャを更新
        sprite.material.map = new THREE.CanvasTexture(canvas);
        sprite.material.map.needsUpdate = true;
    }
    
    getNumber() {
        for (const number of this.numberPool) {
            if (!number.visible) {
                return number;
            }
        }
        return null;
    }
    
    spawn(position, damage, type = 'normal') {
        const sprite = this.getNumber();
        if (!sprite) return;
        
        // ダメージタイプに応じた色とスタイル
        let color = '#ffffff';
        let isCritical = false;
        let scale = 1;
        
        switch (type) {
            case 'critical':
                color = '#ffff00';
                isCritical = true;
                scale = 1.5;
                break;
            case 'heal':
                color = '#00ff00';
                break;
            case 'shield':
                color = '#00aaff';
                break;
            case 'miss':
                color = '#888888';
                damage = 'MISS';
                break;
        }
        
        // スプライトを更新
        this.updateSpriteText(sprite, damage.toString(), color, isCritical);
        
        // 位置とアニメーションパラメータを設定
        sprite.position.copy(position);
        sprite.visible = true;
        
        const userData = sprite.userData;
        userData.active = true;
        userData.lifetime = 0;
        userData.velocity.set(
            (Math.random() - 0.5) * 2,
            3 + Math.random() * 2,
            (Math.random() - 0.5) * 2
        );
        
        // スケール設定
        const baseScale = userData.startScale.clone();
        sprite.scale.copy(baseScale.multiplyScalar(scale));
        userData.startScale = sprite.scale.clone();
        
        this.numbers.push(sprite);
    }
    
    update(deltaTime) {
        // カメラの方向を向くように更新
        const cameraDirection = new THREE.Vector3();
        this.camera.getWorldDirection(cameraDirection);
        
        // アクティブな数字を更新
        this.numbers = this.numbers.filter((sprite) => {
            const userData = sprite.userData;
            
            if (!userData.active) return false;
            
            // ライフタイムを更新
            userData.lifetime += deltaTime;
            
            if (userData.lifetime >= userData.maxLifetime) {
                sprite.visible = false;
                userData.active = false;
                return false;
            }
            
            // 位置を更新（重力と速度）
            userData.velocity.y -= 5 * deltaTime; // 重力
            sprite.position.add(
                userData.velocity.clone().multiplyScalar(deltaTime)
            );
            
            // フェードアウト
            const lifeRatio = userData.lifetime / userData.maxLifetime;
            sprite.material.opacity = 1 - Math.pow(lifeRatio, 2);
            
            // スケールアニメーション（最初は大きく、徐々に小さく）
            const scaleMultiplier = 1 + (1 - lifeRatio) * 0.3;
            sprite.scale.copy(userData.startScale.clone().multiplyScalar(scaleMultiplier));
            
            // カメラの方を向く
            sprite.lookAt(this.camera.position);
            
            return true;
        });
    }
    
    // ダメージ計算とクリティカル判定を含む統合メソッド
    showDamage(position, baseDamage, criticalChance = 0.1) {
        const isCritical = Math.random() < criticalChance;
        const damage = isCritical ? Math.floor(baseDamage * 2) : baseDamage;
        const type = isCritical ? 'critical' : 'normal';
        
        this.spawn(position, damage, type);
        
        return {
            damage: damage,
            isCritical: isCritical
        };
    }
    
    dispose() {
        this.numberPool.forEach((sprite) => {
            this.scene.remove(sprite);
            sprite.material.map?.dispose();
            sprite.material.dispose();
        });
        this.numberPool = [];
        this.numbers = [];
    }
}