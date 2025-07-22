import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { 
  updateObject, 
  deleteObject, 
  updateBone, 
  deleteBone, 
  copyMaterial, 
  pasteMaterial,
  addFavoriteProfile,
  removeFavoriteProfile,
  applyMaterialToMultiple,
  generateRandomMaterial
} from '../store';
import * as THREE from 'three';
import { validateShipSize } from '../utils/shipGenerator';
import { MATERIAL_PRESETS, getPresetsByCategory } from '../utils/materialPresets';
import MaterialPreview from './MaterialPreview';

function PropertiesPanel() {
  const dispatch = useDispatch();
  const selectedObjectId = useSelector(state => state.scene.selectedObjectId);
  const objects = useSelector(state => state.scene.objects);
  const selectedObject = objects.find(obj => obj.id === selectedObjectId);
  
  const selectedBoneId = useSelector(state => state.scene.selectedBoneId);
  const bones = useSelector(state => state.scene.bones);
  const selectedBone = bones.find(b => b.id === selectedBoneId);
  const editMode = useSelector(state => state.scene.editMode);
  const bindings = useSelector(state => state.scene.bindings);
  const materialClipboard = useSelector(state => state.scene.materialClipboard);
  const favoriteProfiles = useSelector(state => state.scene.favoriteProfiles);
  const recentProfiles = useSelector(state => state.scene.recentProfiles);
  const selectedObjectIds = useSelector(state => state.scene.selectedObjectIds);
  
  const [promptText, setPromptText] = useState('');

  useEffect(() => {
    if (selectedObject) {
      generatePrompt();
    }
  }, [selectedObject]);

  const generatePrompt = () => {
    if (!objects.length) return;
    
    // Check model type
    const isPlayerShip = objects.some(obj => obj.name === 'PlayerShip');
    const isAdvancedShip = objects.some(obj => obj.name === 'PlayerShip_Advanced');
    const isRobot = objects.some(obj => obj.name === 'Humanoid_Robot');
    
    if (isAdvancedShip) {
      // Advanced ship specific prompt
      const prompt = `Ultra-detailed futuristic space fighter texture, high-tech military spacecraft finish,
metallic grey titanium hull with brushed metal texture, neon cyan accent lines along edges,
detailed panel separation with visible rivets and seams, heat-resistant ceramic coating on engine areas,
transparent cockpit glass with holographic HUD projections and internal dashboard details,
glowing cyan plasma engine cores with heat distortion effects, 
twin main cannon barrels with carbon fiber wrapping, missile pod doors with warning labels,
air intake grilles with internal turbine details, antenna with red warning lights,
squadron marking "SF-01 ADVANCED" in futuristic military font, unit patches and kill marks,
battle damage with exposed internal components, oil stains near maintenance panels,
8K PBR texture set with extreme detail, photorealistic materials for AAA game asset`;
      
      setPromptText(prompt);
      return;
    }
    
    if (isRobot) {
      // Robot specific prompt
      const prompt = `Futuristic humanoid combat robot texture, military mecha design,
gunmetal grey armor plating with panel lines and mechanical details,
glowing cyan energy core in chest cavity with pulsing light effect,
joint areas showing hydraulic pistons and servo motors,
head visor with tactical HUD display and targeting reticle,
shoulder armor with unit designation "MR-X1" and hazard stripes,
weathered metal finish with scratches and battle scars,
exposed mechanical components at joints with oil stains,
thruster nozzles with heat-blackened metal and burn marks,
feet with anti-slip tread patterns and magnetic locks,
warning labels and maintenance access panels throughout,
8K PBR textures with metallic, roughness, normal, and emission maps,
realistic mecha style suitable for action game or anime-inspired project`;
      
      setPromptText(prompt);
      return;
    }
    
    if (isPlayerShip) {
      // Basic player ship prompt
      const prompt = `Futuristic space fighter texture map, metallic grey base color with neon blue accents, 
cockpit with holographic HUD display, glowing cyan engine exhausts, 
panel lines and heat-resistant plating, warning decals on wing tips, 
side marking "SF-01" in military stencil font, weathered battle damage, 
carbon fiber details on control surfaces, energy weapon hardpoints with power conduits, 
4K PBR texture set (albedo, normal, metallic, roughness, emission maps), 
photorealistic sci-fi military spacecraft finish, suitable for space combat game asset`;
      
      setPromptText(prompt);
      return;
    }
    
    // Generic prompt for other models
    const partTypes = objects.map(obj => obj.geometry.type);
    const boundingBox = calculateSceneBounds();
    const size = boundingBox.max.sub(boundingBox.min);
    
    let prompt = "Futuristic spacecraft texture, ";
    
    if (partTypes.includes('sphere') && partTypes.includes('cylinder')) {
      prompt += "sleek aerodynamic design, ";
    } else if (partTypes.includes('box')) {
      prompt += "angular military design, ";
    }
    
    prompt += "metallic hull with ";
    
    if (size.length() > 5) {
      prompt += "large panel sections, visible engine exhaust ports, weapon mounting points, ";
    } else {
      prompt += "compact fighter design, streamlined panels, ";
    }
    
    prompt += "sci-fi details, glowing energy lines, battle-worn edges, ";
    prompt += "4K texture, PBR materials, highly detailed";
    
    setPromptText(prompt);
  };

  const calculateSceneBounds = () => {
    const box = new THREE.Box3();
    
    objects.forEach(obj => {
      const tempBox = new THREE.Box3();
      const min = new THREE.Vector3(
        obj.position[0] - obj.scale[0]/2,
        obj.position[1] - obj.scale[1]/2,
        obj.position[2] - obj.scale[2]/2
      );
      const max = new THREE.Vector3(
        obj.position[0] + obj.scale[0]/2,
        obj.position[1] + obj.scale[1]/2,
        obj.position[2] + obj.scale[2]/2
      );
      tempBox.set(min, max);
      box.union(tempBox);
    });
    
    return box;
  };

  const handleInputChange = (property, value, index = null) => {
    if (!selectedObject) return;
    
    let updates = {};
    
    if (index !== null) {
      const newArray = [...selectedObject[property]];
      newArray[index] = parseFloat(value) || 0;
      updates[property] = newArray;
    } else if (property.includes('.')) {
      const [parent, child] = property.split('.');
      updates[parent] = {
        ...selectedObject[parent],
        [child]: value
      };
    } else {
      updates[property] = value;
    }
    
    dispatch(updateObject({
      id: selectedObject.id,
      updates
    }));
  };

  const handleDelete = () => {
    if (selectedObject) {
      dispatch(deleteObject(selectedObject.id));
    }
  };

  const handleBoneInputChange = (property, value, index = null) => {
    if (!selectedBone) return;
    
    let updates = {};
    
    if (index !== null) {
      const newArray = [...selectedBone[property]];
      newArray[index] = parseFloat(value) || 0;
      updates[property] = newArray;
    } else {
      updates[property] = value;
    }
    
    dispatch(updateBone({
      id: selectedBone.id,
      updates
    }));
  };

  const handleBoneDelete = () => {
    if (selectedBone) {
      dispatch(deleteBone(selectedBone.id));
    }
  };

  // ボーン編集モードの場合
  if (editMode === 'bone' && selectedBone) {
    return (
      <div className="properties-panel">
        <div className="property-group">
          <h3>Bone: {selectedBone.name}</h3>
          
          <div className="property-row">
            <span className="property-label">Name:</span>
            <input
              className="property-input"
              type="text"
              value={selectedBone.name}
              onChange={(e) => handleBoneInputChange('name', e.target.value)}
            />
          </div>
          
          <div className="property-row">
            <span className="property-label">Length:</span>
            <input
              className="property-input"
              type="number"
              step="0.1"
              value={selectedBone.length}
              onChange={(e) => handleBoneInputChange('length', parseFloat(e.target.value))}
            />
          </div>
        </div>

        <div className="property-group">
          <h3>Transform</h3>
          
          {['position', 'rotation'].map(prop => (
            <div key={prop}>
              <div className="property-row">
                <span className="property-label">{prop}:</span>
              </div>
              <div className="property-row">
                {['X', 'Y', 'Z'].map((axis, index) => (
                  <input
                    key={axis}
                    className="property-input"
                    type="number"
                    step={prop === 'rotation' ? '0.1' : '0.01'}
                    value={selectedBone[prop][index].toFixed(2)}
                    onChange={(e) => handleBoneInputChange(prop, e.target.value, index)}
                    placeholder={axis}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="property-group">
          <h3>Bone Info</h3>
          <div className="size-info">
            <div>Total Bones: {bones.length}</div>
            <div>Parent: {selectedBone.parent ? bones.find(b => b.id === selectedBone.parent)?.name : 'None'}</div>
            <div>Children: {selectedBone.children.length}</div>
          </div>
        </div>

        <div style={{ marginTop: 20 }}>
          <button className="button" onClick={handleBoneDelete}>
            Delete Bone
          </button>
        </div>
      </div>
    );
  }

  // ボーン編集モードだが選択されていない場合
  if (editMode === 'bone') {
    return (
      <div className="properties-panel">
        <h3>Bone Properties</h3>
        <p style={{ color: '#666', fontSize: '13px' }}>
          Select a bone to edit properties
        </p>
        
        <div className="property-group">
          <h3>Skeleton Info</h3>
          <div className="size-info">
            <div>Total Bones: {bones.length}</div>
          </div>
        </div>
        
        {bindings && bindings.length > 0 && (
          <div className="property-group">
            <h3>Binding Info</h3>
            <div className="size-info">
              <div>Total Bindings: {bindings.length}</div>
              <div style={{ fontSize: '11px', marginTop: '5px' }}>
                Purple lines show mesh-bone connections
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (!selectedObject) {
    return (
      <div className="properties-panel">
        <h3>Properties</h3>
        <p style={{ color: '#666', fontSize: '13px' }}>
          Select an object to view properties
        </p>
        
        <div className="prompt-section">
          <h3>Texture Prompt</h3>
          <div className="prompt-text">
            Add objects to generate texture prompt
          </div>
        </div>
      </div>
    );
  }

  const bounds = calculateSceneBounds();
  const size = bounds.max.sub(bounds.min);
  
  // 戦闘機のサイズ検証
  const shipValidation = objects.find(obj => obj.name === 'PlayerShip') ? 
    validateShipSize(objects) : null;

  return (
    <div className="properties-panel">
      {shipValidation && (
        <div className="property-group" style={{ 
          backgroundColor: shipValidation.valid ? '#003300' : '#330000',
          padding: '10px',
          borderRadius: '4px',
          marginBottom: '10px'
        }}>
          <h3>Ship Size Validation</h3>
          <div style={{ fontSize: '12px', color: shipValidation.valid ? '#00ff00' : '#ff6666' }}>
            {shipValidation.message}
          </div>
          <div style={{ fontSize: '11px', marginTop: '5px' }}>
            Status: {shipValidation.valid ? '✓ Valid' : '⚠ Exceeds limit'}
          </div>
        </div>
      )}
      
      <div className="property-group">
        <h3>Object: {selectedObject.name}</h3>
        
        <div className="property-row">
          <span className="property-label">Name:</span>
          <input
            className="property-input"
            type="text"
            value={selectedObject.name}
            onChange={(e) => handleInputChange('name', e.target.value)}
          />
        </div>
      </div>

      <div className="property-group">
        <h3>Transform</h3>
        
        {['position', 'rotation', 'scale'].map(prop => (
          <div key={prop}>
            <div className="property-row">
              <span className="property-label">{prop}:</span>
            </div>
            <div className="property-row">
              {['X', 'Y', 'Z'].map((axis, index) => (
                <input
                  key={axis}
                  className="property-input"
                  type="number"
                  step={prop === 'rotation' ? '0.1' : '0.01'}
                  value={selectedObject[prop][index].toFixed(2)}
                  onChange={(e) => handleInputChange(prop, e.target.value, index)}
                  placeholder={axis}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="property-group">
        <h3>Material</h3>
        
        <MaterialPreview material={selectedObject.material} />
        
        <div className="property-row">
          <span className="property-label">Preset:</span>
          <select 
            className="property-input"
            onChange={(e) => {
              if (e.target.value && MATERIAL_PRESETS[e.target.value]) {
                const preset = MATERIAL_PRESETS[e.target.value];
                const updates = {
                  material: {
                    ...selectedObject.material,
                    ...preset.properties
                  }
                };
                dispatch(updateObject({
                  id: selectedObject.id,
                  updates
                }));
              }
            }}
          >
            <option value="">-- Select Preset --</option>
            {Object.entries(getPresetsByCategory()).map(([category, presets]) => (
              <optgroup key={category} label={category}>
                {presets.map(preset => (
                  <option key={preset.key} value={preset.key}>
                    {preset.name}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>
        
        <div className="property-row">
          <span className="property-label">Color:</span>
          <input
            className="property-input"
            type="color"
            value={selectedObject.material.color}
            onChange={(e) => handleInputChange('material.color', e.target.value)}
          />
          <span style={{ marginLeft: '10px', fontSize: '12px', color: '#888' }}>
            {selectedObject.material.color}
          </span>
        </div>
        
        <div className="property-row">
          <span className="property-label">Metalness:</span>
          <input
            className="property-input"
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={selectedObject.material.metalness || 0.5}
            onChange={(e) => handleInputChange('material.metalness', parseFloat(e.target.value))}
          />
          <span style={{ marginLeft: '10px', fontSize: '12px', color: '#888' }}>
            {(selectedObject.material.metalness || 0.5).toFixed(2)}
          </span>
        </div>
        
        <div className="property-row">
          <span className="property-label">Roughness:</span>
          <input
            className="property-input"
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={selectedObject.material.roughness || 0.5}
            onChange={(e) => handleInputChange('material.roughness', parseFloat(e.target.value))}
          />
          <span style={{ marginLeft: '10px', fontSize: '12px', color: '#888' }}>
            {(selectedObject.material.roughness || 0.5).toFixed(2)}
          </span>
        </div>
        
        <div className="property-row">
          <span className="property-label">Emissive:</span>
          <input
            className="property-input"
            type="color"
            value={selectedObject.material.emissive || '#000000'}
            onChange={(e) => handleInputChange('material.emissive', e.target.value)}
          />
          <input
            className="property-input"
            type="range"
            min="0"
            max="1"
            step="0.01"
            style={{ width: '80px', marginLeft: '10px' }}
            value={selectedObject.material.emissiveIntensity || 0}
            onChange={(e) => handleInputChange('material.emissiveIntensity', parseFloat(e.target.value))}
          />
        </div>
        
        {(selectedObject.material.transparent) && (
          <>
            <div className="property-row">
              <span className="property-label">Transparent:</span>
              <input
                type="checkbox"
                checked={selectedObject.material.transparent || false}
                onChange={(e) => handleInputChange('material.transparent', e.target.checked)}
              />
            </div>
            
            <div className="property-row">
              <span className="property-label">Opacity:</span>
              <input
                className="property-input"
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={selectedObject.material.opacity || 1}
                onChange={(e) => handleInputChange('material.opacity', parseFloat(e.target.value))}
              />
              <span style={{ marginLeft: '10px', fontSize: '12px', color: '#888' }}>
                {(selectedObject.material.opacity || 1).toFixed(2)}
              </span>
            </div>
          </>
        )}
        
        {/* お気に入りマテリアル */}
        {favoriteProfiles.length > 0 && (
          <div className="property-row">
            <span className="property-label">Favorites:</span>
            <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap', flex: 1 }}>
              {favoriteProfiles.map(profile => (
                <div 
                  key={profile.id}
                  style={{
                    width: '30px',
                    height: '30px',
                    backgroundColor: profile.color,
                    border: '2px solid #555',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    position: 'relative'
                  }}
                  onClick={() => {
                    dispatch(updateObject({
                      id: selectedObject.id,
                      updates: { material: { ...profile } }
                    }));
                  }}
                  title={profile.name}
                >
                  <button
                    style={{
                      position: 'absolute',
                      top: '-5px',
                      right: '-5px',
                      width: '16px',
                      height: '16px',
                      background: '#ff0000',
                      border: 'none',
                      borderRadius: '50%',
                      color: 'white',
                      fontSize: '10px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      dispatch(removeFavoriteProfile(profile.id));
                    }}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* 最近使用したマテリアル */}
        {recentProfiles.length > 0 && (
          <div className="property-row">
            <span className="property-label">Recent:</span>
            <div style={{ display: 'flex', gap: '5px', flex: 1 }}>
              {recentProfiles.map((profile, index) => (
                <div 
                  key={profile.id}
                  style={{
                    width: '25px',
                    height: '25px',
                    backgroundColor: profile.color,
                    border: '1px solid #555',
                    borderRadius: '3px',
                    cursor: 'pointer'
                  }}
                  onClick={() => {
                    dispatch(updateObject({
                      id: selectedObject.id,
                      updates: { material: { ...profile } }
                    }));
                  }}
                  title={`Recent ${index + 1}`}
                />
              ))}
            </div>
          </div>
        )}
        
        <div className="property-row" style={{ marginTop: '10px', gap: '5px', flexWrap: 'wrap' }}>
          <button 
            className="button" 
            style={{ fontSize: '12px', padding: '4px 8px' }}
            onClick={() => {
              const updates = {
                material: {
                  transparent: !selectedObject.material.transparent,
                  opacity: selectedObject.material.transparent ? 1 : 0.5
                }
              };
              dispatch(updateObject({
                id: selectedObject.id,
                updates
              }));
            }}
          >
            Toggle Transparency
          </button>
          
          <button 
            className="button" 
            style={{ fontSize: '12px', padding: '4px 8px' }}
            onClick={() => dispatch(copyMaterial(selectedObject.id))}
          >
            Copy
          </button>
          
          <button 
            className="button" 
            style={{ fontSize: '12px', padding: '4px 8px' }}
            onClick={() => dispatch(pasteMaterial(selectedObject.id))}
            disabled={!materialClipboard}
          >
            Paste
          </button>
          
          <button 
            className="button" 
            style={{ fontSize: '12px', padding: '4px 8px' }}
            onClick={() => {
              const name = prompt('お気に入りの名前を入力:');
              if (name) {
                dispatch(addFavoriteProfile({ ...selectedObject.material, name }));
              }
            }}
          >
            ★ Add Favorite
          </button>
          
          <button 
            className="button" 
            style={{ fontSize: '12px', padding: '4px 8px' }}
            onClick={() => dispatch(generateRandomMaterial(selectedObject.id))}
          >
            🎲 Random
          </button>
          
          {selectedObjectIds.length > 0 && (
            <button 
              className="button" 
              style={{ fontSize: '12px', padding: '4px 8px', backgroundColor: '#cc6600' }}
              onClick={() => {
                dispatch(applyMaterialToMultiple({
                  material: selectedObject.material,
                  objectIds: [selectedObject.id, ...selectedObjectIds]
                }));
              }}
            >
              Apply to {selectedObjectIds.length + 1} objects
            </button>
          )}
        </div>
      </div>

      <div className="property-group">
        <h3>Model Info</h3>
        <div className="size-info">
          <div>Total Objects: {objects.length}</div>
          <div>Model Size:</div>
          <div>X: {size.x.toFixed(2)} units</div>
          <div>Y: {size.y.toFixed(2)} units</div>
          <div>Z: {size.z.toFixed(2)} units</div>
          <div>Diagonal: {size.length().toFixed(2)} units</div>
        </div>
      </div>

      <div className="prompt-section">
        <h3>AI Texture Prompt</h3>
        <div className="prompt-text">{promptText}</div>
        <button 
          className="button" 
          style={{ marginTop: 10 }}
          onClick={() => navigator.clipboard.writeText(promptText)}
        >
          Copy Prompt
        </button>
      </div>

      <div style={{ marginTop: 20 }}>
        <button className="button" onClick={handleDelete}>
          Delete Object
        </button>
      </div>
    </div>
  );
}

export default PropertiesPanel;