import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { v4 as uuidv4 } from 'uuid';
import { addObject, addMultipleObjects, clearScene, setTransformMode } from '../store';
import { generatePlayerShip } from '../utils/shipGenerator';
import { generateAdvancedPlayerShip, generateHumanoidRobot } from '../utils/shipGeneratorAdvanced';
import { generateHuman, BODY_TYPES, HAIR_TYPES } from '../utils/humanGenerator';
import { exportSceneAsGLTF, createExportScene } from '../utils/exporter';
import { generateRobotSkeleton } from '../utils/boneSystem';
import { generateHumanSkeleton } from '../utils/humanGenerator';
import { generateAutoBindings, normalizeWeights } from '../utils/boneMeshMapping';
import { generateWalkAnimation, generateIdleAnimation } from '../utils/animationSystem';
import { 
  addMultipleBones, clearBones, setEditMode, setShowBones, 
  addMultipleBindings, clearBindings,
  addAnimation, setCurrentAnimation, setIsPlaying, clearAnimations
} from '../store';

function Toolbar() {
  const dispatch = useDispatch();
  const transformMode = useSelector(state => state.scene.transformMode);
  const objects = useSelector(state => state.scene.objects);
  const editMode = useSelector(state => state.scene.editMode);
  const showBones = useSelector(state => state.scene.showBones);
  const bones = useSelector(state => state.scene.bones);
  const animations = useSelector(state => state.scene.animations);
  const isPlaying = useSelector(state => state.scene.isPlaying);

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

  const createAdvancedShip = () => {
    const confirmation = window.confirm('This will clear the current scene and create an advanced player ship. Continue?');
    if (confirmation) {
      dispatch(clearScene());
      const shipObjects = generateAdvancedPlayerShip();
      dispatch(addMultipleObjects(shipObjects));
    }
  };

  const createRobot = () => {
    const confirmation = window.confirm('This will clear the current scene and create a humanoid robot. Continue?');
    if (confirmation) {
      dispatch(clearScene());
      dispatch(clearBones());
      const robotObjects = generateHumanoidRobot();
      dispatch(addMultipleObjects(robotObjects));
    }
  };
  
  const createHuman = () => {
    const confirmation = window.confirm('This will clear the current scene and create a human character. Continue?');
    if (confirmation) {
      dispatch(clearScene());
      dispatch(clearBones());
      
      // 簡単な設定ダイアログ
      const bodyType = prompt('Body type? (standard/athletic/slim/strong)', 'standard') || 'standard';
      const hairType = prompt('Hair type? (short/long/ponytail/spiky/bob/none)', 'short') || 'short';
      
      const humanObjects = generateHuman({
        bodyType: BODY_TYPES[bodyType] ? bodyType : 'standard',
        hairType: HAIR_TYPES[hairType] || 'short',
      });
      
      dispatch(addMultipleObjects(humanObjects));
    }
  };

  const createRobotBones = () => {
    const hasRobot = objects.some(obj => obj.name === 'Humanoid_Robot');
    const hasHuman = objects.some(obj => obj.name === 'Head' || obj.name === 'Torso');
    
    if (!hasRobot && !hasHuman) {
      alert('Please generate a robot or human first!');
      return;
    }
    
    const modelType = hasHuman ? 'human' : 'robot';
    const confirmation = window.confirm(`This will add a skeleton to the ${modelType}. Continue?`);
    if (confirmation) {
      dispatch(clearBones());
      dispatch(clearBindings());
      const newBones = hasHuman ? generateHumanSkeleton() : generateRobotSkeleton();
      dispatch(addMultipleBones(newBones));
      dispatch(setEditMode('bone'));
    }
  };

  const bindMeshesToBones = () => {
    if (bones.length === 0) {
      alert('Please add bones first!');
      return;
    }
    
    if (objects.length === 0) {
      alert('No objects to bind!');
      return;
    }
    
    const confirmation = window.confirm('This will automatically bind robot parts to bones. Continue?');
    if (confirmation) {
      dispatch(clearBindings());
      const bindings = generateAutoBindings(objects, bones);
      const normalizedBindings = normalizeWeights(bindings);
      dispatch(addMultipleBindings(normalizedBindings));
      alert(`Created ${normalizedBindings.length} bindings!`);
    }
  };

  const createAnimations = () => {
    if (bones.length === 0) {
      alert('Please add bones first!');
      return;
    }
    
    const confirmation = window.confirm('This will create walk and idle animations. Continue?');
    if (confirmation) {
      dispatch(clearAnimations());
      
      const walkAnim = generateWalkAnimation(bones);
      const idleAnim = generateIdleAnimation(bones);
      
      dispatch(addAnimation(walkAnim));
      dispatch(addAnimation(idleAnim));
      dispatch(setCurrentAnimation(walkAnim.id));
      
      alert('Created Walk and Idle animations!');
    }
  };

  const togglePlayAnimation = () => {
    if (animations.length === 0) {
      alert('No animations available!');
      return;
    }
    
    dispatch(setIsPlaying(!isPlaying));
  };

  const handleExport = async () => {
    if (objects.length === 0) {
      alert('No objects to export!');
      return;
    }
    
    try {
      const exportScene = createExportScene(objects);
      
      // Determine filename based on model type
      let filename = 'custom_model.glb';
      if (objects.find(obj => obj.name === 'PlayerShip')) {
        filename = 'player_ship_SF-01_basic.glb';
      } else if (objects.find(obj => obj.name === 'PlayerShip_Advanced')) {
        filename = 'player_ship_SF-01_advanced.glb';
      } else if (objects.find(obj => obj.name === 'Humanoid_Robot')) {
        filename = 'humanoid_robot_MR-X1.glb';
      } else if (objects.find(obj => obj.name === 'Torso' || obj.name === 'Head')) {
        filename = 'human_character.glb';
      }
      
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
        title="Generate Basic Player Ship"
        style={{ backgroundColor: '#0066cc', fontSize: '11px' }}
      >
        Basic<br/>Ship
      </button>
      
      <button
        className="tool-button"
        onClick={createAdvancedShip}
        title="Generate Advanced Player Ship"
        style={{ backgroundColor: '#0088ff', fontSize: '10px' }}
      >
        Advanced<br/>Ship
      </button>
      
      <button
        className="tool-button"
        onClick={createRobot}
        title="Generate Humanoid Robot"
        style={{ backgroundColor: '#ff6600', fontSize: '11px' }}
      >
        Robot
      </button>
      
      <button
        className="tool-button"
        onClick={createHuman}
        title="Generate Human Character"
        style={{ backgroundColor: '#ff0099', fontSize: '11px' }}
      >
        Human
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
        className={`tool-button ${editMode === 'object' ? 'active' : ''}`}
        onClick={() => dispatch(setEditMode('object'))}
        title="Object Edit Mode"
        style={{ fontSize: '11px' }}
      >
        Object<br/>Mode
      </button>
      
      <button
        className={`tool-button ${editMode === 'bone' ? 'active' : ''}`}
        onClick={() => dispatch(setEditMode('bone'))}
        title="Bone Edit Mode"
        style={{ fontSize: '11px' }}
      >
        Bone<br/>Mode
      </button>
      
      <div style={{ height: 10 }} />
      
      <button
        className="tool-button"
        onClick={createRobotBones}
        title="Add Robot Skeleton"
        style={{ backgroundColor: '#9900ff', fontSize: '10px' }}
      >
        Add<br/>Bones
      </button>
      
      <button
        className={`tool-button ${showBones ? 'active' : ''}`}
        onClick={() => dispatch(setShowBones(!showBones))}
        title="Toggle Bone Visibility"
        style={{ fontSize: '11px' }}
      >
        Show<br/>Bones
      </button>
      
      <button
        className="tool-button"
        onClick={bindMeshesToBones}
        title="Bind Meshes to Bones"
        style={{ backgroundColor: '#ff00ff', fontSize: '10px' }}
      >
        Bind<br/>Mesh
      </button>
      
      <div style={{ height: 10 }} />
      
      <button
        className="tool-button"
        onClick={createAnimations}
        title="Create Animations"
        style={{ backgroundColor: '#00cc99', fontSize: '10px' }}
      >
        Create<br/>Anim
      </button>
      
      <button
        className={`tool-button ${isPlaying ? 'active' : ''}`}
        onClick={togglePlayAnimation}
        title="Play/Pause Animation"
        style={{ backgroundColor: isPlaying ? '#ff6600' : '#009966', fontSize: '11px' }}
      >
        {isPlaying ? 'Pause' : 'Play'}
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