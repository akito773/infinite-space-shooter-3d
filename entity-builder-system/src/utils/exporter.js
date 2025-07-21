import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter';
import { saveAs } from 'file-saver';
import * as THREE from 'three';

export async function exportSceneAsGLTF(scene, filename = 'player_ship.glb') {
  const exporter = new GLTFExporter();
  
  return new Promise((resolve, reject) => {
    exporter.parse(
      scene,
      (result) => {
        if (result instanceof ArrayBuffer) {
          // Binary GLB format
          const blob = new Blob([result], { type: 'application/octet-stream' });
          saveAs(blob, filename);
          resolve({ success: true, message: 'Model exported successfully!' });
        } else {
          // JSON GLTF format
          const output = JSON.stringify(result, null, 2);
          const blob = new Blob([output], { type: 'application/json' });
          saveAs(blob, filename.replace('.glb', '.gltf'));
          resolve({ success: true, message: 'Model exported successfully!' });
        }
      },
      (error) => {
        reject({ success: false, message: 'Export failed: ' + error.message });
      },
      {
        binary: filename.endsWith('.glb'),
        includeCustomExtensions: true,
        trs: false,
        animations: [],
        truncateDrawRange: true,
        maxTextureSize: 4096
      }
    );
  });
}

export function createExportScene(objects) {
  const exportScene = new THREE.Scene();
  
  // Helper function to create mesh from object data
  const createMeshFromObject = (obj) => {
    if (obj.geometry.type === 'group') {
      const group = new THREE.Group();
      group.position.set(...obj.position);
      group.rotation.set(...obj.rotation);
      group.scale.set(...obj.scale);
      group.name = obj.name;
      return group;
    }
    
    // Create geometry
    let geometry;
    const args = obj.geometry.args || [1, 1, 1];
    
    switch (obj.geometry.type) {
      case 'box':
        geometry = new THREE.BoxGeometry(...args);
        break;
      case 'sphere':
        geometry = new THREE.SphereGeometry(...args);
        break;
      case 'cylinder':
        geometry = new THREE.CylinderGeometry(...args);
        break;
      case 'cone':
        geometry = new THREE.ConeGeometry(...args);
        break;
      case 'torus':
        geometry = new THREE.TorusGeometry(...args);
        break;
      default:
        geometry = new THREE.BoxGeometry(1, 1, 1);
    }
    
    // Create material
    const material = new THREE.MeshStandardMaterial({
      color: obj.material.color || '#ffffff',
      metalness: obj.material.metalness || 0.5,
      roughness: obj.material.roughness || 0.5,
      transparent: obj.material.transparent || false,
      opacity: obj.material.opacity || 1.0,
      emissive: obj.material.emissive || '#000000',
      emissiveIntensity: obj.material.emissiveIntensity || 0
    });
    
    // Create mesh
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(...obj.position);
    mesh.rotation.set(...obj.rotation);
    mesh.scale.set(...obj.scale);
    mesh.name = obj.name;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    
    return mesh;
  };
  
  // Build hierarchy
  const meshMap = new Map();
  
  // First pass: create all meshes
  objects.forEach(obj => {
    const mesh = createMeshFromObject(obj);
    meshMap.set(obj.id, mesh);
  });
  
  // Second pass: build hierarchy
  objects.forEach(obj => {
    const mesh = meshMap.get(obj.id);
    
    if (obj.parent) {
      const parentMesh = meshMap.get(obj.parent);
      if (parentMesh) {
        parentMesh.add(mesh);
      }
    } else {
      // Root object
      exportScene.add(mesh);
    }
  });
  
  return exportScene;
}