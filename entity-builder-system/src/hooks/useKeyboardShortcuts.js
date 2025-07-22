import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  setTransformMode, 
  deleteObject, 
  deleteBone,
  selectObject,
  selectBone,
  setEditMode,
  clearScene,
  setShowBones,
  setIsPlaying,
  copyMaterial,
  pasteMaterial,
  clearMultiSelect,
  store
} from '../store';

export function useKeyboardShortcuts() {
  const dispatch = useDispatch();
  const selectedObjectId = useSelector(state => state.scene.selectedObjectId);
  const selectedBoneId = useSelector(state => state.scene.selectedBoneId);
  const editMode = useSelector(state => state.scene.editMode);
  const objects = useSelector(state => state.scene.objects);
  const bones = useSelector(state => state.scene.bones);
  
  // Undo/Redo履歴（簡易版）
  const undoStack = [];
  const redoStack = [];
  
  useEffect(() => {
    const handleKeyDown = (e) => {
      // テキスト入力中は無効
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
        return;
      }
      
      // Ctrl/Cmd + Z: Undo
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        console.log('Undo - Not implemented yet');
        // TODO: Implement undo functionality
      }
      
      // Ctrl/Cmd + Shift + Z or Ctrl/Cmd + Y: Redo
      if (((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'z') || 
          ((e.ctrlKey || e.metaKey) && e.key === 'y')) {
        e.preventDefault();
        console.log('Redo - Not implemented yet');
        // TODO: Implement redo functionality
      }
      
      // Delete/Backspace: 選択オブジェクトを削除
      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        if (editMode === 'object' && selectedObjectId) {
          dispatch(deleteObject(selectedObjectId));
        } else if (editMode === 'bone' && selectedBoneId) {
          dispatch(deleteBone(selectedBoneId));
        }
      }
      
      // G: 移動モード
      if (e.key === 'g' || e.key === 'G') {
        e.preventDefault();
        dispatch(setTransformMode('translate'));
      }
      
      // R: 回転モード
      if (e.key === 'r' || e.key === 'R') {
        e.preventDefault();
        dispatch(setTransformMode('rotate'));
      }
      
      // S: スケールモード
      if (e.key === 's' || e.key === 'S') {
        e.preventDefault();
        dispatch(setTransformMode('scale'));
      }
      
      // Tab: オブジェクト/ボーンモード切り替え
      if (e.key === 'Tab') {
        e.preventDefault();
        dispatch(setEditMode(editMode === 'object' ? 'bone' : 'object'));
      }
      
      // H: ボーン表示切り替え
      if (e.key === 'h' || e.key === 'H') {
        e.preventDefault();
        dispatch(setShowBones(state => !state));
      }
      
      // Escape: 選択解除
      if (e.key === 'Escape') {
        e.preventDefault();
        if (editMode === 'object') {
          dispatch(selectObject(null));
          dispatch(clearMultiSelect());
        } else {
          dispatch(selectBone(null));
        }
      }
      
      // Ctrl/Cmd + A: 全選択（将来的な実装用）
      if ((e.ctrlKey || e.metaKey) && e.key === 'a') {
        e.preventDefault();
        console.log('Select All - Not implemented yet');
      }
      
      // Ctrl/Cmd + D: 複製（将来的な実装用）
      if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
        e.preventDefault();
        console.log('Duplicate - Not implemented yet');
      }
      
      // Space: アニメーション再生/停止
      if (e.key === ' ') {
        e.preventDefault();
        const animations = store.getState().scene.animations;
        const isPlaying = store.getState().scene.isPlaying;
        
        if (animations.length > 0) {
          dispatch(setIsPlaying(!isPlaying));
        }
      }
      
      // Ctrl/Cmd + Shift + C: マテリアルをコピー
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'c') {
        e.preventDefault();
        if (editMode === 'object' && selectedObjectId) {
          dispatch(copyMaterial(selectedObjectId));
        }
      }
      
      // Ctrl/Cmd + Shift + V: マテリアルをペースト
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'v') {
        e.preventDefault();
        if (editMode === 'object' && selectedObjectId) {
          dispatch(pasteMaterial(selectedObjectId));
        }
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [dispatch, selectedObjectId, selectedBoneId, editMode]);
  
  return null;
}

// ショートカット一覧
export const KEYBOARD_SHORTCUTS = [
  { key: 'Ctrl+Z', action: 'Undo' },
  { key: 'Ctrl+Shift+Z / Ctrl+Y', action: 'Redo' },
  { key: 'Delete/Backspace', action: 'Delete selected' },
  { key: 'G', action: 'Move tool' },
  { key: 'R', action: 'Rotate tool' },
  { key: 'S', action: 'Scale tool' },
  { key: 'Tab', action: 'Toggle Object/Bone mode' },
  { key: 'H', action: 'Toggle bone visibility' },
  { key: 'Escape', action: 'Deselect' },
  { key: 'Space', action: 'Play/Pause animation' },
  { key: 'Ctrl+Shift+C', action: 'Copy material' },
  { key: 'Ctrl+Shift+V', action: 'Paste material' },
];