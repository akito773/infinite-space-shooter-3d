import * as THREE from 'three';

export class StarField {
    constructor(scene) {
        this.scene = scene;
        this.createStars();
        this.createNebula();
    }

    createStars() {
        const starGeometry = new THREE.BufferGeometry();
        const starCount = 5000;
        const positions = new Float32Array(starCount * 3);
        const colors = new Float32Array(starCount * 3);
        
        for (let i = 0; i < starCount * 3; i += 3) {
            // ランダムな位置
            const radius = 200 + Math.random() * 800;
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(2 * Math.random() - 1);
            
            positions[i] = radius * Math.sin(phi) * Math.cos(theta);
            positions[i + 1] = radius * Math.sin(phi) * Math.sin(theta);
            positions[i + 2] = radius * Math.cos(phi);
            
            // ランダムな色（白～青～黄色）
            const colorChoice = Math.random();
            if (colorChoice < 0.3) {
                colors[i] = 1;
                colors[i + 1] = 1;
                colors[i + 2] = 1;
            } else if (colorChoice < 0.6) {
                colors[i] = 0.8;
                colors[i + 1] = 0.8;
                colors[i + 2] = 1;
            } else {
                colors[i] = 1;
                colors[i + 1] = 1;
                colors[i + 2] = 0.8;
            }
        }
        
        starGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        starGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        
        const starMaterial = new THREE.PointsMaterial({
            size: 2,
            vertexColors: true,
            transparent: true,
            opacity: 0.8,
            sizeAttenuation: true
        });
        
        this.stars = new THREE.Points(starGeometry, starMaterial);
        this.scene.add(this.stars);
    }

    createNebula() {
        // 星雲エフェクト
        const nebulaGeometry = new THREE.SphereGeometry(500, 32, 32);
        const nebulaMaterial = new THREE.MeshBasicMaterial({
            color: 0x440088,
            transparent: true,
            opacity: 0.1,
            side: THREE.BackSide
        });
        
        this.nebula = new THREE.Mesh(nebulaGeometry, nebulaMaterial);
        this.scene.add(this.nebula);
        
        // 追加の星雲層
        const nebula2Geometry = new THREE.SphereGeometry(600, 32, 32);
        const nebula2Material = new THREE.MeshBasicMaterial({
            color: 0x004488,
            transparent: true,
            opacity: 0.05,
            side: THREE.BackSide
        });
        
        this.nebula2 = new THREE.Mesh(nebula2Geometry, nebula2Material);
        this.scene.add(this.nebula2);
    }

    update(delta) {
        // ゆっくり回転
        this.stars.rotation.y += delta * 0.01;
        this.nebula.rotation.y -= delta * 0.005;
        this.nebula2.rotation.x += delta * 0.003;
    }
}