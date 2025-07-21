import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { v4 as uuidv4 } from 'uuid';
import { addObject, addMultipleObjects, clearScene, setTransformMode } from '../store';
import { generatePlayerShip } from '../utils/shipGenerator';
import { exportSceneAsGLTF, createExportScene } from '../utils/exporter';

function Toolbar() {
  const dispatch = useDispatch();
  const transformMode = useSelector(state => state.scene.transformMode);
  const objects = useSelector(state => state.scene.objects);

  const createPrimitive = (type, args) => {
    const newObject = {
      id: uuidv4(),
      name: `${type}_${Date.now()}`,
      geometry: {
        type,
        args,
      },
      position: [0, 0, 0],
      rotation: [0, 0, 0],
      scale: [1, 1, 1],
      material: {
        color: '#cccccc',
        metalness: 0.5,
        roughness: 0.5,
      },
    };
    
    dispatch(addObject(newObject));
  };

  const createPlayerShip = () => {
    const confirmation = window.confirm('This will clear the current scene and create a player ship. Continue?');
    if (confirmation) {
      dispatch(clearScene());
      const shipObjects = generatePlayerShip();
      dispatch(addMultipleObjects(shipObjects));
    }
  };

  const handleExport = async () => {
    if (objects.length === 0) {
      alert('No objects to export!');
      return;
    }
    
    try {
      const exportScene = createExportScene(objects);
      const playerShip = objects.find(obj => obj.name === 'PlayerShip');
      const filename = playerShip ? 'player_ship_SF-01.glb' : 'custom_model.glb';
      
      await exportSceneAsGLTF(exportScene, filename);
    } catch (error) {
      alert('Export failed: ' + error.message);
    }
  };

  return (
    <div className="toolbar">
      <button
        className="tool-button"
        onClick={createPlayerShip}
        title="Generate Player Ship"
        style={{ backgroundColor: '#0066cc', fontSize: '11px' }}
      >
        Player<br/>Ship
      </button>
      
      <button
        className="tool-button"
        onClick={() => dispatch(clearScene())}
        title="Clear Scene"
        style={{ backgroundColor: '#cc0000' }}
      >
        Clear
      </button>
      
      <button
        className="tool-button"
        onClick={handleExport}
        title="Export as GLB"
        style={{ backgroundColor: '#00cc00', fontSize: '11px' }}
      >
        Export<br/>GLB
      </button>
      
      <div style={{ height: 20 }} />
      
      <button
        className="tool-button"
        onClick={() => createPrimitive('box', [1, 1, 1])}
        title="Add Box"
      >
        Box
      </button>
      
      <button
        className="tool-button"
        onClick={() => createPrimitive('sphere', [0.5, 16, 16])}
        title="Add Sphere"
      >
        Sphere
      </button>
      
      <button
        className="tool-button"
        onClick={() => createPrimitive('cylinder', [0.5, 0.5, 1, 16])}
        title="Add Cylinder"
      >
        Cylinder
      </button>
      
      <button
        className="tool-button"
        onClick={() => createPrimitive('cone', [0.5, 1, 16])}
        title="Add Cone"
      >
        Cone
      </button>
      
      <button
        className="tool-button"
        onClick={() => createPrimitive('torus', [0.5, 0.2, 8, 16])}
        title="Add Torus"
      >
        Torus
      </button>
      
      <div style={{ height: 20 }} />
      
      <button
        className={`tool-button ${transformMode === 'translate' ? 'active' : ''}`}
        onClick={() => dispatch(setTransformMode('translate'))}
        title="Move Tool"
      >
        Move
      </button>
      
      <button
        className={`tool-button ${transformMode === 'rotate' ? 'active' : ''}`}
        onClick={() => dispatch(setTransformMode('rotate'))}
        title="Rotate Tool"
      >
        Rotate
      </button>
      
      <button
        className={`tool-button ${transformMode === 'scale' ? 'active' : ''}`}
        onClick={() => dispatch(setTransformMode('scale'))}
        title="Scale Tool"
      >
        Scale
      </button>
    </div>
  );
}

export default Toolbar;