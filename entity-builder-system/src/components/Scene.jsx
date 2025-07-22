import React from 'react';
import { useSelector } from 'react-redux';
import SceneObject from './SceneObject';
import AnimatedObject from './AnimatedObject';
import BoneScene from './BoneScene';
import BindingVisualizer from './BindingVisualizer';
import AnimationController from './AnimationController';

function Scene() {
  const objects = useSelector(state => state.scene.objects);
  const bindings = useSelector(state => state.scene.bindings);
  
  // ルートオブジェクトのみを表示（親を持たないオブジェクト）
  const rootObjects = objects.filter(obj => !obj.parent);
  
  // バインディングがあるかどうかでコンポーネントを切り替え
  const hasBindings = bindings.length > 0;
  
  return (
    <>
      {rootObjects.map(object => (
        hasBindings ? (
          <AnimatedObject key={object.id} object={object} />
        ) : (
          <SceneObject key={object.id} object={object} />
        )
      ))}
      <BoneScene />
      <BindingVisualizer />
      <AnimationController />
    </>
  );
}

export default Scene;