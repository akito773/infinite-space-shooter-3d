import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { updateObject, deleteObject } from '../store';
import * as THREE from 'three';
import { validateShipSize } from '../utils/shipGenerator';

function PropertiesPanel() {
  const dispatch = useDispatch();
  const selectedObjectId = useSelector(state => state.scene.selectedObjectId);
  const objects = useSelector(state => state.scene.objects);
  const selectedObject = objects.find(obj => obj.id === selectedObjectId);
  
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
        
        <div className="property-row">
          <span className="property-label">Color:</span>
          <input
            className="property-input"
            type="color"
            value={selectedObject.material.color}
            onChange={(e) => handleInputChange('material.color', e.target.value)}
          />
        </div>
        
        <div className="property-row">
          <span className="property-label">Metalness:</span>
          <input
            className="property-input"
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={selectedObject.material.metalness}
            onChange={(e) => handleInputChange('material.metalness', parseFloat(e.target.value))}
          />
        </div>
        
        <div className="property-row">
          <span className="property-label">Roughness:</span>
          <input
            className="property-input"
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={selectedObject.material.roughness}
            onChange={(e) => handleInputChange('material.roughness', parseFloat(e.target.value))}
          />
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