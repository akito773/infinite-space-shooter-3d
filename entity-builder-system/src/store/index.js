import { configureStore, createSlice } from '@reduxjs/toolkit';

const initialState = {
  objects: [],
  selectedObjectId: null,
  tool: 'select',
  transformMode: 'translate',
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
    },
    setTool: (state, action) => {
      state.tool = action.payload;
    },
    setTransformMode: (state, action) => {
      state.transformMode = action.payload;
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
  setTool,
  setTransformMode,
} = sceneSlice.actions;

export const store = configureStore({
  reducer: {
    scene: sceneSlice.reducer,
  },
});