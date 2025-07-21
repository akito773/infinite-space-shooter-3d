import React from 'react';
import { useSelector } from 'react-redux';
import SceneObject from './SceneObject';

function Scene() {
  const objects = useSelector(state => state.scene.objects);
  
  // ルートオブジェクトのみを表示（親を持たないオブジェクト）
  const rootObjects = objects.filter(obj => !obj.parent);
  
  return (
    <>
      {rootObjects.map(object => (
        <SceneObject key={object.id} object={object} />
      ))}
    </>
  );
}

export default Scene;