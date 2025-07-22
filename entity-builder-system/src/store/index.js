import { configureStore, createSlice } from '@reduxjs/toolkit';
import { hslToHex } from '../utils/colorUtils';

const initialState = {
  objects: [],
  selectedObjectId: null,
  tool: 'select',
  transformMode: 'translate',
  bones: [],
  selectedBoneId: null,
  showBones: true,
  editMode: 'object', // 'object' or 'bone'
  bindings: [], // ボーンとメッシュのバインディング情報
  animations: [], // アニメーションクリップ
  currentAnimation: null,
  isPlaying: false,
  animationTime: 0,
  materialClipboard: null, // コピーされたマテリアル
  favoriteProfiles: [], // お気に入りマテリアル
  recentProfiles: [], // 最近使用したマテリアル（最大5個）
  selectedObjectIds: [], // 複数選択されたオブジェクト
};

const sceneSlice = createSlice({
  name: 'scene',
  initialState,
  reducers: {
    addObject: (state, action) => {
      state.objects.push(action.payload);
    },
    addMultipleObjects: (state, action) => {
      state.objects.push(...action.payload);
    },
    updateObject: (state, action) => {
      const { id, updates } = action.payload;
      const object = state.objects.find(obj => obj.id === id);
      if (object) {
        Object.assign(object, updates);
      }
    },
    deleteObject: (state, action) => {
      const deleteIds = new Set();
      const collectChildren = (id) => {
        deleteIds.add(id);
        const obj = state.objects.find(o => o.id === id);
        if (obj && obj.children) {
          obj.children.forEach(childId => collectChildren(childId));
        }
      };
      
      collectChildren(action.payload);
      state.objects = state.objects.filter(obj => !deleteIds.has(obj.id));
      
      if (deleteIds.has(state.selectedObjectId)) {
        state.selectedObjectId = null;
      }
    },
    clearScene: (state) => {
      state.objects = [];
      state.selectedObjectId = null;
    },
    selectObject: (state, action) => {
      state.selectedObjectId = action.payload;
      // 単一選択時は複数選択をクリア
      if (action.payload !== null) {
        state.selectedObjectIds = [];
      }
    },
    toggleMultiSelect: (state, action) => {
      const objectId = action.payload;
      const index = state.selectedObjectIds.indexOf(objectId);
      if (index === -1) {
        state.selectedObjectIds.push(objectId);
      } else {
        state.selectedObjectIds.splice(index, 1);
      }
    },
    clearMultiSelect: (state) => {
      state.selectedObjectIds = [];
    },
    setTool: (state, action) => {
      state.tool = action.payload;
    },
    setTransformMode: (state, action) => {
      state.transformMode = action.payload;
    },
    // ボーン関連のアクション
    addBone: (state, action) => {
      state.bones.push(action.payload);
    },
    addMultipleBones: (state, action) => {
      state.bones.push(...action.payload);
    },
    updateBone: (state, action) => {
      const { id, updates } = action.payload;
      const bone = state.bones.find(b => b.id === id);
      if (bone) {
        Object.assign(bone, updates);
      }
    },
    deleteBone: (state, action) => {
      const deleteIds = new Set();
      const collectChildren = (id) => {
        deleteIds.add(id);
        const bone = state.bones.find(b => b.id === id);
        if (bone && bone.children) {
          bone.children.forEach(childId => collectChildren(childId));
        }
      };
      
      collectChildren(action.payload);
      state.bones = state.bones.filter(bone => !deleteIds.has(bone.id));
      
      if (deleteIds.has(state.selectedBoneId)) {
        state.selectedBoneId = null;
      }
    },
    selectBone: (state, action) => {
      state.selectedBoneId = action.payload;
    },
    clearBones: (state) => {
      state.bones = [];
      state.selectedBoneId = null;
    },
    setShowBones: (state, action) => {
      state.showBones = action.payload;
    },
    setEditMode: (state, action) => {
      state.editMode = action.payload;
      // モード切り替え時に選択をクリア
      if (action.payload === 'object') {
        state.selectedBoneId = null;
      } else {
        state.selectedObjectId = null;
      }
    },
    // バインディング関連のアクション
    addBinding: (state, action) => {
      state.bindings.push(action.payload);
    },
    addMultipleBindings: (state, action) => {
      state.bindings.push(...action.payload);
    },
    updateBinding: (state, action) => {
      const { id, updates } = action.payload;
      const binding = state.bindings.find(b => b.id === id);
      if (binding) {
        Object.assign(binding, updates);
      }
    },
    deleteBinding: (state, action) => {
      state.bindings = state.bindings.filter(b => b.id !== action.payload);
    },
    clearBindings: (state) => {
      state.bindings = [];
    },
    // メッシュまたはボーンに関連するバインディングを削除
    deleteRelatedBindings: (state, action) => {
      const { meshId, boneId } = action.payload;
      state.bindings = state.bindings.filter(b => {
        if (meshId && b.meshId === meshId) return false;
        if (boneId && b.boneId === boneId) return false;
        return true;
      });
    },
    // アニメーション関連のアクション
    addAnimation: (state, action) => {
      state.animations.push(action.payload);
    },
    setCurrentAnimation: (state, action) => {
      state.currentAnimation = action.payload;
      state.animationTime = 0;
    },
    setIsPlaying: (state, action) => {
      state.isPlaying = action.payload;
    },
    updateAnimationTime: (state, action) => {
      state.animationTime = action.payload;
    },
    clearAnimations: (state) => {
      state.animations = [];
      state.currentAnimation = null;
      state.isPlaying = false;
      state.animationTime = 0;
    },
    // マテリアル関連のアクション
    copyMaterial: (state, action) => {
      const object = state.objects.find(obj => obj.id === action.payload);
      if (object) {
        state.materialClipboard = { ...object.material };
      }
    },
    pasteMaterial: (state, action) => {
      if (state.materialClipboard) {
        const object = state.objects.find(obj => obj.id === action.payload);
        if (object) {
          object.material = { ...state.materialClipboard };
          // 最近使用したマテリアルに追加
          state.recentProfiles = [
            { ...state.materialClipboard, id: Date.now() },
            ...state.recentProfiles.filter(p => 
              JSON.stringify(p) !== JSON.stringify(state.materialClipboard)
            )
          ].slice(0, 5);
        }
      }
    },
    // お気に入りマテリアル関連
    addFavoriteProfile: (state, action) => {
      const newFavorite = {
        ...action.payload,
        id: Date.now(),
        name: action.payload.name || `Favorite ${state.favoriteProfiles.length + 1}`
      };
      state.favoriteProfiles.push(newFavorite);
    },
    removeFavoriteProfile: (state, action) => {
      state.favoriteProfiles = state.favoriteProfiles.filter(p => p.id !== action.payload);
    },
    applyMaterialToMultiple: (state, action) => {
      const { material, objectIds } = action.payload;
      objectIds.forEach(id => {
        const object = state.objects.find(obj => obj.id === id);
        if (object) {
          object.material = { ...material };
        }
      });
      // 最近使用したマテリアルに追加
      state.recentProfiles = [
        { ...material, id: Date.now() },
        ...state.recentProfiles.filter(p => 
          JSON.stringify(p) !== JSON.stringify(material)
        )
      ].slice(0, 5);
    },
    generateRandomMaterial: (state, action) => {
      const object = state.objects.find(obj => obj.id === action.payload);
      if (object) {
        const hue = Math.random() * 360;
        const saturation = 50 + Math.random() * 50;
        const lightness = 30 + Math.random() * 40;
        const metalness = Math.random();
        const roughness = Math.random();
        
        const hslColor = `hsl(${hue}, ${saturation}%, ${lightness}%)`;
        object.material = {
          color: hslToHex(hslColor),
          metalness,
          roughness,
          emissive: '#000000',
          emissiveIntensity: 0,
          transparent: false,
          opacity: 1
        };
      }
    },
  },
});

export const {
  addObject,
  addMultipleObjects,
  updateObject,
  deleteObject,
  clearScene,
  selectObject,
  toggleMultiSelect,
  clearMultiSelect,
  setTool,
  setTransformMode,
  addBone,
  addMultipleBones,
  updateBone,
  deleteBone,
  selectBone,
  clearBones,
  setShowBones,
  setEditMode,
  addBinding,
  addMultipleBindings,
  updateBinding,
  deleteBinding,
  clearBindings,
  deleteRelatedBindings,
  addAnimation,
  setCurrentAnimation,
  setIsPlaying,
  updateAnimationTime,
  clearAnimations,
  copyMaterial,
  pasteMaterial,
  addFavoriteProfile,
  removeFavoriteProfile,
  applyMaterialToMultiple,
  generateRandomMaterial,
} = sceneSlice.actions;

export const store = configureStore({
  reducer: {
    scene: sceneSlice.reducer,
  },
});