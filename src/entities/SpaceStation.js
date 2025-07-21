import * as THREE from 'three';

export class SpaceStation {
    constructor(scene, position, config = {}) {
        this.scene = scene;
        this.position = position;
        
        this.name = config.name || '宇宙ステーション';
        this.size = config.size || 15;
        this.rotationSpeed = 0.002;
        
        this.createMesh();
        this.createLights();
    }

    createMesh() {
        this.group = new THREE.Group();
        
        // 中央コア
        const coreGeometry = new THREE.OctahedronGeometry(this.size);
        const coreMaterial = new THREE.MeshPhongMaterial({
            color: 0x666666,
            emissive: 0x111111,
            specular: 0xffffff,
            shininess: 100
        });
        this.core = new THREE.Mesh(coreGeometry, coreMaterial);
        this.group.add(this.core);
        
        // リング構造
        const ringGeometry = new THREE.TorusGeometry(this.size * 1.5, this.size * 0.2, 8, 6);
        const ringMaterial = new THREE.MeshPhongMaterial({
            color: 0x888888,
            emissive: 0x222222,
            specular: 0xffffff,
            shininess: 150
        });
        
        // 3つのリング
        for (let i = 0; i < 3; i++) {
            const ring = new THREE.Mesh(ringGeometry, ringMaterial);
            if (i === 0) ring.rotation.x = Math.PI / 2;
            if (i === 1) ring.rotation.y = Math.PI / 2;
            if (i === 2) ring.rotation.z = Math.PI / 2;
            this.group.add(ring);
        }
        
        // ドッキングポート
        const portGeometry = new THREE.CylinderGeometry(this.size * 0.3, this.size * 0.3, this.size * 0.5);
        const portMaterial = new THREE.MeshPhongMaterial({
            color: 0x444444,
            emissive: 0x0066ff,
            emissiveIntensity: 0.3
        });
        
        for (let i = 0; i < 4; i++) {
            const port = new THREE.Mesh(portGeometry, portMaterial);
            const angle = (Math.PI * 2 / 4) * i;
            port.position.x = Math.cos(angle) * this.size * 1.5;
            port.position.z = Math.sin(angle) * this.size * 1.5;
            port.rotation.z = Math.PI / 2;
            this.group.add(port);
        }
        
        // ソーラーパネル
        const panelGeometry = new THREE.BoxGeometry(this.size * 2, this.size * 0.1, this.size);
        const panelMaterial = new THREE.MeshPhongMaterial({
            color: 0x000044,
            emissive: 0x000088,
            emissiveIntensity: 0.5,
            specular: 0xffffff,
            shininess: 200
        });
        
        const panel1 = new THREE.Mesh(panelGeometry, panelMaterial);
        panel1.position.x = this.size * 2;
        panel1.position.y = this.size * 0.5;
        this.group.add(panel1);
        
        const panel2 = new THREE.Mesh(panelGeometry, panelMaterial);
        panel2.position.x = -this.size * 2;
        panel2.position.y = this.size * 0.5;
        this.group.add(panel2);
        
        this.group.position.copy(this.position);
        this.scene.add(this.group);
        
        // 影
        this.group.traverse((child) => {
            if (child instanceof THREE.Mesh) {
                child.castShadow = true;
                child.receiveShadow = true;
            }
        });
        
        // 名前表示
        this.createNameLabel();
    }

    createLights() {
        // ステーション周辺の照明
        const light1 = new THREE.PointLight(0x0088ff, 0.5, this.size * 4);
        light1.position.set(0, this.size, 0);
        this.group.add(light1);
        
        // 点滅する警告灯
        this.warningLights = [];
        for (let i = 0; i < 4; i++) {
            const warningLight = new THREE.PointLight(0xff0000, 0, this.size * 2);
            const angle = (Math.PI * 2 / 4) * i;
            warningLight.position.set(
                Math.cos(angle) * this.size * 1.5,
                this.size,
                Math.sin(angle) * this.size * 1.5
            );
            this.group.add(warningLight);
            this.warningLights.push(warningLight);
        }
    }

    createNameLabel() {
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 64;
        const context = canvas.getContext('2d');
        
        context.fillStyle = 'rgba(0, 0, 0, 0.7)';
        context.fillRect(0, 0, 256, 64);
        
        context.font = '20px Arial';
        context.fillStyle = '#00ffff';
        context.textAlign = 'center';
        context.fillText(this.name, 128, 40);
        
        const texture = new THREE.CanvasTexture(canvas);
        const spriteMaterial = new THREE.SpriteMaterial({ 
            map: texture,
            transparent: true
        });
        
        this.nameLabel = new THREE.Sprite(spriteMaterial);
        this.nameLabel.position.set(0, this.size + 15, 0);
        this.nameLabel.scale.set(40, 10, 1);
        this.group.add(this.nameLabel);
    }

    update(delta, camera) {
        // ステーション全体の回転
        this.group.rotation.y += this.rotationSpeed;
        
        // コアの回転
        this.core.rotation.x += this.rotationSpeed * 2;
        this.core.rotation.z += this.rotationSpeed * 1.5;
        
        // 警告灯の点滅
        const time = Date.now() * 0.001;
        this.warningLights.forEach((light, index) => {
            light.intensity = (Math.sin(time * 2 + index) + 1) * 0.5;
        });
        
        // 名前ラベルをカメラに向ける
        if (this.nameLabel && camera) {
            this.nameLabel.lookAt(camera.position);
        }
    }

    checkProximity(playerPosition, threshold = 30) {
        const distance = this.group.position.distanceTo(playerPosition);
        return distance < this.size + threshold;
    }
}