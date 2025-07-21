# Entity Builder - 3Dモデリングアプリ開発コンテキスト

## コンセプト

**ブラウザベースの3D機体モデリングツール**
- Blenderのようなフル機能ではなく、機体作成に特化
- 初心者でも使いやすいUI
- リアルタイムプレビューとゲーム内テスト

## 核心機能

### 1. 3Dモデリング

#### 基本ツールセット
```javascript
// 形状作成ツール
const primitives = {
  box: new THREE.BoxGeometry(1, 1, 1),
  sphere: new THREE.SphereGeometry(0.5, 16, 16),
  cylinder: new THREE.CylinderGeometry(0.5, 0.5, 1, 16),
  cone: new THREE.ConeGeometry(0.5, 1, 16),
  torus: new THREE.TorusGeometry(0.5, 0.2, 8, 16)
};

// 編集モード
const editModes = {
  object: 'オブジェクトモード',
  vertex: '頂点編集',
  edge: 'エッジ編集',
  face: '面編集'
};

// 変形ツール
const transformTools = {
  translate: 'G',  // 移動
  rotate: 'R',     // 回転
  scale: 'S',      // スケール
  extrude: 'E'     // 押し出し
};
```

#### パーツシステム
```javascript
// 機体パーツライブラリ
const partLibrary = {
  wings: [
    { name: '戦闘機翼', file: 'wing_fighter.obj' },
    { name: '爆撃機翼', file: 'wing_bomber.obj' },
    { name: 'エナジー翼', file: 'wing_energy.obj' }
  ],
  engines: [
    { name: 'ジェットエンジン', file: 'engine_jet.obj' },
    { name: 'プラズマエンジン', file: 'engine_plasma.obj' },
    { name: 'ワープエンジン', file: 'engine_warp.obj' }
  ],
  weapons: [
    { name: 'レーザー砲', file: 'weapon_laser.obj' },
    { name: 'ミサイルポッド', file: 'weapon_missile.obj' },
    { name: 'ガトリング砲', file: 'weapon_gatling.obj' }
  ],
  cockpits: [
    { name: '単座コックピット', file: 'cockpit_single.obj' },
    { name: '複座コックピット', file: 'cockpit_double.obj' }
  ]
};
```

### 2. テクスチャペイント

#### ペイントツール実装
```javascript
class TexturePainter {
  constructor(mesh) {
    this.mesh = mesh;
    this.canvas = document.createElement('canvas');
    this.canvas.width = 1024;
    this.canvas.height = 1024;
    this.ctx = this.canvas.getContext('2d');
    
    // テクスチャ作成
    this.texture = new THREE.CanvasTexture(this.canvas);
    this.mesh.material.map = this.texture;
    
    // ブラシ設定
    this.brush = {
      color: '#ffffff',
      size: 10,
      opacity: 1.0,
      hardness: 0.8
    };
  }
  
  paint(uv, pressure = 1.0) {
    const x = uv.x * this.canvas.width;
    const y = (1 - uv.y) * this.canvas.height;
    
    // グラデーションブラシ
    const gradient = this.ctx.createRadialGradient(x, y, 0, x, y, this.brush.size);
    gradient.addColorStop(0, this.brush.color);
    gradient.addColorStop(this.brush.hardness, this.brush.color);
    gradient.addColorStop(1, 'transparent');
    
    this.ctx.globalAlpha = this.brush.opacity * pressure;
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(x - this.brush.size, y - this.brush.size, 
                      this.brush.size * 2, this.brush.size * 2);
    
    // テクスチャ更新
    this.texture.needsUpdate = true;
  }
}
```

#### レイヤーシステム
```javascript
class LayerSystem {
  constructor() {
    this.layers = [];
    this.activeLayer = null;
  }
  
  addLayer(name, blendMode = 'normal') {
    const layer = {
      id: Date.now(),
      name: name,
      canvas: document.createElement('canvas'),
      opacity: 1.0,
      visible: true,
      blendMode: blendMode
    };
    
    layer.canvas.width = 1024;
    layer.canvas.height = 1024;
    
    this.layers.push(layer);
    this.activeLayer = layer;
    return layer;
  }
  
  compositeTexture() {
    const composite = document.createElement('canvas');
    composite.width = 1024;
    composite.height = 1024;
    const ctx = composite.getContext('2d');
    
    // レイヤー合成
    this.layers.forEach(layer => {
      if (!layer.visible) return;
      
      ctx.globalAlpha = layer.opacity;
      ctx.globalCompositeOperation = layer.blendMode;
      ctx.drawImage(layer.canvas, 0, 0);
    });
    
    return new THREE.CanvasTexture(composite);
  }
}
```

### 3. UV展開

#### 自動UV展開
```javascript
class UVUnwrapper {
  static unwrap(geometry) {
    // 簡易的なボックス投影UV
    const position = geometry.attributes.position;
    const normal = geometry.attributes.normal;
    const uv = new Float32Array(position.count * 2);
    
    for (let i = 0; i < position.count; i++) {
      const vertex = new THREE.Vector3(
        position.getX(i),
        position.getY(i),
        position.getZ(i)
      );
      
      const n = new THREE.Vector3(
        normal.getX(i),
        normal.getY(i),
        normal.getZ(i)
      );
      
      // 最も平行な軸を検出
      const absN = n.clone().abs();
      
      if (absN.x > absN.y && absN.x > absN.z) {
        // X軸投影
        uv[i * 2] = vertex.y;
        uv[i * 2 + 1] = vertex.z;
      } else if (absN.y > absN.z) {
        // Y軸投影
        uv[i * 2] = vertex.x;
        uv[i * 2 + 1] = vertex.z;
      } else {
        // Z軸投影
        uv[i * 2] = vertex.x;
        uv[i * 2 + 1] = vertex.y;
      }
    }
    
    // 正規化
    const min = new THREE.Vector2(Infinity, Infinity);
    const max = new THREE.Vector2(-Infinity, -Infinity);
    
    for (let i = 0; i < position.count; i++) {
      min.x = Math.min(min.x, uv[i * 2]);
      min.y = Math.min(min.y, uv[i * 2 + 1]);
      max.x = Math.max(max.x, uv[i * 2]);
      max.y = Math.max(max.y, uv[i * 2 + 1]);
    }
    
    const size = max.clone().sub(min);
    
    for (let i = 0; i < position.count; i++) {
      uv[i * 2] = (uv[i * 2] - min.x) / size.x;
      uv[i * 2 + 1] = (uv[i * 2 + 1] - min.y) / size.y;
    }
    
    geometry.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  }
}
```

### 4. リアルタイムプレビュー

#### プレビューシーン
```javascript
class PreviewScene {
  constructor(container) {
    // レンダラー設定
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(this.renderer.domElement);
    
    // シーン設定
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x2a2a2a);
    
    // カメラ設定
    this.camera = new THREE.PerspectiveCamera(
      50,
      container.clientWidth / container.clientHeight,
      0.1,
      1000
    );
    this.camera.position.set(5, 5, 5);
    
    // ライティング
    this.setupLighting();
    
    // コントロール
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    
    // グリッド
    const grid = new THREE.GridHelper(10, 10);
    this.scene.add(grid);
  }
  
  setupLighting() {
    // 環境光
    const ambient = new THREE.AmbientLight(0x404040, 2);
    this.scene.add(ambient);
    
    // キーライト
    const keyLight = new THREE.DirectionalLight(0xffffff, 1);
    keyLight.position.set(5, 10, 5);
    this.scene.add(keyLight);
    
    // フィルライト
    const fillLight = new THREE.DirectionalLight(0x4040ff, 0.5);
    fillLight.position.set(-5, 5, -5);
    this.scene.add(fillLight);
    
    // リムライト
    const rimLight = new THREE.DirectionalLight(0xff4040, 0.3);
    rimLight.position.set(0, 5, -10);
    this.scene.add(rimLight);
  }
  
  setModel(model) {
    // 既存モデル削除
    if (this.currentModel) {
      this.scene.remove(this.currentModel);
    }
    
    this.currentModel = model;
    this.scene.add(model);
    
    // カメラ調整
    const box = new THREE.Box3().setFromObject(model);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    
    const maxDim = Math.max(size.x, size.y, size.z);
    const fov = this.camera.fov * (Math.PI / 180);
    let cameraZ = Math.abs(maxDim / 2 / Math.tan(fov / 2));
    
    this.camera.position.set(center.x + cameraZ, center.y + cameraZ / 2, center.z + cameraZ);
    this.camera.lookAt(center);
    this.controls.target = center;
  }
}
```

### 5. エクスポート機能

#### GLTFエクスポート
```javascript
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter';

class ModelExporter {
  static async exportGLTF(model, textures) {
    const exporter = new GLTFExporter();
    
    return new Promise((resolve, reject) => {
      exporter.parse(
        model,
        (gltf) => {
          // GLTFデータとテクスチャをパッケージ
          const exportData = {
            model: gltf,
            textures: textures,
            metadata: {
              created: new Date().toISOString(),
              vertices: this.countVertices(model),
              materials: this.countMaterials(model)
            }
          };
          
          resolve(exportData);
        },
        { binary: true }
      );
    });
  }
  
  static async exportToGame(model, gameData) {
    const gltfData = await this.exportGLTF(model, gameData.textures);
    
    // ゲーム用メタデータ追加
    const gameExport = {
      ...gltfData,
      gameData: {
        hitbox: this.generateHitbox(model),
        weaponMounts: gameData.weaponMounts || [],
        enginePositions: gameData.enginePositions || [],
        stats: gameData.stats || {}
      }
    };
    
    // ファイル保存
    const blob = new Blob([JSON.stringify(gameExport)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `${gameData.name || 'custom_ship'}.json`;
    a.click();
  }
}
```

## UIコンポーネント例

### ツールバー
```jsx
const Toolbar = () => {
  return (
    <div className="toolbar">
      <ToolGroup title="作成">
        <ToolButton icon="cube" onClick={() => addPrimitive('box')} />
        <ToolButton icon="sphere" onClick={() => addPrimitive('sphere')} />
        <ToolButton icon="cylinder" onClick={() => addPrimitive('cylinder')} />
      </ToolGroup>
      
      <ToolGroup title="編集">
        <ToolButton icon="move" onClick={() => setTool('translate')} />
        <ToolButton icon="rotate" onClick={() => setTool('rotate')} />
        <ToolButton icon="scale" onClick={() => setTool('scale')} />
      </ToolGroup>
      
      <ToolGroup title="モード">
        <ToolButton icon="object" onClick={() => setMode('object')} />
        <ToolButton icon="vertex" onClick={() => setMode('vertex')} />
        <ToolButton icon="face" onClick={() => setMode('face')} />
      </ToolGroup>
    </div>
  );
};
```

## 別AIへの要点

1. **Three.jsベースの3Dモデリング** - 機体作成に特化
2. **リアルタイムテクスチャペイント** - UV展開対応
3. **パーツライブラリシステム** - ドラッグ&ドロップ
4. **GLTF/GLBエクスポート** - ゲーム統合用
5. **初心者向けUI** - Blenderより簡単に

これで3Dモデリングツールとしての方向性が明確になりました。