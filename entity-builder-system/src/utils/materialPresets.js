// マテリアルプリセット定義
export const MATERIAL_PRESETS = {
  // 金属系
  steel: {
    name: 'Steel',
    category: 'Metal',
    properties: {
      color: '#c0c0c0',
      metalness: 0.95,
      roughness: 0.2,
      emissive: '#000000',
      emissiveIntensity: 0,
    }
  },
  chrome: {
    name: 'Chrome',
    category: 'Metal',
    properties: {
      color: '#ffffff',
      metalness: 1.0,
      roughness: 0.05,
      emissive: '#000000',
      emissiveIntensity: 0,
    }
  },
  gold: {
    name: 'Gold',
    category: 'Metal',
    properties: {
      color: '#ffd700',
      metalness: 1.0,
      roughness: 0.3,
      emissive: '#000000',
      emissiveIntensity: 0,
    }
  },
  copper: {
    name: 'Copper',
    category: 'Metal',
    properties: {
      color: '#b87333',
      metalness: 1.0,
      roughness: 0.35,
      emissive: '#000000',
      emissiveIntensity: 0,
    }
  },
  
  // プラスチック系
  plastic_matte: {
    name: 'Matte Plastic',
    category: 'Plastic',
    properties: {
      color: '#ff0000',
      metalness: 0.0,
      roughness: 0.8,
      emissive: '#000000',
      emissiveIntensity: 0,
    }
  },
  plastic_glossy: {
    name: 'Glossy Plastic',
    category: 'Plastic',
    properties: {
      color: '#0000ff',
      metalness: 0.0,
      roughness: 0.2,
      emissive: '#000000',
      emissiveIntensity: 0,
    }
  },
  rubber: {
    name: 'Rubber',
    category: 'Plastic',
    properties: {
      color: '#333333',
      metalness: 0.0,
      roughness: 0.9,
      emissive: '#000000',
      emissiveIntensity: 0,
    }
  },
  
  // ガラス・透明系
  glass: {
    name: 'Glass',
    category: 'Transparent',
    properties: {
      color: '#ffffff',
      metalness: 0.0,
      roughness: 0.0,
      transparent: true,
      opacity: 0.3,
      emissive: '#000000',
      emissiveIntensity: 0,
    }
  },
  crystal: {
    name: 'Crystal',
    category: 'Transparent',
    properties: {
      color: '#e0ffff',
      metalness: 0.1,
      roughness: 0.0,
      transparent: true,
      opacity: 0.5,
      emissive: '#00ffff',
      emissiveIntensity: 0.1,
    }
  },
  
  // エネルギー・発光系
  neon_blue: {
    name: 'Neon Blue',
    category: 'Energy',
    properties: {
      color: '#0080ff',
      metalness: 0.2,
      roughness: 0.1,
      emissive: '#00ccff',
      emissiveIntensity: 0.8,
    }
  },
  neon_red: {
    name: 'Neon Red',
    category: 'Energy',
    properties: {
      color: '#ff0000',
      metalness: 0.2,
      roughness: 0.1,
      emissive: '#ff0044',
      emissiveIntensity: 0.8,
    }
  },
  plasma: {
    name: 'Plasma',
    category: 'Energy',
    properties: {
      color: '#ff00ff',
      metalness: 0.0,
      roughness: 0.0,
      emissive: '#ff00ff',
      emissiveIntensity: 1.0,
      transparent: true,
      opacity: 0.8,
    }
  },
  hologram: {
    name: 'Hologram',
    category: 'Energy',
    properties: {
      color: '#00ffff',
      metalness: 0.0,
      roughness: 0.0,
      emissive: '#00ffff',
      emissiveIntensity: 0.5,
      transparent: true,
      opacity: 0.6,
    }
  },
  
  // 特殊
  carbon_fiber: {
    name: 'Carbon Fiber',
    category: 'Special',
    properties: {
      color: '#202020',
      metalness: 0.7,
      roughness: 0.4,
      emissive: '#000000',
      emissiveIntensity: 0,
    }
  },
  military_camo: {
    name: 'Military Camo',
    category: 'Special',
    properties: {
      color: '#4a5d23',
      metalness: 0.0,
      roughness: 0.8,
      emissive: '#000000',
      emissiveIntensity: 0,
    }
  },
  rusted_metal: {
    name: 'Rusted Metal',
    category: 'Special',
    properties: {
      color: '#8b4513',
      metalness: 0.8,
      roughness: 0.9,
      emissive: '#000000',
      emissiveIntensity: 0,
    }
  },
};

// カテゴリ別にプリセットを取得
export function getPresetsByCategory() {
  const categories = {};
  
  Object.entries(MATERIAL_PRESETS).forEach(([key, preset]) => {
    if (!categories[preset.category]) {
      categories[preset.category] = [];
    }
    categories[preset.category].push({ key, ...preset });
  });
  
  return categories;
}

// マテリアルプロパティをマージ
export function mergeMaterialProperties(base, updates) {
  return {
    ...base,
    ...updates,
  };
}